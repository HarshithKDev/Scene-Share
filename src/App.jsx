// App.jsx - Updated token handling
import React, { useState, useEffect, useCallback } from 'react';
import { auth, updateProfile } from './firebase';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { Routes, Route, useNavigate, useParams, Navigate, useLocation } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import LobbyPage from './pages/LobbyPage';
import StreamRoomPageWrapper from './pages/StreamRoomPage';
import UsernameModal from './components/UsernameModal';
import './index.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

export default function App() {
  const [theme, setTheme] = useState('dark');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
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
      if (currentUser) {
        const isNew = currentUser.metadata.creationTime === currentUser.metadata.lastSignInTime;
        if ((isNew && !currentUser.displayName) || !currentUser.displayName) {
          setIsNewUser(true);
          setShowUsernameModal(true);
        }
        setUser(currentUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);
  
  const handleUpdateUsername = async (newUsername) => {
    const userToUpdate = auth.currentUser;
    if (userToUpdate && newUsername) {
      try {
        await updateProfile(userToUpdate, { displayName: newUsername });
        await userToUpdate.reload();
        const refreshedUser = auth.currentUser;
        setUser(refreshedUser);
        setShowUsernameModal(false);
        setIsNewUser(false); 
      } catch (error) {
        console.error("Error updating profile: ", error);
      }
    }
  };

  // Enhanced token fetching with error handling
  const fetchAgoraToken = useCallback(async (channelName) => {
    if (!user) {
      console.error('No user authenticated');
      return null;
    }
    
    try {
      const idToken = await user.getIdToken();
      console.log('Fetching token for channel:', channelName);
      
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
        console.error('Token fetch failed:', response.status, errorText);
        throw new Error(`Failed to get token: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Token received successfully');
      return data.token;
    } catch (error) {
      console.error("Error fetching Agora token:", error);
      return null;
    }
  }, [user]);

  const handleCreateRoom = async () => {
    if (!user) return;
    const roomCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Persist host status in sessionStorage
    const hostedRooms = JSON.parse(sessionStorage.getItem('hosted_rooms') || '{}');
    hostedRooms[roomCode] = true;
    sessionStorage.setItem('hosted_rooms', JSON.stringify(hostedRooms));

    navigate(`/room/${roomCode}`, { state: { isHost: true } });
  };

  const handleJoinRoom = (id) => {
    navigate(`/room/${id}`, { state: { isHost: false } });
  };

  const handleLeaveRoom = () => {
    navigate('/');
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const openEditUsernameModal = () => {
    setIsNewUser(false);
    setShowUsernameModal(true);
  };

  const Room = () => {
    const { roomId } = useParams();
    const location = useLocation();
    const [agoraToken, setAgoraToken] = useState(null);
    const [loadingToken, setLoadingToken] = useState(true);
    const [tokenError, setTokenError] = useState(null);

    // Check sessionStorage to persist host status on refresh
    const hostedRooms = JSON.parse(sessionStorage.getItem('hosted_rooms') || '{}');
    const isHost = location.state?.isHost || !!hostedRooms[roomId];

    useEffect(() => {
      const getToken = async () => {
        if (user && roomId) {
          setTokenError(null);
          const token = await fetchAgoraToken(roomId);
          if (token) {
            setAgoraToken(token);
          } else {
            setTokenError('Failed to get access token. Please try again.');
          }
          setLoadingToken(false);
        }
      };
      getToken();
    }, [roomId, user, fetchAgoraToken]);

    if (loadingToken) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center text-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <div>Joining room {roomId}...</div>
          </div>
        </div>
      );
    }

    if (tokenError) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center text-white">
          <div className="text-center">
            <div className="text-red-500 text-xl mb-4">Error</div>
            <div className="mb-4">{tokenError}</div>
            <button 
              onClick={handleLeaveRoom}
              className="bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
            >
              Return to Lobby
            </button>
          </div>
        </div>
      );
    }

    return (
      <StreamRoomPageWrapper
        key={`${user.uid}-${roomId}`} // Force re-mount on room or user change
        isHost={isHost}
        roomId={roomId}
        token={agoraToken}
        user={user}
        onLeaveRoom={handleLeaveRoom}
        theme={theme}
        toggleTheme={toggleTheme}
        appId={import.meta.env.VITE_AGORA_APP_ID}
        onTokenError={setTokenError}
      />
    );
  };

  if (loading) {
    return <div className="min-h-screen bg-white dark:bg-black"></div>;
  }
  
  return (
    <>
      {showUsernameModal && <UsernameModal onSubmit={handleUpdateUsername} isNewUser={isNewUser} />}
      <Routes>
        <Route path="/login" element={!user ? <LoginPage theme={theme} toggleTheme={toggleTheme} /> : <Navigate to="/" />} />
        <Route path="/" element={user ? <LobbyPage user={user} onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} onLogout={handleLogout} onEditUsername={openEditUsernameModal} theme={theme} toggleTheme={toggleTheme} /> : <Navigate to="/login" />} />
        <Route path="/room/:roomId" element={user ? <Room /> : <Navigate to="/login" />} />
      </Routes>
    </>
  );
}