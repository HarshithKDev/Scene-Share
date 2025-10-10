// server/index.js - Updated token generation
const express = require('express');
const { RtcTokenBuilder, RtcRole } = require('agora-token');
const cors = require('cors');
require('dotenv').config();
const admin = require('firebase-admin');

const app = express();
app.use(express.json());
app.use(cors());

// Initialize Firebase Admin SDK
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const verifyFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).send('Unauthorized: No token provided.');
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying Firebase token:', error);
    return res.status(403).send('Unauthorized: Invalid token.');
  }
};

app.post('/get-agora-token', verifyFirebaseToken, (req, res) => {
  const { channelName } = req.body;
  const uid = req.user.uid;

  if (!channelName) {
    return res.status(400).json({ error: 'channelName is required' });
  }

  // Get Agora credentials from environment variables
  const appId = process.env.AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;

  if (!appId || !appCertificate) {
    console.error('Agora App ID or Certificate is missing');
    return res.status(500).json({ error: 'Server configuration error.' });
  }

  try {
    // Generate token with proper parameters
    const role = RtcRole.PUBLISHER;
    const expirationTimeInSeconds = 3600; // 1 hour
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    // IMPORTANT: Use buildTokenWithUid for numeric UID or buildTokenWithUserAccount for string UID
    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      0, // Use 0 for dynamic UID assignment, or convert Firebase UID to number
      role,
      privilegeExpiredTs
    );

    console.log(`Token generated for channel: ${channelName}, user: ${uid}`);
    
    return res.status(200).json({ 
      token: token,
      appId: appId, // Return appId for verification
      channel: channelName
    });
  } catch (error) {
    console.error('Error generating Agora token:', error);
    return res.status(500).json({ error: 'Failed to generate token: ' + error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    agoraAppId: process.env.AGORA_APP_ID ? 'Configured' : 'Missing',
    firebase: serviceAccount.project_id 
  });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});