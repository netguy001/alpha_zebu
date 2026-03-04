from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models.portfolio import Portfolio, Holding
from services import market_data
import logging

logger = logging.getLogger(__name__)


async def get_portfolio_summary(db: AsyncSession, user_id: str) -> dict:
    """Get complete portfolio summary with real-time P&L."""
    result = await db.execute(select(Portfolio).where(Portfolio.user_id == user_id))
    portfolio = result.scalar_one_or_none()

    if not portfolio:
        return {
            "total_invested": 0,
            "current_value": 0,
            "available_capital": 1000000,
            "total_pnl": 0,
            "total_pnl_percent": 0,
            "day_pnl": 0,
            "holdings_count": 0,
        }

    # Update holdings with live prices
    result = await db.execute(
        select(Holding).where(Holding.portfolio_id == portfolio.id)
    )
    holdings = result.scalars().all()

    total_invested = 0
    current_value = 0

    for holding in holdings:
        quote = await market_data.get_quote_safe(holding.symbol, user_id)
        if quote and quote.get("price"):
            holding.current_price = quote["price"]
            holding.current_value = quote["price"] * holding.quantity
            holding.pnl = holding.current_value - holding.invested_value
            holding.pnl_percent = (
                (holding.pnl / holding.invested_value * 100)
                if holding.invested_value
                else 0
            )

        total_invested += holding.invested_value
        current_value += holding.current_value

    portfolio.total_invested = total_invested
    portfolio.current_value = current_value
    unrealized_pnl = current_value - total_invested

    return {
        "total_invested": round(total_invested, 2),
        "current_value": round(current_value, 2),
        "available_capital": round(portfolio.available_capital, 2),
        "total_pnl": round(portfolio.total_pnl + unrealized_pnl, 2),
        "total_pnl_percent": round(
            (
                ((portfolio.total_pnl + unrealized_pnl) / total_invested * 100)
                if total_invested
                else 0
            ),
            2,
        ),
        "realized_pnl": round(portfolio.total_pnl, 2),
        "unrealized_pnl": round(unrealized_pnl, 2),
        "holdings_count": len(holdings),
    }


async def get_holdings(db: AsyncSession, user_id: str) -> list:
    """Get all holdings with live prices."""
    result = await db.execute(select(Portfolio).where(Portfolio.user_id == user_id))
    portfolio = result.scalar_one_or_none()
    if not portfolio:
        return []

    result = await db.execute(
        select(Holding).where(Holding.portfolio_id == portfolio.id)
    )
    holdings = result.scalars().all()

    holdings_list = []
    for h in holdings:
        quote = await market_data.get_quote_safe(h.symbol, user_id)
        if quote and quote.get("price"):
            h.current_price = quote["price"]
            h.current_value = quote["price"] * h.quantity
            h.pnl = h.current_value - h.invested_value
            h.pnl_percent = (h.pnl / h.invested_value * 100) if h.invested_value else 0

        holdings_list.append(
            {
                "id": h.id,
                "symbol": h.symbol,
                "company_name": h.company_name or h.symbol.replace(".NS", ""),
                "exchange": h.exchange,
                "quantity": h.quantity,
                "avg_price": round(h.avg_price, 2),
                "current_price": round(h.current_price, 2),
                "invested_value": round(h.invested_value, 2),
                "current_value": round(h.current_value, 2),
                "pnl": round(h.pnl, 2),
                "pnl_percent": round(h.pnl_percent, 2),
            }
        )

    return holdings_list
