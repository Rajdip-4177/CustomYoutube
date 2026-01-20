// Global State
let apiKey = localStorage.getItem('youtubeApiKey') || '';
let channelsData = [];
let customChannels = JSON.parse(localStorage.getItem('customChannels') || '[]');
let channelIdCache = JSON.parse(localStorage.getItem('channelIdCache') || '{}'); // Persist cache
let activeFilters = new Set();
let hiddenChannels = JSON.parse(localStorage.getItem('hiddenChannels') || '[]'); // Hidden channel IDs
let channelToDelete = null; // Temp storage for delete confirmation

// Extension Integration
let extensionMode = false; // Will be set to true if extension is detected
let extensionDataReceived = false;

// Embedded Channel Data with hardcoded IDs (to avoid quota exhaustion)
const CHANNELS_DATA = {
  "categories": [
    {
      "name": "Class 9",
      "channels": [
        {
          "id": "UCVs9oKvZbUe0Mq9zBL62ZSw",
          "handle": "Class9-NEEV",
          "displayName": "Class 9 - NEEV",
          "url": "https://youtube.com/@Class9-NEEV"
        }
      ]
    },
    {
      "name": "Class 10",
      "channels": [
        {
          "id": "UCwCloZGOqRB_JHtgDKKJZbw",
          "handle": "Class10-UDAAN",
          "displayName": "Class 10 - UDAAN",
          "url": "https://youtube.com/@Class10-UDAAN"
        },
        {
          "id": "UCPqeXfZxstA5RzIP4OjuAKw",
          "handle": "PWICSE",
          "displayName": "PW ICSE",
          "url": "https://youtube.com/@PWICSE"
        }
      ]
    },
    {
      "name": "Class 11 - JEE",
      "channels": [
        {
          "id": "UCctEsQirgs3hCmq5S7A7ToA",
          "handle": "Class11th-JEE",
          "displayName": "Class 11th JEE",
          "url": "https://youtube.com/@Class11th-JEE"
        }
      ]
    },
    {
      "name": "Class 11 - NEET",
      "channels": [
        {
          "id": "UCWEmndu9aCunQAVCjxsP7jg",
          "handle": "Class11th-NEET",
          "displayName": "Class 11th NEET",
          "url": "https://youtube.com/@Class11th-NEET"
        }
      ]
    },
    {
      "name": "Class 12 - JEE",
      "channels": [
        {
          "id": "UChbgwNStwEW8CdeuRl-JaXQ",
          "handle": "Class12th-JEE",
          "displayName": "Class 12th JEE",
          "url": "https://youtube.com/@Class12th-JEE"
        },
        {
          "id": "UCVJU_IChPMOe8RWkdVQjtfQ",
          "handle": "PW-JEEWallah",
          "displayName": "PW JEE Wallah",
          "url": "https://youtube.com/@PW-JEEWallah"
        }
      ]
    },
    {
      "name": "Class 12 - NEET",
      "channels": [
        {
          "id": "UC2ynjdzhmROVYmDaF1KrvEA",
          "handle": "Class12th-NEET",
          "displayName": "Class 12th NEET",
          "url": "https://youtube.com/@Class12th-NEET"
        }
      ]
    },
    {
      "name": "Droppers",
      "channels": [
        {
          "id": "UCVJU_IChPMOe8RWkdVQjtfQ",
          "handle": "PW-JEEWallah",
          "displayName": "PW JEE Wallah",
          "url": "https://youtube.com/@PW-JEEWallah"
        },
        {
          "id": "UCUy0Nar2ZTQwZBUSliqaioQ",
          "handle": "Yakeen",
          "displayName": "Yakeen",
          "url": "https://youtube.com/@Yakeen"
        }
      ]
    },
    {
      "name": "Support Channels",
      "channels": [
        {
          "id": "UCCJs3LCIxNidjfbCksySd-g",
          "handle": "NCERTWallah",
          "displayName": "NCERT Wallah",
          "url": "https://youtube.com/@NCERTWallah"
        },
        {
          "id": "UCyf71tWV2abeN-l_UKiJ-5g",
          "handle": "JEEChallengersbyPW",
          "displayName": "JEE Challengers by PW",
          "url": "https://youtube.com/@JEEChallengersbyPW"
        },
        {
          "id": "UCphU2bAGmw304CFAzy0Enuw",
          "handle": "PW-Foundation",
          "displayName": "PW Foundation",
          "url": "https://youtube.com/@PW-Foundation"
        },
        {
          "id": "UCiGyWN6DEbnj2alu7iapuKQ",
          "handle": "PhysicsWallah",
          "displayName": "Physics Wallah",
          "url": "https://youtube.com/@PhysicsWallah"
        },
        {
          "id": "UCD16eo98AXl-9T61Xd711kQ",
          "handle": "PW-NEETWallah",
          "displayName": "PW NEET Wallah",
          "url": "https://youtube.com/@PW-NEETWallah"
        }
      ]
    }
  ]
};

