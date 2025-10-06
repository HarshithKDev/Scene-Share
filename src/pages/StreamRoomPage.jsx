import React, { useState, useRef } from 'react';
import AgoraRTC, { AgoraRTCProvider, useRTCClient, useJoin, useRemoteUsers, usePublish, RemoteUser, useRemoteAudioTracks } from "agora-rtc-react";
import ThemeToggle from '../components/ThemeToggle';
import { UsersIcon, PlayIcon, StopIcon, UploadIcon } from '../components/Icons';

const VideoCall = ({ isHost, appId, roomId, token, user, onLeaveRoom }) => {
    const agoraClient = useRTCClient();
    const [isVideoEnabled, setIsVideoEnabled] = useState(false);
    const [customVideoTrack, setCustomVideoTrack] = useState(null);
    const videoRef = useRef(null); // Ref for our hidden video element

    useJoin({ appid: appId, channel: roomId, token: token || null, uid: user.uid });

    const remoteUsers = useRemoteUsers();
    const { audioTracks } = useRemoteAudioTracks(remoteUsers);
    audioTracks.forEach((track) => track.play());

    usePublish(isHost && isVideoEnabled ? [customVideoTrack] : []);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file || !videoRef.current) return;

        // Create an object URL for the selected file
        const objectURL = URL.createObjectURL(file);
        videoRef.current.src = objectURL;
        videoRef.current.muted = true; // Mute the video to avoid sound
        videoRef.current.playsInline = true; // Important for iOS
        videoRef.current.style.display = 'none'; // Ensure it's hidden

        // When the video is ready to be played, create the Agora track
        videoRef.current.oncanplay = async () => {
            // Play the video element before creating the track
            await videoRef.current.play();

            if (customVideoTrack) {
                customVideoTrack.stop();
                customVideoTrack.close();
            }

            try {
                // Create the track from the video element
                const track = await AgoraRTC.createCustomVideoTrack({ 
                    source: videoRef.current, 
                    optimizationMode: "motion" 
                });

                track.on("track-ended", () => {
                  setIsVideoEnabled(false);
                  setCustomVideoTrack(null);
                });

                setCustomVideoTrack(track);
                console.log("Custom video track created from file:", file.name);
            } catch (error) {
                console.error("Failed to create custom video track:", error);
            }
        };
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
        {/* Hidden video element for processing the file */}
        <video ref={videoRef} playsInline style={{ display: 'none' }} />

        <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto">
            <div className="flex-1 bg-gray-100 dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden mb-4 transition-colors duration-300 relative border border-gray-200 dark:border-gray-800">
                {remoteUsers.map(user => (
                  <div key={user.uid} className="h-full">
                    <RemoteUser user={user} style={{ height: '100%', width: '100%', objectFit: 'contain' }} />
                  </div>
                ))}
                {remoteUsers.length === 0 && (
                    <div className="h-full flex items-center justify-center p-8 text-center text-gray-600 dark:text-gray-400">
                        {isHost ? 'Select a movie file and click "Start Stream" to begin' : 'Waiting for the host to start the stream...'}
                    </div>
                )}
            </div>

            {isHost && (
                 <div className="bg-gray-100 dark:bg-gray-900 rounded-2xl shadow-xl p-6 transition-colors duration-300 border border-gray-200 dark:border-gray-800">
                    <h3 className="text-gray-900 dark:text-white text-xl font-bold mb-4">Stream Controls</h3>
                    <div className="flex flex-wrap gap-4">
                        <label className="flex-1 min-w-[200px]">
                            <input type="file" accept="video/*" onChange={handleFileSelect} className="hidden" />
                            <span className="flex items-center justify-center gap-2 w-full bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors duration-300 cursor-pointer shadow-lg border border-gray-300 dark:border-gray-700">
                                <UploadIcon />
                                {customVideoTrack ? 'Change Movie' : 'Select Movie'}
                            </span>
                        </label>
                        {!isVideoEnabled ? (
                            <button onClick={handleStartStream} disabled={!customVideoTrack} className="flex-1 min-w-[200px] flex items-center justify-center gap-2 bg-black dark:bg-white text-white dark:text-black py-3 px-6 rounded-lg font-semibold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg">
                                <PlayIcon /> Start Stream
                            </button>
                        ) : (
                            <button onClick={handleEndStream} className="flex-1 min-w-[200px] flex items-center justify-center gap-2 bg-red-600 dark:bg-red-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-red-700 dark:hover:bg-red-600 transition-colors duration-300 shadow-lg">
                                <StopIcon /> End Stream
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
        
        <aside className="hidden md:block w-80 bg-gray-100 dark:bg-gray-900 p-6 overflow-y-auto border-l border-gray-200 dark:border-gray-800">
            <h3 className="text-gray-900 dark:text-white text-xl font-bold flex items-center gap-2 mb-4">
                <UsersIcon />
                Participants ({1 + remoteUsers.length})
            </h3>
            <div className="space-y-3">
                <div className="bg-white dark:bg-black rounded-lg p-4 border border-gray-200 dark:border-gray-800">
                    <p className="text-gray-900 dark:text-white font-medium">{isHost ? `${user.displayName || user.email} (You)` : 'Host'}</p>
                    <span className="text-xs text-gray-600 dark:text-gray-400">Host</span>
                </div>
                {remoteUsers.map(remoteUser => (
                     <div key={remoteUser.uid} className="bg-white dark:bg-black rounded-lg p-4 border border-gray-200 dark:border-gray-800">
                        <p className="text-gray-900 dark:text-white font-medium">{remoteUser.uid}</p>
                    </div>
                ))}
            </div>
             <button onClick={handleLeave} className="w-full mt-6 bg-red-600 dark:bg-red-500 text-white py-2 px-4 rounded-lg font-semibold hover:bg-red-700 dark:hover:bg-red-600 transition-colors duration-300 shadow-lg">
                Leave Room
            </button>
        </aside>
    </div>
  );
};

const StreamRoomPage = ({ isHost, roomId, token, user, onLeaveRoom, theme, toggleTheme, appId }) => {
  const agoraClient = AgoraRTC.createClient({ codec: "vp8", mode: "rtc" });

  if (!appId || !token) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="text-center p-4">
            <h2 className="text-2xl font-bold text-red-500 mb-4">Configuration Error</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Could not connect to the streaming service. Please check your Agora credentials and ensure the backend is running.</p>
            <button onClick={onLeaveRoom} className="px-6 py-2 bg-gray-800 dark:bg-gray-700 text-white rounded hover:bg-gray-900 dark:hover:bg-gray-600">Go Back to Lobby</button>
        </div>
      </div>
    );
  }

  return (
    <AgoraRTCProvider client={agoraClient}>
      <div className="min-h-screen bg-white dark:bg-black transition-colors duration-300 flex flex-col">
        <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
        <VideoCall appId={appId} roomId={roomId} token={token} user={user} isHost={isHost} onLeaveRoom={onLeaveRoom} />
      </div>
    </AgoraRTCProvider>
  );
};

export default StreamRoomPage;