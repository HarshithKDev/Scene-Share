// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, googleProvider } from '../firebase';
import ThemeToggle from '../components/ThemeToggle';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { GoogleIcon } from '../components/Icons'; // Keeping GoogleIcon as it's specific

const LoginPage = () => {
  const { theme, toggleTheme } = useTheme();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
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
                Login
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-2 px-4 rounded-md transition-all duration-300 font-medium ${!isLogin ? 'bg-neutral-800' : 'text-neutral-400 hover:text-white'}`}
              >
                Sign Up
              </button>
            </div>

            {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-neutral-950 rounded-lg border-2 border-neutral-700 focus:border-white focus:outline-none transition-colors"
                placeholder="your@email.com" required
              />
              <input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-neutral-950 rounded-lg border-2 border-neutral-700 focus:border-white focus:outline-none transition-colors"
                placeholder="••••••••" required
              />
              <Button type="submit" className="w-full">
                {isLogin ? 'Login' : 'Sign Up'}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-neutral-900 text-neutral-400">
                  Or continue with
                </span>
              </div>
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