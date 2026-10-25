import React, { createContext, useContext, useEffect, useState } from 'react';
import { Language, translations } from '../lib/i18n.js';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  lang: Language;
  setLang: (lang: Language) => void;
  t: (typeof translations)['en'];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('bhoomi_theme') === 'dark';
  });

  const [lang, setLangState] = useState<Language>(() => {
    return (localStorage.getItem('bhoomi_lang') as Language) || 'en';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('bhoomi_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('bhoomi_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode((prev) => !prev);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('bhoomi_lang', newLang);
  };

  const t = translations[lang] || translations.en;

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, lang, setLang, t }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
}
