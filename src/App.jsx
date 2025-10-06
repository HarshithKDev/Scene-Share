import React, { useState, useEffect } from 'react';
import LoginPage from './pages/LoginPage';
import LobbyPage from './pages/LobbyPage';
import StreamRoomPage from './pages/StreamRoomPage';
import './index.css';

export default function App() {
  const [currentView, setCurrentView] = useState('login');
  const [theme, setTheme] = useState('dark');
  const [user, setUser] = useState(null);
  const [roomId, setRoomId] = useState('');
  const [isHost, setIsHost] = useState(false);
  
  // Apply the theme to the HTML element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleLogin = (userData) => {
    setUser(userData);
    setCurrentView('lobby');
  };

  const handleCreateRoom = () => {
    const newRoomId = `movie-night-${Math.random().toString(36).substr(2, 9)}`;
    setRoomId(newRoomId);
    setIsHost(true);
    setCurrentView('room');
  };

  const handleJoinRoom = (id) => {
    setRoomId(id);
    setIsHost(false);
    setCurrentView('room');
  };

  const handleLeaveRoom = () => {
    setCurrentView('lobby');
    setRoomId('');
    setIsHost(false);
  };

  const renderView = () => {
    switch (currentView) {
      case 'lobby':
        return (
          <LobbyPage
            user={user}
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            theme={theme}
            toggleTheme={toggleTheme}
          />
        );
      case 'room':
        return (
          <StreamRoomPage
            isHost={isHost}
            roomId={roomId}
            onLeaveRoom={handleLeaveRoom}
            theme={theme}
            toggleTheme={toggleTheme}
          />
        );
      case 'login':
      default:
        return (
          <LoginPage onLogin={handleLogin} theme={theme} toggleTheme={toggleTheme} />
        );
    }
  };
  
  return (
    <div>
      {renderView()}
    </div>
  );
}