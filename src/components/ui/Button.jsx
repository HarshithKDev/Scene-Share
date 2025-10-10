// src/components/ui/Button.jsx
import React from 'react';

export const Button = ({ children, onClick, variant = 'default', size = 'default', className = '', ...props }) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-700 disabled:opacity-50 disabled:pointer-events-none';
  
  const variants = {
    default: 'bg-neutral-50 text-neutral-950 hover:bg-neutral-200',
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    destructive: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'hover:bg-neutral-800',
  };

  const sizes = {
    default: 'h-10 py-2 px-4',
    sm: 'h-9 px-3',
    icon: 'h-10 w-10',
  };

  return (
    <button onClick={onClick} className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
};