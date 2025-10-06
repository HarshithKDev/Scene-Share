import React, { useState, useEffect } from 'react';
import AgoraRTC, {
  AgoraRTCProvider,
  useRTCClient,
  useJoin,
  useRemoteUsers,
  useRemoteAudioTracks,
  LocalVideoTrack,
  RemoteUser,
  useConnectionState, // 1. Import the hook to check connection status
} from "agora-rtc-react";
import ThemeToggle from '../components/ThemeToggle';
import { UsersIcon, VideoCameraIcon, VideoCameraSlashIcon, MicrophoneIcon, MicrophoneSlashIcon, LogoutIcon } from '../components/Icons';

// --- Visual Layout Component (No Agora Logic Here) ---
const VideoLayout = ({
    isHost, user, localCameraTrack, remoteUsers,
    toggleMic, toggleCamera, micOn, cameraOn,
    handleLeave, theme, toggleTheme, isConnected // 2. Receive connection status
}) => {
    const mainUser = !isHost && remoteUsers.length > 0 ? remoteUsers[0] : null;
    const sidebarUsers = isHost ? remoteUsers : remoteUsers.slice(1);

    return (
        <div className="flex-1 relative overflow-hidden">
            <div className="w-full h-full bg-black flex items-center justify-center">
                {isHost && cameraOn && localCameraTrack ? (
                    <LocalVideoTrack track={localCameraTrack} play={true} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : mainUser ? (
                    <RemoteUser user={mainUser} playVideo={true} playAudio={true} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                    <div className="text-center text-gray-400">Waiting for host...</div>
                )}
            </div>

            <aside className="absolute top-0 right-0 h-full w-full max-w-sm bg-black/50 backdrop-blur-lg p-4 flex flex-col space-y-4 overflow-y-auto">
                <h3 className="text-white text-lg font-bold flex items-center gap-2">
                    <UsersIcon /> Participants ({1 + remoteUsers.length})
                </h3>

                <div className="relative rounded-lg overflow-hidden bg-black">
                    {cameraOn && localCameraTrack ? (
                        <LocalVideoTrack track={localCameraTrack} play={true} style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover' }} />
                    ) : (
                        <div style={{ width: '100%', aspectRatio: '16/9' }} className="flex items-center justify-center bg-gray-800 text-white">
                           <VideoCameraSlashIcon />
                        </div>
                    )}
                    <div className="absolute top-0 left-0 p-2">
                        <span className="bg-black/60 text-white text-xs px-2 py-1 rounded">{user.displayName || user.email} (You)</span>
                    </div>
                    <div className="absolute bottom-0 right-0 p-2 flex items-center gap-2">
                        {/* 3. Disable buttons until connected */}
                        <button disabled={!isConnected} onClick={toggleMic} className={`p-2 rounded-full text-white transition-colors disabled:opacity-50 ${micOn ? 'bg-black/50 hover:bg-white/20' : 'bg-red-600'}`}>
                            {micOn ? <MicrophoneIcon /> : <MicrophoneSlashIcon />}
                        </button>
                        <button disabled={!isConnected} onClick={toggleCamera} className={`p-2 rounded-full text-white transition-colors disabled:opacity-50 ${cameraOn ? 'bg-black/50 hover:bg-white/20' : 'bg-red-600'}`}>
                            {cameraOn ? <VideoCameraIcon /> : <VideoCameraSlashIcon />}
                        </button>
                    </div>
                </div>

                {sidebarUsers.map(remoteUser => (
                    <div key={remoteUser.uid} className="relative rounded-lg overflow-hidden">
                        <RemoteUser user={remoteUser} playVideo={true} style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover' }} />
                        <div className="absolute top-0 left-0 p-2">
                            <span className="bg-black/60 text-white text-xs px-2 py-1 rounded">{remoteUser.uid}</span>
                        </div>
                    </div>
                ))}
                
                <div className="flex-grow"></div>

                <div className="mt-auto flex items-center justify-center gap-4">
                    <ThemeToggle theme={theme} toggleTheme={toggleTheme} className="!bg-white/10 !border-white/20 !text-white" />
                    <button onClick={handleLeave} className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white py-2 px-4 rounded-full font-semibold hover:bg-red-700">
                        <LogoutIcon /> Leave
                    </button>
                </div>
            </aside>
        </div>
    );
};

// --- Main Component with All Agora Logic ---
const StreamRoomPage = ({ isHost, roomId, token, user, onLeaveRoom, theme, toggleTheme, appId }) => {
  const agoraClient = useRTCClient();
  const connectionState = useConnectionState(); // Get the connection state

  const [micOn, setMicOn] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  
  const [localMicrophoneTrack, setLocalMicrophoneTrack] = useState(null);
  const [localCameraTrack, setLocalCameraTrack] = useState(null);

  useJoin({ appid: appId, channel: roomId, token: token || null, uid: user.uid });
  const remoteUsers = useRemoteUsers();
  const { audioTracks } = useRemoteAudioTracks(remoteUsers);
  audioTracks.forEach((track) => track.play());

  // This effect now ONLY runs when the connection state changes to 'CONNECTED'
  useEffect(() => {
    if (connectionState === 'CONNECTED' && !localCameraTrack && !localMicrophoneTrack) {
      const initializeTracks = async () => {
        const [micTrack, camTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
        await agoraClient.publish([micTrack, camTrack]);
        setLocalMicrophoneTrack(micTrack);
        setLocalCameraTrack(camTrack);
        setMicOn(true);
        setCameraOn(true);
      };
      initializeTracks();
    }
  }, [connectionState, agoraClient, localCameraTrack, localMicrophoneTrack]);

  const toggleCamera = async () => {
    // 4. Guard the function to prevent it from running if not connected
    if (connectionState !== 'CONNECTED') return;

    if (localCameraTrack) {
      await agoraClient.unpublish([localCameraTrack]);
      localCameraTrack.stop();
      localCameraTrack.close();
      setLocalCameraTrack(null);
      setCameraOn(false);
    } else {
      const newCamTrack = await AgoraRTC.createCameraVideoTrack();
      setLocalCameraTrack(newCamTrack);
      await agoraClient.publish([newCamTrack]);
      setCameraOn(true);
    }
  };
  
  const toggleMic = async () => {
    if (connectionState !== 'CONNECTED') return;
  
    if (localMicrophoneTrack) {
      // For mics, muting is better than destroying/recreating
      await localMicrophoneTrack.setMuted(!micOn);
      setMicOn(!micOn);
    }
  };
  
  const handleLeave = async () => {
    localCameraTrack?.stop();
    localCameraTrack?.close();
    localMicrophoneTrack?.stop();
    localMicrophoneTrack?.close();
    await agoraClient.leave();
    onLeaveRoom();
  };
  
  if (!appId || !token) { /* Error handling... */ }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <VideoLayout
        isHost={isHost} user={user} localCameraTrack={localCameraTrack}
        remoteUsers={remoteUsers} toggleMic={toggleMic} toggleCamera={toggleCamera}
        micOn={micOn} cameraOn={cameraOn} handleLeave={handleLeave}
        theme={theme} toggleTheme={toggleTheme}
        isConnected={connectionState === 'CONNECTED'} // Pass connection status to UI
      />
    </div>
  );
};

const StreamRoomPageWrapper = (props) => {
    const agoraClient = AgoraRTC.createClient({ codec: "vp8", mode: "rtc" });
    return (
        <AgoraRTCProvider client={agoraClient}>
            <StreamRoomPage {...props} />
        </AgoraRTCProvider>
    );
}

export default StreamRoomPageWrapper;