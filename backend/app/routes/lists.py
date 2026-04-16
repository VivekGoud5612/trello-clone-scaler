"""List management routes."""

from fastapi import APIRouter, HTTPException
from app.database import get_pool
from app.models import ListCreate, ListUpdate, ListReorderRequest

router = APIRouter()


@router.get("/boards/{board_id}/lists")
async def get_lists(board_id: int):
    """Get all lists for a board, ordered by position."""
    pool = get_pool()
    rows = await pool.fetch(
        "SELECT * FROM lists WHERE board_id = $1 ORDER BY position",
        board_id,
    )
    return [dict(r) for r in rows]


@router.post("/boards/{board_id}/lists", status_code=201)
async def create_list(board_id: int, lst: ListCreate):
    """Create a new list in a board at the end position."""
    pool = get_pool()

    # Verify board exists
    board = await pool.fetchrow("SELECT id FROM boards WHERE id = $1", board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")

    # Get next position
    max_pos = await pool.fetchval(
        "SELECT COALESCE(MAX(position), -1) + 1 FROM lists WHERE board_id = $1",
        board_id,
    )

    row = await pool.fetchrow(
        "INSERT INTO lists (board_id, title, position) VALUES ($1, $2, $3) RETURNING *",
        board_id, lst.title, max_pos,
    )
    return dict(row)


# Static routes MUST come before parameterized routes
@router.put("/lists/reorder")
async def reorder_lists(data: ListReorderRequest):
    """Reorder lists within a board by updating their positions."""
    pool = get_pool()

    async with pool.acquire() as conn:
        async with conn.transaction():
            for item in data.lists:
                await conn.execute(
                    "UPDATE lists SET position = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND board_id = $3",
                    item.position, item.id, data.board_id,
                )

    return {"message": "Lists reordered successfully"}


@router.put("/lists/{list_id}")
async def update_list(list_id: int, lst: ListUpdate):
    """Update a list's title."""
    pool = get_pool()

    existing = await pool.fetchrow("SELECT * FROM lists WHERE id = $1", list_id)
    if not existing:
        raise HTTPException(status_code=404, detail="List not found")

    title = lst.title if lst.title is not None else existing["title"]

    row = await pool.fetchrow(
        """UPDATE lists SET title = $1, updated_at = CURRENT_TIMESTAMP
           WHERE id = $2 RETURNING *""",
        title, list_id,
    )
    return dict(row)


@router.delete("/lists/{list_id}")
async def delete_list(list_id: int):
    """Delete a list and all its cards."""
    pool = get_pool()
    result = await pool.execute("DELETE FROM lists WHERE id = $1", list_id)
    if result == "DELETE 0":
        raise HTTPException(status_code=404, detail="List not found")
    return {"message": "List deleted successfully"}
