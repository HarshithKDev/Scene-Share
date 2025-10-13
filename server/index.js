// server/index.js
const express = require('express');
const { RtcTokenBuilder, RtcRole } = require('agora-token');
const cors = require('cors');
require('dotenv').config();
const admin = require('firebase-admin');

const app = express();
app.use(express.json());
app.use(cors());

try {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error);
  // Exiting the process if Firebase initialization fails.
  process.exit(1);
}

const db = admin.firestore();
const roomsCollection = db.collection('rooms');
const EXPIRATION_HOURS = 24;

const verifyFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).send('Unauthorized: No token provided.');
  }
  const idToken = authHeader.split('Bearer ')[1];
  try {
    req.user = await admin.auth().verifyIdToken(idToken);
    next();
  } catch (error) {
    console.error('Error verifying Firebase token:', error);
    return res.status(403).send('Unauthorized: Invalid token.');
  }
};

// --- HELPER: A simple regex to validate room IDs ---
const isValidChannelName = (name) => /^[a-zA-Z0-9_-]+$/.test(name);

app.post('/create-room', verifyFirebaseToken, async (req, res) => {
    const { channelName } = req.body;
    const { uid } = req.user;

    // --- MODIFICATION: Added server-side validation for the channel name ---
    if (!channelName || !isValidChannelName(channelName)) {
        return res.status(400).json({ error: 'Invalid channelName format.' });
    }

    try {
        const expirationDate = new Date(Date.now() + 3600 * 1000 * EXPIRATION_HOURS);
        // Using a transaction to make room creation atomic
        await db.runTransaction(async (transaction) => {
            const roomRef = roomsCollection.doc(channelName);
            const roomDoc = await transaction.get(roomRef);
            if (roomDoc.exists) {
                throw new Error("Room already exists.");
            }
            transaction.set(roomRef, {
                hostUid: uid,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                expiresAt: admin.firestore.Timestamp.fromDate(expirationDate),
            });
        });
        console.log(`✅ Room created: [${channelName}], expires at ${expirationDate.toISOString()}`);
        res.status(201).json({ message: 'Room created successfully.' });
    } catch (error) {
        console.error("Error creating room in Firestore:", error);
        if (error.message === "Room already exists.") {
            return res.status(409).json({ error: 'Room with this ID already exists.' });
        }
        res.status(500).json({ error: 'Failed to create room.' });
    }
});

app.post('/heartbeat', verifyFirebaseToken, async (req, res) => {
  const { channelName } = req.body;
  const { uid } = req.user;

    // --- MODIFICATION: Added server-side validation for the channel name ---
    if (!channelName || !isValidChannelName(channelName)) {
        return res.status(400).json({ error: 'Invalid channelName format.' });
    }

  const roomRef = roomsCollection.doc(channelName);
  
  try {
    const roomDoc = await roomRef.get();
    if (!roomDoc.exists) {
      return res.status(404).json({ error: 'Room not found.' });
    }

    if (roomDoc.data().hostUid !== uid) {
      return res.status(403).json({ error: 'Only the host can update the room.' });
    }

    const newExpirationDate = new Date(Date.now() + 3600 * 1000 * EXPIRATION_HOURS);
    await roomRef.update({
      expiresAt: admin.firestore.Timestamp.fromDate(newExpirationDate)
    });

    console.log(`💓 Heartbeat received for room [${channelName}]. Expiration extended.`);
    res.status(200).json({ message: 'Room kept alive.' });
  } catch (error) {
    console.error(`Error processing heartbeat for room [${channelName}]:`, error);
    res.status(500).json({ error: 'Failed to process heartbeat.' });
  }
});


app.post('/get-agora-token', verifyFirebaseToken, async (req, res) => {
  const { channelName } = req.body;
  const { uid: requestingUid, name: displayName } = req.user;

    // --- MODIFICATION: Changed validation to use the regex helper ---
    if (!channelName || !isValidChannelName(channelName)) {
        return res.status(400).json({ error: 'Invalid channelName format.' });
    }

  let hostUid;
  try {
      const roomDoc = await roomsCollection.doc(channelName).get();
      if (!roomDoc.exists) {
          console.log(`❌ Room not found: [${channelName}]`);
          return res.status(404).json({ error: 'Room not found.' });
      }
      hostUid = roomDoc.data().hostUid;

      const participantRef = roomsCollection.doc(channelName).collection('participants').doc(requestingUid);
      await participantRef.set({
          displayName: displayName || `User-${requestingUid.substring(0, 4)}`,
          lastSeen: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

  } catch (error) {
      console.error("Error getting room or updating participant:", error);
      return res.status(500).json({ error: 'Failed to process room details.' });
  }

  // Ensure screen-share UID is derived from the authenticated user
  const isScreenShare = req.body.uid && req.body.uid === `${requestingUid}-screen`;
  const tokenUid = isScreenShare ? req.body.uid : requestingUid;

  const sanitizedChannelName = channelName.replace(/[^a-zA-Z0-9_-]/g, '');
  const sanitizedTokenUid = tokenUid.replace(/[^a-zA-Z0-9_-]/g, '');

  if (sanitizedChannelName.length === 0 || sanitizedTokenUid.length === 0) {
    return res.status(400).json({ error: 'Invalid channelName or uid.' });
  }

  const appId = process.env.AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;
  if (!appId || !appCertificate) {
    console.error('Agora App ID or Certificate is missing');
    return res.status(500).json({ error: 'Server configuration error.' });
  }

  try {
    const role = RtcRole.PUBLISHER;
    const expirationTimeInSeconds = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    console.log(`🔄 Generating token for channel: ${sanitizedChannelName}, UID: ${sanitizedTokenUid}, isHost: ${hostUid === requestingUid}`);

    const token = RtcTokenBuilder.buildTokenWithUserAccount(
      appId,
      appCertificate,
      sanitizedChannelName,
      sanitizedTokenUid,
      role,
      privilegeExpiredTs
    );
    
    // --- MODIFICATION: Add hostUid to the response ---
    res.status(200).json({ token, uid: sanitizedTokenUid, isHost: hostUid === requestingUid, hostUid });
  } catch (error) {
    console.error('❌ Error generating Agora token:', error);
    res.status(500).json({ error: 'Failed to generate token: ' + error.message });
  }
});


app.get('/health', async (req, res) => {
  let activeRooms = 0;
  try {
      const snapshot = await roomsCollection.get();
      activeRooms = snapshot.size;
  } catch (error) {
      console.error("Error getting active rooms count:", error);
  }

  res.status(200).json({
    status: 'OK',
    agoraAppId: process.env.AGORA_APP_ID ? 'Configured' : 'Missing',
    firebase: admin.apps.length > 0 ? 'Configured' : 'Missing',
    activeRooms: activeRooms,
    timestamp: new Date().toISOString()
  });
});

// This block allows the server to run locally
if (require.main === module) {
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
  });
}

module.exports = app;