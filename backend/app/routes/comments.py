"""Comment management routes."""

from fastapi import APIRouter, HTTPException
from app.database import get_pool
from app.models import CommentCreate, CommentUpdate

router = APIRouter()


@router.get("/cards/{card_id}/comments")
async def get_comments(card_id: int):
    """Get all comments for a card with user info."""
    pool = get_pool()
    rows = await pool.fetch(
        """
        SELECT cm.*, u.name AS user_name, u.avatar_color AS user_avatar_color
        FROM comments cm
        JOIN users u ON cm.user_id = u.id
        WHERE cm.card_id = $1
        ORDER BY cm.created_at DESC
        """,
        card_id,
    )
    return [dict(r) for r in rows]


@router.post("/cards/{card_id}/comments", status_code=201)
async def create_comment(card_id: int, comment: CommentCreate):
    """Add a comment to a card."""
    pool = get_pool()

    card = await pool.fetchrow("SELECT id FROM cards WHERE id = $1", card_id)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    row = await pool.fetchrow(
        """INSERT INTO comments (card_id, user_id, content)
           VALUES ($1, $2, $3) RETURNING *""",
        card_id, comment.user_id, comment.content,
    )
    comment_dict = dict(row)

    # Fetch user info
    user = await pool.fetchrow("SELECT name, avatar_color FROM users WHERE id = $1", comment.user_id)
    if user:
        comment_dict["user_name"] = user["name"]
        comment_dict["user_avatar_color"] = user["avatar_color"]

    return comment_dict


@router.put("/comments/{comment_id}")
async def update_comment(comment_id: int, comment: CommentUpdate):
    """Update a comment's content."""
    pool = get_pool()
    row = await pool.fetchrow(
        """UPDATE comments SET content = $1, updated_at = CURRENT_TIMESTAMP
           WHERE id = $2 RETURNING *""",
        comment.content, comment_id,
    )
    if not row:
        raise HTTPException(status_code=404, detail="Comment not found")
    return dict(row)


@router.delete("/comments/{comment_id}")
async def delete_comment(comment_id: int):
    """Delete a comment."""
    pool = get_pool()
    result = await pool.execute("DELETE FROM comments WHERE id = $1", comment_id)
    if result == "DELETE 0":
        raise HTTPException(status_code=404, detail="Comment not found")
    return {"message": "Comment deleted successfully"}
