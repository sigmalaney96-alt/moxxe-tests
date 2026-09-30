import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAhTg7uxjdMSnW22EZpIcrSxEUYQ0JJVyc",
  authDomain: "moxxe-auth.firebaseapp.com",
  databaseURL: "https://moxxe-auth-default-rtdb.firebaseio.com",
  projectId: "moxxe-auth",
  storageBucket: "moxxe-auth.firebasestorage.app",
  messagingSenderId: "509286383113",
  appId: "1:509286383113:web:9fd26e36c42d827a1b82d8",
  measurementId: "G-0RN2BZZ6X2"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);
export const db = getFirestore(app);

export default app;
