// Popup Logic - Firebase Auth & UI Management

// Import Firebase config
import { firebaseConfig } from '../lib/firebase-init.js';

// State management
let currentUser = null;

// UI Elements
const loadingState = document.getElementById('loadingState');
const notLoggedInState = document.getElementById('notLoggedInState');
const loggedInState = document.getElementById('loggedInState');
const errorState = document.getElementById('errorState');

// Initialize on popup open
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await initializeAuth();
        await loadUserState();
    } catch (error) {
        showError(error.message);
    }
});

// Initialize Firebase Auth
async function initializeAuth() {
    // Firebase SDK is loaded via CDN (add to popup.html)
    // For now, using placeholder
    console.log('Firebase would be initialized here with config:', firebaseConfig);
}

// Load user state from storage
async function loadUserState() {
    const { isLoggedIn, userEmail, userUid, youtube_api_key, whitelist_channels, lastSync } =
        await chrome.storage.local.get(['isLoggedIn', 'userEmail', 'userUid', 'youtube_api_key', 'whitelist_channels', 'lastSync']);

    if (isLoggedIn) {
        showState('loggedIn');
        updateUI({
            email: userEmail,
            uid: userUid,
            apiKey: youtube_api_key,
            channels: whitelist_channels || [],
            lastSync
        });
    } else {
        showState('notLoggedIn');
    }
}

// Show specific state
function showState(state) {
    loadingState.classList.add('hidden');
    notLoggedInState.classList.add('hidden');
    loggedInState.classList.add('hidden');
    errorState.classList.add('hidden');

    if (state === 'loading') loadingState.classList.remove('hidden');
    if (state === 'notLoggedIn') notLoggedInState.classList.remove('hidden');
    if (state === 'loggedIn') loggedInState.classList.remove('hidden');
    if (state === 'error') errorState.classList.remove('hidden');
}

// Update UI with user data
function updateUI(data) {
    document.getElementById('userEmail').textContent = data.email;
    document.getElementById('userName').textContent = data.email.split('@')[0];

    if (data.apiKey) {
        document.getElementById('apiKeyInput').value = data.apiKey;
    }

    document.getElementById('channelCount').textContent = data.channels.length;

    if (data.lastSync) {
        const lastSyncDate = new Date(data.lastSync);
        const timeAgo = getTimeAgo(lastSyncDate);
        document.getElementById('lastSyncTime').textContent = `Last synced: ${timeAgo}`;
        document.getElementById('syncText').textContent = 'Synced';
        document.getElementById('syncIndicator').classList.add('synced');
    }
}

// Event Listeners
document.getElementById('googleSignInBtn')?.addEventListener('click', handleGoogleSignIn);
document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);
document.getElementById('saveApiKeyBtn')?.addEventListener('click', handleSaveApiKey);
document.getElementById('syncNowBtn')?.addEventListener('click', handleSyncNow);
document.getElementById('openPortalBtn')?.addEventListener('click', handleOpenPortal);
document.getElementById('retryBtn')?.addEventListener('click', () => location.reload());

// Handle Google Sign In
async function handleGoogleSignIn() {
    try {
        showState('loading');

        // TODO: Implement actual Firebase Google Auth
        // For now, using a placeholder
        alert('Google Sign-In will be implemented once Firebase credentials are provided.\n\nFor testing, you can manually add your email to chrome.storage.local');
        showState('notLoggedIn');

        // Placeholder for actual implementation:
        // const result = await firebase.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider());
        // const user = result.user;
        // await chrome.runtime.sendMessage({ type: 'USER_LOGGED_IN', user });

    } catch (error) {
        showError(error.message);
    }
}

// Handle Logout
async function handleLogout() {
    try {
        showState('loading');
        await chrome.runtime.sendMessage({ type: 'LOGOUT' });
        showState('notLoggedIn');
    } catch (error) {
        showError(error.message);
    }
}

// Handle Save API Key
async function handleSaveApiKey() {
    try {
        const apiKey = document.getElementById('apiKeyInput').value.trim();

        if (!apiKey) {
            alert('Please enter a valid API key');
            return;
        }

        // Save to local storage
        await chrome.storage.local.set({ youtube_api_key: apiKey });

        // TODO: Sync to Supabase when credentials are available
        // await updateApiKey(currentUser, apiKey);

        alert('API Key saved successfully!');
    } catch (error) {
        showError(error.message);
    }
}

// Handle Sync Now
async function handleSyncNow() {
    try {
        document.getElementById('syncText').textContent = 'Syncing...';
        await chrome.runtime.sendMessage({ type: 'SYNC_NOW' });

        // Reload state
        await loadUserState();
    } catch (error) {
        showError(error.message);
    }
}

// Handle Open Portal
function handleOpenPortal() {
    chrome.tabs.create({ url: 'https://rajdip-4177.github.io/CustomYoutube/' });
}

// Show error
function showError(message) {
    showState('error');
    document.getElementById('errorMessage').textContent = message;
}

// Utility: Get time ago
function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
}