// Initialize App
document.addEventListener('DOMContentLoaded', async () => {
  // Check if running under extension
  if (window.FOCUSED_LEARNING_HUB_EXTENSION) {
    console.log('Extension detected - requesting data...');
    extensionMode = true;
    requestExtensionData();
  }

  loadChannelsData();
  initializeUI();
  setupEventListeners();

  if (apiKey) {
    document.getElementById('apiKeyInput').value = apiKey;
    updateAPIStatus(true);
  }
});

// Request data from extension (if present)
function requestExtensionData() {
  // Send request to content script
  window.postMessage({ type: 'REQUEST_EXTENSION_DATA' }, '*');

  // Set timeout in case extension doesn't respond
  setTimeout(() => {
    if (!extensionDataReceived) {
      console.warn('Extension did not respond - using local storage fallback');
    }
  }, 2000);
}

// Listen for extension data response
window.addEventListener('message', (event) => {
  if (event.data.type === 'EXTENSION_DATA_RESPONSE') {
    extensionDataReceived = true;
    const { youtube_api_key, whitelist_channels, isLoggedIn, userEmail } = event.data.data;

    console.log('Received data from extension:', {
      hasApiKey: !!youtube_api_key,
      channelCount: whitelist_channels?.length || 0,
      isLoggedIn
    });

    // Use extension data if available
    if (youtube_api_key) {
      apiKey = youtube_api_key;
      localStorage.setItem('youtubeApiKey', apiKey);
      document.getElementById('apiKeyInput').value = apiKey;
      updateAPIStatus(true);
    }

    // Show extension status in UI
    if (isLoggedIn && userEmail) {
      const apiSection = document.getElementById('apiKeySection');
      const extensionBadge = document.createElement('div');
      extensionBadge.style.cssText = 'background: linear-gradient(135deg, #10b981, #34d399); color: white; padding: 8px 12px; border-radius: 6px; margin-top: 8px; font-size: 0.85rem; text-align: center;';
      extensionBadge.innerHTML = `✓ Connected to Extension | ${userEmail}`;
      apiSection.appendChild(extensionBadge);
    }
  }
});

// Load Channels Data
function loadChannelsData() {
  // Deep copy static data to avoid mutating original
  const staticData = JSON.parse(JSON.stringify(CHANNELS_DATA.categories));

  // Merge custom channels
  customChannels.forEach(custom => {
    const category = staticData.find(c => c.name === custom.category);
    if (category) {
      category.channels.push(custom);
    } else {
      // Create new category if it doesn't exist (though UI restricts this currently)
      staticData.push({
        name: custom.category,
        channels: [custom]
      });
    }
  });

  // Filter out hidden channels
  staticData.forEach(category => {
    category.channels = category.channels.filter(ch => !hiddenChannels.includes(ch.id));
  });

  channelsData = staticData;
  displayChannels();
  createFilters();
  populateCategoryDropdown();
}

// Delete Channel
function deleteChannel(channelId, channelName) {
  channelToDelete = { id: channelId, name: channelName };

  // Show custom confirmation modal
  const modal = document.getElementById('deleteConfirmModal');
  const message = document.getElementById('deleteConfirmMessage');
  message.textContent = `Are you sure you want to remove "${channelName}"? You can always add it back later.`;
  modal.classList.add('active');
}

function confirmDelete() {
  if (!channelToDelete) return;

  // Check if it's a custom channel
  const isCustom = customChannels.some(ch => ch.id === channelToDelete.id);

  if (isCustom) {
    // Remove from customChannels
    customChannels = customChannels.filter(ch => ch.id !== channelToDelete.id);
    localStorage.setItem('customChannels', JSON.stringify(customChannels));
  } else {
    // Add to hidden channels
    if (!hiddenChannels.includes(channelToDelete.id)) {
      hiddenChannels.push(channelToDelete.id);
      localStorage.setItem('hiddenChannels', JSON.stringify(hiddenChannels));
    }
  }

  // Close modal
  closeDeleteModal();

  // Reload UI
  loadChannelsData();

  channelToDelete = null;
}

