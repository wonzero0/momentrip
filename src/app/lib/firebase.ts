import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const requiredEnvKeys = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
] as const;

const envByKey: Record<(typeof requiredEnvKeys)[number], string | undefined> = {
  VITE_FIREBASE_API_KEY: firebaseConfig.apiKey,
  VITE_FIREBASE_AUTH_DOMAIN: firebaseConfig.authDomain,
  VITE_FIREBASE_PROJECT_ID: firebaseConfig.projectId,
  VITE_FIREBASE_APP_ID: firebaseConfig.appId,
};

function isPlaceholderValue(value: string | undefined) {
  if (!value) return true;
  const normalized = value.trim().toLowerCase();
  return (
    normalized.includes('your_') ||
    normalized.includes('your-') ||
    normalized.includes('네_') ||
    normalized.includes('api_key') ||
    normalized === 'apikey'
  );
}

export const missingFirebaseEnv = requiredEnvKeys.filter((key) => isPlaceholderValue(envByKey[key]));

export function assertFirebaseConfigured() {
  if (missingFirebaseEnv.length) {
    throw new Error(`Firebase 환경변수 실제 값을 입력해주세요: ${missingFirebaseEnv.join(', ')}`);
  }
}

export function firebaseTargetLabel() {
  return `firebase://${firebaseConfig.projectId || 'unconfigured'}`;
}

export const firestoreTransportMode = 'force-long-polling';

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = initializeFirestore(firebaseApp, {
  experimentalForceLongPolling: true,
});
