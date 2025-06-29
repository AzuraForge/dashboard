import { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';

export const ThemeContext = createContext();

export function ThemeProvider({ children, setupChartDefaults }) {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return savedTheme || (prefersDark ? 'dark' : 'light');
  });

  const applyTheme = useCallback((currentTheme) => {
    const body = document.body;
    body.classList.toggle('light-theme', currentTheme === 'light');
    localStorage.setItem('theme', currentTheme);
    // Tema CSS'i uygulandıktan sonra Chart.js'i güncelle
    setTimeout(() => setupChartDefaults(currentTheme), 0);
  }, [setupChartDefaults]);

  useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const value = useMemo(() => ({ theme, toggleTheme }), [theme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
ThemeProvider.propTypes = { children: PropTypes.node.isRequired, setupChartDefaults: PropTypes.func.isRequired };