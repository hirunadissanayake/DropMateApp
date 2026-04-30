import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme, darkTheme, AppTheme } from '../constants/Colors';

const THEME_STORAGE_KEY = '@app_theme_is_dark';

interface ThemeContextType {
  isDark: boolean;
  theme: AppTheme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  isDark: true,
  theme: darkTheme,
  toggleTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState(true);

  // Load theme from storage on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (storedTheme !== null) {
          setIsDark(JSON.parse(storedTheme));
        } else {
          // Default to dark if no preference is stored
          setIsDark(true);
        }
      } catch (error) {
        console.error('Failed to load theme:', error);
      }
    };
    loadTheme();
  }, []);

  const toggleTheme = useCallback(async () => {
    setIsDark((prev) => {
      const newVal = !prev;
      // Persist the change
      AsyncStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(newVal)).catch(err => 
        console.error('Failed to save theme:', err)
      );
      return newVal;
    });
  }, []);

  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ isDark, theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
