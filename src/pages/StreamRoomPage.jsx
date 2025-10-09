import React, { useState, useEffect, useRef, useCallback } from 'react';
import AgoraRTC from "agora-rtc-sdk-ng";
import {
  AgoraRTCProvider,
  useRTCClient,
  useRemoteUsers,
  useRemoteAudioTracks,
  LocalVideoTrack,
  RemoteUser,
  useConnectionState,
} from "agora-rtc-react";
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

// StreamRoomLayout component (same as before)
const StreamRoomLayout = ({ 
  isHost, 
  user, 
  mainViewTrack, 
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
  hostScreenTrack,
  hostCameraTrack
}) => {
  const [copied, setCopied] = useState(false);
  const roomCode = roomId;
  
  const hostUser = remoteUsers.find(u => u.uid.toString() === (hostUid || '').toString());
  const participantUsers = remoteUsers.filter(u => u.uid.toString() !== (hostUid || '').toString());
  const totalParticipants = 1 + remoteUsers.length;

  const handleCopyRoomId = () => {
    navigator.clipboard.writeText(roomCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Enhanced main view logic
  const renderMainView = () => {
    if (isMoviePlaying) {
      if (isHost) {
        // Host sees their own screen share
        return (
          <div className="relative w-full h-full bg-black">
            {mainViewTrack && (
              <LocalVideoTrack 
                track={mainViewTrack} 
                play={true} 
                style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
              />
            )}
            {/* Camera placeholder when screen sharing */}
            {!cameraOn && (
              <div className="absolute bottom-4 right-4 w-64 h-48 bg-gray-800 rounded-lg flex items-center justify-center">
                <div className="text-white text-center">
                  <VideoCameraSlashIcon className="w-12 h-12 mx-auto mb-2" />
                  <div className="text-sm">Camera disabled during screen share</div>
                </div>
              </div>
            )}
          </div>
        );
      } else {
        // Participants see host's screen share with camera if available
        return (
          <div className="relative w-full h-full bg-black">
            {hostScreenTrack ? (
              <video 
                ref={(el) => {
                  if (el && hostScreenTrack) {
                    hostScreenTrack.play(el);
                  }
                }}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            ) : hostUser && hostUser.videoTrack ? (
              // Fallback to host's camera
              <RemoteUser 
                user={hostUser} 
                playVideo={true} 
                playAudio={true} 
                style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
              />
            ) : (
              <div className="text-white text-center flex items-center justify-center h-full">
                <div className="text-lg mb-2">Waiting for host's stream...</div>
              </div>
            )}
          </div>
        );
      }
    }
    
    // Default view when no screen sharing
    if (isHost) {
      return (
        <div className="relative w-full h-full bg-black">
          {cameraOn && selfViewTrack ? (
            <LocalVideoTrack 
              track={selfViewTrack} 
              play={true} 
              style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
            />
          ) : (
            <div className="text-center text-gray-400 p-4 flex items-center justify-center h-full">
              Click "Start Stream" to share your screen.
            </div>
          )}
        </div>
      );
    } else {
      return hostUser ? (
        <div className="relative w-full h-full bg-black">
          <RemoteUser 
            user={hostUser} 
            playVideo={true} 
            playAudio={true} 
            style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
          />
        </div>
      ) : (
        <div className="text-center text-gray-400 p-4 flex items-center justify-center h-full">
          Waiting for the host to start the stream...
        </div>
      );
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen">
      <main className="flex-1 bg-black flex items-center justify-center relative">
        {renderMainView()}
      </main>
      
      <aside className="w-full md:max-w-sm bg-gray-900/80 backdrop-blur-lg p-4 flex flex-col space-y-4 overflow-y-auto">
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

        {/* Self view */}
        <div className="relative rounded-lg overflow-hidden bg-black shrink-0">
          {cameraOn && selfViewTrack && !isMoviePlaying ? (
            <LocalVideoTrack track={selfViewTrack} play={true} style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover' }} />
          ) : isMoviePlaying ? (
            <div style={{ width: '100%', aspectRatio: '16/9' }} className="flex items-center justify-center bg-gray-800 text-white">
              <div className="text-center">
                <VideoCameraIcon className="w-8 h-8 mx-auto mb-2" />
                <div className="text-sm">Screen Sharing Active</div>
              </div>
            </div>
          ) : (
            <div style={{ width: '100%', aspectRatio: '16/9' }} className="flex items-center justify-center bg-gray-800 text-white text-4xl">
              <VideoCameraSlashIcon />
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
              disabled={!isConnected || isMoviePlaying} 
              onClick={toggleMic} 
              className={`p-2 rounded-full text-white transition-colors disabled:opacity-50 ${micOn ? 'bg-black/50 hover:bg-white/20' : 'bg-red-600'}`}
            >
              {micOn ? <MicrophoneIcon /> : <MicrophoneSlashIcon />}
            </button>
            <button 
              disabled={!isConnected || isMoviePlaying} 
              onClick={toggleCamera} 
              className={`p-2 rounded-full text-white transition-colors disabled:opacity-50 ${cameraOn ? 'bg-black/50 hover:bg-white/20' : 'bg-red-600'}`}
            >
              {cameraOn ? <VideoCameraIcon /> : <VideoCameraSlashIcon />}
            </button>
          </div>
        </div>

        {/* Remote users */}
        {remoteUsers.map(remoteUser => {
          const isRemoteHost = remoteUser.uid.toString() === (hostUid || '').toString();
          return (
            <div key={remoteUser.uid} className="relative rounded-lg overflow-hidden shrink-0">
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
                {isRemoteHost && <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded font-semibold">HOST</span>}
              </div>
            </div>
          );
        })}
        
        <div className="flex-grow"></div>
        
        <div className="mt-auto shrink-0">
          {isHost && (
            <div className="mb-4">
              {!isMoviePlaying ? (
                <button 
                  onClick={handleStartStream} 
                  className={`w-full flex items-center justify-center gap-2 text-white py-2 px-4 rounded-full font-semibold transition-colors ${isConnected && dataStreamReady ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer' : 'bg-gray-500 cursor-not-allowed'}`} 
                  disabled={!isConnected || !dataStreamReady}
                >
                  <VideoCameraIcon /> Start Screen Share
                </button>
              ) : (
                <button 
                  onClick={handleStopMovie} 
                  className={`w-full flex items-center justify-center gap-2 text-white py-2 px-4 rounded-full font-semibold transition-colors ${isConnected ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-gray-500'}`} 
                  disabled={!isConnected}
                >
                  <StopIcon /> Stop Screen Share
                </button>
              )}
            </div>
          )}
          
          <div className="flex items-center justify-center gap-4">
            <ThemeToggle theme={theme} toggleTheme={toggleTheme} className="!bg-white/10 !border-white/20 !text-white" />
            <button 
              onClick={handleLeave} 
              className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white py-2 px-4 rounded-full font-semibold hover:bg-red-700"
            >
              <LogoutIcon /> Leave
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
};

// Enhanced StreamRoomPage with Single Client Solution
const StreamRoomPage = ({ isHost, roomId, token, user, onLeaveRoom, theme, toggleTheme, appId }) => {
  const agoraClient = useRTCClient();
  const connectionState = useConnectionState();
  const remoteUsers = useRemoteUsers();
  const { audioTracks } = useRemoteAudioTracks(remoteUsers);

  const [micOn, setMicOn] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [isMoviePlaying, setIsMoviePlaying] = useState(false);
  const [mainViewTrack, setMainViewTrack] = useState(null);
  const [selfViewTrack, setSelfViewTrack] = useState(null);
  const [dataStreamReady, setDataStreamReady] = useState(false);
  const [isStartingStream, setIsStartingStream] = useState(false);
  const [hostScreenTrack, setHostScreenTrack] = useState(null);

  const localMicrophoneTrackRef = useRef(null);
  const localCameraTrackRef = useRef(null);
  const screenVideoTrackRef = useRef(null);
  const screenAudioTrackRef = useRef(null);
  const dataStreamRef = useRef(null);
  
  const initializationRef = useRef({
    hasJoined: false,
    isInitializing: false
  });

  // Track subscription state
  const [subscribedTracks, setSubscribedTracks] = useState(new Map());

  // Enhanced track subscription handler
  const handleUserPublished = useCallback(async (user, mediaType) => {
    console.log('User published:', user.uid, mediaType);
    
    try {
      await agoraClient.subscribe(user, mediaType);
      console.log('Subscribed to:', user.uid, mediaType);
      
      setSubscribedTracks(prev => {
        const newMap = new Map(prev);
        const userTracks = newMap.get(user.uid) || new Set();
        userTracks.add(mediaType);
        newMap.set(user.uid, userTracks);
        return newMap;
      });

      // Handle screen track detection for participants
      if (mediaType === 'video' && user.hasVideo && !isHost) {
        const videoTrack = user.videoTrack;
        if (videoTrack) {
          const trackLabel = videoTrack.getTrackLabel();
          console.log('Track label:', trackLabel);
          
          // Detect screen track
          if (trackLabel.includes('screen') || trackLabel.includes('Screen')) {
            setHostScreenTrack(videoTrack);
            setIsMoviePlaying(true);
            console.log('Screen track detected and set');
          }
        }
      }
    } catch (error) {
      console.error('Failed to subscribe:', error);
    }
  }, [agoraClient, isHost]);

  // Handle user unpublishing
  const handleUserUnpublished = useCallback((user, mediaType) => {
    console.log('User unpublished:', user.uid, mediaType);
    
    setSubscribedTracks(prev => {
      const newMap = new Map(prev);
      const userTracks = newMap.get(user.uid);
      if (userTracks) {
        userTracks.delete(mediaType);
        if (userTracks.size === 0) {
          newMap.delete(user.uid);
        } else {
          newMap.set(user.uid, userTracks);
        }
      }
      return newMap;
    });

    if (mediaType === 'video' && !isHost) {
      setHostScreenTrack(null);
      setIsMoviePlaying(false);
    }
  }, [isHost]);

  // Handle user joining
  const handleUserJoined = useCallback((user) => {
    console.log('User joined:', user.uid);
  }, []);

  // Handle user leaving
  const handleUserLeft = useCallback((user) => {
    console.log('User left:', user.uid);
    setSubscribedTracks(prev => {
      const newMap = new Map(prev);
      newMap.delete(user.uid);
      return newMap;
    });
  }, []);

  // Send stream message
  const sendStreamMessage = useCallback(async (message) => {
    if (!agoraClient || connectionState !== 'CONNECTED') {
      console.warn("Agora client not connected");
      return;
    }

    try {
      let streamId = dataStreamRef.current;
      if (!streamId && agoraClient.createDataStream) {
        try {
          streamId = await agoraClient.createDataStream({ 
            reliable: true, 
            ordered: true 
          });
          dataStreamRef.current = streamId;
        } catch (error) {
          console.warn("Could not create data stream:", error);
        }
      }

      if (streamId) {
        const payload = JSON.stringify(message);
        const encoder = new TextEncoder();
        await agoraClient.sendStreamMessage(streamId, encoder.encode(payload));
      } else {
        console.warn("No data stream available, message not sent");
      }
    } catch (error) {
      console.error("Failed to send stream message:", error);
    }
  }, [agoraClient, connectionState]);

  // Stop screen sharing
  const handleStopMovie = useCallback(async () => {
    if (!isHost) return;

    try {
      console.log('Stopping screen share...');

      // Unpublish screen tracks
      const tracksToUnpublish = [];
      
      if (screenVideoTrackRef.current) {
        tracksToUnpublish.push(screenVideoTrackRef.current);
      }
      
      if (screenAudioTrackRef.current) {
        tracksToUnpublish.push(screenAudioTrackRef.current);
      }

      if (tracksToUnpublish.length > 0) {
        await agoraClient.unpublish(tracksToUnpublish);
      }

      // Stop and close screen tracks
      if (screenVideoTrackRef.current) {
        screenVideoTrackRef.current.stop();
        screenVideoTrackRef.current.close();
        screenVideoTrackRef.current = null;
      }

      if (screenAudioTrackRef.current) {
        screenAudioTrackRef.current.stop();
        screenAudioTrackRef.current.close();
        screenAudioTrackRef.current = null;
      }

      // Republish camera if it was enabled
      if (cameraOn && localCameraTrackRef.current) {
        await agoraClient.publish([localCameraTrackRef.current]);
      }

      // Update state
      setMainViewTrack(null);
      setHostScreenTrack(null);
      setIsMoviePlaying(false);
      
      // Notify participants
      try {
        await sendStreamMessage({ type: 'MOVIE_STOP' });
      } catch (msgError) {
        console.warn("Could not send stream message, but screen share stopped", msgError);
      }
      
    } catch (error) {
      console.error("Error stopping movie:", error);
      // Force cleanup
      screenVideoTrackRef.current = null;
      screenAudioTrackRef.current = null;
      setMainViewTrack(null);
      setHostScreenTrack(null);
      setIsMoviePlaying(false);
    }
  }, [isHost, agoraClient, sendStreamMessage, cameraOn]);

  // Create screen track
  const createScreenTrack = useCallback(async () => {
    console.log('Creating screen track');

    try {
      const screenTrack = await AgoraRTC.createScreenVideoTrack({
        encoderConfig: {
          width: 1920,
          height: 1080,
          frameRate: 15,
          bitrateMin: 1500,
          bitrateMax: 3000,
        },
        optimizationMode: "detail",
      }, "enable");

      return screenTrack;
    } catch (error) {
      console.log('Method 1 failed, trying simpler configuration:', error);
      
      try {
        const screenTrack = await AgoraRTC.createScreenVideoTrack({
          encoderConfig: "1080p_1",
        }, "enable");
        
        return screenTrack;
      } catch (minimalError) {
        console.log('Method 2 failed, trying basic configuration:', minimalError);
        
        const screenTrack = await AgoraRTC.createScreenVideoTrack({}, "disable");
        return screenTrack;
      }
    }
  }, []);

  // Start screen share (replace camera with screen)
  const handleStartStream = useCallback(async () => {
    if (!isHost || isMoviePlaying || isStartingStream) return;

    try {
      setIsStartingStream(true);
      console.log('Starting screen share...');

      // Create screen track
      const screenTrack = await createScreenTrack();

      let videoTrack, audioTrack;
      
      if (Array.isArray(screenTrack)) {
        [videoTrack, audioTrack] = screenTrack;
      } else {
        videoTrack = screenTrack;
      }

      console.log('Screen track created, replacing camera with screen...');

      // Unpublish camera first (browser limitation: one video track per client)
      if (localCameraTrackRef.current) {
        await agoraClient.unpublish([localCameraTrackRef.current]);
      }

      // Publish screen tracks
      const tracksToPublish = [videoTrack];
      if (audioTrack) {
        tracksToPublish.push(audioTrack);
      }

      await agoraClient.publish(tracksToPublish);
      console.log('Screen tracks published successfully');

      // Handle screen share ending
      videoTrack.on("track-ended", () => {
        console.log("Screen share ended by user");
        handleStopMovie();
      });

      // Store references
      screenVideoTrackRef.current = videoTrack;
      if (audioTrack) {
        screenAudioTrackRef.current = audioTrack;
      }

      // Update state
      setMainViewTrack(videoTrack);
      setHostScreenTrack(videoTrack);
      setIsMoviePlaying(true);
      
      // Notify participants
      try {
        await sendStreamMessage({ 
          type: 'MOVIE_START'
        });
        console.log('Movie start message sent');
      } catch (msgError) {
        console.warn("Could not send stream message, but screen share started", msgError);
      }
      
    } catch (error) {
      console.error("Error starting screen share:", error);
      setIsMoviePlaying(false);
      
      // Republish camera if screen share failed
      if (cameraOn && localCameraTrackRef.current) {
        try {
          await agoraClient.publish([localCameraTrackRef.current]);
        } catch (publishError) {
          console.error("Failed to republish camera:", publishError);
        }
      }
      
      if (error.name === 'NotAllowedError') {
        alert("Screen sharing permission denied. Please allow screen sharing and try again.");
      } else {
        alert(`Failed to start screen sharing: ${error.message || 'Unknown error'}. Please try again.`);
      }
    } finally {
      setIsStartingStream(false);
    }
  }, [isHost, isMoviePlaying, isStartingStream, agoraClient, sendStreamMessage, handleStopMovie, createScreenTrack, cameraOn]);

  // Main client initialization
  useEffect(() => {
    const shouldInitialize = 
      agoraClient && 
      token && 
      !initializationRef.current.hasJoined && 
      !initializationRef.current.isInitializing &&
      agoraClient.connectionState !== 'CONNECTED' && 
      agoraClient.connectionState !== 'CONNECTING';

    if (!shouldInitialize) return;

    const initializeAndJoin = async () => {
      try {
        initializationRef.current.isInitializing = true;
        console.log('Initializing Agora connection...');

        // Set up event listeners
        agoraClient.on('user-published', handleUserPublished);
        agoraClient.on('user-unpublished', handleUserUnpublished);
        agoraClient.on('user-joined', handleUserJoined);
        agoraClient.on('user-left', handleUserLeft);

        await agoraClient.join(appId, roomId, token, user.uid);

        // Create camera and microphone tracks
        const [micTrack, camTrack] = await AgoraRTC.createMicrophoneAndCameraTracks(
          { encoderConfig: "music_standard" },
          { 
            encoderConfig: "480p_1",
            optimizationMode: "motion"
          }
        );
        
        localMicrophoneTrackRef.current = micTrack;
        localCameraTrackRef.current = camTrack;
        setSelfViewTrack(camTrack);
        
        // Publish initial tracks
        await agoraClient.publish([micTrack, camTrack]);
        setMicOn(true);
        setCameraOn(true);
        
        console.log('Client joined successfully');
        setDataStreamReady(true);
        initializationRef.current.hasJoined = true;
        
      } catch (error) {
        console.error("Failed to initialize and join:", error);
      } finally {
        initializationRef.current.isInitializing = false;
      }
    };

    initializeAndJoin();

    // Cleanup event listeners
    return () => {
      if (agoraClient) {
        agoraClient.off('user-published', handleUserPublished);
        agoraClient.off('user-unpublished', handleUserUnpublished);
        agoraClient.off('user-joined', handleUserJoined);
        agoraClient.off('user-left', handleUserLeft);
      }
    };
  }, [agoraClient, appId, roomId, token, user.uid, handleUserPublished, handleUserUnpublished, handleUserJoined, handleUserLeft]);

  // Create data stream when connected
  useEffect(() => {
    if (connectionState === 'CONNECTED' && !dataStreamRef.current && agoraClient?.createDataStream) {
      const createDataStream = async () => {
        try {
          const streamId = await agoraClient.createDataStream({ 
            reliable: true, 
            ordered: true 
          });
          dataStreamRef.current = streamId;
          console.log('Data stream created:', streamId);
        } catch (error) {
          console.warn("Failed to create data stream:", error);
        }
      };
      createDataStream();
    }
  }, [connectionState, agoraClient]);

  // Play remote audio tracks
  useEffect(() => {
    audioTracks.forEach(track => {
      try {
        track.play();
      } catch (error) {
        console.error("Error playing audio track:", error);
      }
    });
  }, [audioTracks]);

  // Handle stream messages
  useEffect(() => {
    if (!agoraClient) return;

    const handleStreamMessage = (uid, streamId, data) => {
      if (uid === user.uid) return;
      
      try {
        const text = new TextDecoder().decode(data);
        const message = JSON.parse(text);
        
        if (message.type === 'MOVIE_START') {
          setIsMoviePlaying(true);
          console.log('Screen share started by host');
        } else if (message.type === 'MOVIE_STOP') {
          setIsMoviePlaying(false);
          setHostScreenTrack(null);
          console.log('Screen share stopped by host');
        }
      } catch (error) {
        console.error("Failed to parse stream message:", error);
      }
    };

    agoraClient.on('stream-message', handleStreamMessage);
    
    return () => {
      agoraClient.off('stream-message', handleStreamMessage);
    };
  }, [agoraClient, user.uid]);

  // Toggle camera (disabled during screen share)
  const toggleCamera = useCallback(async () => {
    if (!localCameraTrackRef.current || isMoviePlaying) return;

    try {
      const newState = !cameraOn;
      await localCameraTrackRef.current.setEnabled(newState);
      setCameraOn(newState);
    } catch (error) {
      console.error("Error toggling camera:", error);
    }
  }, [cameraOn, isMoviePlaying]);

  // Toggle microphone (works during screen share)
  const toggleMic = useCallback(async () => {
    if (!localMicrophoneTrackRef.current) return;

    try {
      const newState = !micOn;
      await localMicrophoneTrackRef.current.setEnabled(newState);
      setMicOn(newState);
    } catch (error) {
      console.error("Error toggling microphone:", error);
    }
  }, [micOn]);

  // Leave room with cleanup
  const handleLeave = useCallback(async () => {
    try {
      // Stop and close all tracks
      if (screenVideoTrackRef.current) {
        screenVideoTrackRef.current.stop();
        screenVideoTrackRef.current.close();
      }
      
      if (screenAudioTrackRef.current) {
        screenAudioTrackRef.current.stop();
        screenAudioTrackRef.current.close();
      }

      if (localMicrophoneTrackRef.current) {
        localMicrophoneTrackRef.current.stop();
        localMicrophoneTrackRef.current.close();
      }
      
      if (localCameraTrackRef.current) {
        localCameraTrackRef.current.stop();
        localCameraTrackRef.current.close();
      }

      // Leave channel
      if (agoraClient.connectionState === 'CONNECTED') {
        await agoraClient.leave();
      }

      // Reset state
      setDataStreamReady(false);
      dataStreamRef.current = null;
      initializationRef.current.hasJoined = false;
      initializationRef.current.isInitializing = false;
      
    } catch (error) {
      console.error("Error during leave:", error);
    } finally {
      onLeaveRoom();
    }
  }, [agoraClient, onLeaveRoom]);

  console.log('Connection state:', connectionState);

  return (
    <div className="min-h-screen bg-black">
      <StreamRoomLayout 
        isHost={isHost}
        user={user}
        mainViewTrack={isHost ? mainViewTrack : hostScreenTrack}
        selfViewTrack={selfViewTrack}
        remoteUsers={remoteUsers}
        toggleMic={toggleMic}
        toggleCamera={toggleCamera}
        micOn={micOn}
        cameraOn={cameraOn}
        handleLeave={handleLeave}
        theme={theme}
        toggleTheme={toggleTheme}
        isConnected={connectionState === 'CONNECTED'}
        handleStartStream={handleStartStream}
        isMoviePlaying={isMoviePlaying}
        roomId={roomId}
        handleStopMovie={handleStopMovie}
        hostUid={isHost ? user.uid : null}
        dataStreamReady={dataStreamReady || connectionState === 'CONNECTED'}
        hostScreenTrack={hostScreenTrack}
        hostCameraTrack={null} // Not used in single client approach
      />
    </div>
  );
};

const StreamRoomPageWrapper = (props) => {
  const client = React.useMemo(() => 
    AgoraRTC.createClient({ 
      codec: "vp8", 
      mode: "rtc",
    }), []
  );

  return (
    <AgoraRTCProvider client={client}>
      <StreamRoomPage {...props} />
    </AgoraRTCProvider>
  );
};

export default StreamRoomPageWrapper;