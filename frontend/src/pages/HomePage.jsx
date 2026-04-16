import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBoards, createBoard, deleteBoard } from '../api/api';

const BOARD_COLORS = [
  '#0079BF', '#D29034', '#519839', '#B04632',
  '#89609E', '#CD5A91', '#4BBF6B', '#00AECC',
  '#838C91',
];

export default function HomePage() {
  const [boards, setBoards] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newBg, setNewBg] = useState(BOARD_COLORS[0]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadBoards();
  }, []);

  const loadBoards = async () => {
    try {
      const res = await getBoards();
      setBoards(res.data);
    } catch (err) {
      console.error('Failed to load boards:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    try {
      const res = await createBoard({ title: newTitle, background: newBg });
      setBoards([res.data, ...boards]);
      setShowCreate(false);
      setNewTitle('');
      navigate(`/board/${res.data.id}`);
    } catch (err) {
      console.error('Failed to create board:', err);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!confirm('Delete this board and all its data?')) return;
    try {
      await deleteBoard(id);
      setBoards(boards.filter((b) => b.id !== id));
    } catch (err) {
      console.error('Failed to delete board:', err);
    }
  };

  if (loading) {
    return (
      <div className="home-page">
        <div className="loading"><div className="spinner" />Loading boards...</div>
      </div>
    );
  }

  return (
    <div className="home-page">
      <div className="home-header">
        <h1>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          Your Boards
        </h1>
      </div>

      <div className="boards-grid">
        {boards.map((board) => (
          <div
            key={board.id}
            className="board-tile"
            style={{ background: board.background }}
            onClick={() => navigate(`/board/${board.id}`)}
            data-testid={`board-tile-${board.id}`}
          >
            <span className="board-tile-title">{board.title}</span>
            <button
              className="board-tile-delete"
              onClick={(e) => handleDelete(e, board.id)}
              title="Delete board"
            >
              ✕
            </button>
          </div>
        ))}

        <div
          className="board-tile board-tile-create"
          onClick={() => setShowCreate(true)}
          data-testid="create-board-tile"
        >
          Create new board
        </div>
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Create Board</h2>

            <div
              style={{
                height: 120,
                borderRadius: 8,
                background: newBg,
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 24,
                fontWeight: 700,
              }}
            >
              {newTitle || 'Board Preview'}
            </div>

            <label>Board title *</label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Enter board title..."
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              data-testid="board-title-input"
            />

            <label style={{ marginTop: 12 }}>Background</label>
            <div className="color-picker">
              {BOARD_COLORS.map((color) => (
                <div
                  key={color}
                  className={`color-swatch ${newBg === color ? 'selected' : ''}`}
                  style={{ background: color }}
                  onClick={() => setNewBg(color)}
                />
              ))}
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowCreate(false)}>
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleCreate}
                disabled={!newTitle.trim()}
                data-testid="create-board-btn"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
