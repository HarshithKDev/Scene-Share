import React, { useState } from 'react';
import ThemeToggle from '../components/ThemeToggle';
import { PlusIcon, UsersIcon, LogoutIcon } from '../components/Icons';

const LobbyPage = ({ user, onCreateRoom, onJoinRoom, onLogout, theme, toggleTheme }) => {
  const [roomId, setRoomId] = useState('');

  const handleCreateRoom = () => {
    console.log('Create room action triggered');
    onCreateRoom();
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    console.log(`Join room action triggered with ID: ${roomId}`);
    if (roomId.trim()) {
      onJoinRoom(roomId);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black transition-colors duration-300">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-12 pt-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome back, {user?.displayName || user?.email?.split('@')[0] || 'User'}!
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Ready to stream your favorite movies with friends?
            </p>
          </div>

          {/* Island element for theme + logout */}
          <div className="flex items-center gap-3 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-full px-4 py-2 shadow-lg">
            <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
            <button
              onClick={onLogout}
              className="flex items-center gap-2 bg-red-600 dark:bg-red-500 text-white py-2 px-4 rounded-full font-semibold hover:bg-red-700 dark:hover:bg-red-600 transition-colors duration-300"
            >
              <LogoutIcon />
              Logout
            </button>
          </div>
        </header>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Create Room Card */}
          <div className="bg-gray-100 dark:bg-gray-900 rounded-2xl shadow-xl p-8 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gray-900 dark:bg-white rounded-lg text-white dark:text-black">
                <PlusIcon />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Create a Room
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Start a new streaming session and invite your friends to watch together.
            </p>
            <button
              onClick={handleCreateRoom}
              className="w-full bg-black dark:bg-white text-white dark:text-black py-4 rounded-lg font-semibold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors duration-300 shadow-lg flex items-center justify-center gap-2"
            >
              <PlusIcon />
              Create New Stream Room
            </button>
          </div>

          {/* Join Room Card */}
          <div className="bg-gray-100 dark:bg-gray-900 rounded-2xl shadow-xl p-8 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gray-900 dark:bg-white rounded-lg text-white dark:text-black">
                <UsersIcon />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Join a Room
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Enter a room ID to join an existing streaming session.
            </p>
            <form onSubmit={handleJoinRoom} className="space-y-4">
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-black text-gray-900 dark:text-white rounded-lg border-2 border-gray-300 dark:border-gray-700 focus:border-gray-900 dark:focus:border-white focus:outline-none transition-colors duration-300"
                placeholder="Enter Room ID"
              />
              <button
                type="submit"
                disabled={!roomId.trim()}
                className="w-full bg-black dark:bg-white text-white dark:text-black py-4 rounded-lg font-semibold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Join Room
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LobbyPage;