// Content Script: GitHub Pages Handshake
// Runs on *.github.io pages to provide extension data to the web app

console.log('Focused Learning Hub - Content script loaded on GitHub Pages');

// Listen for requests from the web page
window.addEventListener('message', async (event) => {
    // Only accept messages from same origin
    if (event.source !== window) return;

    if (event.data.type === 'REQUEST_EXTENSION_DATA') {
        console.log('Web page requested extension data');

        try {
            // Fetch data from chrome.storage.local
            const data = await chrome.storage.local.get([
                'youtube_api_key',
                'whitelist_channels',
                'isLoggedIn',
                'userEmail'
            ]);

            // Send response back to web page
            window.postMessage({
                type: 'EXTENSION_DATA_RESPONSE',
                data: {
                    youtube_api_key: data.youtube_api_key || null,
                    whitelist_channels: data.whitelist_channels || [],
                    isLoggedIn: data.isLoggedIn || false,
                    userEmail: data.userEmail || null,
                    extensionVersion: chrome.runtime.getManifest().version
                }
            }, '*');

            console.log('Sent extension data to web page', {
                hasApiKey: !!data.youtube_api_key,
                channelCount: data.whitelist_channels?.length || 0
            });
        } catch (error) {
            console.error('Error fetching extension data:', error);

            window.postMessage({
                type: 'EXTENSION_DATA_ERROR',
                error: error.message
            }, '*');
        }
    }

    // Handle whitelist updates from web page
    if (event.data.type === 'UPDATE_WHITELIST') {
        console.log('Web page requested whitelist update');

        try {
            const { whitelist_channels } = event.data;

            // Update local storage
            await chrome.storage.local.set({ whitelist_channels });

            // TODO: Sync to Supabase when available
            // await chrome.runtime.sendMessage({ type: 'SYNC_WHITELIST', whitelist_channels });

            window.postMessage({
                type: 'WHITELIST_UPDATED',
                success: true
            }, '*');
        } catch (error) {
            console.error('Error updating whitelist:', error);

            window.postMessage({
                type: 'WHITELIST_UPDATE_ERROR',
                error: error.message
            }, '*');
        }
    }
});

// Inject a flag to indicate extension is active
const script = document.createElement('script');
script.textContent = 'window.FOCUSED_LEARNING_HUB_EXTENSION = true;';
(document.head || document.documentElement).appendChild(script);
script.remove();
