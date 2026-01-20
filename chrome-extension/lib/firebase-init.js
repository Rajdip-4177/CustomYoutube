// Firebase Configuration
// IMPORTANT: Replace these values with your actual Firebase project credentials
// Get these from Firebase Console -> Project Settings -> General

export const firebaseConfig = {
    apiKey: "YOUR_FIREBASE_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Note: This extension uses Firebase CDN scripts loaded in popup.html
// The actual Firebase SDK is imported there, not here
