"""
AlphaSync ZeroLoss — SQLAlchemy ORM Models.

These models are imported in database/connection.py's init_db() so that
Base.metadata.create_all() picks them up automatically — no need to run
the raw SQL migration manually during development.

For production PostgreSQL deployments, use migration.sql instead.
"""

import uuid
from datetime import datetime, date
from sqlalchemy import (
    Column,
    String,
    Float,
    Integer,
    DateTime,
    Date,
    CheckConstraint,
)
from database.connection import Base


class ZeroLossSignal(Base):
    """Persisted signal produced by the ZeroLoss strategy engine."""

    __tablename__ = "zeroloss_signals"

    id = Column(Integer, primary_key=True, autoincrement=True)
    symbol = Column(String(30), nullable=False, index=True)
    timestamp = Column(DateTime, nullable=False, default=datetime.utcnow)
    confidence_score = Column(Float, nullable=False, default=0)
    direction = Column(String(10), nullable=False)  # LONG / SHORT / NO_TRADE
    entry_price = Column(Float, nullable=True)
    stop_loss = Column(Float, nullable=True)
    target = Column(Float, nullable=True)
    status = Column(String(15), nullable=False, default="WAITING")
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    __table_args__ = (
        CheckConstraint(
            "direction IN ('LONG', 'SHORT', 'NO_TRADE')",
            name="ck_zeroloss_direction",
        ),
        CheckConstraint(
            "status IN ('WAITING', 'ACTIVE', 'PROFIT', 'BREAKEVEN')",
            name="ck_zeroloss_status",
        ),
    )


class ZeroLossPerformance(Base):
    """Daily aggregated performance for the ZeroLoss strategy."""

    __tablename__ = "zeroloss_performance"

    id = Column(Integer, primary_key=True, autoincrement=True)
    date = Column(Date, nullable=False, unique=True)
    total_trades = Column(Integer, nullable=False, default=0)
    profit_trades = Column(Integer, nullable=False, default=0)
    breakeven_trades = Column(Integer, nullable=False, default=0)
    loss_trades = Column(Integer, nullable=False, default=0)
    net_pnl = Column(Float, nullable=False, default=0)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    __table_args__ = (CheckConstraint("loss_trades = 0", name="ck_zeroloss_no_losses"),)
