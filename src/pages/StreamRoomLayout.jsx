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
  screenVideoTrack
}) => {
  const [copied, setCopied] = useState(false);
  const roomCode = roomId;
  
  const mainVideoContainerRef = useRef(null);
  const hostScreenContainerRef = useRef(null);
  const [screenShareError, setScreenShareError] = useState(null);

  const totalParticipants = 1 + remoteUsers.length;

  const handleCopyRoomId = () => {
    navigator.clipboard.writeText(roomCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Handle screen share playback in main window for HOST
  useEffect(() => {
    if (isHost && isMoviePlaying && screenVideoTrack && mainVideoContainerRef.current) {
      console.log('🎯 HOST: Playing screen share in main window');
      
      try {
        screenVideoTrack.play(mainVideoContainerRef.current);
        console.log('✅ Host screen share playing successfully');
      } catch (error) {
        console.error('❌ Host screen share playback error:', error);
      }
      
      return () => {
        if (screenVideoTrack) {
          screenVideoTrack.stop();
        }
      };
    }
  }, [isHost, isMoviePlaying, screenVideoTrack]);

  // Handle remote host screen share for PARTICIPANTS
  useEffect(() => {
    if (!isHost && isMoviePlaying && hostScreenUser && hostScreenUser.videoTrack) {
      console.log('🎯 PARTICIPANT: Setting up remote screen share playback', hostScreenUser.uid);
      
      const playScreenShare = async () => {
        if (hostScreenContainerRef.current && hostScreenUser.videoTrack) {
          try {
            console.log('🎬 Attempting to play screen share video track...');
            
            setScreenShareError(null);
            hostScreenUser.videoTrack.stop();
            await hostScreenUser.videoTrack.play(hostScreenContainerRef.current);
            
            console.log('✅ Screen share video track playing successfully');
            
            hostScreenUser.videoTrack.on('track-ended', () => {
              console.log('📺 Screen share track ended');
            });
            
          } catch (error) {
            console.error('❌ Screen share playback failed:', error);
            setScreenShareError('Failed to play screen share. Please try refreshing.');
          }
        }
      };
      
      playScreenShare();
    }
  }, [isHost, isMoviePlaying, hostScreenUser]);

  // Handle camera track playback
  useEffect(() => {
    if (isHost && selfViewTrack && !isMoviePlaying && mainVideoContainerRef.current) {
      try {
        selfViewTrack.play(mainVideoContainerRef.current);
      } catch (error) {
        console.error('Camera playback error:', error);
      }
    }
  }, [isHost, selfViewTrack, isMoviePlaying]);

  // Main view shows ACTUAL screen share content
  const renderMainView = () => {
    if (!isHost) {
      if (isMoviePlaying && hostScreenUser) {
        return (
          <div className="relative w-full h-full bg-black">
            <div 
              className="w-full h-full" 
              ref={hostScreenContainerRef}
              style={{ backgroundColor: 'black' }}
            />
            
            <div className="absolute top-4 left-4 bg-green-600 text-white px-3 py-1 rounded text-sm font-semibold">
              📺 Live Screen Share
            </div>
            
            <div className="absolute top-4 right-4 bg-black/70 text-white px-2 py-1 rounded text-xs">
              {hostScreenUser.videoTrack ? 'Video track: Active' : 'Video track: Loading...'}
            </div>
            
            {screenShareError && (
              <div className="absolute bottom-4 left-4 right-4 bg-red-600 text-white p-3 rounded text-center">
                {screenShareError}
                <button 
                  onClick={() => window.location.reload()}
                  className="ml-2 bg-white text-red-600 px-2 py-1 rounded text-sm"
                >
                  Refresh
                </button>
              </div>
            )}
          </div>
        );
      } else if (isMoviePlaying && !hostScreenUser) {
        return (
          <div className="w-full h-full flex items-center justify-center bg-gray-900">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
              <div className="text-xl font-semibold mb-2">Connecting to Screen Share...</div>
              <div className="text-gray-400">Host is sharing their screen</div>
              <div className="text-sm text-gray-500 mt-2">
                Detected {remoteUsers.length} user{remoteUsers.length !== 1 ? 's' : ''} in room
              </div>
            </div>
          </div>
        );
      } else {
        return (
          <div className="w-full h-full flex items-center justify-center bg-gray-900">
            <div className="text-center text-gray-400">
              <UsersIcon className="w-16 h-16 mx-auto mb-4" />
              <div className="text-xl font-semibold mb-2">Waiting for Host</div>
              <div>The host will start the stream soon</div>
              <div className="text-sm text-gray-500 mt-2">
                {remoteUsers.length > 0 ? `${remoteUsers.length} users in room` : 'Connecting...'}
              </div>
            </div>
          </div>
        );
      }
    }

    return (
      <div className="relative w-full h-full bg-black">
        {isMoviePlaying ? (
          <div className="w-full h-full" ref={mainVideoContainerRef}>
            {!screenVideoTrack && (
              <div className="w-full h-full flex items-center justify-center bg-gray-900">
                <div className="text-white text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
                  <div className="text-xl font-semibold mb-2">Starting Screen Share...</div>
                  <div className="text-gray-400">Your screen will appear here momentarily</div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-full" ref={mainVideoContainerRef}>
            {!cameraOn && (
              <div className="w-full h-full flex items-center justify-center bg-gray-900">
                <div className="text-center text-gray-400">
                  <VideoCameraSlashIcon className="w-16 h-16 mx-auto mb-4" />
                  <div className="text-xl font-semibold mb-2">Camera Off</div>
                  <div>Click "Start Stream" to share your screen</div>
                </div>
              </div>
            )}
          </div>
        )}

        {connectionError && (
          <div className="absolute top-4 left-4 right-4 bg-red-600 text-white p-4 rounded-lg shadow-lg z-20">
            <div className="font-bold">Connection Error</div>
            <div className="text-sm">{connectionError}</div>
            <button 
              onClick={handleLeave}
              className="mt-2 bg-white text-red-600 py-1 px-3 rounded text-sm font-semibold hover:bg-gray-100"
            >
              Leave Room
            </button>
          </div>
        )}
      </div>
    );
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

        {remoteUsers.map(remoteUser => {
          const isScreenClient = remoteUser.uid.toString().endsWith('-screen');
          if (isScreenClient) return null;
          
          const isCameraClientOfHost = remoteUser.uid.toString() === (hostCameraUser?.uid || '').toString();
          
          return (
            <div key={remoteUser.uid} className="relative rounded-lg overflow-hidden shrink-0 border border-gray-600">
              <RemoteUser 
                user={remoteUser} 
                playVideo={true} 
                playAudio={true}
                style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover' }} 
              />
              <div className="absolute top-0 left-0 p-2 flex items-center gap-1">
                <span className="bg-black/60 text-white text-xs px-2 py-1 rounded">
                  User {remoteUser.uid}
                </span>
                {isCameraClientOfHost && <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded font-semibold">HOST</span>}
              </div>
            </div>
          );
        })}
        
        <div className="flex-grow"></div>
        
        <div className="mt-auto shrink-0 space-y-4">
          {isHost && (
            <div className="space-y-2">
              {!isMoviePlaying ? (
                <button 
                  onClick={handleStartStream} 
                  className={`w-full flex items-center justify-center gap-3 text-white py-3 px-6 rounded-xl font-semibold transition-all ${isConnected && dataStreamReady ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer shadow-lg' : 'bg-gray-600 cursor-not-allowed'}`} 
                  disabled={!isConnected || !dataStreamReady}
                >
                  <VideoCameraIcon className="w-5 h-5" /> 
                  Start Screen Share
                </button>
              ) : (
                <button 
                  onClick={handleStopMovie} 
                  className={`w-full flex items-center justify-center gap-3 text-white py-3 px-6 rounded-xl font-semibold transition-all ${isConnected ? 'bg-yellow-600 hover:bg-yellow-700 shadow-lg' : 'bg-gray-600'}`} 
                  disabled={!isConnected}
                >
                  <StopIcon className="w-5 h-5" /> 
                  Stop Screen Share
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