// src/pages/StreamRoomPage.jsx
import React, { useCallback, useMemo } from 'react';
import { AgoraRTCProvider } from "agora-rtc-react";
import AgoraRTC from "agora-rtc-sdk-ng";
import StreamRoomLayout from './StreamRoomLayout';
import { useStreamRoomHooks } from './useStreamRoomHooks';
import { useAuth } from '../context/AuthContext';
import { fetchAgoraToken } from '../services/agoraApi';

const StreamRoomPage = ({ isHost, roomId, token, onLeaveRoom, appId }) => {
  const { user } = useAuth();

  const agoraTokenFetcher = useCallback((channel, uid) => {
      return fetchAgoraToken(channel, uid, () => user.getIdToken());
  }, [user]);


  const {
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
    activeSpeakerUid
  } = useStreamRoomHooks({
    isHost,
    roomId,
    token,
    user,
    appId,
    fetchAgoraToken: agoraTokenFetcher,
  });

  const handleLeave = useCallback(async () => {
    try {
      if (isMoviePlaying) {
        await handleStopMovie();
      }

      if (localMicrophoneTrackRef.current) {
        localMicrophoneTrackRef.current.stop();
        localMicrophoneTrackRef.current.close();
      }
      if (localCameraTrackRef.current) {
        localCameraTrackRef.current.stop();
        localCameraTrackRef.current.close();
      }

    } catch (error) {
      console.error("Error during leave:", error);
    } finally {
      onLeaveRoom();
    }
  }, [isMoviePlaying, handleStopMovie, localMicrophoneTrackRef, localCameraTrackRef, onLeaveRoom]);

  if (connectionError && connectionState !== 'CONNECTED') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="text-center max-w-md p-6">
          <div className="text-red-500 text-xl mb-4">Connection Failed</div>
          <div className="mb-4 bg-gray-800 p-4 rounded text-left">
            <div className="text-sm font-mono break-all">{connectionError}</div>
          </div>
          <div className="flex gap-4 justify-center">
            <button
              onClick={handleLeave}
              className="bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
            >
              Return to Lobby
            </button>
            {joinAttempts < 3 && (
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
              >
                Retry Connection
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // The wrapper in the original file is not needed here as it's handled in Room.jsx
  // This component now assumes it's rendered within an AgoraRTCProvider
  return (
    <div className="min-h-screen bg-black">
      <StreamRoomLayout
        isHost={isHost}
        selfViewTrack={selfViewTrack}
        remoteUsers={remoteUsers}
        toggleMic={toggleMic}
        toggleCamera={toggleCamera}
        micOn={micOn}
        cameraOn={cameraOn}
        handleLeave={handleLeave}
        connectionState={connectionState} // <-- PASS PROP TO LAYOUT
        handleStartStream={handleStartStream}
        isMoviePlaying={isMoviePlaying}
        roomId={roomId}
        handleStopMovie={handleStopMovie}
        hostUid={isHost ? user.uid : null}
        dataStreamReady={dataStreamReady || connectionState === 'CONNECTED'}
        hostScreenUser={hostScreenUser}
        hostCameraUser={hostCameraUser}
        connectionError={connectionError}
        screenVideoTrack={screenVideoTrack}
        screenShareError={screenShareError}
        setScreenShareError={setScreenShareError}
        activeSpeakerUid={activeSpeakerUid}
      />
    </div>
  );
};


export default StreamRoomPage;