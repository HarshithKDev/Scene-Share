// src/components/routes/Room.jsx
import React, { useState, useEffect, useCallback, lazy } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { fetchAgoraToken } from '../../services/agoraApi';

const StreamRoomPageWrapper = lazy(() => import('../../pages/StreamRoomPage'));

const Room = () => {
    const { roomId } = useParams();
    const { state } = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { theme, toggleTheme } = useTheme();

    const [agoraToken, setAgoraToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const isHost = state?.isHost || false;

    const getToken = useCallback(async () => {
        if (user && roomId) {
            setLoading(true);
            setError(null);
            try {
                const token = await fetchAgoraToken(roomId, user.uid, () => user.getIdToken());
                setAgoraToken(token);
            } catch (err) {
                console.error('Token fetch error:', err);
                setError(`Failed to join room: ${err.message}`);
            } finally {
                setLoading(false);
            }
        }
    }, [roomId, user]);

    useEffect(() => {
        getToken();
    }, [getToken]);

    const handleLeaveRoom = () => navigate('/');

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center text-white">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <p>Joining room {roomId}...</p>
                    <p className="text-sm text-gray-400 mt-2">Authenticating and getting token</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center text-white">
                <div className="text-center max-w-md p-6">
                    <h2 className="text-red-500 text-xl mb-4">Connection Error</h2>
                    <div className="mb-4 bg-gray-800 p-4 rounded text-left">
                        <p className="text-sm font-mono break-all">{error}</p>
                    </div>
                    <div className="flex gap-4 justify-center">
                        <button onClick={handleLeaveRoom} className="bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700">
                            Return to Lobby
                        </button>
                        <button onClick={getToken} className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }
    
    return agoraToken ? (
        <StreamRoomPageWrapper
            key={`${user.uid}-${roomId}`}
            isHost={isHost}
            roomId={roomId}
            token={agoraToken}
            onLeaveRoom={handleLeaveRoom}
            appId={import.meta.env.VITE_AGORA_APP_ID}
        />
    ) : null;
};

export default Room;