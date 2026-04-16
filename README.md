# TaskFlow - Trello Clone

A full-stack Kanban-style project management application built with **FastAPI** + **React**, replicating Trello's core features and design patterns.

# Developer Profile: AI/ML Specialization
While this is a Full-Stack project, my core expertise lies in Artificial Intelligence and Machine Learning. I chose the FastAPI + Python ecosystem specifically because it allows for seamless integration of ML models into the backend—bridging the gap between complex research and production-ready user interfaces.

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite, @hello-pangea/dnd, React Router, Axios |
| **Backend** | Python 3.11+, FastAPI, asyncpg |
| **Database** | PostgreSQL |
| **Package Mgmt** | uv (backend), npm (frontend) |
| **Testing** | pytest + pytest-asyncio (backend), Vitest + Testing Library (frontend) |

## 📁 Project Structure

```
trello-clone/
├── docker-compose.yml          # PostgreSQL container
├── backend/
│   ├── pyproject.toml          # uv + Python deps
│   ├── app/
│   │   ├── main.py             # FastAPI app entry
│   │   ├── database.py         # asyncpg pool management
│   │   ├── models.py           # Pydantic request models
│   │   └── routes/
│   │       ├── boards.py       # Board CRUD
│   │       ├── lists.py        # List CRUD + reorder
│   │       ├── cards.py        # Card CRUD + reorder + move
│   │       ├── checklists.py   # Checklist/item CRUD
│   │       ├── misc.py         # Labels, users, comments, members
│   │       └── search.py       # Advanced search/filter
│   ├── db/
│   │   ├── schema.sql          # Full database schema
│   │   └── seed.sql            # Sample data
│   └── tests/                  # 75 pytest tests
│       ├── conftest.py
│       ├── test_boards.py
│       ├── test_lists.py
│       ├── test_cards.py
│       ├── test_checklists.py
│       └── test_misc.py
└── frontend/
    ├── vite.config.js          # Vite + API proxy
    ├── src/
    │   ├── App.jsx             # Router setup
    │   ├── index.css           # Complete Trello-like CSS
    │   ├── api/api.js          # API service layer
    │   ├── pages/
    │   │   ├── HomePage.jsx    # Board grid + create modal
    │   │   └── BoardPage.jsx   # Kanban board with DnD
    │   ├── components/
    │   │   ├── Header/
    │   │   ├── BoardView/
    │   │   │   └── CardItem.jsx
    │   │   └── CardDetail/
    │   │       └── CardDetailModal.jsx
    │   └── __tests__/          # 19 Vitest tests
    └── package.json
```
### Backend (Python 3.10+)
FastAPI: Used for building high-speed REST endpoints with Pydantic for request validation.

uvicorn: The ASGI server running the app at localhost:8001.

asyncpg: A high-performance, non-blocking PostgreSQL driver. I chose this over standard drivers because it handles concurrent requests significantly faster, which is critical for real-time board updates.

psycopg2-binary: Used specifically for structural migrations and schema setup, as it handles complex DDL (Data Definition Language) commands reliably.

### Frontend (React + JSX)
Vite: Used for a fast development environment and optimized production builds.

Axios: For handling the "handshake" between the UI and the FastAPI backend.

Optimistic UI Updates: The frontend is designed to reflect changes (like moving a card) instantly, syncing with the database in the background for a lag-free experience.

### Prerequisites
- Python 3.11+ & [uv](https://docs.astral.sh/uv/)
- Node.js 18+


### The "Intelligence Head" Edge

#### 1. The Midpoint Algorithm (Positioning)
Instead of using simple integers for card ordering—which requires a massive "re-index" of every card when one is moved—I implemented Fractional Indexing:
$$P_{new} = \frac{P_{prev} + P_{next}}{2}$$
This ensures $O(1)$ performance.
The database only needs to update one row when a card is moved.

#### 2. Transaction Pooling & PgBouncerDuring development,
I encountered the "Prepared Statement" error common in serverless environments. I resolved this by:Connecting to the Transaction Pool (Port 6543) via PgBouncer.Disabling the statement cache (statement_cache_size=0) in asyncpg to ensure stable connections even when the pooler rotates sessions.

#### 3. Direct Connection vs. Supabase Client
I intentionally avoided the supabase-js client.The Reason: Client libraries often abstract away complex SQL features.The Solution: By using a direct postgresql:// connection, I was able to write complex Joins (fetching Boards, Lists, and Cards in one shot) and use Full-Text Search via tsvector, which provides a much faster and more flexible search experience.


### 2. Start Backend
```bash
cd backend
uv sync --all-extras
uv run uvicorn app.main:app --reload
# API available at http://localhost:8000
```

### 3. Start Frontend
```bash
cd frontend
npm install
npm run dev
# App available at http://localhost:5173
```

## ✅ Features

### Board Management
- Create boards with custom background colors
- Rename boards inline
- Delete boards with confirmation

### List Management
- Create, rename, delete lists
- Drag & drop to reorder lists

### Card Management
- Create, edit, delete cards
- Full drag & drop between lists (cross-list move)
- Card covers with color selection
- Due dates with overdue/today highlighting
- Archive cards

### Labels
- Color-coded labels per board
- Toggle labels on/off per card
- Expandable label display on cards

### Checklists
- Create multiple checklists per card
- Add/toggle/delete checklist items
- Visual progress bar with percentage

### Members
- Assign/unassign members to cards
- Avatar display on cards

### Comments
- Add/delete comments on cards
- User avatar and timestamp display

### Search & Filter
- Full-text search across cards
- Filter by label, member, due date
- Real-time search results dropdown

## 🧪 Running Tests

### Backend (75 tests)
```bash
cd backend
uv run pytest -v
```

### Frontend (19 tests)
```bash
cd frontend
npx vitest run
```

## 📐 Database Schema

The schema includes 9 tables with proper relationships:
- `users`, `boards`, `lists`, `cards`
- `labels`, `card_labels` (junction)
- `card_members` (junction)
- `checklists`, `checklist_items`
- `comments`, `activity_log`

All foreign keys use `ON DELETE CASCADE` for data integrity.

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/boards` | List all boards |
| POST | `/api/boards` | Create board |
| GET | `/api/boards/{id}` | Get board with lists & cards |
| PUT | `/api/boards/{id}` | Update board |
| DELETE | `/api/boards/{id}` | Delete board |
| GET | `/api/boards/{id}/lists` | Get lists for board |
| POST | `/api/boards/{id}/lists` | Create list |
| PUT | `/api/lists/reorder` | Reorder lists |
| PUT | `/api/lists/{id}` | Update list |
| DELETE | `/api/lists/{id}` | Delete list |
| GET | `/api/lists/{id}/cards` | Get cards for list |
| POST | `/api/lists/{id}/cards` | Create card |
| PUT | `/api/cards/reorder` | Reorder cards |
| PUT | `/api/cards/move` | Move card between lists |
| GET | `/api/cards/{id}` | Get card details |
| PUT | `/api/cards/{id}` | Update card |
| DELETE | `/api/cards/{id}` | Delete card |
| POST/DELETE | `/api/cards/{id}/labels/{lid}` | Toggle label |
| POST/DELETE | `/api/cards/{id}/members/{uid}` | Toggle member |
| GET/POST | `/api/cards/{id}/checklists` | Checklists |
| POST | `/api/checklists/{id}/items` | Add item |
| PUT/DELETE | `/api/checklist-items/{id}` | Update/delete item |
| GET/POST | `/api/cards/{id}/comments` | Comments |
| GET | `/api/search` | Search cards |

