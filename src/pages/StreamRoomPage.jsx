// StreamRoomPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import AgoraRTC, {
  AgoraRTCProvider,
  useRTCClient,
  useJoin,
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
  PlayIcon,
  PauseIcon,
  StopIcon
} from '../components/Icons';

// --- Movie Controls Component ---
const MovieControls = ({ onPlayPause, onSeek, onSpeedChange, isPaused, progress, currentTime, duration, playbackRate, isHost }) => {
  const formatTime = (timeInSeconds) => {
    if (isNaN(timeInSeconds) || timeInSeconds === 0) return '0:00';
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white flex items-center gap-4">
      <button
        onClick={onPlayPause}
        className="p-2 hover:bg-white/20 rounded-full transition-colors"
        disabled={!isHost}
      >
        {isPaused ? <PlayIcon /> : <PauseIcon />}
      </button>
      <span className="text-sm font-mono">{formatTime(currentTime)}</span>
      <input
        type="range"
        min="0"
        max="100"
        value={progress}
        onChange={onSeek}
        disabled={!isHost}
        className="flex-1 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed"
      />
      <span className="text-sm font-mono">{formatTime(duration)}</span>
      <div className="flex items-center gap-2">
        {[1, 1.5, 2].map(rate => (
          <button
            key={rate}
            onClick={() => onSpeedChange(rate)}
            disabled={!isHost}
            className={`px-2 py-1 text-xs rounded transition-colors disabled:cursor-not-allowed ${
              playbackRate === rate ? 'bg-white text-black' : 'bg-white/20 hover:bg-white/30'
            }`}
          >
            {rate}x
          </button>
        ))}
      </div>
      {!isHost && <span className="text-xs text-gray-300 ml-2">Host controls</span>}
    </div>
  );
};

