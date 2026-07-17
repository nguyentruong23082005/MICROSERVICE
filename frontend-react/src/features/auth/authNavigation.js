const ADMIN_ROLE = 'ROLE_ADMIN';

export function sanitizeInternalDestination(destination) {
  if (typeof destination !== 'string') return null;
  if (!destination.startsWith('/') || destination.startsWith('//')) return null;
  return destination;
}

export function getLoginDestination({ role, requestedPath } = {}) {
  const safePath = sanitizeInternalDestination(requestedPath);
  const isAdmin = role === ADMIN_ROLE;

  if (safePath && (!safePath.startsWith('/admin') || isAdmin)) return safePath;
  return isAdmin ? '/admin' : '/';
}

export function getProtectedLoginPath(routeType = 'customer') {
  return routeType === 'admin' ? '/admin/login' : '/login';
}

export function getRequestedPath(locationState) {
  const from = locationState?.from;
  if (!from) return null;
  if (typeof from === 'string') return sanitizeInternalDestination(from);

  const path = `${from.pathname || ''}${from.search || ''}${from.hash || ''}`;
  return sanitizeInternalDestination(path);
}
