import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../helper/apiClient.js';
import socket from '../helper/socket.js';
import styles from '../css/Navbar.module.css';

function Navbar({ user, setUser }) {
  const [profileImage, setProfileImage] = useState('https://via.placeholder.com/40');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      apiClient.getUser(user.id)
        .then(data => {
          if (data.image) {
            setProfileImage(data.image);
          }
        })
        .catch(err => {
          console.error('Navbar: Error fetching user image:', err);
        });
    }
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    if (user) {
      socket.emit('unregister', { user_id: user.id });
    }
    socket.disconnect();
    setUser(null);
    navigate('/login');
  };

  // If user is authenticated, render the vertical left sidebar navigation
  if (user) {
    return (
      <aside className={styles.sidebarNav}>
        <div className={styles.sidebarBrand}>
          <Link to="/" className={styles.brandTitle}>The Archive</Link>
          <span className={styles.brandSubtitle}>CURATED MESSAGING</span>
        </div>

        <button onClick={() => navigate('/users')} className={styles.newEntryBtn}>
          ＋ NEW ENTRY
        </button>

        <nav className={styles.sidebarMenu}>
          <Link
            to="/users"
            className={`${styles.sidebarLink} ${location.pathname.startsWith('/users') || location.pathname.startsWith('/chat') ? styles.activeLink : ''}`}
          >
            <span className={styles.menuIcon}>■</span> ARCHIVES
          </Link>
          <Link
            to="/profile"
            className={`${styles.sidebarLink} ${location.pathname === '/profile' ? styles.activeLink : ''}`}
          >
            <span className={styles.menuIcon}>▤</span> DIRECTORY
          </Link>
          <Link
            to="/settings"
            className={`${styles.sidebarLink} ${location.pathname === '/settings' ? styles.activeLink : ''}`}
          >
            <span className={styles.menuIcon}>⚙</span> SETTINGS
          </Link>
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.footerLinksRow}>
            <Link to="/settings" className={styles.footerLink}>SETTINGS</Link>
            <span className={styles.footerDivider}>•</span>
            <button onClick={handleLogout} className={styles.logoutBtn}>LOGOUT</button>
          </div>
          
          <div className={styles.userProfileBlock}>
            <img
              src={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}${user.image || '/default.png'}`}
              alt="Profile"
              className={styles.userAvatar}
              onClick={() => navigate('/profile')}
            />
            <div className={styles.userInfoBlock} onClick={() => navigate('/profile')}>
              <div className={styles.userName}>{user.username}</div>
              <div className={styles.userRole}>Lead Archivist</div>
            </div>
          </div>
        </div>
      </aside>
    );
  }

  // If public visitor (unauthenticated), render the horizontal top header navigation
  return (
    <header className={styles.topNav}>
      <div className={styles.brandGroup}>
        <Link to="/" className={styles.topBrandTitle}>The Archive</Link>
        <span className={styles.topBrandSubtitle}>CURATED MESSAGING</span>
      </div>
      <nav className={styles.topMenu}>
        <Link to="/login" className={styles.topNavLink}>LOGIN</Link>
        <Link to="/register" className={styles.topNavLink}>REGISTER</Link>
      </nav>
    </header>
  );
}

export default Navbar;
