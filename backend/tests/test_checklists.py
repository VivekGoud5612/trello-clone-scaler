"""Tests for checklist routes."""

import pytest
from tests.conftest import sample_checklist, sample_checklist_item, make_record


class TestGetChecklists:
    """Tests for GET /api/cards/{card_id}/checklists."""

    @pytest.mark.asyncio
    async def test_get_checklists_empty(self, client, mock_pool):
        mock_pool.fetch.return_value = []
        resp = await client.get("/api/cards/1/checklists")
        assert resp.status_code == 200
        assert resp.json() == []

    @pytest.mark.asyncio
    async def test_get_checklists_with_items(self, client, mock_pool):
        mock_pool.fetch.side_effect = [
            [sample_checklist(id=1, title="My Checklist")],
            [sample_checklist_item(id=1, title="Item 1")],
        ]
        resp = await client.get("/api/cards/1/checklists")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["title"] == "My Checklist"
        assert len(data[0]["items"]) == 1


class TestCreateChecklist:
    """Tests for POST /api/cards/{card_id}/checklists."""

    @pytest.mark.asyncio
    async def test_create_checklist_success(self, client, mock_pool):
        mock_pool.fetchrow.side_effect = [
            make_record({"id": 1}),  # card exists
            sample_checklist(id=1, title="New Checklist"),
        ]
        resp = await client.post("/api/cards/1/checklists", json={"title": "New Checklist"})
        assert resp.status_code == 201
        assert resp.json()["title"] == "New Checklist"
        assert resp.json()["items"] == []

    @pytest.mark.asyncio
    async def test_create_checklist_card_not_found(self, client, mock_pool):
        mock_pool.fetchrow.return_value = None
        resp = await client.post("/api/cards/999/checklists", json={"title": "X"})
        assert resp.status_code == 404


class TestUpdateChecklist:
    """Tests for PUT /api/checklists/{checklist_id}."""

    @pytest.mark.asyncio
    async def test_update_checklist(self, client, mock_pool):
        mock_pool.fetchrow.return_value = sample_checklist(id=1, title="Updated")
        resp = await client.put("/api/checklists/1", json={"title": "Updated"})
        assert resp.status_code == 200
        assert resp.json()["title"] == "Updated"

    @pytest.mark.asyncio
    async def test_update_checklist_not_found(self, client, mock_pool):
        mock_pool.fetchrow.return_value = None
        resp = await client.put("/api/checklists/999", json={"title": "X"})
        assert resp.status_code == 404


class TestDeleteChecklist:
    """Tests for DELETE /api/checklists/{checklist_id}."""

    @pytest.mark.asyncio
    async def test_delete_checklist_success(self, client, mock_pool):
        mock_pool.execute.return_value = "DELETE 1"
        resp = await client.delete("/api/checklists/1")
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_delete_checklist_not_found(self, client, mock_pool):
        mock_pool.execute.return_value = "DELETE 0"
        resp = await client.delete("/api/checklists/999")
        assert resp.status_code == 404


class TestChecklistItems:
    """Tests for checklist item CRUD."""

    @pytest.mark.asyncio
    async def test_create_item_success(self, client, mock_pool):
        mock_pool.fetchrow.side_effect = [
            make_record({"id": 1}),  # checklist exists
            sample_checklist_item(id=1, title="New Item"),
        ]
        mock_pool.fetchval.return_value = 0

        resp = await client.post("/api/checklists/1/items", json={"title": "New Item"})
        assert resp.status_code == 201
        assert resp.json()["title"] == "New Item"

    @pytest.mark.asyncio
    async def test_create_item_checklist_not_found(self, client, mock_pool):
        mock_pool.fetchrow.return_value = None
        resp = await client.post("/api/checklists/999/items", json={"title": "X"})
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_update_item_completion(self, client, mock_pool):
        existing = sample_checklist_item(id=1, is_completed=False)
        updated = sample_checklist_item(id=1, is_completed=True)
        mock_pool.fetchrow.side_effect = [existing, updated]

        resp = await client.put("/api/checklist-items/1", json={"is_completed": True})
        assert resp.status_code == 200
        assert resp.json()["is_completed"] is True

    @pytest.mark.asyncio
    async def test_update_item_not_found(self, client, mock_pool):
        mock_pool.fetchrow.return_value = None
        resp = await client.put("/api/checklist-items/999", json={"title": "X"})
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_item_success(self, client, mock_pool):
        mock_pool.execute.return_value = "DELETE 1"
        resp = await client.delete("/api/checklist-items/1")
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_delete_item_not_found(self, client, mock_pool):
        mock_pool.execute.return_value = "DELETE 0"
        resp = await client.delete("/api/checklist-items/999")
        assert resp.status_code == 404
