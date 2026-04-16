"""FastAPI application entry point."""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import connect_db, disconnect_db
from app.routes import boards, lists, cards, labels, checklists, comments, users, search


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application startup and shutdown."""
    await connect_db()
    yield
    await disconnect_db()


app = FastAPI(
    title="Trello Clone API",
    description="A Kanban-style project management API built with FastAPI",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routers
app.include_router(boards.router, prefix="/api", tags=["Boards"])
app.include_router(lists.router, prefix="/api", tags=["Lists"])
app.include_router(cards.router, prefix="/api", tags=["Cards"])
app.include_router(labels.router, prefix="/api", tags=["Labels"])
app.include_router(checklists.router, prefix="/api", tags=["Checklists"])
app.include_router(comments.router, prefix="/api", tags=["Comments"])
app.include_router(users.router, prefix="/api", tags=["Users"])
app.include_router(search.router, prefix="/api", tags=["Search"])


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "message": "Trello Clone API is running"}
