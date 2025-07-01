// dashboard/src/components/TopNavbar.jsx

import React from 'react';
import PropTypes from 'prop-types';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';

function TopNavbar({ onNewExperimentClick }) {
  return (
    <nav className="top-navbar">
      <Logo />
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
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