function closeDeleteModal() {
  const modal = document.getElementById('deleteConfirmModal');
  modal.classList.remove('active');
  channelToDelete = null;
}


function populateCategoryDropdown() {
  const select = document.getElementById('channelCategory');
  if (!select) return;

  select.innerHTML = '';
  // Use static categories + any new ones
  const categories = CHANNELS_DATA.categories.map(c => c.name);

  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    select.appendChild(option);
  });
}

// Initialize UI
function initializeUI() {
  const searchSection = document.getElementById('searchSection');
  initQuotaTracker(); // Initialize tracker
  if (!apiKey) {
    searchSection.style.opacity = '0.5';
    searchSection.style.pointerEvents = 'none';
  }
}

// Setup Event Listeners
function setupEventListeners() {
  // API Key Management
  document.getElementById('saveApiKeyBtn').addEventListener('click', saveApiKey);
  document.getElementById('showInstructionsBtn').addEventListener('click', showInstructions);
  document.getElementById('closeModalBtn').addEventListener('click', closeModal);
  document.getElementById('instructionsModal').addEventListener('click', (e) => {
    if (e.target.id === 'instructionsModal') closeModal();
  });

  // Add Channel Management
  document.getElementById('addChannelBtn').addEventListener('click', showAddChannelModal);
  document.getElementById('closeAddChannelModalBtn').addEventListener('click', closeAddChannelModal);
  document.getElementById('addChannelModal').addEventListener('click', (e) => {
    if (e.target.id === 'addChannelModal') closeAddChannelModal();
  });
  document.getElementById('confirmAddChannelBtn').addEventListener('click', handleAddChannel);

  // Delete Confirmation Modal
  document.getElementById('closeDeleteModalBtn').addEventListener('click', closeDeleteModal);
  document.getElementById('cancelDeleteBtn').addEventListener('click', closeDeleteModal);
  document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDelete);
  document.getElementById('deleteConfirmModal').addEventListener('click', (e) => {
    if (e.target.id === 'deleteConfirmModal') closeDeleteModal();
  });

  // Search - Only trigger on Enter key
  const searchInput = document.getElementById('searchInput');

  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      performSearch(e.target.value.trim());
    }
  });
}

// Add Channel Functions
function showAddChannelModal() {
  document.getElementById('addChannelModal').classList.add('active');
}

function closeAddChannelModal() {
  document.getElementById('addChannelModal').classList.remove('active');
  document.getElementById('channelUrl').value = '';
}

