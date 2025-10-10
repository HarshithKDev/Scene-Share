// src/components/UsernameModal.jsx
import React, { useState } from 'react';
import { sanitizeInput } from '../utils/sanitize';
import { Button } from './ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/Card';

const UsernameModal = ({ onSubmit, isNewUser }) => {
  const [username, setUsername] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const sanitizedUsername = sanitizeInput(username.trim());
    if (sanitizedUsername) {
      onSubmit(sanitizedUsername);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{isNewUser ? 'Welcome to Scene-Share!' : 'Update Username'}</CardTitle>
          <CardDescription>
            {isNewUser ? 'Please set a username to continue.' : 'Enter your new username below.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-neutral-950 text-white rounded-lg border-2 border-neutral-700 focus:border-white focus:outline-none transition-colors duration-300 text-center"
              placeholder="Enter your username"
              required
              autoFocus
              maxLength={50}
            />
            <Button type="submit" className="w-full mt-4">
              Save
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default UsernameModal;