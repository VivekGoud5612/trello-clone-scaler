"""Tests for label, user, comment, and search routes."""

import pytest
from tests.conftest import sample_label, sample_user, sample_comment, make_record


class TestLabels:
    """Tests for label CRUD and card-label management."""

    @pytest.mark.asyncio
    async def test_get_labels(self, client, mock_pool):
        mock_pool.fetch.return_value = [sample_label(id=1, name="Urgent")]
        resp = await client.get("/api/boards/1/labels")
        assert resp.status_code == 200
        assert len(resp.json()) == 1

    @pytest.mark.asyncio
    async def test_create_label(self, client, mock_pool):
        mock_pool.fetchrow.side_effect = [
            make_record({"id": 1}),  # board exists
            sample_label(id=1, name="Bug", color="#EB5A46"),
        ]
        resp = await client.post("/api/boards/1/labels", json={"name": "Bug", "color": "#EB5A46"})
        assert resp.status_code == 201
        assert resp.json()["name"] == "Bug"

    @pytest.mark.asyncio
    async def test_create_label_board_not_found(self, client, mock_pool):
        mock_pool.fetchrow.return_value = None
        resp = await client.post("/api/boards/999/labels", json={"color": "#EB5A46"})
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_update_label(self, client, mock_pool):
        mock_pool.fetchrow.side_effect = [
            sample_label(id=1),
            sample_label(id=1, name="Updated"),
        ]
        resp = await client.put("/api/labels/1", json={"name": "Updated"})
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_delete_label(self, client, mock_pool):
        mock_pool.execute.return_value = "DELETE 1"
        resp = await client.delete("/api/labels/1")
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_add_label_to_card(self, client, mock_pool):
        mock_pool.execute.return_value = "INSERT 0 1"
        resp = await client.post("/api/cards/1/labels/1")
        assert resp.status_code == 201

    @pytest.mark.asyncio
    async def test_remove_label_from_card(self, client, mock_pool):
        mock_pool.execute.return_value = "DELETE 1"
        resp = await client.delete("/api/cards/1/labels/1")
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_remove_label_not_on_card(self, client, mock_pool):
        mock_pool.execute.return_value = "DELETE 0"
        resp = await client.delete("/api/cards/1/labels/999")
        assert resp.status_code == 404


class TestUsers:
    """Tests for user routes."""

    @pytest.mark.asyncio
    async def test_list_users(self, client, mock_pool):
        mock_pool.fetch.return_value = [sample_user(id=1), sample_user(id=2, name="Sarah")]
        resp = await client.get("/api/users")
        assert resp.status_code == 200
        assert len(resp.json()) == 2

    @pytest.mark.asyncio
    async def test_get_user(self, client, mock_pool):
        mock_pool.fetchrow.return_value = sample_user(id=1)
        resp = await client.get("/api/users/1")
        assert resp.status_code == 200
        assert resp.json()["name"] == "Alex Johnson"

    @pytest.mark.asyncio
    async def test_get_user_not_found(self, client, mock_pool):
        mock_pool.fetchrow.return_value = None
        resp = await client.get("/api/users/999")
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_add_member_to_card(self, client, mock_pool):
        mock_pool.execute.return_value = "INSERT 0 1"
        resp = await client.post("/api/cards/1/members/1")
        assert resp.status_code == 201

    @pytest.mark.asyncio
    async def test_remove_member_from_card(self, client, mock_pool):
        mock_pool.execute.return_value = "DELETE 1"
        resp = await client.delete("/api/cards/1/members/1")
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_remove_member_not_on_card(self, client, mock_pool):
        mock_pool.execute.return_value = "DELETE 0"
        resp = await client.delete("/api/cards/1/members/999")
        assert resp.status_code == 404


class TestComments:
    """Tests for comment routes."""

    @pytest.mark.asyncio
    async def test_get_comments(self, client, mock_pool):
        mock_pool.fetch.return_value = [sample_comment(id=1, content="Hello")]
        resp = await client.get("/api/cards/1/comments")
        assert resp.status_code == 200
        assert len(resp.json()) == 1

    @pytest.mark.asyncio
    async def test_create_comment(self, client, mock_pool):
        mock_pool.fetchrow.side_effect = [
            make_record({"id": 1}),  # card exists
            sample_comment(id=1, content="New comment"),
            make_record({"name": "Alex", "avatar_color": "#0079BF"}),  # user info
        ]
        resp = await client.post("/api/cards/1/comments", json={
            "content": "New comment", "user_id": 1
        })
        assert resp.status_code == 201
        assert resp.json()["content"] == "New comment"

    @pytest.mark.asyncio
    async def test_create_comment_card_not_found(self, client, mock_pool):
        mock_pool.fetchrow.return_value = None
        resp = await client.post("/api/cards/999/comments", json={"content": "X"})
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_update_comment(self, client, mock_pool):
        mock_pool.fetchrow.return_value = sample_comment(id=1, content="Updated")
        resp = await client.put("/api/comments/1", json={"content": "Updated"})
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_update_comment_not_found(self, client, mock_pool):
        mock_pool.fetchrow.return_value = None
        resp = await client.put("/api/comments/999", json={"content": "X"})
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_comment(self, client, mock_pool):
        mock_pool.execute.return_value = "DELETE 1"
        resp = await client.delete("/api/comments/1")
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_delete_comment_not_found(self, client, mock_pool):
        mock_pool.execute.return_value = "DELETE 0"
        resp = await client.delete("/api/comments/999")
        assert resp.status_code == 404


class TestSearch:
    """Tests for search and filter."""

    @pytest.mark.asyncio
    async def test_search_by_title(self, client, mock_pool):
        mock_pool.fetch.return_value = [
            make_record({
                "id": 1, "list_id": 1, "title": "Test Card", "description": "",
                "position": 0, "due_date": None, "is_archived": False,
                "cover_color": None, "created_at": "2026-01-01", "updated_at": "2026-01-01",
                "list_title": "To Do", "labels": [], "members": [],
            })
        ]
        resp = await client.get("/api/search", params={"board_id": 1, "q": "Test"})
        assert resp.status_code == 200
        assert len(resp.json()) == 1

    @pytest.mark.asyncio
    async def test_search_no_results(self, client, mock_pool):
        mock_pool.fetch.return_value = []
        resp = await client.get("/api/search", params={"board_id": 1, "q": "nonexistent"})
        assert resp.status_code == 200
        assert resp.json() == []

    @pytest.mark.asyncio
    async def test_search_missing_board_id(self, client, mock_pool):
        resp = await client.get("/api/search")
        assert resp.status_code == 422

    @pytest.mark.asyncio
    async def test_search_with_filters(self, client, mock_pool):
        mock_pool.fetch.return_value = []
        resp = await client.get("/api/search", params={
            "board_id": 1, "label_id": 1, "member_id": 1, "due_date": "overdue"
        })
        assert resp.status_code == 200


class TestHealthCheck:
    """Tests for the health check endpoint."""

    @pytest.mark.asyncio
    async def test_health_check(self, client, mock_pool):
        resp = await client.get("/api/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "ok"
