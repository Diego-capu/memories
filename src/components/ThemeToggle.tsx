import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark';
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');

    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      if (metaThemeColor) metaThemeColor.setAttribute('content', '#070d18');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      if (metaThemeColor) metaThemeColor.setAttribute('content', '#faf8f5');
    }
  }, [isDark]);

  return (
    <button
      onClick={() => setIsDark((prev) => !prev)}
      title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      className="flex items-center justify-center w-8 h-8 rounded-full bg-white/70 hover:bg-white border border-sky-200/80 text-slate-700 hover:text-slate-900 dark:bg-white/10 dark:hover:bg-white/15 dark:border-white/10 dark:text-slate-200 dark:hover:text-white transition-all cursor-pointer backdrop-blur-md shadow-xs active:scale-95"
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-300 transition-transform rotate-0 hover:rotate-45 duration-300" />
      ) : (
        <Moon className="w-4 h-4 text-sky-700 transition-transform -rotate-12 hover:rotate-0 duration-300" />
      )}
    </button>
  );
};
