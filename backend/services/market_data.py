"""
Market Data Service — User-scoped provider access (Zebu-only).

All market data comes exclusively from the Zebu/MYNT broker API.
No Yahoo Finance or other third-party data sources.

All quote functions require a user_id to look up that user's
ZebuProvider via BrokerSessionManager. If the user has no active
broker session, a BrokerNotConnected error is raised.

System-level functions (search, ticker) use get_any_session().

Responsibilities:
    * Symbol formatting (_format_symbol)
    * User-scoped quote access (get_quote, get_quote_safe)
    * System-level quote access (get_system_quote, get_system_quote_safe)
    * Stock search (local NSE list + Zebu SearchScrip API)
    * Convenience lists (POPULAR_INDIAN_STOCKS, INDIAN_INDICES)
"""

from typing import Optional
import time
import logging

from services.nse_stocks import NSE_STOCK_LIST

logger = logging.getLogger(__name__)

# ── Search result cache (Yahoo queries are expensive) ──────────────────────────
_search_cache: dict = {}
_search_cache_ts: dict = {}
SEARCH_CACHE_DURATION = 300  # 5 minutes

# Popular Indian stocks (used for ticker bar, default suggestions)
POPULAR_INDIAN_STOCKS = [
    {"symbol": "RELIANCE.NS", "name": "Reliance Industries", "exchange": "NSE"},
    {"symbol": "TCS.NS", "name": "Tata Consultancy Services", "exchange": "NSE"},
    {"symbol": "HDFCBANK.NS", "name": "HDFC Bank", "exchange": "NSE"},
    {"symbol": "INFY.NS", "name": "Infosys", "exchange": "NSE"},
    {"symbol": "ICICIBANK.NS", "name": "ICICI Bank", "exchange": "NSE"},
    {"symbol": "HINDUNILVR.NS", "name": "Hindustan Unilever", "exchange": "NSE"},
    {"symbol": "SBIN.NS", "name": "State Bank of India", "exchange": "NSE"},
    {"symbol": "BHARTIARTL.NS", "name": "Bharti Airtel", "exchange": "NSE"},
    {"symbol": "ITC.NS", "name": "ITC Limited", "exchange": "NSE"},
    {"symbol": "KOTAKBANK.NS", "name": "Kotak Mahindra Bank", "exchange": "NSE"},
    {"symbol": "LT.NS", "name": "Larsen & Toubro", "exchange": "NSE"},
    {"symbol": "AXISBANK.NS", "name": "Axis Bank", "exchange": "NSE"},
    {"symbol": "WIPRO.NS", "name": "Wipro", "exchange": "NSE"},
    {"symbol": "HCLTECH.NS", "name": "HCL Technologies", "exchange": "NSE"},
    {"symbol": "TATAMOTORS.NS", "name": "Tata Motors", "exchange": "NSE"},
    {"symbol": "SUNPHARMA.NS", "name": "Sun Pharma", "exchange": "NSE"},
    {"symbol": "MARUTI.NS", "name": "Maruti Suzuki", "exchange": "NSE"},
    {"symbol": "TITAN.NS", "name": "Titan Company", "exchange": "NSE"},
    {"symbol": "BAJFINANCE.NS", "name": "Bajaj Finance", "exchange": "NSE"},
    {"symbol": "ADANIENT.NS", "name": "Adani Enterprises", "exchange": "NSE"},
]

# Indian market indices
INDIAN_INDICES = [
    {"symbol": "^NSEI", "name": "NIFTY 50"},
    {"symbol": "^BSESN", "name": "SENSEX"},
    {"symbol": "^NSEBANK", "name": "BANK NIFTY"},
    {"symbol": "^CNXIT", "name": "NIFTY IT"},
]


def _format_symbol(symbol: str) -> str:
    """Ensure symbol has .NS suffix for NSE stocks."""
    if not symbol.startswith("^") and not symbol.endswith((".NS", ".BO")):
        return f"{symbol}.NS"
    return symbol


# ── Provider accessor ──────────────────────────────────────────────


