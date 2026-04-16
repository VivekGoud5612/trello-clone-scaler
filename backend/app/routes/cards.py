"""Card management routes."""

from fastapi import APIRouter, HTTPException
from app.database import get_pool
from app.models import CardCreate, CardUpdate, CardReorderRequest, CardMoveRequest

router = APIRouter()


@router.get("/lists/{list_id}/cards")
async def get_cards(list_id: int):
    """Get all non-archived cards for a list."""
    pool = get_pool()
    rows = await pool.fetch(
        """
        SELECT c.*,
            COALESCE(
                (SELECT json_agg(json_build_object(
                    'id', l.id, 'name', l.name, 'color', l.color
                ))
                FROM card_labels cl JOIN labels l ON cl.label_id = l.id
                WHERE cl.card_id = c.id), '[]'
            )::jsonb AS labels,
            COALESCE(
                (SELECT json_agg(json_build_object(
                    'id', u.id, 'name', u.name, 'avatar_color', u.avatar_color
                ))
                FROM card_members cm JOIN users u ON cm.user_id = u.id
                WHERE cm.card_id = c.id), '[]'
            )::jsonb AS members
        FROM cards c
        WHERE c.list_id = $1 AND c.is_archived = FALSE
        ORDER BY c.position
        """,
        list_id,
    )
    return [dict(r) for r in rows]


@router.post("/lists/{list_id}/cards", status_code=201)
async def create_card(list_id: int, card: CardCreate):
    """Create a new card at the bottom of a list."""
    pool = get_pool()

    # Verify list exists
    lst = await pool.fetchrow("SELECT id FROM lists WHERE id = $1", list_id)
    if not lst:
        raise HTTPException(status_code=404, detail="List not found")

    # Get next position
    max_pos = await pool.fetchval(
        "SELECT COALESCE(MAX(position), -1) + 1 FROM cards WHERE list_id = $1",
        list_id,
    )

    row = await pool.fetchrow(
        """INSERT INTO cards (list_id, title, description, position)
           VALUES ($1, $2, $3, $4) RETURNING *""",
        list_id, card.title, card.description, max_pos,
    )
    card_dict = dict(row)
    card_dict["labels"] = []
    card_dict["members"] = []
    card_dict["checklist_total"] = 0
    card_dict["checklist_completed"] = 0
    return card_dict


# Static routes MUST come before parameterized routes
@router.put("/cards/reorder")
async def reorder_cards(data: CardReorderRequest):
    """Reorder cards (can be within or across lists)."""
    pool = get_pool()

    async with pool.acquire() as conn:
        async with conn.transaction():
            for item in data.cards:
                await conn.execute(
                    """UPDATE cards
                       SET list_id = $1, position = $2, updated_at = CURRENT_TIMESTAMP
                       WHERE id = $3""",
                    item.list_id, item.position, item.id,
                )

    return {"message": "Cards reordered successfully"}


@router.put("/cards/move")
async def move_card(data: CardMoveRequest):
    """Move a card from one list to another at a specific position."""
    pool = get_pool()

    async with pool.acquire() as conn:
        async with conn.transaction():
            # Shift cards down in destination list
            await conn.execute(
                """UPDATE cards SET position = position + 1
                   WHERE list_id = $1 AND position >= $2""",
                data.dest_list_id, data.position,
            )

            # Move the card
            await conn.execute(
                """UPDATE cards
                   SET list_id = $1, position = $2, updated_at = CURRENT_TIMESTAMP
                   WHERE id = $3""",
                data.dest_list_id, data.position, data.card_id,
            )

            # Re-normalize source list positions
            await conn.execute(
                """
                WITH ranked AS (
                    SELECT id, ROW_NUMBER() OVER (ORDER BY position) - 1 AS new_pos
                    FROM cards WHERE list_id = $1
                )
                UPDATE cards SET position = ranked.new_pos
                FROM ranked WHERE cards.id = ranked.id
                """,
                data.source_list_id,
            )

    return {"message": "Card moved successfully"}


@router.get("/cards/{card_id}")
async def get_card(card_id: int):
    """Get full card details including labels, members, checklists, and comments."""
    pool = get_pool()

    card = await pool.fetchrow(
        """
        SELECT c.*,
            COALESCE(
                (SELECT json_agg(json_build_object(
                    'id', l.id, 'name', l.name, 'color', l.color
                ))
                FROM card_labels cl JOIN labels l ON cl.label_id = l.id
                WHERE cl.card_id = c.id), '[]'
            )::jsonb AS labels,
            COALESCE(
                (SELECT json_agg(json_build_object(
                    'id', u.id, 'name', u.name, 'avatar_color', u.avatar_color
                ))
                FROM card_members cm JOIN users u ON cm.user_id = u.id
                WHERE cm.card_id = c.id), '[]'
            )::jsonb AS members
        FROM cards c
        WHERE c.id = $1
        """,
        card_id,
    )
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    card_dict = dict(card)

    # Fetch checklists with items
    checklists = await pool.fetch(
        "SELECT * FROM checklists WHERE card_id = $1 ORDER BY created_at",
        card_id,
    )
    checklists_data = []
    for cl in checklists:
        cl_dict = dict(cl)
        items = await pool.fetch(
            "SELECT * FROM checklist_items WHERE checklist_id = $1 ORDER BY position",
            cl_dict["id"],
        )
        cl_dict["items"] = [dict(item) for item in items]
        checklists_data.append(cl_dict)
    card_dict["checklists"] = checklists_data

    # Fetch comments with user info
    comments_rows = await pool.fetch(
        """
        SELECT cm.*, u.name AS user_name, u.avatar_color AS user_avatar_color
        FROM comments cm
        JOIN users u ON cm.user_id = u.id
        WHERE cm.card_id = $1
        ORDER BY cm.created_at DESC
        """,
        card_id,
    )
    card_dict["comments"] = [dict(c) for c in comments_rows]

    return card_dict


@router.put("/cards/{card_id}")
async def update_card(card_id: int, card: CardUpdate):
    """Update card fields."""
    pool = get_pool()

    existing = await pool.fetchrow("SELECT * FROM cards WHERE id = $1", card_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Card not found")

    title = card.title if card.title is not None else existing["title"]
    description = card.description if card.description is not None else existing["description"]
    due_date = card.due_date if card.due_date is not None else existing["due_date"]
    is_archived = card.is_archived if card.is_archived is not None else existing["is_archived"]
    cover_color = card.cover_color if card.cover_color is not None else existing["cover_color"]
    list_id = card.list_id if card.list_id is not None else existing["list_id"]

    row = await pool.fetchrow(
        """UPDATE cards
           SET title = $1, description = $2, due_date = $3::timestamp,
               is_archived = $4, cover_color = $5, list_id = $6,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $7 RETURNING *""",
        title, description, due_date, is_archived, cover_color, list_id, card_id,
    )
    return dict(row)


@router.delete("/cards/{card_id}")
async def delete_card(card_id: int):
    """Delete a card permanently."""
    pool = get_pool()
    result = await pool.execute("DELETE FROM cards WHERE id = $1", card_id)
    if result == "DELETE 0":
        raise HTTPException(status_code=404, detail="Card not found")
    return {"message": "Card deleted successfully"}
