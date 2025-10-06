import React, { useState } from 'react';
import ThemeToggle from '../components/ThemeToggle';
import { PlusIcon, UsersIcon } from '../components/Icons';

const LobbyPage = ({ user, onCreateRoom, onJoinRoom, theme, toggleTheme }) => {
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
    <div className="min-h-screen bg-white dark:bg-[#0B1320] transition-colors duration-300">
      <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
      
      <div className="container mx-auto px-4 py-8">
        <header className="mb-12 pt-8">
          <h1 className="text-4xl md:text-5xl font-bold text-[#1C3F60] dark:text-[#B1D4E0] mb-2">
            Welcome back, {user?.name || 'User'}!
          </h1>
          <p className="text-[#1C3F60]/80 dark:text-[#AFC1D0] text-lg">
            Ready to stream your favorite movies with friends?
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Create Room Card */}
          <div className="bg-[#B1D4E0] dark:bg-[#1C3F60] rounded-2xl shadow-xl p-8 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-[#1C3F60] dark:bg-[#B1D4E0] rounded-lg text-[#B1D4E0] dark:text-[#1C3F60]">
                <PlusIcon />
              </div>
              <h2 className="text-2xl font-bold text-[#1C3F60] dark:text-[#B1D4E0]">
                Create a Room
              </h2>
            </div>
            <p className="text-[#1C3F60]/80 dark:text-[#AFC1D0] mb-8">
              Start a new streaming session and invite your friends to watch together.
            </p>
            <button
              onClick={handleCreateRoom}
              className="w-full bg-[#1C3F60] dark:bg-[#B1D4E0] text-[#B1D4E0] dark:text-[#1C3F60] py-4 rounded-lg font-semibold hover:bg-[#0B1320] dark:hover:bg-[#AFC1D0] transition-colors duration-300 shadow-lg flex items-center justify-center gap-2"
            >
              <PlusIcon />
              Create New Stream Room
            </button>
          </div>

          {/* Join Room Card */}
          <div className="bg-[#B1D4E0] dark:bg-[#1C3F60] rounded-2xl shadow-xl p-8 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-[#1C3F60] dark:bg-[#B1D4E0] rounded-lg text-[#B1D4E0] dark:text-[#1C3F60]">
                <UsersIcon />
              </div>
              <h2 className="text-2xl font-bold text-[#1C3F60] dark:text-[#B1D4E0]">
                Join a Room
              </h2>
            </div>
            <p className="text-[#1C3F60]/80 dark:text-[#AFC1D0] mb-8">
              Enter a room ID to join an existing streaming session.
            </p>
            <form onSubmit={handleJoinRoom} className="space-y-4">
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full px-4 py-3 bg-white/50 dark:bg-[#0B1320] text-[#0B1320] dark:text-[#B1D4E0] rounded-lg border-2 border-transparent focus:border-[#1C3F60] dark:focus:border-[#B1D4E0] focus:outline-none transition-colors duration-300"
                placeholder="Enter Room ID"
              />
              <button
                type="submit"
                disabled={!roomId.trim()}
                className="w-full bg-[#1C3F60] dark:bg-[#B1D4E0] text-[#B1D4E0] dark:text-[#1C3F60] py-4 rounded-lg font-semibold hover:bg-[#0B1320] dark:hover:bg-[#AFC1D0] transition-colors duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
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