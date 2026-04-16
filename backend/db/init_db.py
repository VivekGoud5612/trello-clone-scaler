"""Database initialization script. Run with: uv run python db/init_db.py"""

import asyncio
import asyncpg
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()
DB_URL = os.getenv('DB_URL')
DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", "5432")),
    "user": os.getenv("DB_USER", "trello_user"),
    "password": os.getenv("DB_PASSWORD", "trello_pass"),
    "database": os.getenv("DB_NAME", "trello_clone"),
}

DB_DIR = Path(__file__).parent


async def init_database():
    """Initialize the database with schema and seed data."""
    conn = await asyncpg.connect(DB_URL, statement_cache_size=0)
    try:
        schema_sql = (DB_DIR / "schema.sql").read_text(encoding="utf-8")
        seed_sql = (DB_DIR / "seed.sql").read_text(encoding="utf-8")

        print("Creating tables...")
        await conn.execute(schema_sql)
        print("Tables created successfully.")

        print("Seeding data...")
        await conn.execute(seed_sql)
        print("Data seeded successfully.")
``
        print("Database initialization complete!")
    except Exception as e:
        print(f"Error initializing database: {e}")
        raise
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(init_database())
