import React, { createContext, useContext, useState, useCallback } from 'react';
import { getTranslation } from '../i18n/translations';

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('xisaabiye_language');
    return saved === 'so' || saved === 'en' ? saved : 'en';
  });

  const toggleLanguage = () => {
    setLanguage(prev => {
      const next = prev === 'en' ? 'so' : 'en';
      localStorage.setItem('xisaabiye_language', next);
      return next;
    });
  };

  const t = useCallback((path) => getTranslation(language, path), [language]);

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
