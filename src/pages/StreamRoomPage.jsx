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
import { UsersIcon, VideoCameraIcon, VideoCameraSlashIcon, MicrophoneIcon, MicrophoneSlashIcon, LogoutIcon, UploadIcon, PlayIcon, PauseIcon } from '../components/Icons';

// --- Agora Client Initialization (Moved outside the component) ---
const agoraClient = AgoraRTC.createClient({ codec: "vp8", mode: "rtc" });

// --- Movie Controls Component ---
const MovieControls = ({ onPlayPause, onSeek, onSpeedChange, isPaused, progress, currentTime, duration, playbackRate }) => {
    const formatTime = (timeInSeconds) => {
        if (isNaN(timeInSeconds) || timeInSeconds === 0) return '0:00';
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = Math.floor(timeInSeconds % 60).toString().padStart(2, '0');
        return `${minutes}:${seconds}`;
    };

    return (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white flex items-center gap-4">
            <button onClick={onPlayPause} className="p-2">
                {isPaused ? <PlayIcon /> : <PauseIcon />}
            </button>
            <span className="text-sm font-mono">{formatTime(currentTime)}</span>
            <input
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={onSeek}
                className="flex-1 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-sm font-mono">{formatTime(duration)}</span>
            <div className="flex items-center gap-2">
                {[1, 1.5, 2].map(rate => (
                    <button 
                        key={rate} 
                        onClick={() => onSpeedChange(rate)} 
                        className={`px-2 py-1 text-xs rounded ${playbackRate === rate ? 'bg-white text-black' : 'bg-white/20'}`}
                    >
                        {rate}x
                    </button>
                ))}
            </div>
        </div>
    );
};

