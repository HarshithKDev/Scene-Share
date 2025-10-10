// src/components/ThemeToggle.jsx
import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { Button } from './ui/Button';

const ThemeToggle = ({ theme, toggleTheme }) => (
  <Button
    onClick={toggleTheme}
    variant="ghost"
    size="icon"
    aria-label="Toggle theme"
  >
    {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
  </Button>
);

export default ThemeToggle;