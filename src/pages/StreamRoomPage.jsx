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
  dataStreamReady 
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

  return (
    <div className="flex flex-col md:flex-row h-screen">
      <main className="flex-1 bg-black flex items-center justify-center relative">
        {(() => {
          if (isMoviePlaying) {
            if (isHost && mainViewTrack) {
              return (
                <div className="relative w-full h-full">
                  <LocalVideoTrack track={mainViewTrack} play={true} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
              );
            }
            if (!isHost && hostUser && hostUser.videoTrack) {
              return (
                <div className="relative w-full h-full">
                  <RemoteUser user={hostUser} playVideo={true} playAudio={true} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
              );
            }
            return (
              <div className="text-white text-center">
                <div className="text-lg mb-2">Waiting for host's movie stream...</div>
              </div>
            );
          }
          return (
            <div className="text-center text-gray-400 p-4">
              {isHost ? 'Click "Start Stream" to share your screen.' : 'Waiting for the host to start the movie...'}
            </div>
          );
        })()}
      </main>
      <aside className="w-full md:max-w-sm bg-gray-900/80 backdrop-blur-lg p-4 flex flex-col space-y-4 overflow-y-auto">
        <div className="text-center">
          <h2 className="text-white text-xl font-bold">Room Code</h2>
          <div className="text-gray-400 text-lg font-mono tracking-widest flex items-center justify-center gap-2 cursor-pointer hover:text-white p-2 bg-black/20 rounded-lg" onClick={handleCopyRoomId}>
            <span>{copied ? 'Copied!' : roomCode}</span>
            {copied ? <CheckIcon /> : <CopyIcon />}
          </div>
        </div>
        <h3 className="text-white text-lg font-bold flex items-center gap-2 shrink-0"><UsersIcon /> Participants ({totalParticipants})</h3>
        
        {/* Self view */}
        <div className="relative rounded-lg overflow-hidden bg-black shrink-0">
          {cameraOn && selfViewTrack ? (
            <LocalVideoTrack track={selfViewTrack} play={true} style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', aspectRatio: '16/9' }} className="flex items-center justify-center bg-gray-800 text-white text-4xl"><VideoCameraSlashIcon /></div>
          )}
          <div className="absolute top-0 left-0 p-2 flex items-center gap-1">
            <span className="bg-black/60 text-white text-xs px-2 py-1 rounded">{user.displayName || user.email} (You)</span>
            {isHost && <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded font-semibold">HOST</span>}
          </div>
          <div className="absolute bottom-0 right-0 p-2 flex items-center gap-2">
            <button disabled={!isConnected} onClick={toggleMic} className={`p-2 rounded-full text-white transition-colors disabled:opacity-50 ${micOn ? 'bg-black/50 hover:bg-white/20' : 'bg-red-600'}`}>{micOn ? <MicrophoneIcon /> : <MicrophoneSlashIcon />}</button>
            <button disabled={!isConnected} onClick={toggleCamera} className={`p-2 rounded-full text-white transition-colors disabled:opacity-50 ${cameraOn ? 'bg-black/50 hover:bg-white/20' : 'bg-red-600'}`}>{cameraOn ? <VideoCameraIcon /> : <VideoCameraSlashIcon />}</button>
          </div>
        </div>

        {/* Remote users */}
        {remoteUsers.map(remoteUser => {
          const isRemoteHost = remoteUser.uid.toString() === (hostUid || '').toString();
          return (
            <div key={remoteUser.uid} className="relative rounded-lg overflow-hidden shrink-0">
              <RemoteUser user={remoteUser} playVideo={true} playAudio={true} style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover' }} />
              <div className="absolute top-0 left-0 p-2 flex items-center gap-1">
                <span className="bg-black/60 text-white text-xs px-2 py-1 rounded">{remoteUser.uid}</span>
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
                <button onClick={handleStartStream} className={`w-full flex items-center justify-center gap-2 text-white py-2 px-4 rounded-full font-semibold transition-colors ${isConnected && dataStreamReady ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer' : 'bg-gray-500 cursor-not-allowed'}`} disabled={!isConnected || !dataStreamReady}>
                  <VideoCameraIcon /> Start Stream
                </button>
              ) : (
                <button onClick={handleStopMovie} className={`w-full flex items-center justify-center gap-2 text-white py-2 px-4 rounded-full font-semibold transition-colors ${isConnected ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-gray-500'}`} disabled={!isConnected}><StopIcon /> Stop Stream</button>
              )}
            </div>
          )}
          <div className="flex items-center justify-center gap-4">
            <ThemeToggle theme={theme} toggleTheme={toggleTheme} className="!bg-white/10 !border-white/20 !text-white" />
            <button onClick={handleLeave} className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white py-2 px-4 rounded-full font-semibold hover:bg-red-700"><LogoutIcon /> Leave</button>
          </div>
        </div>
      </aside>
    </div>
  );
};

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

  const localMicrophoneTrackRef = useRef(null);
  const localCameraTrackRef = useRef(null);
  const screenVideoTrackRef = useRef(null);
  const screenAudioTrackRef = useRef(null);
  const dataStreamRef = useRef(null);
  const initializationRef = useRef({
    hasJoined: false,
    isInitializing: false,
    dualStreamEnabled: false
  });

  // Browser detection
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const isChrome = /chrome/i.test(navigator.userAgent) && !/edge/i.test(navigator.userAgent);
  const isFirefox = /firefox/i.test(navigator.userAgent);

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

  // Enable dual stream and low-stream for multiple video tracks
  const setupDualStream = useCallback(async () => {
    if (initializationRef.current.dualStreamEnabled) {
      console.log('Dual stream already enabled');
      return;
    }

    try {
      // Enable dual stream
      await agoraClient.enableDualStream();
      
      // Set low stream parameter for better multiple video track support
      await agoraClient.setLowStreamParameter({
        width: 320,
        height: 240,
        framerate: 15,
        bitrate: 200,
      });
      
      initializationRef.current.dualStreamEnabled = true;
      console.log('Dual stream enabled with low stream parameters');
    } catch (error) {
      if (error.message?.includes('already enabled')) {
        console.log('Dual stream was already enabled');
        initializationRef.current.dualStreamEnabled = true;
      } else {
        console.warn('Failed to enable dual stream:', error);
        throw error;
      }
    }
  }, [agoraClient]);

  // Define handleStopMovie
  const handleStopMovie = useCallback(async () => {
    if (!isHost) return;

    try {
      console.log('Stopping screen share...');

      // Unpublish screen tracks only
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

      setMainViewTrack(null);
      setIsMoviePlaying(false);
      
      // Try to send message but don't block if it fails
      try {
        await sendStreamMessage({ type: 'MOVIE_STOP' });
      } catch (msgError) {
        console.warn("Could not send stream message, but screen share stopped", msgError);
      }
      
    } catch (error) {
      console.error("Error stopping movie:", error);
      // Force cleanup even on error
      screenVideoTrackRef.current = null;
      screenAudioTrackRef.current = null;
      setMainViewTrack(null);
      setIsMoviePlaying(false);
    }
  }, [isHost, agoraClient, sendStreamMessage]);

  // Create screen track with proper configuration for multiple video tracks
  const createScreenTrack = useCallback(async () => {
    console.log('Creating screen track for multi-video setup');

    try {
      // Method 1: Try with basic configuration first
      const screenTrack = await AgoraRTC.createScreenVideoTrack({
        encoderConfig: {
          width: 1280,
          height: 720,
          frameRate: 15,
          bitrateMin: 1200,
          bitrateMax: 2400,
        },
        optimizationMode: "detail",
        // Important: Set screen sharing specific parameters
        screenShareType: 'detail'
      }, "disable"); // Disable audio initially for better compatibility

      return screenTrack;
    } catch (error) {
      console.log('Method 1 failed, trying simpler configuration:', error);
      
      // Method 2: Try with minimal configuration
      try {
        const screenTrack = await AgoraRTC.createScreenVideoTrack({
          // Minimal configuration for maximum compatibility
          encoderConfig: "720p_1",
        }, "disable");
        
        return screenTrack;
      } catch (minimalError) {
        console.log('Method 2 failed, trying with audio disabled completely:', minimalError);
        
        // Method 3: Final attempt with no audio
        const screenTrack = await AgoraRTC.createScreenVideoTrack({}, "disable");
        return screenTrack;
      }
    }
  }, []);

  // Start screen share with proper dual-stream setup
  const handleStartStream = useCallback(async () => {
    if (!isHost || isMoviePlaying || isStartingStream) return;

    try {
      setIsStartingStream(true);
      console.log('Starting screen share with dual-stream setup...');

      // Setup dual stream for multiple video tracks
      await setupDualStream();

      // Create screen track
      const screenTrack = await createScreenTrack();

      // Handle the track(s)
      let videoTrack, audioTrack;
      
      if (Array.isArray(screenTrack)) {
        [videoTrack, audioTrack] = screenTrack;
      } else {
        videoTrack = screenTrack;
      }

      console.log('Screen track created:', { 
        hasVideo: !!videoTrack, 
        hasAudio: !!audioTrack 
      });

      // IMPORTANT: Set stream types for proper multi-video handling
      // Screen share as high priority (main stream)
      if (videoTrack) {
        try {
          await agoraClient.setStreamType(videoTrack.getTrackId(), 0); // 0 = high quality
        } catch (error) {
          console.warn('Could not set screen stream type:', error);
        }
      }

      // Camera as low priority (side stream)
      if (localCameraTrackRef.current) {
        try {
          await agoraClient.setStreamType(localCameraTrackRef.current.getTrackId(), 1); // 1 = low quality
        } catch (error) {
          console.warn('Could not set camera stream type:', error);
        }
      }

      // Prepare tracks to publish - publish screen alongside existing camera
      const tracksToPublish = [videoTrack];
      if (audioTrack) {
        tracksToPublish.push(audioTrack);
      }

      console.log('Publishing screen tracks alongside camera...');
      
      // Publish screen tracks (camera remains published)
      await agoraClient.publish(tracksToPublish);
      console.log('Screen tracks published successfully with camera');

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
      setIsMoviePlaying(true);
      
      // Notify participants
      try {
        await sendStreamMessage({ type: 'MOVIE_START' });
        console.log('Movie start message sent');
      } catch (msgError) {
        console.warn("Could not send stream message, but screen share started", msgError);
      }
      
    } catch (error) {
      console.error("Error starting screen share:", error);
      setIsMoviePlaying(false);
      
      // Enhanced error handling for multi-video issues
      if (error.message?.includes('CAN_NOT_PUBLISH_MULTIPLE_VIDEO_TRACKS')) {
        console.log('Multi-video error, trying alternative approach...');
        
        // Alternative approach: Use single video track but switch main view
        try {
          await handleSingleVideoFallback();
          return; // Success with fallback
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError);
          alert("Screen sharing failed. Your browser may not support sharing both camera and screen simultaneously. Please try stopping your camera first, then start screen sharing.");
        }
      } else if (error.name === 'NotAllowedError') {
        alert("Screen sharing permission denied. Please allow screen sharing and try again.");
      } else {
        alert(`Failed to start screen sharing: ${error.message || 'Unknown error'}. Please try again.`);
      }
    } finally {
      setIsStartingStream(false);
    }
  }, [isHost, isMoviePlaying, isStartingStream, agoraClient, sendStreamMessage, handleStopMovie, setupDualStream, createScreenTrack]);

  // Fallback for browsers that don't support multiple video tracks
  const handleSingleVideoFallback = useCallback(async () => {
    console.log('Using single video fallback method');
    
    // Create screen track
    const screenTrack = await createScreenTrack();
    const videoTrack = Array.isArray(screenTrack) ? screenTrack[0] : screenTrack;

    // Unpublish camera temporarily
    if (localCameraTrackRef.current) {
      await agoraClient.unpublish([localCameraTrackRef.current]);
    }

    // Publish screen track
    await agoraClient.publish([videoTrack]);

    // Store references
    screenVideoTrackRef.current = videoTrack;
    setMainViewTrack(videoTrack);
    setIsMoviePlaying(true);

    // Handle screen share ending
    videoTrack.on("track-ended", () => {
      console.log("Screen share ended by user");
      // Republish camera when screen share ends
      if (localCameraTrackRef.current && cameraOn) {
        agoraClient.publish([localCameraTrackRef.current]).catch(console.error);
      }
      handleStopMovie();
    });

    await sendStreamMessage({ type: 'MOVIE_START' });
  }, [agoraClient, sendStreamMessage, handleStopMovie, createScreenTrack, cameraOn]);

  // Initialize and join channel with proper dual-stream setup
  useEffect(() => {
    // Check if we should initialize
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
        console.log('Initializing Agora connection with dual-stream support...');

        // Use broadcast mode for live streaming with multiple publishers
        await agoraClient.setClientRole('host');
        await agoraClient.join(appId, roomId, token, user.uid);

        // Setup dual stream immediately for multi-video support
        await setupDualStream();

        const [micTrack, camTrack] = await AgoraRTC.createMicrophoneAndCameraTracks(
          { encoderConfig: "music_standard" },
          { encoderConfig: "480p_1" } // Lower resolution for camera
        );
        
        localMicrophoneTrackRef.current = micTrack;
        localCameraTrackRef.current = camTrack;
        setSelfViewTrack(camTrack);
        
        // Set camera as low stream initially
        await agoraClient.setStreamType(camTrack.getTrackId(), 1);
        
        await agoraClient.publish([micTrack, camTrack]);
        setMicOn(true);
        setCameraOn(true);
        
        console.log('Channel joined successfully with dual-stream setup');
        setDataStreamReady(true);
        initializationRef.current.hasJoined = true;
        
      } catch (error) {
        console.error("Failed to initialize and join:", error);
      } finally {
        initializationRef.current.isInitializing = false;
      }
    };

    initializeAndJoin();
  }, [agoraClient, appId, roomId, token, user.uid, setupDualStream]);

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
        } else if (message.type === 'MOVIE_STOP') {
          setIsMoviePlaying(false);
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

  // Toggle camera with proper stream management
  const toggleCamera = useCallback(async () => {
    if (!localCameraTrackRef.current) return;

    try {
      const newState = !cameraOn;
      
      if (isMoviePlaying) {
        // If screen sharing, we need to manage the camera track carefully
        if (newState) {
          // Enable camera during screen share - publish it
          await localCameraTrackRef.current.setEnabled(true);
          await agoraClient.publish([localCameraTrackRef.current]);
          await agoraClient.setStreamType(localCameraTrackRef.current.getTrackId(), 1);
        } else {
          // Disable camera during screen share - unpublish it
          await agoraClient.unpublish([localCameraTrackRef.current]);
          await localCameraTrackRef.current.setEnabled(false);
        }
      } else {
        // Normal camera toggle when not screen sharing
        await localCameraTrackRef.current.setEnabled(newState);
      }
      
      setCameraOn(newState);
    } catch (error) {
      console.error("Error toggling camera:", error);
    }
  }, [cameraOn, isMoviePlaying, agoraClient]);

  // Toggle microphone
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

  // Leave room with proper cleanup
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
      initializationRef.current.dualStreamEnabled = false;
      
    } catch (error) {
      console.error("Error during leave:", error);
    } finally {
      onLeaveRoom();
    }
  }, [agoraClient, onLeaveRoom]);

  console.log('Connection state:', connectionState, 'Dual stream enabled:', initializationRef.current.dualStreamEnabled);

  return (
    <div className="min-h-screen bg-black">
      <StreamRoomLayout 
        isHost={isHost}
        user={user}
        mainViewTrack={mainViewTrack}
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
      />
    </div>
  );
};

const StreamRoomPageWrapper = (props) => {
  const client = React.useMemo(() => 
    AgoraRTC.createClient({ 
      codec: "vp8", 
      mode: "live", // Use live mode for broadcasting
    }), []
  );

  return (
    <AgoraRTCProvider client={client}>
      <StreamRoomPage {...props} />
    </AgoraRTCProvider>
  );
};

export default StreamRoomPageWrapper;