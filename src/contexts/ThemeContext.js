import React, { createContext, useContext, useState, useEffect } from 'react';

const themes = {
  dark: {
    name: 'Dark',
    colors: {
      background: 'bg-gray-900',
      surface: 'bg-gray-800',
      primary: 'text-cyan-400',
      primaryBg: 'bg-cyan-400/10',
      primaryBorder: 'border-cyan-400',
      secondary: 'text-gray-300',
      muted: 'text-gray-500',
      border: 'border-gray-700',
      hover: 'hover:border-gray-600',
      card: 'bg-gray-800',
      input: 'bg-gray-700',
      button: 'bg-gray-600 hover:bg-gray-700',
      accent: 'text-cyan-400',
      accentBg: 'bg-cyan-400/10',
      accentBorder: 'border-cyan-400',
    }
  },
  light: {
    name: 'Light',
    colors: {
      background: 'bg-gray-100',
      surface: 'bg-white',
      primary: 'text-blue-600',
      primaryBg: 'bg-blue-50',
      primaryBorder: 'border-blue-600',
      secondary: 'text-gray-800',
      muted: 'text-gray-500',
      border: 'border-gray-300',
      hover: 'hover:border-gray-400',
      card: 'bg-white',
      input: 'bg-gray-100',
      button: 'bg-gray-200 hover:bg-gray-300',
      accent: 'text-blue-600',
      accentBg: 'bg-blue-50',
      accentBorder: 'border-blue-600',
    }
  },
  cyberpunk: {
    name: 'Cyberpunk',
    colors: {
      background: 'bg-purple-900',
      surface: 'bg-purple-800',
      primary: 'text-pink-400',
      primaryBg: 'bg-pink-400/10',
      primaryBorder: 'border-pink-400',
      secondary: 'text-purple-100',
      muted: 'text-purple-300',
      border: 'border-purple-600',
      hover: 'hover:border-purple-500',
      card: 'bg-purple-800',
      input: 'bg-purple-700',
      button: 'bg-purple-600 hover:bg-purple-700',
      accent: 'text-pink-400',
      accentBg: 'bg-pink-400/10',
      accentBorder: 'border-pink-400',
    }
  },
  neon: {
    name: 'Neon',
    colors: {
      background: 'bg-black',
      surface: 'bg-gray-900',
      primary: 'text-green-400',
      primaryBg: 'bg-green-400/10',
      primaryBorder: 'border-green-400',
      secondary: 'text-green-100',
      muted: 'text-green-300',
      border: 'border-green-600',
      hover: 'hover:border-green-500',
      card: 'bg-gray-900',
      input: 'bg-gray-800',
      button: 'bg-gray-700 hover:bg-gray-600',
      accent: 'text-green-400',
      accentBg: 'bg-green-400/10',
      accentBorder: 'border-green-400',
    }
  },
  ocean: {
    name: 'Ocean',
    colors: {
      background: 'bg-slate-900',
      surface: 'bg-slate-800',
      primary: 'text-sky-400',
      primaryBg: 'bg-sky-400/10',
      primaryBorder: 'border-sky-400',
      secondary: 'text-slate-200',
      muted: 'text-slate-400',
      border: 'border-slate-700',
      hover: 'hover:border-slate-600',
      card: 'bg-slate-800',
      input: 'bg-slate-700',
      button: 'bg-slate-600 hover:bg-slate-700',
      accent: 'text-sky-400',
      accentBg: 'bg-sky-400/10',
      accentBorder: 'border-sky-400',
    }
  },
  sunset: {
    name: 'Sunset',
    colors: {
      background: 'bg-orange-950',
      surface: 'bg-orange-900',
      primary: 'text-amber-300',
      primaryBg: 'bg-amber-300/10',
      primaryBorder: 'border-amber-300',
      secondary: 'text-orange-100',
      muted: 'text-orange-300',
      border: 'border-orange-700',
      hover: 'hover:border-orange-600',
      card: 'bg-orange-900',
      input: 'bg-orange-800',
      button: 'bg-orange-700 hover:bg-orange-600',
      accent: 'text-amber-300',
      accentBg: 'bg-amber-300/10',
      accentBorder: 'border-amber-300',
    }
  },
  forest: {
    name: 'Forest',
    colors: {
      background: 'bg-green-950',
      surface: 'bg-green-900',
      primary: 'text-emerald-300',
      primaryBg: 'bg-emerald-300/10',
      primaryBorder: 'border-emerald-300',
      secondary: 'text-green-100',
      muted: 'text-green-300',
      border: 'border-green-700',
      hover: 'hover:border-green-600',
      card: 'bg-green-900',
      input: 'bg-green-800',
      button: 'bg-green-700 hover:bg-green-600',
      accent: 'text-emerald-300',
      accentBg: 'bg-emerald-300/10',
      accentBorder: 'border-emerald-300',
    }
  },
  pastel: {
    name: 'Pastel',
    colors: {
      background: 'bg-pink-50',
      surface: 'bg-white',
      primary: 'text-rose-400',
      primaryBg: 'bg-rose-100',
      primaryBorder: 'border-rose-300',
      secondary: 'text-slate-700',
      muted: 'text-slate-500',
      border: 'border-pink-200',
      hover: 'hover:border-pink-300',
      card: 'bg-pink-50',
      input: 'bg-pink-100',
      button: 'bg-pink-200 hover:bg-pink-300',
      accent: 'text-rose-400',
      accentBg: 'bg-rose-100',
      accentBorder: 'border-rose-300',
    }
  },
  midnight: {
    name: 'Midnight',
    colors: {
      background: 'bg-indigo-950',
      surface: 'bg-indigo-900',
      primary: 'text-indigo-300',
      primaryBg: 'bg-indigo-300/10',
      primaryBorder: 'border-indigo-300',
      secondary: 'text-indigo-100',
      muted: 'text-indigo-400',
      border: 'border-indigo-700',
      hover: 'hover:border-indigo-600',
      card: 'bg-indigo-900',
      input: 'bg-indigo-800',
      button: 'bg-indigo-700 hover:bg-indigo-600',
      accent: 'text-indigo-300',
      accentBg: 'bg-indigo-300/10',
      accentBorder: 'border-indigo-300',
    }
  }
};

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme && themes[savedTheme]) {
      setCurrentTheme(savedTheme);
    }
  }, []);

  const changeTheme = (themeName) => {
    if (themes[themeName]) {
      setCurrentTheme(themeName);
      localStorage.setItem('theme', themeName);
    }
  };

  const theme = themes[currentTheme];

  return (
    <ThemeContext.Provider value={{ theme, currentTheme, changeTheme, themes }}>
      {children}
    </ThemeContext.Provider>
  );
};