import React from 'react';
import { SunIcon, MoonIcon } from './Icons';

const ThemeToggle = ({ theme, toggleTheme }) => (
  <button
    onClick={toggleTheme}
    className="fixed top-6 right-6 z-50 p-3 rounded-full bg-[#1C3F60] dark:bg-[#1C3F60] text-[#B1D4E0] hover:bg-[#AFC1D0] dark:hover:bg-[#AFC1D0] transition-all duration-300 shadow-lg"
    aria-label="Toggle theme"
  >
    {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
  </button>
);

export default ThemeToggle;