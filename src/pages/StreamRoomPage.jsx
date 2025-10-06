import React, { useState } from 'react';
import AgoraRTC, { AgoraRTCProvider, useRTCClient, useJoin, useRemoteUsers, usePublish, createCustomVideoTrack, AgoraVideoPlayer } from "agora-rtc-react";
import ThemeToggle from '../components/ThemeToggle';
import { UsersIcon, PlayIcon, StopIcon, UploadIcon } from '../components/Icons';

// This is the main component that handles the video logic
const VideoCall = ({ isHost, appId, roomId, token, user, onLeaveRoom }) => {
    // ... (All the state and hooks from the previous version of VideoCall remain here)
    const agoraClient = useRTCClient();
    const [isVideoEnabled, setIsVideoEnabled] = useState(false);
    const [customVideoTrack, setCustomVideoTrack] = useState(null);

    useJoin({ appid: appId, channel: roomId, token: token || null, uid: user.uid });

    const remoteUsers = useRemoteUsers();
    const { audioTracks } = useRemoteAudioTracks(remoteUsers);
    audioTracks.forEach((track) => track.play());

    usePublish(isHost && isVideoEnabled ? [customVideoTrack] : []);
  
    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (customVideoTrack) {
            customVideoTrack.stop();
            customVideoTrack.close();
        }

        try {
            const track = await createCustomVideoTrack({ source: file, optimizationMode: "motion" });
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

    const handleLeave = () => {
        if (customVideoTrack) {
            customVideoTrack.stop();
            customVideoTrack.close();
        }
        agoraClient.leave();
        onLeaveRoom();
    };

  return (
    <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto">
            <div className="flex-1 bg-[#B1D4E0] dark:bg-[#1C3F60] rounded-2xl shadow-xl overflow-hidden mb-4 transition-colors duration-300 relative">
                {/* Video Player Logic */}
                {remoteUsers.find(user => user.hasVideo) ? (
                    <AgoraVideoPlayer videoTrack={remoteUsers.find(user => user.hasVideo).videoTrack} style={{ height: '100%', width: '100%', objectFit: 'contain' }}/>
                ) : (
                    <div className="h-full flex items-center justify-center p-8 text-center text-[#1C3F60]/70 dark:text-[#AFC1D0]">
                        {isHost ? 'Select a movie file and click "Start Stream" to begin' : 'Waiting for the host to start the stream...'}
                    </div>
                )}
            </div>

            {/* Host Controls */}
            {isHost && (
                 <div className="bg-[#B1D4E0] dark:bg-[#1C3F60] rounded-2xl shadow-xl p-6 transition-colors duration-300">
                    <h3 className="text-[#1C3F60] dark:text-[#B1D4E0] text-xl font-bold mb-4">Stream Controls</h3>
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
        </div>
        
        {/* Participants Sidebar */}
        <aside className="hidden md:block w-80 bg-[#B1D4E0] dark:bg-[#1C3F60] p-6 overflow-y-auto">
            <h3 className="text-[#1C3F60] dark:text-[#B1D4E0] text-xl font-bold flex items-center gap-2 mb-4">
                <UsersIcon />
                Participants ({1 + remoteUsers.length})
            </h3>
            <div className="space-y-3">
                {/* Host */}
                <div className="bg-white/50 dark:bg-[#0B1320] rounded-lg p-4">
                    <p className="text-[#1C3F60] dark:text-[#B1D4E0] font-medium">{isHost ? `${user.displayName || user.email} (You)` : 'Host'}</p>
                    <span className="text-xs text-[#1C3F60]/80 dark:text-[#AFC1D0]">Host</span>
                </div>
                {/* Remote Users */}
                {remoteUsers.map(remoteUser => (
                     <div key={remoteUser.uid} className="bg-white/50 dark:bg-[#0B1320] rounded-lg p-4">
                        <p className="text-[#1C3F60] dark:text-[#B1D4E0] font-medium">{remoteUser.uid}</p>
                    </div>
                ))}
            </div>
             <button onClick={handleLeave} className="w-full mt-6 bg-red-500 text-white py-2 px-4 rounded-lg font-semibold hover:bg-red-600 transition-colors duration-300 shadow-lg">
                Leave Room
            </button>
        </aside>
    </div>
  );
};

// Main page component wrapper
const StreamRoomPage = ({ isHost, roomId, token, user, onLeaveRoom, theme, toggleTheme, appId }) => {
  const agoraClient = AgoraRTC.createClient({ codec: "vp8", mode: "rtc" });

  if (!appId || !token) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0B1320] flex items-center justify-center">
        <div className="text-center p-4">
            <h2 className="text-2xl font-bold text-red-500 mb-4">Configuration Error</h2>
            <p className="text-gray-400 mb-6">Could not connect to the streaming service. Please check your Agora credentials and ensure the backend is running.</p>
            <button onClick={onLeaveRoom} className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">Go Back to Lobby</button>
        </div>
      </div>
    );
  }

  return (
    <AgoraRTCProvider client={agoraClient}>
      <div className="min-h-screen bg-white dark:bg-[#0B1320] transition-colors duration-300 flex flex-col">
        <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
        <VideoCall appId={appId} roomId={roomId} token={token} user={user} isHost={isHost} onLeaveRoom={onLeaveRoom} />
      </div>
    </AgoraRTCProvider>
  );
};

export default StreamRoomPage;