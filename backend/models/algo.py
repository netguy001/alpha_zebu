import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, Float, Integer, DateTime, ForeignKey, Text, JSON
from database.connection import Base


class AlgoStrategy(Base):
    __tablename__ = "algo_strategies"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    strategy_type = Column(String(50), nullable=False)  # SMA_CROSSOVER, RSI, MACD, CUSTOM
    symbol = Column(String(20), nullable=False)
    exchange = Column(String(10), default="NSE")
    parameters = Column(JSON, nullable=True)
    is_active = Column(Boolean, default=False)
    max_position_size = Column(Integer, default=100)
    stop_loss_percent = Column(Float, default=2.0)
    take_profit_percent = Column(Float, default=5.0)
    total_trades = Column(Integer, default=0)
    total_pnl = Column(Float, default=0.0)
    win_rate = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    from sqlalchemy.orm import relationship
    user = relationship("User", back_populates="algo_strategies")


class AlgoTrade(Base):
    __tablename__ = "algo_trades"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    strategy_id = Column(String(36), ForeignKey("algo_strategies.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    symbol = Column(String(20), nullable=False)
    side = Column(String(4), nullable=False)
    quantity = Column(Integer, nullable=False)
    price = Column(Float, nullable=False)
    pnl = Column(Float, default=0.0)
    signal = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class AlgoLog(Base):
    __tablename__ = "algo_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    strategy_id = Column(String(36), ForeignKey("algo_strategies.id", ondelete="CASCADE"), nullable=False)
    level = Column(String(10), default="INFO")  # INFO, WARNING, ERROR, TRADE
    message = Column(Text, nullable=False)
    data = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
