import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCP8LNSQTffOtulCd0iHkF1ZnwH1skZBHw",
  authDomain: "momentrip-639d9.firebaseapp.com",
  projectId: "momentrip-639d9",
  storageBucket: "momentrip-639d9.firebasestorage.app",
  messagingSenderId: "852033682923",
  appId: "1:852033682923:web:3e4318ea31da1a0ff02dae"
};

// 파이어베이스 앱이 이미 초기화되어 있는지 안전하게 체크합니다.
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);
export const auth = getAuth(app);