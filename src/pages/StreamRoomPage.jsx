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

// Fixed StreamRoomLayout - Actual screen share content in main window
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
  screenVideoTrack // Pass the actual screen track
}) => {
  const [copied, setCopied] = useState(false);
  const roomCode = roomId;
  
  const mainVideoContainerRef = useRef(null);
  const hostScreenContainerRef = useRef(null);

  const hostUser = hostCameraUser || remoteUsers.find(u => u.uid.toString() === (hostUid || '').toString());
  const participantUsers = remoteUsers.filter(u => {
    const uidStr = u.uid.toString();
    return uidStr !== (hostUid || '').toString() && 
           uidStr !== (hostScreenUser?.uid || '').toString();
  });
  
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
      screenVideoTrack.play(mainVideoContainerRef.current);
      
      return () => {
        // Cleanup when component unmounts or track changes
        if (screenVideoTrack) {
          screenVideoTrack.stop();
        }
      };
    }
  }, [isHost, isMoviePlaying, screenVideoTrack]);

  // Handle remote host screen share for PARTICIPANTS
  useEffect(() => {
    if (!isHost && isMoviePlaying && hostScreenUser && hostScreenUser.videoTrack && hostScreenContainerRef.current) {
      console.log('🎯 PARTICIPANT: Playing remote screen share in main window');
      hostScreenUser.videoTrack.play(hostScreenContainerRef.current);
    }
  }, [isHost, isMoviePlaying, hostScreenUser]);

  // Handle camera track playback
  useEffect(() => {
    if (isHost && selfViewTrack) {
      if (isMoviePlaying) {
        // During screen share: stop camera in main window (screen takes over)
        selfViewTrack.stop();
      } else {
        // Normal mode: camera in main window
        if (mainVideoContainerRef.current) {
          selfViewTrack.play(mainVideoContainerRef.current);
        }
      }
    }
  }, [isHost, selfViewTrack, isMoviePlaying]);

  // FIXED: Main view shows ACTUAL screen share content
  const renderMainView = () => {
    return (
      <div className="relative w-full h-full bg-black">
        {/* MAIN CONTENT AREA - Shows ACTUAL SCREEN SHARE when active */}
        {isMoviePlaying ? (
          // SCREEN SHARE in MAIN AREA - ACTUAL CONTENT
          isHost ? (
            // Host's own screen share - ACTUAL SCREEN CONTENT
            <div className="w-full h-full" ref={mainVideoContainerRef}>
              {/* Screen content will appear here via screenVideoTrack */}
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
            // Participant view: Host's ACTUAL screen share in main area
            <div className="w-full h-full" ref={hostScreenContainerRef}>
              {!hostScreenUser && (
                <div className="w-full h-full flex items-center justify-center bg-gray-900">
                  <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
                    <div className="text-xl font-semibold mb-2">Connecting to Screen Share...</div>
                    <div className="text-gray-400">Host's screen will appear here</div>
                  </div>
                </div>
              )}
            </div>
          )
        ) : (
          // NORMAL MODE - Camera in MAIN AREA
          isHost ? (
            // Host view: Camera in main area
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
          ) : (
            // Participant view: Host camera in main area
            hostCameraUser ? (
              <RemoteUser 
                user={hostCameraUser} 
                playVideo={true} 
                playAudio={true} 
                style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-900">
                <div className="text-center text-gray-400">
                  <UsersIcon className="w-16 h-16 mx-auto mb-4" />
                  <div className="text-xl font-semibold mb-2">Waiting for Host</div>
                  <div>The host will start the stream soon</div>
                </div>
              </div>
            )
          )
        )}

        {/* Connection Error Overlay */}
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
      {/* MAIN AREA - Shows ACTUAL SCREEN SHARE CONTENT (big window) */}
      <main className="flex-1 bg-black flex items-center justify-center relative">
        {renderMainView()}
      </main>
      
      {/* SIDEBAR - Shows ALL FACE CAMS including host (small windows) */}
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

        {/* Host face cam - ALWAYS in sidebar with other participants */}
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

        {/* Other participants face cams */}
        {remoteUsers.map(remoteUser => {
          const isScreenClient = remoteUser.uid.toString().endsWith('-screen');
          const isCameraClient = remoteUser.uid.toString() === (hostUid || '').toString();
          
          // Don't show screen client in sidebar - screen share is in main area
          if (isScreenClient) return null;
          
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
                {isCameraClient && <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded font-semibold">HOST</span>}
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

// Enhanced StreamRoomPage with Dual-Client Solution and Token Handling
const StreamRoomPage = ({ isHost, roomId, token, user, onLeaveRoom, theme, toggleTheme, appId, onTokenError, fetchAgoraToken }) => {
  const agoraClient = useRTCClient(); // Main client for camera and mic
  const [screenClient, setScreenClient] = useState(null); // Second client for screen sharing
  
  const connectionState = useConnectionState();
  const remoteUsers = useRemoteUsers();
  const { audioTracks } = useRemoteAudioTracks(remoteUsers);

  const [micOn, setMicOn] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [isMoviePlaying, setIsMoviePlaying] = useState(false);
  const [selfViewTrack, setSelfViewTrack] = useState(null);
  const [dataStreamReady, setDataStreamReady] = useState(false);
  const [isStartingStream, setIsStartingStream] = useState(false);
  const [hostScreenUser, setHostScreenUser] = useState(null);
  const [hostCameraUser, setHostCameraUser] = useState(null);
  const [connectionError, setConnectionError] = useState(null);
  const [joinAttempts, setJoinAttempts] = useState(0);
  const [screenVideoTrack, setScreenVideoTrack] = useState(null); // Add state for screen track

  const localMicrophoneTrackRef = useRef(null);
  const localCameraTrackRef = useRef(null);
  const screenVideoTrackRef = useRef(null);
  const screenAudioTrackRef = useRef(null);
  const dataStreamRef = useRef(null);
  
  const initializationRef = useRef({
    hasJoined: false,
    isInitializing: false,
    screenClientJoined: false
  });

  // Token validation function
  const validateToken = useCallback((token, appId, channelName, uid) => {
    if (!token) {
      console.error('❌ Token is null or undefined');
      return false;
    }
    
    if (typeof token !== 'string') {
      console.error('❌ Token is not a string:', typeof token);
      return false;
    }
    
    if (token.length < 10) {
      console.error('❌ Token appears too short:', token.length);
      return false;
    }
    
    console.log('✅ Token validation passed:', {
      tokenLength: token.length,
      tokenPreview: token.substring(0, 20) + '...',
      appId: appId,
      channelName: channelName,
      uid: uid
    });
    
    return true;
  }, []);

  // Create screen client
  useEffect(() => {
    if (isHost && !screenClient) {
      const newScreenClient = AgoraRTC.createClient({ 
        codec: "vp8", 
        mode: "rtc",
      });
      setScreenClient(newScreenClient);
    }
  }, [isHost, screenClient]);

  // Enhanced track subscription handler for dual-client approach
  const handleUserPublished = useCallback(async (user, mediaType) => {
    console.log('User published:', user.uid, mediaType, 'from client:', user.uid.toString().endsWith('-screen') ? 'screen' : 'main');
    
    try {
      await agoraClient.subscribe(user, mediaType);
      console.log('Subscribed to:', user.uid, mediaType);
      
      // Identify host users
      const isScreenClient = user.uid.toString().endsWith('-screen');
      const isCameraClient = user.uid.toString() === (user.uid || '').toString();
      
      if (isScreenClient) {
        setHostScreenUser(user);
        setIsMoviePlaying(true);
      } else if (isCameraClient) {
        setHostCameraUser(user);
      }
    } catch (error) {
      console.error('Failed to subscribe:', error);
    }
  }, [agoraClient]);

  // Handle user unpublishing
  const handleUserUnpublished = useCallback((user, mediaType) => {
    console.log('User unpublished:', user.uid, mediaType);
    
    const isScreenClient = user.uid.toString().endsWith('-screen');
    if (isScreenClient && mediaType === 'video') {
      setHostScreenUser(null);
      setIsMoviePlaying(false);
    }
  }, []);

  // Handle user joining
  const handleUserJoined = useCallback((user) => {
    console.log('User joined:', user.uid);
  }, []);

  // Handle user leaving
  const handleUserLeft = useCallback((user) => {
    console.log('User left:', user.uid);
    
    const isScreenClient = user.uid.toString().endsWith('-screen');
    if (isScreenClient) {
      setHostScreenUser(null);
      setIsMoviePlaying(false);
    }
  }, []);

  // Token renewal handlers
  const handleTokenPrivilegeWillExpire = useCallback(async () => {
    console.log('🔑 Token will expire soon, renewing...');
    try {
      if (fetchAgoraToken) {
        const newToken = await fetchAgoraToken(roomId);
        if (newToken && validateToken(newToken, appId, roomId, user.uid)) {
          await agoraClient.renewToken(newToken);
          console.log('✅ Token renewed successfully');
        } else {
          console.error('❌ Failed to get valid token for renewal');
        }
      }
    } catch (error) {
      console.error('❌ Failed to renew token:', error);
      if (onTokenError) onTokenError('Token renewal failed: ' + error.message);
    }
  }, [agoraClient, roomId, appId, user.uid, fetchAgoraToken, onTokenError, validateToken]);

  const handleTokenPrivilegeDidExpire = useCallback(async () => {
    console.log('🔑 Token expired, attempting to renew...');
    try {
      if (fetchAgoraToken) {
        const newToken = await fetchAgoraToken(roomId);
        if (newToken && validateToken(newToken, appId, roomId, user.uid)) {
          await agoraClient.renewToken(newToken);
          console.log('✅ Token renewed after expiration');
        } else {
          console.error('❌ Failed to get valid token after expiration');
          setConnectionError('Token expired. Please rejoin the room.');
        }
      }
    } catch (error) {
      console.error('❌ Failed to renew expired token:', error);
      setConnectionError('Connection lost due to token expiration.');
    }
  }, [agoraClient, roomId, appId, user.uid, fetchAgoraToken, validateToken]);

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
    if (!isHost || !screenClient) return;

    try {
      console.log('Stopping screen share...');

      // Leave screen client channel
      if (screenClient.connectionState === 'CONNECTED') {
        await screenClient.leave();
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

      // Update state
      setScreenVideoTrack(null); // Reset the screen track
      setIsMoviePlaying(false);
      setHostScreenUser(null);
      initializationRef.current.screenClientJoined = false;
      
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
      setScreenVideoTrack(null);
      setIsMoviePlaying(false);
      setHostScreenUser(null);
    }
  }, [isHost, screenClient, sendStreamMessage]);

  // Create screen track with system audio support
  const createScreenTrack = useCallback(async () => {
    console.log('Creating screen track with dual-client approach');

    try {
      // Try with system audio first
      try {
        const screenTrack = await AgoraRTC.createScreenVideoTrack({
          encoderConfig: "1080p_1",
          withAudio: true, // Try to capture system audio
        }, "enable");

        console.log('Screen track with audio created successfully');
        return screenTrack;
      } catch (audioError) {
        console.log('System audio not available, creating screen track without audio:', audioError);
        
        // Fallback without system audio
        const screenTrack = await AgoraRTC.createScreenVideoTrack({
          encoderConfig: "1080p_1",
        }, "disable");
        
        return screenTrack;
      }
    } catch (error) {
      console.log('All screen track methods failed, trying basic configuration:', error);
      
      // Final fallback
      const screenTrack = await AgoraRTC.createScreenVideoTrack({}, "disable");
      return screenTrack;
    }
  }, []);

  // Start screen share using second client
  const handleStartStream = useCallback(async () => {
    if (!isHost || isMoviePlaying || isStartingStream || !screenClient) return;

    try {
      setIsStartingStream(true);
      console.log('Starting screen share with dual-client approach...');

      // Get token for screen client
      let screenToken = token;
      if (fetchAgoraToken) {
        screenToken = await fetchAgoraToken(roomId);
        if (!screenToken) {
          throw new Error('Failed to get token for screen client');
        }
      }

      // Validate screen token
      if (!validateToken(screenToken, appId, roomId, `${user.uid}-screen`)) {
        throw new Error('Invalid token for screen client');
      }

      // Create screen track
      const screenTrack = await createScreenTrack();

      let videoTrack, audioTrack;
      
      if (Array.isArray(screenTrack)) {
        [videoTrack, audioTrack] = screenTrack;
      } else {
        videoTrack = screenTrack;
      }

      console.log('Screen track created, joining with screen client...');

      // Generate unique UID for screen client
      const screenUid = `${user.uid}-screen`;
      
      // Join channel with screen client
      console.log('🖥️ Screen client joining with:', {
        appId: appId,
        channel: roomId,
        uid: screenUid,
        tokenPreview: screenToken.substring(0, 20) + '...'
      });
      
      await screenClient.join(appId, roomId, screenToken, screenUid);
      
      // Publish screen tracks
      const tracksToPublish = [videoTrack];
      if (audioTrack) {
        tracksToPublish.push(audioTrack);
      }

      await screenClient.publish(tracksToPublish);
      console.log('✅ Screen client joined and published successfully');

      // Store references
      screenVideoTrackRef.current = videoTrack;
      setScreenVideoTrack(videoTrack); // Set the actual track for the layout
      if (audioTrack) {
        screenAudioTrackRef.current = audioTrack;
      }

      // Handle screen share ending
      videoTrack.on("track-ended", () => {
        console.log("Screen share ended by user");
        handleStopMovie();
      });

      // Update state
      setIsMoviePlaying(true);
      initializationRef.current.screenClientJoined = true;
      
      // Notify participants
      try {
        await sendStreamMessage({ 
          type: 'MOVIE_START',
          screenUid: screenUid
        });
        console.log('Movie start message sent');
      } catch (msgError) {
        console.warn("Could not send stream message, but screen share started", msgError);
      }
      
    } catch (error) {
      console.error("❌ Error starting screen share:", error);
      setIsMoviePlaying(false);
      setScreenVideoTrack(null); // Reset on error
      
      if (error.name === 'NotAllowedError') {
        alert("Screen sharing permission denied. Please allow screen sharing and try again.");
      } else if (error.name === 'NOT_SUPPORTED') {
        alert("System audio capture is not supported in this browser. Screen sharing will continue without system audio.");
      } else if (error.message.includes('token') || error.message.includes('auth')) {
        alert("Token authentication failed for screen sharing. Please try again.");
        console.error('🔑 Screen client token error:', error);
      } else {
        alert(`Failed to start screen sharing: ${error.message || 'Unknown error'}. Please try again.`);
      }
    } finally {
      setIsStartingStream(false);
    }
  }, [isHost, isMoviePlaying, isStartingStream, screenClient, user.uid, appId, roomId, token, createScreenTrack, handleStopMovie, sendStreamMessage, fetchAgoraToken, validateToken]);

  // Main client initialization with enhanced token validation
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
        console.log('🚀 Initializing main Agora client...');
        setConnectionError(null);

        // Validate token before attempting to join
        if (!validateToken(token, appId, roomId, user.uid)) {
          throw new Error('Invalid token provided');
        }

        // Set up event listeners
        agoraClient.on('user-published', handleUserPublished);
        agoraClient.on('user-unpublished', handleUserUnpublished);
        agoraClient.on('user-joined', handleUserJoined);
        agoraClient.on('user-left', handleUserLeft);
        agoraClient.on('token-privilege-will-expire', handleTokenPrivilegeWillExpire);
        agoraClient.on('token-privilege-did-expire', handleTokenPrivilegeDidExpire);
        agoraClient.on('connection-state-change', (state) => {
          console.log('🔌 Connection state changed:', state);
          if (state === 'DISCONNECTED' || state === 'FAILED') {
            setConnectionError('Connection lost. Please try rejoining.');
          }
        });

        console.log('🔑 Joining channel with:', { 
          appId: appId, 
          channel: roomId, 
          uid: user.uid,
          tokenPreview: token.substring(0, 20) + '...'
        });
        
        await agoraClient.join(appId, roomId, token, user.uid);
        console.log('✅ Successfully joined channel');

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
        
        console.log('✅ Main client joined and published successfully');
        setDataStreamReady(true);
        initializationRef.current.hasJoined = true;
        
      } catch (error) {
        console.error("❌ Failed to initialize and join:", error);
        const errorMsg = error.message || 'Unknown connection error';
        setConnectionError(`Failed to join room: ${errorMsg}`);
        
        // Specific error handling for token issues
        if (error.message.includes('token') || error.message.includes('auth') || error.message.includes('gateway')) {
          console.error('🔑 TOKEN ERROR DETAILS:', {
            tokenLength: token?.length,
            appId: appId,
            channel: roomId,
            uid: user.uid,
            error: error.message
          });
          
          if (onTokenError) {
            onTokenError(`Token authentication failed: ${errorMsg}`);
          }
        }
        
        setJoinAttempts(prev => prev + 1);
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
        agoraClient.off('token-privilege-will-expire', handleTokenPrivilegeWillExpire);
        agoraClient.off('token-privilege-did-expire', handleTokenPrivilegeDidExpire);
        agoraClient.off('connection-state-change');
      }
    };
  }, [
    agoraClient, 
    appId, 
    roomId, 
    token, 
    user.uid, 
    handleUserPublished, 
    handleUserUnpublished, 
    handleUserJoined, 
    handleUserLeft,
    handleTokenPrivilegeWillExpire,
    handleTokenPrivilegeDidExpire,
    onTokenError,
    validateToken,
    joinAttempts
  ]);

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

  // Play remote audio tracks (skip screen client audio to avoid echo)
  useEffect(() => {
    audioTracks.forEach(track => {
      try {
        // Don't play audio from screen client if it also has microphone
        const user = remoteUsers.find(u => u.audioTrack === track);
        if (user && !user.uid.toString().endsWith('-screen')) {
          track.play();
        }
      } catch (error) {
        console.error("Error playing audio track:", error);
      }
    });
  }, [audioTracks, remoteUsers]);

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
          setHostScreenUser(null);
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

  // Toggle camera
  const toggleCamera = useCallback(async () => {
    if (!localCameraTrackRef.current) return;

    try {
      const newState = !cameraOn;
      await localCameraTrackRef.current.setEnabled(newState);
      setCameraOn(newState);
    } catch (error) {
      console.error("Error toggling camera:", error);
    }
  }, [cameraOn]);

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

  // Leave room with cleanup
  const handleLeave = useCallback(async () => {
    try {
      console.log('Leaving room and cleaning up...');

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

      // Leave channels
      if (agoraClient && agoraClient.connectionState === 'CONNECTED') {
        await agoraClient.leave();
      }
      
      if (screenClient && screenClient.connectionState === 'CONNECTED') {
        await screenClient.leave();
      }

      // Reset state
      setScreenVideoTrack(null);
      setDataStreamReady(false);
      dataStreamRef.current = null;
      initializationRef.current.hasJoined = false;
      initializationRef.current.isInitializing = false;
      initializationRef.current.screenClientJoined = false;
      
    } catch (error) {
      console.error("Error during leave:", error);
    } finally {
      onLeaveRoom();
    }
  }, [agoraClient, screenClient, onLeaveRoom]);

  // Show connection error
  if (connectionError && connectionState === 'DISCONNECTED') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="text-center max-w-md p-6">
          <div className="text-red-500 text-xl mb-4">Connection Failed</div>
          <div className="mb-4 bg-gray-800 p-4 rounded text-left">
            <div className="text-sm font-mono break-all">{connectionError}</div>
          </div>
          <div className="mb-4 text-gray-400 text-sm">
            This is often caused by an invalid or expired token.
          </div>
          <div className="flex gap-4 justify-center">
            <button 
              onClick={handleLeave}
              className="bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
            >
              Return to Lobby
            </button>
            {joinAttempts < 3 && (
              <button 
                onClick={() => window.location.reload()}
                className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
              >
                Retry Connection
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  console.log('🔌 Connection state:', connectionState);

  return (
    <div className="min-h-screen bg-black">
      <StreamRoomLayout 
        isHost={isHost}
        user={user}
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
        hostScreenUser={hostScreenUser}
        hostCameraUser={hostCameraUser}
        connectionError={connectionError}
        screenVideoTrack={screenVideoTrack} // Pass the actual screen track
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