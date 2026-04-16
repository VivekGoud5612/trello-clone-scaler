"""Label management routes."""

from fastapi import APIRouter, HTTPException
from app.database import get_pool
from app.models import LabelCreate, LabelUpdate

router = APIRouter()


@router.get("/boards/{board_id}/labels")
async def get_labels(board_id: int):
    """Get all labels for a board."""
    pool = get_pool()
    rows = await pool.fetch(
        "SELECT * FROM labels WHERE board_id = $1 ORDER BY id",
        board_id,
    )
    return [dict(r) for r in rows]


@router.post("/boards/{board_id}/labels", status_code=201)
async def create_label(board_id: int, label: LabelCreate):
    """Create a new label for a board."""
    pool = get_pool()

    board = await pool.fetchrow("SELECT id FROM boards WHERE id = $1", board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")

    row = await pool.fetchrow(
        "INSERT INTO labels (board_id, name, color) VALUES ($1, $2, $3) RETURNING *",
        board_id, label.name, label.color,
    )
    return dict(row)


@router.put("/labels/{label_id}")
async def update_label(label_id: int, label: LabelUpdate):
    """Update a label's name or color."""
    pool = get_pool()

    existing = await pool.fetchrow("SELECT * FROM labels WHERE id = $1", label_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Label not found")

    name = label.name if label.name is not None else existing["name"]
    color = label.color if label.color is not None else existing["color"]

    row = await pool.fetchrow(
        "UPDATE labels SET name = $1, color = $2 WHERE id = $3 RETURNING *",
        name, color, label_id,
    )
    return dict(row)


@router.delete("/labels/{label_id}")
async def delete_label(label_id: int):
    """Delete a label."""
    pool = get_pool()
    result = await pool.execute("DELETE FROM labels WHERE id = $1", label_id)
    if result == "DELETE 0":
        raise HTTPException(status_code=404, detail="Label not found")
    return {"message": "Label deleted successfully"}


@router.post("/cards/{card_id}/labels/{label_id}", status_code=201)
async def add_label_to_card(card_id: int, label_id: int):
    """Add a label to a card."""
    pool = get_pool()
    try:
        await pool.execute(
            "INSERT INTO card_labels (card_id, label_id) VALUES ($1, $2)",
            card_id, label_id,
        )
    except Exception:
        raise HTTPException(status_code=400, detail="Label already assigned or invalid IDs")
    return {"message": "Label added to card"}


@router.delete("/cards/{card_id}/labels/{label_id}")
async def remove_label_from_card(card_id: int, label_id: int):
    """Remove a label from a card."""
    pool = get_pool()
    result = await pool.execute(
        "DELETE FROM card_labels WHERE card_id = $1 AND label_id = $2",
        card_id, label_id,
    )
    if result == "DELETE 0":
        raise HTTPException(status_code=404, detail="Label not found on card")
    return {"message": "Label removed from card"}
