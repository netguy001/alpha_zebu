from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import text
from config.settings import settings


engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    future=True,
    pool_size=settings.DB_POOL_SIZE,
    max_overflow=settings.DB_MAX_OVERFLOW,
    pool_recycle=settings.DB_POOL_RECYCLE,
    pool_pre_ping=settings.DB_POOL_PRE_PING,
)

async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# Alias for background workers that need direct session access
# (not via FastAPI's Depends(get_db) dependency injection)
async_session_factory = async_session


class Base(DeclarativeBase):
    pass


async def get_db():
    async with async_session() as session:
        try:
            yield session
            # Only auto-commit if the route didn't already commit/rollback
            if session.is_active:
                await session.commit()
        except Exception:
            if session.is_active:
                await session.rollback()
            raise


async def init_db():
    async with engine.begin() as conn:
        # Ensure uuid-ossp extension is available for gen_random_uuid()
        # Wrapped in DO block to handle race condition when multiple workers start simultaneously
        await conn.execute(
            text(
                """
            DO $$ BEGIN
                CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
            EXCEPTION WHEN duplicate_object THEN NULL;
            END $$;
        """
            )
        )
        from models import user, order, portfolio, watchlist, algo  # noqa
        from models import broker as broker_model  # noqa
        from strategies.zeroloss import models as zeroloss_models  # noqa

        await conn.run_sync(Base.metadata.create_all)
