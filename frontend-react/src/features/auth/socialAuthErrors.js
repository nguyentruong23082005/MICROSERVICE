const STATUS_ERROR_KEYS = Object.freeze({
  401: 'auth.social_token_invalid',
  503: 'auth.social_service_unavailable',
});

const FIREBASE_ERROR_KEYS = Object.freeze({
  'auth/popup-blocked': 'auth.social_popup_blocked',
  'auth/cancelled-popup-request': null,
  'auth/popup-closed-by-user': null,
  'auth/operation-not-allowed': 'auth.social_provider_disabled',
  'auth/account-exists-with-different-credential': 'auth.social_account_conflict',
  'auth/network-request-failed': 'auth.social_service_unavailable',
});

export function getSocialAuthErrorKey(error) {
  if (Object.hasOwn(STATUS_ERROR_KEYS, error?.status)) {
    return STATUS_ERROR_KEYS[error.status];
  }

  if (Object.hasOwn(FIREBASE_ERROR_KEYS, error?.code)) {
    return FIREBASE_ERROR_KEYS[error.code];
  }

  return 'auth.social_login_failed';
}
