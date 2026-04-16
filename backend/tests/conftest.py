"""Shared test fixtures for all backend tests."""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from httpx import AsyncClient, ASGITransport
from datetime import datetime


class MockRecord(dict):
    """Dict subclass that mimics asyncpg.Record behavior."""
    pass


def make_record(data: dict) -> MockRecord:
    """Create a mock record from a dict."""
    return MockRecord(data)


class AsyncContextManagerMock:
    """Helper to create a proper async context manager mock."""
    def __init__(self, return_value):
        self._return_value = return_value

    async def __aenter__(self):
        return self._return_value

    async def __aexit__(self, *args):
        return False


@pytest.fixture
def mock_pool():
    """Create a mock asyncpg pool with async methods."""
    pool = AsyncMock()

    # Create mock connection and transaction
    mock_conn = AsyncMock()
    mock_transaction = MagicMock()

    # conn.transaction() must return an async context manager synchronously
    mock_conn.transaction = MagicMock(return_value=AsyncContextManagerMock(mock_transaction))

    # pool.acquire() must return an async context manager synchronously
    # (not a coroutine), so we use MagicMock, not AsyncMock
    pool.acquire = MagicMock(return_value=AsyncContextManagerMock(mock_conn))
    pool._mock_conn = mock_conn  # expose for test assertions

    return pool


@pytest.fixture
async def client(mock_pool):
    """Create a test HTTP client with mocked database."""
    with patch('app.database._pool', mock_pool), \
         patch('app.database.connect_db', new_callable=AsyncMock), \
         patch('app.database.disconnect_db', new_callable=AsyncMock):
        from app.main import app
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            yield ac


# ── Sample Data Factories ────────────────────────────────────

def sample_board(id=1, title="Test Board", background="#0079BF"):
    return make_record({
        "id": id,
        "title": title,
        "background": background,
        "created_at": datetime(2026, 1, 1),
        "updated_at": datetime(2026, 1, 1),
    })


def sample_list(id=1, board_id=1, title="Test List", position=0):
    return make_record({
        "id": id,
        "board_id": board_id,
        "title": title,
        "position": position,
        "created_at": datetime(2026, 1, 1),
        "updated_at": datetime(2026, 1, 1),
    })


def sample_card(id=1, list_id=1, title="Test Card", position=0):
    return make_record({
        "id": id,
        "list_id": list_id,
        "title": title,
        "description": "Test description",
        "position": position,
        "due_date": None,
        "is_archived": False,
        "cover_color": None,
        "created_at": datetime(2026, 1, 1),
        "updated_at": datetime(2026, 1, 1),
    })


def sample_card_with_relations(id=1, list_id=1, title="Test Card", position=0):
    return make_record({
        "id": id,
        "list_id": list_id,
        "title": title,
        "description": "Test description",
        "position": position,
        "due_date": None,
        "is_archived": False,
        "cover_color": None,
        "created_at": datetime(2026, 1, 1),
        "updated_at": datetime(2026, 1, 1),
        "labels": [],
        "members": [],
        "checklist_total": 0,
        "checklist_completed": 0,
    })


def sample_label(id=1, board_id=1, name="Urgent", color="#EB5A46"):
    return make_record({
        "id": id,
        "board_id": board_id,
        "name": name,
        "color": color,
    })


def sample_checklist(id=1, card_id=1, title="Checklist"):
    return make_record({
        "id": id,
        "card_id": card_id,
        "title": title,
        "created_at": datetime(2026, 1, 1),
    })


def sample_checklist_item(id=1, checklist_id=1, title="Item 1", is_completed=False, position=0):
    return make_record({
        "id": id,
        "checklist_id": checklist_id,
        "title": title,
        "is_completed": is_completed,
        "position": position,
        "created_at": datetime(2026, 1, 1),
    })


def sample_user(id=1, name="Alex Johnson", email="alex@example.com"):
    return make_record({
        "id": id,
        "name": name,
        "email": email,
        "avatar_color": "#0079BF",
        "created_at": datetime(2026, 1, 1),
    })


def sample_comment(id=1, card_id=1, user_id=1, content="Test comment"):
    return make_record({
        "id": id,
        "card_id": card_id,
        "user_id": user_id,
        "content": content,
        "created_at": datetime(2026, 1, 1),
        "updated_at": datetime(2026, 1, 1),
        "user_name": "Alex Johnson",
        "user_avatar_color": "#0079BF",
    })
