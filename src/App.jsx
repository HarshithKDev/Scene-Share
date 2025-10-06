import React, { useState, useEffect } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged } from "firebase/auth";
import LoginPage from './pages/LoginPage';
import LobbyPage from './pages/LobbyPage';
import StreamRoomPage from './pages/StreamRoomPage';
import './index.css';

// The URL of your running backend server
const BACKEND_URL = 'http://localhost:8080';

export default function App() {
  const [currentView, setCurrentView] = useState('loading');
  const [theme, setTheme] = useState('dark');
  const [user, setUser] = useState(null);
  const [roomId, setRoomId] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [agoraToken, setAgoraToken] = useState(null); // State to hold the Agora token

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setCurrentView('lobby');
      } else {
        setUser(null);
        setCurrentView('login');
      }
    });
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

  const fetchAgoraToken = async (channelName) => {
    if (!user) {
      alert("You must be logged in to join a room.");
      return null;
    }
    
    try {
      const idToken = await user.getIdToken();
      const response = await fetch(`${BACKEND_URL}/get-agora-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ channelName }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get token: ${errorText}`);
      }

      const data = await response.json();
      return data.token;

    } catch (error) {
      console.error("Error fetching Agora token:", error);
      alert(`Error: ${error.message}`);
      return null;
    }
  };

  const handleCreateRoom = async () => {
    const newRoomId = `movie-night-${Math.random().toString(36).substr(2, 9)}`;
    const token = await fetchAgoraToken(newRoomId);
    if (token) {
      setRoomId(newRoomId);
      setAgoraToken(token);
      setIsHost(true);
      setCurrentView('room');
    }
  };

  const handleJoinRoom = async (id) => {
    const token = await fetchAgoraToken(id);
    if (token) {
      setRoomId(id);
      setAgoraToken(token);
      setIsHost(false);
      setCurrentView('room');
    }
  };

  const handleLeaveRoom = () => {
    setCurrentView('lobby');
    setRoomId('');
    setAgoraToken(null);
    setIsHost(false);
  };
  
  // ... (renderView function remains the same, but we pass more props now)
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
            token={agoraToken}
            user={user}
            onLeaveRoom={handleLeaveRoom}
            theme={theme}
            toggleTheme={toggleTheme}
            appId={import.meta.env.VITE_AGORA_APP_ID}
          />
        );
      case 'login':
        return (
          <LoginPage theme={theme} toggleTheme={toggleTheme} />
        );
      case 'loading':
      default:
        return <div className="min-h-screen bg-white dark:bg-[#0B1320]"></div>;
    }
  };
  
  return (
    <div>
      {renderView()}
    </div>
  );
}