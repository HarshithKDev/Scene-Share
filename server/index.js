const express = require('express');
const { RtcTokenBuilder, RtcRole } = require('agora-token');
const cors = require('cors');
require('dotenv').config();
const admin = require('firebase-admin');

// --- INITIALIZATION ---

// Initialize Express app
const app = express();
app.use(express.json());
app.use(cors()); // Enable CORS for your React frontend

// Initialize Firebase Admin SDK
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// --- MIDDLEWARE TO VERIFY FIREBASE TOKEN ---

const verifyFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).send('Unauthorized: No token provided.');
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken; // Add user info to the request object
    next();
  } catch (error) {
    console.error('Error verifying Firebase token:', error);
    return res.status(403).send('Unauthorized: Invalid token.');
  }
};

// --- API ENDPOINT FOR GENERATING AGORA TOKEN ---

app.post('/get-agora-token', verifyFirebaseToken, (req, res) => {
  // Get channelName and UID from the request body
  const { channelName } = req.body;
  const uid = req.user.uid; // Use the verified Firebase UID

  if (!channelName) {
    return res.status(400).json({ error: 'channelName is required' });
  }

  // Set role and expiration time for the token
  const role = RtcRole.PUBLISHER;
  const expirationTimeInSeconds = 3600; // 1 hour
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  // Get Agora credentials from environment variables
  const appId = process.env.AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;

  if (!appId || !appCertificate) {
    console.error('Agora App ID or Certificate is missing from .env file');
    return res.status(500).json({ error: 'Server configuration error.' });
  }

  // Build the token
  try {
    const token = RtcTokenBuilder.buildTokenWithUserAccount(
  appId,
  appCertificate,
  channelName,
  uid, // uid is the user account string from Firebase
  role,
  privilegeExpiredTs
);

    console.log(`Token generated for channel: ${channelName}, user: ${uid}`);
    return res.status(200).json({ token: token });
  } catch (error) {
    console.error('Error generating Agora token:', error);
    return res.status(500).json({ error: 'Failed to generate token.' });
  }
});

// --- START THE SERVER ---

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log('Agora App ID:', process.env.AGORA_APP_ID ? 'Loaded' : 'Missing!');
  console.log('Firebase Project ID:', serviceAccount.project_id);
});