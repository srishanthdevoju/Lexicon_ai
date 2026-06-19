import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from './translations';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('lexicon_lang') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('lexicon_lang', lang);
  }, [lang]);

  const t = (key, category = 'common') => {
    return translations[lang]?.[category]?.[key] || translations['en']?.[category]?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}
