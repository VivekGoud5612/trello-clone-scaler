"""Database connection management using asyncpg."""

import json
import asyncpg
import os
from dotenv import load_dotenv
import socket

load_dotenv()

_pool: asyncpg.Pool | None = None


async def _init_connection(conn: asyncpg.Connection):
    """Set up JSON codecs for each new connection."""
    await conn.set_type_codec(
        'json',
        encoder=json.dumps,
        decoder=json.loads,
        schema='pg_catalog'
    )
    await conn.set_type_codec(
        'jsonb',
        encoder=json.dumps,
        decoder=json.loads,
        schema='pg_catalog'
    )


async def connect_db():
    global _pool
    if _pool is not None:
        return
    _pool = await asyncpg.create_pool(
        dsn = os.getenv('DB_URL'),
        min_size=2,
        max_size=20,
        init=_init_connection,
        ssl = 'require',
        statement_cache_size=0,
    )


async def disconnect_db():
    """Close the connection pool."""
    global _pool
    if _pool:
        await _pool.close()
        _pool = None


def get_pool() -> asyncpg.Pool:
    """Get the current connection pool."""
    if _pool is None:
        raise RuntimeError("Database pool is not initialized. Call connect_db() first.")
    return _pool


def set_pool(pool):
    """Set the pool (used for testing)."""
    global _pool
    _pool = pool
