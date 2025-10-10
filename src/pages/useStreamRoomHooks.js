import { useState, useEffect, useRef, useCallback } from 'react';
import AgoraRTC from "agora-rtc-sdk-ng";
import { useRTCClient, useRemoteUsers, useRemoteAudioTracks, useConnectionState } from "agora-rtc-react";

export const useStreamRoomHooks = ({ isHost, roomId, token, user, appId, fetchAgoraToken, onTokenError }) => {
  const agoraClient = useRTCClient();
  const [screenClient, setScreenClient] = useState(null);
  
  const connectionState = useConnectionState();
  const remoteUsers = useRemoteUsers();
  const { audioTracks } = useRemoteAudioTracks(remoteUsers);

  // Initialize state from sessionStorage or default to true
  const [micOn, setMicOn] = useState(() => {
    const savedMicState = sessionStorage.getItem('micOn');
    return savedMicState !== null ? JSON.parse(savedMicState) : true;
  });
  const [cameraOn, setCameraOn] = useState(() => {
      const savedCameraState = sessionStorage.getItem('cameraOn');
      return savedCameraState !== null ? JSON.parse(savedCameraState) : true;
  });
  const [isMoviePlaying, setIsMoviePlaying] = useState(() => {
    return isHost ? JSON.parse(sessionStorage.getItem('isMoviePlaying') || 'false') : false;
  });
  const [selfViewTrack, setSelfViewTrack] = useState(null);
  const [dataStreamReady, setDataStreamReady] = useState(false);
  const [isStartingStream, setIsStartingStream] = useState(false);
  const [hostScreenUser, setHostScreenUser] = useState(null);
  const [hostCameraUser, setHostCameraUser] = useState(null);
  const [connectionError, setConnectionError] = useState(null);
  const [joinAttempts, setJoinAttempts] = useState(0);
  const [screenVideoTrack, setScreenVideoTrack] = useState(null);
  const [screenShareError, setScreenShareError] = useState(null);

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

  // Save state to sessionStorage whenever it changes
  useEffect(() => {
    sessionStorage.setItem('micOn', JSON.stringify(micOn));
  }, [micOn]);

  useEffect(() => {
      sessionStorage.setItem('cameraOn', JSON.stringify(cameraOn));
  }, [cameraOn]);

  useEffect(() => {
    if (isHost) {
        sessionStorage.setItem('isMoviePlaying', JSON.stringify(isMoviePlaying));
    }
  }, [isMoviePlaying, isHost]);

  const validateToken = useCallback((token, appId, channelName, uid) => {
    if (!token) {
      console.error('❌ Token is null or undefined');
      return false;
    }
    
    if (typeof token !== 'string') {
      console.error('❌ Token is not a string:', typeof token);
      return false;
    }
    
    console.log('✅ Token validation passed - length:', token.length);
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

  // Real-time debugging
  useEffect(() => {
    console.log('🔍 REAL-TIME DEBUG - Room State:', {
      isHost,
      isMoviePlaying,
      connectionState,
      remoteUsers: remoteUsers.map(u => ({
        uid: u.uid,
        isScreen: u.uid.toString().endsWith('-screen'),
        hasVideo: !!u.videoTrack,
        hasAudio: !!u.audioTrack
      })),
      hostScreenUser: hostScreenUser ? {
        uid: hostScreenUser.uid,
        hasVideo: !!hostScreenUser.videoTrack,
        hasAudio: !!hostScreenUser.audioTrack
      } : null,
      screenVideoTrack: !!screenVideoTrack
    });
  }, [isHost, isMoviePlaying, connectionState, remoteUsers, hostScreenUser, screenVideoTrack]);

  const handleUserPublished = useCallback(async (user, mediaType) => {
    console.log('📡 User published:', user.uid, mediaType, 'isScreen:', user.uid.toString().endsWith('-screen'));
    
    try {
      await agoraClient.subscribe(user, mediaType);
      console.log('✅ Subscribed to:', user.uid, mediaType);
      
      const isScreenClient = user.uid.toString().endsWith('-screen');
      
      if (isScreenClient) {
        console.log('🎯 FOUND SCREEN SHARE USER:', user.uid);
        setHostScreenUser(user);
        setIsMoviePlaying(true);
        setScreenShareError(null);
        
        if (mediaType === 'video' && user.videoTrack) {
          console.log('🎬 Screen share video track available for playback');
          
          user.videoTrack.on('first-frame-decoded', () => {
            console.log('📺 First frame of screen share decoded!');
          });

          user.videoTrack.on('track-ended', () => {
            console.log('📺 Screen share track ended');
            setIsMoviePlaying(false);
            setHostScreenUser(null);
          });
        }
      } else if (!isHost) {
        console.log('👤 Regular user published:', user.uid);
        // Check if this might be the host's camera
        if (!hostCameraUser) {
          console.log('🎯 Setting potential host camera user:', user.uid);
          setHostCameraUser(user);
        }
      }
    } catch (error) {
      console.error('❌ Failed to subscribe:', error);
    }
  }, [agoraClient, isHost, hostCameraUser]);

  const handleUserUnpublished = useCallback((user, mediaType) => {
    console.log('📡 User unpublished:', user.uid, mediaType);
    
    const isScreenClient = user.uid.toString().endsWith('-screen');
    if (isScreenClient && mediaType === 'video') {
      console.log('🎯 Screen share ended');
      setHostScreenUser(null);
      setIsMoviePlaying(false);
      setScreenShareError(null);
    }
  }, []);

  const handleUserJoined = useCallback((user) => {
    console.log('👤 User joined:', user.uid);
  }, []);

  const handleUserLeft = useCallback((user) => {
    console.log('👤 User left:', user.uid);
    
    const isScreenClient = user.uid.toString().endsWith('-screen');
    if (isScreenClient) {
      console.log('🎯 Screen share user left');
      setHostScreenUser(null);
      setIsMoviePlaying(false);
      setScreenShareError(null);
    }
    
    if (hostCameraUser && hostCameraUser.uid === user.uid) {
      setHostCameraUser(null);
    }
  }, [hostCameraUser]);

  // Auto-detect screen share user
  useEffect(() => {
    if (!isHost && !hostScreenUser) {
      const screenUser = remoteUsers.find(user => {
        const isScreen = user.uid.toString().endsWith('-screen');
        if (isScreen && user.videoTrack) {
          console.log('🎯 AUTO-DETECTED SCREEN SHARE USER WITH VIDEO TRACK:', user.uid);
          return true;
        }
        return false;
      });
      
      if (screenUser) {
        setHostScreenUser(screenUser);
        setIsMoviePlaying(true);
        setScreenShareError(null);
      }
    }
  }, [remoteUsers, isHost, hostScreenUser]);

  const handleTokenPrivilegeWillExpire = useCallback(async () => {
    console.log('🔑 Token will expire soon, renewing...');
    try {
      if (fetchAgoraToken) {
        const newToken = await fetchAgoraToken(roomId, user.uid);
        if (newToken) {
          await agoraClient.renewToken(newToken);
          console.log('✅ Token renewed successfully');
        }
      }
    } catch (error) {
      console.warn('⚠️ Token renewal failed, but continuing:', error.message);
    }
  }, [agoraClient, roomId, user.uid, fetchAgoraToken]);

  const handleTokenPrivilegeDidExpire = useCallback(async () => {
    console.log('🔑 Token expired, attempting to renew...');
    try {
      if (fetchAgoraToken) {
        const newToken = await fetchAgoraToken(roomId, user.uid);
        if (newToken) {
          await agoraClient.renewToken(newToken);
          console.log('✅ Token renewed after expiration');
        } else {
          console.error('❌ Failed to get token after expiration');
          setConnectionError('Token expired. Please rejoin the room.');
        }
      }
    } catch (error) {
      console.error('❌ Failed to renew expired token:', error);
      setConnectionError('Connection lost due to token expiration.');
    }
  }, [agoraClient, roomId, user.uid, fetchAgoraToken]);

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
          console.log('✅ Data stream created for messaging');
        } catch (error) {
          console.warn("Could not create data stream:", error);
        }
      }

      if (streamId) {
        const payload = JSON.stringify(message);
        const encoder = new TextEncoder();
        await agoraClient.sendStreamMessage(streamId, encoder.encode(payload));
        console.log('📢 Stream message sent:', message.type);
      }
    } catch (error) {
      console.error("Failed to send stream message:", error);
    }
  }, [agoraClient, connectionState]);

  const handleStopMovie = useCallback(async () => {
    if (!isHost || !screenClient) return;

    try {
      console.log('🛑 Stopping screen share...');

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
      
      if (screenClient.connectionState === 'CONNECTED') {
        await screenClient.leave();
        console.log('✅ Screen client left channel');
      }

      setScreenVideoTrack(null);
      setIsMoviePlaying(false);
      setHostScreenUser(null);
      setScreenShareError(null);
      initializationRef.current.screenClientJoined = false;
      
      console.log('📢 Notifying participants about screen share stop');
      try {
        await sendStreamMessage({ type: 'MOVIE_STOP' });
      } catch (msgError) {
        console.warn("Could not send stream message, but screen share stopped", msgError);
      }
      
      console.log('🎯 Screen sharing stopped successfully');
      
    } catch (error) {
      console.error("Error stopping movie:", error);
      screenVideoTrackRef.current = null;
      screenAudioTrackRef.current = null;
      setScreenVideoTrack(null);
      setIsMoviePlaying(false);
      setHostScreenUser(null);
      setScreenShareError(null);
    }
  }, [isHost, screenClient, sendStreamMessage]);

  const createScreenTrack = useCallback(async () => {
    console.log('Creating screen track with dual-client approach');

    try {
      try {
        const screenTrack = await AgoraRTC.createScreenVideoTrack({
          encoderConfig: "1080p_1",
          optimizationMode: "detail",
          withAudio: true,
        }, "enable");

        console.log('Screen track with audio created successfully');
        return screenTrack;
      } catch (audioError) {
        console.log('System audio not available, creating screen track without audio:', audioError);
        
        const screenTrack = await AgoraRTC.createScreenVideoTrack({
          encoderConfig: "1080p_1",
          optimizationMode: "detail",
        }, "disable");
        
        return screenTrack;
      }
    } catch (error) {
      console.log('All screen track methods failed, trying basic configuration:', error);
      const screenTrack = await AgoraRTC.createScreenVideoTrack({}, "disable");
      return screenTrack;
    }
  }, []);

  const handleStartStream = useCallback(async () => {
    // UPDATED GUARD: Allows starting if isMoviePlaying is true but there's no active screen track.
    if (!isHost || (isMoviePlaying && screenVideoTrackRef.current) || isStartingStream || !screenClient) {
      console.log('handleStartStream returned early due to guard condition.');
      return;
    }

    setIsStartingStream(true);
    console.log('🔄 Starting screen share with dual-client approach...');

    const screenUid = `${user.uid}-screen`;
    console.log('🎯 Screen share UID will be:', screenUid);

    try {
      console.log(`🔑 Requesting screen token for UID: ${screenUid}`);
      const screenToken = await fetchAgoraToken(roomId, screenUid);
      
      if (!screenToken) {
        throw new Error('No token received for screen client');
      }

      console.log('✅ Screen token received, creating screen track...');
      const screenTrack = await createScreenTrack();

      let videoTrack, audioTrack;
      
      if (Array.isArray(screenTrack)) {
        [videoTrack, audioTrack] = screenTrack;
      } else {
        videoTrack = screenTrack;
      }

      console.log('🎯 Screen track created, joining screen client to channel...');
      
      screenClient.on('user-published', async (screenUser, mediaType) => {
        console.log('📡 Screen client user published:', screenUser.uid, mediaType);
      });

      screenClient.on('user-joined', (screenUser) => {
        console.log('👤 Screen client user joined:', screenUser.uid);
      });

      await screenClient.join(appId, roomId, screenToken, screenUid);
      console.log('✅ Screen client joined channel successfully with UID:', screenUid);
      
      const tracksToPublish = [videoTrack];
      if (audioTrack) {
        tracksToPublish.push(audioTrack);
      }

      console.log('🎯 Publishing screen tracks...');
      await screenClient.publish(tracksToPublish);
      console.log('✅ Screen tracks published successfully');

      screenVideoTrackRef.current = videoTrack;
      setScreenVideoTrack(videoTrack);
      if (audioTrack) {
        screenAudioTrackRef.current = audioTrack;
      }

      videoTrack.on("track-ended", () => {
        console.log("Screen share ended by user");
        handleStopMovie();
      });

      setIsMoviePlaying(true);
      initializationRef.current.screenClientJoined = true;
      
      console.log('📢 Notifying participants about screen share start');
      console.log('🎯 Sending MOVIE_START message with screen UID:', screenUid);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await sendStreamMessage({ 
        type: 'MOVIE_START',
        screenUid: screenUid,
        hostUid: user.uid,
        timestamp: Date.now()
      });
      
      console.log('🎉 Screen sharing started successfully! Participants notified.');
      
    } catch (error) {
      console.error("❌ Error starting screen share:", error);
      setIsMoviePlaying(false);
      setScreenVideoTrack(null);
      setScreenShareError(`Failed to start screen share: ${error.message}`);
      
      if (error.name === 'NotAllowedError') {
        alert("Screen sharing permission denied. Please allow screen sharing and try again.");
      } else if (error.name === 'NOT_SUPPORTED') {
        alert("System audio capture is not supported in this browser. Screen sharing will continue without system audio.");
      } else if (error.message.includes('token') || error.message.includes('auth')) {
        alert("Token authentication failed for screen sharing. Please try again.");
      } else {
        alert(`Failed to start screen sharing: ${error.message || 'Unknown error'}. Please try again.`);
      }
    } finally {
      setIsStartingStream(false);
    }
  }, [isHost, isMoviePlaying, isStartingStream, screenClient, user.uid, appId, roomId, createScreenTrack, handleStopMovie, sendStreamMessage, fetchAgoraToken]);

  // Stream message debug handler
  useEffect(() => {
    if (!agoraClient) return;

    const handleStreamMessageDebug = async (uid, streamId, data) => {
      console.log('📨 STREAM MESSAGE DEBUG - Received from:', uid);
      
      try {
        const text = new TextDecoder().decode(data);
        const message = JSON.parse(text);
        console.log('📨 Message content:', message);
      } catch (error) {
        console.error('❌ Failed to parse stream message:', error);
      }
    };

    agoraClient.on('stream-message', handleStreamMessageDebug);
    
    return () => {
      agoraClient.off('stream-message', handleStreamMessageDebug);
    };
  }, [agoraClient]);

  // Handle stream messages for participants
  useEffect(() => {
    if (!agoraClient) return;

    const handleStreamMessage = async (uid, streamId, data) => {
      console.log('📨 Received stream message from UID:', uid);
      
      try {
        const text = new TextDecoder().decode(data);
        const message = JSON.parse(text);
        
        console.log('📨 Stream message type:', message.type, 'content:', message);
        
        if (message.type === 'MOVIE_START' && message.screenUid) {
          console.log('🎯 MOVIE_START received, looking for screen UID:', message.screenUid);
          setIsMoviePlaying(true);
          setScreenShareError(null);
          
          const screenUser = remoteUsers.find(u => u.uid.toString() === message.screenUid.toString());
          if (screenUser) {
            console.log('✅ Found screen user immediately:', screenUser.uid);
            setHostScreenUser(screenUser);
          } else {
            console.log('⏳ Screen user not found yet, will auto-detect when published');
            setTimeout(() => {
              const delayedScreenUser = remoteUsers.find(u => u.uid.toString() === message.screenUid.toString());
              if (delayedScreenUser) {
                console.log('✅ Found screen user after delay:', delayedScreenUser.uid);
                setHostScreenUser(delayedScreenUser);
              }
            }, 2000);
          }
        } else if (message.type === 'MOVIE_STOP') {
          console.log('🎯 MOVIE_STOP received');
          setIsMoviePlaying(false);
          setHostScreenUser(null);
          setScreenShareError(null);
        }
      } catch (error) {
        console.error("❌ Failed to parse stream message:", error);
      }
    };

    agoraClient.on('stream-message', handleStreamMessage);
    
    return () => {
      agoraClient.off('stream-message', handleStreamMessage);
    };
  }, [agoraClient, user.uid, remoteUsers]);

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
        console.log('🚀 Initializing main Agora client...');
        setConnectionError(null);

        if (!validateToken(token, appId, roomId, user.uid)) {
          throw new Error('Invalid token provided');
        }

        agoraClient.on('user-published', handleUserPublished);
        agoraClient.on('user-unpublished', handleUserUnpublished);
        agoraClient.on('user-joined', handleUserJoined);
        agoraClient.on('user-left', handleUserLeft);
        agoraClient.on('token-privilege-will-expire', handleTokenPrivilegeWillExpire);
        agoraClient.on('token-privilege-did-expire', handleTokenPrivilegeDidExpire);
        agoraClient.on('connection-state-change', (state) => {
          console.log('Connection state changed:', state);
          if (state === 'DISCONNECTED' || state === 'FAILED') {
            setConnectionError('Connection lost. Please try rejoining.');
          }
        });
        
        console.log('🔑 Joining Agora channel...');
        await agoraClient.join(appId, roomId, token, user.uid);
        console.log('✅ Successfully joined Agora channel');
        
        const [micTrack, camTrack] = await AgoraRTC.createMicrophoneAndCameraTracks(
          { encoderConfig: "music_standard" },
          { encoderConfig: "480p_1", optimizationMode: "motion" }
        );
        
        await micTrack.setEnabled(micOn);
        await camTrack.setEnabled(cameraOn);

        localMicrophoneTrackRef.current = micTrack;
        localCameraTrackRef.current = camTrack;
        setSelfViewTrack(camTrack);
        
        await agoraClient.publish([micTrack, camTrack]);
        
        setDataStreamReady(true);
        initializationRef.current.hasJoined = true;
        console.log('✅ Agora client fully initialized and published');
        
      } catch (error) {
        console.error("❌ Failed to initialize and join:", error);
        setConnectionError(`Failed to join room: ${error.message || 'Unknown connection error'}`);
        if (onTokenError) {
          onTokenError(`Token authentication failed: ${error.message}`);
        }
        setJoinAttempts(prev => prev + 1);
      } finally {
        initializationRef.current.isInitializing = false;
      }
    };

    initializeAndJoin();

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
  }, [agoraClient, appId, roomId, token, user.uid, handleUserPublished, handleUserUnpublished, handleUserJoined, handleUserLeft, handleTokenPrivilegeWillExpire, handleTokenPrivilegeDidExpire, onTokenError, validateToken, micOn, cameraOn]);

  // Create data stream when connected
  useEffect(() => {
    if (connectionState === 'CONNECTED' && !dataStreamRef.current && agoraClient?.createDataStream) {
      const createDataStream = async () => {
        try {
          const streamId = await agoraClient.createDataStream({ reliable: true, ordered: true });
          dataStreamRef.current = streamId;
          console.log('✅ Data stream created successfully');
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
        const user = remoteUsers.find(u => u.audioTrack === track);
        if (user && !user.uid.toString().endsWith('-screen')) {
          track.play();
        }
      } catch (error) {
        console.error("Error playing audio track:", error);
      }
    });
  }, [audioTracks, remoteUsers]);

  const toggleCamera = useCallback(async () => {
    if (localCameraTrackRef.current) {
      const newState = !cameraOn;
      await localCameraTrackRef.current.setEnabled(newState);
      setCameraOn(newState);
    }
  }, [cameraOn]);

  const toggleMic = useCallback(async () => {
    if (localMicrophoneTrackRef.current) {
      const newState = !micOn;
      await localMicrophoneTrackRef.current.setEnabled(newState);
      setMicOn(newState);
    }
  }, [micOn]);

  return {
    micOn,
    cameraOn,
    isMoviePlaying,
    selfViewTrack,
    dataStreamReady,
    hostScreenUser,
    hostCameraUser,
    connectionError,
    joinAttempts,
    screenVideoTrack,
    connectionState,
    remoteUsers,
    screenShareError,
    setScreenShareError,
    localMicrophoneTrackRef,
    localCameraTrackRef,
    toggleCamera,
    toggleMic,
    handleStartStream,
    handleStopMovie,
    sendStreamMessage
  };
};