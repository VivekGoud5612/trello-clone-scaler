import { useNavigate, useLocation } from 'react-router-dom';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const isBoard = location.pathname.startsWith('/board/');

  return (
    <header className="header" style={isBoard ? {} : { background: 'rgba(9,30,66,.72)' }}>
      <div className="header-logo" onClick={() => navigate('/')}>
        <svg viewBox="0 0 24 24" fill="currentColor">
          <rect x="1" y="1" width="10" height="22" rx="2" />
          <rect x="13" y="1" width="10" height="14" rx="2" />
        </svg>
        TaskFlow
      </div>
      <div className="header-right">
        <div
          className="header-avatar"
          style={{ background: '#0079BF' }}
          title="Alex Johnson (Default User)"
        >
          AJ
        </div>
      </div>
    </header>
  );
}
