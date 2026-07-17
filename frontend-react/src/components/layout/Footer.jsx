import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="footer">
      <div className="shell grid-4" style={{ marginBottom: '48px' }}>
        <div>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '16px', fontFamily: 'var(--font-display)', fontWeight: 400 }}>Furniq</h3>
          <p className="muted" style={{ maxWidth: '240px', fontSize: '0.9rem', lineHeight: '1.6' }}>
            {t('footer.tagline')}
          </p>
        </div>

        <div>
          <h4 style={{ fontSize: '1.1rem', marginBottom: '16px', fontFamily: 'var(--font-display)', fontWeight: 500 }}>{t('footer.shop')}</h4>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem' }} className="muted">
            <li><a href="#living" style={{ transition: 'color 0.2s' }}>{t('footer.living_room')}</a></li>
            <li><a href="#bedroom" style={{ transition: 'color 0.2s' }}>{t('footer.bedroom')}</a></li>
            <li><a href="#dining" style={{ transition: 'color 0.2s' }}>{t('footer.dining_room')}</a></li>
            <li><a href="#workspace" style={{ transition: 'color 0.2s' }}>{t('footer.workspace')}</a></li>
          </ul>
        </div>

        <div>
          <h4 style={{ fontSize: '1.1rem', marginBottom: '16px', fontFamily: 'var(--font-display)', fontWeight: 500 }}>{t('footer.support')}</h4>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem' }} className="muted">
            <li><a href="#faq" style={{ transition: 'color 0.2s' }}>{t('footer.faq')}</a></li>
            <li><a href="#shipping" style={{ transition: 'color 0.2s' }}>{t('footer.shipping_returns')}</a></li>
            <li><a href="#care" style={{ transition: 'color 0.2s' }}>{t('footer.care_guide')}</a></li>
          </ul>
        </div>

        <div>
          <h4 style={{ fontSize: '1.1rem', marginBottom: '16px', fontFamily: 'var(--font-display)', fontWeight: 500 }}>{t('footer.newsletter')}</h4>
          <p className="muted" style={{ marginBottom: '16px', fontSize: '0.9rem', lineHeight: '1.6' }}>
            {t('footer.newsletter_description')}
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="email"
              placeholder={t('footer.email_placeholder')}
              style={{
                flex: 1,
                background: '#121212',
                border: '1px solid #1e2c31',
                color: '#ffffff',
                padding: '10px 16px',
                borderRadius: '8px',
                outline: 'none',
                fontSize: '0.9rem',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--color-olive)'}
              onBlur={(e) => e.target.style.borderColor = '#1e2c31'}
            />
            <button className="btn btn-primary" style={{ borderRadius: '8px', padding: '10px 20px', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
              {t('footer.subscribe')}
            </button>
          </div>
        </div>
      </div>

      <div
        className="shell"
        style={{
          borderTop: '1px solid #1e2c31',
          paddingTop: '32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#a1a1aa',
          fontSize: '0.85rem',
        }}
      >
        <p>{t('footer.copyright')}</p>
        <div style={{ display: 'flex', gap: '16px' }}>
          <span>{t('footer.privacy')}</span>
          <span>{t('footer.terms')}</span>
        </div>
      </div>
    </footer>
  );
}
