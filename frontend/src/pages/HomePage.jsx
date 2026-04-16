import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBoards, createBoard, deleteBoard } from '../api/api';

const BOARD_COLORS = [
  '#0079BF',
  '#D29034', 
  '#519839',
  '#B04632',
  '#89609E',
  '#CD5A91',
  '#4BBF6B',
  '#00AECC',
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
        <div className="loading">
          <div className="spinner" />
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="home-page">
      <div className="home-container">
        {/* Starred Boards Section (placeholder) */}
        {boards.filter(b => b.starred).length > 0 && (
          <div className="home-section">
            <div className="home-section-header">
              <div className="home-section-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <h2 className="home-section-title">Starred boards</h2>
            </div>
            <div className="boards-grid">
              {boards.filter(b => b.starred).map((board) => (
                <div
                  key={board.id}
                  className="board-tile"
                  style={{ background: board.background }}
                  onClick={() => navigate(`/board/${board.id}`)}
                  data-testid={`board-tile-${board.id}`}
                >
                  <div className="board-tile-content">
                    <span className="board-tile-title">{board.title}</span>
                  </div>
                  <button
                    className="board-tile-star"
                    onClick={(e) => e.stopPropagation()}
                    title="Click to unstar"
                  >
                    ★
                  </button>
                  <button
                    className="board-tile-delete"
                    onClick={(e) => handleDelete(e, board.id)}
                    title="Delete board"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Your Workspaces */}
        <div className="home-section">
          <div className="home-section-header">
            <div className="home-section-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
              </svg>
            </div>
            <h2 className="home-section-title">YOUR WORKSPACES</h2>
          </div>

          {/* Workspace Header */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            marginBottom: '12px',
            paddingLeft: '4px'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '4px',
              background: 'linear-gradient(135deg, #0052CC 0%, #0747A6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: '700',
              fontSize: '14px'
            }}>
              T
            </div>
            <span style={{ fontWeight: '600', color: '#B6C2CF' }}>Trello Workspace</span>
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
                <div className="board-tile-content">
                  <span className="board-tile-title">{board.title}</span>
                </div>
                <button
                  className="board-tile-star"
                  onClick={(e) => e.stopPropagation()}
                  title="Click to star"
                >
                  ☆
                </button>
                <button
                  className="board-tile-delete"
                  onClick={(e) => handleDelete(e, board.id)}
                  title="Delete board"
                >
                  ✕
                </button>
              </div>
            ))}

            {/* Create Board Tile */}
            <div
              className="board-tile board-tile-create"
              onClick={() => setShowCreate(true)}
              data-testid="create-board-tile"
            >
              <span>Create new board</span>
            </div>
          </div>
        </div>
      </div>

      {/* Create Board Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create board</h2>
              <button className="modal-close-btn" onClick={() => setShowCreate(false)}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              {/* Board Preview */}
              <div
                className="board-preview"
                style={{ background: newBg }}
              >
                <div className="board-preview-content">
                  <div className="preview-list" />
                  <div className="preview-list" />
                  <div className="preview-list" style={{ height: '32px' }} />
                </div>
              </div>

              {/* Background Picker */}
              <label className="modal-label">Background</label>
              <div className="bg-picker">
                {BOARD_COLORS.slice(0, 6).map((color) => (
                  <div
                    key={color}
                    className={`bg-swatch ${newBg === color ? 'selected' : ''}`}
                    style={{ background: color }}
                    onClick={() => setNewBg(color)}
                  />
                ))}
              </div>

              {/* Board Title Input */}
              <label className="modal-label">
                Board title <span style={{ color: '#F87168' }}>*</span>
              </label>
              <input
                type="text"
                className="modal-input"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder=""
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                data-testid="board-title-input"
              />

              {!newTitle.trim() && (
                <p style={{ 
                  fontSize: '12px', 
                  color: '#F87168', 
                  marginTop: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span>👋</span> Board title is required
                </p>
              )}
            </div>

            <div className="modal-footer">
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
