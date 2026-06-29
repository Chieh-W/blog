'use client';

import { useEffect, useState, type MouseEvent } from 'react';
import type { ThemeMode } from './ThemeProvider';

function setTheme(theme: ThemeMode) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme === 'day' ? 'light' : 'dark';
  window.localStorage.setItem('nexus-theme', theme);
  window.dispatchEvent(new CustomEvent('nexus-theme-change', { detail: { theme } }));
}

function runOpticalWipe(event: MouseEvent<HTMLButtonElement>, nextTheme: ThemeMode) {
  const wipe = document.createElement('div');
  wipe.className = 'theme-optical-wipe';
  wipe.dataset.targetTheme = nextTheme;
  wipe.style.setProperty('--wipe-x', `${event.clientX}px`);
  wipe.style.setProperty('--wipe-y', `${event.clientY}px`);
  document.body.appendChild(wipe);
  window.setTimeout(() => wipe.remove(), 980);
}

export function ThemeToggle() {
  const [theme, setThemeState] = useState<ThemeMode>('dark');

  useEffect(() => {
    const current = document.documentElement.dataset.theme === 'day' ? 'day' : 'dark';
    setThemeState(current);

    const onThemeChange = (event: Event) => {
      const detail = (event as CustomEvent<{ theme?: ThemeMode }>).detail;
      if (detail?.theme === 'day' || detail?.theme === 'dark') setThemeState(detail.theme);
    };

    window.addEventListener('nexus-theme-change', onThemeChange);
    return () => window.removeEventListener('nexus-theme-change', onThemeChange);
  }, []);

  const toggle = (event: MouseEvent<HTMLButtonElement>) => {
    const nextTheme: ThemeMode = theme === 'day' ? 'dark' : 'day';
    runOpticalWipe(event, nextTheme);
    window.setTimeout(() => setTheme(nextTheme), 120);
  };

  return (
    <button
      className="theme-toggle"
      type="button"
      onClick={toggle}
      aria-label={theme === 'day' ? 'Switch to dark optical engine' : 'Switch to day optical engine'}
      aria-pressed={theme === 'day'}
    >
      <span className="theme-toggle-track" aria-hidden>
        <span className="theme-toggle-orb" />
      </span>
      <span className="theme-toggle-label">{theme === 'day' ? 'DAY' : 'DARK'}</span>
    </button>
  );
}
