// server/index.js - FINAL VERSION
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
  process.exit(1);
}

// Initialize Firestore
const db = admin.firestore();
const roomsCollection = db.collection('rooms');


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

// New endpoint for a user to declare themselves as host of a new room
app.post('/create-room', verifyFirebaseToken, async (req, res) => {
    const { channelName } = req.body;
    const { uid } = req.user;

    if (!channelName) {
        return res.status(400).json({ error: 'channelName is required.' });
    }

    try {
        // Use the channelName as the document ID in the 'rooms' collection
        await roomsCollection.doc(channelName).set({
            hostUid: uid,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`✅ Room created: Channel [${channelName}] hosted by User [${uid}]`);
        res.status(201).json({ message: 'Room created successfully.' });
    } catch (error) {
        console.error("Error creating room in Firestore:", error);
        res.status(500).json({ error: 'Failed to create room.' });
    }
});


app.post('/get-agora-token', verifyFirebaseToken, async (req, res) => {
  const { channelName } = req.body;
  const { uid: requestingUid } = req.user; // UID from the verified Firebase token

  if (!channelName || typeof channelName !== 'string') {
    return res.status(400).json({ error: 'channelName is required and must be a string.' });
  }

  // Determine if the requesting user is the host of this channel
  let hostUid;
  try {
      const roomDoc = await roomsCollection.doc(channelName).get();
      if (roomDoc.exists) {
          hostUid = roomDoc.data().hostUid;
      }
  } catch (error) {
      console.error("Error getting room from Firestore:", error);
      return res.status(500).json({ error: 'Failed to get room details.' });
  }

  const isHost = hostUid === requestingUid;

  // Screen share clients get a separate UID
  const isScreenShare = req.body.uid && req.body.uid.endsWith('-screen');
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
    const role = RtcRole.PUBLISHER; // Everyone can publish in this model
    const expirationTimeInSeconds = 3600; // 1 hour
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    console.log(`🔄 Generating token for channel: ${sanitizedChannelName}, UID: ${sanitizedTokenUid}, isHost: ${isHost}`);

    const token = RtcTokenBuilder.buildTokenWithUserAccount(
      appId,
      appCertificate,
      sanitizedChannelName,
      sanitizedTokenUid,
      role,
      privilegeExpiredTs
    );

    res.status(200).json({ token, uid: sanitizedTokenUid, isHost });
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

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});