// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, googleProvider } from '../firebase';
import ThemeToggle from '../components/ThemeToggle';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext'; // Make sure this is imported
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';

// Define the GoogleIcon component directly in this file
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const LoginPage = () => {
  const { theme, toggleTheme } = useTheme();
  const { addToast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // --- MODIFICATION: Map Firebase error codes to user-friendly messages ---
  const getFriendlyErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password': // Often included under invalid-credential now, but good to keep
      case 'auth/user-not-found': // Often included under invalid-credential now
        return 'Invalid email or password. Please try again.';
      case 'auth/email-already-in-use':
        return 'This email address is already registered.';
      case 'auth/weak-password':
        return 'Password is too weak. Please choose a stronger password.';
      case 'auth/too-many-requests':
        return 'Too many login attempts. Please try again later.';
      // Add more specific cases as needed
      default:
        // Generic message for unexpected errors
        return 'An authentication error occurred. Please try again.';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      // --- MODIFICATION: Use the mapping function ---
      console.error("Firebase Auth Error:", err.code, err.message); // Log the original error for debugging
      const friendlyMessage = getFriendlyErrorMessage(err.code);
      addToast(friendlyMessage, 'error');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      // --- MODIFICATION: Use the mapping function ---
      console.error("Firebase Google Sign-In Error:", err.code, err.message); // Log original error
      // You might want a slightly different generic message for popup errors
      const friendlyMessage = err.code === 'auth/popup-closed-by-user'
        ? 'Sign-in cancelled.'
        : getFriendlyErrorMessage(err.code);
      addToast(friendlyMessage, 'error');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-4 relative">
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
      </div>

      <div className="w-full max-w-md">
        <h1 className="text-5xl font-bold text-center mb-8 tracking-tight">
          Scene-Share
        </h1>

        <Card>
          <CardContent className="p-6">
            <div className="flex mb-6 bg-neutral-950 rounded-lg p-1 border border-neutral-800">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-2 px-4 rounded-md transition-all duration-300 font-medium ${isLogin ? 'bg-neutral-800' : 'text-neutral-400 hover:text-white'}`}
              >
                Sign In
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-2 px-4 rounded-md transition-all duration-300 font-medium ${!isLogin ? 'bg-neutral-800' : 'text-neutral-400 hover:text-white'}`}
              >
                Sign Up
              </button>
            </div>

            {/* Inline error display is removed */}

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-neutral-950 rounded-lg border-2 border-neutral-700 focus:border-white focus:outline-none transition-colors"
                placeholder="Email" required
              />
              <input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-neutral-950 rounded-lg border-2 border-neutral-700 focus:border-white focus:outline-none transition-colors"
                placeholder="Password" required
              />
              <Button type="submit" className="w-full">
                {isLogin ? 'Login' : 'Sign Up'}
              </Button>
            </form>

            <div className="relative my-6">
              {/* Separator... */}
            </div>

            <Button onClick={handleGoogleSignIn} variant="default" className="w-full">
              <GoogleIcon />
              <span className="ml-3">Sign in with Google</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;