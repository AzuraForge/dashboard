import React from 'react';
import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';
import styles from './TopNavbar.module.css';

function TopNavbar({ onNewExperimentClick }) {
  // Aktif link stili için
  const navLinkStyles = ({ isActive }) => {
    return {
      textDecoration: 'none',
      fontWeight: isActive ? '700' : '500',
      color: isActive ? 'var(--primary-color)' : 'var(--text-color)',
      borderColor: isActive ? 'var(--primary-color)' : 'transparent'
    };
  };

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
        <button className="button-primary" onClick={onNewExperimentClick}>
          <span role="img" aria-label="rocket">🚀</span> Yeni Deney
        </button>
        <ThemeToggle />
      </div>
    </header>
  );
}

TopNavbar.propTypes = {
  onNewExperimentClick: PropTypes.func.isRequired,
};

export default TopNavbar;