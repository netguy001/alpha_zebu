"""
Market Data Worker — Background price streaming.

Reads prices from any available ZebuProvider session and emits
PRICE_UPDATED events via the EventBus. Downstream consumers
(WebSocket manager, Order Worker, ZeroLoss) subscribe to these events.

Per-user architecture:
    - No global provider. Worker uses broker_session_manager.get_any_session().
    - If no sessions exist, the worker idles (no data to stream).
    - When a user connects their broker, a session appears and the
      worker resumes streaming.
"""

import asyncio
import logging

from core.event_bus import event_bus, Event, EventType
from engines.market_session import market_session, MarketState

logger = logging.getLogger(__name__)


class MarketDataWorker:
    """
    Fetches live prices from any available broker session and emits events.

    Interval adapts to market state:
    - Open:   3 seconds between sweeps
    - Closed: 60 seconds (reduced frequency)
    """

    ACTIVE_INTERVAL = 3  # seconds between full sweeps
    IDLE_INTERVAL = 60  # seconds when market closed
    NO_SESSION_INTERVAL = 10  # seconds when no broker sessions
    SYMBOL_DELAY = 0.3  # seconds between individual symbol fetches

    def __init__(self):
        self._running = False
        self._subscribed_symbols: set[str] = set()
        self._stats = {"sweeps": 0, "emits": 0, "no_session_waits": 0}

    def add_symbol(self, symbol: str) -> None:
        """Add a symbol to the streaming set."""
        self._subscribed_symbols.add(symbol)

    def remove_symbol(self, symbol: str) -> None:
        """Remove a symbol from the streaming set."""
        self._subscribed_symbols.discard(symbol)

    def get_stats(self) -> dict:
        """Return worker stats."""
        return {
            **self._stats,
            "symbols": list(self._subscribed_symbols),
            "symbol_count": len(self._subscribed_symbols),
        }

    async def run(self) -> None:
        """Main loop — started via asyncio.create_task in lifespan."""
        self._running = True
        logger.info("Market Data Worker started (per-user architecture)")

        # Auto-subscribe popular symbols
        from services.market_data import POPULAR_INDIAN_STOCKS, INDIAN_INDICES

        for s in POPULAR_INDIAN_STOCKS:
            self._subscribed_symbols.add(s["symbol"])
        for i in INDIAN_INDICES:
            self._subscribed_symbols.add(i["symbol"])

        while self._running:
            try:
                # Get any available provider session
                from services.broker_session import broker_session_manager

                provider = broker_session_manager.get_any_session()

                if provider is None:
                    # No broker sessions — idle
                    self._stats["no_session_waits"] += 1
                    if self._stats["no_session_waits"] % 30 == 1:
                        logger.debug("MarketDataWorker: No broker sessions, waiting...")
                    await asyncio.sleep(self.NO_SESSION_INTERVAL)
                    continue

                # Sweep all subscribed symbols
                symbols = list(self._subscribed_symbols)
                actual_state = market_session.get_current_state()
                market_closed = actual_state in (
                    MarketState.WEEKEND,
                    MarketState.HOLIDAY,
                    MarketState.CLOSED,
                )

                if symbols:
                    for symbol in symbols:
                        if not self._running:
                            break

                        quote = await provider.get_quote(symbol)
                        if quote:
                            # When market is actually closed, Zebu REST
                            # returns stale/incorrect lp values.  Use
                            # prev_close as the display price instead
                            # and zero out intraday change.
                            if market_closed:
                                prev_close = quote.get("prev_close") or quote.get(
                                    "close"
                                )
                                if prev_close and prev_close > 0:
                                    quote["price"] = prev_close
                                    quote["change"] = 0
                                    quote["change_percent"] = 0
                                quote["market_status"] = actual_state.value

                            self._stats["emits"] += 1
                            await event_bus.emit(
                                Event(
                                    type=EventType.PRICE_UPDATED,
                                    data={
                                        "symbol": symbol,
                                        "quote": quote,
                                    },
                                    source="market_data_worker",
                                )
                            )

                        await asyncio.sleep(self.SYMBOL_DELAY)

                self._stats["sweeps"] += 1

                # Use actual market state for poll interval (ignore
                # simulation_mode — no need to hammer the API on weekends)
                if actual_state in (
                    MarketState.OPEN,
                    MarketState.PRE_MARKET,
                    MarketState.CLOSING,
                    MarketState.AFTER_MARKET,
                ):
                    await asyncio.sleep(self.ACTIVE_INTERVAL)
                else:
                    await asyncio.sleep(self.IDLE_INTERVAL)

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Market Data Worker error: {e}", exc_info=True)
                await asyncio.sleep(5)

        logger.info("Market Data Worker stopped")

    async def stop(self) -> None:
        """Gracefully stop the worker."""
        self._running = False


# ── Singleton ──────────────────────────────────────────────────────
market_data_worker = MarketDataWorker()