def _get_provider_for_user(user_id: str):
    """Return the ZebuProvider for a specific user. Raises BrokerNotConnected if none."""
    from services.broker_session import broker_session_manager

    provider = broker_session_manager.get_session(user_id)
    if provider is None:
        raise BrokerNotConnected(user_id)
    return provider


def _get_any_provider():
    """Return ANY active provider for system-level tasks. Raises RuntimeError if none."""
    from services.broker_session import broker_session_manager

    provider = broker_session_manager.get_any_session()
    if provider is None:
        raise RuntimeError("No active broker sessions — market data unavailable")
    return provider


class BrokerNotConnected(Exception):
    """Raised when a user has no active broker session."""

    def __init__(self, user_id: str = ""):
        self.user_id = user_id
        super().__init__(
            f"Broker not connected"
            + (f" for user {str(user_id)[:8]}..." if user_id else "")
        )


class ProviderDataUnavailable(Exception):
    """Raised when the active provider has no data for a symbol."""

    pass


# ── User-scoped quote functions ────────────────────────────────────


async def get_quote(symbol: str, user_id: str) -> dict:
    """
    Get real-time quote for a symbol via the user's ZebuProvider.

    Raises:
        BrokerNotConnected       – user has no active session.
        ProviderDataUnavailable  – provider returned None for the symbol.
    """
    symbol = _format_symbol(symbol)
    provider = _get_provider_for_user(user_id)
    quote = await provider.get_quote(symbol)
    if quote is None:
        raise ProviderDataUnavailable(
            f"{type(provider).__name__} returned no data for {symbol}"
        )
    return quote


async def get_quote_safe(symbol: str, user_id: str) -> Optional[dict]:
    """
    Like get_quote() but returns None instead of raising.
    Use in non-critical paths (ticker bar, portfolio display).
    """
    try:
        return await get_quote(symbol, user_id)
    except (BrokerNotConnected, ProviderDataUnavailable, RuntimeError) as e:
        logger.debug(
            f"get_quote_safe({symbol}, {str(user_id)[:8] if user_id else '?'}): {e}"
        )
        return None
    except Exception as e:
        logger.error(f"get_quote_safe({symbol}) unexpected: {e}")
        return None


# ── System-level quote functions (no user context) ─────────────────


async def get_system_quote(symbol: str) -> dict:
    """
    Get a quote using ANY available provider session.
    For system-level tasks (workers, ZeroLoss) that don't have user context.

    Raises RuntimeError if no sessions exist.
    """
    symbol = _format_symbol(symbol)
    provider = _get_any_provider()
    quote = await provider.get_quote(symbol)
    if quote is None:
        raise ProviderDataUnavailable(
            f"{type(provider).__name__} returned no data for {symbol}"
        )
    return quote


async def get_system_quote_safe(symbol: str) -> Optional[dict]:
    """System-level quote that returns None on failure."""
    try:
        return await get_system_quote(symbol)
    except (ProviderDataUnavailable, RuntimeError) as e:
        logger.debug(f"get_system_quote_safe({symbol}): {e}")
        return None
    except Exception as e:
        logger.error(f"get_system_quote_safe({symbol}) unexpected: {e}")
        return None


async def get_historical_data(
    symbol: str,
    period: str = "1mo",
    interval: str = "1d",
    user_id: Optional[str] = None,
) -> list:
    """
    Get historical OHLCV data for charts.

    Uses user's provider if user_id given, otherwise any provider.
    Returns empty list on failure.
    """
    symbol = _format_symbol(symbol)
    try:
        if user_id:
            provider = _get_provider_for_user(user_id)
        else:
            provider = _get_any_provider()
        return await provider.get_historical_data(
            symbol, period=period, interval=interval
        )
    except (BrokerNotConnected, RuntimeError):
        logger.error(f"No provider available for history ({symbol})")
        return []
    except NotImplementedError:
        logger.warning(f"Provider does not support historical data (symbol={symbol})")
        return []
    except Exception as e:
        logger.error(f"get_historical_data({symbol}) failed: {e}")
        return []


