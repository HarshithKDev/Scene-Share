// src/services/agoraApi.js

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

/**
 * Sends a heartbeat to the server to keep the room alive.
 * @param {string} channelName - The name of the channel (room).
 * @param {Function} getIdToken - A function to get the Firebase auth token.
 */
export const sendHeartbeat = async (channelName, getIdToken) => {
    if (!getIdToken) {
        console.error('Get ID token function is required for heartbeat.');
        return;
    }
    try {
        const idToken = await getIdToken();
        await fetch(`${BACKEND_URL}/heartbeat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
            body: JSON.stringify({ channelName }),
        });
    } catch (error) {
        console.error('Failed to send heartbeat:', error);
    }
};


/**
 * Fetches an Agora RTC token and host status from the server.
 * @param {string} channelName - The name of the channel to join.
 * @param {string} uid - The user ID.
 * @param {Function} getIdToken - A function to get the Firebase auth token.
 * @returns {Promise<object>} An object containing the Agora token and isHost boolean.
 */
export const fetchAgoraToken = async (channelName, uid, getIdToken) => {
    if (!getIdToken) {
        throw new Error('Get ID token function is required.');
    }

    try {
        const idToken = await getIdToken();
        console.log(`🔑 Requesting token for channel: ${channelName}, UID: ${uid}`);

        const response = await fetch(`${BACKEND_URL}/get-agora-token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
            body: JSON.stringify({
                channelName: channelName.toString(),
                uid: uid.toString(),
            }),
        });

        if (!response.ok) {
            // Include status in the error message to detect 404s
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        if (!data.token) {
            throw new Error('No token received from server');
        }

        console.log('✅ Token and host status received successfully for UID:', uid);
        // --- FIX: Return the entire data object ---
        return data;
    } catch (error) {
        console.error("❌ Error fetching Agora token:", error);
        throw error;
    }
};