// --- Visual Layout Component ---
const StreamRoomLayout = ({
  isHost, user, mainViewTrack, selfViewTrack, remoteUsers,
  toggleMic, toggleCamera, micOn, cameraOn,
  handleLeave, theme, toggleTheme, isConnected,
  handleStartStream, isMoviePlaying, movieProps, roomId, handleStopMovie
}) => {
  const totalParticipants = 1 + remoteUsers.length;

  return (
    <div className="flex flex-col md:flex-row h-screen">
      <main className="flex-1 bg-black flex items-center justify-center relative">
        {(() => {
          if (isMoviePlaying) {
            if (mainViewTrack) {
              return (
                <div className="relative w-full h-full">
                  <LocalVideoTrack
                    track={mainViewTrack}
                    play={true}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                </div>
              );
            }
            if (!isHost) {
              const hostUser = remoteUsers.find(u => u.uid.toString() === roomId.split('-host-')[1]);
              if (hostUser && hostUser.videoTrack) {
                return (
                  <div className="relative w-full h-full">
                    <RemoteUser
                      user={hostUser}
                      playVideo={true}
                      playAudio={true}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  </div>
                );
              } else {
                return (
                  <div className="text-white text-center">
                    <div className="text-lg mb-2">Waiting for host's movie stream...</div>
                    <div className="text-sm text-gray-400">Remote users: {remoteUsers.length}</div>
                  </div>
                );
              }
            }
            return <div className="text-white">Loading movie...</div>;
          }

          if (totalParticipants === 2) {
            return (
              <div className="flex flex-col md:flex-row w-full h-full">
                <div className="w-full h-1/2 md:w-1/2 md:h-full flex items-center justify-center bg-gray-900 relative">
                  {selfViewTrack && cameraOn ? (
                    <LocalVideoTrack track={selfViewTrack} play={true} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (<div className="text-white text-6xl"><VideoCameraSlashIcon /></div>)}
                  <div className="absolute bottom-2 left-2 p-2"><span className="bg-black/60 text-white text-xs px-2 py-1 rounded">{user.displayName || user.email} (You)</span></div>
                </div>
                <div className="w-full h-1/2 md:w-1/2 md:h-full flex items-center justify-center bg-gray-900 relative">
                  {remoteUsers[0] ? (
                    <>
                      <RemoteUser user={remoteUsers[0]} playVideo={true} playAudio={true} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div className="absolute bottom-2 left-2 p-2"><span className="bg-black/60 text-white text-xs px-2 py-1 rounded">{remoteUsers[0].uid}</span></div>
                    </>
                  ) : null}
                </div>
              </div>
            );
          }

          if (totalParticipants > 2) {
            return <div className="text-white">Gallery view for {totalParticipants} participants would go here.</div>;
          }

          return (
            <div className="text-center text-gray-400 p-4">
              {isHost ? 'Click "Start Stream" to share your screen.' : 'Waiting for the host to start the movie...'}
            </div>
          );
        })()}

        {isMoviePlaying && (
          <MovieControls {...movieProps} isHost={isHost} />
        )}
      </main>

      <aside className="w-full md:max-w-sm bg-gray-900/80 backdrop-blur-lg p-4 flex flex-col space-y-4 overflow-y-auto">
        <div className="text-center">
          <h2 className="text-white text-xl font-bold">Room ID</h2>
          <p className="text-gray-400 text-sm break-all">{roomId}</p>
        </div>
        <h3 className="text-white text-lg font-bold flex items-center gap-2 shrink-0"><UsersIcon /> Participants ({totalParticipants})</h3>

        <div className="relative rounded-lg overflow-hidden bg-black shrink-0">
          {cameraOn && selfViewTrack ? (
            <LocalVideoTrack track={selfViewTrack} play={true} style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', aspectRatio: '16/9' }} className="flex items-center justify-center bg-gray-800 text-white text-4xl"><VideoCameraSlashIcon /></div>
          )}
          <div className="absolute top-0 left-0 p-2"><span className="bg-black/60 text-white text-xs px-2 py-1 rounded">{user.displayName || user.email} (You)</span></div>
          <div className="absolute bottom-0 right-0 p-2 flex items-center gap-2">
            <button disabled={!isConnected} onClick={toggleMic} className={`p-2 rounded-full text-white transition-colors disabled:opacity-50 ${micOn ? 'bg-black/50 hover:bg-white/20' : 'bg-red-600'}`}>{micOn ? <MicrophoneIcon /> : <MicrophoneSlashIcon />}</button>
            <button disabled={!isConnected} onClick={toggleCamera} className={`p-2 rounded-full text-white transition-colors disabled:opacity-50 ${cameraOn ? 'bg-black/50 hover:bg-white/20' : 'bg-red-600'}`}>{cameraOn ? <VideoCameraIcon /> : <VideoCameraSlashIcon />}</button>
          </div>
        </div>

        {remoteUsers.map(remoteUser => (
          <div key={remoteUser.uid} className="relative rounded-lg overflow-hidden shrink-0">
            <RemoteUser user={remoteUser} playVideo={true} playAudio={false} style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover' }} />
            <div className="absolute top-0 left-0 p-2"><span className="bg-black/60 text-white text-xs px-2 py-1 rounded">{remoteUser.uid}</span></div>
          </div>
        ))}

        <div className="flex-grow"></div>

        <div className="mt-auto shrink-0">
          {isHost && (
            <div className="mb-4">
              {!isMoviePlaying ? (
                <button onClick={handleStartStream} className={`w-full flex items-center justify-center gap-2 text-white py-2 px-4 rounded-full font-semibold transition-colors ${isConnected ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer' : 'bg-gray-500 cursor-not-allowed'}`} disabled={!isConnected}>
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

// --- Main Component ---
const StreamRoomPage = ({ isHost, roomId, token, user, onLeaveRoom, theme, toggleTheme, appId }) => {
  const agoraClient = useRTCClient();
  const connectionState = useConnectionState();

  const [micOn, setMicOn] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [isMoviePlaying, setIsMoviePlaying] = useState(false);
  const [isMoviePaused, setIsMoviePaused] = useState(true);
  const [mainViewTrack, setMainViewTrack] = useState(null);
  const [selfViewTrack, setSelfViewTrack] = useState(null);
  const [movieProgress, setMovieProgress] = useState(0);
  const [movieTime, setMovieTime] = useState({ current: 0, duration: 0 });
  const [playbackRate, setPlaybackRate] = useState(1);

  const localMicrophoneTrackRef = useRef(null);
  const localCameraTrackRef = useRef(null);
  const movieTrackRef = useRef(null);
  const movieVideoElementRef = useRef(null);
  const tracksInitialized = useRef(false);
  const dataStreamIdRef = useRef(null);
  const hostUid = isHost ? user.uid : roomId.split('-host-')[1];

  useJoin({ appid: appId, channel: roomId, token: token || null, uid: user.uid });
  const remoteUsers = useRemoteUsers();
  const { audioTracks } = useRemoteAudioTracks(remoteUsers);

  // Play remote audio (voice chat)
  useEffect(() => {
    audioTracks.forEach((track) => {
      try { track.play(); } catch (e) { /* ignore play errors */ }
    });
  }, [audioTracks]);

  // Subscribe host's published video for non-host participants
  useEffect(() => {
    if (isHost || !agoraClient) return;

    const handleUserPublished = async (user, mediaType) => {
      try {
        await agoraClient.subscribe(user, mediaType);
        if (mediaType === "video" && user.uid === hostUid) {
          setMainViewTrack(user.videoTrack);
        }
      } catch (err) {
        console.warn("subscribe failed", err);
      }
    };

    const handleUserUnpublished = (user, mediaType) => {
      if (mediaType === "video" && user.uid === hostUid) {
        setMainViewTrack(null);
      }
    };

    agoraClient.on("user-published", handleUserPublished);
    agoraClient.on("user-unpublished", handleUserUnpublished);

    return () => {
      agoraClient.off("user-published", handleUserPublished);
      agoraClient.off("user-unpublished", handleUserUnpublished);
    };
  }, [agoraClient, isHost, hostUid]);

  // Data stream creation after join
  useEffect(() => {
    if (!agoraClient || connectionState !== 'CONNECTED') return;

    let mounted = true;
    const createStream = async () => {
      try {
        // createDataStream is part of Agora SDK v4 client
        const streamId = await agoraClient.createDataStream({ reliable: true, ordered: true });
        if (mounted) dataStreamIdRef.current = streamId;
      } catch (err) {
        console.warn("createDataStream failed", err);
      }
    };
    createStream();

    return () => { mounted = false; };
  }, [agoraClient, connectionState]);

  // Listen for synchronization messages
  useEffect(() => {
    if (!agoraClient) return;

    const handleStreamMessage = (uid, streamId, msg) => {
      // Agora sendStreamMessage provides (uid, streamId, msg)
      let data = msg;
      if (msg instanceof Uint8Array) {
        try { data = new TextDecoder().decode(msg); } catch (e) { data = msg; }
      }
      try {
        const message = typeof data === 'string' ? JSON.parse(data) : data;
        if (!isHost) {
          const videoElement = movieVideoElementRef.current;
          switch (message.type) {
            case 'MOVIE_START':
              setIsMoviePlaying(true);
              setIsMoviePaused(false);
              break;
            case 'MOVIE_STOP':
              setIsMoviePlaying(false);
              setIsMoviePaused(true);
              setMovieProgress(0);
              setMovieTime({ current: 0, duration: 0 });
              setMainViewTrack(null);
              break;
            case 'MOVIE_PLAY':
              if (videoElement) { videoElement.play().catch(()=>{}); setIsMoviePaused(false); }
              break;
            case 'MOVIE_PAUSE':
              if (videoElement) { videoElement.pause(); setIsMoviePaused(true); }
              break;
            case 'MOVIE_SEEK':
              if (videoElement && message.time !== undefined) {
                videoElement.currentTime = message.time;
                const progress = (message.time / message.duration) * 100;
                setMovieProgress(progress);
                setMovieTime({ current: message.time, duration: message.duration });
              }
              break;
            case 'MOVIE_SPEED':
              if (videoElement && message.rate !== undefined) {
                videoElement.playbackRate = message.rate;
                setPlaybackRate(message.rate);
              }
              break;
            case 'MOVIE_SYNC':
              if (videoElement) {
                videoElement.currentTime = message.currentTime;
                videoElement.playbackRate = message.playbackRate;
                if (message.isPaused) videoElement.pause(); else videoElement.play().catch(()=>{});
                setMovieProgress((message.currentTime / message.duration) * 100);
                setMovieTime({ current: message.currentTime, duration: message.duration });
                setPlaybackRate(message.playbackRate);
                setIsMoviePaused(message.isPaused);
              }
              break;
            default:
              break;
          }
        }
      } catch (error) {
        console.error("Failed to parse stream message", error);
      }
    };

    // Note: agoraClient.on('stream-message') may have (uid, streamId, msg) signature
    agoraClient.on('stream-message', handleStreamMessage);

    return () => {
      agoraClient.off('stream-message', handleStreamMessage);
    };
  }, [agoraClient, isHost]);

  // Initialize audio/video tracks when connected
  useEffect(() => {
    if (connectionState === 'CONNECTED' && !tracksInitialized.current) {
      tracksInitialized.current = true;
      const initializeTracks = async () => {
        try {
          const [micTrack, camTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
          localMicrophoneTrackRef.current = micTrack;
          localCameraTrackRef.current = camTrack;
          setSelfViewTrack(camTrack);

          try {
            if (agoraClient.connectionState === 'CONNECTED') {
              await agoraClient.publish([micTrack, camTrack]);
              setMicOn(true);
              setCameraOn(true);
            }
          } catch (err) {
            console.warn("publish initial tracks failed", err);
          }
        } catch (error) {
          console.error("Error initializing tracks:", error);
        }
      };
      initializeTracks();
    }
  }, [connectionState, agoraClient]);

  // Track movie time updates (only relevant if using a local video element)
  useEffect(() => {
    const videoElement = movieVideoElementRef.current;
    if (!videoElement || !isHost) return;

    const handleTimeUpdate = () => {
      if (!videoElement.duration || videoElement.duration === Infinity) return;
      const progress = (videoElement.currentTime / videoElement.duration) * 100;
      setMovieProgress(progress);
      setMovieTime({ current: videoElement.currentTime, duration: videoElement.duration });
    };

    const handleDurationChange = () => {
      setMovieTime({ current: videoElement.currentTime, duration: videoElement.duration || 0 });
    };

    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    videoElement.addEventListener('durationchange', handleDurationChange);

    return () => {
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      videoElement.removeEventListener('durationchange', handleDurationChange);
    };
  }, [isHost, isMoviePlaying]);

  // Periodic sync for participants (every 5 seconds) when host
  useEffect(() => {
    if (!isHost || !isMoviePlaying || !agoraClient) return;

    const syncInterval = setInterval(async () => {
      const videoElement = movieVideoElementRef.current;
      if (!videoElement) return;

      try {
        const msg = JSON.stringify({
          type: 'MOVIE_SYNC',
          currentTime: videoElement.currentTime,
          duration: videoElement.duration,
          playbackRate: videoElement.playbackRate,
          isPaused: videoElement.paused
        });
        await sendStreamMessage({ type: 'MOVIE_SYNC', currentTime: videoElement.currentTime, duration: videoElement.duration, playbackRate: videoElement.playbackRate, isPaused: videoElement.paused });
      } catch (error) {
        console.error("Error sending sync message:", error);
      }
    }, 5000);

    return () => clearInterval(syncInterval);
  }, [isHost, isMoviePlaying, agoraClient]);

  const sendStreamMessage = async (message) => {
    if (!agoraClient || !dataStreamIdRef.current || agoraClient.connectionState !== 'CONNECTED') return;
    try {
      const payload = JSON.stringify(message);
      await agoraClient.sendStreamMessage(dataStreamIdRef.current, payload);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // Start screen share stream. Simplified constraints so browser presents all available choices (screens/windows/tabs)
  const handleStartStream = async () => {
    if (connectionState !== 'CONNECTED' || !isHost || !agoraClient) return;

    try {
      // Standard constraints only. Do not pass non-standard vendor fields.
      const displayMediaOptions = {
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 }
        },
        audio: true
      };

      // prompt browser to select screen/window/tab - browser will show all available choices
      const screenStream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);

      // get tracks
      const videoTrack = screenStream.getVideoTracks()[0];
      const audioTrack = screenStream.getAudioTracks()[0]; // may be undefined on some browsers

      // create Agora custom tracks from raw media tracks
      const screenVideoTrack = AgoraRTC.createCustomVideoTrack({ mediaStreamTrack: videoTrack });
      let screenAudioTrack = null;
      if (audioTrack) {
        screenAudioTrack = AgoraRTC.createCustomAudioTrack({ mediaStreamTrack: audioTrack });
      }

      // Unpublish camera track if present (we keep mic published if user wants voice)
      if (localCameraTrackRef.current) {
        try { await agoraClient.unpublish(localCameraTrackRef.current); } catch (e) { /* ignore */ }
      }

      // Publish screen video and optionally screen audio
      const toPublish = [screenVideoTrack];
      if (screenAudioTrack) toPublish.push(screenAudioTrack);

      await agoraClient.publish(toPublish);

      // When screen share stops via browser UI
      videoTrack.onended = async () => {
        // cleanup and revert to camera publish
        await handleStopMovie();
      };

      movieTrackRef.current = { video: screenVideoTrack, audio: screenAudioTrack, rawVideoTrack: videoTrack, rawAudioTrack: audioTrack };
      setMainViewTrack(screenVideoTrack);
      setIsMoviePlaying(true);
      setIsMoviePaused(false);

      // notify participants
      await sendStreamMessage({ type: 'MOVIE_START' });
    } catch (error) {
      console.error("Error starting screen share:", error);
      setIsMoviePlaying(false);
      // user denied or other error. Let UI handle alerting.
      if (error.name === 'NotAllowedError' || error.message.includes('Permission denied')) {
        alert("Screen sharing permission denied. Allow screen/window/tab sharing to continue.");
      } else {
        alert("Failed to start screen sharing: " + (error.message || error));
      }
    }
  };

  const handleStopMovie = async () => {
    if (!isHost || !movieTrackRef.current || !agoraClient) return;

    const { video, audio, rawVideoTrack, rawAudioTrack } = movieTrackRef.current;

    try {
      await agoraClient.unpublish([video, audio].filter(Boolean));
    } catch (e) { /* ignore */ }

    try { video?.stop?.(); video?.close?.(); } catch (e) {}
    try { audio?.stop?.(); audio?.close?.(); } catch (e) {}
    try { rawVideoTrack?.stop?.(); rawVideoTrack?.detach?.(); } catch (e) {}
    try { rawAudioTrack?.stop?.(); rawAudioTrack?.detach?.(); } catch (e) {}

    movieTrackRef.current = null;
    setMainViewTrack(null);
    setIsMoviePlaying(false);
    setIsMoviePaused(true);
    setMovieProgress(0);

    // Restore camera track publication if present
    if (localCameraTrackRef.current) {
      try { await agoraClient.publish([localCameraTrackRef.current]); } catch (e) { /* ignore */ }
    }

    await sendStreamMessage({ type: 'MOVIE_STOP' });
  };

  const toggleMoviePlayback = async () => {
    if (!isHost) return;

    // If host is streaming a live screen share then pause/play cannot control remote playback.
    // We still send play/pause messages so participants with a local mirrored player can act.
    const videoElement = movieVideoElementRef.current;
    if (!videoElement) return;

    if (videoElement.paused) {
      await videoElement.play().catch(()=>{});
      setIsMoviePaused(false);
      await sendStreamMessage({ type: 'MOVIE_PLAY' });
    } else {
      videoElement.pause();
      setIsMoviePaused(true);
      await sendStreamMessage({ type: 'MOVIE_PAUSE' });
    }
  };

  const handleSeek = async (e) => {
    if (!isHost) return;

    const videoElement = movieVideoElementRef.current;
    if (!videoElement || isNaN(videoElement.duration)) return;

    const newTime = (e.target.value / 100) * videoElement.duration;
    try { videoElement.currentTime = newTime; } catch(e){}
    setMovieProgress(e.target.value);

    await sendStreamMessage({
      type: 'MOVIE_SEEK',
      time: newTime,
      duration: videoElement.duration
    });
  };

  const handleSpeedChange = async (rate) => {
    if (!isHost) return;
    const videoElement = movieVideoElementRef.current;
    if (videoElement) {
      try { videoElement.playbackRate = rate; } catch(e){}
      setPlaybackRate(rate);
    }
    await sendStreamMessage({ type: 'MOVIE_SPEED', rate });
  };

  const toggleCamera = async () => {
    if (!localCameraTrackRef.current || connectionState !== 'CONNECTED') return;
    try {
      await localCameraTrackRef.current.setEnabled(!cameraOn);
      setCameraOn(!cameraOn);
    } catch (e) {
      console.warn("toggleCamera failed", e);
    }
  };

  const toggleMic = async () => {
    if (!localMicrophoneTrackRef.current || connectionState !== 'CONNECTED') return;
    try {
      await localMicrophoneTrackRef.current.setEnabled(!micOn);
      setMicOn(!micOn);
    } catch (e) {
      console.warn("toggleMic failed", e);
    }
  };

  const handleLeave = async () => {
    // Clean up all tracks
    [localCameraTrackRef.current, localMicrophoneTrackRef.current].forEach(track => {
      if (track) {
        try { track.stop(); track.close(); } catch (e) {}
      }
    });

    if (movieTrackRef.current) {
      try { movieTrackRef.current.video?.stop?.(); movieTrackRef.current.video?.close?.(); } catch (e) {}
      try { movieTrackRef.current.rawVideoTrack?.stop?.(); } catch (e) {}
      try { movieTrackRef.current.audio?.stop?.(); movieTrackRef.current.audio?.close?.(); } catch (e) {}
    }

    try {
      if (agoraClient.connectionState === 'CONNECTED') {
        await agoraClient.leave();
      }
    } catch (e) { console.warn("leave failed", e); }

    // reset flags to allow re-init if re-entering
    tracksInitialized.current = false;
    dataStreamIdRef.current = null;

    onLeaveRoom();
  };

  if (!appId || !token) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Configuration Error</h1>
          <p>App ID or token is missing. Please check your Agora configuration.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Hidden video element retained for local-file playback scenarios.
          It does not drive screen-sharing. Controls still send sync messages to participants. */}
      <video
        ref={movieVideoElementRef}
        style={{ position: 'absolute', top: '-9999px', left: '-9999px', width: '1px', height: '1px' }}
        playsInline
        muted={!isHost}
      />
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
        movieProps={{
          onPlayPause: toggleMoviePlayback,
          onSeek: handleSeek,
          onSpeedChange: handleSpeedChange,
          isPaused: isMoviePaused,
          progress: movieProgress,
          currentTime: movieTime.current,
          duration: movieTime.duration,
          playbackRate
        }}
        roomId={roomId}
        handleStopMovie={handleStopMovie}
      />
    </div>
  );
};

const StreamRoomPageWrapper = (props) => {
  // create single client instance here and pass to provider
  const client = React.useMemo(() => AgoraRTC.createClient({ codec: "vp8", mode: "rtc" }), []);
  return (
    <AgoraRTCProvider client={client}>
      <StreamRoomPage {...props} />
    </AgoraRTCProvider>
  );
};

export default StreamRoomPageWrapper;