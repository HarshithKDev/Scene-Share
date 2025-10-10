// server/index.js - UPDATED VERSION
const express = require('express');
const { RtcTokenBuilder, RtcRole } = require('agora-token');
const cors = require('cors');
require('dotenv').config();
const admin = require('firebase-admin');

const app = express();
app.use(express.json());
app.use(cors());

// Initialize Firebase Admin SDK
// IMPORTANT: It is strongly recommended to use a secure method to store and access your service account key,
// such as a secret manager (e.g., Google Secret Manager, AWS Secrets Manager, HashiCorp Vault).
// Avoid committing the key to your version control system.
try {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error);
  process.exit(1);
}


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
  // Input validation and sanitization
  const { channelName, uid } = req.body;

  if (!channelName || !uid || typeof channelName !== 'string' || typeof uid !== 'string') {
    return res.status(400).json({ error: 'channelName and uid are required and must be strings.' });
  }

  const sanitizedChannelName = channelName.replace(/[^a-zA-Z0-9_-]/g, '');
  const sanitizedUid = uid.replace(/[^a-zA-Z0-9_-]/g, '');

  if (sanitizedChannelName.length === 0 || sanitizedUid.length === 0) {
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
    const expirationTimeInSeconds = 3600; // 1 hour
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    console.log(`🔄 Generating token for channel: ${sanitizedChannelName}, UID: ${sanitizedUid}`);

    const token = RtcTokenBuilder.buildTokenWithUserAccount(
      appId,
      appCertificate,
      sanitizedChannelName,
      sanitizedUid,
      role,
      privilegeExpiredTs
    );

    console.log(`✅ Token generated successfully for UID: ${sanitizedUid}`);

    return res.status(200).json({
      token: token,
      uid: sanitizedUid
    });
  } catch (error) {
    console.error('❌ Error generating Agora token:', error);
    return res.status(500).json({ error: 'Failed to generate token: ' + error.message });
  }
});

// Health check endpoint with more detailed info
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    agoraAppId: process.env.AGORA_APP_ID ? 'Configured' : 'Missing',
    agoraCertificate: process.env.AGORA_APP_CERTIFICATE ? 'Configured' : 'Missing',
    firebase: admin.apps.length > 0 ? 'Configured' : 'Missing',
    timestamp: new Date().toISOString()
  });
});


const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🔑 Agora App ID: ${process.env.AGORA_APP_ID ? 'Configured' : 'MISSING'}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
});