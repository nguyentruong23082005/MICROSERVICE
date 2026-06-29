import { createContext, useState, useCallback } from 'react';
import { login as apiLogin, logout as apiLogout, register as apiRegister, getCurrentUser } from '../services/authService.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getCurrentUser());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = useCallback(async (userName, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiLogin(userName, password);
      setUser(getCurrentUser());
      return data;
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại');
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

  const isAdmin = user?.role === 'ROLE_ADMIN';

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, error, login, logout, register, setError }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
