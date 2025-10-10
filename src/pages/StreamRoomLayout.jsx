import React, { useState, useEffect, useRef } from 'react';
import { LocalVideoTrack, RemoteUser } from "agora-rtc-react";
import ThemeToggle from '../components/ThemeToggle';
import {
  UsersIcon,
  VideoCameraIcon,
  VideoCameraSlashIcon,
  MicrophoneIcon,
  MicrophoneSlashIcon,
  LogoutIcon,
  StopIcon,
  CopyIcon,
  CheckIcon
} from '../components/Icons';

const StreamRoomLayout = ({ 
  isHost, 
  user, 
  selfViewTrack, 
  remoteUsers, 
  toggleMic, 
  toggleCamera, 
  micOn, 
  cameraOn, 
  handleLeave, 
  theme, 
  toggleTheme, 
  isConnected, 
  handleStartStream, 
  isMoviePlaying, 
  roomId, 
  handleStopMovie, 
  hostUid, 
  dataStreamReady,
  hostScreenUser,
  hostCameraUser,
  connectionError,
  screenVideoTrack,
  screenShareError,
  setScreenShareError
}) => {
  const [copied, setCopied] = useState(false);
  const roomCode = roomId;
  
  const mainVideoContainerRef = useRef(null);

  const totalParticipants = 1 + remoteUsers.length;

  const handleCopyRoomId = () => {
    navigator.clipboard.writeText(roomCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Handle screen share playback for HOST
  useEffect(() => {
    if (isHost && isMoviePlaying && screenVideoTrack && mainVideoContainerRef.current) {
      try {
        screenVideoTrack.play(mainVideoContainerRef.current);
        setScreenShareError(null);
      } catch (error) {
        console.error('❌ Host screen share playback error:', error);
        setScreenShareError('Failed to play screen share: ' + error.message);
      }
      
      return () => {
        if (screenVideoTrack) {
          screenVideoTrack.stop();
        }
      };
    }
  }, [isHost, isMoviePlaying, screenVideoTrack, setScreenShareError]);

  // Handle remote screen share playback for PARTICIPANTS
  useEffect(() => {
    if (!isHost && isMoviePlaying && hostScreenUser && hostScreenUser.videoTrack && mainVideoContainerRef.current) {
      const playScreenShare = async () => {
        try {
          setScreenShareError(null);
          hostScreenUser.videoTrack.stop();
          await hostScreenUser.videoTrack.play(mainVideoContainerRef.current);
          hostScreenUser.videoTrack.on('track-ended', () => {
            console.log('📺 Screen share track ended');
          });
        } catch (error) {
          console.error('❌ Screen share playback failed:', error);
          setScreenShareError('Failed to play screen share. Please try refreshing.');
        }
      };
      playScreenShare();
    }
  }, [isHost, isMoviePlaying, hostScreenUser, setScreenShareError]);

  // Handle camera track playback for host when not sharing screen
  useEffect(() => {
    if (isHost && selfViewTrack && !isMoviePlaying && mainVideoContainerRef.current) {
      try {
        selfViewTrack.play(mainVideoContainerRef.current);
        setScreenShareError(null);
      } catch (error) {
        console.error('Camera playback error:', error);
      }
    }
  }, [isHost, selfViewTrack, isMoviePlaying, setScreenShareError]);

  const renderMainView = () => {
    // For PARTICIPANTS
    if (!isHost) {
      if (isMoviePlaying && hostScreenUser) {
        return (
          <div className="relative w-full h-full bg-black">
            <div 
              className="w-full h-full" 
              ref={mainVideoContainerRef}
              style={{ backgroundColor: 'black' }}
            />
            <div className="absolute top-4 left-4 bg-green-600 text-white px-3 py-1 rounded text-sm font-semibold">
              📺 Live Screen Share
            </div>
          </div>
        );
      } else if (isMoviePlaying && !hostScreenUser) {
        return (
          <div className="w-full h-full flex items-center justify-center bg-gray-900">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-xl font-semibold">Connecting to Screen Share...</p>
            </div>
          </div>
        );
      } else {
        return (
          <div className="w-full h-full flex items-center justify-center bg-gray-900">
            <div className="text-center text-gray-400">
              <UsersIcon className="w-16 h-16 mx-auto mb-4" />
              <p className="text-xl font-semibold">Waiting for Host</p>
            </div>
          </div>
        );
      }
    }

    // For HOST
    if (isMoviePlaying) {
      if (screenVideoTrack) {
        // Active screen share
        return <div className="w-full h-full bg-black" ref={mainVideoContainerRef} />;
      } else {
        // Post-refresh state
        return (
          <div className="w-full h-full flex items-center justify-center bg-gray-900">
            <div className="text-center text-gray-400 p-4">
              <VideoCameraIcon className="w-16 h-16 mx-auto mb-4 text-blue-500" />
              <div className="text-xl font-semibold mb-2 text-white">Your stream was interrupted.</div>
              <p>Click "Resume Screen Share" below to continue.</p>
            </div>
          </div>
        );
      }
    } else {
      // Not screen sharing
      return (
        <div className="w-full h-full" ref={mainVideoContainerRef}>
          {!cameraOn && (
            <div className="w-full h-full flex items-center justify-center bg-gray-900">
              <div className="text-center text-gray-400">
                <VideoCameraSlashIcon className="w-16 h-16 mx-auto mb-4" />
                <div className="text-xl font-semibold">Camera Off</div>
              </div>
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen">
      <main className="flex-1 bg-black flex items-center justify-center relative">
        {renderMainView()}
      </main>
      
      <aside className="w-full md:max-w-sm bg-gray-900/95 backdrop-blur-lg p-4 flex flex-col space-y-4 overflow-y-auto border-l border-gray-700">
        <div className="text-center">
          <h2 className="text-white text-xl font-bold">Room Code</h2>
          <div className="text-gray-400 text-lg font-mono tracking-widest flex items-center justify-center gap-2 cursor-pointer hover:text-white p-2 bg-black/20 rounded-lg" onClick={handleCopyRoomId}>
            <span>{copied ? 'Copied!' : roomCode}</span>
            {copied ? <CheckIcon /> : <CopyIcon />}
          </div>
        </div>
        
        <h3 className="text-white text-lg font-bold flex items-center gap-2 shrink-0">
          <UsersIcon /> Participants ({totalParticipants})
        </h3>

        {/* Self View */}
        <div className="relative rounded-lg overflow-hidden bg-black shrink-0 border-2 border-blue-500">
          {cameraOn && selfViewTrack ? (
            <LocalVideoTrack 
              track={selfViewTrack} 
              play={true} 
              style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover' }} 
            />
          ) : (
            <div style={{ width: '100%', aspectRatio: '16/9' }} className="flex items-center justify-center bg-gray-800 text-white">
              <VideoCameraSlashIcon className="w-12 h-12 text-gray-600" />
            </div>
          )}
          <div className="absolute top-0 left-0 p-2 flex items-center gap-1">
            <span className="bg-black/60 text-white text-xs px-2 py-1 rounded">
              {user.displayName || user.email} (You)
            </span>
            {isHost && <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded font-semibold">HOST</span>}
          </div>
          <div className="absolute bottom-0 right-0 p-2 flex items-center gap-2">
            <button 
              disabled={!isConnected} 
              onClick={toggleMic} 
              className={`p-2 rounded-full text-white transition-colors disabled:opacity-50 ${micOn ? 'bg-black/50 hover:bg-white/20' : 'bg-red-600'}`}
            >
              {micOn ? <MicrophoneIcon /> : <MicrophoneSlashIcon />}
            </button>
            <button 
              disabled={!isConnected} 
              onClick={toggleCamera} 
              className={`p-2 rounded-full text-white transition-colors disabled:opacity-50 ${cameraOn ? 'bg-black/50 hover:bg-white/20' : 'bg-red-600'}`}
            >
              {cameraOn ? <VideoCameraIcon /> : <VideoCameraSlashIcon />}
            </button>
          </div>
        </div>

        {/* Remote Users */}
        {remoteUsers.map(remoteUser => {
          const isScreenClient = remoteUser.uid.toString().endsWith('-screen');
          if (isScreenClient) return null;
          
          return (
            <div key={remoteUser.uid} className="relative rounded-lg overflow-hidden shrink-0 border border-gray-600">
              <RemoteUser 
                user={remoteUser} 
                playVideo={true} 
                playAudio={true}
                style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover' }} 
              />
            </div>
          );
        })}
        
        <div className="flex-grow"></div>
        
        {/* Controls */}
        <div className="mt-auto shrink-0 space-y-4">
          {isHost && (
            <div className="space-y-2">
              {isMoviePlaying && screenVideoTrack ? (
                <button 
                  onClick={handleStopMovie} 
                  className={`w-full flex items-center justify-center gap-3 text-white py-3 px-6 rounded-xl font-semibold transition-all ${isConnected ? 'bg-yellow-600 hover:bg-yellow-700 shadow-lg' : 'bg-gray-600'}`} 
                  disabled={!isConnected}
                >
                  <StopIcon className="w-5 h-5" /> 
                  Stop Screen Share
                </button>
              ) : (
                <button 
                  onClick={handleStartStream} 
                  className={`w-full flex items-center justify-center gap-3 text-white py-3 px-6 rounded-xl font-semibold transition-all ${isConnected && dataStreamReady ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer shadow-lg' : 'bg-gray-600 cursor-not-allowed'}`} 
                  disabled={!isConnected || !dataStreamReady}
                >
                  <VideoCameraIcon className="w-5 h-5" /> 
                  {isMoviePlaying ? 'Resume Screen Share' : 'Start Screen Share'}
                </button>
              )}
            </div>
          )}
          
          <div className="flex items-center justify-center gap-4 p-2 bg-black/30 rounded-xl">
            <ThemeToggle theme={theme} toggleTheme={toggleTheme} className="!bg-white/10 !border-white/20 !text-white" />
            <button 
              onClick={handleLeave} 
              className="flex-1 flex items-center justify-center gap-3 bg-red-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-red-700 shadow-lg transition-all"
            >
              <LogoutIcon className="w-5 h-5" /> 
              Leave Room
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default StreamRoomLayout;