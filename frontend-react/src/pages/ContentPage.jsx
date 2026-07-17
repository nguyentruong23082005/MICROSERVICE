import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getContentPage } from '../features/content/index.js';

export default function ContentPage({ slug: fixedSlug }) {
  const params = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const slug = fixedSlug || params.slug;
  const [resource, setResource] = useState({
    slug: null,
    page: null,
    error: null,
  });

  useEffect(() => {
    if (!slug) return;
    let active = true;

    Promise.resolve()
      .then(() => getContentPage(slug))
      .then((data) => {
        if (!active) return;
        setResource({ slug, page: data, error: null });
      })
      .catch((err) => {
        if (!active) return;
        setResource({ slug, page: null, error: err.message });
      });

    return () => { active = false; };
  }, [slug]);

  const loading = resource.slug !== slug;
  const page = loading ? null : resource.page;
  const error = loading ? null : resource.error;

  if (loading) {
    return (
      <div className="shell section-padding">
        <div className="loading-spinner" aria-label={t('content.loading')} />
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="shell section-padding">
        <div className="empty-state">
          <h1 style={{ fontSize: '2rem', marginBottom: '12px' }}>{t('content.not_found')}</h1>
          <p className="muted" style={{ marginBottom: '24px' }}>{error || t('content.not_published')}</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>{t('error.go_home')}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="shell section-padding">
      <div style={{ maxWidth: '840px' }}>
        <p className="eyebrow">{page.pageType || 'Furniq'}</p>
        <h1 style={{ fontSize: '2.6rem', marginBottom: '20px' }}>{page.title}</h1>
        {page.summary && (
          <p style={{ fontSize: '1.15rem', color: 'var(--color-muted)', lineHeight: 1.8, marginBottom: '32px' }}>
            {page.summary}
          </p>
        )}
        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '32px', fontSize: '1.02rem', lineHeight: 1.9, color: 'var(--color-text)' }}>
          {(page.body || '').split('\n').map((paragraph, index) => (
            <p key={`${page.slug}-${index}`} style={{ marginBottom: '18px' }}>{paragraph}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
