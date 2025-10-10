// src/pages/StreamRoomLayout.jsx
import React, { useState, useEffect, useRef } from 'react';
import { LocalVideoTrack, RemoteUser } from "agora-rtc-react";
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Copy, Mic, MicOff, Video, VideoOff, Monitor, X, Crown, LogOut, Play, Wifi, WifiOff } from 'lucide-react';

// --- Reusable UI Components (like shadcn/ui) ---

const Button = ({ children, onClick, variant = 'default', size = 'default', className = '' }) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background';
  
  const variants = {
    default: 'bg-neutral-700 text-white hover:bg-neutral-600',
    destructive: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'hover:bg-neutral-700 hover:text-white',
  };

  const sizes = {
    default: 'h-10 py-2 px-4',
    icon: 'h-10 w-10',
  };

  return (
    <button onClick={onClick} className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </button>
  );
};

const Card = ({ children, className = '' }) => (
  <div className={`rounded-lg border bg-neutral-900 border-neutral-800 text-white shadow-sm ${className}`}>
    {children}
  </div>
);

const CardContent = ({ children, className = '' }) => (
  <div className={`p-3 ${className}`}>{children}</div>
);

// --- Main Layout Components ---

const ParticipantCard = ({ user, isSelf, isHost, selfViewTrack, micOn, videoOn, toggleMic, toggleVideo, isActiveSpeaker }) => {
  const displayName = isSelf ? `${user.displayName || 'You'}` : `User-${user.uid.toString().substring(0, 4)}`;
  
  const videoContainerClasses = `relative w-full aspect-video bg-neutral-800 rounded-md flex items-center justify-center overflow-hidden transition-all duration-300 ${isActiveSpeaker ? 'ring-2 ring-green-500 ring-offset-2 ring-offset-neutral-900' : ''}`;

  return (
    <Card>
      <CardContent className="flex flex-col gap-2">
        <div className={videoContainerClasses}>
          {isSelf ? (
            videoOn && selfViewTrack ? (
              <LocalVideoTrack track={selfViewTrack} play={true} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <VideoOff className="w-8 h-8 text-neutral-500" />
            )
          ) : (
            user.hasVideo ? (
              <RemoteUser user={user} playVideo={true} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <VideoOff className="w-8 h-8 text-neutral-500" />
            )
          )}
          <div className="absolute bottom-1 right-2 p-1 bg-black/50 rounded">
            {isSelf ? (micOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4 text-red-500" />) : (user.hasAudio ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4 text-red-500" />)}
          </div>
        </div>
        <div className="flex items-center justify-between w-full text-sm">
          <span className="font-semibold flex items-center gap-1.5 truncate">
            {isHost && <Crown className="w-4 h-4 text-yellow-400" />}
            {displayName}
          </span>
          {isSelf && (
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" onClick={toggleMic} className="h-7 w-7">
                {micOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4 text-red-500" />}
              </Button>
              <Button size="icon" variant="ghost" onClick={toggleVideo} className="h-7 w-7">
                {videoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4 text-red-500" />}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const ConnectionStateOverlay = ({ state }) => {
    if (state === 'CONNECTED') return null;

    let message = 'Connecting...';
    let icon = <Wifi className="w-12 h-12 mx-auto mb-4 animate-pulse" />;

    if (state === 'RECONNECTING') {
        message = 'Connection lost. Reconnecting...';
        icon = <WifiOff className="w-12 h-12 mx-auto mb-4 text-yellow-500 animate-pulse" />;
    } else if (state === 'DISCONNECTED' || state === 'FAILED') {
        message = 'Disconnected.';
        icon = <WifiOff className="w-12 h-12 mx-auto mb-4 text-red-500" />;
    }

    return (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="text-center text-white">
                {icon}
                <p className="text-xl font-semibold">{message}</p>
            </div>
        </div>
    );
};

const StreamRoomLayout = ({
  isHost, selfViewTrack, remoteUsers, toggleMic, toggleCamera, micOn, cameraOn, handleLeave,
  handleStartStream, isMoviePlaying, roomId, handleStopMovie, hostScreenUser, screenShareError,
  activeSpeakerUid, connectionState
}) => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [copied, setCopied] = useState(false);
  const mainVideoContainerRef = useRef(null);

  const participantUsers = remoteUsers.filter(u => !u.uid.toString().endsWith('-screen'));

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomId).then(() => {
      setCopied(true);
      addToast('Room ID copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    });
  };
  
  useEffect(() => {
    const container = mainVideoContainerRef.current;
    if (container && hostScreenUser?.videoTrack) {
      hostScreenUser.videoTrack.play(container, { fit: 'contain' });
    }
    return () => {
      hostScreenUser?.videoTrack?.stop();
    };
  }, [hostScreenUser]);

  return (
    <div className='flex h-screen bg-neutral-950 text-white'>
      {/* Left Sidebar: Participants */}
      <div className='w-full max-w-xs border-r border-neutral-800 flex flex-col p-4 gap-4'>
        <div className='flex items-center justify-between gap-2 mb-2'>
          <div className="flex flex-col">
            <span className="text-xs text-neutral-400">ROOM CODE</span>
            <span className="text-lg font-mono tracking-wider">{roomId}</span>
          </div>
          <Button size='icon' variant='ghost' onClick={copyRoomCode}>
            <Copy className='w-4 h-4' />
          </Button>
        </div>
        
        <div className="flex flex-col gap-4 overflow-y-auto">
          <ParticipantCard
            user={user}
            isSelf={true}
            isHost={isHost}
            selfViewTrack={selfViewTrack}
            micOn={micOn}
            videoOn={cameraOn}
            toggleMic={toggleMic}
            toggleVideo={toggleCamera}
            isActiveSpeaker={activeSpeakerUid === user.uid}
          />
          
          {participantUsers.map(remoteUser => (
            <ParticipantCard 
              key={remoteUser.uid} 
              user={remoteUser} 
              isActiveSpeaker={activeSpeakerUid === remoteUser.uid}
            />
          ))}
        </div>
      </div>

      {/* Main Screen: Screen Share & Controls */}
      <div className='flex-1 flex flex-col'>
        <main className='flex-1 flex items-center justify-center bg-neutral-900 relative p-4'>
          <ConnectionStateOverlay state={connectionState} />
          
          {connectionState === 'CONNECTED' && (
            <>
              {isMoviePlaying && hostScreenUser?.videoTrack ? (
                <div ref={mainVideoContainerRef} className='w-full h-full bg-black rounded-lg'></div>
              ) : (
                <div className='text-center text-neutral-500'>
                  <Monitor size={64} className="mx-auto mb-4" />
                  <h2 className='text-2xl font-bold'>Waiting for Host to Share Screen</h2>
                  {isHost && <p className="mt-2">Click the "Start Stream" button below to begin.</p>}
                </div>
              )}
            </>
          )}

          {screenShareError && (
              <div className="absolute bottom-6 left-6 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-lg">
                  {screenShareError}
              </div>
          )}
        </main>
        
        <footer className="flex justify-center items-center p-4 border-t border-neutral-800 bg-neutral-950 gap-4">
            {isHost && (
                isMoviePlaying ? (
                    <Button onClick={handleStopMovie} variant="destructive" className="px-6 py-5 text-base font-semibold">
                        <X className='w-5 h-5 mr-2' />
                        Stop Stream
                    </Button>
                ) : (
                    <Button onClick={handleStartStream} className="px-6 py-5 text-base font-semibold bg-blue-600 hover:bg-blue-700">
                        <Play className='w-5 h-5 mr-2' />
                        Start Stream
                    </Button>
                )
            )}
            <Button onClick={handleLeave} variant="destructive" size="icon" className="absolute right-6">
                <LogOut className='w-5 h-5' />
            </Button>
        </footer>
      </div>
    </div>
  );
};

export default StreamRoomLayout;