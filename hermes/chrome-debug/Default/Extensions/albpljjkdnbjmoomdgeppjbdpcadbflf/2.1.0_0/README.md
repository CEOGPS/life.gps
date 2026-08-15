# <img src="icons/logo.png" alt="Logo" width="32" height="32" style="vertical-align: middle;"> Extract My Leads

![Version](https://img.shields.io/badge/version-2.1.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Chrome](https://img.shields.io/badge/Chrome-Extension-4285F4?logo=googlechrome&logoColor=white)
![Platforms](https://img.shields.io/badge/platforms-375%2B-brightgreen.svg)

> **Extract contact info from Facebook profiles, pages & groups. Emails, phones, social links & 30+ data points. One-click CSV export.**

## ✨ What It Does

Extract My Leads automatically captures contact information from Facebook profiles, pages, and groups—saving you hours of manual data entry. Perfect for sales, marketing, recruiting, and lead generation.

**One click. All contacts. CSV ready.**

## 🎯 Key Features

### Smart Extraction
- **One-click extraction** from any Facebook profile, page, or group
- **Auto-extraction mode** for hands-free data capture (Premium)
- **Extract More Data flow** — automatically navigates to About page for additional data
- **Smart merge** — combines data from multiple page sections without duplicates

### 375+ Platform Detection
Automatically identifies and extracts social links from 375+ platforms including social media, messaging apps, video platforms, music services, professional networks, business tools, e-commerce sites, and more.

### Data Fields Captured

| Category | Fields |
|----------|--------|
| **Identity** | Name, Verified Badge ✓, Category |
| **Contact** | Email, Phone, Phone 2 |
| **Location** | City, Hometown, Full Address |
| **Work** | Current Work (×3), Past Work (×2) |
| **Education** | Schools (×3) |
| **Stats** | Followers, Following, Likes, Friends |
| **Business** | Rating, Reviews, Price Range, Services |
| **Social** | All detected platform links (375+) |
| **Channels** | Messenger/Telegram/WhatsApp/Discord channel info |
| **Groups** | Members, Admins, Activity Stats, Group Rules, Created Date |
| **Other** | Website (×3), Description, Facebook URL |

## 📦 Installation

### Chrome Web Store
1. Visit the [Chrome Web Store listing](#)
2. Click "Add to Chrome"
3. Done! The extension icon appears in your toolbar

### Developer Mode
```bash
git clone https://github.com/krofile/extract-my-leads.git
```
1. Open `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked" → select the cloned folder

## 🚀 How To Use

### Basic Extraction
1. Go to any Facebook profile, page, or group
2. Look for the **Extract Data** button
3. Click it — data is captured instantly
4. Open the extension popup to view and download

### Extract More Data (Get All Data)
1. Extract from the main profile/page → captures visible info
2. Click **Extract More Data** → auto-navigates to About page
3. Additional data is merged automatically
4. Button shows **Complete** ✓ when finished

### Export to CSV
1. Click the extension icon in Chrome toolbar
2. See your extracted contacts listed (separate tabs for Pages and Groups)
3. Click **Download CSV**
4. Open in Excel, Google Sheets, or any CRM

## 💰 Pricing

| Plan | Price | Daily Extractions | Features |
|------|-------|-------------------|----------|
| **Free** | $0 | 25/day | Basic extraction, CSV export |
| **Pro** | $9.99/mo | Unlimited | Auto-extraction, priority support |
| **Lifetime** | $49.99 | Unlimited | All features, forever |

🔥 **Use code GET50 for 50% off Lifetime access!**

Free plan resets daily at midnight.

## 🛠 Technical Details

### Supported Pages
- ✅ Facebook profiles (`facebook.com/username`)
- ✅ Facebook pages (`facebook.com/pagename`)
- ✅ Facebook groups (`facebook.com/groups/groupname`)
- ✅ Profile popups (on Friends page)
- ✅ About pages (auto-merge)

### Not Supported
- ❌ Facebook homepage/feed
- ❌ Groups feed (`/groups/feed`)
- ❌ Marketplace, Watch
- ❌ Messages, Settings, Stories
- ❌ Private/restricted profiles

### Smart Features
- **Auto-reload** — retries once if extraction fails
- **Content waiting** — waits up to 5s for page to load
- **Duplicate prevention** — won't extract same profile twice per session
- **Quality filters** — excludes footer text, empty states, irrelevant content
- **Storage limit** — keeps last 10,000 records to prevent bloat

### Short URL Support
Automatically resolves shortened links:
`t.co`, `youtu.be`, `lnkd.in`, `vm.tiktok.com`, `fb.me`, `wa.me`, `t.me`, `redd.it`, `amzn.to`, `bit.ly`, and more.

## 📁 Project Structure

```
extract-my-leads/
├── manifest.json      # Chrome extension manifest (v3)
├── background.js      # Service worker, storage, limits
├── popup.html         # Extension popup UI
├── js/
│   ├── content.js     # Extraction engine (375+ platforms)
│   ├── popup.js       # Popup logic, CSV export
│   └── ExtPay.js      # Payment integration
├── css/
│   └── popup.css      # Popup styles
├── icons/             # Extension icons
└── README.md
```

## 🔧 Development

### Debug Mode
Enable console logging in `js/content.js`:
```javascript
const DEBUG = true;
```

### Testing
1. Load extension in developer mode
2. Navigate to Facebook profiles/pages
3. Check console for `[EML]` prefixed logs
4. Verify data in popup

### Code Standards
- ES6+ with `'use strict'`
- JSDoc comments on all functions
- `camelCase` functions, `UPPER_SNAKE` constants
- Modular sections with clear separators

## 📋 Changelog

### v2.1.0 — Facebook Groups Support
**New: Groups Extraction**
- Full Facebook Groups support — extract group data with one click
- Group-specific fields: Members, Admins, Activity Stats, Group Rules, Created Date
- Auto-navigation to group About page for complete data
- Separate Groups tab in popup with dedicated CSV export
- Smart duplicate detection with URL normalization

**UI Improvements**
- Renamed buttons: "Extract" → "Extract Data", "Extract More" → "Extract More Data"
- Button now appears on all Facebook pages
- Shows contextual message when on non-extractable pages:
  - On `/groups/feed`: "Please go inside the group to extract the data"
  - On other pages: "Please go to a Facebook Page or Profile to extract data"
- Added Extract My Leads logo icon to all action buttons

**Bug Fixes**
- Fixed button visibility on `/groups/feed` and other groups system pages
- Removed dead code and unused button states
- Code cleanup and optimization

### v2.0.1 — Bug Fixes & ExtPay Upgrade
**ExtPay Payment System**
- Upgraded ExtPay.js to v3.1.0 (multiple-plans branch)
- Fixed deprecation warning on payment pages
- Fixed logout to properly clear ExtPay storage
- Updated user dropdown based on subscription status:
  - Trial users: "🚀 Upgrade to Pro" button
  - Pro subscribers: "⚙️ Manage Subscription" button
  - Lifetime users: No manage button (nothing to manage)

**Bug Fixes**
- Fixed Address being captured as Description
- Fixed Description text missing spaces between lines
- Fixed workplace names (e.g., "D.R. Horton") incorrectly detected as URLs
- Fixed user dropdown hidden behind content (z-index issue)
- Fixed Extract button not showing on friend suggestions page
- Added auto-extract on reload after button pressed once
- Removed Hours field (Open now/Closed not needed)

**Chrome Web Store**
- Fixed icon sizes (icon48.png was 40x40, now 48x48)
- Fixed manifest paths (removed ./ prefix)

### v2.0.0 — Major Release
**Platform Detection**
- Expanded to 375+ platforms (was 200+)
- Added 17 short URL domains
- Added hosting platforms (Vercel, Netlify, GitHub Pages)
- Added video conferencing (Zoom, Meet, Teams)
- Added e-commerce (Amazon, eBay, Poshmark, StockX)
- Added education (Udemy, Coursera, Skillshare)
- Added community (Circle, Skool, Discord)
- Added Krofile + dbp.to short URL

**New Extraction**
- Channel extraction (Messenger, Telegram, WhatsApp, Discord)
- City column (separate from Address)
- Services extraction (Dine-in, Reservations, etc.)
- Stats extraction (Followers, Following, Likes)

**Improvements**
- Fixed daily limit display (now shows used/total)
- Better column ordering (Email/Phone before Description)
- Enhanced X/Twitter handle detection
- Improved address/education validation
- Contact Us block handling with email fallback

**Performance**
- O(1) platform lookup with hash table
- Smart content waiting (300ms intervals)
- Auto-reload on extraction failure

### v1.x Legacy
- Initial release with core extraction
- 200+ platform detection
- Intro-first extraction strategy
- Merge logic for About pages
- Auto-extraction mode

## 🐛 Known Limitations

- Private profiles show limited data
- Some profile popups may have incomplete info
- Rapid extractions may trigger Facebook rate limits
- Extension requires page reload after install

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open a Pull Request

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

## 💬 Support

- **Issues**: [GitHub Issues](https://github.com/krofile/extract-my-leads/issues)
- **Email**: support@krofile.com
- **Website**: [krofile.com](https://krofile.com)

---

<p align="center">
  Made with ❤️ by <a href="https://krofile.com">Krofile</a>
</p>

<p align="center">
  <a href="https://krofile.com">
    <img src="icons/logo.png" alt="Extract My Leads" width="64">
  </a>
</p>
