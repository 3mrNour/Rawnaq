import React, { createContext, useContext, useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('rawnaq-theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return 'dark'; // default to sleek dark theme
  });

  useEffect(() => {
    // 1. Apply language and RTL direction globally for Arabic platform
    document.documentElement.setAttribute('dir', 'rtl');
    document.documentElement.setAttribute('lang', 'ar');

    // 2. Toggle dark class on root html element
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // 3. Save to localStorage
    localStorage.setItem('rawnaq-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeToggle: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 20 }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={`p-2.5 rounded-xl transition-all duration-300 flex items-center justify-center border shadow-sm active:scale-95 ${
        theme === 'dark'
          ? 'bg-slate-800 text-amber-400 border-slate-700 hover:bg-slate-700 hover:text-amber-300 shadow-amber-500/10'
          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-blue-600 shadow-slate-200'
      } ${className}`}
      title={theme === 'dark' ? 'تفعيل الوضع النهاري (Light Mode)' : 'تفعيل الوضع الليلي (Dark Mode)'}
      aria-label="Toggle Theme"
    >
      {theme === 'dark' ? (
        <Sun size={size} className="animate-in spin-in-90 duration-300" />
      ) : (
        <Moon size={size} className="animate-in spin-in-90 duration-300" />
      )}
    </button>
  );
};
