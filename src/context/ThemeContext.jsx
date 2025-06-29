import { createContext, useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';

export const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return savedTheme || (prefersDark ? 'dark' : 'light');
  });

  useEffect(() => {
    const body = document.body;
    // body'nin class'ını mevcut temaya göre ayarla
    body.classList.toggle('light-theme', theme === 'light');
    // Seçimi tarayıcı hafızasına kaydet
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  // Sadece theme ve toggleTheme'i dışarıya veriyoruz.
  const value = useMemo(() => ({ theme, toggleTheme }), [theme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

ThemeProvider.propTypes = {
  children: PropTypes.node.isRequired,
};