import React from 'react';

const StreamRoomError = ({ connectionError, joinAttempts, handleLeave }) => {
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
};

export default StreamRoomError;