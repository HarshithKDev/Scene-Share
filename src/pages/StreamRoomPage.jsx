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
  StopIcon,
  CopyIcon,
  CheckIcon
} from '../components/Icons';

// --- Visual Layout Component ---
const StreamRoomLayout = ({
  isHost, user, mainViewTrack, selfViewTrack, remoteUsers,
  toggleMic, toggleCamera, micOn, cameraOn,
  handleLeave, theme, toggleTheme, isConnected,
  handleStartStream, isMoviePlaying, roomId, handleStopMovie, hostUid, dataStreamReady
}) => {
  const [copied, setCopied] = useState(false);
  
  const roomCode = roomId;
  
  const hostUser = remoteUsers.find(u => u.uid.toString() === hostUid?.toString());
  const participantUsers = remoteUsers.filter(u => u.uid.toString() !== hostUid?.toString());
  const totalParticipants = 1 + remoteUsers.length;

  const handleCopyRoomId = () => {
    navigator.clipboard.writeText(roomCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
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
                  <LocalVideoTrack
                    track={mainViewTrack}
                    play={true}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                </div>
              );
            }
            if (!isHost && hostUser && hostUser.videoTrack) {
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
            <div
                className="text-gray-400 text-lg font-mono tracking-widest flex items-center justify-center gap-2 cursor-pointer hover:text-white p-2 bg-black/20 rounded-lg"
                onClick={handleCopyRoomId}
            >
                <span>{copied ? 'Copied!' : roomCode}</span>
                {copied ? <CheckIcon /> : <CopyIcon />}
            </div>
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

        {participantUsers.map(remoteUser => (
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
                <button 
                  onClick={handleStartStream} 
                  className={`w-full flex items-center justify-center gap-2 text-white py-2 px-4 rounded-full font-semibold transition-colors ${isConnected && dataStreamReady ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer' : 'bg-gray-500 cursor-not-allowed'}`} 
                  disabled={!isConnected || !dataStreamReady}
                >
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
  const [mainViewTrack, setMainViewTrack] = useState(null);
  const [selfViewTrack, setSelfViewTrack] = useState(null);
  const [hostUid, setHostUid] = useState(isHost ? user.uid : null);
  const [dataStreamReady, setDataStreamReady] = useState(false);

  const localMicrophoneTrackRef = useRef(null);
  const localCameraTrackRef = useRef(null);
  const movieTrackRef = useRef(null);
  const tracksInitialized = useRef(false);
  const dataStreamIdRef = useRef(null);
  
  const isHostRef = useRef(isHost);
  useEffect(() => {
    isHostRef.current = isHost;
  }, [isHost]);

  useJoin({ appid: appId, channel: roomId, token: token || null, uid: user.uid });
  const remoteUsers = useRemoteUsers();
  const { audioTracks } = useRemoteAudioTracks(remoteUsers);

  useEffect(() => {
    audioTracks.forEach((track) => {
      try { track.play(); } catch (e) { /* ignore play errors */ }
    });
  }, [audioTracks]);

  useEffect(() => {
    if (!agoraClient || connectionState !== 'CONNECTED' || dataStreamReady) {
      return;
    }

    console.log("Attempting to create data stream...");
    let mounted = true;
    const createStream = async () => {
      try {
        const streamId = await agoraClient.createDataStream({ reliable: true, ordered: true });
        if (mounted) {
          console.log("Data stream created successfully, streamId:", streamId);
          dataStreamIdRef.current = streamId;
          setDataStreamReady(true);
        }
      } catch (err) {
        console.error("Fatal: createDataStream failed", err);
      }
    };
    createStream();

    return () => { mounted = false; };
  }, [agoraClient, connectionState, dataStreamReady]);

  useEffect(() => {
    if (!agoraClient) return;

    const handleStreamMessage = (uid, msg) => {
      if (isHostRef.current || uid === user.uid) {
        return; 
      }
      
      let data = msg;
      if (msg instanceof Uint8Array) {
        try { data = new TextDecoder().decode(msg); } catch (e) { data = msg; }
      }
      try {
        const message = typeof data === 'string' ? JSON.parse(data) : data;
        
        switch (message.type) {
          case 'MOVIE_START':
            setIsMoviePlaying(true);
            if (message.hostUid) {
              setHostUid(message.hostUid);
            }
            break;
          case 'MOVIE_STOP':
            setIsMoviePlaying(false);
            setMainViewTrack(null);
            break;
          default:
            break;
        }
      } catch (error) {
        console.error("Failed to parse stream message", error);
      }
    };

    agoraClient.on('stream-message', handleStreamMessage);

    return () => {
      agoraClient.off('stream-message', handleStreamMessage);
    };
  }, [agoraClient, user.uid]);

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

  const sendStreamMessage = async (message) => {
    if (!agoraClient || !dataStreamIdRef.current || connectionState !== 'CONNECTED') {
      console.error("Cannot send message, data stream is not ready.");
      return;
    }
    try {
      const payload = JSON.stringify(message);
      await agoraClient.sendStreamMessage(dataStreamIdRef.current, payload);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleStartStream = async () => {
    if (connectionState !== 'CONNECTED' || !isHost || !agoraClient || !dataStreamReady) return;

    try {
      const displayMediaOptions = {
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 }
        },
        audio: true
      };

      const screenStream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);

      const videoTrack = screenStream.getVideoTracks()[0];
      const audioTrack = screenStream.getAudioTracks()[0];

      const screenVideoTrack = AgoraRTC.createCustomVideoTrack({ mediaStreamTrack: videoTrack });
      let screenAudioTrack = null;
      if (audioTrack) {
        screenAudioTrack = AgoraRTC.createCustomAudioTrack({ mediaStreamTrack: audioTrack });
      }

      if (localCameraTrackRef.current) {
        try { await agoraClient.unpublish(localCameraTrackRef.current); } catch (e) { /* ignore */ }
      }

      const toPublish = [screenVideoTrack];
      if (screenAudioTrack) toPublish.push(screenAudioTrack);

      await agoraClient.publish(toPublish);

      videoTrack.onended = async () => {
        await handleStopMovie();
      };

      movieTrackRef.current = { video: screenVideoTrack, audio: screenAudioTrack, rawVideoTrack: videoTrack, rawAudioTrack: audioTrack };
      setMainViewTrack(screenVideoTrack);
      setIsMoviePlaying(true);

      await sendStreamMessage({ type: 'MOVIE_START', hostUid: user.uid });
    } catch (error) {
      console.error("Error starting screen share:", error);
      setIsMoviePlaying(false);
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

    if (localCameraTrackRef.current) {
      try { await agoraClient.publish([localCameraTrackRef.current]); } catch (e) { /* ignore */ }
    }

    await sendStreamMessage({ type: 'MOVIE_STOP' });
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
        hostUid={hostUid}
        dataStreamReady={dataStreamReady}
      />
    </div>
  );
};

const StreamRoomPageWrapper = (props) => {
  const client = React.useMemo(() => AgoraRTC.createClient({ codec: "vp8", mode: "rtc" }), []);
  return (
    <AgoraRTCProvider client={client}>
      <StreamRoomPage {...props} />
    </AgoraRTCProvider>
  );
};

export default StreamRoomPageWrapper;