from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from database.connection import get_db
from models.user import User
from models.watchlist import Watchlist, WatchlistItem
from routes.auth import get_current_user

router = APIRouter(prefix="/api/watchlist", tags=["Watchlist"])


class CreateWatchlistRequest(BaseModel):
    name: str = "My Watchlist"

class RenameWatchlistRequest(BaseModel):
    name: str

class AddItemRequest(BaseModel):
    symbol: str
    exchange: str = "NSE"


@router.get("")
async def get_watchlists(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Watchlist).where(Watchlist.user_id == user.id)
    )
    watchlists = result.scalars().all()

    wl_list = []
    for wl in watchlists:
        items_result = await db.execute(
            select(WatchlistItem).where(WatchlistItem.watchlist_id == wl.id)
        )
        items = items_result.scalars().all()
        wl_list.append({
            "id": wl.id,
            "name": wl.name,
            "items": [
                {"id": i.id, "symbol": i.symbol, "exchange": i.exchange}
                for i in items
            ],
        })

    return {"watchlists": wl_list}


@router.post("")
async def create_watchlist(
    req: CreateWatchlistRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new watchlist — unlimited per user."""
    name = req.name.strip() or "My Watchlist"
    wl = Watchlist(user_id=user.id, name=name)
    db.add(wl)
    await db.flush()
    return {"id": wl.id, "name": wl.name, "items": []}


@router.patch("/{watchlist_id}")
async def rename_watchlist(
    watchlist_id: str,
    req: RenameWatchlistRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Watchlist).where(
            Watchlist.id == watchlist_id, Watchlist.user_id == user.id
        )
    )
    wl = result.scalar_one_or_none()
    if not wl:
        raise HTTPException(status_code=404, detail="Watchlist not found")

    name = req.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Name cannot be empty")

    wl.name = name
    await db.flush()
    return {"id": wl.id, "name": wl.name}


@router.post("/{watchlist_id}/items")
async def add_item(
    watchlist_id: str,
    req: AddItemRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Watchlist).where(
            Watchlist.id == watchlist_id, Watchlist.user_id == user.id
        )
    )
    wl = result.scalar_one_or_none()
    if not wl:
        raise HTTPException(status_code=404, detail="Watchlist not found")

    result = await db.execute(
        select(WatchlistItem).where(
            WatchlistItem.watchlist_id == watchlist_id,
            WatchlistItem.symbol == req.symbol,
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Symbol already in watchlist")

    item = WatchlistItem(
        watchlist_id=watchlist_id,
        symbol=req.symbol,
        exchange=req.exchange,
    )
    db.add(item)
    await db.flush()
    return {"id": item.id, "symbol": item.symbol, "exchange": item.exchange}


@router.delete("/{watchlist_id}")
async def delete_watchlist(
    watchlist_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Watchlist).where(
            Watchlist.id == watchlist_id, Watchlist.user_id == user.id
        )
    )
    wl = result.scalar_one_or_none()
    if not wl:
        raise HTTPException(status_code=404, detail="Watchlist not found")
    await db.delete(wl)
    return {"message": "Watchlist deleted"}


@router.delete("/{watchlist_id}/items/{item_id}")
async def remove_item(
    watchlist_id: str,
    item_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Watchlist).where(
            Watchlist.id == watchlist_id, Watchlist.user_id == user.id
        )
    )
    wl = result.scalar_one_or_none()
    if not wl:
        raise HTTPException(status_code=404, detail="Watchlist not found")

    result = await db.execute(
        select(WatchlistItem).where(
            WatchlistItem.id == item_id,
            WatchlistItem.watchlist_id == watchlist_id,
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    await db.delete(item)
    return {"message": "Item removed"}