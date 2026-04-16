"""Board management routes."""

from fastapi import APIRouter, HTTPException
from app.database import get_pool
from app.models import BoardCreate, BoardUpdate

router = APIRouter()

DEFAULT_LABELS = [
    ("", "#61BD4F"),
    ("", "#F2D600"),
    ("", "#FF9F1A"),
    ("", "#EB5A46"),
    ("", "#C377E0"),
    ("", "#0079BF"),
]


@router.get("/boards")
async def list_boards():
    """Get all boards."""
    pool = get_pool()
    rows = await pool.fetch(
        "SELECT * FROM boards ORDER BY created_at DESC"
    )
    return [dict(r) for r in rows]


@router.post("/boards", status_code=201)
async def create_board(board: BoardCreate):
    """Create a new board with default labels."""
    pool = get_pool()
    row = await pool.fetchrow(
        "INSERT INTO boards (title, background) VALUES ($1, $2) RETURNING *",
        board.title, board.background,
    )
    board_dict = dict(row)

    # Create default labels for the new board
    for name, color in DEFAULT_LABELS:
        await pool.execute(
            "INSERT INTO labels (board_id, name, color) VALUES ($1, $2, $3)",
            board_dict["id"], name, color,
        )

    return board_dict


@router.get("/boards/{board_id}")
async def get_board(board_id: int):
    """Get a board with all its lists and cards."""
    pool = get_pool()

    board = await pool.fetchrow("SELECT * FROM boards WHERE id = $1", board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")

    board_dict = dict(board)

    # Fetch lists ordered by position
    lists_rows = await pool.fetch(
        "SELECT * FROM lists WHERE board_id = $1 ORDER BY position",
        board_id,
    )

    lists_data = []
    for lst in lists_rows:
        lst_dict = dict(lst)

        # Fetch cards with labels, members, and checklist counts
        cards_rows = await pool.fetch(
            """
            SELECT c.*,
                COALESCE(
                    (SELECT json_agg(json_build_object(
                        'id', l.id, 'name', l.name, 'color', l.color
                    ))
                    FROM card_labels cl JOIN labels l ON cl.label_id = l.id
                    WHERE cl.card_id = c.id),
                    '[]'
                )::jsonb AS labels,
                COALESCE(
                    (SELECT json_agg(json_build_object(
                        'id', u.id, 'name', u.name, 'avatar_color', u.avatar_color
                    ))
                    FROM card_members cm JOIN users u ON cm.user_id = u.id
                    WHERE cm.card_id = c.id),
                    '[]'
                )::jsonb AS members,
                (SELECT COUNT(*) FROM checklist_items ci
                 JOIN checklists ch ON ci.checklist_id = ch.id
                 WHERE ch.card_id = c.id)::int AS checklist_total,
                (SELECT COUNT(*) FROM checklist_items ci
                 JOIN checklists ch ON ci.checklist_id = ch.id
                 WHERE ch.card_id = c.id AND ci.is_completed = TRUE)::int AS checklist_completed
            FROM cards c
            WHERE c.list_id = $1 AND c.is_archived = FALSE
            ORDER BY c.position
            """,
            lst_dict["id"],
        )
        lst_dict["cards"] = [dict(c) for c in cards_rows]
        lists_data.append(lst_dict)

    board_dict["lists"] = lists_data
    return board_dict


@router.put("/boards/{board_id}")
async def update_board(board_id: int, board: BoardUpdate):
    """Update a board's title or background."""
    pool = get_pool()

    existing = await pool.fetchrow("SELECT * FROM boards WHERE id = $1", board_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Board not found")

    title = board.title if board.title is not None else existing["title"]
    background = board.background if board.background is not None else existing["background"]

    row = await pool.fetchrow(
        """UPDATE boards
           SET title = $1, background = $2, updated_at = CURRENT_TIMESTAMP
           WHERE id = $3 RETURNING *""",
        title, background, board_id,
    )
    return dict(row)


@router.delete("/boards/{board_id}")
async def delete_board(board_id: int):
    """Delete a board and all its data (cascading)."""
    pool = get_pool()
    result = await pool.execute("DELETE FROM boards WHERE id = $1", board_id)
    if result == "DELETE 0":
        raise HTTPException(status_code=404, detail="Board not found")
    return {"message": "Board deleted successfully"}
