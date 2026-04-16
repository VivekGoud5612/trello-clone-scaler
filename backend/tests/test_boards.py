"""Tests for board routes."""

import pytest
from tests.conftest import sample_board, sample_list, sample_card_with_relations


class TestListBoards:
    """Tests for GET /api/boards."""

    @pytest.mark.asyncio
    async def test_list_boards_empty(self, client, mock_pool):
        mock_pool.fetch.return_value = []
        resp = await client.get("/api/boards")
        assert resp.status_code == 200
        assert resp.json() == []

    @pytest.mark.asyncio
    async def test_list_boards_returns_boards(self, client, mock_pool):
        mock_pool.fetch.return_value = [
            sample_board(id=1, title="Board A"),
            sample_board(id=2, title="Board B"),
        ]
        resp = await client.get("/api/boards")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 2
        assert data[0]["title"] == "Board A"
        assert data[1]["title"] == "Board B"


class TestCreateBoard:
    """Tests for POST /api/boards."""

    @pytest.mark.asyncio
    async def test_create_board_success(self, client, mock_pool):
        mock_pool.fetchrow.return_value = sample_board(id=1, title="New Board")
        mock_pool.execute.return_value = "INSERT 0 1"

        resp = await client.post("/api/boards", json={"title": "New Board"})
        assert resp.status_code == 201
        assert resp.json()["title"] == "New Board"
        # Should create 6 default labels
        assert mock_pool.execute.call_count == 6

    @pytest.mark.asyncio
    async def test_create_board_with_background(self, client, mock_pool):
        mock_pool.fetchrow.return_value = sample_board(
            id=1, title="Colored Board", background="#D29034"
        )
        mock_pool.execute.return_value = "INSERT 0 1"

        resp = await client.post(
            "/api/boards",
            json={"title": "Colored Board", "background": "#D29034"},
        )
        assert resp.status_code == 201
        assert resp.json()["background"] == "#D29034"

    @pytest.mark.asyncio
    async def test_create_board_missing_title(self, client, mock_pool):
        resp = await client.post("/api/boards", json={})
        assert resp.status_code == 422  # Pydantic validation error


class TestGetBoard:
    """Tests for GET /api/boards/{board_id}."""

    @pytest.mark.asyncio
    async def test_get_board_not_found(self, client, mock_pool):
        mock_pool.fetchrow.return_value = None
        resp = await client.get("/api/boards/999")
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_get_board_with_lists_and_cards(self, client, mock_pool):
        board = sample_board(id=1)
        lists = [sample_list(id=1, board_id=1, title="To Do", position=0)]
        cards = [sample_card_with_relations(id=1, list_id=1, title="Task 1")]

        mock_pool.fetchrow.return_value = board
        mock_pool.fetch.side_effect = [lists, cards]

        resp = await client.get("/api/boards/1")
        assert resp.status_code == 200
        data = resp.json()
        assert data["title"] == "Test Board"
        assert len(data["lists"]) == 1
        assert data["lists"][0]["title"] == "To Do"
        assert len(data["lists"][0]["cards"]) == 1
        assert data["lists"][0]["cards"][0]["title"] == "Task 1"


class TestUpdateBoard:
    """Tests for PUT /api/boards/{board_id}."""

    @pytest.mark.asyncio
    async def test_update_board_title(self, client, mock_pool):
        existing = sample_board(id=1, title="Old Title")

        # First call is SELECT, second is UPDATE
        mock_pool.fetchrow.side_effect = [
            existing,
            sample_board(id=1, title="New Title"),
        ]

        resp = await client.put("/api/boards/1", json={"title": "New Title"})
        assert resp.status_code == 200
        assert resp.json()["title"] == "New Title"

    @pytest.mark.asyncio
    async def test_update_board_not_found(self, client, mock_pool):
        mock_pool.fetchrow.return_value = None
        resp = await client.put("/api/boards/999", json={"title": "X"})
        assert resp.status_code == 404


class TestDeleteBoard:
    """Tests for DELETE /api/boards/{board_id}."""

    @pytest.mark.asyncio
    async def test_delete_board_success(self, client, mock_pool):
        mock_pool.execute.return_value = "DELETE 1"
        resp = await client.delete("/api/boards/1")
        assert resp.status_code == 200
        assert "deleted" in resp.json()["message"].lower()

    @pytest.mark.asyncio
    async def test_delete_board_not_found(self, client, mock_pool):
        mock_pool.execute.return_value = "DELETE 0"
        resp = await client.delete("/api/boards/999")
        assert resp.status_code == 404
