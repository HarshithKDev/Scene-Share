import React, { useState } from 'react';
import ThemeToggle from '../components/ThemeToggle';
import { PlusIcon, UsersIcon, LogoutIcon, ProfileIcon } from '../components/Icons';

const LobbyPage = ({ user, onCreateRoom, onJoinRoom, onLogout, onEditUsername, theme, toggleTheme }) => {
  const [roomId, setRoomId] = useState('');
  const [showMenu, setShowMenu] = useState(false);

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

  const handleEditUsernameClick = () => {
    onEditUsername();
    setShowMenu(false);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black transition-colors duration-300 relative">
      <div className="absolute top-6 right-6 z-50 flex items-center gap-4">
        <ThemeToggle theme={theme} toggleTheme={toggleTheme} className="!bg-transparent !border-none !text-white transform transition-transform duration-200 hover:scale-110" />
        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)} className="text-white transform transition-transform duration-200 hover:scale-110">
            <ProfileIcon />
          </button>
          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-10">
              <button onClick={handleEditUsernameClick} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left">Edit Username</button>
              <button onClick={onLogout} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left">
                <LogoutIcon />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <header className="mb-12 pt-16 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-3 tracking-tight">
            Welcome, {user?.displayName || user?.email?.split('@')[0] || 'User'}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-xl">
            Create or join a room to start streaming with friends.
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Create Room Card */}
          <div className="bg-gray-100 dark:bg-gray-900 rounded-2xl shadow-xl p-8 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border border-gray-200 dark:border-gray-800 flex flex-col items-center text-center">
            <div className="p-4 bg-black dark:bg-white rounded-full text-white dark:text-black mb-6">
              <PlusIcon />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Create a Room
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8 flex-grow">
              Start a new private room and invite your friends for a movie night.
            </p>
            <button
              onClick={handleCreateRoom}
              className="w-full bg-black dark:bg-white text-white dark:text-black py-3 rounded-lg font-semibold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors duration-300 shadow-lg"
            >
              Start a New Stream
            </button>
          </div>

          {/* Join Room Card */}
          <div className="bg-gray-100 dark:bg-gray-900 rounded-2xl shadow-xl p-8 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border border-gray-200 dark:border-gray-800 flex flex-col items-center text-center">
             <div className="p-4 bg-black dark:bg-white rounded-full text-white dark:text-black mb-6">
              <UsersIcon />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Join a Room
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8 flex-grow">
              Enter a room ID to join an existing stream.
            </p>
            <form onSubmit={handleJoinRoom} className="w-full space-y-4">
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-black text-gray-900 dark:text-white rounded-lg border-2 border-gray-300 dark:border-gray-700 focus:border-gray-900 dark:focus:border-white focus:outline-none transition-colors duration-300 text-center"
                placeholder="Enter Room ID"
              />
              <button
                type="submit"
                disabled={!roomId.trim()}
                className="w-full bg-black dark:bg-white text-white dark:text-black py-3 rounded-lg font-semibold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
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