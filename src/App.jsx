import React, { useState, useEffect } from 'react';
import { auth } from './firebase'; // Import auth from your firebase config
import { onAuthStateChanged } from "firebase/auth";
import LoginPage from './pages/LoginPage';
import LobbyPage from './pages/LobbyPage';
import StreamRoomPage from './pages/StreamRoomPage';
import './index.css';

export default function App() {
  const [currentView, setCurrentView] = useState('loading'); // Start with a loading state
  const [theme, setTheme] = useState('dark');
  const [user, setUser] = useState(null);
  const [roomId, setRoomId] = useState('');
  const [isHost, setIsHost] = useState(false);
  
  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        // User is signed in
        setUser(currentUser);
        setCurrentView('lobby');
      } else {
        // User is signed out
        setUser(null);
        setCurrentView('login');
      }
    });

    // Clean up the subscription on unmount
    return () => unsubscribe();
  }, []);

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
            appId={import.meta.env.VITE_AGORA_APP_ID} // Pass App ID from environment variable
          />
        );
      case 'login':
        return (
          <LoginPage theme={theme} toggleTheme={toggleTheme} />
        );
      case 'loading':
      default:
        // Optional: A loading spinner or splash screen
        return <div className="min-h-screen bg-white dark:bg-[#0B1320]"></div>;
    }
  };
  
  return (
    <div>
      {renderView()}
    </div>
  );
}