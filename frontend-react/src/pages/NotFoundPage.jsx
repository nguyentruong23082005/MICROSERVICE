import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-bg)',
      textAlign: 'center',
      padding: '24px',
    }}>
      <div style={{
        fontSize: 'clamp(5rem, 20vw, 10rem)',
        fontWeight: 900,
        fontFamily: 'var(--font-display)',
        color: 'var(--color-border)',
        lineHeight: 1,
        marginBottom: '24px',
        userSelect: 'none',
      }}>
        404
      </div>

      <h1 style={{
        fontSize: '1.75rem',
        fontWeight: 700,
        marginBottom: '12px',
        fontFamily: 'var(--font-display)',
      }}>
        {t('error.not_found')}
      </h1>

      <p style={{ color: 'var(--color-text-muted)', maxWidth: '400px', marginBottom: '32px', lineHeight: 1.6 }}>
        {t('error.not_found_desc')}
      </p>

      <button
        id="go-home-btn"
        className="btn btn-primary"
        onClick={() => navigate('/')}
        style={{ padding: '14px 32px', fontSize: '1rem', borderRadius: '10px' }}
      >
        {t('error.go_home')}
      </button>
    </div>
  );
}
