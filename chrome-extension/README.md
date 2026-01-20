# Focused Learning Hub - Chrome Extension

A Chrome extension that blocks YouTube distractions and redirects you to a focused learning portal with whitelisted educational channels.

## 📋 Prerequisites

Before installing, you need:

1. **Firebase Project** (for authentication)
2. **Supabase Project** (for database storage)
3. **YouTube Data API Key** (for video searches)

---

## 🔧 Setup Instructions

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing
3. Enable Google Authentication:
   - Go to Authentication → Sign-in method
   - Enable "Google" provider
4. Get your Firebase config:
   - Go to Project Settings → General
   - Scroll to "Your apps" → Web app
   - Copy the config object

### Step 2: Create Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Create a new project
3. Run this SQL in the SQL Editor:

```sql
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firebase_uid TEXT UNIQUE NOT NULL,
  email TEXT,
  youtube_api_key TEXT,
  whitelist_channels JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own preferences"
ON user_preferences
FOR ALL
USING (firebase_uid = auth.uid())
WITH CHECK (firebase_uid = auth.uid());
```

4. Get your credentials:
   - Go to Settings → API
   - Copy `URL` and `anon public` key

### Step 3: Configure Extension

1. Open `lib/firebase-init.js`
2. Replace placeholders with your Firebase config
3. Open `lib/supabase-sync.js`
4. Replace `SUPABASE_URL` and `SUPABASE_ANON_KEY`

### Step 4: Update GitHub Pages URL (Optional)

If hosting on a different URL:
1. Open `rules.json`
2. Replace `https://rajdip-4177.github.io/CustomYoutube/` with your URL

### Step 5: Load Extension in Chrome

1. Open Chrome → Extensions (`chrome://extensions/`)
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `chrome-extension` folder
5. Extension should now be active!

---

## 🎯 How It Works

### Blocking Logic

1. **All YouTube traffic** → Redirected to GitHub Pages portal
2. **Exception**: `/embed/*` URLs → Allowed (for video playback)
3. **Exception**: `googleapis.com` → Allowed (for API calls)
4. **Direct video links** → Checked against whitelist, blocked if not whitelisted

### Data Flow

```
User Signs In (Firebase)
    ↓
Get ID Token
    ↓
Authenticate with Supabase
    ↓
Fetch user_preferences (API key + whitelist)
    ↓
Store in chrome.storage.local
    ↓
GitHub Pages portal requests data
    ↓
Content script provides data via postMessage
```

### Sync Strategy

- **On login**: Full sync from Supabase
- **Every 30 min**: Automatic background sync
- **Manual**: Click "Sync Now" in popup
- **Multi-device**: All devices stay in sync via Supabase

---

## 🔑 API Key Setup

### For Users:

1. Click extension icon
2. Sign in with Google
3. Paste your YouTube API Key
4. Click "Save"

Your key is encrypted and synced across all your devices.

### For Admin (Master Account):

The master account (`rajdipmahanty2625dskdav@gmail.com`) has pre-configured:
- API Key: `AIzaSyCpZ5FWXmH9pt5F3ECxMA8TOgHisllWfo8`
- All 14 Physics Wallah channels whitelisted

---

## 📁 File Structure

```
chrome-extension/
├── manifest.json              # Extension configuration
├── background.js              # Service worker (auth, sync)
├── rules.json                 # URL blocking rules
├── popup/
│   ├── popup.html            # Extension popup UI
│   ├── popup.js              # Popup logic
│   └── popup.css             # Popup styles
├── content/
│   ├── github-handshake.js   # GitHub Pages communication
│   ├── youtube-checker.js    # Video whitelist checker
│   └── focus-overlay.css     # Blocked video overlay
└── lib/
    ├── firebase-init.js      # Firebase config
    └── supabase-sync.js      # Supabase integration
```

---

## 🐛 Troubleshooting

### Extension not blocking YouTube

- Check if extension is enabled in `chrome://extensions/`
- Verify rules.json has correct URLs
- Try reloading the extension

### Login not working

- Verify Firebase config in `lib/firebase-init.js`
- Check Firebase Console → Authentication is enabled
- Open DevTools → Console for error messages

### Data not syncing

- Verify Supabase credentials in `lib/supabase-sync.js`
- Check Supabase Dashboard → Table Editor → user_preferences
- Click "Sync Now" in extension popup

### Videos still playing on YouTube

- This is expected if URL is `/embed/*`
- Direct `/watch` URLs should show focus overlay
- Check whitelist in extension popup

---

## 📝 Master Account Setup

To populate the master account with all channels:

1. Sign in as `rajdipmahanty2625dskdav@gmail.com`
2. The first login will create an empty entry
3. Manually update in Supabase SQL Editor:

```sql
UPDATE user_preferences
SET 
  youtube_api_key = 'AIzaSyCpZ5FWXmH9pt5F3ECxMA8TOgHisllWfo8',
  whitelist_channels = '[
    {"id": "UCVs9oKvZbUe0Mq9zBL62ZSw", "handle": "Class9-NEEV", "displayName": "Class 9 - NEEV"},
    {"id": "UCwCloZGOqRB_JHtgDKKJZbw", "handle": "Class10-UDAAN", "displayName": "Class 10 - UDAAN"},
    ...
  ]'::jsonb
WHERE email = 'rajdipmahanty2625dskdav@gmail.com';
```

(Full channel list is in `app.js` → `CHANNELS_DATA`)

---

## 🚀 Deployment to GitHub Pages

1. Push your code to GitHub repository
2. Go to Settings → Pages
3. Source: Deploy from branch `main`
4. Your portal will be at: `https://USERNAME.github.io/REPO_NAME/`

---

## 📄 License

Built with focus. Powered by Firebase, Supabase, and determination.
