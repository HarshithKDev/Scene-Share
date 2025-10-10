// src/App.jsx - FINAL VERSION
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { updateProfile } from 'firebase/auth';
import { sanitizeInput } from './utils/sanitize';

import ErrorBoundary from './components/ErrorBoundary'; 
import ProtectedRoute from './components/routes/ProtectedRoute.jsx';
import Room from './components/routes/Room';
import './index.css';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const LobbyPage = lazy(() => import('./pages/LobbyPage'));
const UsernameModal = lazy(() => import('./components/UsernameModal'));

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-white"></div>
    </div>
  );
}

export default function App() {
  const { user, setUser } = useAuth();
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      const isNew = user.metadata.creationTime === user.metadata.lastSignInTime;
      const needsUsername = !user.displayName;
      if (needsUsername) {
        setIsNewUser(isNew || needsUsername);
        setShowUsernameModal(true);
      }
    }
  }, [user]);

  const handleUpdateUsername = async (newUsername) => {
    if (!user) return;
    const sanitizedUsername = sanitizeInput(newUsername);
    if (sanitizedUsername) {
      try {
        await updateProfile(user, { displayName: sanitizedUsername });
        const updatedUser = { ...user, displayName: sanitizedUsername };
        setUser(updatedUser); 
        setShowUsernameModal(false);
        setIsNewUser(false);
      } catch (error) {
        console.error("Error updating profile: ", error);
      }
    }
  };

  const handleCreateRoom = async () => {
    const roomCode = Math.floor(100000 + Math.random() * 900000).toString();
    try {
        const idToken = await user.getIdToken();
        await fetch(`${BACKEND_URL}/create-room`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
            body: JSON.stringify({ channelName: roomCode }),
        });
        navigate(`/room/${roomCode}`);
    } catch (error) {
        console.error("Failed to create room on server:", error);
        // Show a toast error to the user
    }
  };

  const handleJoinRoom = (id) => {
    const sanitizedId = sanitizeInput(id);
    if (sanitizedId) {
      navigate(`/room/${sanitizedId}`);
    }
  };

  const openEditUsernameModal = () => {
    setIsNewUser(false);
    setShowUsernameModal(true);
  };
  
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        {showUsernameModal && <UsernameModal onSubmit={handleUpdateUsername} isNewUser={isNewUser} />}
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
          <Route path="/" element={<ProtectedRoute><LobbyPage onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} onEditUsername={openEditUsernameModal} /></ProtectedRoute>} />
          <Route path="/room/:roomId" element={<ProtectedRoute><Room /></ProtectedRoute>} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}