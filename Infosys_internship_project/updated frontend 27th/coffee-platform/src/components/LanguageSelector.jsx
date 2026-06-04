import { useEffect, useState } from 'react';
import './LanguageSelector.css';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi' },
  { code: 'mr', label: 'Marathi' },
];

const STORAGE_KEY = 'cafeconnect_language';
const GOOGLE_SCRIPT_ID = 'google-translate-script';
const GOOGLE_ELEMENT_ID = 'google_translate_element';

const setTranslateCookie = (language) => {
  const value = language === 'en' ? '' : `/en/${language}`;
  const maxAge = language === 'en' ? '0' : `${60 * 60 * 24 * 365}`;
  document.cookie = `googtrans=${value}; path=/; max-age=${maxAge}`;
};

const triggerGoogleTranslate = (language) => {
  const combo = document.querySelector('.goog-te-combo');
  if (!combo) return false;

  combo.value = language === 'en' ? '' : language;
  combo.dispatchEvent(new Event('change'));
  return true;
};

const ensureGoogleTranslateScript = () => {
  if (window.google?.translate?.TranslateElement) {
    return;
  }

  window.googleTranslateElementInit = () => {
    if (!document.getElementById(GOOGLE_ELEMENT_ID)) return;

    new window.google.translate.TranslateElement(
      {
        pageLanguage: 'en',
        includedLanguages: 'en,hi,mr',
        autoDisplay: false,
      },
      GOOGLE_ELEMENT_ID
    );

    const savedLanguage = localStorage.getItem(STORAGE_KEY) || 'en';
    if (savedLanguage !== 'en') {
      setTimeout(() => triggerGoogleTranslate(savedLanguage), 300);
    }
  };

  if (!document.getElementById(GOOGLE_SCRIPT_ID)) {
    const script = document.createElement('script');
    script.id = GOOGLE_SCRIPT_ID;
    script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    document.body.appendChild(script);
  }
};

const LanguageSelector = ({ showControl = true, includeWidget = false }) => {
  const [language, setLanguage] = useState(() => localStorage.getItem(STORAGE_KEY) || 'en');

  useEffect(() => {
    setTranslateCookie(language);
    ensureGoogleTranslateScript();
  }, [language]);

  const handleChange = (event) => {
    const selectedLanguage = event.target.value;
    setLanguage(selectedLanguage);
    localStorage.setItem(STORAGE_KEY, selectedLanguage);
    setTranslateCookie(selectedLanguage);

    if (!triggerGoogleTranslate(selectedLanguage)) {
      window.location.reload();
    }
  };

  return (
    <>
      {includeWidget && <div id={GOOGLE_ELEMENT_ID} className="google-translate-holder" />}
      {showControl && (
        <label className="language-selector">
          <span>Language</span>
          <select value={language} onChange={handleChange} aria-label="Select language">
            {LANGUAGES.map((item) => (
              <option key={item.code} value={item.code}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      )}
    </>
  );
};

export default LanguageSelector;
