import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ClientLayout from '../../../components/layout/ClientLayout.jsx';
import HomePage from '../../../pages/HomePage.jsx';
import { getRequestedPath, sanitizeInternalDestination } from '../authNavigation.js';
import AuthModal from './AuthModal.jsx';

export default function AuthModalRoute({ mode, withFallback = false }) {
  const location = useLocation();
  const navigate = useNavigate();
  const background = location.state?.backgroundLocation;
  const requestedPath = getRequestedPath(location.state);
  const backgroundPath = background
    ? sanitizeInternalDestination(`${background.pathname || '/'}${background.search || ''}${background.hash || ''}`)
    : null;

  const handleClose = useCallback(() => {
    navigate(backgroundPath || '/', { replace: true });
  }, [backgroundPath, navigate]);

  const handleSwitchMode = useCallback((nextMode) => {
    navigate(nextMode === 'register' ? '/register' : '/login', {
      replace: true,
      state: location.state,
    });
  }, [location.state, navigate]);

  const modal = (
    <AuthModal mode={mode} requestedPath={requestedPath} onClose={handleClose} onSwitchMode={handleSwitchMode} />
  );

  if (!withFallback) return modal;
  return <ClientLayout><HomePage />{modal}</ClientLayout>;
}
