// App.jsx - UPDATED fetchAgoraToken function
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

  // IMPROVED fetchAgoraToken with better error handling for screen sharing
  const fetchAgoraToken = useCallback(async (channelName, uid) => {
    if (!user) {
      console.error('❌ No user authenticated');
      throw new Error('User not authenticated');
    }
    
    try {
      const idToken = await user.getIdToken();
      const targetUid = uid || user.uid;
      
      console.log(`🔑 Requesting token for channel: ${channelName}, UID: ${targetUid}`);
      
      const response = await fetch(`${BACKEND_URL}/get-agora-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ 
          channelName, 
          uid: targetUid.toString()
        }),
      });
      
      if (!response.ok) {
        let errorText;
        try {
          errorText = await response.text();
        } catch {
          errorText = response.statusText;
        }
        
        console.error('❌ Token fetch failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
          channelName,
          uid: targetUid
        });
        
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      
      if (!data.token) {
        throw new Error('No token received from server');
      }
      
      console.log('✅ Token received successfully for UID:', targetUid);
      return data.token;
    } catch (error) {
      console.error("❌ Error fetching Agora token:", {
        error: error.message,
        channelName,
        uid: uid || user?.uid
      });
      throw error;
    }
  }, [user]);

  const handleCreateRoom = async () => {
    if (!user) return;
    const roomCode = Math.floor(100000 + Math.random() * 900000).toString();
    
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

    const hostedRooms = JSON.parse(sessionStorage.getItem('hosted_rooms') || '{}');
    const isHost = location.state?.isHost || !!hostedRooms[roomId];

    useEffect(() => {
      const getToken = async () => {
        if (user && roomId) {
          setTokenError(null);
          setLoadingToken(true);
          
          try {
            const token = await fetchAgoraToken(roomId, user.uid);
            if (token) {
              setAgoraToken(token);
            } else {
              setTokenError('Failed to get access token. Please try again.');
            }
          } catch (error) {
            console.error('❌ Token fetch error:', error);
            setTokenError(`Failed to join room: ${error.message}`);
          } finally {
            setLoadingToken(false);
          }
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
            <div className="text-sm text-gray-400 mt-2">Authenticating and getting token</div>
          </div>
        </div>
      );
    }

    if (tokenError) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center text-white">
          <div className="text-center max-w-md p-6">
            <div className="text-red-500 text-xl mb-4">Connection Error</div>
            <div className="mb-4 bg-gray-800 p-4 rounded text-left">
              <div className="text-sm font-mono break-all">{tokenError}</div>
            </div>
            <div className="flex gap-4 justify-center">
              <button 
                onClick={handleLeaveRoom}
                className="bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
              >
                Return to Lobby
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <StreamRoomPageWrapper
        key={`${user.uid}-${roomId}`}
        isHost={isHost}
        roomId={roomId}
        token={agoraToken}
        user={user}
        onLeaveRoom={handleLeaveRoom}
        theme={theme}
        toggleTheme={toggleTheme}
        appId={import.meta.env.VITE_AGORA_APP_ID}
        fetchAgoraToken={fetchAgoraToken}
      />
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-white"></div>
      </div>
    );
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