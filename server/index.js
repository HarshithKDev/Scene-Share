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
  const { channelName, uid } = req.body;

  if (!channelName || !uid) {
    return res.status(400).json({ error: 'channelName and uid are required' });
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

    // Ensure UID is treated as string
    const stringUid = uid.toString();
    
    console.log(`🔄 Generating token for channel: ${channelName}, UID: ${stringUid}`);

    // Use buildTokenWithUserAccount for string-based UIDs
    const token = RtcTokenBuilder.buildTokenWithUserAccount(
      appId,
      appCertificate,
      channelName,
      stringUid,
      role,
      privilegeExpiredTs
    );

    console.log(`✅ Token generated successfully for UID: ${stringUid}`);
    
    return res.status(200).json({ 
      token: token,
      uid: stringUid
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
    firebase: serviceAccount.project_id ? 'Configured' : 'Missing',
    timestamp: new Date().toISOString()
  });
});

// Test endpoint without auth for debugging
app.get('/test-token', (req, res) => {
  const { channelName, uid } = req.query;
  
  if (!channelName || !uid) {
    return res.status(400).json({ error: 'channelName and uid query parameters are required' });
  }

  const appId = process.env.AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;

  if (!appId || !appCertificate) {
    return res.status(500).json({ error: 'Server configuration error.' });
  }

  try {
    const role = RtcRole.PUBLISHER;
    const expirationTimeInSeconds = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    const token = RtcTokenBuilder.buildTokenWithUserAccount(
      appId,
      appCertificate,
      channelName,
      uid.toString(),
      role,
      privilegeExpiredTs
    );

    res.status(200).json({ 
      token: token,
      channelName: channelName,
      uid: uid,
      appId: appId
    });
  } catch (error) {
    console.error('Test token error:', error);
    res.status(500).json({ error: 'Failed to generate test token: ' + error.message });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🔑 Agora App ID: ${process.env.AGORA_APP_ID ? 'Configured' : 'MISSING'}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
});