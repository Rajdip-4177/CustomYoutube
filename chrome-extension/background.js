// Background Service Worker (Manifest V3)
import { initializeFirebase, getCurrentUser } from './lib/firebase-init.js';
import { syncDataFromSupabase } from './lib/supabase-sync.js';

console.log('Focused Learning Hub - Background Service Worker initialized');

// Initialize on extension install
chrome.runtime.onInstalled.addListener(async (details) => {
    console.log('Extension installed/updated:', details.reason);

    // Set default storage values
    const defaults = {
        isLoggedIn: false,
        youtube_api_key: null,
        whitelist_channels: [],
        lastSync: null
    };

    await chrome.storage.local.set(defaults);
    console.log('Default storage initialized');
});

// Listen for login events from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'USER_LOGGED_IN') {
        handleUserLogin(message.user).then(sendResponse);
        return true; // Keep channel open for async response
    }

    if (message.type === 'SYNC_NOW') {
        syncUserData().then(sendResponse);
        return true;
    }

    if (message.type === 'LOGOUT') {
        handleLogout().then(sendResponse);
        return true;
    }
});

// Handle user login and sync data
async function handleUserLogin(user) {
    try {
        console.log('User logged in:', user.uid);

        // Sync data from Supabase
        await syncUserData(user);

        await chrome.storage.local.set({
            isLoggedIn: true,
            userEmail: user.email,
            userUid: user.uid
        });

        return { success: true };
    } catch (error) {
        console.error('Login handling error:', error);
        return { success: false, error: error.message };
    }
}

// Sync data from Supabase to local storage
async function syncUserData(user) {
    try {
        const data = await syncDataFromSupabase(user);

        if (data) {
            await chrome.storage.local.set({
                youtube_api_key: data.youtube_api_key,
                whitelist_channels: data.whitelist_channels || [],
                lastSync: new Date().toISOString()
            });

            console.log('Data synced successfully', {
                hasApiKey: !!data.youtube_api_key,
                channelCount: data.whitelist_channels?.length || 0
            });

            return { success: true };
        }
    } catch (error) {
        console.error('Sync error:', error);
        return { success: false, error: error.message };
    }
}

// Handle logout
async function handleLogout() {
    try {
        await chrome.storage.local.clear();
        console.log('Storage cleared on logout');
        return { success: true };
    } catch (error) {
        console.error('Logout error:', error);
        return { success: false, error: error.message };
    }
}

// Periodic sync (every 30 minutes)
chrome.alarms.create('syncData', { periodInMinutes: 30 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === 'syncData') {
        const { isLoggedIn } = await chrome.storage.local.get('isLoggedIn');
        if (isLoggedIn) {
            console.log('Periodic sync triggered');
            await syncUserData();
        }
    }
});
