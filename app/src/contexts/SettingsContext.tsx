import { createContext, useState, useEffect } from "react";

// Keys for localStorage
const STORAGE_KEYS = {
  THEME: "rulebook-theme",
  LANGUAGE: "rulebook-language",
} as const;

// Default values
const DEFAULTS = {
  THEME: "default",
  LANGUAGE: "en",
} as const;

// Helper functions to read from localStorage
const getStoredTheme = (): string => {
  if (typeof window === "undefined") return DEFAULTS.THEME;
  const stored = localStorage.getItem(STORAGE_KEYS.THEME);
  return stored || DEFAULTS.THEME;
};

const getStoredLanguage = (): string => {
  if (typeof window === "undefined") return DEFAULTS.LANGUAGE;
  const stored = localStorage.getItem(STORAGE_KEYS.LANGUAGE);
  return stored || DEFAULTS.LANGUAGE;
};

const SettingsContext = createContext<{
  theme: string;
  setTheme: (theme: string) => void;
  language: string;
  setLanguage: (language: string) => void;
}>({
  theme: DEFAULTS.THEME,
  setTheme: () => {},
  language: DEFAULTS.LANGUAGE,
  setLanguage: () => {},
});

export const SettingsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  // Initialize state from localStorage
  const [theme, setThemeState] = useState<string>(getStoredTheme);
  const [language, setLanguageState] = useState<string>(getStoredLanguage);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, language);
  }, [language]);

  const setTheme = (newTheme: string) => {
    setThemeState(newTheme);
  };

  const setLanguage = (newLanguage: string) => {
    setLanguageState(newLanguage);
  };

  return (
    <SettingsContext.Provider
      value={{ theme, setTheme, language, setLanguage }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
export default SettingsContext;
