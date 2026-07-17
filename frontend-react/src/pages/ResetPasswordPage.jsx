import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../features/auth/services/authService.js';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState({ loading: false, error: '', success: false });

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (password.length < 8) {
      setStatus({ loading: false, error: 'Mật khẩu phải có ít nhất 8 ký tự.', success: false });
      return;
    }
    if (password !== confirmPassword) {
      setStatus({ loading: false, error: 'Mật khẩu xác nhận không khớp.', success: false });
      return;
    }
    setStatus({ loading: true, error: '', success: false });
    try {
      await resetPassword(token, password);
      setStatus({ loading: false, error: '', success: true });
    } catch {
      setStatus({ loading: false, error: 'Liên kết không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu liên kết mới.', success: false });
    }
  };

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: 'radial-gradient(circle at top, #e8f3ed, var(--color-bg) 48%)' }}>
      <section style={{ width: '100%', maxWidth: 440, padding: '42px 38px', borderRadius: 20, background: 'var(--color-surface)', boxShadow: '0 24px 70px rgba(22, 63, 50, .16)', border: '1px solid rgba(26, 91, 69, .12)' }}>
        <div style={{ width: 52, height: 52, display: 'grid', placeItems: 'center', borderRadius: 14, background: '#e0eee7', fontSize: 24, marginBottom: 22 }}>🔐</div>
        <h1 style={{ margin: '0 0 10px', fontFamily: 'var(--font-display)', fontSize: '1.8rem' }}>Tạo mật khẩu mới</h1>
        <p style={{ margin: '0 0 28px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>Chọn mật khẩu mạnh mà bạn chưa từng dùng cho tài khoản này.</p>
        {status.success ? (
          <div>
            <p role="status" style={{ padding: 14, borderRadius: 10, color: '#17633f', background: '#e8f7ef' }}>Mật khẩu đã được cập nhật thành công.</p>
            <button id="reset-login" className="btn btn-primary" onClick={() => navigate('/login')} style={{ width: '100%', marginTop: 16 }}>Đăng nhập</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
            <label style={{ display: 'grid', gap: 7, fontWeight: 600 }}>Mật khẩu mới
              <input id="reset-password" type="password" minLength={8} required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ padding: '13px 14px', border: '1.5px solid var(--color-border)', borderRadius: 10 }} />
            </label>
            <label style={{ display: 'grid', gap: 7, fontWeight: 600 }}>Xác nhận mật khẩu
              <input id="reset-confirm-password" type="password" minLength={8} required autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={{ padding: '13px 14px', border: '1.5px solid var(--color-border)', borderRadius: 10 }} />
            </label>
            {(!token || status.error) && <p role="alert" style={{ margin: 0, color: '#b42318', fontSize: '.9rem' }}>{!token ? 'Liên kết đặt lại mật khẩu không hợp lệ.' : status.error}</p>}
            <button id="reset-submit" className="btn btn-primary" type="submit" disabled={!token || status.loading} style={{ padding: 14, marginTop: 6 }}>{status.loading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}</button>
          </form>
        )}
      </section>
    </main>
  );
}
