// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCP8LNSQTffOtulCd0iHkF1ZnwH1skZBHw",
  authDomain: "momentrip-639d9.firebaseapp.com",
  projectId: "momentrip-639d9",
  storageBucket: "momentrip-639d9.firebasestorage.app",
  messagingSenderId: "852033682923",
  appId: "1:852033682923:web:3e4318ea31da1a0ff02dae"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);