// --- Visual Layout Component ---
const StreamRoomLayout = ({
    isHost, user, mainViewTrack, selfViewTrack, remoteUsers,
    toggleMic, toggleCamera, micOn, cameraOn,
    handleLeave, theme, toggleTheme, isConnected,
    handleMovieSelect, isMoviePlaying, movieProps
}) => {
    const mainParticipant = !isHost && remoteUsers.length > 0 ? remoteUsers[0] : null;

    return (
        <div className="flex flex-row h-screen">
            <main className="flex-1 bg-black flex items-center justify-center relative">
                {isHost && mainViewTrack ? (
                    <LocalVideoTrack track={mainViewTrack} play={true} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : mainParticipant ? (
                    <RemoteUser user={mainParticipant} playVideo={true} playAudio={true} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                    <div className="text-center text-gray-400 p-4">
                        {isHost ? 'Choose a movie to start sharing' : 'Waiting for the host to start the movie...'}
                    </div>
                )}
                {isHost && isMoviePlaying && (
                    <MovieControls {...movieProps} />
                )}
            </main>

            <aside className="w-full max-w-sm bg-gray-900/80 backdrop-blur-lg p-4 flex flex-col space-y-4 overflow-y-auto">
                <h3 className="text-white text-lg font-bold flex items-center gap-2 shrink-0"><UsersIcon /> Participants ({1 + remoteUsers.length})</h3>
                <div className="relative rounded-lg overflow-hidden bg-black shrink-0">
                    {cameraOn && selfViewTrack ? (
                        <LocalVideoTrack track={selfViewTrack} play={true} style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover' }} />
                    ) : (
                        <div style={{ width: '100%', aspectRatio: '16/9' }} className="flex items-center justify-center bg-gray-800 text-white"><VideoCameraSlashIcon /></div>
                    )}
                    <div className="absolute top-0 left-0 p-2"><span className="bg-black/60 text-white text-xs px-2 py-1 rounded">{user.displayName || user.email} (You)</span></div>
                    <div className="absolute bottom-0 right-0 p-2 flex items-center gap-2">
                        <button disabled={!isConnected} onClick={toggleMic} className={`p-2 rounded-full text-white transition-colors disabled:opacity-50 ${micOn ? 'bg-black/50 hover:bg-white/20' : 'bg-red-600'}`}>{micOn ? <MicrophoneIcon /> : <MicrophoneSlashIcon />}</button>
                        <button disabled={!isConnected} onClick={toggleCamera} className={`p-2 rounded-full text-white transition-colors disabled:opacity-50 ${cameraOn ? 'bg-black/50 hover:bg-white/20' : 'bg-red-600'}`}>{cameraOn ? <VideoCameraIcon /> : <VideoCameraSlashIcon />}</button>
                    </div>
                </div>

                {remoteUsers.map(remoteUser => (
                    <div key={remoteUser.uid} className="relative rounded-lg overflow-hidden shrink-0">
                        <RemoteUser user={remoteUser} playVideo={true} style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover' }} />
                        <div className="absolute top-0 left-0 p-2"><span className="bg-black/60 text-white text-xs px-2 py-1 rounded">{remoteUser.uid}</span></div>
                    </div>
                ))}
                
                <div className="flex-grow"></div>

                <div className="mt-auto shrink-0">
                    {isHost && (
                        <div className="mb-4">
                            <label htmlFor="movie-upload" className={`w-full flex items-center justify-center gap-2 text-white py-2 px-4 rounded-full font-semibold transition-colors ${isConnected ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer' : 'bg-gray-500 cursor-not-allowed'}`}><UploadIcon /> Choose Movie</label>
                            <input id="movie-upload" type="file" accept="video/mp4,video/webm" onChange={handleMovieSelect} className="hidden" disabled={!isConnected} />
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

  useJoin({ appid: appId, channel: roomId, token: token || null, uid: user.uid });
  const remoteUsers = useRemoteUsers();
  const { audioTracks } = useRemoteAudioTracks(remoteUsers);
  audioTracks.forEach((track) => track.play());

  useEffect(() => {
    if (connectionState === 'CONNECTED' && !tracksInitialized.current) {
      tracksInitialized.current = true;
      const initializeTracks = async () => {
        try {
          const [micTrack, camTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
          localMicrophoneTrackRef.current = micTrack;
          localCameraTrackRef.current = camTrack;
          
          if (isHost) {
            setSelfViewTrack(camTrack);
            setMainViewTrack(null);
          } else {
            setSelfViewTrack(camTrack);
          }

          if (agoraClient.connectionState === 'CONNECTED') {
            await agoraClient.publish([micTrack, camTrack]);
            setMicOn(true);
            setCameraOn(true);
          }
        } catch (error) { console.error("Error initializing tracks:", error); }
      };
      initializeTracks();
    }
  }, [connectionState, agoraClient, isHost]);

  useEffect(() => {
    const videoElement = movieVideoElementRef.current;
    if (!videoElement) return;

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
  }, []);

  const handleMovieSelect = async (e) => {
    if (connectionState !== 'CONNECTED') return;
    const file = e.target.files[0];
    if (!file || !movieVideoElementRef.current) return;
    setIsMoviePlaying(true);
    setIsMoviePaused(false);

    const movieUrl = URL.createObjectURL(file);
    const videoElement = movieVideoElementRef.current;
    videoElement.src = movieUrl;
    
    videoElement.oncanplay = async () => {
      try {
        videoElement.play();
        const stream = videoElement.captureStream();
        const [videoTrack, audioTrack] = [stream.getVideoTracks()[0], stream.getAudioTracks()[0]];

        const customMovieVideoTrack = AgoraRTC.createCustomVideoTrack({ mediaStreamTrack: videoTrack });
        const customMovieAudioTrack = audioTrack ? AgoraRTC.createCustomAudioTrack({ mediaStreamTrack: audioTrack }) : null;

        if (localCameraTrackRef.current) await agoraClient.unpublish(localCameraTrackRef.current);
        if (localMicrophoneTrackRef.current) await agoraClient.unpublish(localMicrophoneTrackRef.current);

        const tracksToPublish = [customMovieVideoTrack];
        if (customMovieAudioTrack) tracksToPublish.push(customMovieAudioTrack);
        
        await agoraClient.publish(tracksToPublish);

        movieTrackRef.current = { video: customMovieVideoTrack, audio: customMovieAudioTrack };
        setMainViewTrack(customMovieVideoTrack);
      } catch (error) { console.error("Error publishing movie track:", error); }
    };
  };

  const toggleMoviePlayback = () => {
    if (!movieVideoElementRef.current) return;
    if (movieVideoElementRef.current.paused) {
      movieVideoElementRef.current.play();
      setIsMoviePaused(false);
    } else {
      movieVideoElementRef.current.pause();
      setIsMoviePaused(true);
    }
  };

  const handleSeek = (e) => {
    if (!movieVideoElementRef.current || isNaN(movieVideoElementRef.current.duration)) return;
    const newTime = (e.target.value / 100) * movieVideoElementRef.current.duration;
    movieVideoElementRef.current.currentTime = newTime;
    setMovieProgress(e.target.value);
  };

  const handleSpeedChange = (rate) => {
    if (!movieVideoElementRef.current) return;
    movieVideoElementRef.current.playbackRate = rate;
    setPlaybackRate(rate);
  };

  const toggleCamera = async () => {
    if (!localCameraTrackRef.current || connectionState !== 'CONNECTED') return;
    
    try {
      // This will now correctly toggle the self-view camera on and off
      // regardless of whether a movie is playing.
      await localCameraTrackRef.current.setEnabled(!cameraOn);
      setCameraOn(!cameraOn);
    } catch (error) { 
        console.error("Error toggling camera:", error); 
    }
  };
  
  const toggleMic = async () => {
    if (localMicrophoneTrackRef.current) {
      await localMicrophoneTrackRef.current.setMuted(!micOn);
      setMicOn(!micOn);
    }
  };
  
  const handleLeave = async () => {
    // Stop and close all tracks before leaving
    [localCameraTrackRef.current, movieTrackRef.current?.video, movieTrackRef.current?.audio, localMicrophoneTrackRef.current].forEach(track => {
      if (track) {
        track.stop();
        track.close();
      }
    });
    if(agoraClient.connectionState === 'CONNECTED') {
        await agoraClient.leave();
    }
    onLeaveRoom();
  };
  
  if (!appId || !token) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Error: App ID or token is missing.</div>;

  return (
    <div className="min-h-screen bg-black">
      <video ref={movieVideoElementRef} style={{ position: 'absolute', top: '-9999px', left: '-9999px', width: '1px', height: '1px' }} playsInline muted />
      <StreamRoomLayout {...{isHost, user, mainViewTrack, selfViewTrack, remoteUsers, toggleMic, toggleCamera, micOn, cameraOn, handleLeave, theme, toggleTheme, isConnected: connectionState === 'CONNECTED', handleMovieSelect, isMoviePlaying, movieProps: { onPlayPause: toggleMoviePlayback, onSeek: handleSeek, onSpeedChange: handleSpeedChange, isPaused: isMoviePaused, progress: movieProgress, currentTime: movieTime.current, duration: movieTime.duration, playbackRate }}} />
    </div>
  );
};

const StreamRoomPageWrapper = (props) => (
    <AgoraRTCProvider client={agoraClient}>
        <StreamRoomPage {...props} />
    </AgoraRTCProvider>
);

export default StreamRoomPageWrapper;