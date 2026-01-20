// Content Script: YouTube Video Checker
// Runs on youtube.com/watch* pages to check if video is whitelisted

console.log('YouTube Checker - Content script loaded');

// Extract video ID from URL
function getVideoId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('v');
}

// Extract channel ID from page
function getChannelIdFromPage() {
    // Try multiple selectors
    const channelLink = document.querySelector('ytd-channel-name a');
    if (channelLink) {
        const href = channelLink.href;
        const match = href.match(/\/channel\/([\w-]+)/);
        if (match) return match[1];
    }

    // Alternative method
    const videoData = window.ytInitialData;
    if (videoData) {
        try {
            const channelId = videoData?.contents?.twoColumnWatchNextResults?.results?.results?.contents?.[1]?.videoSecondaryInfoRenderer?.owner?.videoOwnerRenderer?.navigationEndpoint?.browseEndpoint?.browseId;
            if (channelId) return channelId;
        } catch (e) {
            console.error('Error extracting channel ID:', e);
        }
    }

    return null;
}

// Check if video is whitelisted
async function checkVideoWhitelist() {
    try {
        const videoId = getVideoId();
        if (!videoId) return;

        // Wait for page to load
        await new Promise(resolve => setTimeout(resolve, 1000));

        const channelId = getChannelIdFromPage();
        if (!channelId) {
            console.warn('Could not extract channel ID from page');
            return;
        }

        console.log('Checking video:', { videoId, channelId });

        // Get whitelist from storage
        const { whitelist_channels } = await chrome.storage.local.get('whitelist_channels');

        if (!whitelist_channels || whitelist_channels.length === 0) {
            console.warn('No whitelist found - blocking video');
            showFocusOverlay('No whitelist configured. Please set up your whitelist in the extension.');
            return;
        }

        // Check if channel is whitelisted
        const isWhitelisted = whitelist_channels.some(ch => ch.id === channelId);

        if (!isWhitelisted) {
            console.warn('Channel not whitelisted:', channelId);
            showFocusOverlay('This channel is not in your whitelist. Stay focused!');
        } else {
            console.log('Channel is whitelisted - allowing video');
        }
    } catch (error) {
        console.error('Error checking whitelist:', error);
    }
}

// Show focus overlay
function showFocusOverlay(message) {
    const overlay = document.createElement('div');
    overlay.id = 'focus-overlay';
    overlay.innerHTML = `
    <div class="focus-overlay-content">
      <div class="focus-icon">🎯</div>
      <h2>Stay Focused!</h2>
      <p>${message}</p>
      <button id="goToPortalBtn" class="focus-btn">Go to Learning Portal</button>
    </div>
  `;

    document.body.appendChild(overlay);

    // Add event listener to button
    document.getElementById('goToPortalBtn').addEventListener('click', () => {
        window.location.href = 'https://rajdip-4177.github.io/CustomYoutube/';
    });

    // Prevent video playback
    const video = document.querySelector('video');
    if (video) {
        video.pause();
        video.style.display = 'none';
    }
}

// Run check when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkVideoWhitelist);
} else {
    checkVideoWhitelist();
}

// Also check when URL changes (SPA navigation)
let lastUrl = location.href;
new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        checkVideoWhitelist();
    }
}).observe(document, { subtree: true, childList: true });
