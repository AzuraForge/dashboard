import React from 'react';
import PropTypes from 'prop-types';
import styles from './LoadingSpinner.module.css';

function LoadingSpinner({ message = 'Yükleniyor...' }) {
  return (
    <div className={styles.spinnerContainer}>
      <div className={styles.spinner}></div>
      {message && <p className={styles.spinnerText}>{message}</p>}
    </div>
  );
}

LoadingSpinner.propTypes = {
  message: PropTypes.string,
};

export default LoadingSpinner;