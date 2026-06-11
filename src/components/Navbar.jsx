import React from 'react';
import { Search, Sun, Moon, Upload, LogIn, User, LogOut } from 'lucide-react';

export default function Navbar({ 
  searchQuery, 
  setSearchQuery, 
  theme, 
  toggleTheme, 
  currentUser, 
  onLogout, 
  openAuthModal, 
  openUploadModal,
  openDashboardModal,
  setCurrentView
}) {
  return (
    <nav className="navbar">
      <a href="/" className="nav-brand" onClick={(e) => { e.preventDefault(); setSearchQuery(''); if (setCurrentView) setCurrentView('home'); }}>
        <div className="brand-icon">
          <Upload size={20} />
        </div>
        <span className="brand-logo-text">VGU Study Hub</span>
      </a>

      <div className="nav-search-bar">
        <Search className="nav-search-icon" size={18} />
        <input 
          type="text" 
          placeholder="Search by subject, code, topic..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="nav-actions">
        <button className="btn btn-secondary" onClick={openUploadModal}>
          <Upload size={16} />
          <span>Upload</span>
        </button>

        <button className="btn-icon" onClick={toggleTheme} title="Toggle Theme">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {currentUser ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button className="user-profile-badge btn" onClick={openDashboardModal} style={{ cursor: 'pointer' }}>
              <div className="avatar">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <span>{currentUser.name}</span>
            </button>
            <button className="btn-icon" onClick={onLogout} title="Log Out" style={{ borderRadius: 'var(--border-radius-md)' }}>
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button className="btn btn-primary" onClick={openAuthModal}>
            <LogIn size={16} />
            <span>Login</span>
          </button>
        )}
      </div>
    </nav>
  );
}
