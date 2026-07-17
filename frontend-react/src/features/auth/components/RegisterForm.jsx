import { useState } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { XIcon } from '../../../components/icons/index.js';

export default function RegisterForm({ onClose, onSwitch }) {
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await register({
        userName: username.trim(),
        userPassword: password,
      });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(17, 17, 17, 0.4)', zIndex: 1000, backdropFilter: 'blur(4px)' }} onClick={onClose} />
      
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '100%', maxWidth: '440px', background: 'var(--color-card)', borderRadius: 'var(--radius-md)', padding: '40px', zIndex: 1001, boxShadow: 'var(--shadow-modal)', border: '1px solid var(--color-border)' }}>
        <button onClick={onClose} aria-label="Đóng đăng ký" style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)' }}>
          <XIcon size={24} />
        </button>

        <h2 style={{ fontSize: '1.75rem', marginBottom: '8px', fontFamily: 'var(--font-display)', fontWeight: 300 }}>Tạo tài khoản</h2>
        <p className="muted" style={{ marginBottom: '32px', fontSize: '0.95rem' }}>Đăng ký để nhận ưu đãi riêng và cập nhật mới từ Furniq.</p>

        {error && <div className="toast toast-error" style={{ marginBottom: '24px' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Tên đăng nhập</label>
            <input className="input-field" type="text" value={username} onChange={e => setUsername(e.target.value)} required />
          </div>
          <div className="input-group">
            <label>Mật khẩu</label>
            <input className="input-field" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          
          <button type="submit" className="btn btn-primary btn-full" style={{ height: '52px', marginTop: '16px' }} disabled={loading}>
            {loading ? 'Đang tạo...' : 'Tạo tài khoản'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem', color: 'var(--color-muted)' }}>
          Đã có tài khoản? <button className="btn-ghost" style={{ border: 'none', background: 'transparent', color: 'var(--color-text)', fontWeight: 500, textDecoration: 'underline', cursor: 'pointer' }} onClick={onSwitch}>Đăng nhập</button>
        </p>
      </div>
    </>
  );
}

