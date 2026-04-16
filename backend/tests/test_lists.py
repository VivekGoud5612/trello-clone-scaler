"""Tests for list routes."""

import pytest
from tests.conftest import sample_list, make_record


class TestGetLists:
    """Tests for GET /api/boards/{board_id}/lists."""

    @pytest.mark.asyncio
    async def test_get_lists_empty(self, client, mock_pool):
        mock_pool.fetch.return_value = []
        resp = await client.get("/api/boards/1/lists")
        assert resp.status_code == 200
        assert resp.json() == []

    @pytest.mark.asyncio
    async def test_get_lists_returns_ordered(self, client, mock_pool):
        mock_pool.fetch.return_value = [
            sample_list(id=1, position=0, title="To Do"),
            sample_list(id=2, position=1, title="In Progress"),
        ]
        resp = await client.get("/api/boards/1/lists")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 2
        assert data[0]["title"] == "To Do"
        assert data[1]["title"] == "In Progress"


class TestCreateList:
    """Tests for POST /api/boards/{board_id}/lists."""

    @pytest.mark.asyncio
    async def test_create_list_success(self, client, mock_pool):
        mock_pool.fetchrow.side_effect = [
            make_record({"id": 1}),  # Board exists check
            sample_list(id=1, title="New List", position=0),  # Insert result
        ]
        mock_pool.fetchval.return_value = 0

        resp = await client.post("/api/boards/1/lists", json={"title": "New List"})
        assert resp.status_code == 201
        assert resp.json()["title"] == "New List"

    @pytest.mark.asyncio
    async def test_create_list_board_not_found(self, client, mock_pool):
        mock_pool.fetchrow.return_value = None
        resp = await client.post("/api/boards/999/lists", json={"title": "Test"})
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_create_list_missing_title(self, client, mock_pool):
        resp = await client.post("/api/boards/1/lists", json={})
        assert resp.status_code == 422


class TestUpdateList:
    """Tests for PUT /api/lists/{list_id}."""

    @pytest.mark.asyncio
    async def test_update_list_title(self, client, mock_pool):
        mock_pool.fetchrow.side_effect = [
            sample_list(id=1, title="Old Title"),
            sample_list(id=1, title="New Title"),
        ]
        resp = await client.put("/api/lists/1", json={"title": "New Title"})
        assert resp.status_code == 200
        assert resp.json()["title"] == "New Title"

    @pytest.mark.asyncio
    async def test_update_list_not_found(self, client, mock_pool):
        mock_pool.fetchrow.return_value = None
        resp = await client.put("/api/lists/999", json={"title": "X"})
        assert resp.status_code == 404


class TestDeleteList:
    """Tests for DELETE /api/lists/{list_id}."""

    @pytest.mark.asyncio
    async def test_delete_list_success(self, client, mock_pool):
        mock_pool.execute.return_value = "DELETE 1"
        resp = await client.delete("/api/lists/1")
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_delete_list_not_found(self, client, mock_pool):
        mock_pool.execute.return_value = "DELETE 0"
        resp = await client.delete("/api/lists/999")
        assert resp.status_code == 404


class TestReorderLists:
    """Tests for PUT /api/lists/reorder."""

    @pytest.mark.asyncio
    async def test_reorder_lists(self, client, mock_pool):
        conn = mock_pool._mock_conn
        conn.execute.return_value = "UPDATE 1"

        resp = await client.put("/api/lists/reorder", json={
            "board_id": 1,
            "lists": [
                {"id": 1, "position": 1},
                {"id": 2, "position": 0},
            ],
        })
        assert resp.status_code == 200
        assert "reordered" in resp.json()["message"].lower()
