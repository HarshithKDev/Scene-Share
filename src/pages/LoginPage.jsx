import React, { useState } from 'react';
import ThemeToggle from '../components/ThemeToggle';
import { GoogleIcon } from '../components/Icons';

const LoginPage = ({ onLogin, theme, toggleTheme }) => {
  const [activeTab, setActiveTab] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(`${activeTab} action triggered with email: ${email}`);
    onLogin({ name: email.split('@')[0], email });
  };

  const handleGoogleSignIn = () => {
    console.log('Google sign-in triggered');
    onLogin({ name: 'Guest User', email: 'guest@example.com' });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0B1320] transition-colors duration-300 flex items-center justify-center p-4">
      <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
      
      <div className="w-full max-w-md">
        <h1 className="text-5xl md:text-6xl font-bold text-center mb-12 text-[#1C3F60] dark:text-[#B1D4E0] tracking-tight">
          Scene-Share
        </h1>

        <div className="bg-[#B1D4E0] dark:bg-[#1C3F60] rounded-2xl shadow-2xl p-8 transition-colors duration-300">
          <div className="flex mb-8 bg-white/50 dark:bg-[#0B1320] rounded-lg p-1">
            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-2 px-4 rounded-md transition-all duration-300 font-medium ${
                activeTab === 'login'
                  ? 'bg-[#1C3F60] dark:bg-[#B1D4E0] text-[#B1D4E0] dark:text-[#1C3F60]'
                  : 'text-[#1C3F60] dark:text-[#AFC1D0] hover:text-[#0B1320] dark:hover:text-[#B1D4E0]'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setActiveTab('signup')}
              className={`flex-1 py-2 px-4 rounded-md transition-all duration-300 font-medium ${
                activeTab === 'signup'
                  ? 'bg-[#1C3F60] dark:bg-[#B1D4E0] text-[#B1D4E0] dark:text-[#1C3F60]'
                  : 'text-[#1C3F60] dark:text-[#AFC1D0] hover:text-[#0B1320] dark:hover:text-[#B1D4E0]'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[#1C3F60] dark:text-[#AFC1D0] mb-2 font-medium">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/50 dark:bg-[#0B1320] text-[#0B1320] dark:text-[#B1D4E0] rounded-lg border-2 border-transparent focus:border-[#1C3F60] dark:focus:border-[#B1D4E0] focus:outline-none transition-colors duration-300"
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-[#1C3F60] dark:text-[#AFC1D0] mb-2 font-medium">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/50 dark:bg-[#0B1320] text-[#0B1320] dark:text-[#B1D4E0] rounded-lg border-2 border-transparent focus:border-[#1C3F60] dark:focus:border-[#B1D4E0] focus:outline-none transition-colors duration-300"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#1C3F60] dark:bg-[#B1D4E0] text-[#B1D4E0] dark:text-[#1C3F60] py-3 rounded-lg font-semibold hover:bg-[#0B1320] dark:hover:bg-[#AFC1D0] transition-colors duration-300 shadow-lg"
            >
              {activeTab === 'login' ? 'Login' : 'Sign Up'}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#1C3F60]/50 dark:border-[#AFC1D0]/30"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[#B1D4E0] dark:bg-[#1C3F60] text-[#1C3F60] dark:text-[#AFC1D0]">
                  Or continue with
                </span>
              </div>
            </div>

            <button
              onClick={handleGoogleSignIn}
              className="mt-6 w-full bg-white text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-300 shadow-lg flex items-center justify-center gap-3"
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