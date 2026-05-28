// src/App.jsx
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useToast } from './context/ToastContext';
import { auth, updateProfile } from './firebase';
import { sanitizeInput, sanitizeRoomId } from './utils/sanitize';

import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/routes/ProtectedRoute.jsx';
import Room from './components/routes/Room';
import './index.css';

// Lazy load components
const LandingPage = lazy(() => import('./pages/LandingPage')); // <-- Import LandingPage
const LoginPage = lazy(() => import('./pages/LoginPage'));
const LobbyPage = lazy(() => import('./pages/LobbyPage'));
const UsernameModal = lazy(() => import('./components/UsernameModal'));

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
    </div>
  );
}

export default function App() {
  const { user, setUser } = useAuth();
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const navigate = useNavigate();
  const { addToast } = useToast();

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
    if (!auth.currentUser) return;
    const sanitizedUsername = sanitizeInput(newUsername);
    if (sanitizedUsername) {
      try {
        await updateProfile(auth.currentUser, { displayName: sanitizedUsername });
        await auth.currentUser.getIdToken(true); // Force token refresh
        // Manually update the user object in context after profile update
        const updatedUser = { ...auth.currentUser, displayName: sanitizedUsername };
        setUser(updatedUser); // Update context state

        setShowUsernameModal(false);
        setIsNewUser(false);
        addToast('Username updated successfully!', 'success');
        // Redirect to lobby after setting username if they were new
        if (isNewUser) {
           navigate('/lobby');
        }
      } catch (error) {
        console.error("Error updating profile: ", error);
        addToast(`Error updating username: ${error.message}`, 'error');
      }
    }
  };

  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 6).toUpperCase() + '-' + 
           Math.random().toString(36).substring(2, 6).toUpperCase() + '-' + 
           Math.random().toString(36).substring(2, 6).toUpperCase();
  };

  const handleCreateRoom = async () => {
     if (!user) {
       addToast('Please log in to create a room.', 'error');
       navigate('/login');
       return;
     }
     
    let attempts = 0;
    const maxAttempts = 3;
    let roomCode;

    while (attempts < maxAttempts) {
        roomCode = generateRoomCode();
        try {
            const idToken = await user.getIdToken();
            const response = await fetch(`${BACKEND_URL}/create-room`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`,
                },
                body: JSON.stringify({ channelName: roomCode }),
            });

            if (!response.ok) {
                if (response.status === 409) {
                    attempts++;
                    continue; // Room exists, try another code
                }
                const text = await response.text();
                let errorMessage = `HTTP Error ${response.status}`;
                try {
                    const errorData = JSON.parse(text);
                    if (errorData && errorData.error) {
                        errorMessage = errorData.error;
                    }
                } catch (e) {
                    // Not JSON, fallback to text if available
                    if (text) errorMessage = text;
                }
                throw new Error(errorMessage);
            }

            navigate(`/room/${roomCode}`, { state: { isHost: true } });
            return; // Success
        } catch (error) {
            console.error("Failed to create room on server:", error);
            addToast(`Failed to create room: ${error.message}`, 'error');
            return; // Break on network errors or other unknown errors
        }
    }
    
    addToast('Failed to generate a unique room code. Please try again.', 'error');
  };

  const handleJoinRoom = (id) => {
    if (!user) {
       addToast('Please log in to join a room.', 'error');
       navigate('/login');
       return;
     }
    const sanitizedId = sanitizeRoomId(id);
    if (sanitizedId && sanitizedId.length >= 6) {
      navigate(`/room/${sanitizedId}`, { state: { isHost: false } });
    } else {
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
          {/* Landing page is now the root and public */}
          <Route path="/" element={<LandingPage />} />

          {/* Login page: Redirect logged-in users to the lobby */}
          <Route
            path="/login"
            element={user ? <Navigate to="/lobby" /> : <LoginPage />}
          />

          {/* Lobby page is protected */}
          <Route
             path="/lobby"
             element={
               <ProtectedRoute>
                 <LobbyPage
                   onCreateRoom={handleCreateRoom}
                   onJoinRoom={handleJoinRoom}
                   onEditUsername={openEditUsernameModal}
                 />
               </ProtectedRoute>
             }
           />

          {/* Room page remains protected */}
          <Route
            path="/room/:roomId"
            element={<ProtectedRoute><Room /></ProtectedRoute>}
          />

           {/* Redirect any unknown paths to the landing page */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}