# Trello Clone - Project Requirements Document

## Original Problem Statement
Redesign the frontend of a Kanban-style project management web application (Trello clone) to closely match Trello's actual design and UX patterns. The backend should remain untouched.

### Key Requirements:
- Close replication of Trello's UI design
- Dark theme matching Trello's current design
- Board management with tiles and color backgrounds
- Lists management with drag-and-drop
- Cards with labels, due dates, checklists, and member assignments
- Card detail modal with all Trello features
- Search and filter functionality

## Tech Stack
- **Frontend**: React.js with Vite
- **Backend**: Python FastAPI (not modified)
- **Database**: PostgreSQL (requires DB_URL configuration)
- **Drag & Drop**: @hello-pangea/dnd library

## Architecture
```
/app/frontend/
├── src/
│   ├── App.jsx              # Main app with routing
│   ├── index.css            # Complete Trello-style CSS
│   ├── api/api.js           # API client
│   ├── pages/
│   │   ├── HomePage.jsx     # Board listing page
│   │   └── BoardPage.jsx    # Kanban board view
│   └── components/
│       ├── Header/Header.jsx       # Trello-style navbar
│       ├── BoardView/CardItem.jsx  # Card component
│       └── CardDetail/CardDetailModal.jsx  # Card detail modal
```

## What's Been Implemented

### Date: January 2026

#### Frontend Redesign (Complete)
1. **Global Styling (index.css)**
   - Complete Trello-like dark theme
   - CSS variables for brand colors
   - Responsive design for mobile/tablet/desktop
   - Animations and transitions
   - Card, list, modal, and popover styles

2. **Header Component**
   - Trello logo with SVG gradient
   - Navigation buttons (Workspaces, Recent, Starred)
   - Create button with Trello blue
   - Search bar with expand animation
   - User avatar with initials

3. **HomePage**
   - Dark background (#1D2125)
   - "YOUR WORKSPACES" section
   - Workspace branding
   - Board tiles with hover effects
   - Create new board tile
   - Create board modal with preview

4. **BoardPage**
   - Board header with title editing
   - Filter and search functionality
   - Horizontal scrolling list canvas
   - Drag & drop for lists and cards
   - Add list/card forms

5. **CardItem Component**
   - Cover color support
   - Labels (collapsed/expanded)
   - Badges (due date, description, checklist, attachments)
   - Member avatars
   - Quick edit button

6. **CardDetailModal**
   - Cover section
   - Title editing
   - Members, Labels, Due date quick info
   - Description section
   - Checklists with progress
   - Comments/Activity section
   - Sidebar with action buttons
   - Popovers for labels, members, dates, cover

## Backend Requirements (Not Modified)
The backend requires a PostgreSQL database connection. Set the `DB_URL` environment variable:
```
DB_URL=postgresql://user:password@host:port/database
```

## Prioritized Backlog

### P0 - Critical
- [x] Frontend redesign to match Trello

### P1 - High Priority
- [ ] Backend database configuration (requires DB_URL)
- [ ] Seed sample data for testing

### P2 - Medium Priority
- [ ] File attachments on cards
- [ ] Board background images
- [ ] Activity log on cards

### P3 - Low Priority
- [ ] Multiple workspaces support
- [ ] Card covers with images
- [ ] Advanced keyboard shortcuts

## Next Tasks
1. Configure PostgreSQL database URL (DB_URL)
2. Run database migrations/seeding
3. Test full end-to-end functionality with backend
4. Add sample data for demo

## Notes
- App name changed from "TaskFlow" to "Trello"
- All backend logic preserved as requested
- Frontend tested and verified matching Trello design
