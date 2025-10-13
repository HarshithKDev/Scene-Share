// src/components/routes/Room.jsx
import React, { useState, useEffect, useCallback, lazy, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { fetchAgoraToken } from '../../services/agoraApi';
import { AgoraRTCProvider } from "agora-rtc-react";
import AgoraRTC from "agora-rtc-sdk-ng";
import { Button } from '../ui/Button';
import { useToast } from '../../context/ToastContext';

const StreamRoomPage = lazy(() => import('../../pages/StreamRoomPage'));

const Room = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { addToast } = useToast();

    const [agoraToken, setAgoraToken] = useState(null);
    const [isHost, setIsHost] = useState(null);
    const [hostUid, setHostUid] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const agoraClient = useMemo(() => 
        AgoraRTC.createClient({ codec: "vp8", mode: "rtc" }),
        []
    );

    const getToken = useCallback(async () => {
        if (user && roomId) {
            setLoading(true);
            setError(null);
            try {
                const data = await fetchAgoraToken(roomId, user.uid, () => user.getIdToken());
                setAgoraToken(data.token);
                setIsHost(data.isHost);
                setHostUid(data.hostUid);
            } catch (err) {
                // Comment out the console.error to prevent logging expected 404s
                // console.error('Token fetch error:', err);
                setIsHost(false); 
                if (err.message.includes('404')) {
                    addToast('Please enter a valid Room ID.', 'error');
                    navigate('/');
                } else {
                    setError(`Failed to join room: ${err.message}`);
                }
            } finally {
                setLoading(false);
            }
        }
    }, [roomId, user, addToast, navigate]);

    useEffect(() => {
        getToken();
    }, [getToken]);

    const handleLeaveRoom = () => navigate('/');

    if (loading || isHost === null) {
        return (
            <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-white">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
              <p className="ml-4 text-lg">Joining Room...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-white">
                <div className="text-center bg-neutral-900 p-8 rounded-lg shadow-lg">
                    <h2 className="text-2xl font-bold text-red-500 mb-4">Error</h2>
                    <p className="text-neutral-300 mb-6">{error}</p>
                    <Button onClick={handleLeaveRoom} variant="primary">
                        Return to Lobby
                    </Button>
                </div>
            </div>
        );
    }
    
    return agoraToken ? (
        <AgoraRTCProvider client={agoraClient}>
            <StreamRoomPage
                key={`${user.uid}-${roomId}`}
                isHost={isHost}
                hostUid={hostUid}
                roomId={roomId}
                token={agoraToken}
                onLeaveRoom={handleLeaveRoom}
                appId={import.meta.env.VITE_AGORA_APP_ID}
                client={agoraClient}
            />
        </AgoraRTCProvider>
    ) : null;
};

export default Room;