// dashboard/src/context/AuthContext.jsx
import { createContext, useState, useEffect, useMemo, useCallback, useContext } from 'react';
import PropTypes from 'prop-types';
import { jwtDecode } from 'jwt-decode';
import { loginUser, setAuthHeader, clearAuthHeader } from '../services/api';
import { handleApiError } from '../utils/errorHandler';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('azuraforge_token'));
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      if (token) {
        const decodedUser = jwtDecode(token);
        const isTokenExpired = decodedUser.exp * 1000 < Date.now();
        if (isTokenExpired) {
          logout();
        } else {
          setUser({ username: decodedUser.sub });
          setAuthHeader(token);
        }
      }
    } catch (error) {
      console.error("Invalid token found, logging out.", error);
      logout();
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const login = useCallback(async (username, password) => {
    try {
      const { data } = await loginUser(username, password);
      localStorage.setItem('azuraforge_token', data.access_token);
      setToken(data.access_token);
      return true;
    } catch (error) {
      handleApiError(error, "giriş yapma");
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('azuraforge_token');
    setToken(null);
    setUser(null);
    clearAuthHeader();
  }, []);

  const value = useMemo(() => ({
    token,
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  }), [token, user, isLoading, login, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};