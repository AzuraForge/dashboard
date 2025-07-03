import React from 'react';
import PropTypes from 'prop-types';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';
import styles from './TopNavbar.module.css';

function TopNavbar({ onNewExperimentClick }) {
  return (
    <nav className={styles.navbar}>
      <Logo />
      <div className={styles.rightSection}>
        <button className="button-primary" onClick={onNewExperimentClick}>
          <span role="img" aria-label="rocket">🚀</span> Yeni Deney Başlat
        </button>
        <ThemeToggle />
      </div>
    </nav>
  );
}

TopNavbar.propTypes = {
  onNewExperimentClick: PropTypes.func.isRequired,
};

export default TopNavbar;