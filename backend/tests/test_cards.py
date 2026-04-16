"""Tests for card routes."""

import pytest
from tests.conftest import sample_card, sample_card_with_relations, make_record


class TestGetCards:
    """Tests for GET /api/lists/{list_id}/cards."""

    @pytest.mark.asyncio
    async def test_get_cards_empty(self, client, mock_pool):
        mock_pool.fetch.return_value = []
        resp = await client.get("/api/lists/1/cards")
        assert resp.status_code == 200
        assert resp.json() == []

    @pytest.mark.asyncio
    async def test_get_cards_returns_cards(self, client, mock_pool):
        mock_pool.fetch.return_value = [
            sample_card_with_relations(id=1, title="Card A"),
            sample_card_with_relations(id=2, title="Card B"),
        ]
        resp = await client.get("/api/lists/1/cards")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 2
        assert data[0]["title"] == "Card A"


class TestCreateCard:
    """Tests for POST /api/lists/{list_id}/cards."""

    @pytest.mark.asyncio
    async def test_create_card_success(self, client, mock_pool):
        mock_pool.fetchrow.side_effect = [
            make_record({"id": 1}),  # list exists
            sample_card(id=1, title="New Card"),
        ]
        mock_pool.fetchval.return_value = 0

        resp = await client.post("/api/lists/1/cards", json={"title": "New Card"})
        assert resp.status_code == 201
        data = resp.json()
        assert data["title"] == "New Card"
        assert data["labels"] == []
        assert data["members"] == []

    @pytest.mark.asyncio
    async def test_create_card_list_not_found(self, client, mock_pool):
        mock_pool.fetchrow.return_value = None
        resp = await client.post("/api/lists/999/cards", json={"title": "X"})
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_create_card_missing_title(self, client, mock_pool):
        resp = await client.post("/api/lists/1/cards", json={})
        assert resp.status_code == 422


class TestGetCardDetail:
    """Tests for GET /api/cards/{card_id}."""

    @pytest.mark.asyncio
    async def test_get_card_not_found(self, client, mock_pool):
        mock_pool.fetchrow.return_value = None
        resp = await client.get("/api/cards/999")
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_get_card_with_full_details(self, client, mock_pool):
        card = sample_card_with_relations(id=1, title="Detailed Card")
        mock_pool.fetchrow.return_value = card
        # checklists fetch, then items fetch, then comments fetch
        mock_pool.fetch.side_effect = [
            [make_record({"id": 1, "card_id": 1, "title": "Checklist", "created_at": "2026-01-01"})],
            [make_record({"id": 1, "checklist_id": 1, "title": "Item 1", "is_completed": False, "position": 0, "created_at": "2026-01-01"})],
            [make_record({"id": 1, "card_id": 1, "user_id": 1, "content": "Hello", "created_at": "2026-01-01", "updated_at": "2026-01-01", "user_name": "Alex", "user_avatar_color": "#0079BF"})],
        ]

        resp = await client.get("/api/cards/1")
        assert resp.status_code == 200
        data = resp.json()
        assert data["title"] == "Detailed Card"
        assert len(data["checklists"]) == 1
        assert len(data["checklists"][0]["items"]) == 1
        assert len(data["comments"]) == 1


class TestUpdateCard:
    """Tests for PUT /api/cards/{card_id}."""

    @pytest.mark.asyncio
    async def test_update_card_title(self, client, mock_pool):
        mock_pool.fetchrow.side_effect = [
            sample_card(id=1, title="Old"),
            sample_card(id=1, title="Updated"),
        ]
        resp = await client.put("/api/cards/1", json={"title": "Updated"})
        assert resp.status_code == 200
        assert resp.json()["title"] == "Updated"

    @pytest.mark.asyncio
    async def test_update_card_not_found(self, client, mock_pool):
        mock_pool.fetchrow.return_value = None
        resp = await client.put("/api/cards/999", json={"title": "X"})
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_update_card_description(self, client, mock_pool):
        existing = sample_card(id=1)
        updated = sample_card(id=1)
        updated["description"] = "New description"
        mock_pool.fetchrow.side_effect = [existing, updated]

        resp = await client.put("/api/cards/1", json={"description": "New description"})
        assert resp.status_code == 200


class TestDeleteCard:
    """Tests for DELETE /api/cards/{card_id}."""

    @pytest.mark.asyncio
    async def test_delete_card_success(self, client, mock_pool):
        mock_pool.execute.return_value = "DELETE 1"
        resp = await client.delete("/api/cards/1")
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_delete_card_not_found(self, client, mock_pool):
        mock_pool.execute.return_value = "DELETE 0"
        resp = await client.delete("/api/cards/999")
        assert resp.status_code == 404


class TestReorderCards:
    """Tests for PUT /api/cards/reorder."""

    @pytest.mark.asyncio
    async def test_reorder_cards(self, client, mock_pool):
        conn = mock_pool._mock_conn
        conn.execute.return_value = "UPDATE 1"

        resp = await client.put("/api/cards/reorder", json={
            "cards": [
                {"id": 1, "list_id": 1, "position": 1},
                {"id": 2, "list_id": 1, "position": 0},
            ],
        })
        assert resp.status_code == 200


class TestMoveCard:
    """Tests for PUT /api/cards/move."""

    @pytest.mark.asyncio
    async def test_move_card_between_lists(self, client, mock_pool):
        conn = mock_pool._mock_conn
        conn.execute.return_value = "UPDATE 1"

        resp = await client.put("/api/cards/move", json={
            "card_id": 1,
            "source_list_id": 1,
            "dest_list_id": 2,
            "position": 0,
        })
        assert resp.status_code == 200
        assert "moved" in resp.json()["message"].lower()
