from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from database.connection import get_db
from models.user import User
from models.order import Order
from routes.auth import get_current_user
from services.trading_engine import place_order, cancel_order

router = APIRouter(prefix="/api/orders", tags=["Orders"])


class PlaceOrderRequest(BaseModel):
    symbol: str
    side: str  # BUY or SELL
    order_type: str = "MARKET"  # MARKET, LIMIT, STOP_LOSS
    quantity: int
    price: Optional[float] = None
    trigger_price: Optional[float] = None


@router.post("")
async def create_order(
    req: PlaceOrderRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if req.side not in ("BUY", "SELL"):
        raise HTTPException(status_code=400, detail="Side must be BUY or SELL")
    if req.quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be positive")

    result = await place_order(
        db=db,
        user_id=user.id,
        symbol=req.symbol,
        side=req.side,
        order_type=req.order_type,
        quantity=req.quantity,
        price=req.price,
        trigger_price=req.trigger_price,
    )

    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])

    return result


@router.get("")
async def get_orders(
    status_filter: Optional[str] = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Order).where(Order.user_id == user.id)
    if status_filter:
        query = query.where(Order.status == status_filter)
    query = query.order_by(Order.created_at.desc())

    result = await db.execute(query)
    orders = result.scalars().all()

    return {
        "orders": [
            {
                "id": o.id,
                "symbol": o.symbol,
                "exchange": o.exchange,
                "order_type": o.order_type,
                "side": o.side,
                "quantity": o.quantity,
                "price": o.price,
                "trigger_price": o.trigger_price,
                "filled_quantity": o.filled_quantity,
                "filled_price": o.filled_price,
                "status": o.status,
                "created_at": o.created_at.isoformat() if o.created_at else None,
                "executed_at": o.executed_at.isoformat() if o.executed_at else None,
            }
            for o in orders
        ]
    }


@router.get("/{order_id}")
async def get_order(
    order_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Order).where(Order.id == order_id, Order.user_id == user.id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    return {
        "id": order.id,
        "symbol": order.symbol,
        "exchange": order.exchange,
        "order_type": order.order_type,
        "side": order.side,
        "quantity": order.quantity,
        "price": order.price,
        "trigger_price": order.trigger_price,
        "filled_quantity": order.filled_quantity,
        "filled_price": order.filled_price,
        "status": order.status,
        "created_at": order.created_at.isoformat() if order.created_at else None,
        "executed_at": order.executed_at.isoformat() if order.executed_at else None,
    }


@router.delete("/{order_id}")
async def delete_order(
    order_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await cancel_order(db, user.id, order_id)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
    return result