async function handleAddChannel() {
  const urlInput = document.getElementById('channelUrl');
  const categoryInput = document.getElementById('channelCategory');
  const url = urlInput.value.trim();
  const category = categoryInput.value;

  if (!url) {
    alert('Please enter a YouTube channel URL');
    return;
  }

  // Extract Handle or ID
  // Supports: youtube.com/@handle, youtube.com/channel/ID, youtube.com/c/Name
  let handle = '';
  let id = '';

  try {
    if (url.includes('@')) {
      const parts = url.split('@');
      handle = parts[parts.length - 1].split('/')[0];
    } else if (url.includes('/channel/')) {
      id = url.split('/channel/')[1].split('/')[0];
    } else {
      alert('Please use a URL with a handle (@Name) or channel ID');
      return;
    }

    const confirmBtn = document.getElementById('confirmAddChannelBtn');
    const originalText = confirmBtn.textContent;
    confirmBtn.textContent = 'Verifying...';
    confirmBtn.disabled = true;

    // Resolve details if possible
    let displayName = handle || id;
    let finalId = id;

    if (!finalId && apiKey) {
      finalId = await getChannelIdFromHandle(handle);
    }

    if (finalId && apiKey) {
      // Get real name if we have API key
      // Reuse search or channels API?
      // Let's just store what we have for now, improved metadata fetching can be done later
      // But user wants "Add" so let's try to verify it exists
    } else if (!finalId && !apiKey) {
      // Allow adding without verification if no API key, but warn
      // Actually we need ID for search.
      // If we only have handle, we can't search without API key resolving it first.
      // But we can store it and resolve later.
    }

    const newChannel = {
      id: finalId, // Might be null if handle-based and no API key yet
      handle: handle,
      displayName: handle || 'Custom Channel', // Placeholder
      url: url,
      category: category,
      isCustom: true
    };

    // If we have API key, try to fetch proper name
    if (apiKey && (finalId || handle)) {
      try {
        const query = finalId ? `id=${finalId}` : `forHandle=${handle}`;
        const resp = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet,id&${query}&key=${apiKey}`);
        const data = await resp.json();
        if (data.items && data.items.length > 0) {
          const item = data.items[0];
          newChannel.id = item.id;
          newChannel.displayName = item.snippet.title;
          // newChannel.handle = item.snippet.customUrl.replace('@', ''); // Optional
        } else {
          alert('Channel not found. Please check the URL.');
          confirmBtn.textContent = originalText;
          confirmBtn.disabled = false;
          return;
        }
      } catch (e) {
        console.error('Error verifying channel', e);
      }
    }

    customChannels.push(newChannel);
    localStorage.setItem('customChannels', JSON.stringify(customChannels));

    // Update Cache if we found ID
    if (newChannel.id && newChannel.handle) {
      channelIdCache[newChannel.handle] = newChannel.id;
      localStorage.setItem('channelIdCache', JSON.stringify(channelIdCache));
    }

    loadChannelsData();
    closeAddChannelModal();
    alert(`Channel "${newChannel.displayName}" added successfully!`);

    confirmBtn.textContent = originalText;
    confirmBtn.disabled = false;

  } catch (error) {
    console.error(error);
    alert('Invalid URL format');
    document.getElementById('confirmAddChannelBtn').textContent = 'Add Channel';
    document.getElementById('confirmAddChannelBtn').disabled = false;
  }
}

// API Key Management
function saveApiKey() {
  const input = document.getElementById('apiKeyInput');
  const key = input.value.trim();

  if (!key) {
    alert('Please enter a valid API key');
    return;
  }

  apiKey = key;
  localStorage.setItem('youtubeApiKey', key);
  updateAPIStatus(true);

  const searchSection = document.getElementById('searchSection');
  searchSection.style.opacity = '1';
  searchSection.style.pointerEvents = 'auto';
}

function updateAPIStatus(active) {
  const indicator = document.getElementById('statusIndicator');
  const text = document.getElementById('statusText');
  const quotaContainer = document.getElementById('quotaContainer');

  if (active) {
    indicator.classList.add('active');
    text.textContent = 'API key configured ✓';
    if (quotaContainer) quotaContainer.style.display = 'block';
  } else {
    indicator.classList.remove('active');
    text.textContent = 'No API key set';
    if (quotaContainer) quotaContainer.style.display = 'none';
  }
}

function showInstructions() {
  document.getElementById('instructionsModal').classList.add('active');
}

function closeModal() {
  document.getElementById('instructionsModal').classList.remove('active');
}

// Channel ID Resolution
async function resolveAllChannelIds() {
  const allChannels = channelsData.flatMap(cat => cat.channels);

  for (const channel of allChannels) {
    if (!channelIdCache[channel.handle]) {
      const channelId = await getChannelIdFromHandle(channel.handle);
      if (channelId) {
        channelIdCache[channel.handle] = channelId;
        localStorage.setItem('channelIdCache', JSON.stringify(channelIdCache)); // Save to cache
      }
    }
  }
}

async function getChannelIdFromHandle(handle) {
  if (!apiKey) return null;

  try {
    const url = `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${handle}&key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.items && data.items.length > 0) {
      return data.items[0].id;
    }
  } catch (error) {
    console.error(`Error resolving channel ${handle}:`, error);
  }

  return null;
}

// Display Channels
function displayChannels() {
  const container = document.getElementById('categoriesContainer');
  container.innerHTML = '';

  channelsData.forEach(category => {
    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'category';

    const categoryTitle = document.createElement('h3');
    categoryTitle.className = 'category-title';
    categoryTitle.textContent = category.name;
    categoryDiv.appendChild(categoryTitle);

    const channelsGrid = document.createElement('div');
    channelsGrid.className = 'channels-grid';

    category.channels.forEach(channel => {
      const channelCard = document.createElement('a');
      channelCard.className = 'channel-card';
      channelCard.href = channel.url;
      channelCard.target = '_blank';
      channelCard.rel = 'noopener noreferrer';

      channelCard.innerHTML = `
        <div class="channel-icon">📺</div>
        <div class="channel-name">${channel.displayName}</div>
        <div class="channel-handle">@${channel.handle}</div>
      `;

      // Add delete button to ALL channels
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'channel-delete-btn';
      deleteBtn.innerHTML = '🗑️';
      deleteBtn.title = 'Remove channel';
      deleteBtn.setAttribute('aria-label', 'Delete channel');

      deleteBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        deleteChannel(channel.id, channel.displayName);
      });

      channelCard.appendChild(deleteBtn);

      channelsGrid.appendChild(channelCard);
    });

    categoryDiv.appendChild(channelsGrid);
    container.appendChild(categoryDiv);
  });
}

