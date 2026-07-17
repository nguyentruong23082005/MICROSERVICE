import { useContext } from 'react';
import AuthContext from '../contexts/AuthContext.jsx';

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be inside AuthProvider');
  return ctx;
}

export const useAuth = () => useAuthContext();
export default useAuth;
