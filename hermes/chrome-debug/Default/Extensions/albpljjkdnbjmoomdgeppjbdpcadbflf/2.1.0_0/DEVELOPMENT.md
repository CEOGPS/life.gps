# Development Notes

## Architecture Overview

### Content Script (`js/content.js`)
The main extraction engine that runs on Facebook pages.

```
┌─────────────────────────────────────────────────────────────┐
│                     INITIALIZATION                          │
│  init() → createExtractButton() → runAutoExtract()         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   PAGE DETECTION                            │
│  isExtractablePage() checks URL against excluded paths      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    EXTRACTION                               │
│  performExtraction() → smartExtract()                       │
│       ├── extractFromIntro()                               │
│       └── extractFromAbout() (fallback)                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  DATA DETECTION                             │
│  DataDetector namespace handles type identification:        │
│  - isEmail(), isPhone(), isUrl(), isAddress()              │
│  - isWork(), isPastWork(), isEducation()                   │
│  - isCategory(), isRating(), etc.                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                PLATFORM DETECTION                           │
│  PlatformDetector.detect() maps URLs to platform names      │
│  375+ platforms supported                                   │
└─────────────────────────────────────────────────────────────┘
```

### Background Script (`background.js`)
Service worker handling subscription and data storage.

```
┌─────────────────────────────────────────────────────────────┐
│                  MESSAGE HANDLERS                           │
│  saveData    → Store extracted data + increment count       │
│  canExtract  → Check daily limit or premium status          │
│  getDailyStats → Return remaining extractions               │
└─────────────────────────────────────────────────────────────┘
```

### Popup Script (`js/popup.js`)
UI logic for the extension popup.

```
┌─────────────────────────────────────────────────────────────┐
│                      POPUP UI                               │
│  initApp() → checkUserStatus() → updateUIForUserState()    │
│                                                             │
│  CSV Export: getAllColumns() → convertToCSV() → download   │
└─────────────────────────────────────────────────────────────┘
```

## Key Design Decisions

### 1. Intro-First Extraction Strategy
We extract from the Intro section first because:
- It's visible on the main profile page
- Contains most commonly needed data
- Reduces navigation for users

Fallback to About page when Intro has < 2 fields.

### 2. Debounced URL Observation
Facebook is a SPA (Single Page Application). We use MutationObserver with 300ms debounce to detect navigation without performance impact.

```javascript
// OLD (expensive): Fires thousands of times
observer.observe(document.body, { subtree: true, childList: true });

// NEW (efficient): Debounced + targeted
const observeTarget = document.querySelector('[role="main"]') || document.body;
observer.observe(observeTarget, { subtree: true, childList: true });
```

### 3. Session-Based Duplicate Prevention
We track extracted URLs in a Set during the session:
```javascript
const extractedUrlsThisSession = new Set();
```

This prevents accidental re-extraction but allows re-extracting after tab refresh.

### 4. Safe Message Wrapper
Chrome extension context can invalidate (e.g., extension update). The `safeMessage()` wrapper handles this gracefully:

```javascript
function safeMessage(message) {
  return new Promise((resolve) => {
    try {
      if (!chrome.runtime?.id) {
        resolve(null);
        return;
      }
      // ... send message
    } catch (e) {
      resolve(null);
    }
  });
}
```

## Configuration Reference

### content.js CONFIG
```javascript
const CONFIG = {
  INIT_DELAY: 2000,           // Wait for FB to load
  AUTO_EXTRACT_DELAY: 500,    // After button creation
  URL_CHECK_DEBOUNCE: 300,    // SPA navigation check
  EXTRACTION_TIMEOUT: 10000,  // Max extraction time
  MAX_NAME_LENGTH: 100,       // Name validation
  MIN_DESCRIPTION_LENGTH: 20, // Description minimum
  MAX_DESCRIPTION_LENGTH: 500 // Description truncation
};
```

### background.js CONFIG
```javascript
const CONFIG = {
  DAILY_FREE_LIMIT: 25,       // Free tier limit
  TRIAL_DAYS: 7,              // Trial duration
  MAX_STORED_RECORDS: 10000   // Storage cap
};
```

### popup.js CONFIG
```javascript
const CONFIG = {
  TRIAL_DAYS: 7,
  DAILY_FREE_LIMIT: 25,
  PROMO: {
    code: 'GET50',
    discount: '50% off',
    enabled: true
  }
};
```

## Testing Checklist

### Page Types
- [ ] Personal profile (facebook.com/username)
- [ ] Page (facebook.com/pagename)
- [ ] Profile with ID (facebook.com/profile.php?id=123)
- [ ] Profile popup from Friends page
- [ ] About page (/about)

### Data Fields
- [ ] Name extraction
- [ ] Verified badge detection
- [ ] Email detection
- [ ] Phone detection (multiple)
- [ ] Work (current and past)
- [ ] Education
- [ ] Location (Lives in + Hometown)
- [ ] Social links (various platforms)
- [ ] Website URLs
- [ ] Category
- [ ] Rating and reviews
- [ ] Followers/Friends count

### Edge Cases
- [ ] Private profiles
- [ ] Profiles with minimal data
- [ ] Non-English profiles
- [ ] Very long descriptions
- [ ] Multiple social links of same platform
- [ ] Rapid page navigation

### Error Scenarios
- [ ] Extension context invalidated
- [ ] Network timeout
- [ ] Daily limit reached
- [ ] Already extracted profile

## Performance Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Init to button visible | < 3s | ~2s |
| Extraction time | < 5s | ~1-2s |
| MutationObserver callbacks | < 10/sec | ~3/sec |
| Memory usage | < 50MB | ~20MB |

## Stability Fixes Applied (v2.1.1 → v2.2.0)

| Issue | Status | Solution |
|-------|--------|----------|
| Race condition | ✅ Fixed | Chained timeouts |
| MutationObserver performance | ✅ Fixed | Debounce + targeted observe |
| Missing error handling | ✅ Fixed | safeMessage() wrapper |
| Duplicate extractions | ✅ Fixed | Session URL tracking |
| Storage growth | ✅ Fixed | 10,000 record limit |
| Extraction hangs | ✅ Fixed | 10s timeout |
| Memory leaks | ✅ Fixed | State reset on navigation |
| Console log noise | ✅ Fixed | DEBUG flag toggle |

## Future Improvements

### Planned
- [ ] Retry logic for failed extractions (exponential backoff)
- [ ] Batch extraction from Friends list
- [ ] Cloud sync for extracted data
- [ ] Export to Google Sheets
- [ ] Browser notification preferences

### Under Consideration
- [ ] LinkedIn support
- [ ] Instagram profile extraction
- [ ] Custom field mapping
- [ ] API integration for CRMs

## Debugging Tips

### Enable Debug Logging
```javascript
// In content.js, change:
const DEBUG = true;
```

### Monitor Chrome Storage
```javascript
// In DevTools console:
chrome.storage.local.get(null, console.log);
```

### Check Daily Stats
```javascript
// In DevTools console:
chrome.runtime.sendMessage({ action: "getDailyStats" }, console.log);
```

### Force State Reset
```javascript
// In DevTools console:
chrome.storage.local.clear();
```

## Release Process

1. Update version in `manifest.json`
2. Update version badge in `README.md`
3. Update CHANGELOG section in `README.md`
4. Test on fresh Chrome profile
5. Create git tag: `git tag v2.2.0`
6. Push: `git push origin main --tags`
7. Package for Chrome Web Store

---

Last updated: 2024
