"""Checklist management routes."""

from fastapi import APIRouter, HTTPException
from app.database import get_pool
from app.models import ChecklistCreate, ChecklistUpdate, ChecklistItemCreate, ChecklistItemUpdate

router = APIRouter()


@router.get("/cards/{card_id}/checklists")
async def get_checklists(card_id: int):
    """Get all checklists for a card with their items."""
    pool = get_pool()
    checklists = await pool.fetch(
        "SELECT * FROM checklists WHERE card_id = $1 ORDER BY created_at",
        card_id,
    )

    result = []
    for cl in checklists:
        cl_dict = dict(cl)
        items = await pool.fetch(
            "SELECT * FROM checklist_items WHERE checklist_id = $1 ORDER BY position",
            cl_dict["id"],
        )
        cl_dict["items"] = [dict(item) for item in items]
        result.append(cl_dict)

    return result


@router.post("/cards/{card_id}/checklists", status_code=201)
async def create_checklist(card_id: int, checklist: ChecklistCreate):
    """Create a new checklist for a card."""
    pool = get_pool()

    card = await pool.fetchrow("SELECT id FROM cards WHERE id = $1", card_id)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    row = await pool.fetchrow(
        "INSERT INTO checklists (card_id, title) VALUES ($1, $2) RETURNING *",
        card_id, checklist.title,
    )
    cl_dict = dict(row)
    cl_dict["items"] = []
    return cl_dict


@router.put("/checklists/{checklist_id}")
async def update_checklist(checklist_id: int, checklist: ChecklistUpdate):
    """Update a checklist's title."""
    pool = get_pool()
    row = await pool.fetchrow(
        "UPDATE checklists SET title = $1 WHERE id = $2 RETURNING *",
        checklist.title, checklist_id,
    )
    if not row:
        raise HTTPException(status_code=404, detail="Checklist not found")
    return dict(row)


@router.delete("/checklists/{checklist_id}")
async def delete_checklist(checklist_id: int):
    """Delete a checklist and all its items."""
    pool = get_pool()
    result = await pool.execute("DELETE FROM checklists WHERE id = $1", checklist_id)
    if result == "DELETE 0":
        raise HTTPException(status_code=404, detail="Checklist not found")
    return {"message": "Checklist deleted successfully"}


@router.post("/checklists/{checklist_id}/items", status_code=201)
async def create_checklist_item(checklist_id: int, item: ChecklistItemCreate):
    """Add an item to a checklist."""
    pool = get_pool()

    cl = await pool.fetchrow("SELECT id FROM checklists WHERE id = $1", checklist_id)
    if not cl:
        raise HTTPException(status_code=404, detail="Checklist not found")

    max_pos = await pool.fetchval(
        "SELECT COALESCE(MAX(position), -1) + 1 FROM checklist_items WHERE checklist_id = $1",
        checklist_id,
    )

    row = await pool.fetchrow(
        """INSERT INTO checklist_items (checklist_id, title, position)
           VALUES ($1, $2, $3) RETURNING *""",
        checklist_id, item.title, max_pos,
    )
    return dict(row)


@router.put("/checklist-items/{item_id}")
async def update_checklist_item(item_id: int, item: ChecklistItemUpdate):
    """Update a checklist item's title or completion status."""
    pool = get_pool()

    existing = await pool.fetchrow(
        "SELECT * FROM checklist_items WHERE id = $1", item_id
    )
    if not existing:
        raise HTTPException(status_code=404, detail="Checklist item not found")

    title = item.title if item.title is not None else existing["title"]
    is_completed = item.is_completed if item.is_completed is not None else existing["is_completed"]

    row = await pool.fetchrow(
        "UPDATE checklist_items SET title = $1, is_completed = $2 WHERE id = $3 RETURNING *",
        title, is_completed, item_id,
    )
    return dict(row)


@router.delete("/checklist-items/{item_id}")
async def delete_checklist_item(item_id: int):
    """Delete a checklist item."""
    pool = get_pool()
    result = await pool.execute("DELETE FROM checklist_items WHERE id = $1", item_id)
    if result == "DELETE 0":
        raise HTTPException(status_code=404, detail="Checklist item not found")
    return {"message": "Checklist item deleted successfully"}
