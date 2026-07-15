import { useTranslation } from 'react-i18next';

/**
 * LanguageSwitcher — toggles between VI and EN.
 * Persists selection to localStorage via i18next-browser-languagedetector.
 */
export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const currentLang = i18n.language?.startsWith('vi') ? 'vi' : 'en';

  const toggle = () => {
    const next = currentLang === 'vi' ? 'en' : 'vi';
    i18n.changeLanguage(next);
  };

  return (
    <button
      onClick={toggle}
      title={currentLang === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
      style={{
        background: 'none',
        border: '1.5px solid currentColor',
        borderRadius: '4px',
        padding: '2px 8px',
        cursor: 'pointer',
        fontSize: '0.75rem',
        fontWeight: '600',
        letterSpacing: '0.05em',
        color: 'inherit',
        lineHeight: 1.6,
        minWidth: '36px',
        textAlign: 'center',
      }}
    >
      {currentLang === 'vi' ? 'EN' : 'VI'}
    </button>
  );
}
