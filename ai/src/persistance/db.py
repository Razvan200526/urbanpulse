import os
from functools import lru_cache

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import sessionmaker

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)


@lru_cache
def get_engine() -> Engine:
    database_url = os.getenv("DATABASE_URL")

    if not database_url:
        raise RuntimeError("DATABASE_URL environment variable is not set.")

    return create_engine(database_url)


def get_db():
    db = create_db_session()
    try:
        yield db
    finally:
        db.close()


def create_db_session():
    if SessionLocal.kw.get("bind") is None:
        SessionLocal.configure(bind=get_engine())

    db = SessionLocal()
    return db
