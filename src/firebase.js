import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider 
} from "firebase/auth";

// Your web app's Firebase configuration
// To get this, go to Project Settings > General in your Firebase console
const firebaseConfig = {
  apiKey: "AIzaSyDdBCuxp_s4TxKIWyB8AmD2MX4LuUn1uLM",
  authDomain: "scene-share-e6a6e.firebaseapp.com",
  projectId: "scene-share-e6a6e",
  storageBucket: "scene-share-e6a6e.firebasestorage.app",
  messagingSenderId: "102458846099",
  appId: "1:102458846099:web:fba1655795ea94e7c41666",
  measurementId: "G-MBVL8HQ1VQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { 
  auth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  googleProvider 
};