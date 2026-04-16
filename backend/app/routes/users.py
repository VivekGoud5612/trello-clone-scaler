"""User routes."""

from fastapi import APIRouter, HTTPException
from app.database import get_pool

router = APIRouter()


@router.get("/users")
async def list_users():
    """Get all users (pre-seeded, no auth)."""
    pool = get_pool()
    rows = await pool.fetch("SELECT * FROM users ORDER BY id")
    return [dict(r) for r in rows]


@router.get("/users/{user_id}")
async def get_user(user_id: int):
    """Get a single user."""
    pool = get_pool()
    row = await pool.fetchrow("SELECT * FROM users WHERE id = $1", user_id)
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    return dict(row)


@router.post("/cards/{card_id}/members/{user_id}", status_code=201)
async def add_member_to_card(card_id: int, user_id: int):
    """Assign a member to a card."""
    pool = get_pool()
    try:
        await pool.execute(
            "INSERT INTO card_members (card_id, user_id) VALUES ($1, $2)",
            card_id, user_id,
        )
    except Exception:
        raise HTTPException(status_code=400, detail="Member already assigned or invalid IDs")
    return {"message": "Member added to card"}


@router.delete("/cards/{card_id}/members/{user_id}")
async def remove_member_from_card(card_id: int, user_id: int):
    """Remove a member from a card."""
    pool = get_pool()
    result = await pool.execute(
        "DELETE FROM card_members WHERE card_id = $1 AND user_id = $2",
        card_id, user_id,
    )
    if result == "DELETE 0":
        raise HTTPException(status_code=404, detail="Member not found on card")
    return {"message": "Member removed from card"}
