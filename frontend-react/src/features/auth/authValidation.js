export function validateRegistration(values = {}) {
  const username = values.username?.trim() || '';
  const email = values.email?.trim() || '';
  const password = values.password || '';
  const confirmPassword = values.confirmPassword || '';

  return {
    ...(username.length < 3 || username.length > 50 ? { username: 'username_length' } : {}),
    ...(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? { email: 'email_invalid' } : {}),
    ...(password.length < 8 || password.length > 72 ? { password: 'password_length' } : {}),
    ...(confirmPassword !== password ? { confirmPassword: 'password_mismatch' } : {}),
  };
}
