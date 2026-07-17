const POSITIVE_ACCOUNT_ID = /^[1-9]\d*$/;

function clean(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export function buildAdminChatWebSocketUrl(gatewayBaseUrl) {
  return `${gatewayBaseUrl.replace(/^http/i, 'ws')}/ws/support-chat?authScope=admin`;
}

export function getAdminSupport(path, gatewayGet) {
  return gatewayGet(path, { authScope: 'admin' });
}

export function isRegisteredCustomerId(customerId) {
  return typeof customerId === 'string' && POSITIVE_ACCOUNT_ID.test(customerId);
}

export function buildCustomerIdentity(customerId, profile = null, options = {}) {
  const sessionId = String(customerId || '');
  if (!isRegisteredCustomerId(sessionId)) {
    return Object.freeze({
      kind: 'guest',
      displayName: 'Khách chưa đăng nhập',
      accountName: null,
      email: null,
      phoneNumber: null,
      location: null,
      role: null,
      active: null,
      sessionId,
    });
  }

  if (!profile) {
    const kind = options.profileMissing ? 'missing' : options.profileError ? 'error' : 'loading';
    const displayName = {
      missing: 'Không tìm thấy hồ sơ',
      error: 'Không tải được hồ sơ',
      loading: 'Đang tải hồ sơ...',
    }[kind];

    return Object.freeze({
      kind,
      displayName,
      accountName: null,
      email: null,
      phoneNumber: null,
      location: null,
      role: null,
      active: null,
      sessionId,
    });
  }

  const details = profile.userDetails || {};
  const fullName = [clean(details.firstName), clean(details.lastName)].filter(Boolean).join(' ');
  const accountName = clean(profile.userName);
  const location = [clean(details.locality), clean(details.country)].filter(Boolean).join(', ') || null;

  return Object.freeze({
    kind: 'registered',
    displayName: fullName || accountName || `Tài khoản #${sessionId}`,
    accountName,
    email: clean(details.email),
    phoneNumber: clean(details.phoneNumber),
    location,
    role: clean(profile.role),
    active: profile.active,
    sessionId,
  });
}

export function appendUniqueMessage(messages, message) {
  if (message?.id != null && messages.some((existing) => existing.id === message.id)) {
    return messages;
  }
  return [...messages, message];
}

export function reduceChatConnection(current, event) {
  if (event.type === 'connected') {
    return { status: 'online', ready: true, error: null };
  }
  if (event.type === 'candidate-failed' && event.hasNextCandidate) {
    return { status: 'reconnecting', ready: false, error: null };
  }
  if (event.type === 'failed') {
    return {
      status: 'offline',
      ready: false,
      error: event.message || 'Không kết nối được chat admin.',
    };
  }
  if (event.type === 'connecting') {
    return { ...current, status: 'connecting', ready: false };
  }
  return current;
}
