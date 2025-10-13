// server/index.js
const express = require('express');
const { RtcTokenBuilder, RtcRole } = require('agora-token');
const cors = require('cors');
require('dotenv').config();
const admin = require('firebase-admin');
const rateLimit = require('express-rate-limit');

const app = express();
app.use(express.json());

// --- CORS Configuration ---
const allowedOrigins = [
  'http://localhost:5173', // Vite's default dev server
  'http://localhost:3000', // Common React dev server port
  'https://scene-share.vercel.app' // ** REPLACE WITH YOUR PRODUCTION URL **
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }
};

app.use(cors(corsOptions));
// --- End CORS Configuration ---


// Rate limiting middleware
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes',
});

try {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set.');
  }
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (error) {
  console.error('CRITICAL: Error initializing Firebase Admin SDK. Please check your FIREBASE_SERVICE_ACCOUNT_KEY environment variable.');
  console.error(error);
  // We will let the server start, but endpoints will fail with a clear message.
}

const db = admin.apps.length ? admin.firestore() : null;
const roomsCollection = db ? db.collection('rooms') : null;
const EXPIRATION_HOURS = 24;

const checkFirebaseInit = (req, res, next) => {
  if (!admin.apps.length || !db) {
    const err = new Error('Firebase Admin SDK is not initialized. Check server logs.');
    err.status = 500;
    return next(err);
  }
  next();
};

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

const isValidChannelName = (name) => /^[a-zA-Z0-9_-]+$/.test(name);

app.post('/create-room', apiLimiter, checkFirebaseInit, verifyFirebaseToken, async (req, res, next) => {
    try {
        const { channelName } = req.body;
        const { uid } = req.user;

        if (!channelName || !isValidChannelName(channelName)) {
            return res.status(400).json({ error: 'Invalid channelName format.' });
        }

        const expirationDate = new Date(Date.now() + 3600 * 1000 * EXPIRATION_HOURS);
        await db.runTransaction(async (transaction) => {
            const roomRef = roomsCollection.doc(channelName);
            const doc = await transaction.get(roomRef);
            if (doc.exists) {
                const err = new Error("Room already exists.");
                err.status = 409;
                throw err;
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
        next(error);
    }
});

app.post('/heartbeat', apiLimiter, checkFirebaseInit, verifyFirebaseToken, async (req, res, next) => {
  try {
    const { channelName } = req.body;
    const { uid } = req.user;

    if (!channelName || !isValidChannelName(channelName)) {
        return res.status(400).json({ error: 'Invalid channelName format.' });
    }

    const roomRef = roomsCollection.doc(channelName);
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
    next(error);
  }
});


app.post('/get-agora-token', apiLimiter, checkFirebaseInit, verifyFirebaseToken, async (req, res, next) => {
  try {
    const { channelName } = req.body;
    const { uid: requestingUid, name: displayName } = req.user;

    if (!channelName || !isValidChannelName(channelName)) {
        return res.status(400).json({ error: 'Invalid channelName format.' });
    }

    const roomRef = roomsCollection.doc(channelName);
    const roomDoc = await roomRef.get();
    if (!roomDoc.exists) {
        console.log(`❌ Room not found: [${channelName}]`);
        return res.status(404).json({ error: 'Room not found.' });
    }
    const hostUid = roomDoc.data().hostUid;

    const participantRef = roomRef.collection('participants').doc(requestingUid);
    await participantRef.set({
        displayName: displayName || `User-${requestingUid.substring(0, 4)}`,
        lastSeen: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    const isScreenShare = req.body.uid && req.body.uid === `${requestingUid}-screen`;
    const tokenUid = isScreenShare ? req.body.uid : requestingUid;

    const sanitizedChannelName = channelName.replace(/[^a-zA-Z0-9_-]/g, '');
    const sanitizedTokenUid = String(tokenUid).replace(/[^a-zA-Z0-9_-]/g, '');

    if (sanitizedChannelName.length === 0 || sanitizedTokenUid.length === 0) {
      return res.status(400).json({ error: 'Invalid channelName or uid.' });
    }

    const appId = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;
    if (!appId || !appCertificate) {
      const err = new Error('Server configuration error for Agora.');
      err.status = 500;
      throw err;
    }

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

    res.status(200).json({ token, uid: sanitizedTokenUid, isHost: hostUid === requestingUid, hostUid });
  } catch (error) {
    next(error);
  }
});

// --- NEW SECURED ENDPOINT TO PREVENT IDOR ---
app.get('/get-participants/:channelName', apiLimiter, checkFirebaseInit, verifyFirebaseToken, async (req, res, next) => {
  try {
    const { channelName } = req.params;
    const { uid } = req.user;

    if (!channelName || !isValidChannelName(channelName)) {
        return res.status(400).json({ error: 'Invalid channelName format.' });
    }

    const roomRef = roomsCollection.doc(channelName);
    const participantsRef = roomRef.collection('participants');

    // **SECURITY CHECK**: Verify the requesting user is a participant of the room.
    const requestingUserDoc = await participantsRef.doc(uid).get();
    if (!requestingUserDoc.exists) {
      return res.status(403).json({ error: 'Forbidden: You are not a member of this room.' });
    }

    // If authorized, fetch and return the list of participants.
    const snapshot = await participantsRef.get();
    const participants = snapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data()
    }));

    res.status(200).json({ participants });

  } catch (error) {
    next(error);
  }
});


app.get('/health', async (req, res, next) => {
  try {
    let activeRooms = 0;
    if (roomsCollection) {
        const snapshot = await roomsCollection.get();
        activeRooms = snapshot.size;
    }

    res.status(200).json({
      status: 'OK',
      agoraAppId: process.env.AGORA_APP_ID ? 'Configured' : 'Missing',
      firebase: admin.apps.length > 0 ? 'Configured' : 'Missing',
      activeRooms: activeRooms,
      timestamp: new Date().toISOString()
    });
  } catch(error) {
    next(error);
  }
});

// Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  const statusCode = err.status || 500;
  if (err.message === "Room already exists.") {
    return res.status(409).json({ error: 'Room with this ID already exists.' });
  }
  res.status(statusCode).json({
    error: 'An internal server error occurred.',
  });
});


if (require.main === module) {
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
  });
}

module.exports = app;