async def search_stocks(query: str) -> list:
    """Search for Indian stocks — local NSE list + Zebu SearchScrip API.

    1. Instant: Search 300+ stocks from local NSE_STOCK_LIST
    2. Zebu SearchScrip API (if broker connected)
    3. Merge & deduplicate — return up to 20 results
    """
    query_upper = query.upper().strip()
    if not query_upper:
        return []

    # ── Check search cache ─────────────────────────────────────────────────────
    now = time.time()
    if (
        query_upper in _search_cache
        and (now - _search_cache_ts.get(query_upper, 0)) < SEARCH_CACHE_DURATION
    ):
        return _search_cache[query_upper]

    # ── Step 1: Local search (instant, covers ~300 stocks) ─────────────────────
    local_results = []
    for stock in NSE_STOCK_LIST:
        if (
            query_upper in stock["symbol"].upper()
            or query_upper in stock["name"].upper()
        ):
            local_results.append(stock)

    # ── Step 2: Zebu SearchScrip API (covers ALL stocks, needs broker) ─────────
    zebu_results = await _search_zebu(query_upper)

    # ── Step 3: Merge & deduplicate ────────────────────────────────────────────
    seen = set()
    merged = []

    # Local results first (more reliable names)
    for r in local_results:
        sym = r["symbol"]
        if sym not in seen:
            seen.add(sym)
            merged.append(r)

    # Then Zebu results
    for r in zebu_results:
        sym = r["symbol"]
        if sym not in seen:
            seen.add(sym)
            merged.append(r)

    result = merged[:20]

    # Cache the result
    _search_cache[query_upper] = result
    _search_cache_ts[query_upper] = now

    return result


async def _search_zebu(query: str) -> list:
    """Search for instruments via Zebu SearchScrip API."""
    try:
        provider = _get_any_provider()
        data = await provider._rest_post(
            "/SearchScrip",
            {
                "exch": "NSE",
                "stext": query,
            },
        )
        if not data or data.get("stat") != "Ok":
            return []

        results = []
        for item in data.get("values", []):
            tsym = item.get("tsym", "")
            token = item.get("token", "")
            # Filter to EQ segment only
            if "-EQ" not in tsym:
                continue
            name = tsym.replace("-EQ", "")
            symbol = f"{name}.NS"
            results.append(
                {
                    "symbol": symbol,
                    "name": item.get("instname", name),
                    "exchange": "NSE",
                    "token": token,
                }
            )
        return results[:15]
    except (RuntimeError, Exception) as e:
        logger.debug(f"Zebu SearchScrip failed: {e}")
        return []


async def get_indices(user_id: Optional[str] = None) -> list:
    """Get Indian market indices."""
    indices = []
    for idx_info in INDIAN_INDICES:
        if user_id:
            quote = await get_quote_safe(idx_info["symbol"], user_id)
        else:
            quote = await get_system_quote_safe(idx_info["symbol"])
        if quote:
            quote["name"] = idx_info["name"]
            indices.append(quote)
    return indices


async def get_ticker_data(user_id: Optional[str] = None) -> list:
    """Get indices + all popular stocks for the scrolling ticker bar."""
    items = []
    # Indices first
    for idx_info in INDIAN_INDICES:
        if user_id:
            quote = await get_quote_safe(idx_info["symbol"], user_id)
        else:
            quote = await get_system_quote_safe(idx_info["symbol"])
        if quote:
            quote["name"] = idx_info["name"]
            quote["kind"] = "index"
            items.append(quote)
    # Then popular stocks
    for stock in POPULAR_INDIAN_STOCKS:
        if user_id:
            quote = await get_quote_safe(stock["symbol"], user_id)
        else:
            quote = await get_system_quote_safe(stock["symbol"])
        if quote:
            quote["name"] = stock["name"]
            quote["kind"] = "stock"
            items.append(quote)
    return items


async def get_batch_quotes(symbols: list[str], user_id: Optional[str] = None) -> dict:
    """Get quotes for multiple symbols."""
    try:
        if user_id:
            provider = _get_provider_for_user(user_id)
        else:
            provider = _get_any_provider()
        return await provider.get_batch_quotes(symbols)
    except (BrokerNotConnected, RuntimeError):
        logger.error("No provider available for batch quotes")
        return {}
    except Exception as e:
        logger.error(f"batch_quotes failed: {e}")
        return {}
