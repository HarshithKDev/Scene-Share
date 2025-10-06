import React from 'react';
import { SunIcon, MoonIcon } from './Icons';

const ThemeToggle = ({ theme, toggleTheme }) => (
  <button
    onClick={toggleTheme}
    className="fixed top-6 right-6 z-50 p-3 rounded-full bg-gray-900 dark:bg-gray-100 text-white dark:text-black hover:bg-gray-700 dark:hover:bg-gray-300 transition-all duration-300 shadow-lg border border-gray-700 dark:border-gray-300"
    aria-label="Toggle theme"
  >
    {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
  </button>
);

export default ThemeToggle;