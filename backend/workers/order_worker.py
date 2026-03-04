"""
Order Execution Worker — Background LIMIT/STOP_LOSS order evaluator.

Periodically scans ALL open orders across all users and evaluates them
against current market prices. Fills orders that meet their conditions
and emits ORDER_FILLED events.

This worker solves the critical gap: check_pending_orders() in
trading_engine.py exists but is never called.
"""

import asyncio
import logging
from datetime import datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from core.event_bus import event_bus, Event, EventType
from engines.market_session import market_session
from database.connection import async_session_factory
from models.order import Order
from services import market_data

logger = logging.getLogger(__name__)

# Orders older than this are expired automatically
ORDER_EXPIRY_DAYS = 7


class OrderExecutionWorker:
    """
    Continuously evaluates OPEN orders against live prices.

    Design:
    - Sweeps ALL users' open orders in a single pass (not per-user).
    - Each order is evaluated independently with its own error handling.
    - Uses its own DB session (not FastAPI's dependency injection).
    """

    EVAL_INTERVAL = 5  # seconds between sweeps

    def __init__(self):
        self._running = False
        self._stats = {"sweeps": 0, "fills": 0, "expired": 0, "errors": 0}

    async def run(self) -> None:
        """Main loop — started via asyncio.create_task in lifespan."""
        self._running = True
        logger.info("Order Execution Worker started")

        while self._running:
            try:
                # Only evaluate during trading hours
                if not market_session.is_trading_hours():
                    await asyncio.sleep(30)
                    continue

                await self._sweep()
                self._stats["sweeps"] += 1
                await asyncio.sleep(self.EVAL_INTERVAL)

            except asyncio.CancelledError:
                break
            except Exception as e:
                self._stats["errors"] += 1
                logger.error(f"Order Execution Worker error: {e}", exc_info=True)
                await asyncio.sleep(10)

        logger.info("Order Execution Worker stopped")

    async def _sweep(self) -> None:
        """Evaluate all open orders across all users."""
        async with async_session_factory() as db:
            try:
                result = await db.execute(select(Order).where(Order.status == "OPEN"))
                open_orders = result.scalars().all()

                if not open_orders:
                    return

                logger.debug(f"Evaluating {len(open_orders)} open orders")
                expiry_cutoff = datetime.utcnow() - timedelta(days=ORDER_EXPIRY_DAYS)

                for order in open_orders:
                    try:
                        # ── Expire stale orders ─────────────────────────
                        if order.created_at and order.created_at < expiry_cutoff:
                            order.status = "EXPIRED"
                            order.updated_at = datetime.utcnow()
                            self._stats["expired"] += 1
                            logger.info(
                                f"Order EXPIRED: {order.id} | {order.side} {order.quantity}x "
                                f"{order.symbol} (created {order.created_at.isoformat()})"
                            )
                            await event_bus.emit(
                                Event(
                                    type=EventType.ORDER_EXPIRED,
                                    data={
                                        "order_id": str(order.id),
                                        "user_id": str(order.user_id),
                                        "symbol": order.symbol,
                                        "side": order.side,
                                        "quantity": order.quantity,
                                    },
                                    user_id=str(order.user_id),
                                    source="order_execution_worker",
                                )
                            )
                            continue

                        # ── Evaluate for fill ───────────────────────────
                        filled = await self._evaluate_order(db, order)
                        if filled:
                            self._stats["fills"] += 1
                            await event_bus.emit(
                                Event(
                                    type=EventType.ORDER_FILLED,
                                    data={
                                        "order_id": str(order.id),
                                        "user_id": str(order.user_id),
                                        "symbol": order.symbol,
                                        "side": order.side,
                                        "quantity": order.quantity,
                                        "filled_price": order.filled_price,
                                    },
                                    user_id=str(order.user_id),
                                    source="order_execution_worker",
                                )
                            )
                    except Exception as e:
                        self._stats["errors"] += 1
                        logger.error(f"Error evaluating order {order.id}: {e}")

                await db.commit()

            except Exception as e:
                await db.rollback()
                raise

    async def _evaluate_order(self, db: AsyncSession, order: Order) -> bool:
        """
        Evaluate a single order against current price.
        Returns True if the order was filled.
        """
        quote = await market_data.get_quote_safe(order.symbol, str(order.user_id))
        if not quote or "price" not in quote:
            return False

        current_price = quote["price"]
        should_fill = False

        if order.order_type == "LIMIT":
            if order.side == "BUY" and current_price <= order.price:
                should_fill = True
            elif order.side == "SELL" and current_price >= order.price:
                should_fill = True

        elif order.order_type in ("STOP_LOSS", "STOP_LOSS_LIMIT"):
            trigger = order.trigger_price or order.price
            if order.side == "BUY" and current_price >= trigger:
                should_fill = True
            elif order.side == "SELL" and current_price <= trigger:
                should_fill = True

        if should_fill:
            order.status = "FILLED"
            order.filled_quantity = order.quantity
            order.filled_price = current_price
            order.executed_at = datetime.utcnow()

            # Portfolio update will be handled by the Portfolio Worker
            # via the ORDER_FILLED event
            logger.info(
                f"Order FILLED: {order.id} | {order.side} {order.quantity}x "
                f"{order.symbol} @ ₹{current_price:.2f} (was {order.order_type} @ ₹{order.price:.2f})"
            )
            return True

        return False

    async def stop(self) -> None:
        self._running = False

    def get_stats(self) -> dict:
        return self._stats.copy()


# ── Singleton ──────────────────────────────────────────────────────
order_execution_worker = OrderExecutionWorker()
