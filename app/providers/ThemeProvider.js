"use client"

import { createContext, useContext, useState } from 'react';
import { useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState({
        primaryColor: '#8ec07c',
    });

    const changePrimaryColor = (color) => {
        setTheme((prevTheme) => ({
            ...prevTheme,
            primaryColor: color,
        }));
    };

  useEffect(() => {
    document.documentElement.style.setProperty('--alt', theme.primaryColor);
  }, [theme.primaryColor, theme.secondaryColor]);

    return (
        <ThemeContext.Provider value={{ theme, changePrimaryColor }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}
