import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Boolean,
    Numeric,
    DateTime,
    ForeignKey,
    Text,
    Index,
    text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from database.connection import Base


def _utcnow():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    is_verified = Column(
        Boolean, default=False, nullable=False, server_default=text("false")
    )
    is_active = Column(
        Boolean, default=True, nullable=False, server_default=text("true")
    )
    virtual_capital = Column(
        Numeric(precision=16, scale=2), default=1000000.0, nullable=False
    )
    role = Column(
        String(20), default="user", nullable=False, server_default=text("'user'")
    )
    avatar_url = Column(String(500), nullable=True)
    phone = Column(String(20), nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=_utcnow,
        nullable=False,
        server_default=text("now()"),
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=_utcnow,
        onupdate=_utcnow,
        nullable=False,
        server_default=text("now()"),
    )

    # Relationships
    two_factor = relationship(
        "TwoFactorAuth",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )
    portfolio = relationship(
        "Portfolio", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    orders = relationship("Order", back_populates="user", cascade="all, delete-orphan")
    watchlists = relationship(
        "Watchlist", back_populates="user", cascade="all, delete-orphan"
    )
    algo_strategies = relationship(
        "AlgoStrategy", back_populates="user", cascade="all, delete-orphan"
    )

    __table_args__ = (Index("ix_users_role_active", "role", "is_active"),)


class TwoFactorAuth(Base):
    __tablename__ = "two_factor_auth"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    secret = Column(String(32), nullable=False)
    is_enabled = Column(
        Boolean, default=False, nullable=False, server_default=text("false")
    )
    backup_codes = Column(Text, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=_utcnow,
        nullable=False,
        server_default=text("now()"),
    )

    user = relationship("User", back_populates="two_factor")


class UserSession(Base):
    __tablename__ = "user_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    token_jti = Column(String(36), unique=True, nullable=False, index=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    is_active = Column(
        Boolean, default=True, nullable=False, server_default=text("true")
    )
    created_at = Column(
        DateTime(timezone=True),
        default=_utcnow,
        nullable=False,
        server_default=text("now()"),
    )
    expires_at = Column(DateTime(timezone=True), nullable=False)

    __table_args__ = (Index("ix_user_sessions_active", "user_id", "is_active"),)


class FailedLoginAttempt(Base):
    __tablename__ = "failed_login_attempts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    attempted_at = Column(
        DateTime(timezone=True),
        default=_utcnow,
        nullable=False,
        server_default=text("now()"),
    )
