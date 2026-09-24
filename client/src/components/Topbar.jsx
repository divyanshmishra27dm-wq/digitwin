import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, LogOut, UserCircle, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

function initials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');
}

export default function Topbar({ onSearch, searchPlaceholder = 'Search' }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="topbar">
      {onSearch ? (
        <div className="topbar-search">
          <Search size={15} />
          <input placeholder={searchPlaceholder} onChange={(e) => onSearch(e.target.value)} />
        </div>
      ) : (
        <div />
      )}

      <div className="topbar-user" onClick={() => setMenuOpen((v) => !v)}>
        <div className="avatar-circle">{initials(user?.name)}</div>
        <div className="who">
          <div className="name">{user?.name}</div>
          <div className="role">
            {user?.role === 'admin'
              ? 'Administrator'
              : `${user?.title || 'Employee'} · ${user?.dept || 'Engineering'}`}
          </div>
        </div>

        {menuOpen && (
          <div className="user-menu" onMouseLeave={() => setMenuOpen(false)}>
            <button onClick={() => navigate('/profile')}>
              <UserCircle size={15} /> Profile
            </button>
            <button onClick={() => navigate('/profile')}>
              <Settings size={15} /> Settings
            </button>
            <button onClick={logout}>
              <LogOut size={15} /> Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
