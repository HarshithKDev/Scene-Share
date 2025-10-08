import React, { useState, useEffect } from 'react';
import { auth, updateProfile } from './firebase';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { Routes, Route, useNavigate, useParams, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import LobbyPage from './pages/LobbyPage';
import StreamRoomPageWrapper from './pages/StreamRoomPage';
import UsernameModal from './components/UsernameModal';
import './index.css';

const BACKEND_URL = "";

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
        await userToUpdate.reload(); // Force a reload of the user's profile
        const refreshedUser = auth.currentUser;
        setUser(refreshedUser); // Set state with the refreshed user
        setShowUsernameModal(false);
        setIsNewUser(false); 
      } catch (error) {
        console.error("Error updating profile: ", error);
      }
    }
  };

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
    if (!user) return;
    const roomCode = Math.floor(100000 + Math.random() * 900000).toString();
    const newRoomId = `${roomCode}-host-${user.uid}`;
    navigate(`/room/${newRoomId}`, { state: { isHost: true } });
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
    const [agoraToken, setAgoraToken] = useState(null);
    const [loadingToken, setLoadingToken] = useState(true);
    const isHost = user && roomId.includes(`-host-${user.uid}`);

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
        key={user.uid} // Add a key to force re-mount on user change
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