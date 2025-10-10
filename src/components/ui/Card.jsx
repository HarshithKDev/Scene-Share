// src/components/ui/Card.jsx
import React from 'react';

export const Card = ({ children, className = '' }) => (
  <div className={`rounded-xl border bg-neutral-900 border-neutral-800 text-white shadow-sm ${className}`}>
    {children}
  </div>
);

export const CardHeader = ({ children, className = '' }) => (
    <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>{children}</div>
);

export const CardTitle = ({ children, className = '' }) => (
    <h3 className={`text-2xl font-semibold leading-none tracking-tight ${className}`}>{children}</h3>
);

export const CardDescription = ({ children, className = '' }) => (
    <p className={`text-sm text-neutral-400 ${className}`}>{children}</p>
);

export const CardContent = ({ children, className = '' }) => (
  <div className={`p-6 pt-0 ${className}`}>{children}</div>
);