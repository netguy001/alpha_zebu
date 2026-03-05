from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    APP_NAME: str = "AlphaSync"
    APP_VERSION: str = "2.0.0"
    DEBUG: bool = False

    # Database (PostgreSQL — required for production)
    DATABASE_URL: str = (
        "postgresql+asyncpg://alphasync:alphasync@localhost:5432/alphasync"
    )
    DB_POOL_SIZE: int = 20
    DB_MAX_OVERFLOW: int = 10
    DB_POOL_RECYCLE: int = 3600
    DB_POOL_PRE_PING: bool = True

    # JWT
    JWT_SECRET_KEY: str = "alphasync-default-jwt-secret-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    # Virtual Capital
    DEFAULT_VIRTUAL_CAPITAL: float = 1000000.0  # 10 Lakh INR

    # Market Data
    MARKET_DATA_CACHE_SECONDS: int = 15
    PRICE_STREAM_INTERVAL: float = 3.0

    # Redis (shared live price cache across all user sessions)
    REDIS_URL: str = "redis://localhost:6379/0"

    # Zebu / MYNT Market Data Feed (per-user sessions via BrokerSessionManager)
    # Zebu rebranded to MYNT; go.mynt.in is the current production host.
    ZEBU_WS_URL: str = "wss://go.mynt.in/NorenWSTP/"
    ZEBU_API_KEY: str = ""  # legacy — use ZEBU_API_SECRET instead
    ZEBU_API_SECRET: str = ""  # "App Key" from MYNT portal → Client Code → API Key

    # Zebu Broker OAuth / API Integration
    ZEBU_API_URL: str = "https://go.mynt.in/NorenWClientTP"
    ZEBU_AUTH_URL: str = (
        "https://login.zebull.in"  # Vendor SSO redirect (may not be available)
    )
    ZEBU_VENDOR_CODE: str = ""
    ZEBU_REDIRECT_URI: str = "http://localhost:5173/broker/callback"

    # Broker Token Encryption (AES-256-GCM)
    # Generate with: python -c "import secrets; print(secrets.token_urlsafe(48))"
    BROKER_ENCRYPTION_KEY: str = (
        "alphasync-default-broker-key-change-in-production-1234"
    )

    # 2FA
    TWO_FACTOR_ISSUER: str = "AlphaSync"

    # ── New Architecture Settings ───────────────────────────────────

    # Worker intervals (seconds)
    WORKER_MARKET_DATA_INTERVAL: float = 3.0
    WORKER_ORDER_EXECUTION_INTERVAL: float = 5.0
    WORKER_ALGO_STRATEGY_INTERVAL: float = 30.0

    # Risk Engine defaults
    RISK_MAX_POSITION_SIZE: int = 500
    RISK_MAX_CAPITAL_PER_TRADE: float = 200000.0
    RISK_MAX_PORTFOLIO_EXPOSURE: float = 0.80
    RISK_MAX_DAILY_LOSS: float = 50000.0
    RISK_MAX_OPEN_ORDERS: int = 20

    # Market Session
    SIMULATION_MODE: bool = False  # Allow trading outside market hours

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
