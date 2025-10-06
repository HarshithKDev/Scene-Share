import React, { useState, useEffect } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { Routes, Route, useNavigate, useParams, Navigate, useLocation } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import LobbyPage from './pages/LobbyPage';
import StreamRoomPageWrapper from './pages/StreamRoomPage';
import './index.css';

const BACKEND_URL = 'http://localhost:8080';

export default function App() {
  const [theme, setTheme] = useState('dark');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const fetchAgoraToken = async (channelName) => {
    if (!user) return null;
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
      return null;
    }
  };

  const handleCreateRoom = async () => {
    const newRoomId = `room-${Math.random().toString(36).substr(2, 9)}`;
    // Pass 'isHost: true' in the navigation state
    navigate(`/room/${newRoomId}`, { state: { isHost: true } });
  };

  const handleJoinRoom = (id) => {
    // Pass 'isHost: false' in the navigation state
    navigate(`/room/${id}`, { state: { isHost: false } });
  };

  const handleLeaveRoom = () => {
    navigate('/');
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  // This is a sub-component that handles the logic for a single room page.
  const Room = () => {
    const { roomId } = useParams();
    const location = useLocation(); // Get the full location object
    const [agoraToken, setAgoraToken] = useState(null);
    const [loadingToken, setLoadingToken] = useState(true);

    // Safely check for location.state and the isHost property.
    // This prevents crashes on refresh when state is null.
    const isHost = location.state?.isHost || false;

    useEffect(() => {
      const getToken = async () => {
        if (user) {
          const token = await fetchAgoraToken(roomId);
          if (token) {
            setAgoraToken(token);
          }
          setLoadingToken(false);
        }
      };
      getToken();
    }, [roomId, user]);

    if (loadingToken) {
      return <div className="min-h-screen bg-black flex items-center justify-center text-white">Joining room...</div>;
    }

    return (
      <StreamRoomPageWrapper
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
  };

  if (loading) {
    return <div className="min-h-screen bg-white dark:bg-black"></div>;
  }
  
  return (
    <Routes>
      <Route path="/login" element={!user ? <LoginPage theme={theme} toggleTheme={toggleTheme} /> : <Navigate to="/" />} />
      <Route path="/" element={user ? <LobbyPage user={user} onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} /> : <Navigate to="/login" />} />
      <Route path="/room/:roomId" element={user ? <Room /> : <Navigate to="/login" />} />
    </Routes>
  );
}