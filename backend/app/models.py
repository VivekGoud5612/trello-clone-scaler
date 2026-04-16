from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class BoardCreate(BaseModel):
    title: str
    background: str = "#0079BF"


class BoardUpdate(BaseModel):
    title: Optional[str] = None
    background: Optional[str] = None


class ListCreate(BaseModel):
    title: str

class ListUpdate(BaseModel):
    title: Optional[str] = None


class ListReorderItem(BaseModel):
    id: int
    position: int

class ListReorderRequest(BaseModel):
    board_id: int
    lists: list[ListReorderItem]


class CardCreate(BaseModel):
    title: str
    description: str = ""


class CardUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[str] = None
    is_archived: Optional[bool] = None
    cover_color: Optional[str] = None
    list_id: Optional[int] = None


class CardReorderItem(BaseModel):
    id: int
    list_id: int
    position: int


class CardReorderRequest(BaseModel):
    cards: list[CardReorderItem]


class CardMoveRequest(BaseModel):
    card_id: int
    source_list_id: int
    dest_list_id: int
    position: int


class LabelCreate(BaseModel):
    name: str = ""
    color: str


class LabelUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None


class ChecklistCreate(BaseModel):
    title: str = "Checklist"


class ChecklistUpdate(BaseModel):
    title: str


class ChecklistItemCreate(BaseModel):
    title: str


class ChecklistItemUpdate(BaseModel):
    title: Optional[str] = None
    is_completed: Optional[bool] = None


class CommentCreate(BaseModel):
    content: str
    user_id: int = 1


class CommentUpdate(BaseModel):
    content: str
