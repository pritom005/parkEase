// Client Firebase Auth configuration for Google Sign-In only (browser never accesses Firestore)
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import config from '../firebase-applet-config.json';

// Reuse existing Firebase App instance if already initialized
const app = getApps().length > 0 ? getApp() : initializeApp(config);

// Export Auth client and Google provider for existing Google Sign-In button
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export {
  signInWithPopup,
  fbSignOut,
  onAuthStateChanged
};
export type { FirebaseUser };
