// src/pages/StreamRoomPage.jsx
import React, { useCallback } from 'react';
import StreamRoomLayout from './StreamRoomLayout';
import { useStreamRoomHooks } from './useStreamRoomHooks';
import { useAuth } from '../context/AuthContext';
import { fetchAgoraToken } from '../services/agoraApi';

// --- FIX: Accept the client prop ---
const StreamRoomPage = ({ isHost, roomId, token, onLeaveRoom, appId, client }) => {
  const { user } = useAuth();

  const agoraTokenFetcher = useCallback((channel, uid) => {
      return fetchAgoraToken(channel, uid, () => user.getIdToken());
  }, [user]);

  const {
    micOn,
    cameraOn,
    isMoviePlaying,
    selfViewTrack,
    hostScreenUser,
    connectionError,
    joinAttempts,
    connectionState,
    remoteUsers,
    screenShareError,
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
    client, // Pass the client to the hook
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
        connectionState={connectionState}
        handleStartStream={handleStartStream}
        isMoviePlaying={isMoviePlaying}
        roomId={roomId}
        handleStopMovie={handleStopMovie}
        hostScreenUser={hostScreenUser}
        screenShareError={screenShareError}
        activeSpeakerUid={activeSpeakerUid}
      />
    </div>
  );
};

export default StreamRoomPage;