import firebase from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCeR3TMp-4xjrDrKQYkqagL_niBm6bRUYs",
  authDomain: "marcan-c00b3.firebaseapp.com",
  projectId: "marcan-c00b3",
  storageBucket: "marcan-c00b3.firebasestorage.app",
  messagingSenderId: "1056331122103",
  appId: "1:1056331122103:web:ef7a1a20f2bafd21e59432",
  measurementId: "G-1SE78YJXN3"
};

const firebaseApp = firebase.initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);

export { auth };
export default firebaseApp;