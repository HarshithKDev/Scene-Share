import React, { useState } from 'react';
import ThemeToggle from '../components/ThemeToggle';
import { GoogleIcon } from '../components/Icons';
import { 
  auth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  googleProvider 
} from '../firebase';

const LoginPage = ({ theme, toggleTheme }) => {
  const [activeTab, setActiveTab] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (activeTab === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError(err.message);
      console.error("Firebase authentication error:", err);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setError(err.message);
      console.error("Google sign-in error:", err);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black transition-colors duration-300 flex items-center justify-center p-4">
      <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
      
      <div className="w-full max-w-md">
        <h1 className="text-5xl md:text-6xl font-bold text-center mb-12 text-gray-900 dark:text-white tracking-tight">
          Scene-Share
        </h1>

        <div className="bg-gray-100 dark:bg-gray-900 rounded-2xl shadow-2xl p-8 transition-colors duration-300 border border-gray-200 dark:border-gray-800">
          <div className="flex mb-8 bg-gray-200 dark:bg-black rounded-lg p-1">
            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-2 px-4 rounded-md transition-all duration-300 font-medium ${
                activeTab === 'login'
                  ? 'bg-black dark:bg-white text-white dark:text-black'
                  : 'text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setActiveTab('signup')}
              className={`flex-1 py-2 px-4 rounded-md transition-all duration-300 font-medium ${
                activeTab === 'signup'
                  ? 'bg-black dark:bg-white text-white dark:text-black'
                  : 'text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>

          {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-black text-gray-900 dark:text-white rounded-lg border-2 border-gray-300 dark:border-gray-700 focus:border-gray-900 dark:focus:border-white focus:outline-none transition-colors duration-300"
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-black text-gray-900 dark:text-white rounded-lg border-2 border-gray-300 dark:border-gray-700 focus:border-gray-900 dark:focus:border-white focus:outline-none transition-colors duration-300"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-black dark:bg-white text-white dark:text-black py-3 rounded-lg font-semibold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors duration-300 shadow-lg"
            >
              {activeTab === 'login' ? 'Login' : 'Sign Up'}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400">
                  Or continue with
                </span>
              </div>
            </div>

            <button
              onClick={handleGoogleSignIn}
              className="mt-6 w-full bg-white dark:bg-gray-800 text-gray-700 dark:text-white py-3 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-300 shadow-lg flex items-center justify-center gap-3 border border-gray-300 dark:border-gray-600"
            >
              <GoogleIcon />
              Sign in with Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;