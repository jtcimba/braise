import React, {createContext, useContext, useEffect, useState} from 'react';
import {useColorScheme} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {LightTheme, DarkTheme} from './theme';

export type AppearancePreference = 'system' | 'light' | 'dark';

const APPEARANCE_KEY = '@appearance_preference';

type ThemeContextType = {
  theme: typeof LightTheme;
  appearance: AppearancePreference;
  setAppearance: (pref: AppearancePreference) => void;
  isDark: boolean;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider = ({children}: {children: React.ReactNode}) => {
  const systemColorScheme = useColorScheme();
  const [appearance, setAppearanceState] =
    useState<AppearancePreference>('system');

  useEffect(() => {
    AsyncStorage.getItem(APPEARANCE_KEY).then(stored => {
      if (stored === 'system' || stored === 'light' || stored === 'dark') {
        setAppearanceState(stored);
      }
    });
  }, []);

  const resolvedScheme =
    appearance === 'system' ? systemColorScheme : appearance;
  const isDark = resolvedScheme === 'dark';
  const theme = isDark ? DarkTheme : LightTheme;

  const setAppearance = (pref: AppearancePreference) => {
    setAppearanceState(pref);
    AsyncStorage.setItem(APPEARANCE_KEY, pref);
  };

  return (
    <ThemeContext.Provider value={{theme, appearance, setAppearance, isDark}}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext)!.theme;

export const useAppearance = () => {
  const ctx = useContext(ThemeContext)!;
  return {
    appearance: ctx.appearance,
    setAppearance: ctx.setAppearance,
    isDark: ctx.isDark,
  };
};
