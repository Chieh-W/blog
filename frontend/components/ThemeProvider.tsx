'use client';

import { useEffect, type ReactNode } from 'react';

type ThemeMode = 'dark' | 'day';

function getInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'dark';
  const saved = window.localStorage.getItem('nexus-theme');
  if (saved === 'day' || saved === 'dark') return saved;
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'day' : 'dark';
}

function applyTheme(theme: ThemeMode) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme === 'day' ? 'light' : 'dark';
  window.dispatchEvent(new CustomEvent('nexus-theme-change', { detail: { theme } }));
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const theme = getInitialTheme();
    applyTheme(theme);
  }, []);

  return <>{children}</>;
}

export type { ThemeMode };
