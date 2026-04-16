"""Search and filter routes."""

from fastapi import APIRouter, Query
from typing import Optional
from app.database import get_pool

router = APIRouter()


@router.get("/search")
async def search_cards(
    board_id: int = Query(..., description="Board ID to search within"),
    q: Optional[str] = Query(None, description="Search query for card title"),
    label_id: Optional[int] = Query(None, description="Filter by label ID"),
    member_id: Optional[int] = Query(None, description="Filter by member user ID"),
    due_date: Optional[str] = Query(None, description="Filter: 'overdue', 'today', 'week', 'none'"),
):
    """Search and filter cards within a board."""
    pool = get_pool()

    conditions = ["l.board_id = $1", "c.is_archived = FALSE"]
    params: list = [board_id]
    param_idx = 2

    # Text search
    if q:
        conditions.append(f"(c.title ILIKE ${param_idx} OR c.description ILIKE ${param_idx})")
        params.append(f"%{q}%")
        param_idx += 1

    # Label filter
    if label_id is not None:
        conditions.append(
            f"EXISTS (SELECT 1 FROM card_labels cl WHERE cl.card_id = c.id AND cl.label_id = ${param_idx})"
        )
        params.append(label_id)
        param_idx += 1

    # Member filter
    if member_id is not None:
        conditions.append(
            f"EXISTS (SELECT 1 FROM card_members cm WHERE cm.card_id = c.id AND cm.user_id = ${param_idx})"
        )
        params.append(member_id)
        param_idx += 1

    # Due date filter
    if due_date == "overdue":
        conditions.append("c.due_date < CURRENT_TIMESTAMP")
    elif due_date == "today":
        conditions.append("c.due_date::date = CURRENT_DATE")
    elif due_date == "week":
        conditions.append("c.due_date BETWEEN CURRENT_TIMESTAMP AND CURRENT_TIMESTAMP + INTERVAL '7 days'")
    elif due_date == "none":
        conditions.append("c.due_date IS NULL")

    where_clause = " AND ".join(conditions)

    query = f"""
        SELECT c.*,
            l.title AS list_title,
            COALESCE(
                (SELECT json_agg(json_build_object(
                    'id', lb.id, 'name', lb.name, 'color', lb.color
                ))
                FROM card_labels cl2 JOIN labels lb ON cl2.label_id = lb.id
                WHERE cl2.card_id = c.id), '[]'
            )::jsonb AS labels,
            COALESCE(
                (SELECT json_agg(json_build_object(
                    'id', u.id, 'name', u.name, 'avatar_color', u.avatar_color
                ))
                FROM card_members cm2 JOIN users u ON cm2.user_id = u.id
                WHERE cm2.card_id = c.id), '[]'
            )::jsonb AS members
        FROM cards c
        JOIN lists l ON c.list_id = l.id
        WHERE {where_clause}
        ORDER BY c.updated_at DESC
        LIMIT 50
    """

    rows = await pool.fetch(query, *params)
    return [dict(r) for r in rows]
