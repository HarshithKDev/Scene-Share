import React, { useState } from 'react';
import ThemeToggle from '../components/ThemeToggle';
import { UsersIcon, PlayIcon, StopIcon, UploadIcon } from '../components/Icons';

const StreamRoomPage = ({ isHost, roomId, onLeaveRoom, theme, toggleTheme }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);

  const participants = [
    { name: isHost ? 'Host (You)' : 'Host', isHost: true },
    { name: isHost ? 'Guest 1' : 'You', isHost: false },
    { name: 'Guest 2', isHost: false },
  ];

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log('File selected:', file.name);
      setSelectedFile(file);
    }
  };

  const handleStartStream = () => {
    console.log('Start stream action triggered');
    setIsStreaming(true);
  };

  const handleEndStream = () => {
    console.log('End stream action triggered');
    setIsStreaming(false);
    setSelectedFile(null);
  };

  const handleLeaveRoom = () => {
    console.log('Leave room action triggered');
    onLeaveRoom();
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0B1320] transition-colors duration-300 flex flex-col">
      <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
      
      <header className="bg-[#B1D4E0] dark:bg-[#1C3F60] shadow-lg py-4 px-6 transition-colors duration-300">
        <div className="container mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-[#1C3F60] dark:text-[#B1D4E0]">
              Scene-Share
            </h1>
            <p className="text-[#1C3F60]/80 dark:text-[#AFC1D0] text-sm">
              Room: {roomId}
            </p>
          </div>
          <button
            onClick={() => setShowParticipants(!showParticipants)}
            className="md:hidden p-2 bg-[#1C3F60] dark:bg-[#B1D4E0] text-[#B1D4E0] dark:text-[#1C3F60] rounded-lg"
          >
            <UsersIcon />
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto">
          <div className="flex-1 bg-[#B1D4E0] dark:bg-[#1C3F60] rounded-2xl shadow-xl overflow-hidden mb-4 transition-colors duration-300">
            <div className="h-full flex items-center justify-center p-8">
              {/* This is the placeholder for the video player */}
              <div className="text-center text-[#1C3F60] dark:text-[#AFC1D0]">
                  Waiting for stream...
              </div>
            </div>
          </div>

          {isHost && (
            <div className="bg-[#B1D4E0] dark:bg-[#1C3F60] rounded-2xl shadow-xl p-6 transition-colors duration-300">
              <h3 className="text-[#1C3F60] dark:text-[#B1D4E0] text-xl font-bold mb-4">
                Stream Controls
              </h3>
              <div className="flex flex-wrap gap-4">
                <label className="flex-1 min-w-[200px]">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <span className="flex items-center justify-center gap-2 w-full bg-white/50 dark:bg-[#AFC1D0] text-[#1C3F60] dark:text-[#1C3F60] py-3 px-6 rounded-lg font-semibold hover:bg-white dark:hover:bg-[#B1D4E0] transition-colors duration-300 cursor-pointer shadow-lg">
                    <UploadIcon />
                    {selectedFile ? 'Change Movie' : 'Select Movie'}
                  </span>
                </label>

                {!isStreaming ? (
                  <button
                    onClick={handleStartStream}
                    disabled={!selectedFile}
                    className="flex-1 min-w-[200px] flex items-center justify-center gap-2 bg-[#1C3F60] dark:bg-[#B1D4E0] text-[#B1D4E0] dark:text-[#1C3F60] py-3 px-6 rounded-lg font-semibold hover:bg-[#0B1320] dark:hover:bg-[#AFC1D0] transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                    <PlayIcon />
                    Start Stream
                  </button>
                ) : (
                  <button
                    onClick={handleEndStream}
                    className="flex-1 min-w-[200px] flex items-center justify-center gap-2 bg-red-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-red-600 transition-colors duration-300 shadow-lg"
                  >
                    <StopIcon />
                    End Stream
                  </button>
                )}
              </div>
            </div>
          )}

          {!isHost && (
            <div className="flex justify-center mt-4">
              <button
                onClick={handleLeaveRoom}
                className="bg-red-500 text-white py-3 px-8 rounded-lg font-semibold hover:bg-red-600 transition-colors duration-300 shadow-lg"
              >
                Leave Room
              </button>
            </div>
          )}
        </div>

        {/* Participants Sidebar */}
        <aside
          className={`${
            showParticipants ? 'fixed inset-0 z-40 bg-black bg-opacity-50 md:relative md:bg-transparent' : 'hidden'
          } md:block md:w-80 transition-all duration-300`}
          onClick={() => setShowParticipants(false)}
        >
          <div
            className={`${
              showParticipants ? 'translate-x-0' : 'translate-x-full'
            } md:translate-x-0 fixed right-0 top-0 h-full w-80 bg-[#B1D4E0] dark:bg-[#1C3F60] md:relative md:h-auto transition-transform duration-300 shadow-xl p-6 overflow-y-auto`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[#1C3F60] dark:text-[#B1D4E0] text-xl font-bold flex items-center gap-2">
                <UsersIcon />
                Participants
              </h3>
              <button
                onClick={() => setShowParticipants(false)}
                className="md:hidden text-[#1C3F60]/80 dark:text-[#AFC1D0] hover:text-[#0B1320] dark:hover:text-[#B1D4E0]"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              {participants.map((participant, index) => (
                <div
                  key={index}
                  className="bg-white/50 dark:bg-[#0B1320] rounded-lg p-4 transition-colors duration-300"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#1C3F60] dark:bg-[#B1D4E0] rounded-full flex items-center justify-center text-[#B1D4E0] dark:text-[#1C3F60] font-bold">
                      {participant.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-[#1C3F60] dark:text-[#B1D4E0] font-medium">
                        {participant.name}
                      </p>
                      {participant.isHost && (
                        <span className="text-xs text-[#1C3F60]/80 dark:text-[#AFC1D0]">
                          Host
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default StreamRoomPage;