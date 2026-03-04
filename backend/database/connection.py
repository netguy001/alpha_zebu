from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from config.settings import settings


engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    future=True,
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
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    async with engine.begin() as conn:
        from models import user, order, portfolio, watchlist, algo  # noqa
        from models import broker as broker_model  # noqa
        from strategies.zeroloss import models as zeroloss_models  # noqa

        await conn.run_sync(Base.metadata.create_all)
