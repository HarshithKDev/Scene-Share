// src/components/routes/Room.jsx
import React, { useState, useEffect, useCallback, lazy, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { fetchAgoraToken } from '../../services/agoraApi';
import { AgoraRTCProvider } from "agora-rtc-react";
import AgoraRTC from "agora-rtc-sdk-ng";

const StreamRoomPage = lazy(() => import('../../pages/StreamRoomPage'));

const Room = () => {
    const { roomId } = useParams();
    const { state } = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [agoraToken, setAgoraToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const isHost = state?.isHost || false;

    // Create a new Agora client instance every time the component renders.
    // useMemo ensures it's stable within a single render cycle.
    const agoraClient = useMemo(() => 
        AgoraRTC.createClient({ codec: "vp8", mode: "rtc" }),
        []
    );

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
        // ... (loading UI remains the same)
    }

    if (error) {
        // ... (error UI remains the same)
    }
    
    return agoraToken ? (
        <AgoraRTCProvider client={agoraClient}>
            <StreamRoomPage
                key={`${user.uid}-${roomId}`}
                isHost={isHost}
                roomId={roomId}
                token={agoraToken}
                onLeaveRoom={handleLeaveRoom}
                appId={import.meta.env.VITE_AGORA_APP_ID}
            />
        </AgoraRTCProvider>
    ) : null;
};

export default Room;