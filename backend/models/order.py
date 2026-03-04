import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database.connection import Base


class Order(Base):
    __tablename__ = "orders"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    symbol = Column(String(20), nullable=False)
    exchange = Column(String(10), default="NSE")
    order_type = Column(String(20), nullable=False)  # MARKET, LIMIT, STOP_LOSS, STOP_LOSS_LIMIT
    side = Column(String(4), nullable=False)  # BUY, SELL
    quantity = Column(Integer, nullable=False)
    price = Column(Float, nullable=True)  # For limit orders
    trigger_price = Column(Float, nullable=True)  # For stop-loss
    filled_quantity = Column(Integer, default=0)
    filled_price = Column(Float, nullable=True)
    status = Column(String(20), default="PENDING")  # PENDING, OPEN, FILLED, PARTIALLY_FILLED, CANCELLED, REJECTED
    rejection_reason = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    executed_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="orders")
