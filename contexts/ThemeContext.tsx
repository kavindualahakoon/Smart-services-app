import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';

type ColorScheme = 'light' | 'dark';

interface ThemeContextType {
  colorScheme: ColorScheme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: ColorScheme | 'system') => void;
  themeMode: 'system' | 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useSystemColorScheme();
  const [themeMode, setThemeMode] = useState<'system' | 'light' | 'dark'>('system');
  const [manualTheme, setManualTheme] = useState<ColorScheme | null>(null);

  // Load saved theme preference
  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('themeMode');
      if (savedTheme) {
        setThemeMode(savedTheme as 'system' | 'light' | 'dark');
        if (savedTheme !== 'system') {
          setManualTheme(savedTheme as ColorScheme);
        }
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    }
  };

  const saveThemePreference = async (theme: 'system' | 'light' | 'dark') => {
    try {
      await AsyncStorage.setItem('themeMode', theme);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const colorScheme: ColorScheme = manualTheme || systemColorScheme || 'light';
  const isDark = colorScheme === 'dark';

  const toggleTheme = () => {
    const newTheme: ColorScheme = isDark ? 'light' : 'dark';
    setManualTheme(newTheme);
    setThemeMode(newTheme);
    saveThemePreference(newTheme);
  };

  const setTheme = (theme: ColorScheme | 'system') => {
    if (theme === 'system') {
      setManualTheme(null);
      setThemeMode('system');
      saveThemePreference('system');
    } else {
      setManualTheme(theme);
      setThemeMode(theme);
      saveThemePreference(theme);
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        colorScheme,
        isDark,
        toggleTheme,
        setTheme,
        themeMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
