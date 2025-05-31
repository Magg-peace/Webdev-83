// js/firebase-init.js
// Your web app's Firebase configuration
// REPLACE THE ENTIRE firebaseConfig OBJECT BELOW WITH THE ONE YOU COPIED FROM FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyDrUPoDhdIHsftRA9RdCH78gMjRe_0mdxs",
  authDomain: "relieflink-disaster-app.firebaseapp.com",
  projectId: "relieflink-disaster-app",
  storageBucket: "relieflink-disaster-app.firebasestorage.app",
  messagingSenderId: "31091760903",
  appId: "1:31091760903:web:a7b37157df0eabdea7afa2",
  measurementId: "G-PX4CWWMM2M"
};


// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get references to services we'll use often
const auth = firebase.auth();
const db = firebase.firestore();

// Enable offline persistence for better user experience
firebase.firestore().enablePersistence()
  .catch((err) => {
      if (err.code === 'failed-precondition') {
          console.warn('Firestore persistence failed due to multiple tabs.');
      } else if (err.code === 'unimplemented') {
          console.warn('Firestore persistence not supported in this browser.');
      }
  });