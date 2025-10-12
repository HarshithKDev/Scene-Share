// src/pages/useStreamRoomHooks.js
import { useState, useEffect, useRef, useCallback } from 'react';
import AgoraRTC from "agora-rtc-sdk-ng";
import { useRemoteUsers, useRemoteAudioTracks, useConnectionState } from "agora-rtc-react";
import { sendHeartbeat } from '../services/agoraApi';
import { db } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';

// --- HELPER: Promise with a timeout ---
const withTimeout = (promise, ms) => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Operation timed out'));
    }, ms);

    promise
      .then(value => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch(reason => {
        clearTimeout(timer);
        reject(reason);
      });
  });
};


export const useStreamRoomHooks = ({ isHost, roomId, token, user, appId, client: agoraClient, fetchAgoraToken, onTokenError }) => {
  const [screenClient, setScreenClient] = useState(null);

  const connectionState = useConnectionState();
  const remoteUsers = useRemoteUsers();
  const { audioTracks } = useRemoteAudioTracks(remoteUsers);

  const [micOn, setMicOn] = useState(() => {
    const savedMicState = localStorage.getItem('micOn');
    return savedMicState !== null ? JSON.parse(savedMicState) : true;
  });
  const [cameraOn, setCameraOn] = useState(() => {
      const savedCameraState = localStorage.getItem('cameraOn');
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
  const [activeSpeakerUid, setActiveSpeakerUid] = useState(null);
  const [participantDetails, setParticipantDetails] = useState({});
  const [videoStats, setVideoStats] = useState({});


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

  // NEW EFFECT: Listen for participant details
  useEffect(() => {
    if (!roomId) return;

    const participantsColRef = collection(db, 'rooms', roomId, 'participants');
    
    const unsubscribe = onSnapshot(participantsColRef, (snapshot) => {
      const details = {};
      snapshot.docs.forEach((doc) => {
        details[doc.id] = doc.data();
      });
      setParticipantDetails(details);
    });

    return () => unsubscribe(); // Cleanup listener on component unmount
  }, [roomId]);

  useEffect(() => {
    if (isHost && connectionState === 'CONNECTED') {
      sendHeartbeat(roomId, () => user.getIdToken());
      const intervalId = setInterval(() => {
        console.log('💓 Sending host heartbeat...');
        sendHeartbeat(roomId, () => user.getIdToken());
      }, 5 * 60 * 1000);
      return () => clearInterval(intervalId);
    }
  }, [isHost, connectionState, roomId, user]);

  useEffect(() => {
    localStorage.setItem('micOn', JSON.stringify(micOn));
  }, [micOn]);

  useEffect(() => {
      localStorage.setItem('cameraOn', JSON.stringify(cameraOn));
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

  useEffect(() => {
    if (isHost && !screenClient) {
      const newScreenClient = AgoraRTC.createClient({
        codec: "vp8",
        mode: "rtc",
      });
      setScreenClient(newScreenClient);
    }
  }, [isHost, screenClient]);

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
          user.videoTrack.on('track-ended', () => {
            console.log('📺 Screen share track ended');
            setIsMoviePlaying(false);
            setHostScreenUser(null);
          });
        }
      } else if (!isHost) {
        console.log('👤 Regular user published:', user.uid);
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

  useEffect(() => {
    if (!isHost && !hostScreenUser) {
      const screenUser = remoteUsers.find(u => {
        const isScreen = u.uid.toString().endsWith('-screen');
        if (isScreen && u.videoTrack) {
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
        const { token: newToken } = await fetchAgoraToken(roomId, user.uid);
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
        const { token: newToken } = await fetchAgoraToken(roomId, user.uid);
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
    if (!agoraClient || agoraClient.connectionState !== 'CONNECTED') {
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
      }
    } catch (error) {
      console.error("Failed to send stream message:", error);
    }
  }, [agoraClient]);

  const handleStopMovie = useCallback(async () => {
    if (!isHost || !screenClient) return;

    try {
      if (screenVideoTrackRef.current) {
        screenVideoTrackRef.current.stop();
        screenVideoTrackRef.current.close();
      }
      if (screenAudioTrackRef.current) {
        screenAudioTrackRef.current.stop();
        screenAudioTrackRef.current.close();
      }

      screenVideoTrackRef.current = null;
      screenAudioTrackRef.current = null;

      if (screenClient.connectionState === 'CONNECTED') {
        await screenClient.leave();
      }

      setScreenVideoTrack(null);
      setIsMoviePlaying(false);
      setHostScreenUser(null);
      setScreenShareError(null);
      initializationRef.current.screenClientJoined = false;

      await sendStreamMessage({ type: 'MOVIE_STOP' });

    } catch (error) {
      console.error("Error stopping movie:", error);
    }
  }, [isHost, screenClient, sendStreamMessage]);

  const createScreenTrack = useCallback(async () => {
    try {
      return await AgoraRTC.createScreenVideoTrack({
        // Using a standard config with a bitrate cap
        encoderConfig: {
            width: 1280,
            height: 1080,
            frameRate: 30,
            bitrateMax: 2000, // Capping bitrate at 2000 Kbps (2 Mbps)
        },
        optimizationMode: "motion",
        withAudio: "enable",
      });
    } catch (error) {
      if (error.code === 'SCREEN_SHARING_NOT_SUPPORTED') {
        return await AgoraRTC.createScreenVideoTrack({
            encoderConfig: {
                width: 1280,
                height: 1080,
                frameRate: 30,
                bitrateMax: 2000,
            },
            optimizationMode: "motion",
        }, "disable");
      }
      throw error;
    }
  }, []);

  const handleStartStream = useCallback(async () => {
    if (!isHost || isStartingStream || !screenClient) return;

    setIsStartingStream(true);
    setScreenShareError(null);
    const screenUid = `${user.uid}-screen`;

    try {
      // --- FIX: Wrap the permission request in a timeout ---
      const screenTrack = await withTimeout(createScreenTrack(), 30000); // 30-second timeout
      const [videoTrack, audioTrack] = Array.isArray(screenTrack) ? screenTrack : [screenTrack];

      const { token: screenToken } = await fetchAgoraToken(roomId, screenUid);
      if (!screenToken) throw new Error('No token for screen client');

      await screenClient.join(appId, roomId, screenToken, screenUid);

      const tracksToPublish = [videoTrack];
      if (audioTrack) tracksToPublish.push(audioTrack);

      await screenClient.publish(tracksToPublish);

      screenVideoTrackRef.current = videoTrack;
      if (audioTrack) screenAudioTrackRef.current = audioTrack;

      videoTrack.on("track-ended", handleStopMovie);

      setIsMoviePlaying(true);
      initializationRef.current.screenClientJoined = true;

      await sendStreamMessage({
        type: 'MOVIE_START',
        screenUid: screenUid,
        hostUid: user.uid,
        timestamp: Date.now()
      });

    } catch (error) {
      console.error("❌ Error starting screen share:", error);

      if (error && error.message && (error.message.includes("Permission denied") || error.message.includes("NotAllowedError"))) {
        console.log('User cancelled screen share.');
      } else if (error && error.message && error.message.includes('timed out')) {
        setScreenShareError('Screen share request timed out. The browser may be blocking requests. Please refresh the page and try again.');
      }
      else {
        setScreenShareError(`Failed to start screen share: ${error.message}`);
      }

      setIsMoviePlaying(false);
      setScreenVideoTrack(null);
    } finally {
      setIsStartingStream(false);
    }
  }, [isHost, isStartingStream, screenClient, user.uid, appId, roomId, createScreenTrack, handleStopMovie, sendStreamMessage, fetchAgoraToken]);

  // Main client initialization
  useEffect(() => {
    const shouldInitialize =
      agoraClient &&
      token &&
      !initializationRef.current.hasJoined &&
      !initializationRef.current.isInitializing;

    if (!shouldInitialize) return;

    const initializeAndJoin = async () => {
      try {
        initializationRef.current.isInitializing = true;
        setConnectionError(null);

        if (!validateToken(token, appId, roomId, user.uid)) {
          throw new Error('Invalid token provided');
        }

        const handleVolumeIndicator = (volumes) => {
            let maxVolume = 0;
            let speakerUid = null;

            volumes.forEach((volume) => {
            if (volume.level > maxVolume && volume.level > 5) {
                maxVolume = volume.level;
                speakerUid = volume.uid === 0 ? user.uid : volume.uid;
            }
            });

            setActiveSpeakerUid(speakerUid);
        };

        agoraClient.on('user-published', handleUserPublished);
        agoraClient.on('user-unpublished', handleUserUnpublished);
        agoraClient.on('user-left', handleUserLeft);
        agoraClient.on('token-privilege-will-expire', handleTokenPrivilegeWillExpire);
        agoraClient.on('token-privilege-did-expire', handleTokenPrivilegeDidExpire);
        agoraClient.on("volume-indicator", handleVolumeIndicator);

        await agoraClient.join(appId, roomId, token, user.uid);

        let micTrack, camTrack;
        try {
            [micTrack, camTrack] = await AgoraRTC.createMicrophoneAndCameraTracks(
              { encoderConfig: "music_standard" },
              { encoderConfig: "480p_1", optimizationMode: "motion" }
            );
        } catch (mediaError) {
            console.error("❌ CRITICAL: Failed to create media tracks.", mediaError);
            // --- MODIFICATION START ---
            let errorMessage = `Could not access camera or microphone. Please ensure you have a camera/microphone connected and have granted permissions in your browser.`;
            if (mediaError.code === 'PERMISSION_DENIED') {
                errorMessage = "Camera and microphone permissions have been denied. Please enable them in your browser settings to continue.";
            } else if (mediaError.code === 'NOT_FOUND' || mediaError.code === 'DEVICES_NOT_FOUND') {
                errorMessage = "No camera or microphone found. Please connect a device and grant permissions.";
            } else if (mediaError.code === 'NOT_READABLE' || mediaError.code === 'TRACK_UNREADABLE') {
                errorMessage = "Your camera or microphone is currently in use by another application. Please close the other application and try again.";
            }
            setConnectionError(errorMessage);
            // --- MODIFICATION END ---
            return;
        }

        await micTrack.setEnabled(micOn);
        await camTrack.setEnabled(cameraOn);

        localMicrophoneTrackRef.current = micTrack;
        localCameraTrackRef.current = camTrack;
        setSelfViewTrack(camTrack);

        await agoraClient.publish([micTrack, camTrack]);

        setDataStreamReady(true);
        initializationRef.current.hasJoined = true;

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
      if (localMicrophoneTrackRef.current) {
        localMicrophoneTrackRef.current.stop();
        localCameraTrackRef.current.close();
      }
      if (localCameraTrackRef.current) {
        localCameraTrackRef.current.stop();
        localCameraTrackRef.current.close();
      }

      agoraClient.removeAllListeners();

      if (initializationRef.current.hasJoined) {
        agoraClient.leave();
      }

      initializationRef.current.hasJoined = false;
      initializationRef.current.isInitializing = false;
    };
  }, [agoraClient, appId, roomId, token, user, handleUserPublished, handleUserUnpublished, handleUserLeft, handleTokenPrivilegeWillExpire, handleTokenPrivilegeDidExpire, onTokenError, validateToken]);

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
  
  useEffect(() => {
    const interval = setInterval(() => {
      const allStats = {};
  
      // Local video stats (camera)
      const localVideoStats = agoraClient.getLocalVideoStats();
      if (localVideoStats) {
        allStats['local'] = {
          fps: localVideoStats.sendFrameRate,
          bitrate: localVideoStats.sendBitrate,
        };
      }
  
      // Remote video stats (other users' cameras)
      remoteUsers.forEach(user => {
        const remoteVideoStats = agoraClient.getRemoteVideoStats(user.uid);
        if (remoteVideoStats) {
          allStats[user.uid] = {
            fps: remoteVideoStats.receiveFrameRate,
            bitrate: remoteVideoStats.receiveBitrate,
          };
        }
      });
  
      // Screen share stats (if you are the host)
      if (isHost && screenClient && screenClient.connectionState === 'CONNECTED') {
        const screenStats = screenClient.getLocalVideoStats();
        if (screenStats) {
          allStats['screen'] = {
            fps: screenStats.sendFrameRate,
            bitrate: screenStats.sendBitrate,
          };
        }
      }
      // Screen share stats (if you are a viewer)
      else if (!isHost && hostScreenUser) {
        const remoteScreenStats = agoraClient.getRemoteVideoStats(hostScreenUser.uid);
        if (remoteScreenStats) {
          allStats['screen'] = {
            fps: remoteScreenStats.receiveFrameRate,
            bitrate: remoteScreenStats.receiveBitrate,
          };
        }
      }
  
      setVideoStats(allStats);
    }, 1000); // Update stats every second
  
    return () => clearInterval(interval);
  }, [agoraClient, screenClient, remoteUsers, isHost, hostScreenUser]);

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
    sendStreamMessage,
    activeSpeakerUid,
    isStartingStream,
    participantDetails,
    videoStats
  };
};