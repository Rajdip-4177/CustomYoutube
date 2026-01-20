# Configuration Template

## Required Environment Variables

Copy these to your configuration files:

### Firebase Config (`lib/firebase-init.js`)

```javascript
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### Supabase Config (`lib/supabase-sync.js`)

```javascript
const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY_HERE';
```

### Master Account Info

- **Email**: rajdipmahanty2625dskdav@gmail.com
- **YouTube API Key**: AIzaSyCpZ5FWXmH9pt5F3ECxMA8TOgHisllWfo8

### GitHub Pages URL

Current: `https://rajdip-4177.github.io/CustomYoutube/`

If changing, update in:
- `rules.json` (all redirect actions)
- `popup/popup.js` (`handleOpenPortal` function)
- `content/youtube-checker.js` (focus overlay button)

---

## Quick Start Checklist

- [ ] Create Firebase project
- [ ] Enable Google Authentication in Firebase
- [ ] Get Firebase config object
- [ ] Create Supabase project
- [ ] Run SQL schema in Supabase
- [ ] Get Supabase URL and anon key
- [ ] Update `lib/firebase-init.js` with Firebase config
- [ ] Update `lib/supabase-sync.js` with Supabase credentials
- [ ] Load extension in Chrome
- [ ] Test login flow
- [ ] Test data sync
- [ ] Deploy web app to GitHub Pages
- [ ] Test full blocking + redirect flow
