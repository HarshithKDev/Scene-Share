// src/services/agoraApi.js

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

/**
 * Fetches an Agora RTC token from the server.
 * @param {string} channelName - The name of the channel to join.
 * @param {string} uid - The user ID.
 * @param {Function} getIdToken - A function to get the Firebase auth token.
 * @returns {Promise<string>} The Agora token.
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
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        if (!data.token) {
            throw new Error('No token received from server');
        }

        console.log('✅ Token received successfully for UID:', uid);
        return data.token;
    } catch (error) {
        console.error("❌ Error fetching Agora token:", error);
        throw error; // Re-throw the error to be handled by the calling component
    }
};