// Create Filter Chips
function createFilters() {
  const filtersContainer = document.getElementById('searchFilters');
  filtersContainer.innerHTML = '';

  // Add "All Channels" filter
  const allChip = createFilterChip('All Channels', 'all');
  allChip.classList.add('active');
  activeFilters.add('all');
  filtersContainer.appendChild(allChip);

  // Add individual channel filters
  channelsData.forEach(category => {
    category.channels.forEach(channel => {
      const chip = createFilterChip(channel.displayName, channel.id);
      filtersContainer.appendChild(chip);
    });
  });
}

function createFilterChip(label, value) {
  const chip = document.createElement('button');
  chip.className = 'filter-chip';
  chip.textContent = label;
  chip.dataset.filter = value;

  chip.addEventListener('click', () => {
    if (value === 'all') {
      // Clear all filters and activate "All"
      document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeFilters.clear();
      activeFilters.add('all');
    } else {
      // Remove "All" if active
      const allChip = document.querySelector('[data-filter="all"]');
      allChip.classList.remove('active');
      activeFilters.delete('all');

      // Toggle this filter
      if (activeFilters.has(value)) {
        activeFilters.delete(value);
        chip.classList.remove('active');
      } else {
        activeFilters.add(value);
        chip.classList.add('active');
      }

      // If no filters, activate "All"
      if (activeFilters.size === 0) {
        allChip.classList.add('active');
        activeFilters.add('all');
      }
    }
  });

  return chip;
}

// Search Functionality
async function performSearch(query) {
  if (!apiKey) {
    alert('Please set your YouTube API key first');
    return;
  }

  showLoading();

  try {
    const channelIds = getFilteredChannelIds();

    if (channelIds.length === 0) {
      showError('No channels selected or channel IDs not resolved yet. Please wait a moment and try again.');
      return;
    }

    const videos = [];

    // Search in batches (YouTube API allows searching one channel at a time for better filtering)
    for (const channelId of channelIds) {
      const channelVideos = await searchChannel(channelId, query);
      videos.push(...channelVideos);
    }

    // Sort by relevance (already sorted by API) and display
    displayVideos(videos, query);

  } catch (error) {
    console.error('Search error:', error);
    showError('Search failed. Please check your API key and try again.');
  }
}

function getFilteredChannelIds() {
  if (activeFilters.has('all')) {
    return channelsData.flatMap(cat => cat.channels).map(ch => ch.id).filter(id => id);
  }

  // Active filters contains specific channel IDs
  return Array.from(activeFilters);
}

async function searchChannel(channelId, query) {
  // Use maxResults=20 to ensure we have enough videos after filtering Shorts
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&q=${encodeURIComponent(query)}&type=video&maxResults=20&order=relevance&key=${apiKey}`;

  updateQuota(100); // 100 units for search.list

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.items) {
      const videos = data.items.map(item => ({
        videoId: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails.medium.url,
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt
      }));

      // Filter out Shorts (less than 60 seconds)
      return await filterShorts(videos);
    }
  } catch (error) {
    console.error(`Error searching channel ${channelId}:`, error);
  }

  return [];
}

async function filterShorts(videos) {
  if (videos.length === 0) return [];

  const videoIds = videos.map(v => v.videoId).join(',');
  const url = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds}&key=${apiKey}`;

  updateQuota(1); // 1 unit for videos.list

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.items) {
      const durationMap = {};
      data.items.forEach(item => {
        durationMap[item.id] = parseDuration(item.contentDetails.duration);
      });

      return videos.filter(video => {
        const duration = durationMap[video.videoId];
        // Filter out videos <= 60 seconds (Shorts)
        return duration > 60;
      });
    }
  } catch (error) {
    console.error('Error filtering shorts:', error);
    // Return original videos if specific details fetch fails, to avoid breaking search
    return videos;
  }
  return videos;
}

function parseDuration(duration) {
  if (!duration) return 0;
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return 0;

  const hours = (parseInt(match[1]) || 0);
  const minutes = (parseInt(match[2]) || 0);
  const seconds = (parseInt(match[3]) || 0);
  return hours * 3600 + minutes * 60 + seconds;
}

