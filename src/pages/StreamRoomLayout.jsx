// src/pages/StreamRoomLayout.jsx
import React, { useState, useEffect, useRef } from 'react';
import { LocalVideoTrack, RemoteUser } from "agora-rtc-react";
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Copy, Mic, MicOff, Video, VideoOff, Monitor, X, Crown, LogOut, Play, Info } from 'lucide-react';

const Button = ({ children, onClick, variant = 'default', size = 'default', className = '', ...props }) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background';
  const variants = {
    default: 'bg-neutral-700 text-white hover:bg-neutral-600',
    destructive: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'hover:bg-neutral-700 hover:text-white',
  };
  const sizes = { default: 'h-10 py-2 px-4', icon: 'h-10 w-10' };
  return (
    <button onClick={onClick} className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
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
  <div className={`p-2 ${className}`}>{children}</div>
);

const ParticipantCard = ({ user, isSelf, selfViewTrack, micOn, videoOn, isActiveSpeaker, isHostCard, participantDetails, className = '' }) => {
  const displayName = isSelf
    ? `${user.displayName || 'You'}`
    : participantDetails[user.uid]?.displayName || `User-${user.uid.toString().substring(0, 4)}`;

  const videoContainerClasses = `relative w-full aspect-video bg-neutral-800 rounded-md overflow-hidden transition-all duration-300 ${isActiveSpeaker ? 'ring-2 ring-green-500 ring-offset-2 ring-offset-neutral-900' : ''}`;

  return (
    <Card className={className}>
      <CardContent className="flex flex-col gap-2">
        <div className={videoContainerClasses}>
          {isSelf ? (
            selfViewTrack && (
              <>
                <LocalVideoTrack
                  track={selfViewTrack}
                  play={videoOn}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                {!videoOn && (
                  <div className="absolute inset-0 flex items-center justify-center bg-neutral-800">
                    <VideoOff className="w-8 h-8 text-neutral-500" />
                  </div>
                )}
              </>
            )
          ) : (
            <>
              <RemoteUser
                user={user}
                playVideo={user.hasVideo}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              {!user.hasVideo && (
                <div className="absolute inset-0 flex items-center justify-center bg-neutral-800">
                  <VideoOff className="w-8 h-8 text-neutral-500" />
                </div>
              )}
            </>
          )}

          {isHostCard && (
            <div className="absolute top-1 left-1 p-1 bg-black/50 rounded">
              <Crown className="w-4 h-4 text-yellow-400" />
            </div>
          )}

          <div className="absolute bottom-1 right-1 p-1 bg-black/50 rounded text-xs">
            {isSelf ? (micOn ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3 text-red-500" />) : (user.hasAudio ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3 text-red-500" />)}
          </div>
        </div>
        <div className="flex items-center justify-center w-full text-xs">
          <span className="font-semibold truncate">
            {displayName}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};


const ConnectionStateOverlay = ({ state }) => {
    if (state === 'CONNECTED') return null;
    let message = 'Connecting...';
    if (state === 'RECONNECTING') {
        message = 'Connection lost. Reconnecting...';
    } else if (state === 'DISCONNECTED' || state === 'FAILED') {
        message = 'Disconnected.';
    }
    return (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="text-center text-white"><p className="text-xl font-semibold">{message}</p></div>
        </div>
    );
};

const NerdStatsOverlay = ({ stats }) => {
    if (!stats || !stats.screen) return null;
  
    const { fps = 0, bitrate = 0, resolution = 'N/A', uplink = 'N/A', downlink = 'N/A' } = stats.screen;
  
    const getQualityLabel = (quality) => {
      switch (quality) {
        case 0: return 'Unknown';
        case 1: return 'Excellent';
        case 2: return 'Good';
        case 3: return 'Poor';
        case 4: return 'Bad';
        case 5: return 'Very Bad';
        case 6: return 'Down';
        default: return 'N/A';
      }
    };
  
    return (
        <div className="absolute bottom-full left-0 mb-2 bg-black/60 text-white p-3 rounded-lg text-xs font-mono backdrop-blur-sm w-max">
            <h4 className="font-bold mb-1 text-sm">Stream Stats</h4>
            <p>Resolution: <span className="font-semibold">{resolution}</span></p>
            <p>FPS: <span className="font-semibold">{fps}</span></p>
            <p>Bitrate: <span className="font-semibold">{(bitrate / 1000).toFixed(2)} Mbps</span></p>
            <p>Uplink: <span className="font-semibold">{getQualityLabel(uplink)}</span></p>
            <p>Downlink: <span className="font-semibold">{getQualityLabel(downlink)}</span></p>
        </div>
    );
};

const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query);
    const listener = (event) => setMatches(event.matches);

    mediaQueryList.addEventListener('change', listener);

    setMatches(mediaQueryList.matches);

    return () => {
      mediaQueryList.removeEventListener('change', listener);
    };
  }, [query]);

  return matches;
};


