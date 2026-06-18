// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAsgQtXBh3u1SL4-TD-cPAwNjklbachpkc",
  authDomain: "tefa-f002b.firebaseapp.com",
  projectId: "tefa-f002b",
  storageBucket: "tefa-f002b.firebasestorage.app",
  messagingSenderId: "514249026560",
  appId: "1:514249026560:web:09ad40c65932ee789dbce5",
  measurementId: "G-6BHY6LN9X0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);