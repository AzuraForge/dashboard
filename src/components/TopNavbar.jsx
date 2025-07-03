// dashboard/src/components/TopNavbar.jsx
import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';
import styles from './TopNavbar.module.css';
import { useAuth } from '../context/AuthContext'; // <-- useAuth eklendi

function TopNavbar({ onNewExperimentClick }) {
  const { isAuthenticated, user, logout } = useAuth(); // <-- Auth context'ten bilgi al

  const navLinkStyles = ({ isActive }) => ({
    textDecoration: 'none',
    fontWeight: isActive ? '700' : '500',
    color: isActive ? 'var(--primary-color)' : 'var(--text-color)',
    borderColor: isActive ? 'var(--primary-color)' : 'transparent'
  });

  return (
    <header className={styles.navbar}>
      <div className={styles.leftSection}>
        <Logo />
        <nav className={styles.navLinks}>
          <NavLink to="/" style={navLinkStyles} end>Deneyler</NavLink>
          <NavLink to="/models" style={navLinkStyles}>Model Kütüphanesi</NavLink>
        </nav>
      </div>
      <div className={styles.rightSection}>
        {isAuthenticated && (
          <>
            <button className="button-primary" onClick={onNewExperimentClick}>
              <span role="img" aria-label="rocket">🚀</span> Yeni Deney
            </button>
            <div className={styles.userInfo}>
              <span className={styles.username}>{user.username}</span>
              <button onClick={logout} className={styles.logoutButton}>Çıkış Yap</button>
            </div>
          </>
        )}
        <ThemeToggle />
      </div>
    </header>
  );
}

TopNavbar.propTypes = {
  onNewExperimentClick: PropTypes.func.isRequired,
};

export default TopNavbar;