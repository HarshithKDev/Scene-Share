// src/pages/LobbyPage.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom'; // Import Link
import { useAuth } from '../context/AuthContext';
import { sanitizeInput } from '../utils/sanitize';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Plus, LogIn, User, LogOut } from 'lucide-react';

const LobbyPage = ({ onCreateRoom, onJoinRoom, onEditUsername }) => {
  const { user, logout } = useAuth();
  const [roomId, setRoomId] = useState('');
  const [showMenu, setShowMenu] = useState(false);

  const handleJoinRoom = (e) => {
    e.preventDefault();
    const sanitizedRoomId = sanitizeInput(roomId.trim());
    if (sanitizedRoomId) onJoinRoom(sanitizedRoomId);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white transition-colors duration-300">
       <header className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-20">
          {/* --- MODIFICATION START --- */}
          <Link to="/" className="text-xl font-bold">
            Scene-Share
          </Link>
          {/* --- MODIFICATION END --- */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Button onClick={() => setShowMenu(!showMenu)} variant="ghost" size="icon">
                <User />
              </Button>
              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-neutral-900 border border-neutral-800 rounded-md shadow-lg py-1 z-10">
                  <button onClick={() => { onEditUsername(); setShowMenu(false); }} className="block px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-800 w-full text-left">Edit Username</button>
                  <button onClick={logout} className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-neutral-800 w-full text-left">
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
       </header>

       <main className="container mx-auto px-4 min-h-screen flex flex-col items-center justify-center pt-28 pb-12">
         <div className="text-center mb-12">
           <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">
             Welcome, {sanitizeInput(user?.displayName) || 'User'}!
           </h2>
           <p className="text-neutral-400 text-xl mt-2">
             Create or join a room to start streaming with friends.
           </p>
         </div>

         <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl">
           <Card>
             <CardHeader className="items-center text-center">
                <div className="p-3 bg-blue-600 rounded-full mb-2"><Plus /></div>
                <CardTitle>Create a Room</CardTitle>
                <CardDescription>Start a new private room and invite your friends.</CardDescription>
             </CardHeader>
             <CardContent>
                <Button onClick={onCreateRoom} variant="primary" className="w-full">
                    Start a New Stream
                </Button>
             </CardContent>
           </Card>

           <Card>
             <CardHeader className="items-center text-center">
                <div className="p-3 bg-neutral-700 rounded-full mb-2"><LogIn /></div>
                <CardTitle>Join a Room</CardTitle>
                <CardDescription>Enter a room ID to join an existing stream.</CardDescription>
             </CardHeader>
             <CardContent>
                <form onSubmit={handleJoinRoom} className="w-full space-y-4">
                  <input
                    type="text"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    className="w-full px-4 py-3 bg-neutral-950 text-white rounded-lg border-2 border-neutral-700 focus:border-white focus:outline-none transition-colors duration-300 text-center"
                    placeholder="Enter Room ID"
                  />
                  <Button type="submit" disabled={!roomId.trim()} className="w-full">
                    Join Room
                  </Button>
                </form>
             </CardContent>
           </Card>
         </div>
       </main>
    </div>
  );
};

export default LobbyPage;