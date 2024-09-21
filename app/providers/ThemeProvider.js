"use client"

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchUser } from '@/lib/users';
import { useSession } from 'next-auth/react';

const ThemeContext = createContext();

export default function ThemeProvider({ children }) {
  const [theme, setTheme] = useState({
    primaryColor: '#8ec07c',
  });

  const { data: session } = useSession();

  const changePrimaryColor = useCallback((color) => {
    setTheme((prevTheme) => ({
      ...prevTheme,
      primaryColor: color,
    }));
  }, [setTheme]);

  const { data: user } = useQuery({
    queryKey: ['user', session?.user?.id],
    queryFn: () => fetchUser(session?.user?.id),
    enabled: !!session?.user?.id,
    staleTime: 0,
    onError: (error) => {
      console.error('Failed to fetch user theme:', error.message);
    }
  });

  useEffect(() => {
    if (user && Array.isArray(user) && user.length > 0) {
      const userData = user[0];

      if (userData.color) {
        changePrimaryColor(userData.color);
      }
    }
  }, [user, changePrimaryColor]);

  useEffect(() => {
    document.documentElement.style.setProperty('--alt', theme.primaryColor);
  }, [theme.primaryColor]);

  return (
    <ThemeContext.Provider value={{ theme, changePrimaryColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
