"""
BrokerAccount — SQLAlchemy model for storing per-user broker connections.

Each AlphaSync user may connect one account per broker. The access token
and refresh token are stored AES-encrypted; the encryption key lives in
an environment variable, NEVER in the database.

This table stores ONLY the minimum data needed to authenticate a
market-data WebSocket session.  No demat details, no order-placement
credentials, no PAN/Aadhaar — nothing beyond what is required to
open a read-only data feed.

Supported brokers (extensible):
    - zebu   : Zebull / SUSPENDED Securities
    - (future): angel, fyers, upstox, etc.
"""

import uuid
from datetime import datetime
from sqlalchemy import (
    Column,
    String,
    Boolean,
    DateTime,
    Text,
    ForeignKey,
    UniqueConstraint,
    Index,
)
from sqlalchemy.orm import relationship
from database.connection import Base


class BrokerAccount(Base):
    """
    One row per user-broker pair.

    Columns:
        id              Primary key (UUID).
        user_id         FK → users.id.
        broker          Broker slug: "zebu", "angel", etc.
        broker_user_id  User ID on the broker side (e.g. Zebu client ID).
        access_token    AES-encrypted session/access token.
        refresh_token   AES-encrypted refresh token (nullable — not all
                        brokers issue one).
        token_expiry    UTC datetime when the access token expires.
        is_active       Soft-disable flag; set to False on disconnect or
                        repeated auth failures.
        extra_data      JSON blob for broker-specific metadata (e.g.
                        Zebu's `susertoken`, `actid`). Encrypted.
        connected_at    When the user first linked the account.
        last_used_at    Last time the token was used to open a WS session.
        updated_at      Last row modification.
    """

    __tablename__ = "broker_accounts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    broker = Column(String(32), nullable=False, default="zebu")
    broker_user_id = Column(String(128), nullable=True)

    # Encrypted tokens — see services/broker_crypto.py
    access_token_enc = Column(Text, nullable=True)
    refresh_token_enc = Column(Text, nullable=True)

    token_expiry = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    extra_data_enc = Column(Text, nullable=True)  # encrypted JSON blob

    connected_at = Column(DateTime, default=datetime.utcnow)
    last_used_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # ── Relationships ──────────────────────────────────────────────
    user = relationship("User", backref="broker_accounts")

    # ── Constraints ────────────────────────────────────────────────
    __table_args__ = (
        UniqueConstraint("user_id", "broker", name="uq_user_broker"),
        Index("ix_broker_active", "broker", "is_active"),
    )

    def __repr__(self) -> str:
        return (
            f"<BrokerAccount user={self.user_id[:8]} broker={self.broker} "
            f"active={self.is_active}>"
        )
