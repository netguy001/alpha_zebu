"""
Symbol Mapper — Translates between AlphaSync canonical symbols and
provider-specific symbol formats.

AlphaSync uses Yahoo Finance-style symbols as canonical:
    RELIANCE.NS, TCS.NS, ^NSEI, HDFCBANK.NS

Each provider may use different formats:
    - Yahoo:  RELIANCE.NS  (same as canonical)
    - Zebu:   RELIANCE-EQ  (exchange token-based, NSE segment)

This module provides bidirectional mapping so the rest of the
system always works with canonical symbols.
"""

import logging
from typing import Optional

logger = logging.getLogger(__name__)

# ── Zebu symbol mapping ────────────────────────────────────────────
# Zebu uses exchange tokens (integers) and trading symbols like "RELIANCE-EQ".
# This mapping covers common NSE equities. In production, this should be
# loaded from the Zebu master contract file at startup.
#
# Format: canonical_symbol -> { "trading_symbol": str, "token": str, "exchange": str }

_ZEBU_SYMBOL_MAP: dict[str, dict] = {
    "RELIANCE.NS": {
        "trading_symbol": "RELIANCE-EQ",
        "token": "2885",
        "exchange": "NSE",
    },
    "TCS.NS": {"trading_symbol": "TCS-EQ", "token": "11536", "exchange": "NSE"},
    "HDFCBANK.NS": {
        "trading_symbol": "HDFCBANK-EQ",
        "token": "1333",
        "exchange": "NSE",
    },
    "INFY.NS": {"trading_symbol": "INFY-EQ", "token": "1594", "exchange": "NSE"},
    "ICICIBANK.NS": {
        "trading_symbol": "ICICIBANK-EQ",
        "token": "4963",
        "exchange": "NSE",
    },
    "HINDUNILVR.NS": {
        "trading_symbol": "HINDUNILVR-EQ",
        "token": "1394",
        "exchange": "NSE",
    },
    "SBIN.NS": {"trading_symbol": "SBIN-EQ", "token": "3045", "exchange": "NSE"},
    "BHARTIARTL.NS": {
        "trading_symbol": "BHARTIARTL-EQ",
        "token": "10604",
        "exchange": "NSE",
    },
    "ITC.NS": {"trading_symbol": "ITC-EQ", "token": "1660", "exchange": "NSE"},
    "KOTAKBANK.NS": {
        "trading_symbol": "KOTAKBANK-EQ",
        "token": "1922",
        "exchange": "NSE",
    },
    "LT.NS": {"trading_symbol": "LT-EQ", "token": "11483", "exchange": "NSE"},
    "AXISBANK.NS": {
        "trading_symbol": "AXISBANK-EQ",
        "token": "5900",
        "exchange": "NSE",
    },
    "WIPRO.NS": {"trading_symbol": "WIPRO-EQ", "token": "3787", "exchange": "NSE"},
    "HCLTECH.NS": {"trading_symbol": "HCLTECH-EQ", "token": "7229", "exchange": "NSE"},
    "TATAMOTORS.NS": {
        "trading_symbol": "TATAMOTORS-EQ",
        "token": "3456",
        "exchange": "NSE",
    },
    "SUNPHARMA.NS": {
        "trading_symbol": "SUNPHARMA-EQ",
        "token": "3351",
        "exchange": "NSE",
    },
    "MARUTI.NS": {"trading_symbol": "MARUTI-EQ", "token": "10999", "exchange": "NSE"},
    "TITAN.NS": {"trading_symbol": "TITAN-EQ", "token": "3506", "exchange": "NSE"},
    "BAJFINANCE.NS": {
        "trading_symbol": "BAJFINANCE-EQ",
        "token": "317",
        "exchange": "NSE",
    },
    "ADANIENT.NS": {"trading_symbol": "ADANIENT-EQ", "token": "25", "exchange": "NSE"},
    # ── NSE Indices ──────────────────────────────────────────────────
    "^NSEI": {"trading_symbol": "Nifty 50", "token": "26000", "exchange": "NSE"},
    "^NSEBANK": {"trading_symbol": "Nifty Bank", "token": "26009", "exchange": "NSE"},
    "^CNXIT": {"trading_symbol": "Nifty IT", "token": "26008", "exchange": "NSE"},
    "^BSESN": {"trading_symbol": "SENSEX", "token": "1", "exchange": "BSE"},
}

# Reverse map: token -> canonical_symbol (for incoming tick parsing)
_TOKEN_TO_CANONICAL: dict[str, str] = {
    v["token"]: k for k, v in _ZEBU_SYMBOL_MAP.items()
}

# Reverse map: trading_symbol -> canonical_symbol
_TRADING_TO_CANONICAL: dict[str, str] = {
    v["trading_symbol"]: k for k, v in _ZEBU_SYMBOL_MAP.items()
}


def canonical_to_zebu(symbol: str) -> Optional[dict]:
    """
    Convert AlphaSync canonical symbol to Zebu format.

    Returns:
        {"trading_symbol": "RELIANCE-EQ", "token": "2885", "exchange": "NSE"}
        or None if not mapped.
    """
    return _ZEBU_SYMBOL_MAP.get(symbol)


def zebu_token_to_canonical(token: str) -> Optional[str]:
    """Convert Zebu exchange token to AlphaSync canonical symbol."""
    return _TOKEN_TO_CANONICAL.get(token)


def zebu_trading_to_canonical(trading_symbol: str) -> Optional[str]:
    """Convert Zebu trading symbol to AlphaSync canonical symbol."""
    return _TRADING_TO_CANONICAL.get(trading_symbol)


def get_all_zebu_tokens() -> list[dict]:
    """Return all mapped Zebu tokens for bulk subscription."""
    return [{"canonical": k, **v} for k, v in _ZEBU_SYMBOL_MAP.items()]


def load_zebu_contracts(contracts: list[dict]) -> int:
    """
    Load / refresh Zebu symbol mappings from master contract data.

    Expected format per contract:
        {"symbol": "RELIANCE", "token": "2885", "exchange": "NSE", ...}

    Call this at startup after fetching the master contract file from Zebu.
    Returns the number of symbols loaded.
    """
    global _ZEBU_SYMBOL_MAP, _TOKEN_TO_CANONICAL, _TRADING_TO_CANONICAL
    count = 0

    for c in contracts:
        sym = c.get("symbol", "").strip()
        token = str(c.get("token", "")).strip()
        exchange = c.get("exchange", "NSE").strip()

        if not sym or not token:
            continue

        canonical = f"{sym}.NS" if exchange == "NSE" else f"{sym}.BO"
        trading = f"{sym}-EQ"

        _ZEBU_SYMBOL_MAP[canonical] = {
            "trading_symbol": trading,
            "token": token,
            "exchange": exchange,
        }
        _TOKEN_TO_CANONICAL[token] = canonical
        _TRADING_TO_CANONICAL[trading] = canonical
        count += 1

    logger.info(
        f"Loaded {count} Zebu contract mappings (total: {len(_ZEBU_SYMBOL_MAP)})"
    )
    return count
