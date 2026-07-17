import { createContext, useState, useCallback, useEffect } from 'react';
import {
  login as apiLogin,
  firebaseLogin as apiFirebaseLogin,
  logout as apiLogout,
  register as apiRegister,
  getCurrentUser,
  adminLogin as apiAdminLogin,
  adminLogout as apiAdminLogout,
  getCurrentAdmin,
} from '../services/authService.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  /* Customer session */
  const [user, setUser] = useState(() => getCurrentUser());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /* Admin session (independent) */
  const [adminUser, setAdminUser] = useState(() => getCurrentAdmin());

  useEffect(() => {
    const handleUnauthorized = (event) => {
      if (event.detail?.scope === 'admin') {
        setAdminUser(null);
        return;
      }
      setUser(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = useCallback(async (identifier, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiLogin(identifier, password);
      setUser(getCurrentUser());
      return data;
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const firebaseLogin = useCallback(async (idToken) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFirebaseLogin(idToken);
      setUser(getCurrentUser());
      return data;
    } catch (err) {
      setError(err.message || 'Đăng nhập mạng xã hội thất bại');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRegister(payload);
      return data;
    } catch (err) {
      setError(err.message || 'Đăng ký thất bại');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
    setError(null);
  }, []);

  /* Admin auth */
  const adminLogin = useCallback(async (identifier, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiAdminLogin(identifier, password);
      setAdminUser(getCurrentAdmin());
      return data;
    } catch (err) {
      setError(err.message || 'Đăng nhập admin thất bại');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const adminLogout = useCallback(async () => {
    await apiAdminLogout();
    setAdminUser(null);
    setError(null);
  }, []);

  const isAdmin = adminUser?.role === 'ROLE_ADMIN';

  return (
    <AuthContext.Provider value={{
      user, loading, error, login, firebaseLogin, logout, register, setError,
      adminUser, isAdmin, adminLogin, adminLogout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;

