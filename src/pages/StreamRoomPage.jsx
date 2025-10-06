import React, { useState } from 'react';
import AgoraRTC, { AgoraRTCProvider, useRTCClient, useJoin, useRemoteUsers, usePublish, createCustomVideoTrack, AgoraVideoPlayer } from "agora-rtc-react";
import ThemeToggle from '../components/ThemeToggle';
import { UsersIcon, PlayIcon, StopIcon, UploadIcon } from '../components/Icons';

// This is the main component that handles the video logic
const VideoCall = ({ isHost, appId, roomId, token, user }) => {
  const agoraClient = useRTCClient();
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [customVideoTrack, setCustomVideoTrack] = useState(null);

  // Join the channel
  useJoin({ appid: appId, channel: roomId, token: token || null, uid: user.uid });

  // Publish the custom track for the host
  usePublish(isHost && isVideoEnabled ? [customVideoTrack] : []);

  // Get remote users and subscribe to their audio
  const remoteUsers = useRemoteUsers();
  const { audioTracks } = useRemoteAudioTracks(remoteUsers);
  audioTracks.forEach((track) => track.play());

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // If there's an old track, stop it first
    if (customVideoTrack) {
      customVideoTrack.stop();
      customVideoTrack.close();
    }

    try {
      const track = await createCustomVideoTrack({
        source: file,
        optimizationMode: "motion"
      });
      setCustomVideoTrack(track);
      console.log("Custom video track created from file:", file.name);
    } catch (error) {
      console.error("Failed to create custom video track:", error);
    }
  };

  const handleStartStream = () => {
    if (customVideoTrack) {
      setIsVideoEnabled(true);
    }
  };

  const handleEndStream = () => {
    setIsVideoEnabled(false);
  };

  return (
    <>
      <div className="flex-1 bg-[#B1D4E0] dark:bg-[#1C3F60] rounded-2xl shadow-xl overflow-hidden mb-4 transition-colors duration-300 relative">
        {/* Render the first remote user with video */}
        {remoteUsers.find(user => user.hasVideo) ? (
          <AgoraVideoPlayer
            videoTrack={remoteUsers.find(user => user.hasVideo).videoTrack}
            style={{ height: '100%', width: '100%', objectFit: 'contain' }}
          />
        ) : (
          <div className="h-full flex items-center justify-center p-8 text-center text-[#1C3F60]/70 dark:text-[#AFC1D0]">
            {isHost ? 'Select a movie file and click "Start Stream" to begin' : 'Waiting for the host to start the stream...'}
          </div>
        )}
      </div>

      {isHost && (
        <div className="bg-[#B1D4E0] dark:bg-[#1C3F60] rounded-2xl shadow-xl p-6 transition-colors duration-300">
          <h3 className="text-[#1C3F60] dark:text-[#B1D4E0] text-xl font-bold mb-4">
            Stream Controls
          </h3>
          <div className="flex flex-wrap gap-4">
            <label className="flex-1 min-w-[200px]">
              <input type="file" accept="video/*" onChange={handleFileSelect} className="hidden" />
              <span className="flex items-center justify-center gap-2 w-full bg-white/50 dark:bg-[#AFC1D0] text-[#1C3F60] py-3 px-6 rounded-lg font-semibold hover:bg-white dark:hover:bg-[#B1D4E0] transition-colors duration-300 cursor-pointer shadow-lg">
                <UploadIcon />
                {customVideoTrack ? 'Change Movie' : 'Select Movie'}
              </span>
            </label>
            {!isVideoEnabled ? (
              <button onClick={handleStartStream} disabled={!customVideoTrack} className="flex-1 min-w-[200px] flex items-center justify-center gap-2 bg-[#1C3F60] dark:bg-[#B1D4E0] text-[#B1D4E0] dark:text-[#1C3F60] py-3 px-6 rounded-lg font-semibold hover:bg-[#0B1320] dark:hover:bg-[#AFC1D0] transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg">
                <PlayIcon /> Start Stream
              </button>
            ) : (
              <button onClick={handleEndStream} className="flex-1 min-w-[200px] flex items-center justify-center gap-2 bg-red-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-red-600 transition-colors duration-300 shadow-lg">
                <StopIcon /> End Stream
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};

// This is the main page component
const StreamRoomPage = ({ isHost, roomId, token, user, onLeaveRoom, theme, toggleTheme, appId }) => {
  // Create an Agora client instance
  const agoraClient = AgoraRTC.createClient({ codec: "vp8", mode: "rtc" });

  if (!appId || !token) {
    // ... Error display remains the same
  }

  return (
    // Wrap the component that uses Agora hooks with AgoraRTCProvider
    <AgoraRTCProvider client={agoraClient}>
      <div className="min-h-screen bg-white dark:bg-[#0B1320] transition-colors duration-300 flex flex-col">
        <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
        <header className="bg-[#B1D4E0] dark:bg-[#1C3F60] shadow-lg py-4 px-6 transition-colors duration-300">
          <div className="container mx-auto flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-[#1C3F60] dark:text-[#B1D4E0]">Scene-Share</h1>
              <p className="text-[#1C3F60]/80 dark:text-[#AFC1D0] text-sm">Room: {roomId}</p>
            </div>
            <button onClick={onLeaveRoom} className="bg-red-500 text-white py-2 px-4 rounded-lg font-semibold hover:bg-red-600 transition-colors duration-300 shadow-lg">
              Leave Room
            </button>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden p-4 md:p-6">
          <div className="flex-1 flex flex-col overflow-y-auto">
            <VideoCall appId={appId} roomId={roomId} token={token} user={user} isHost={isHost} />
          </div>
        </div>
      </div>
    </AgoraRTCProvider>
  );
};

export default StreamRoomPage;