import { createContext, useState, useEffect } from "react";

const STORAGE_KEYS = {
  THEME: "rulebook-theme",
  LANGUAGE: "rulebook-language",
  BUTTONS_POSITION: "rulebook-buttons-position",
} as const;

const DEFAULTS = {
  THEME: "default",
  LANGUAGE: "en",
  BUTTONS_POSITION: "right",
  THEMES: new Map([
    ["default", "#0485f7"],
    ["muted", "#226081"],
    ["rosewood", "#b9314f"],
    ["toffee", "#9e6240"],
    ["tropical", "#5c9991"],
  ]),
} as const;

type Settings = {
  theme: string;
  buttonsPosition: string;
  setButtonsPosition: (buttonsPosition: string) => void;
  setTheme: (theme: string) => void;
  language: string;
  setLanguage: (language: string) => void;
  themes: Map<string, string>;
};

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

const getStoredButtonsPosition = (): string => {
  if (typeof window === "undefined") return DEFAULTS.BUTTONS_POSITION;
  const stored = localStorage.getItem(STORAGE_KEYS.BUTTONS_POSITION);
  return stored || DEFAULTS.BUTTONS_POSITION;
};

const SettingsContext = createContext<Settings>({
  theme: DEFAULTS.THEME,
  buttonsPosition: DEFAULTS.BUTTONS_POSITION,
  setButtonsPosition: () => {},
  setTheme: () => {},
  language: DEFAULTS.LANGUAGE,
  setLanguage: () => {},
  themes: DEFAULTS.THEMES,
});

export const SettingsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [theme, setThemeState] = useState<string>(getStoredTheme);
  const [language, setLanguageState] = useState<string>(getStoredLanguage);
  const [buttonsPosition, setButtonsPositionState] = useState<string>(
    getStoredButtonsPosition,
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BUTTONS_POSITION, buttonsPosition);
  }, [buttonsPosition]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BUTTONS_POSITION, buttonsPosition);
  }, [buttonsPosition]);

  const setTheme = (newTheme: string) => {
    setThemeState(newTheme);
  };

  const setLanguage = (newLanguage: string) => {
    setLanguageState(newLanguage);
  };

  const setButtonsPosition = (newButtonsPosition: string) => {
    setButtonsPositionState(newButtonsPosition);
  };

  return (
    <SettingsContext.Provider
      value={{
        theme,
        setTheme,
        language,
        setLanguage,
        themes: DEFAULTS.THEMES,
        buttonsPosition,
        setButtonsPosition,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
export default SettingsContext;
