import React from 'react';
import { SunIcon, MoonIcon } from './Icons';

const ThemeToggle = ({ theme, toggleTheme, className }) => (
  <button
    onClick={toggleTheme}
    className={`p-3 rounded-full bg-gray-100 dark:bg-gray-900 text-white dark:text-black hover:bg-gray-300 dark:hover:bg-gray-700 transition-all duration-300 shadow-lg border border-gray-300 dark:border-gray-800 ${className}`}
    aria-label="Toggle theme"
  >
    {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
  </button>
);

export default ThemeToggle;