// Display Functions
function showLoading() {
  const resultsSection = document.getElementById('resultsSection');
  const videosGrid = document.getElementById('videosGrid');

  resultsSection.classList.remove('hidden');
  videosGrid.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      <p>Searching your curated channels...</p>
    </div>
  `;
}

function displayVideos(videos, query) {
  const resultsSection = document.getElementById('resultsSection');
  const resultsInfo = document.getElementById('resultsInfo');
  const videosGrid = document.getElementById('videosGrid');

  resultsSection.classList.remove('hidden');

  if (videos.length === 0) {
    resultsInfo.textContent = `No results found for "${query}"`;
    videosGrid.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔍</div>
        <p>No videos found. Try a different search term.</p>
      </div>
    `;
    return;
  }

  resultsInfo.textContent = `Found ${videos.length} video${videos.length !== 1 ? 's' : ''} for "${query}"`;

  videosGrid.innerHTML = '';
  videos.forEach(video => {
    const videoCard = createVideoCard(video);
    videosGrid.appendChild(videoCard);
  });

  // Scroll to results
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function createVideoCard(video) {
  const card = document.createElement('a');
  card.className = 'video-card';
  card.href = `https://www.youtube.com/watch?v=${video.videoId}`;
  card.target = '_blank';
  card.rel = 'noopener noreferrer';

  const publishDate = new Date(video.publishedAt);
  const timeAgo = getTimeAgo(publishDate);

  card.innerHTML = `
    <div class="video-thumbnail">
      <img src="${video.thumbnail}" alt="${escapeHtml(video.title)}">
      <div class="play-overlay">▶</div>
    </div>
    <div class="video-info">
      <div class="video-title">${escapeHtml(video.title)}</div>
      <div class="video-channel">${escapeHtml(video.channelTitle)}</div>
      <div class="video-meta">
        <span>${timeAgo}</span>
      </div>
    </div>
  `;

  return card;
}

function hideResults() {
  const resultsSection = document.getElementById('resultsSection');
  resultsSection.classList.add('hidden');
}

function showError(message) {
  const resultsSection = document.getElementById('resultsSection');
  const videosGrid = document.getElementById('videosGrid');

  resultsSection.classList.remove('hidden');
  videosGrid.innerHTML = `
    <div class="empty-state">
      <div class="empty-state-icon">⚠️</div>
      <p>${escapeHtml(message)}</p>
    </div>
  `;
}

// Utility Functions
function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);

  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60
  };

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return `${interval} ${unit}${interval !== 1 ? 's' : ''} ago`;
    }
  }

  return 'Just now';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Quota Tracker Functions
function initQuotaTracker() {
  resetQuotaIfNeeded();
  updateQuotaUI();

  // Show if API key exists
  if (apiKey) {
    const qc = document.getElementById('quotaContainer');
    if (qc) qc.style.display = 'block';
  }
}

function resetQuotaIfNeeded() {
  const today = new Date().toDateString();
  const stored = JSON.parse(localStorage.getItem('quotaTracker') || '{}');

  if (stored.date !== today) {
    localStorage.setItem('quotaTracker', JSON.stringify({
      date: today,
      used: 0
    }));
  }
}

function updateQuota(cost) {
  resetQuotaIfNeeded();
  const stored = JSON.parse(localStorage.getItem('quotaTracker') || '{"used":0, "date":""}');
  stored.used = (stored.used || 0) + cost;
  localStorage.setItem('quotaTracker', JSON.stringify(stored));
  updateQuotaUI();
}

function updateQuotaUI() {
  const stored = JSON.parse(localStorage.getItem('quotaTracker') || '{"used":0}');
  const used = stored.used || 0;
  const limit = 10000;
  const percentage = Math.min((used / limit) * 100, 100);

  const fill = document.getElementById('quotaFill');
  const text = document.getElementById('quotaText');

  if (fill && text) {
    fill.style.width = `${percentage}%`;
    text.textContent = `${used.toLocaleString()} / ${limit.toLocaleString()}`;

    // Color change based on usage
    if (percentage > 90) {
      fill.style.background = '#f44336'; // Red
    } else if (percentage > 70) {
      fill.style.background = '#ff9800'; // Orange
    } else {
      fill.style.background = 'linear-gradient(90deg, #4CAF50, #8BC34A)'; // Green
    }
  }
}
