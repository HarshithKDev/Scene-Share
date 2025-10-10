// src/pages/StreamRoomLayout.jsx
import React, { useState, useEffect, useRef } from 'react';
import { LocalVideoTrack, RemoteUser } from "agora-rtc-react";
import ThemeToggle from '../components/ThemeToggle';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import {
  UsersIcon, VideoCameraIcon, VideoCameraSlashIcon, MicrophoneIcon, MicrophoneSlashIcon,
  LogoutIcon, StopIcon, CopyIcon, CheckIcon
} from '../components/Icons';
import { useToast } from '../context/ToastContext';

// Helper to get initials and a color for the avatar
const getAvatarDetails = (name) => {
    const initials = name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U';
    const colors = ['bg-red-500', 'bg-green-500', 'bg-blue-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500'];
    const colorIndex = (name || '').charCodeAt(0) % colors.length;
    return { initials, color: colors[colorIndex] };
};

const Avatar = ({ name }) => {
    const { initials, color } = getAvatarDetails(name);
    return (
        <div className={`w-full h-full flex items-center justify-center ${color}`}>
            <span className="text-4xl font-bold text-white">{initials}</span>
        </div>
    );
};

const StreamRoomLayout = ({ 
  isHost, selfViewTrack, remoteUsers, toggleMic, toggleCamera, micOn, cameraOn, handleLeave,
  isConnected, handleStartStream, isMoviePlaying, roomId, handleStopMovie, dataStreamReady,
  hostScreenUser, screenVideoTrack, screenShareError, setScreenShareError
}) => {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const { addToast } = useToast();
  const [copied, setCopied] = useState(false);
  
  const mainVideoContainerRef = useRef(null);
  const totalParticipants = 1 + remoteUsers.filter(u => !u.uid.toString().endsWith('-screen')).length;


  const handleCopyRoomId = () => {
    navigator.clipboard.writeText(roomId).then(() => {
      setCopied(true);
      addToast('Room ID copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ... (useEffect hooks for video playback remain the same) ...

  const renderMainView = () => { /* ... (renderMainView logic remains the same) ... */ };

  return (
    <div className="flex flex-col md:flex-row h-screen">
      <main className="flex-1 bg-black flex items-center justify-center relative">
        {renderMainView()}
        {screenShareError && (
             <div className="absolute bottom-4 left-4 bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-semibold shadow-lg">
                <p className="font-bold">Screen Share Error:</p>
                <p>{screenShareError}</p>
            </div>
        )}
      </main>
      
      <aside className="w-full md:max-w-sm bg-gray-900/95 backdrop-blur-lg p-4 flex flex-col space-y-4 overflow-y-auto border-l border-gray-700">
        <div className="text-center">
          <h2 className="text-white text-xl font-bold">Room Code</h2>
          <div className="text-gray-400 text-lg font-mono tracking-widest flex items-center justify-center gap-2 cursor-pointer hover:text-white p-2 bg-black/20 rounded-lg" onClick={handleCopyRoomId}>
            <span>{copied ? 'Copied!' : roomId}</span>
            {copied ? <CheckIcon /> : <CopyIcon />}
          </div>
        </div>
        
        <h3 className="text-white text-lg font-bold flex items-center gap-2 shrink-0">
          <UsersIcon /> Participants ({totalParticipants})
        </h3>

        {/* Self View */}
        <div className="relative rounded-lg overflow-hidden bg-black shrink-0 border-2 border-blue-500">
            {cameraOn && selfViewTrack ? (
                <LocalVideoTrack track={selfViewTrack} play={true} style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover' }} />
            ) : (
                <div style={{ width: '100%', aspectRatio: '16/9' }} className="flex items-center justify-center bg-gray-800 text-white">
                    <Avatar name={user.displayName || user.email} />
                </div>
            )}
            <div className="absolute top-0 left-0 p-2 flex items-center gap-1">
                <span className="bg-black/60 text-white text-xs px-2 py-1 rounded">
                    {user.displayName || user.email} (You)
                </span>
                {isHost && <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded font-semibold">HOST</span>}
            </div>
            {/* ... (mic/camera buttons) ... */}
        </div>

        {/* Remote Users */}
        {remoteUsers.map(remoteUser => {
          const isScreenClient = remoteUser.uid.toString().endsWith('-screen');
          if (isScreenClient) return null;
          
          return (
            <div key={remoteUser.uid} className="relative rounded-lg overflow-hidden shrink-0 border border-gray-600 bg-gray-800">
              {remoteUser.hasVideo ? (
                <RemoteUser user={remoteUser} playVideo={true} playAudio={true} style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', aspectRatio: '16/9' }}>
                    <Avatar name={remoteUser.uid.toString()} />
                </div>
              )}
            </div>
          );
        })}
        
        <div className="flex-grow"></div>
        
        {/* ... (Controls section remains the same) ... */}
      </aside>
    </div>
  );
};

export default StreamRoomLayout;