const StreamRoomLayout = ({
  isHost, hostUid, selfViewTrack, remoteUsers, toggleMic, toggleCamera, micOn, cameraOn, handleLeave,
  handleStartStream, isMoviePlaying, roomId, handleStopMovie, hostScreenUser, screenShareError,
  activeSpeakerUid, connectionState, isStartingStream, participantDetails, videoStats,
  showNerdStats, setShowNerdStats
}) => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [copied, setCopied] = useState(false);
  const mainVideoContainerRef = useRef(null);
  const isDesktop = useMediaQuery('(min-width: 768px)');

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

  const renderParticipants = (cardClassName) => (
    <>
      <ParticipantCard
        className={cardClassName}
        user={user}
        isSelf={true}
        selfViewTrack={selfViewTrack}
        micOn={micOn}
        videoOn={cameraOn}
        isActiveSpeaker={activeSpeakerUid === user.uid}
        isHostCard={user.uid === hostUid}
        participantDetails={participantDetails}
      />
      {participantUsers.map(remoteUser => (
        <ParticipantCard
          key={remoteUser.uid}
          className={cardClassName}
          user={remoteUser}
          isSelf={false}
          isActiveSpeaker={activeSpeakerUid === remoteUser.uid}
          isHostCard={remoteUser.uid === hostUid}
          participantDetails={participantDetails}
        />
      ))}
    </>
  );

  return (
    <div className='flex flex-col h-screen bg-neutral-950 text-white'>
      {!isDesktop && (
        <div className='flex items-center justify-between p-2 border-b border-neutral-800'>
            <div className="flex items-center gap-3">
                <div className="flex flex-col">
                    <span className="text-xs text-neutral-400">ROOM</span>
                    <span className="font-mono tracking-wider">{roomId}</span>
                </div>
                <Button size='icon' variant='ghost' onClick={copyRoomCode}><Copy className='w-4 h-4' /></Button>
            </div>
        </div>
      )}

      <div className='flex-1 flex flex-col md:flex-row min-h-0'>
        <main className='flex-1 flex items-center justify-center bg-neutral-900 relative p-2 md:p-4 min-h-0'>
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
              <div className="absolute bottom-4 left-4 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-lg">
                  {screenShareError}
              </div>
          )}
        </main>
        
        {isDesktop && (
          <aside className="flex flex-col w-64 border-l border-neutral-800 bg-neutral-950">
            <div className='flex items-center justify-between p-2 border-b border-neutral-800'>
                <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                        <span className="text-xs text-neutral-400">ROOM</span>
                        <span className="font-mono tracking-wider">{roomId}</span>
                    </div>
                    <Button size='icon' variant='ghost' onClick={copyRoomCode}><Copy className='w-4 h-4' /></Button>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {renderParticipants('w-full')}
            </div>
          </aside>
        )}
      </div>
      
      {!isDesktop && (
        <div className="flex justify-center overflow-x-auto p-2 gap-2 bg-neutral-950 border-t border-neutral-800">
            {renderParticipants('w-40 flex-shrink-0')}
        </div>
      )}
      
      <footer className="flex justify-center items-center p-3 md:p-4 border-t border-neutral-800 bg-neutral-950 relative">
        <div className="absolute left-4">
            {isHost && isMoviePlaying && (
                <div className="relative">
                    <Button onClick={() => setShowNerdStats(prev => !prev)} variant="ghost" size="icon">
                        <Info className={`w-5 h-5 ${showNerdStats ? 'text-blue-400' : ''}`} />
                    </Button>
                    {showNerdStats && <NerdStatsOverlay stats={videoStats} />}
                </div>
            )}
        </div>
        <div className="flex gap-4">
          <Button onClick={toggleMic} variant="ghost" size="icon">{micOn ? <Mic className='w-5 h-5' /> : <MicOff className='w-5 h-5 text-red-500' />}</Button>
          <Button onClick={toggleCamera} variant="ghost" size="icon">{cameraOn ? <Video className='w-5 h-5' /> : <VideoOff className='w-5 h-5 text-red-500' />}</Button>
          {isHost && (
              isMoviePlaying ? (
                  <Button onClick={handleStopMovie} variant="destructive" className="px-6 py-5 text-base font-semibold">
                      <X className='w-5 h-5 mr-2' />Stop Stream
                  </Button>
              ) : (
                  <Button onClick={handleStartStream} disabled={isStartingStream} className="px-6 py-5 text-base font-semibold bg-blue-600 hover:bg-blue-700">
                      <Play className='w-5 h-5 mr-2' />{isStartingStream ? 'Starting...' : 'Start Stream'}
                  </Button>
              )
          )}
        </div>
        <div className="absolute right-4">
          <Button onClick={handleLeave} variant="destructive" size="icon"><LogOut className='w-5 h-5' /></Button>
        </div>
      </footer>
    </div>
  );
};

export default StreamRoomLayout;