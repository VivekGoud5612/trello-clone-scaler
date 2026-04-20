import { useNavigate, useLocation } from 'react-router-dom';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const isBoard = location.pathname.startsWith('/board/');

  return (
    <header className="header" style={isBoard ? { background: 'rgba(0, 0, 0, 0.32)' } : {}}>
      <div className="header-left">
        {/* App Switcher */}
        <button className="header-btn" title="App switcher">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <rect x="4" y="4" width="4" height="4" rx="1" />
            <rect x="10" y="4" width="4" height="4" rx="1" />
            <rect x="16" y="4" width="4" height="4" rx="1" />
            <rect x="4" y="10" width="4" height="4" rx="1" />
            <rect x="10" y="10" width="4" height="4" rx="1" />
            <rect x="16" y="10" width="4" height="4" rx="1" />
            <rect x="4" y="16" width="4" height="4" rx="1" />
            <rect x="10" y="16" width="4" height="4" rx="1" />
            <rect x="16" y="16" width="4" height="4" rx="1" />
          </svg>
        </button>

        {/* Home Button */}
        <button className="header-btn" onClick={() => navigate('/')} title="Home">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </button>

        {/* Workspaces Dropdown */}
        <button className="header-btn">
          Workspaces
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        {/* Recent Dropdown */}
        <button className="header-btn">
          Recent
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        {/* Starred Dropdown */}
        <button className="header-btn">
          Starred
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        {/* Create Button */}
        <button className="header-create-btn" title="Create">
          Create
        </button>
      </div>

      {/* Logo Center */}
      <div className="header-logo" onClick={() => navigate('/')}>
        <svg viewBox="0 0 24 24">
          <linearGradient id="trello-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#579DFF" />
            <stop offset="100%" stopColor="#0C66E4" />
          </linearGradient>
          <rect x="2" y="2" width="9" height="20" rx="1.5" fill="url(#trello-gradient)" />
          <rect x="13" y="2" width="9" height="12" rx="1.5" fill="url(#trello-gradient)" />
        </svg>
        Trello
      </div>

      <div className="header-right">
        {/* Search */}
        <div className="header-search">
          <span className="header-search-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </span>
          <input placeholder="Search" />
        </div>

        {/* Notifications */}
        <button className="header-icon-btn" title="Notifications">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
          </svg>
        </button>

        {/* Info */}
        <button className="header-icon-btn" title="Information">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        {/* User Avatar */}
        <div
          className="header-avatar"
          title="Alex Johnson (Default User)"
        >
          AJ
        </div>
      </div>
    </header>
  );
}
