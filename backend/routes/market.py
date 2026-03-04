from fastapi import APIRouter, Query, Depends, HTTPException
from services import market_data
from services.market_data import BrokerNotConnected
from routes.auth import get_current_user
from models.user import User

router = APIRouter(prefix="/api/market", tags=["Market Data"])


@router.get("/quote/{symbol}")
async def get_quote(symbol: str, user: User = Depends(get_current_user)):
    try:
        quote = await market_data.get_quote_safe(symbol, user.id)
    except BrokerNotConnected:
        raise HTTPException(status_code=403, detail="Broker not connected")
    if not quote:
        return {"error": "Symbol not found or data unavailable"}
    return quote


@router.get("/search")
async def search_stocks(q: str = Query(..., min_length=1)):
    """Search is provider-independent (local + Yahoo HTTP API)."""
    results = await market_data.search_stocks(q)
    return {"results": results}


@router.get("/history/{symbol}")
async def get_history(
    symbol: str,
    period: str = Query("1mo", regex="^(1d|5d|1mo|3mo|6mo|1y|2y|5y|max)$"),
    interval: str = Query("1d", regex="^(1m|3m|5m|10m|15m|30m|1h|2h|4h|1d)$"),
    user: User = Depends(get_current_user),
):
    try:
        data = await market_data.get_historical_data(
            symbol, period, interval, user_id=user.id
        )
    except BrokerNotConnected:
        raise HTTPException(status_code=403, detail="Broker not connected")
    return {"symbol": symbol, "candles": data, "count": len(data)}


@router.get("/indices")
async def get_indices(user: User = Depends(get_current_user)):
    indices = await market_data.get_indices(user_id=user.id)
    return {"indices": indices}


@router.get("/ticker")
async def get_ticker(user: User = Depends(get_current_user)):
    """All indices + popular stocks for the scrolling ticker bar."""
    items = await market_data.get_ticker_data(user_id=user.id)
    return {"items": items}


@router.get("/popular")
async def get_popular_stocks():
    return {"stocks": market_data.POPULAR_INDIAN_STOCKS}


@router.get("/batch")
async def batch_quotes(
    symbols: str = Query(..., description="Comma-separated symbols"),
    user: User = Depends(get_current_user),
):
    symbol_list = [s.strip() for s in symbols.split(",") if s.strip()]
    quotes = await market_data.get_batch_quotes(symbol_list, user_id=user.id)
    return {"quotes": quotes}


@router.get("/provider/health")
async def provider_health(user: User = Depends(get_current_user)):
    """Return market data provider health for the current user's session."""
    from services.broker_session import broker_session_manager

    provider = broker_session_manager.get_session(user.id)
    if not provider:
        return {"status": "not_connected", "message": "Broker not connected"}
    try:
        health = await provider.health()
        return health.to_dict()
    except Exception as e:
        return {"status": "error", "error": str(e)}
