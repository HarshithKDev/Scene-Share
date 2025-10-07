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
import { UsersIcon, VideoCameraIcon, VideoCameraSlashIcon, MicrophoneIcon, MicrophoneSlashIcon, LogoutIcon, UploadIcon, PlayIcon, PauseIcon, StopIcon } from '../components/Icons';

// --- Agora Client Initialization ---
const agoraClient = AgoraRTC.createClient({ codec: "vp8", mode: "rtc" });

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
    handleMovieSelect, isMoviePlaying, movieProps, roomId, handleStopMovie
}) => {
    const totalParticipants = 1 + remoteUsers.length;

    return (
        <div className="flex flex-col md:flex-row h-screen">
            <main className="flex-1 bg-black flex items-center justify-center relative">
                {(() => {
                    // Case 1: A movie is playing
                    if (isMoviePlaying) {
                        if (isHost && mainViewTrack) {
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
                            if (mainViewTrack) {
                                // Participant has received the movie stream
                                return (
                                    <div className="relative w-full h-full">
                                        <RemoteUser 
                                            user={remoteUsers[0]} 
                                            playVideo={true} 
                                            playAudio={true} 
                                            style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                                        />
                                    </div>
                                );
                            } else {
                                // Waiting for stream
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
                    
                    // Case 2: Exactly two participants and no movie
                    if (totalParticipants === 2) {
                         return (
                            <div className="flex flex-col md:flex-row w-full h-full">
                                <div className="w-full h-1/2 md:w-1/2 md:h-full flex items-center justify-center bg-gray-900 relative">
                                    {selfViewTrack && cameraOn ? (
                                        <LocalVideoTrack track={selfViewTrack} play={true} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : ( <div className="text-white text-6xl"><VideoCameraSlashIcon /></div> )}
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
                    
                    // Case 3: More than two participants
                    if (!isHost && remoteUsers.length > 0) {
                         return <RemoteUser user={remoteUsers[0]} playVideo={true} playAudio={true} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />;
                    }

                    // Case 4: Default waiting view
                    return (
                        <div className="text-center text-gray-400 p-4">
                            {isHost ? 'Choose a movie to start streaming or wait for others to join...' : 'Waiting for the host to start the movie...'}
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
                                <>
                                <label htmlFor="movie-upload" className={`w-full flex items-center justify-center gap-2 text-white py-2 px-4 rounded-full font-semibold transition-colors ${isConnected ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer' : 'bg-gray-500 cursor-not-allowed'}`}><UploadIcon /> Choose Movie</label>
                                <input id="movie-upload" type="file" accept="video/mp4,video/webm,video/ogg" onChange={handleMovieSelect} className="hidden" disabled={!isConnected} />
                                </>
                            ) : (
                                <button onClick={handleStopMovie} className={`w-full flex items-center justify-center gap-2 text-white py-2 px-4 rounded-full font-semibold transition-colors ${isConnected ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-gray-500'}`} disabled={!isConnected}><StopIcon /> Stop Movie</button>
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
  const syncTimeoutRef = useRef(null);

  useJoin({ appid: appId, channel: roomId, token: token || null, uid: user.uid });
  const remoteUsers = useRemoteUsers();
  const { audioTracks } = useRemoteAudioTracks(remoteUsers);
  
  // Play remote audio (voice chat)
  useEffect(() => {
    audioTracks.forEach((track) => track.play());
  }, [audioTracks]);

  // Listen for remote video tracks and update main view for participants
  useEffect(() => {
    if (isHost || !agoraClient) return;

    const handleUserPublished = async (user, mediaType) => {
      await agoraClient.subscribe(user, mediaType);
      console.log("Subscribed to:", user.uid, mediaType);

      if (mediaType === 'video') {
        const remoteVideoTrack = user.videoTrack;
        if (remoteVideoTrack && isMoviePlaying) {
          setMainViewTrack(remoteVideoTrack);
        }
      }
      
      if (mediaType === 'audio') {
        const remoteAudioTrack = user.audioTrack;
        if (remoteAudioTrack) {
          remoteAudioTrack.play();
        }
      }
    };

    const handleUserUnpublished = (user, mediaType) => {
      console.log("User unpublished:", user.uid, mediaType);
      if (mediaType === 'video' && !isHost) {
        setMainViewTrack(null);
      }
    };

    agoraClient.on('user-published', handleUserPublished);
    agoraClient.on('user-unpublished', handleUserUnpublished);

    return () => {
      agoraClient.off('user-published', handleUserPublished);
      agoraClient.off('user-unpublished', handleUserUnpublished);
    };
  }, [agoraClient, isHost, isMoviePlaying]);

  // Listen for synchronization messages
  useEffect(() => {
    if (!agoraClient) return;

    const handleStreamMessage = (uid, data) => {
        try {
            const message = JSON.parse(new TextDecoder().decode(data));
            console.log("Message received:", message, "from UID:", uid);

            if (!isHost) {
                const videoElement = movieVideoElementRef.current;
                
                switch(message.type) {
                    case 'MOVIE_START':
                        console.log("Participant: Movie started");
                        setIsMoviePlaying(true);
                        setIsMoviePaused(false);
                        // Wait for video track to be published
                        break;
                        
                    case 'MOVIE_STOP':
                        console.log("Participant: Movie stopped");
                        setIsMoviePlaying(false);
                        setIsMoviePaused(true);
                        setMovieProgress(0);
                        setMovieTime({ current: 0, duration: 0 });
                        setMainViewTrack(null);
                        break;
                        
                    case 'MOVIE_PLAY':
                        setIsMoviePaused(false);
                        break;
                        
                    case 'MOVIE_PAUSE':
                        setIsMoviePaused(true);
                        break;
                        
                    case 'MOVIE_SEEK':
                        if (videoElement && message.time !== undefined) {
                            const progress = (message.time / message.duration) * 100;
                            setMovieProgress(progress);
                            setMovieTime({ current: message.time, duration: message.duration });
                        }
                        break;
                        
                    case 'MOVIE_SPEED':
                        setPlaybackRate(message.rate);
                        break;
                        
                    case 'MOVIE_SYNC':
                        // Sync current playback state
                        setMovieProgress((message.currentTime / message.duration) * 100);
                        setMovieTime({ current: message.currentTime, duration: message.duration });
                        setPlaybackRate(message.playbackRate);
                        setIsMoviePaused(message.isPaused);
                        break;
                }
            }
        } catch (error) {
            console.error("Failed to parse stream message", error);
        }
    };

    agoraClient.on('stream-message', handleStreamMessage);

    return () => {
        agoraClient.off('stream-message', handleStreamMessage);
    };
  }, [agoraClient, isHost]);

  // Initialize audio/video tracks
  useEffect(() => {
    if (connectionState === 'CONNECTED' && !tracksInitialized.current) {
      tracksInitialized.current = true;
      const initializeTracks = async () => {
        try {
          const [micTrack, camTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
          localMicrophoneTrackRef.current = micTrack;
          localCameraTrackRef.current = camTrack;
          
          setSelfViewTrack(camTrack);

          if (agoraClient.connectionState === 'CONNECTED') {
            await agoraClient.publish([micTrack, camTrack]);
            setMicOn(true);
            setCameraOn(true);
          }
        } catch (error) { 
          console.error("Error initializing tracks:", error); 
        }
      };
      initializeTracks();
    }
  }, [connectionState, agoraClient]);

  // Track movie time updates
  useEffect(() => {
    const videoElement = movieVideoElementRef.current;
    if (!videoElement || !isHost) return;

    const handleTimeUpdate = () => {
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

  // Periodic sync for participants (every 5 seconds)
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
        const payload = new TextEncoder().encode(msg);
        await agoraClient.sendStreamMessage(payload);
      } catch (error) {
        console.error("Error sending sync message:", error);
      }
    }, 5000);

    return () => clearInterval(syncInterval);
  }, [isHost, isMoviePlaying, agoraClient]);

  const sendStreamMessage = async (message) => {
    if (!agoraClient || agoraClient.connectionState !== 'CONNECTED') return;
    try {
      const msg = JSON.stringify(message);
      const payload = new TextEncoder().encode(msg);
      await agoraClient.sendStreamMessage(payload);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleMovieSelect = async (e) => {
    if (connectionState !== 'CONNECTED') return;
    const file = e.target.files[0];
    if (!file || !movieVideoElementRef.current) return;
    
    console.log("Host: Starting movie...", file.name);
    
    const movieUrl = URL.createObjectURL(file);
    const videoElement = movieVideoElementRef.current;
    videoElement.src = movieUrl;
    
    videoElement.onloadedmetadata = async () => {
      try {
        console.log("Host: Video metadata loaded, playing...");
        await videoElement.play();
        
        // Small delay to ensure video is playing
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Capture both video and audio from the movie
        const stream = videoElement.captureStream(30); // 30 FPS
        const videoStreamTrack = stream.getVideoTracks()[0];
        const audioStreamTrack = stream.getAudioTracks()[0];

        console.log("Host: Video track:", videoStreamTrack, "Audio track:", audioStreamTrack);

        if (!videoStreamTrack) {
            console.error("Could not get video track from movie file.");
            alert("Failed to capture video track. Please try another file.");
            return;
        }

        // Create custom tracks
        const customMovieVideoTrack = AgoraRTC.createCustomVideoTrack({ 
          mediaStreamTrack: videoStreamTrack 
        });
        
        const customMovieAudioTrack = audioStreamTrack 
          ? AgoraRTC.createCustomAudioTrack({ 
              mediaStreamTrack: audioStreamTrack 
            }) 
          : null;

        console.log("Host: Custom tracks created");

        // Unpublish user's camera and mic
        const tracksToUnpublish = [];
        if (localCameraTrackRef.current) tracksToUnpublish.push(localCameraTrackRef.current);
        if (localMicrophoneTrackRef.current) tracksToUnpublish.push(localMicrophoneTrackRef.current);
        
        if (tracksToUnpublish.length > 0) {
          console.log("Host: Unpublishing user tracks...");
          await agoraClient.unpublish(tracksToUnpublish);
        }

        // Publish movie tracks
        const tracksToPublish = [customMovieVideoTrack];
        if (customMovieAudioTrack) {
          tracksToPublish.push(customMovieAudioTrack);
        }
        
        console.log("Host: Publishing movie tracks...", tracksToPublish.length);
        await agoraClient.publish(tracksToPublish);
        console.log("Host: Movie tracks published successfully");

        // Re-publish microphone for voice chat during movie
        if (micOn && localMicrophoneTrackRef.current) {
          console.log("Host: Re-publishing microphone for voice chat");
          await agoraClient.publish([localMicrophoneTrackRef.current]);
        }

        movieTrackRef.current = { video: customMovieVideoTrack, audio: customMovieAudioTrack };
        setMainViewTrack(customMovieVideoTrack);
        setIsMoviePlaying(true);
        setIsMoviePaused(false);

        // Small delay before notifying participants
        await new Promise(resolve => setTimeout(resolve, 500));

        // Notify participants
        console.log("Host: Sending MOVIE_START message");
        await sendStreamMessage({ 
          type: 'MOVIE_START',
          duration: videoElement.duration 
        });

      } catch (error) { 
        console.error("Error publishing movie track:", error); 
        alert("Failed to start movie streaming: " + error.message);
        setIsMoviePlaying(false);
      }
    };

    // Handle errors
    videoElement.onerror = (e) => {
      console.error("Error loading video:", e);
      alert("Failed to load video. Please try a different file (MP4 or WebM recommended).");
    };
  };

  const handleStopMovie = async () => {
    if (!movieTrackRef.current) return;

    const videoElement = movieVideoElementRef.current;
    
    // Unpublish and close movie tracks
    const tracksToUnpublish = [];
    if (movieTrackRef.current.video) tracksToUnpublish.push(movieTrackRef.current.video);
    if (movieTrackRef.current.audio) tracksToUnpublish.push(movieTrackRef.current.audio);
    
    if (tracksToUnpublish.length > 0) {
      await agoraClient.unpublish(tracksToUnpublish);
    }

    movieTrackRef.current.video?.close();
    movieTrackRef.current.audio?.close();

    movieTrackRef.current = null;
    setMainViewTrack(null);
    setIsMoviePlaying(false);
    setIsMoviePaused(true);
    setMovieProgress(0);
    setMovieTime({ current: 0, duration: 0 });
    
    if (videoElement) {
        videoElement.pause();
        videoElement.src = "";
    }

    // Re-publish user's camera
    if (localCameraTrackRef.current) {
        await agoraClient.publish([localCameraTrackRef.current]);
    }

    await sendStreamMessage({ type: 'MOVIE_STOP' });
  };

  const toggleMoviePlayback = async () => {
    if (!isHost) return;
    
    const videoElement = movieVideoElementRef.current;
    if (!videoElement) return;
    
    if (videoElement.paused) {
        await videoElement.play();
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
    videoElement.currentTime = newTime;
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
    if (!videoElement) return;
    
    videoElement.playbackRate = rate;
    setPlaybackRate(rate);
    
    await sendStreamMessage({ 
      type: 'MOVIE_SPEED', 
      rate 
    });
  };

  const toggleCamera = async () => {
    if (!localCameraTrackRef.current || connectionState !== 'CONNECTED') return;
    await localCameraTrackRef.current.setEnabled(!cameraOn);
    setCameraOn(!cameraOn);
  };
  
  const toggleMic = async () => {
    if (!localMicrophoneTrackRef.current || connectionState !== 'CONNECTED') return;
    await localMicrophoneTrackRef.current.setEnabled(!micOn);
    setMicOn(!micOn);
  };
  
  const handleLeave = async () => {
    // Clean up all tracks
    [localCameraTrackRef.current, localMicrophoneTrackRef.current].forEach(track => {
      if (track) {
        track.stop();
        track.close();
      }
    });
    
    if (movieTrackRef.current) {
      movieTrackRef.current.video?.stop();
      movieTrackRef.current.video?.close();
      movieTrackRef.current.audio?.stop();
      movieTrackRef.current.audio?.close();
    }
    
    if (agoraClient.connectionState === 'CONNECTED') {
        await agoraClient.leave();
    }
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
      <video 
        ref={movieVideoElementRef} 
        style={{ position: 'absolute', top: '-9999px', left: '-9999px', width: '1px', height: '1px' }} 
        playsInline 
        muted={false}
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
        handleMovieSelect={handleMovieSelect}
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

const StreamRoomPageWrapper = (props) => (
    <AgoraRTCProvider client={agoraClient}>
        <StreamRoomPage {...props} />
    </AgoraRTCProvider>
);

export default StreamRoomPageWrapper;