import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import styles from './TopNavbar.module.css'; // TopNavbar stilini kullanır

function Logo({ size = 36 }) {
  return (
    <Link to="/" className={styles.logoContainer}>
      <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ flexShrink: 0 }}>
        <defs>
          <linearGradient id="azura-stream-gradient-component" x1="15" y1="50" x2="85" y2="50" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="var(--secondary-color)"/>
            <stop offset="100%" stopColor="var(--primary-color)"/>
          </linearGradient>
        </defs>
        <path d="M50 10 L10 90 H32 L42 70 H58 L68 90 H90 Z" fill="var(--content-bg)" stroke="var(--text-color-darker)" strokeWidth="4" strokeLinejoin="round"/>
        <path d="M15 55 C 35 45, 65 45, 85 55" stroke="url(#azura-stream-gradient-component)" strokeWidth="8" strokeLinecap="round" fill="none"/>
      </svg>
      <h1>AzuraForge</h1>
    </Link>
  );
}
Logo.propTypes = { size: PropTypes.number, };
export default Logo;