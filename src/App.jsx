// src/App.jsx - FINAL VERSION
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useToast } from './context/ToastContext'; // --- IMPORT useToast ---
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
  const { addToast } = useToast(); // --- USE the hook ---

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
        addToast('Username updated successfully!', 'success'); // Success feedback
      } catch (error) {
        console.error("Error updating profile: ", error);
        addToast(`Error updating username: ${error.message}`, 'error'); // Error feedback
      }
    }
  };

  const handleCreateRoom = async () => {
    const roomCode = Math.floor(100000 + Math.random() * 900000).toString();
    try {
        const idToken = await user.getIdToken();
        const response = await fetch(`${BACKEND_URL}/create-room`, { // --- Capture response ---
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
            body: JSON.stringify({ channelName: roomCode }),
        });

        // --- NEW: Check if response is ok ---
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Server responded with an error');
        }

        navigate(`/room/${roomCode}`, { state: { isHost: true } }); // Navigate as host
    } catch (error) {
        console.error("Failed to create room on server:", error);
        // --- NEW: Show a toast error to the user ---
        addToast(`Failed to create room: ${error.message}`, 'error');
    }
  };

  const handleJoinRoom = (id) => {
    const sanitizedId = sanitizeInput(id);
    if (sanitizedId && sanitizedId.length >= 6) { // Basic validation
      navigate(`/room/${sanitizedId}`, { state: { isHost: false } }); // Navigate as participant
    } else {
      // --- NEW: Show a toast for invalid input ---
      addToast('Please enter a valid Room ID.', 'error');
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