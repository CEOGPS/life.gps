/**
 * Extract My Leads - Content Script
 * @version 2.1.0
 * @description Facebook profile/page/group data extraction with auto-extract and smart detection
 * 
 * Features:
 * - Auto-extraction on page load
 * - Auto-reload on extraction failure
 * - Smart wait for content loading
 * - Intro-first extraction with About page fallback
 * - 375+ social platform detection
 * - Duplicate prevention per session
 * - Multiple entries support (Work 2, Instagram 2, etc.)
 * - Stats extraction (Followers, Following, Likes)
 * - Services extraction
 * - Improved City/Address detection
 * - Facebook Groups extraction with auto-navigation
 * 
 * @author Krofile
 * @license MIT
 */

'use strict';

/* =============================================================================
   CONFIGURATION & CONSTANTS
   ============================================================================= */

const DEBUG = false;

// Logo icon for buttons (base64 encoded)
const LOGO_ICON = 'data:image/png;base64,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';

// Helper to create button HTML with logo
function getButtonHtml(text) {
  return `<img src="${LOGO_ICON}" style="width:16px;height:16px;margin-right:6px;vertical-align:middle;"> ${text}`;
}

/**
 * Debug logging helper
 */
function debugLog(...args) {
  if (DEBUG) {
    console.log('[EML]', ...args);
  }
}

const CONFIG = {
  INIT_DELAY: 2000,
  AUTO_EXTRACT_DELAY: 500,
  URL_CHECK_DEBOUNCE: 300,
  EXTRACTION_TIMEOUT: 10000,
  MAX_NAME_LENGTH: 100,
  MIN_DESCRIPTION_LENGTH: 20,
  MAX_DESCRIPTION_LENGTH: 500,
  SMART_WAIT_MAX: 5000,
  SMART_WAIT_INTERVAL: 300
};

const MESSAGES = {
  EXTRACT_SUCCESS: 'Extracted Successfully!',
  EXTRACT_FAILED: 'Extraction Failed',
  LIMIT_REACHED: 'Daily Limit Reached',
  ALREADY_EXTRACTED: 'Already Extracted',
  CANT_EXTRACT: "Can't Extract Here",
  UPGRADE_PROMPT: 'Upgrade for unlimited extractions!',
  REFRESH_PROMPT: 'Try refreshing the page.',
  GO_TO_PROFILE: 'Please go to a Facebook Page or Profile to extract data.',
  GO_TO_GROUP: 'Please go inside the group to extract the data.'
};

const INVALID_NAMES = [
  // Navigation items
  'home', 'search results', 'friends', 'suggestions', 'marketplace',
  'watch', 'groups', 'gaming', 'menu', 'facebook', 'messenger',
  'notifications', 'create', 'log in', 'sign up', 'people you may know',
  'about', 'photos', 'videos', 'reels', 'events', 'more', 'see all',
  // Settings and system
  'settings', 'settings & privacy', 'help & support', 'display & accessibility',
  'privacy center', 'activity log', 'news feed preferences',
  // Profile sections
  'intro', 'details', 'life events', 'featured', 'work and education',
  'places lived', 'contact and basic info', 'family and relationships',
  'overview', 'transparency', 'privacy and legal info', 'profile transparency',
  // Other UI elements
  'story', 'stories', 'feeds', 'explore', 'saved', 'memories',
  'ad center', 'orders and payments', 'climate science center',
  'fundraisers', 'town hall', 'election', 'covid-19', 'crisis response',
  'jobs', 'blood donations', 'live videos', 'pages', 'page',
  // Common false positives
  'loading', 'error', 'welcome', 'get started', 'continue',
  'profile', 'your profile', 'edit profile', 'view profile',
  // Error messages
  'this browser is not supported', 'something went wrong',
  'content not available', 'page not found', 'error loading',
  'sorry, this content isn\'t available', 'this content isn\'t available right now',
  'the link you followed may be broken', 'this page isn\'t available',
  'couldn\'t load', 'try again', 'refresh the page'
];

const EXCLUDED_PATHS = [
  '/watch', '/marketplace', '/gaming/', '/events/',
  '/pages/', '/help/', '/settings/', '/notifications', '/messages/',
  '/friends', '/bookmarks', '/memories', '/saved', '/offers/',
  '/fundraisers/', '/jobs/', '/climate/', '/crisisresponse/',
  '/login', '/recover', '/signup', '/checkpoint/', '/feeds',
  '/stories/', '/reels/', '/search/', '/hashtag/'
];

// Groups system/landing pages (not actual groups)
const GROUPS_SYSTEM_PAGES = [
  'feed', 'discover', 'joins', 'create', 'browse', 
  'notifications', 'settings', 'search'
];

// Group sub-pages to exclude (after /groups/[id]/)
const EXCLUDED_GROUP_SUBPAGES = [
  '/members', '/files', '/media', '/events', '/search',
  '/photos', '/videos', '/pending_posts', '/member-requests',
  '/reported_content', '/scheduled_posts', '/admin_activities'
];

const SYSTEM_PATHS = [
  'watch', 'marketplace', 'gaming', 'events', 'pages',
  'help', 'settings', 'notifications', 'messages', 'friends',
  'bookmarks', 'memories', 'saved', 'offers', 'fundraisers',
  'jobs', 'climate', 'crisisresponse', 'login', 'recover',
  'signup', 'checkpoint', 'feeds', 'stories', 'reels', 'search',
  'hashtag', 'photo', 'video'
];

/**
 * Validate if a name is a real profile/page name
 * @param {string} name - Name to validate
 * @returns {boolean} True if valid name
 */
function isValidName(name) {
  if (!name || typeof name !== 'string') return false;
  
  const trimmed = name.trim();
  const lower = trimmed.toLowerCase();
  
  // Length checks
  if (trimmed.length < 2 || trimmed.length > CONFIG.MAX_NAME_LENGTH) return false;
  
  // Check against invalid names list
  if (INVALID_NAMES.includes(lower)) return false;
  
  // Check if it's a single common word (likely UI element)
  const singleWordUI = [
    'notification', 'setting', 'message', 'friend', 'group',
    'page', 'profile', 'photo', 'video', 'story', 'reel',
    'event', 'marketplace', 'watch', 'gaming', 'menu'
  ];
  if (singleWordUI.includes(lower)) return false;
  
  // Reject if it contains certain patterns
  const uiPatterns = [
    /^(see|view|show|hide|edit|add|create|delete|remove)\s/i,
    /\s(settings|options|preferences)$/i,
    /^(loading|please wait|error)/i,
    /^\d+\s*(notifications?|messages?|requests?|friends?)/i,
    /^(your|my)\s+(profile|page|account)/i,
    /browser.*not supported/i,
    /something went wrong/i,
    /content.*available/i
  ];
  
  for (const pattern of uiPatterns) {
    if (pattern.test(trimmed)) return false;
  }
  
  return true;
}

/**
 * Clean name by removing verification suffixes
 * @param {string} name - Raw name
 * @returns {{name: string, hadVerified: boolean}} Cleaned name and verification flag
 */
function cleanName(name) {
  if (!name) return { name: null, hadVerified: false };
  
  const hadVerified = /Verified\s*(account|page)?$/i.test(name);
  const cleaned = name
    .replace(/\s*Verified account$/i, '')
    .replace(/\s*Verified Page$/i, '')
    .replace(/\s*Verified$/i, '')
    .trim();
  
  return { name: cleaned, hadVerified };
}

/**
 * Stats patterns to filter out (not real data)
 */
const STATS_PATTERNS = [
  /^[\d,.]+[KMB]?$/, // Just a number: "1.5K", "2,400"
  /^[\d,.]+[KMB]?\s*followers?$/i,
  /^[\d,.]+[KMB]?\s*following$/i,
  /^[\d,.]+[KMB]?\s*friends?$/i,
  /^[\d,.]+[KMB]?\s*mutual$/i,
  /^[\d,.]+[KMB]?\s*(likes?|posts?|photos?|videos?|check-ins?)$/i,
  /[\d,.]+[KMB]?\s*followers?\s*•\s*[\d,.]+[KMB]?\s*following/i, // "4.1K followers • 695 following"
  /[\d,.]+[KMB]?\s*likes?\s*•\s*[\d,.]+[KMB]?\s*followers?/i, // "44K likes • 48K followers"
  /[\d,.]+[KMB]?\s*friends?\s*•\s*[\d,.]+\s*mutual/i, // "2.4K friends • 40 mutual"
  /^[\d,.]+[KMB]?\s*•\s*[\d,.]+[KMB]?/, // "4.1K • 695"
  /^Followed by\s/i, // "Followed by ..."
  /people follow this/i, // "X people follow this"
];

/**
 * Check if text is a stats/engagement pattern
 * @param {string} text - Text to check
 * @returns {boolean} True if stats pattern
 */
function isStatsText(text) {
  if (!text) return false;
  return STATS_PATTERNS.some(p => p.test(text.trim()));
}

/**
 * Extract stats (Followers, Following, Likes) from page
 * @returns {Object} Stats object with Followers, Following, Likes
 */
function extractStats() {
  const stats = {};
  const mainArea = document.querySelector('[role="main"]');
  if (!mainArea) return stats;
  
  const pageText = mainArea.textContent;
  
  // Pattern: "4.4K followers" or "48K followers"
  const followersMatch = pageText.match(/([\d,.]+[KMB]?)\s*followers/i);
  if (followersMatch) {
    stats['Followers'] = followersMatch[1];
  }
  
  // Pattern: "319 following"
  const followingMatch = pageText.match(/([\d,.]+[KMB]?)\s*following/i);
  if (followingMatch) {
    stats['Following'] = followingMatch[1];
  }
  
  // Pattern: "44K likes" (pages)
  const likesMatch = pageText.match(/([\d,.]+[KMB]?)\s*likes/i);
  if (likesMatch) {
    stats['Likes'] = likesMatch[1];
  }
  
  return stats;
}

/**
 * Extract channel information (Messenger, Telegram, WhatsApp, etc.)
 * @param {Element} container - Container element to search in
 * @returns {Object} Channel info with name, url, members
 */
function extractChannelInfo(container) {
  const channelInfo = {};
  if (!container) container = document.querySelector('[role="main"]');
  if (!container) return channelInfo;
  
  // Find all links that could be channels
  const links = container.querySelectorAll('a[href]');
  
  for (const link of links) {
    const href = link.href || '';
    const text = link.textContent.trim();
    
    // Facebook Messenger Channel
    if (href.includes('facebook.com/messages/t/')) {
      // Find channel name and members from link content
      const spans = link.querySelectorAll('span');
      let channelName = '';
      let channelMembers = '';
      
      for (const span of spans) {
        const spanText = span.textContent.trim();
        // Look for "Channel · X members" pattern
        const memberMatch = spanText.match(/channel\s*·?\s*([\d,.]+[KMB]?)\s*members?/i);
        if (memberMatch) {
          channelMembers = memberMatch[1];
        } else if (spanText && !spanText.toLowerCase().includes('channel') && spanText.length > 2) {
          // This is likely the channel name
          if (!channelName) channelName = spanText;
        }
      }
      
      // If no spans found, try the link text directly
      if (!channelName && text) {
        const parts = text.split('\n').map(p => p.trim()).filter(Boolean);
        if (parts.length > 0) channelName = parts[0];
        if (parts.length > 1) {
          const memberMatch = parts[1].match(/([\d,.]+[KMB]?)\s*members?/i);
          if (memberMatch) channelMembers = memberMatch[1];
        }
      }
      
      if (channelName || href) {
        channelInfo['Channel Name'] = channelName || 'Messenger Channel';
        channelInfo['Channel URL'] = href.replace(/\?.*$/, ''); // Remove query params
        if (channelMembers) channelInfo['Channel Members'] = channelMembers;
      }
      break; // Only capture first channel found
    }
    
    // Telegram Channel/Group
    if (href.includes('t.me/') || href.includes('telegram.me/')) {
      const memberMatch = text.match(/([\d,.]+[KMB]?)\s*(?:members?|subscribers?)/i);
      if (!channelInfo['Channel Name']) {
        channelInfo['Channel Name'] = text.split('\n')[0].trim() || 'Telegram';
        channelInfo['Channel URL'] = href;
        if (memberMatch) channelInfo['Channel Members'] = memberMatch[1];
      }
    }
    
    // WhatsApp Channel/Group
    if (href.includes('whatsapp.com/channel/') || href.includes('chat.whatsapp.com/')) {
      if (!channelInfo['Channel Name']) {
        channelInfo['Channel Name'] = text.split('\n')[0].trim() || 'WhatsApp';
        channelInfo['Channel URL'] = href;
      }
    }
    
    // Discord Server
    if (href.includes('discord.gg/') || href.includes('discord.com/invite/')) {
      const memberMatch = text.match(/([\d,.]+[KMB]?)\s*members?/i);
      if (!channelInfo['Channel Name']) {
        channelInfo['Channel Name'] = text.split('\n')[0].trim() || 'Discord';
        channelInfo['Channel URL'] = href;
        if (memberMatch) channelInfo['Channel Members'] = memberMatch[1];
      }
    }
  }
  
  return channelInfo;
}

/**
 * Detect if page is a Page or Profile
 * @returns {string} 'page' or 'profile'
 */
function getPageType() {
  const pageText = document.body.innerText;
  
  // Check for explicit markers - Profile first (more common in extractions)
  // Look for the pattern with the dot separator used in Facebook's UI
  if (/Profile\s*·\s*\w/i.test(pageText)) return 'profile';
  if (/Page\s*·\s*\w/i.test(pageText)) return 'page';
  
  // Check for page-specific elements
  if (document.querySelector('[aria-label="Add friend"]')) return 'profile';
  if (document.querySelector('[aria-label="Follow"]')) return 'page';
  
  // Profiles have friends, pages have followers only
  const hasFriends = /\d+\s*friends/i.test(pageText);
  if (hasFriends) return 'profile';
  
  const hasFollowers = /[\d,.]+[KMB]?\s*followers/i.test(pageText);
  if (hasFollowers) return 'page';
  
  return 'profile'; // Default to profile
}

/* =============================================================================
   UTILITY FUNCTIONS
   ============================================================================= */

function log(...args) {
  if (DEBUG) console.log('[EML]', ...args);
}

/**
 * Smart wait for page content to load
 * Waits until Intro section or key content is detected
 * @param {number} maxWait - Maximum wait time in ms
 * @returns {Promise<boolean>} - True if content found, false if timeout
 */
async function waitForContent(maxWait = CONFIG.SMART_WAIT_MAX) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWait) {
    // Check for Intro section
    const hasIntro = Array.from(document.querySelectorAll('h2, span')).some(
      el => el.textContent.trim() === 'Intro'
    );
    
    // Check for profile name
    const hasName = document.querySelector('[role="main"] h1');
    
    // Check for content indicators
    const mainContent = document.querySelector('[role="main"]');
    const hasContent = mainContent && mainContent.querySelectorAll('span[dir="auto"]').length > 5;
    
    // Check for About page content
    const hasAbout = document.querySelector('[role="main"]')?.textContent?.includes('Contact info') ||
                     document.querySelector('[role="main"]')?.textContent?.includes('Overview');
    
    if (hasIntro || hasAbout || (hasName && hasContent)) {
      log('Content detected, proceeding with extraction');
      return true;
    }
    
    await new Promise(r => setTimeout(r, CONFIG.SMART_WAIT_INTERVAL));
  }
  
  log('Content wait timeout');
  return false;
}

/**
 * Check if we should auto-reload (haven't reloaded for this URL yet)
 * @returns {boolean}
 */
function shouldAutoReload() {
  const reloadKey = `eml_reload_${getNormalizedUrl()}`;
  const hasReloaded = sessionStorage.getItem(reloadKey);
  
  if (!hasReloaded) {
    sessionStorage.setItem(reloadKey, 'true');
    return true;
  }
  return false;
}

/**
 * Clear reload flag for current URL (call after successful extraction)
 */
function clearReloadFlag() {
  const reloadKey = `eml_reload_${getNormalizedUrl()}`;
  sessionStorage.removeItem(reloadKey);
}

function safeMessage(message) {
  return new Promise((resolve) => {
    try {
      if (!chrome.runtime?.id) {
        log('Extension context invalidated');
        resolve(null);
        return;
      }
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          log('Message error:', chrome.runtime.lastError.message);
          resolve(null);
          return;
        }
        resolve(response);
      });
    } catch (e) {
      log('Extension error:', e.message);
      resolve(null);
    }
  });
}

function getNormalizedUrl() {
  let url = window.location.href;
  const profileIdMatch = url.match(/profile_id=(\d+)/);
  if (profileIdMatch) {
    return `facebook.com/profile/${profileIdMatch[1]}`;
  }
  url = url.split('?')[0].split('#')[0];
  url = url.replace(/\/$/, '').replace(/\/about$/, '');
  return url;
}

/* =============================================================================
   PLATFORM DETECTOR
   ============================================================================= */

const PlatformDetector = {
  platforms: {
    // ==================== SOCIAL MEDIA ====================
    // Instagram
    'instagram.com': 'Instagram',
    'instagr.am': 'Instagram',
    
    // TikTok
    'tiktok.com': 'TikTok',
    'vm.tiktok.com': 'TikTok',        // Short URL
    'm.tiktok.com': 'TikTok',         // Mobile
    
    // X/Twitter
    'twitter.com': 'X/Twitter',
    'x.com': 'X/Twitter',
    't.co': 'X/Twitter',              // Short URL
    'mobile.twitter.com': 'X/Twitter',
    
    // Facebook
    'facebook.com': 'Facebook',
    'fb.com': 'Facebook',             // Short URL
    'fb.me': 'Facebook',              // Short URL
    'm.facebook.com': 'Facebook',     // Mobile
    'web.facebook.com': 'Facebook',
    
    // LinkedIn
    'linkedin.com': 'LinkedIn',
    'lnkd.in': 'LinkedIn',            // Short URL
    
    // YouTube
    'youtube.com': 'YouTube',
    'youtu.be': 'YouTube',            // Short URL
    'youtube-nocookie.com': 'YouTube',
    'm.youtube.com': 'YouTube',
    'music.youtube.com': 'YouTube Music',
    
    // Pinterest
    'pinterest.com': 'Pinterest',
    'pin.it': 'Pinterest',            // Short URL
    'pinterest.co.uk': 'Pinterest',   // Regional
    'pinterest.de': 'Pinterest',
    'pinterest.fr': 'Pinterest',
    'pinterest.ca': 'Pinterest',
    'pinterest.au': 'Pinterest',
    
    // Snapchat
    'snapchat.com': 'Snapchat',
    'story.snapchat.com': 'Snapchat',
    'lens.snapchat.com': 'Snapchat',
    
    // Reddit
    'reddit.com': 'Reddit',
    'redd.it': 'Reddit',              // Short URL
    'old.reddit.com': 'Reddit',
    'np.reddit.com': 'Reddit',
    
    // Tumblr
    'tumblr.com': 'Tumblr',
    
    // Threads
    'threads.net': 'Threads',
    
    // Bluesky
    'bsky.app': 'Bluesky',
    
    // Mastodon (common instances)
    'mastodon.social': 'Mastodon',
    'mastodon.online': 'Mastodon',
    'mastodon.art': 'Mastodon',
    'mstdn.social': 'Mastodon',
    
    // ==================== MESSAGING ====================
    // WhatsApp
    'wa.me': 'WhatsApp',
    'whatsapp.com': 'WhatsApp',
    'api.whatsapp.com': 'WhatsApp',
    'web.whatsapp.com': 'WhatsApp',
    'chat.whatsapp.com': 'WhatsApp',  // Group invites
    
    // Telegram
    't.me': 'Telegram',
    'telegram.me': 'Telegram',
    'telegram.org': 'Telegram',
    'telegram.dog': 'Telegram',
    
    // Discord
    'discord.gg': 'Discord',          // Invite links
    'discord.com': 'Discord',
    'discordapp.com': 'Discord',
    
    // Signal
    'signal.org': 'Signal',
    'signal.me': 'Signal',
    'signal.group': 'Signal',
    'signal.art': 'Signal',
    
    // Messenger
    'messenger.com': 'Messenger',
    'm.me': 'Messenger',              // Short URL
    
    // LINE
    'line.me': 'LINE',
    'lin.ee': 'LINE',                 // Short URL
    'liff.line.me': 'LINE',
    
    // Viber
    'viber.com': 'Viber',
    'invite.viber.com': 'Viber',
    
    // WeChat
    'wechat.com': 'WeChat',
    'weixin.qq.com': 'WeChat',
    'wxaurl.cn': 'WeChat',
    'wxmpurl.cn': 'WeChat',
    
    // Slack
    'slack.com': 'Slack',
    
    // ==================== VIDEO PLATFORMS ====================
    // Vimeo
    'vimeo.com': 'Vimeo',
    'player.vimeo.com': 'Vimeo',
    
    // Twitch
    'twitch.tv': 'Twitch',
    'clips.twitch.tv': 'Twitch',
    'player.twitch.tv': 'Twitch',
    
    // Dailymotion
    'dailymotion.com': 'Dailymotion',
    'dai.ly': 'Dailymotion',          // Short URL
    'geo.dailymotion.com': 'Dailymotion',
    
    // Rumble
    'rumble.com': 'Rumble',
    
    // Kick
    'kick.com': 'Kick',
    'player.kick.com': 'Kick',
    
    // BitChute
    'bitchute.com': 'BitChute',
    
    // Odysee/LBRY
    'odysee.com': 'Odysee',
    'lbry.tv': 'LBRY',
    'lbry.com': 'LBRY',
    'open.lbry.com': 'LBRY',
    
    // PeerTube
    'peertube.tv': 'PeerTube',
    
    // ==================== MUSIC PLATFORMS ====================
    // Spotify
    'spotify.com': 'Spotify',
    'open.spotify.com': 'Spotify',
    'spotify.link': 'Spotify',        // Short URL
    'play.spotify.com': 'Spotify',
    
    // SoundCloud
    'soundcloud.com': 'SoundCloud',
    'snd.sc': 'SoundCloud',           // Short URL
    'w.soundcloud.com': 'SoundCloud',
    
    // Apple Music
    'music.apple.com': 'Apple Music',
    'itunes.apple.com': 'Apple Music',
    'geo.music.apple.com': 'Apple Music',
    'embed.music.apple.com': 'Apple Music',
    
    // Bandcamp
    'bandcamp.com': 'Bandcamp',
    
    // Deezer
    'deezer.com': 'Deezer',
    'dzr.page.link': 'Deezer',        // Short URL
    'link.deezer.com': 'Deezer',
    
    // Tidal
    'tidal.com': 'Tidal',
    'listen.tidal.com': 'Tidal',
    
    // Other Music
    'pandora.com': 'Pandora',
    'audiomack.com': 'Audiomack',
    'music.amazon.com': 'Amazon Music',
    'reverbnation.com': 'ReverbNation',
    'mixcloud.com': 'Mixcloud',
    'hearthis.at': 'Hearthis',
    'last.fm': 'Last.fm',
    
    // ==================== PROFESSIONAL/PORTFOLIO ====================
    // Design
    'behance.net': 'Behance',
    'dribbble.com': 'Dribbble',
    'deviantart.com': 'DeviantArt',
    'fav.me': 'DeviantArt',           // Short URL
    'artstation.com': 'ArtStation',
    '500px.com': '500px',
    'flickr.com': 'Flickr',
    'unsplash.com': 'Unsplash',
    'pixiv.net': 'Pixiv',
    
    // Developer
    'github.com': 'GitHub',
    'gist.github.com': 'GitHub',
    'raw.githubusercontent.com': 'GitHub',
    'gitlab.com': 'GitLab',
    'bitbucket.org': 'Bitbucket',
    'codepen.io': 'CodePen',
    'stackoverflow.com': 'Stack Overflow',
    'dev.to': 'Dev.to',
    'hashnode.com': 'Hashnode',
    
    // Writing
    'medium.com': 'Medium',
    'substack.com': 'Substack',
    
    // Productivity
    'notion.so': 'Notion',
    'notion.site': 'Notion',
    
    // Business
    'angel.co': 'AngelList',
    'wellfound.com': 'Wellfound',
    'crunchbase.com': 'Crunchbase',
    'glassdoor.com': 'Glassdoor',
    'indeed.com': 'Indeed',
    
    // Freelance
    'upwork.com': 'Upwork',
    'fiverr.com': 'Fiverr',
    'toptal.com': 'Toptal',
    'freelancer.com': 'Freelancer',
    
    // ==================== E-COMMERCE ====================
    'etsy.com': 'Etsy',
    'shopify.com': 'Shopify',
    'myshopify.com': 'Shopify',
    'gumroad.com': 'Gumroad',
    'booth.pm': 'Booth',
    
    // ==================== MONETIZATION ====================
    // Patronage
    'patreon.com': 'Patreon',
    'ko-fi.com': 'Ko-fi',
    'buymeacoffee.com': 'Buy Me a Coffee',
    'subscribestar.com': 'SubscribeStar',
    'fanbox.cc': 'Pixiv Fanbox',
    'fantia.jp': 'Fantia',
    'skeb.jp': 'Skeb',
    
    // Adult Platforms
    'onlyfans.com': 'OnlyFans',
    'fansly.com': 'Fansly',
    
    // Payment
    'paypal.me': 'PayPal',
    'paypal.com': 'PayPal',
    'venmo.com': 'Venmo',
    'cash.app': 'Cash App',
    'cash.me': 'Cash App',            // Legacy (redirects)
    
    // ==================== LINK-IN-BIO ====================
    'linktr.ee': 'Linktree',
    'beacons.ai': 'Beacons',
    'bio.link': 'Bio Link',
    'linkin.bio': 'Linkin.bio',
    'tap.bio': 'Tap Bio',
    'campsite.bio': 'Campsite',
    'solo.to': 'Solo.to',
    'about.me': 'About.me',
    'carrd.co': 'Carrd',
    'bio.fm': 'Bio.fm',
    'withkoji.com': 'Koji',
    'koji.to': 'Koji',
    'stan.store': 'Stan Store',
    'hoo.be': 'Hoo.be',
    'snipfeed.co': 'Snipfeed',
    'linkpop.com': 'Linkpop',
    'shor.by': 'Shorby',
    'lnk.bio': 'Lnk.Bio',
    'msha.ke': 'Milkshake',           // Short URL
    'milkshake.app': 'Milkshake',
    'feed.link': 'Feedlink',
    'taplink.cc': 'Taplink',
    'contactinbio.com': 'ContactInBio',
    'allmylinks.com': 'AllMyLinks',
    'unfold.me': 'Unfold',
    'later.com': 'Later',
    
    // ==================== SCHEDULING ====================
    'calendly.com': 'Calendly',
    'cal.com': 'Cal.com',
    'acuityscheduling.com': 'Acuity',
    'square.site': 'Square',
    'booksy.com': 'Booksy',
    'setmore.com': 'Setmore',
    'appointlet.com': 'Appointlet',
    
    // ==================== REVIEWS ====================
    'yelp.com': 'Yelp',
    'tripadvisor.com': 'TripAdvisor',
    'trustpilot.com': 'Trustpilot',
    'g2.com': 'G2',
    'capterra.com': 'Capterra',
    
    // ==================== GAMING ====================
    'steamcommunity.com': 'Steam',
    'store.steampowered.com': 'Steam',
    'epicgames.com': 'Epic Games',
    'ea.com': 'EA',
    'origin.com': 'Origin',
    'ubisoft.com': 'Ubisoft',
    'battle.net': 'Battle.net',
    'gog.com': 'GOG',
    'itch.io': 'Itch.io',
    'roblox.com': 'Roblox',
    
    // ==================== PODCASTS ====================
    'podcasts.apple.com': 'Apple Podcasts',
    'podcasts.google.com': 'Google Podcasts',
    'anchor.fm': 'Anchor',
    'podbean.com': 'Podbean',
    'buzzsprout.com': 'Buzzsprout',
    'spreaker.com': 'Spreaker',
    'simplecast.com': 'Simplecast',
    'transistor.fm': 'Transistor',
    'castbox.fm': 'Castbox',
    'pocketcasts.com': 'Pocket Casts',
    'overcast.fm': 'Overcast',
    'stitcher.com': 'Stitcher',
    'iheartradio.com': 'iHeartRadio',
    
    // ==================== OTHER ====================
    'quora.com': 'Quora',
    'goodreads.com': 'Goodreads',
    'imdb.com': 'IMDb',
    'letterboxd.com': 'Letterboxd',
    'myspace.com': 'Myspace',
    'vk.com': 'VK',
    'ok.ru': 'Odnoklassniki',
    'weibo.com': 'Weibo',
    'douyin.com': 'Douyin',
    'bilibili.com': 'Bilibili',
    'nicovideo.jp': 'Niconico',
    'hootsuite.com': 'Hootsuite',
    'buffer.com': 'Buffer',
    
    // ==================== HOSTING/PAGES ====================
    // GitHub Pages
    'github.io': 'GitHub',
    
    // GitLab Pages
    'gitlab.io': 'GitLab',
    
    // Vercel
    'vercel.app': 'Vercel',
    'vercel.com': 'Vercel',
    'now.sh': 'Vercel',
    
    // Netlify
    'netlify.app': 'Netlify',
    'netlify.com': 'Netlify',
    
    // Cloudflare
    'pages.dev': 'Cloudflare Pages',
    'workers.dev': 'Cloudflare Workers',
    
    // Other Hosting
    'herokuapp.com': 'Heroku',
    'replit.com': 'Replit',
    'repl.co': 'Replit',
    'codesandbox.io': 'CodeSandbox',
    'jsfiddle.net': 'JSFiddle',
    'glitch.com': 'Glitch',
    'glitch.me': 'Glitch',
    'render.com': 'Render',
    'railway.app': 'Railway',
    'fly.io': 'Fly.io',
    'surge.sh': 'Surge',
    'web.app': 'Firebase',
    'firebaseapp.com': 'Firebase',
    'appspot.com': 'Google Cloud',
    'deno.dev': 'Deno',
    
    // ==================== VIDEO CONFERENCING ====================
    'zoom.us': 'Zoom',
    'zoom.com': 'Zoom',
    'meet.google.com': 'Google Meet',
    'teams.microsoft.com': 'Microsoft Teams',
    'skype.com': 'Skype',
    'webex.com': 'Webex',
    'whereby.com': 'Whereby',
    'around.co': 'Around',
    'loom.com': 'Loom',
    'streamyard.com': 'StreamYard',
    'restream.io': 'Restream',
    'vdo.ninja': 'VDO.Ninja',
    'clubhouse.com': 'Clubhouse',
    
    // ==================== E-COMMERCE EXTENDED ====================
    // Amazon
    'amazon.com': 'Amazon',
    'amzn.to': 'Amazon',              // Short URL
    'amazon.co.uk': 'Amazon',
    'amazon.de': 'Amazon',
    'amazon.ca': 'Amazon',
    'amazon.in': 'Amazon',
    
    // eBay
    'ebay.com': 'eBay',
    'ebay.co.uk': 'eBay',
    'ebay.de': 'eBay',
    
    // Other Marketplaces
    'walmart.com': 'Walmart',
    'target.com': 'Target',
    'aliexpress.com': 'AliExpress',
    'alibaba.com': 'Alibaba',
    'wish.com': 'Wish',
    
    // Resale/Fashion
    'poshmark.com': 'Poshmark',
    'depop.com': 'Depop',
    'mercari.com': 'Mercari',
    'grailed.com': 'Grailed',
    'stockx.com': 'StockX',
    'goat.com': 'GOAT',
    'thredup.com': 'ThredUp',
    'therealreal.com': 'The RealReal',
    'vestiairecollective.com': 'Vestiaire',
    
    // ==================== EVENTS ====================
    'eventbrite.com': 'Eventbrite',
    'meetup.com': 'Meetup',
    'lu.ma': 'Luma',
    'partiful.com': 'Partiful',
    'splash.com': 'Splash',
    'hopin.com': 'Hopin',
    'airmeet.com': 'Airmeet',
    'crowdcast.io': 'Crowdcast',
    
    // ==================== EDUCATION/COURSES ====================
    'teachable.com': 'Teachable',
    'thinkific.com': 'Thinkific',
    'kajabi.com': 'Kajabi',
    'podia.com': 'Podia',
    'skillshare.com': 'Skillshare',
    'udemy.com': 'Udemy',
    'coursera.org': 'Coursera',
    'edx.org': 'edX',
    'masterclass.com': 'MasterClass',
    'domestika.org': 'Domestika',
    'maven.com': 'Maven',
    'samcart.com': 'SamCart',
    'kartra.com': 'Kartra',
    'clickfunnels.com': 'ClickFunnels',
    
    // ==================== COMMUNITY ====================
    'circle.so': 'Circle',
    'mighty.co': 'Mighty Networks',
    'mightycommunity.com': 'Mighty Networks',
    'tribe.so': 'Tribe',
    'skool.com': 'Skool',
    'community.com': 'Community',
    'geneva.com': 'Geneva',
    'discourse.org': 'Discourse',
    
    // ==================== PAYMENTS EXTENDED ====================
    'stripe.com': 'Stripe',
    'square.com': 'Square',
    'squareup.com': 'Square',
    'zelle.com': 'Zelle',
    'revolut.me': 'Revolut',
    'revolut.com': 'Revolut',
    'wise.com': 'Wise',
    'transferwise.com': 'Wise',
    
    // ==================== NEWS/MEDIA ====================
    'news.ycombinator.com': 'Hacker News',
    'producthunt.com': 'Product Hunt',
    'indiehackers.com': 'Indie Hackers',
    'techcrunch.com': 'TechCrunch',
    'forbes.com': 'Forbes',
    
    // ==================== PHOTOGRAPHY EXTENDED ====================
    'flic.kr': 'Flickr',              // Short URL
    'pexels.com': 'Pexels',
    'shutterstock.com': 'Shutterstock',
    'gettyimages.com': 'Getty Images',
    'istockphoto.com': 'iStock',
    'adobe.com': 'Adobe',
    'stock.adobe.com': 'Adobe Stock',
    'canva.com': 'Canva',
    'figma.com': 'Figma',
    
    // ==================== PRINT ON DEMAND ====================
    'redbubble.com': 'Redbubble',
    'teepublic.com': 'TeePublic',
    'teespring.com': 'Spring',
    'spri.ng': 'Spring',              // Short URL
    'spreadshirt.com': 'Spreadshirt',
    'printful.com': 'Printful',
    'printify.com': 'Printify',
    'zazzle.com': 'Zazzle',
    'society6.com': 'Society6',
    
    // ==================== FOOD/DELIVERY ====================
    'doordash.com': 'DoorDash',
    'ubereats.com': 'Uber Eats',
    'grubhub.com': 'Grubhub',
    'postmates.com': 'Postmates',
    'seamless.com': 'Seamless',
    'caviar.com': 'Caviar',
    'opentable.com': 'OpenTable',
    'resy.com': 'Resy',
    'toasttab.com': 'Toast',
    
    // ==================== TRAVEL ====================
    'airbnb.com': 'Airbnb',
    'booking.com': 'Booking.com',
    'vrbo.com': 'Vrbo',
    'expedia.com': 'Expedia',
    'hotels.com': 'Hotels.com',
    'kayak.com': 'Kayak',
    'skyscanner.com': 'Skyscanner',
    'google.com/travel': 'Google Travel',
    
    // ==================== KROFILE ====================
    'krofile.com': 'Krofile',
    'dbp.to': 'Krofile'               // Short URL
  },

  detect(url) {
    if (!url) return null;
    
    try {
      let cleanUrl = url.trim().toLowerCase();
      if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
        cleanUrl = 'https://' + cleanUrl;
      }
      
      const urlObj = new URL(cleanUrl);
      const hostname = urlObj.hostname.replace(/^www\./, '');
      
      // O(1) direct lookup first
      if (this.platforms[hostname]) {
        return this.platforms[hostname];
      }
      
      // Check for subdomain matches (e.g., username.bandcamp.com)
      for (const [domain, platform] of Object.entries(this.platforms)) {
        const domainClean = domain.replace(/^www\./, '');
        if (hostname.endsWith('.' + domainClean)) {
          return platform;
        }
      }
      
      return null;
    } catch (e) {
      return null;
    }
  },

  isFacebookUrl(url) {
    if (!url) return false;
    const lower = url.toLowerCase();
    // DON'T skip Messenger Channel URLs - we want to capture those
    if (lower.includes('facebook.com/messages/t/')) return false;
    return lower.includes('facebook.com') || lower.includes('fb.com') || lower.includes('fb.me');
  },

  isMessengerChannel(url) {
    if (!url) return false;
    return url.toLowerCase().includes('facebook.com/messages/t/');
  },

  cleanUrl(url) {
    if (!url) return '';
    return url.trim().replace(/\/+$/, '');
  }
};

/* =============================================================================
   DATA DETECTOR
   ============================================================================= */

const DataDetector = {
  isEmail(text) {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(text.trim());
  },

  extractEmail(text) {
    // More careful extraction - ensure we don't capture adjacent URL or number text
    // Pattern: email followed by word boundary or common separators
    const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?=\s|$|[,;:\)\]\}]|http|www)/i);
    if (match) {
      return match[0];
    }
    // Fallback: basic pattern
    const basicMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    return basicMatch ? basicMatch[0] : null;
  },

  isPhone(text) {
    const trimmed = text.trim();
    const digitCount = (trimmed.match(/\d/g) || []).length;
    if (digitCount < 7 || digitCount > 15) return false;
    return /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\./0-9]+$/.test(trimmed);
  },

  extractPhone(text) {
    const patterns = [
      /(?:Contact\s*(?:Us\s*)?(?:at)?:?\s*)?([\+]?[(]?[0-9]{1,4}[)]?[-\s\./0-9]{6,})/i,
      /([\+]?[0-9]{1,4}[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\./0-9]{4,})/
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1].trim();
    }
    return null;
  },

  isUrl(text) {
    const trimmed = text.trim();
    
    // Explicit protocols
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return true;
    
    // Skip if contains spaces after the first "domain-like" part (not a real URL)
    // e.g., "D.R. Horton Myrtle Beach" is NOT a URL
    const firstPart = trimmed.split(/\s/)[0];
    if (firstPart !== trimmed && !trimmed.includes('/')) {
      // Has spaces and no path separator - likely not a URL
      // Check if first part alone looks like a domain
      if (!firstPart.match(/^[\w-]+\.[a-z]{2,}$/i)) {
        return false;
      }
    }
    
    // Must look like a domain: word.tld or word.word.tld
    // Require at least 2 chars before dot, and valid TLD-like ending (2+ chars)
    if (trimmed.match(/^[\w-]{2,}\.[\w.-]*[a-z]{2,}(\/|$)/i)) return true;
    
    // Common URL patterns without protocol
    if (trimmed.match(/^(www\.)?[\w-]+\.(com|org|net|io|co|me|tv|app|dev|ai|bio|link|to|be|it|fm|gg)\b/i)) return true;
    
    return false;
  },

  isAddress(text) {
    const trimmed = text.trim().toLowerCase();
    
    if (trimmed.startsWith('lives in')) return false;
    if (trimmed.length < 10) return false;
    
    // Skip UI/status text
    if (trimmed.includes('status indicator') || trimmed.includes('active now') ||
        trimmed.includes('online') || trimmed === 'offline') return false;
    
    // MUST have a street indicator
    const streetIndicators = [
      'street', 'st.', 'st,', 'avenue', 'ave.', 'ave,', 'road', 'rd.', 'rd,', 
      'drive', 'dr.', 'dr,', 'lane', 'ln.', 'ln,', 'boulevard', 'blvd', 
      'way', 'court', 'ct.', 'ct,', 'place', 'pl.', 'pl,',
      'highway', 'hwy', 'suite', 'ste', 'floor', 'unit', 'building', 'bldg',
      'apartment', 'apt'
    ];
    
    const hasStreetIndicator = streetIndicators.some(ind => trimmed.includes(ind));
    
    // MUST also have a location indicator (zip code, state abbreviation, or country)
    const hasZipCode = /\b\d{5}(-\d{4})?\b/.test(text); // US ZIP
    const hasUKPostcode = /\b[A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2}\b/i.test(text); // UK
    const hasIndianPin = /\b\d{6}\b/.test(text); // India
    const hasStateAbbrev = /,\s*[A-Z]{2}\s*,/.test(text) || /,\s*[A-Z]{2}\s*\d{5}/.test(text);
    const hasCountry = /united states|usa|canada|australia|uk\b|kingdom/i.test(trimmed);
    
    const hasLocationIndicator = hasZipCode || hasUKPostcode || hasIndianPin || hasStateAbbrev || hasCountry;
    
    // Only return true if BOTH street indicator AND location indicator present
    return hasStreetIndicator && hasLocationIndicator;
  },

  isLivesIn(text) {
    return text.trim().toLowerCase().startsWith('lives in');
  },

  parseLivesIn(text) {
    return text.trim().replace(/^lives in\s*/i, '').trim();
  },

  isHometown(text) {
    const trimmed = text.trim().toLowerCase();
    return trimmed.startsWith('from ') && !trimmed.includes('from the');
  },

  parseHometown(text) {
    return text.trim().replace(/^from\s*/i, '').trim();
  },

  isWork(text) {
    const trimmed = text.trim().toLowerCase();
    
    if (trimmed.startsWith('former ') || trimmed.startsWith('worked at') || 
        trimmed.startsWith('past:') || trimmed.startsWith('previously')) {
      return false;
    }
    
    if (trimmed.startsWith('works at') || trimmed.startsWith('working at')) {
      return true;
    }
    
    const excludePatterns = [
      'studied at', 'studies at', 'lives at', 'lived at', 'born at',
      'looking at', 'arrived at', 'started at', 'from ', 'went to',
      'no schools', 'no relationship'
    ];
    if (excludePatterns.some(p => trimmed.includes(p))) return false;
    
    if (trimmed.includes(' at ') && text.length > 5 && text.length < 200) {
      const parts = text.split(/ at /i);
      if (parts.length >= 2) {
        const role = parts[0].trim();
        const company = parts[1].trim();
        if (role.length > 2 && role.length < 100 && company.length > 1) {
          if (!role.match(/^\d/) && !company.match(/^\d/)) {
            return true;
          }
        }
      }
    }
    return false;
  },

  isPastWork(text) {
    const trimmed = text.trim().toLowerCase();
    return trimmed.startsWith('former ') || 
           trimmed.startsWith('worked at') ||
           trimmed.startsWith('past:') ||
           trimmed.startsWith('previously at') ||
           trimmed.includes('former ');
  },

  parseWork(text) {
    return text.trim()
      .replace(/^works at\s*/i, '')
      .replace(/^working at\s*/i, '');
  },

  parsePastWork(text) {
    return text.trim()
      .replace(/^former\s*/i, '')
      .replace(/^worked at\s*/i, '')
      .replace(/^past:\s*/i, '')
      .replace(/^previously at\s*/i, '');
  },

  isEducation(text) {
    const trimmed = text.trim().toLowerCase();
    
    if (trimmed.includes('no schools')) return false;
    
    // Must be reasonably short (not a description paragraph)
    if (trimmed.length > 100) return false;
    
    // EXCLUSIONS: Reject if it looks like an address
    const addressIndicators = [
      'street', 'st,', 'st.', 'avenue', 'ave', 'road', 'rd,', 'rd.',
      'drive', 'dr,', 'lane', 'ln,', 'boulevard', 'blvd', 'united states',
      'usa', ', md', ', ca', ', ny', ', tx', ', fl'
    ];
    if (addressIndicators.some(ind => trimmed.includes(ind))) return false;
    
    // EXCLUSIONS: Reject if it looks like a job title
    const jobIndicators = [
      'coordinator', 'manager', 'director', 'officer', 'specialist',
      'consultant', 'analyst', 'engineer', 'developer', 'designer',
      'assistant', 'associate', 'supervisor', 'administrator', 'executive',
      'president', 'ceo', 'cfo', 'cto', 'vp ', 'head of', 'chief '
    ];
    if (jobIndicators.some(ind => trimmed.includes(ind))) return false;
    
    // EXCLUSIONS: Reject if it contains " at " but NOT education prefix
    // (likely a job: "Manager at Company")
    if (trimmed.includes(' at ') && 
        !trimmed.startsWith('studied at') && 
        !trimmed.startsWith('studies at')) {
      return false;
    }
    
    const hasPrefix = trimmed.startsWith('studied at') || 
                      trimmed.startsWith('studies at') ||
                      trimmed.startsWith('went to');
    
    // Keywords that must match as whole words
    const schoolKeywords = [
      'university', 'college', 'school', 'institute', 'academy',
      'elementary', 'polytechnic', 'campus'
    ];
    
    // Patterns that should match
    const schoolPatterns = [
      /\bhigh\s*school\b/i,
      /\bcommunity\s*college\b/i,
      /\bstate\s*university\b/i,
      /\bof\s+(business|science|arts|law|medicine|engineering)\b/i
    ];
    
    if (hasPrefix) {
      const schoolPart = trimmed.replace(/^(studied at|studies at|went to)\s*/i, '');
      
      // Check word-based keywords
      if (schoolKeywords.some(kw => new RegExp(`\\b${kw}\\b`, 'i').test(schoolPart))) return true;
      
      // Check patterns
      if (schoolPatterns.some(p => p.test(schoolPart))) return true;
      
      // If it starts with capital letter and is short, likely a school name
      const original = text.replace(/^(studied at|studies at|went to)\s*/i, '').trim();
      if (original.length > 3 && original.length < 80 && original[0] === original[0].toUpperCase()) {
        return true;
      }
      return false;
    }
    
    // Without prefix, only match if contains school keywords as whole words
    if (schoolKeywords.some(kw => new RegExp(`\\b${kw}\\b`, 'i').test(trimmed))) return true;
    if (schoolPatterns.some(p => p.test(trimmed))) return true;
    
    return false;
  },

  parseEducation(text) {
    return text.trim()
      .replace(/^studied at\s*/i, '')
      .replace(/^studies at\s*/i, '')
      .replace(/^went to\s*/i, '');
  },

  isCategory(text) {
    const trimmed = text.trim();
    return trimmed.startsWith('Page ·') || trimmed.startsWith('Page·') ||
           trimmed.startsWith('Page ') ||
           trimmed.startsWith('Profile ·') || trimmed.startsWith('Profile·') ||
           trimmed.startsWith('Profile ');
  },

  parseCategory(text) {
    return text.trim()
      .replace(/^Page\s*·?\s*/i, '')
      .replace(/^Profile\s*·?\s*/i, '')
      .trim();
  },

  isRating(text) {
    const trimmed = text.trim();
    if (trimmed.includes('% recommend')) return true;
    if (trimmed.includes('Reviews)') || trimmed.includes('Review)')) return true;
    if (/^\d+(\.\d+)?\s*(out of|\/)\s*5/.test(trimmed)) return true;
    if (trimmed.includes('Not yet rated')) return true;
    return false;
  },

  parseRating(text) {
    const trimmed = text.trim();
    
    const percentMatch = trimmed.match(/(\d+)%\s*recommend.*?\((\d+[\d,]*)\s*Reviews?\)/i);
    if (percentMatch) {
      return {
        rating: percentMatch[1] + '% recommend',
        reviews: percentMatch[2].replace(/,/g, '')
      };
    }
    
    const starMatch = trimmed.match(/(\d+(?:\.\d+)?)\s*(?:out of|\/)\s*5/i);
    if (starMatch) {
      const reviewCount = trimmed.match(/\((\d+[\d,]*)\s*Reviews?\)/i);
      return {
        rating: starMatch[1] + '/5',
        reviews: reviewCount ? reviewCount[1].replace(/,/g, '') : null
      };
    }
    
    if (trimmed.includes('Not yet rated')) {
      return { rating: 'Not yet rated', reviews: '0' };
    }
    
    return { rating: trimmed, reviews: null };
  },

  isHours(text) {
    const trimmed = text.trim().toLowerCase();
    return trimmed.includes('open') || trimmed.includes('closed') ||
           trimmed.includes('hours') || /\d{1,2}:\d{2}\s*(am|pm)/i.test(trimmed);
  },

  isPriceRange(text) {
    return /^[\$€£¥₹]{1,4}$/.test(text.trim()) || 
           text.toLowerCase().includes('price range');
  },

  isMemberSince(text) {
    const trimmed = text.trim().toLowerCase();
    return trimmed.startsWith('joined ') && /joined\s+\w+\s+\d{4}/i.test(trimmed);
  },

  parseMemberSince(text) {
    return text.trim().replace(/^joined\s*/i, '').trim();
  },

  parseFollowers(text) {
    const match = text.match(/([\d,.]+[KMB]?)\s*followers?/i);
    return match ? match[1] : null;
  },

  isServices(text) {
    const trimmed = text.trim().toLowerCase();
    // Match patterns like "Dine-in · Online booking · Reservations"
    const serviceKeywords = [
      'dine-in', 'dine in', 'takeout', 'take-out', 'delivery', 'curbside',
      'drive-through', 'drive through', 'online booking', 'reservations',
      'appointments', 'pickup', 'pick-up', 'outdoor seating', 'indoor seating'
    ];
    
    // Must contain at least one service keyword
    const hasServiceKeyword = serviceKeywords.some(kw => trimmed.includes(kw));
    
    // Often contains · separator
    const hasMultipleServices = trimmed.includes('·') || trimmed.includes('•');
    
    return hasServiceKeyword && (hasMultipleServices || serviceKeywords.filter(kw => trimmed.includes(kw)).length >= 1);
  },

  parseServices(text) {
    return text.trim();
  }
};

/* =============================================================================
   DOM EXTRACTION HELPERS
   ============================================================================= */

function findIntroSection() {
  // Method 0: Check for profile dialog/overlay (friends suggestions page, etc.)
  const dialogs = document.querySelectorAll('[role="dialog"], [aria-modal="true"], [data-pagelet*="ProfileTile"]');
  for (const dialog of dialogs) {
    const introEl = dialog.querySelector('h2, span');
    if (introEl) {
      const allElements = dialog.querySelectorAll('h2, span');
      for (const el of allElements) {
        if (el.textContent.trim() === 'Intro') {
          let parent = el.parentElement;
          for (let i = 0; i < 10; i++) {
            if (!parent) break;
            const hasItems = parent.querySelectorAll('span[dir="auto"]').length >= 2;
            if (hasItems) {
              const rect = parent.getBoundingClientRect();
              if (rect.width >= 200 && rect.height >= 100) {
                log('Found Intro section in dialog/overlay');
                return parent;
              }
            }
            parent = parent.parentElement;
          }
        }
      }
    }
  }
  
  // Method 1: Find exact "Intro" text in h2/span and traverse to card container
  const allElements = document.querySelectorAll('h2, span');
  for (const el of allElements) {
    const text = el.textContent.trim();
    if (text === 'Intro') {
      // Found "Intro" text, now find the card container
      let parent = el.parentElement;
      let bestCandidate = null;
      
      for (let i = 0; i < 12; i++) {
        if (!parent) break;
        
        // Check if this container has intro content
        const hasMultipleItems = parent.querySelectorAll('span[dir="auto"]').length >= 3;
        const hasLinks = parent.querySelectorAll('a[href]').length >= 1;
        
        if (hasMultipleItems && hasLinks) {
          const rect = parent.getBoundingClientRect();
          // Card should be reasonable width (sidebar)
          if (rect.width >= 250 && rect.width <= 500 && rect.height >= 150) {
            bestCandidate = parent;
          }
          // Stop if we find a container that's too wide (main content area)
          if (rect.width > 600) {
            break;
          }
        }
        parent = parent.parentElement;
      }
      
      if (bestCandidate) {
        log('Found Intro section via text match');
        return bestCandidate;
      }
    }
  }
  
  // Method 2: Find by data-pagelet containing ProfileTiles
  const pagelet = document.querySelector('[data-pagelet*="ProfileTilesFeed"]');
  if (pagelet) {
    const rect = pagelet.getBoundingClientRect();
    if (rect.width >= 250 && rect.width <= 500) {
      log('Found Intro section via ProfileTilesFeed pagelet');
      return pagelet;
    }
  }
  
  // Method 3: Find container with "Intro" + key content patterns
  const allDivs = document.querySelectorAll('[role="main"] div');
  for (const div of allDivs) {
    const text = div.textContent;
    
    // Must have "Intro" text
    if (!text.includes('Intro')) continue;
    
    // Must have at least one content indicator
    const hasContentIndicator = 
      text.includes('Lives in') ||
      text.includes('From ') ||
      text.includes('Works at') ||
      text.includes(' at ') ||
      text.includes('Studied at') ||
      text.includes('Page ·') ||
      text.includes('Profile ·') ||
      text.includes('followers') ||
      text.includes('@');
    
    if (!hasContentIndicator) continue;
    
    const rect = div.getBoundingClientRect();
    const spanCount = div.querySelectorAll('span').length;
    
    // Must be reasonable size and have enough content
    if (rect.width >= 250 && rect.width <= 500 && 
        rect.height >= 150 && 
        spanCount >= 5 && spanCount <= 80) {
      log('Found Intro section via content pattern match');
      return div;
    }
  }
  
  // Method 4: Sidebar as fallback
  const complementary = document.querySelector('[role="complementary"]');
  if (complementary) {
    const rect = complementary.getBoundingClientRect();
    if (rect.width >= 250 && rect.width <= 500) {
      log('Found Intro section via complementary role');
      return complementary;
    }
  }
  
  log('Could not find Intro section');
  return null;
}

function extractDescription(introSection) {
  const skipTexts = [
    'intro', 'page', 'profile', 'address', 'email', 'phone', 'mobile',
    'hours', 'website', 'social', 'basic info', 'see more', 'see less',
    'works at', 'worked at', 'studied at', 'studies at', 'lives in', 'from '
  ];
  
  // Footer/legal patterns to skip
  const footerPatterns = [
    /privacy\s*·/i,
    /terms\s*·/i,
    /advertising\s*·/i,
    /cookies?\s*·/i,
    /ad\s*choices/i,
    /consumer\s*health/i,
    /^meta\s/i,
    /©\s*\d{4}/,
    /all rights reserved/i,
    /responsible for this page/i,
    /is responsible for/i,
    /page transparency/i,
    /see all/i,
    /show more/i
  ];
  
  // Social handle patterns to skip (not descriptions)
  const handlePatterns = [
    /^[a-zA-Z][\w._]+\s*·?\s*[\d,.]+[KMB]?\s*followers?/i, // "balenshah · 928K followers"
    /^@[a-zA-Z][\w._]+\s*·?\s*[\d,.]+[KMB]?\s*followers?/i, // "@handle · X followers"
    /^[\d,.]+[KMB]?\s*followers?/i, // "928K followers"
    /^confirmed link$/i
  ];
  
  const spans = introSection.querySelectorAll('span');
  
  for (const span of spans) {
    // Use innerText to preserve visual formatting (line breaks between elements)
    // Fallback to textContent if innerText not available
    let text = (span.innerText || span.textContent || '').trim();
    
    // Normalize whitespace: collapse multiple spaces/newlines but preserve single spaces
    text = text.replace(/[\r\n]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
    
    if (text.length < CONFIG.MIN_DESCRIPTION_LENGTH) continue;
    if (skipTexts.some(skip => text.toLowerCase().startsWith(skip))) continue;
    if (text.match(/^(Page|Profile)\s*·/i)) continue;
    
    // Skip footer/legal text
    if (footerPatterns.some(p => p.test(text))) continue;
    
    // Skip social handle patterns
    if (handlePatterns.some(p => p.test(text))) continue;
    
    // KEEP "Contact Us at:" blocks - they ARE descriptions with embedded contact info
    // Only skip pure data items (URLs, emails, phones by themselves)
    const isContactBlock = /contact\s*(us\s*)?(at|:)/i.test(text);
    
    if (!isContactBlock) {
      if (DataDetector.isUrl(text) || DataDetector.isEmail(text) || 
          DataDetector.isPhone(text) || DataDetector.isCategory(text) || 
          DataDetector.isRating(text) || DataDetector.isWork(text) ||
          DataDetector.isEducation(text) || DataDetector.isLivesIn(text) ||
          DataDetector.isAddress(text) || DataDetector.isHometown(text) ||
          DataDetector.isHours(text) || DataDetector.isPriceRange(text) ||
          DataDetector.isServices(text)) {
        continue;
      }
    }
    
    if (text.includes(' ') && text.split(' ').length > 3) {
      return text.substring(0, CONFIG.MAX_DESCRIPTION_LENGTH);
    }
  }
  
  return null;
}

function extractIntroItems(introSection) {
  const items = [];
  const processed = new Set();
  
  const skipLabels = [
    // Existing
    'intro', 'about', 'contact info', 'categories', 'websites and social links',
    'basic info', 'page transparency', 'details about', 'see all', 'address',
    'email', 'mobile', 'phone', 'hours', 'price', 'see more', 'see less',
    'confirmed link', 'collection', 'photos', 'videos', 'reviews',
    // Section headers
    'transparency', 'overview', 'work and education', 'places lived',
    'contact and basic info', 'family and relationships', 'life events',
    'privacy and legal info', 'profile transparency', 'details about',
    // Empty state messages
    'no workplaces to show', 'no schools to show', 'no relationship info to show',
    'no places to show', 'no contact info to show', 'no family members to show',
    // Other UI labels
    'languages', 'services', 'founding date', 'celebration', 'category',
    'featured', 'posts', 'reels', 'friends', 'check-ins', 'music', 
    'movies', 'tv shows', 'books', 'likes', 'events', 'questions', 
    'groups', 'manage', 'edit', 'add', 'public', 'private', 'only me',
    'followers', 'following', 'mutual friends',
    // Status indicators and UI elements
    'active status indicator', 'active now', 'online', 'offline',
    'message', 'poke', 'more options', 'see all photos', 'see all friends',
    // Footer/legal text
    'privacy', 'terms', 'advertising', 'ad choices', 'cookies',
    'consumer health privacy', 'meta', 'more'
  ];
  
  const elements = introSection.querySelectorAll('span, a[href]');
  
  elements.forEach(el => {
    let text = el.tagName === 'A' ? (el.href || el.textContent.trim()) : el.textContent.trim();
    
    if (!text || text.length < 2 || processed.has(text)) return;
    if (skipLabels.includes(text.toLowerCase())) return;
    
    // Skip stats patterns
    if (isStatsText(text)) return;
    
    // Skip "Contact Us at:" blocks - these go to description, not individual fields
    if (/contact\s*(us\s*)?(at|:)/i.test(text)) return;
    
    processed.add(text);
    items.push({ text, element: el });
  });
  
  return items;
}

function findAboutSection() {
  const main = document.querySelector('[role="main"]');
  if (main) {
    const sections = main.querySelectorAll('div');
    for (const section of sections) {
      const text = section.textContent.toLowerCase();
      if ((text.includes('contact info') || text.includes('categories')) &&
          section.querySelectorAll('span').length > 5) {
        return section;
      }
    }
  }
  return main;
}

/* =============================================================================
   MAIN EXTRACTION FUNCTIONS
   ============================================================================= */

function extractFromIntro() {
  let fbUrl = window.location.href;
  const profileIdMatch = fbUrl.match(/profile_id=(\d+)/);
  if (profileIdMatch) {
    fbUrl = `https://www.facebook.com/profile.php?id=${profileIdMatch[1]}`;
  } else {
    fbUrl = fbUrl.replace(/\/about.*$/, '').replace(/&sk=[^&]+/, '').replace(/\?sk=[^&]+/, '').replace(/\/$/, '');
  }
  
  const data = {
    'Name': null,
    'Facebook URL': fbUrl
  };

  let foundName = null;
  let nameHadVerified = false;
  
  // Method 1: Dialog/overlay (profile popup from friends page)
  const dialog = document.querySelector('[role="dialog"] h1, [aria-modal="true"] h1');
  if (dialog) {
    const rawText = dialog.textContent.trim();
    const cleaned = cleanName(rawText);
    if (isValidName(cleaned.name)) {
      foundName = cleaned.name;
      nameHadVerified = cleaned.hadVerified;
    }
  }
  
  // Method 2: Main content area h1
  if (!foundName) {
    const mainArea = document.querySelector('[role="main"]');
    if (mainArea) {
      const h1 = mainArea.querySelector('h1');
      if (h1) {
        const rawText = h1.textContent.trim();
        const cleaned = cleanName(rawText);
        if (isValidName(cleaned.name)) {
          foundName = cleaned.name;
          nameHadVerified = cleaned.hadVerified;
        }
      }
    }
  }
  
  // Method 3: Profile-specific selectors
  if (!foundName) {
    const nameSelectors = [
      '[data-pagelet="ProfileTilesFeed_0"] h1',
      '[data-pagelet*="Profile"] h1'
    ];
    
    for (const selector of nameSelectors) {
      try {
        const el = document.querySelector(selector);
        if (el && el.textContent.trim()) {
          const rawText = el.textContent.trim();
          const cleaned = cleanName(rawText);
          if (isValidName(cleaned.name)) {
            foundName = cleaned.name;
            nameHadVerified = cleaned.hadVerified;
            break;
          }
        }
      } catch (e) { }
    }
  }
  
  data['Name'] = foundName;
  
  // Verified detection - multiple methods
  let isVerified = nameHadVerified; // Backup: name contained "Verified"
  
  // Method 1: aria-label attributes
  if (!isVerified) {
    const verifiedByAria = document.querySelector(
      '[aria-label="Verified account"], [aria-label="Verified"], [aria-label="Verified Page"], [aria-label*="erified"]'
    );
    if (verifiedByAria) isVerified = true;
  }
  
  // Method 2: Check SVG parents for verified labels
  if (!isVerified) {
    const mainArea = document.querySelector('[role="main"]');
    if (mainArea) {
      const svgs = mainArea.querySelectorAll('svg');
      for (const svg of svgs) {
        const parentLabel = svg.parentElement?.getAttribute('aria-label') || '';
        if (parentLabel.toLowerCase().includes('verified')) {
          isVerified = true;
          break;
        }
        // Also check for blue checkmark near the name (look for svg with specific fill)
        const fill = svg.getAttribute('fill') || svg.style.fill || '';
        if (fill.includes('#0866ff') || fill.includes('#1877f2') || fill.includes('rgb(8, 102, 255)')) {
          // Blue checkmark color - likely verified badge
          const nearName = svg.closest('h1') || svg.parentElement?.closest('h1');
          if (nearName) {
            isVerified = true;
            break;
          }
        }
      }
    }
  }
  
  // Method 3: Check for verification badge image or icon
  if (!isVerified) {
    const verificationBadge = document.querySelector(
      '[data-testid="verified-badge"], [data-testid="profile-verified-badge"], img[alt*="Verified"], img[alt*="verified"]'
    );
    if (verificationBadge) isVerified = true;
  }
  
  // Method 4: Check page text near name for verification text
  if (!isVerified) {
    const h1 = document.querySelector('[role="main"] h1');
    if (h1) {
      const parent = h1.parentElement;
      if (parent && parent.textContent.includes('Verified')) {
        isVerified = true;
      }
    }
  }
  
  data['Verified'] = isVerified ? 'Yes' : 'No';

  // Extract Category from header area (near name)
  // Pattern: "Profile · Digital creator" or "Page · French Restaurant"
  const mainArea = document.querySelector('[role="main"]');
  if (mainArea) {
    const headerSpans = mainArea.querySelectorAll('span');
    for (const span of headerSpans) {
      const text = span.textContent.trim();
      if (DataDetector.isCategory(text)) {
        data['Category'] = DataDetector.parseCategory(text);
        break;
      }
    }
  }

  const introSection = findIntroSection();
  if (!introSection) {
    log('Intro section not found');
    return data;
  }

  const description = extractDescription(introSection);
  if (description) {
    data['Description'] = description;
  }

  const items = extractIntroItems(introSection);
  const socialLinks = {};
  let websiteCount = 0;
  let otherLinkCount = 0;
  let phoneCount = 0;
  let workCount = 0;
  let pastWorkCount = 0;
  let educationCount = 0;

  const skipPatterns = [
    // Empty state messages
    'no schools to show', 'no relationship info', 'no workplaces to show',
    'no places to show', 'no contact info', 'no family members',
    // UI elements
    'see all', 'see more', 'see less', 'show more', 'show less',
    'confirmed link', 'edit profile', 'add bio', 'add details',
    // Footer/legal
    'responsible for this page', 'page transparency', 'privacy policy',
    'terms of service', 'meta platforms',
    // Section headers that might leak
    'overview', 'work and education', 'places lived', 'contact and basic info'
  ];

  // Helper: Check if item text is embedded within description (not a standalone item)
  const isPartOfDescription = (itemText) => {
    if (!description) return false;
    // If the item text appears in the description, it's part of it
    return description.includes(itemText);
  };

  // Person name pattern - 2-3 capitalized words that look like names (not data)
  const looksLikePersonName = (text) => {
    const words = text.trim().split(/\s+/);
    if (words.length < 2 || words.length > 4) return false;
    // Check if all words are capitalized (Title Case) and reasonable length
    const allCapitalized = words.every(w => 
      w.length >= 2 && w.length <= 15 &&
      w[0] === w[0].toUpperCase() && 
      /^[A-Z][a-z]+$/.test(w)
    );
    // Exclude known patterns that are NOT person names
    const hasKeywords = /university|college|school|institute|academy|at |works|studied|former|hospital|clinic|restaurant|inc\.|llc|corp/i.test(text);
    return allCapitalized && !hasKeywords;
  };

  items.forEach(item => {
    const text = item.text;
    if (!text || text.length < 2) return;
    if (skipPatterns.some(p => text.toLowerCase().includes(p))) return;
    
    // Skip items that are part of the description block
    // (they'll be extracted as fallback if needed)
    if (isPartOfDescription(text)) return;
    
    if (DataDetector.isEmail(text) || 
        (text.includes('@') && !text.includes('instagram') && !text.includes('tiktok'))) {
      const email = DataDetector.extractEmail(text);
      if (email && !data['Email']) {
        data['Email'] = email;
        return;
      }
    }
    
    const handleMatch = text.match(/^([a-zA-Z][\w._]{2,29})\s*·?\s*([\d,.]+[KMB]?)\s*followers?/i);
    if (handleMatch) {
      const handle = handleMatch[1];
      const invalidHandles = ['page', 'profile', 'intro', 'about', 'home'];
      if (!invalidHandles.includes(handle.toLowerCase()) && handle.length <= 30) {
        let key = 'Instagram';
        let count = 1;
        while (socialLinks[key]) {
          count++;
          key = `Instagram ${count}`;
        }
        socialLinks[key] = `instagram.com/${handle}`;
        return;
      }
    }
    
    // Detect X/Twitter handles by checking element context
    // Look for handles near X icon (parent/sibling with X-related labels)
    if (item.element && /^@?[a-zA-Z][\w]{1,14}$/.test(text) && !text.includes('.')) {
      const parent = item.element.parentElement;
      const grandparent = parent?.parentElement;
      const checkForX = (el) => {
        if (!el) return false;
        const html = el.innerHTML?.toLowerCase() || '';
        const ariaLabel = el.getAttribute?.('aria-label')?.toLowerCase() || '';
        return html.includes('x.com') || html.includes('twitter') || 
               ariaLabel.includes('x') || ariaLabel.includes('twitter') ||
               el.querySelector?.('svg[aria-label*="X"]') !== null;
      };
      
      if (checkForX(parent) || checkForX(grandparent)) {
        if (!socialLinks['X/Twitter']) {
          socialLinks['X/Twitter'] = text.replace(/^@/, '');
          return;
        }
      }
    }
    
    if (DataDetector.isUrl(text)) {
      if (PlatformDetector.isFacebookUrl(text)) return;
      
      const platform = PlatformDetector.detect(text);
      const cleanUrl = PlatformDetector.cleanUrl(text);
      
      if (platform) {
        let key = platform;
        let count = 1;
        while (socialLinks[key]) {
          count++;
          key = `${platform} ${count}`;
        }
        socialLinks[key] = cleanUrl;
      } else {
        websiteCount++;
        if (websiteCount <= 3) {
          const key = websiteCount === 1 ? 'Website' : `Website ${websiteCount}`;
          data[key] = cleanUrl;
        } else {
          otherLinkCount++;
          data[`Other Link ${otherLinkCount}`] = cleanUrl;
        }
      }
      return;
    }
    
    if (DataDetector.isPhone(text) || text.toLowerCase().includes('contact')) {
      const phone = DataDetector.extractPhone(text);
      if (phone) {
        phoneCount++;
        const key = phoneCount === 1 ? 'Phone' : `Phone ${phoneCount}`;
        data[key] = phone;
        return;
      }
    }
    
    if (DataDetector.isCategory(text)) {
      data['Category'] = DataDetector.parseCategory(text);
      return;
    }
    
    if (DataDetector.isRating(text)) {
      const rating = DataDetector.parseRating(text);
      data['Rating'] = rating.rating;
      if (rating.reviews) data['Reviews'] = rating.reviews;
      return;
    }
    
    if (DataDetector.isMemberSince(text)) {
      data['Member Since'] = DataDetector.parseMemberSince(text);
      return;
    }
    
    if (DataDetector.isHometown(text)) {
      if (!data['Hometown']) {
        data['Hometown'] = DataDetector.parseHometown(text).replace(/,/g, ' -');
      }
      return;
    }
    
    if (DataDetector.isLivesIn(text)) {
      if (!data['City']) {
        data['City'] = DataDetector.parseLivesIn(text).replace(/,/g, ' -');
      }
      return;
    }
    
    if (DataDetector.isPastWork(text)) {
      pastWorkCount++;
      const key = pastWorkCount === 1 ? 'Past Work' : `Past Work ${pastWorkCount}`;
      data[key] = DataDetector.parsePastWork(text);
      return;
    }
    
    if (DataDetector.isWork(text)) {
      // Skip if it looks like a person name (not a real work entry)
      const parsed = DataDetector.parseWork(text);
      if (looksLikePersonName(parsed)) return;
      workCount++;
      const key = workCount === 1 ? 'Work' : `Work ${workCount}`;
      data[key] = parsed;
      return;
    }
    
    if (DataDetector.isEducation(text)) {
      // Skip if it looks like a person name (not a real school)
      const parsed = DataDetector.parseEducation(text);
      if (looksLikePersonName(parsed)) return;
      educationCount++;
      const key = educationCount === 1 ? 'Education' : `Education ${educationCount}`;
      data[key] = parsed;
      return;
    }
    
    if (DataDetector.isAddress(text)) {
      if (!data['Address']) {
        data['Address'] = text.replace(/,/g, ' -');
      }
      return;
    }
    
    // Skip hours (Open now, Closed, etc.) - not needed
    if (DataDetector.isHours(text)) {
      return;
    }
    
    if (DataDetector.isPriceRange(text)) {
      data['Price Range'] = text.match(/[\$€£¥₹]+/)?.[0] || text;
      return;
    }
    
    if (DataDetector.isServices(text)) {
      data['Services'] = DataDetector.parseServices(text);
      return;
    }
  });

  Object.entries(socialLinks).forEach(([platform, url]) => {
    data[platform] = url;
  });

  // FALLBACK: If Email not found in structured items, try extracting from description
  if (!data['Email'] && description) {
    const descEmail = DataDetector.extractEmail(description);
    if (descEmail) {
      data['Email'] = descEmail;
      log('Email extracted from description as fallback');
    }
  }

  // FALLBACK: If Phone not found in structured items, try extracting from description
  if (!data['Phone'] && description) {
    const descPhone = DataDetector.extractPhone(description);
    if (descPhone) {
      data['Phone'] = descPhone;
      log('Phone extracted from description as fallback');
    }
  }

  // Extract stats (Followers, Following, Likes)
  const stats = extractStats();
  if (stats['Followers'] && !data['Followers']) {
    data['Followers'] = stats['Followers'];
  }
  if (stats['Following'] && !data['Following']) {
    data['Following'] = stats['Following'];
  }
  if (stats['Likes'] && !data['Likes']) {
    data['Likes'] = stats['Likes'];
  }

  const pageText = document.body.innerText;
  
  const followersMatch = pageText.match(/([\d,.]+[KMB]?)\s*followers/i);
  if (followersMatch && !data['Followers']) {
    data['Followers'] = followersMatch[1];
  }
  
  const friendsMatch = pageText.match(/([\d,]+)\s*friends/i);
  if (friendsMatch && !data['Friends']) {
    data['Friends'] = friendsMatch[1].replace(/,/g, '');
  }
  
  const mutualMatch = pageText.match(/([\d,]+)\s*mutual/i);
  if (mutualMatch && !data['Mutual Friends']) {
    data['Mutual Friends'] = mutualMatch[1].replace(/,/g, '');
  }

  // Extract channel info (Messenger, Telegram, WhatsApp, Discord)
  const channelInfo = extractChannelInfo(introSection);
  if (channelInfo['Channel Name']) data['Channel Name'] = channelInfo['Channel Name'];
  if (channelInfo['Channel URL']) data['Channel URL'] = channelInfo['Channel URL'];
  if (channelInfo['Channel Members']) data['Channel Members'] = channelInfo['Channel Members'];

  if (!data['Category']) {
    const pageType = getPageType();
    data['Category'] = pageType === 'page' ? 'Business' : 'Personal';
  }

  return data;
}

function extractFromAbout() {
  let fbUrl = window.location.href;
  fbUrl = fbUrl.replace(/\/about.*$/, '')
              .replace(/&sk=about/, '')
              .replace(/\?sk=about&?/, '?')
              .replace(/\?$/, '')
              .replace(/\/$/, '');
  
  const data = {
    'Name': null,
    'Facebook URL': fbUrl
  };

  let nameHadVerified = false;
  const h1 = document.querySelector('h1');
  if (h1) {
    const rawText = h1.textContent.trim();
    const cleaned = cleanName(rawText);
    if (isValidName(cleaned.name)) {
      data['Name'] = cleaned.name;
      nameHadVerified = cleaned.hadVerified;
    }
  }
  
  // Verified detection - multiple methods
  let isVerified = nameHadVerified;
  
  if (!isVerified) {
    const verifiedByAria = document.querySelector(
      '[aria-label="Verified account"], [aria-label="Verified"], [aria-label="Verified Page"], [aria-label*="erified"]'
    );
    if (verifiedByAria) isVerified = true;
  }
  
  if (!isVerified) {
    const headerArea = document.querySelector('[role="main"]');
    if (headerArea) {
      const svgs = headerArea.querySelectorAll('svg');
      for (const svg of svgs) {
        const parentLabel = svg.parentElement?.getAttribute('aria-label') || '';
        if (parentLabel.toLowerCase().includes('verified')) {
          isVerified = true;
          break;
        }
      }
    }
  }
  
  data['Verified'] = isVerified ? 'Yes' : 'No';

  // Extract Category from header area
  const mainArea = document.querySelector('[role="main"]');
  if (mainArea) {
    const headerSpans = mainArea.querySelectorAll('span');
    for (const span of headerSpans) {
      const text = span.textContent.trim();
      if (DataDetector.isCategory(text)) {
        data['Category'] = DataDetector.parseCategory(text);
        break;
      }
    }
  }

  const aboutSection = findAboutSection();
  if (!aboutSection) return data;

  const items = extractIntroItems(aboutSection);
  const socialLinks = {};
  let websiteCount = 0;
  let otherLinkCount = 0;
  let phoneCount = 0;
  let workCount = 0;
  let pastWorkCount = 0;
  let educationCount = 0;

  const skipPatterns = [
    // Empty state messages
    'no schools to show', 'no relationship info', 'no workplaces to show',
    'no places to show', 'no contact info', 'no family members',
    // UI elements
    'see all', 'see more', 'see less', 'show more', 'show less',
    'confirmed link', 'edit profile', 'add bio', 'add details',
    // Footer/legal
    'responsible for this page', 'page transparency', 'privacy policy',
    'terms of service', 'meta platforms',
    // Section headers that might leak
    'overview', 'work and education', 'places lived', 'contact and basic info'
  ];

  // Person name pattern - 2-3 capitalized words that look like names (not data)
  const looksLikePersonName = (text) => {
    const words = text.trim().split(/\s+/);
    if (words.length < 2 || words.length > 4) return false;
    const allCapitalized = words.every(w => 
      w.length >= 2 && w.length <= 15 &&
      w[0] === w[0].toUpperCase() && 
      /^[A-Z][a-z]+$/.test(w)
    );
    const hasKeywords = /university|college|school|institute|academy|at |works|studied|former|hospital|clinic|restaurant|inc\.|llc|corp/i.test(text);
    return allCapitalized && !hasKeywords;
  };

  items.forEach(item => {
    const text = item.text;
    if (!text || text.length < 2) return;
    if (skipPatterns.some(p => text.toLowerCase().includes(p))) return;
    
    if (DataDetector.isEmail(text) || 
        (text.includes('@') && !text.includes('instagram') && !text.includes('tiktok'))) {
      const email = DataDetector.extractEmail(text);
      if (email && !data['Email']) data['Email'] = email;
      return;
    }
    
    // Detect X/Twitter handles by checking element context
    if (item.element && /^@?[a-zA-Z][\w]{1,14}$/.test(text) && !text.includes('.')) {
      const parent = item.element.parentElement;
      const grandparent = parent?.parentElement;
      const checkForX = (el) => {
        if (!el) return false;
        const html = el.innerHTML?.toLowerCase() || '';
        const ariaLabel = el.getAttribute?.('aria-label')?.toLowerCase() || '';
        return html.includes('x.com') || html.includes('twitter') || 
               ariaLabel.includes('x') || ariaLabel.includes('twitter') ||
               el.querySelector?.('svg[aria-label*="X"]') !== null;
      };
      
      if (checkForX(parent) || checkForX(grandparent)) {
        if (!socialLinks['X/Twitter']) {
          socialLinks['X/Twitter'] = text.replace(/^@/, '');
          return;
        }
      }
    }
    
    if (DataDetector.isUrl(text)) {
      if (PlatformDetector.isFacebookUrl(text)) return;
      const platform = PlatformDetector.detect(text);
      const cleanUrl = PlatformDetector.cleanUrl(text);
      
      if (platform) {
        let key = platform;
        let count = 1;
        while (socialLinks[key]) {
          count++;
          key = `${platform} ${count}`;
        }
        socialLinks[key] = cleanUrl;
      } else {
        websiteCount++;
        if (websiteCount <= 3) {
          const key = websiteCount === 1 ? 'Website' : `Website ${websiteCount}`;
          data[key] = cleanUrl;
        } else {
          otherLinkCount++;
          data[`Other Link ${otherLinkCount}`] = cleanUrl;
        }
      }
      return;
    }
    
    if (DataDetector.isPhone(text) || text.toLowerCase().includes('contact')) {
      const phone = DataDetector.extractPhone(text);
      if (phone) {
        phoneCount++;
        data[phoneCount === 1 ? 'Phone' : `Phone ${phoneCount}`] = phone;
        return;
      }
    }
    
    if (DataDetector.isCategory(text)) {
      data['Category'] = DataDetector.parseCategory(text);
      return;
    }
    
    // REMOVED: Loose keyword matching that was capturing page names as categories
    
    if (DataDetector.isRating(text)) {
      const rating = DataDetector.parseRating(text);
      data['Rating'] = rating.rating;
      if (rating.reviews) data['Reviews'] = rating.reviews;
      return;
    }
    
    if (DataDetector.isMemberSince(text)) {
      data['Member Since'] = DataDetector.parseMemberSince(text);
      return;
    }
    
    if (DataDetector.isHometown(text)) {
      if (!data['Hometown']) {
        data['Hometown'] = DataDetector.parseHometown(text).replace(/,/g, ' -');
      }
      return;
    }
    
    if (DataDetector.isLivesIn(text)) {
      if (!data['City']) {
        data['City'] = DataDetector.parseLivesIn(text).replace(/,/g, ' -');
      }
      return;
    }
    
    if (DataDetector.isPastWork(text)) {
      pastWorkCount++;
      const key = pastWorkCount === 1 ? 'Past Work' : `Past Work ${pastWorkCount}`;
      data[key] = DataDetector.parsePastWork(text);
      return;
    }
    
    if (DataDetector.isWork(text)) {
      // Skip if it looks like a person name (not a real work entry)
      const parsed = DataDetector.parseWork(text);
      if (looksLikePersonName(parsed)) return;
      workCount++;
      const key = workCount === 1 ? 'Work' : `Work ${workCount}`;
      data[key] = parsed;
      return;
    }
    
    if (DataDetector.isEducation(text)) {
      // Skip if it looks like a person name (not a real school)
      const parsed = DataDetector.parseEducation(text);
      if (looksLikePersonName(parsed)) return;
      educationCount++;
      const key = educationCount === 1 ? 'Education' : `Education ${educationCount}`;
      data[key] = parsed;
      return;
    }
    
    if (DataDetector.isAddress(text)) {
      if (!data['Address']) data['Address'] = text.replace(/,/g, ' -');
      return;
    }
    
    // Skip hours (Open now, Closed, etc.) - not needed
    if (DataDetector.isHours(text)) {
      return;
    }
    
    if (DataDetector.isPriceRange(text)) {
      data['Price Range'] = text.match(/[\$€£¥₹]+/)?.[0] || text;
      return;
    }
    
    if (DataDetector.isServices(text)) {
      data['Services'] = DataDetector.parseServices(text);
      return;
    }
  });

  Object.entries(socialLinks).forEach(([platform, url]) => {
    data[platform] = url;
  });
  
  // Extract stats
  const stats = extractStats();
  if (stats['Followers'] && !data['Followers']) {
    data['Followers'] = stats['Followers'];
  }
  if (stats['Following'] && !data['Following']) {
    data['Following'] = stats['Following'];
  }
  if (stats['Likes'] && !data['Likes']) {
    data['Likes'] = stats['Likes'];
  }
  
  const pageText = document.body.innerText;
  const friendsMatch = pageText.match(/([\d,]+)\s*friends/i);
  if (friendsMatch && !data['Friends']) {
    data['Friends'] = friendsMatch[1].replace(/,/g, '');
  }
  
  const mutualMatch = pageText.match(/([\d,]+)\s*mutual/i);
  if (mutualMatch && !data['Mutual Friends']) {
    data['Mutual Friends'] = mutualMatch[1].replace(/,/g, '');
  }

  // Extract channel info (Messenger, Telegram, WhatsApp, Discord)
  const channelInfo = extractChannelInfo(aboutSection);
  if (channelInfo['Channel Name']) data['Channel Name'] = channelInfo['Channel Name'];
  if (channelInfo['Channel URL']) data['Channel URL'] = channelInfo['Channel URL'];
  if (channelInfo['Channel Members']) data['Channel Members'] = channelInfo['Channel Members'];
  
  if (!data['Category']) {
    const pageType = getPageType();
    data['Category'] = pageType === 'page' ? 'Business' : 'Personal';
  }

  return data;
}

function smartExtract() {
  let data = {};
  
  const introData = extractFromIntro();
  const introFields = Object.keys(introData).filter(k => 
    introData[k] && !['Name', 'Facebook URL'].includes(k)
  );
  
  if (introFields.length >= 2) {
    log('Extracted from Intro:', introFields.length, 'fields');
    data = introData;
  } else {
    log('Intro insufficient, trying About section');
    
    if (isOnAboutPage()) {
      const aboutData = extractFromAbout();
      data = { ...introData };
      Object.entries(aboutData).forEach(([key, value]) => {
        if (value && !data[key]) data[key] = value;
      });
    } else {
      data = introData;
    }
  }
  
  data['Extracted At'] = new Date().toISOString();
  return data;
}

function isOnAboutPage() {
  const url = window.location.href;
  return url.includes('/about') || url.includes('sk=about');
}

/* =============================================================================
   UI NOTIFICATIONS
   ============================================================================= */

function showNotification(message, type = 'success') {
  const colors = {
    success: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    error: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    info: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'
  };
  
  const existing = document.querySelector('.eml-notification');
  if (existing) existing.remove();
  
  if (!document.querySelector('#eml-styles')) {
    const style = document.createElement('style');
    style.id = 'eml-styles';
    style.textContent = `
      @keyframes emlSlideIn { 
        from { transform: translateX(100%); opacity: 0; } 
        to { transform: translateX(0); opacity: 1; } 
      }
      @keyframes emlSlideOut { 
        from { transform: translateX(0); opacity: 1; } 
        to { transform: translateX(100%); opacity: 0; } 
      }
    `;
    document.head.appendChild(style);
  }
  
  const notification = document.createElement('div');
  notification.className = 'eml-notification';
  notification.style.cssText = `
    position: fixed; top: 20px; right: 20px;
    background: ${colors[type]}; color: white;
    padding: 16px 24px; border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    z-index: 2147483647;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 14px; max-width: 350px;
    animation: emlSlideIn 0.3s ease;
  `;
  
  notification.innerHTML = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'emlSlideOut 0.3s ease forwards';
    setTimeout(() => notification.remove(), 300);
  }, 3500);
}

function showExtractionSuccess(data, remaining, isPremium = false) {
  const fields = Object.keys(data).filter(k => data[k] && k !== 'Extracted At');
  const subtitle = isPremium 
    ? `${fields.length} fields captured · Unlimited`
    : `${fields.length} fields captured · ${remaining} left today`;
  
  showNotification(`
    <div style="display: flex; align-items: center; gap: 12px;">
      <span style="font-size: 24px;">✅</span>
      <div>
        <div style="font-weight: 600; margin-bottom: 4px;">${MESSAGES.EXTRACT_SUCCESS}</div>
        <div style="opacity: 0.9; font-size: 12px;">${subtitle}</div>
      </div>
    </div>
  `, 'success');
}

function showLimitReached() {
  showNotification(`
    <div style="display: flex; align-items: center; gap: 12px;">
      <span style="font-size: 24px;">⚠️</span>
      <div>
        <div style="font-weight: 600; margin-bottom: 4px;">${MESSAGES.LIMIT_REACHED}</div>
        <div style="opacity: 0.9; font-size: 12px;">${MESSAGES.UPGRADE_PROMPT}</div>
      </div>
    </div>
  `, 'error');
}

function showError(msg) {
  showNotification(`
    <div style="display: flex; align-items: center; gap: 12px;">
      <span style="font-size: 24px;">❌</span>
      <div>
        <div style="font-weight: 600; margin-bottom: 4px;">${MESSAGES.EXTRACT_FAILED}</div>
        <div style="opacity: 0.9; font-size: 12px;">${msg}</div>
      </div>
    </div>
  `, 'error');
}

function showAlreadyExtracted() {
  showNotification(`
    <div style="display: flex; align-items: center; gap: 12px;">
      <span style="font-size: 24px;">ℹ️</span>
      <div>
        <div style="font-weight: 600; margin-bottom: 4px;">${MESSAGES.ALREADY_EXTRACTED}</div>
        <div style="opacity: 0.9; font-size: 12px;">This profile was already captured this session</div>
      </div>
    </div>
  `, 'info');
}

function showGroupAlreadyExtracted() {
  showNotification(`
    <div style="display: flex; align-items: center; gap: 12px;">
      <span style="font-size: 24px;">ℹ️</span>
      <div>
        <div style="font-weight: 600; margin-bottom: 4px;">${MESSAGES.ALREADY_EXTRACTED}</div>
        <div style="opacity: 0.9; font-size: 12px;">This group was already captured this session</div>
      </div>
    </div>
  `, 'info');
}

function showNonExtractableMessage() {
  showNotification(`
    <div style="display: flex; align-items: center; gap: 12px;">
      <span style="font-size: 24px;">ℹ️</span>
      <div>
        <div style="font-weight: 600; margin-bottom: 4px;">${MESSAGES.CANT_EXTRACT}</div>
        <div style="opacity: 0.9; font-size: 12px;">${MESSAGES.GO_TO_PROFILE}</div>
      </div>
    </div>
  `, 'info');
}

function showGroupsSystemMessage() {
  showNotification(`
    <div style="display: flex; align-items: center; gap: 12px;">
      <span style="font-size: 24px;">ℹ️</span>
      <div>
        <div style="font-weight: 600; margin-bottom: 4px;">${MESSAGES.CANT_EXTRACT}</div>
        <div style="opacity: 0.9; font-size: 12px;">${MESSAGES.GO_TO_GROUP}</div>
      </div>
    </div>
  `, 'info');
}

/* =============================================================================
   PERMISSION & EXTRACTION FLOW
   ============================================================================= */

async function checkCanExtract() {
  const response = await safeMessage({ action: "canExtract" });
  
  if (!response) {
    return { allowed: false, reason: 'error' };
  }
  
  if (response.isPremium) {
    return { allowed: true, reason: 'premium', remaining: null };
  }
  
  return {
    allowed: response.allowed,
    reason: 'free',
    remaining: response.remaining,
    limit: response.limit
  };
}

async function extractWithRetry(maxRetries = 2) {
  for (let i = 0; i <= maxRetries; i++) {
    const data = smartExtract();
    if (data && data['Name']) return data;
    if (i < maxRetries) {
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
  return null;
}

async function performExtraction() {
  const normalizedUrl = getNormalizedUrl();
  if (extractedUrlsThisSession.has(normalizedUrl)) {
    showAlreadyExtracted();
    return { alreadyExtracted: true };
  }
  
  const permission = await checkCanExtract();
  
  if (!permission.allowed) {
    showLimitReached();
    return null;
  }
  
  // Smart wait for content to load
  const contentLoaded = await waitForContent();
  if (!contentLoaded) {
    log('Content not loaded, attempting extraction anyway');
  }
  
  let data = null;
  try {
    const extractPromise = extractWithRetry(2);
    const timeoutPromise = new Promise(resolve => 
      setTimeout(() => resolve(null), CONFIG.EXTRACTION_TIMEOUT)
    );
    data = await Promise.race([extractPromise, timeoutPromise]);
  } catch (e) {
    log('Extraction error:', e.message);
  }
  
  if (!data || !data['Name']) {
    // Auto-reload once if extraction failed
    if (shouldAutoReload()) {
      log('Extraction failed, auto-reloading page...');
      window.location.reload();
      return null;
    }
    // Already reloaded once, show error
    showError(MESSAGES.REFRESH_PROMPT);
    return null;
  }
  
  // Clear reload flag on successful extraction
  clearReloadFlag();
  
  const response = await safeMessage({ action: "saveData", data: data });
  
  if (response && response.success) {
    extractedUrlsThisSession.add(normalizedUrl);
    const remaining = permission.reason === 'free' ? permission.remaining - 1 : null;
    const isPremium = permission.reason === 'premium';
    showExtractionSuccess(data, remaining, isPremium);
    return data;
  } else {
    showError('Failed to save data. Please try again.');
    return null;
  }
}

/* =============================================================================
   PAGE DETECTION
   ============================================================================= */

function isExtractablePage() {
  const url = window.location.href;
  
  if (!url.includes('facebook.com')) return false;
  
  if (url === 'https://www.facebook.com/' || 
      url === 'https://facebook.com/' ||
      url === 'https://www.facebook.com' ||
      url === 'https://facebook.com') {
    return false;
  }
  
  if (url.includes('profile_id=')) {
    return true;
  }
  
  // Check for group pages specifically
  if (url.includes('/groups/')) {
    // Extract the group ID/name from URL
    const match = url.match(/\/groups\/([^\/\?#]+)/);
    if (match) {
      const groupId = match[1].toLowerCase();
      // Exclude groups system/landing pages
      if (GROUPS_SYSTEM_PAGES.includes(groupId)) {
        return false;
      }
    }
    
    // Allow group main page and /about
    if (/\/groups\/[^\/]+\/?$/.test(url) || 
        /\/groups\/[^\/]+\/about\/?$/.test(url)) {
      return true;
    }
    // Exclude group subpages
    for (const subpage of EXCLUDED_GROUP_SUBPAGES) {
      if (url.includes(subpage)) {
        return false;
      }
    }
    return false; // Other group subpages not explicitly allowed
  }
  
  for (const path of EXCLUDED_PATHS) {
    if (path === '/friends' && url.includes('profile_id=')) continue;
    if (url.includes(path)) return false;
  }
  
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    
    if (pathname.includes('/profile.php')) return true;
    
    if (pathname.length > 1 && pathname !== '/') {
      const segments = pathname.split('/').filter(s => s.length > 0);
      if (segments.length >= 1) {
        const firstSegment = segments[0].toLowerCase();
        if (!SYSTEM_PATHS.includes(firstSegment)) {
          return true;
        }
      }
    }
  } catch (e) {
    return false;
  }
  
  return false;
}

/* =============================================================================
   GROUP PAGE DETECTION & EXTRACTION
   ============================================================================= */

/**
 * Check if current page is a Facebook group
 */
function isGroupPage() {
  const url = window.location.href;
  return /facebook\.com\/groups\/[^\/]+/.test(url) &&
         !isGroupExcludedSubpage() &&
         !isGroupsSystemPage();
}

/**
 * Check if on a groups system/landing page (not an actual group)
 */
function isGroupsSystemPage() {
  const url = window.location.href;
  const match = url.match(/facebook\.com\/groups\/([^\/\?#]+)/);
  debugLog('isGroupsSystemPage check:', { url, match: match ? match[1] : null });
  if (match) {
    const groupId = match[1].toLowerCase();
    const isSystem = GROUPS_SYSTEM_PAGES.includes(groupId);
    debugLog('isGroupsSystemPage result:', { groupId, isSystem, systemPages: GROUPS_SYSTEM_PAGES });
    return isSystem;
  }
  return false;
}

/**
 * Check if on a group subpage that shouldn't be extracted
 */
function isGroupExcludedSubpage() {
  const url = window.location.href;
  for (const subpage of EXCLUDED_GROUP_SUBPAGES) {
    if (url.includes(`/groups/`) && url.includes(subpage)) {
      return true;
    }
  }
  return false;
}

/**
 * Check if on group About page
 */
function isGroupAboutPage() {
  const url = window.location.href;
  return /facebook\.com\/groups\/[^\/]+\/about/.test(url);
}

/**
 * Check if full About section is visible (not just sidebar snippet)
 * Full About shows Activity section with "Created", "posts today", etc.
 */
function hasFullAboutSection() {
  // Look for Activity section indicators
  const pageText = document.body?.innerText || '';
  
  // These appear only in full About view, not in Discussion sidebar
  const hasActivity = pageText.includes('Activity') && 
                      (pageText.includes('Created') || 
                       pageText.includes('new posts today') ||
                       pageText.includes('in the last month'));
  
  // Also check for "About this group" header which appears in full view
  const aboutHeader = document.querySelector('span')?.innerText?.includes('About this group');
  
  return hasActivity || aboutHeader || isGroupAboutPage();
}

/**
 * Check if group needs navigation to /about for full data
 */
function groupNeedsAboutNavigation() {
  if (!isGroupPage()) return false;
  if (isGroupAboutPage()) return false;
  if (hasFullAboutSection()) return false;
  return true; // On Discussion tab with limited sidebar
}

/**
 * Get current group URL base (without /about suffix)
 */
function getGroupBaseUrl() {
  const url = window.location.href;
  return url.replace(/\/about\/?$/, '').replace(/\/$/, '');
}

/**
 * Extract group name from header
 */
function extractGroupName() {
  // Try h1 first
  const h1 = document.querySelector('h1');
  if (h1 && h1.innerText.trim().length > 0) {
    const name = h1.innerText.trim();
    if (!INVALID_NAMES.includes(name.toLowerCase())) {
      return name;
    }
  }
  
  // Try finding by aria-label or other strong selectors
  const groupHeader = document.querySelector('[role="main"] h1, [aria-label*="group"] h1');
  if (groupHeader) {
    return groupHeader.innerText.trim();
  }
  
  return null;
}

/**
 * Extract group type (Public/Private)
 */
function extractGroupType() {
  const pageText = document.body?.innerText || '';
  
  // Look for "Private group" or "Public group" text
  if (/Private group/i.test(pageText)) {
    return 'Private';
  }
  if (/Public group/i.test(pageText)) {
    return 'Public';
  }
  
  // Check for lock icon or privacy indicators
  const spans = document.querySelectorAll('span');
  for (const span of spans) {
    const text = span.innerText?.trim();
    if (text === 'Private' || text === 'Public') {
      return text;
    }
  }
  
  return null;
}

/**
 * Extract member count (number only)
 */
function extractGroupMembers() {
  const pageText = document.body?.innerText || '';
  
  // Match patterns like "22.8K members", "4.3K members", "137 total members"
  const memberPatterns = [
    /(\d+(?:\.\d+)?[KMB]?)\s*members/i,
    /Members\s*·?\s*(\d+(?:\.\d+)?[KMB]?)/i,
    /(\d+(?:,\d+)?)\s*total members/i
  ];
  
  for (const pattern of memberPatterns) {
    const match = pageText.match(pattern);
    if (match) {
      let value = match[1].replace(/,/g, '');
      
      // Convert K/M/B to numbers
      if (value.endsWith('K') || value.endsWith('k')) {
        value = Math.round(parseFloat(value) * 1000).toString();
      } else if (value.endsWith('M') || value.endsWith('m')) {
        value = Math.round(parseFloat(value) * 1000000).toString();
      } else if (value.endsWith('B') || value.endsWith('b')) {
        value = Math.round(parseFloat(value) * 1000000000).toString();
      }
      
      return value;
    }
  }
  
  return null;
}

/**
 * Extract group description and parse for contact info
 */
function extractGroupDescription() {
  const result = {
    description: null,
    email: null,
    phone: null,
    website: null
  };
  
  // Texts that indicate NOT a description (visibility explanations, labels)
  const skipTexts = [
    'anyone can see who',
    'only members can see',
    'anyone can find this group',
    'only members can find',
    'learn more',
    'group created on'
  ];
  
  // Labels to skip entirely
  const skipLabels = ['public', 'private', 'visible', 'history', 'tags', 'members', 'activity'];
  
  let descText = '';
  
  // Method 1: Find the description text directly after "About this group"
  const allSpans = document.querySelectorAll('span[dir="auto"]');
  let foundAbout = false;
  
  for (const span of allSpans) {
    const text = span.innerText?.trim() || '';
    const textLower = text.toLowerCase();
    
    // Start looking after "About" header
    if (text === 'About' || text === 'About this group') {
      foundAbout = true;
      continue;
    }
    
    if (foundAbout && text.length > 50) {
      // Skip visibility explanation texts
      const isSkipText = skipTexts.some(skip => textLower.includes(skip));
      if (isSkipText) continue;
      
      // Skip if starts with a label word
      const startsWithLabel = skipLabels.some(label => textLower.startsWith(label));
      if (startsWithLabel) continue;
      
      // Skip if it's just tags (contains bullet separator and is short)
      if (text.includes('•') && text.length < 100) continue;
      
      // Skip single words or labels (need at least 8 words for description)
      const wordCount = text.replace(/\s*(See more|See less)\s*/gi, '').split(/\s+/).length;
      if (wordCount < 8) continue;
      
      // This looks like the actual description
      descText = text;
      break;
    }
  }
  
  // Method 2: Look for the first paragraph div after "About this group"
  if (!descText) {
    const aboutHeader = Array.from(document.querySelectorAll('span')).find(
      s => s.innerText?.trim() === 'About' || s.innerText?.trim() === 'About this group'
    );
    
    if (aboutHeader) {
      // Look in parent containers for the description text
      let container = aboutHeader.parentElement;
      for (let i = 0; i < 5 && container; i++) {
        const divs = container.querySelectorAll('div');
        for (const div of divs) {
          const text = div.innerText?.trim() || '';
          const textLower = text.toLowerCase();
          
          if (text.length > 80 && text.length < 1000) {
            const isSkipText = skipTexts.some(skip => textLower.includes(skip));
            if (isSkipText) continue;
            
            const startsWithLabel = skipLabels.some(label => textLower.startsWith(label));
            if (startsWithLabel) continue;
            
            if (text.includes('•') && text.length < 100) continue;
            
            const wordCount = text.replace(/\s*(See more|See less)\s*/gi, '').split(/\s+/).length;
            if (wordCount < 10) continue;
            
            // Found a good candidate
            descText = text.split('\n')[0]; // Take first paragraph
            break;
          }
        }
        if (descText) break;
        container = container.parentElement;
      }
    }
  }
  
  if (descText) {
    // Clean up - remove "See more" / "See less" at the end
    descText = descText.replace(/\s*(See more|See less)\s*$/i, '').trim();
    result.description = descText.substring(0, CONFIG.MAX_DESCRIPTION_LENGTH);
    
    // Parse for email
    const emailMatch = descText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) {
      result.email = emailMatch[0];
    }
    
    // Parse for phone
    const phoneMatch = descText.match(/(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/);
    if (phoneMatch) {
      result.phone = phoneMatch[0];
    }
    
    // Parse for website (not Facebook/social)
    const urlMatch = descText.match(/https?:\/\/[^\s]+|www\.[^\s]+/gi);
    if (urlMatch) {
      for (const url of urlMatch) {
        if (!url.includes('facebook.com') && !url.includes('fb.com')) {
          result.website = url;
          break;
        }
      }
    }
  }
  
  return result;
}

/**
 * Extract group location
 */
function extractGroupLocation() {
  const pageText = document.body?.innerText || '';
  
  // Look for location with pin icon pattern
  const spans = document.querySelectorAll('span');
  for (const span of spans) {
    const text = span.innerText?.trim() || '';
    // Location usually follows a location pin icon
    // Common formats: "Charlotte, North Carolina", "United States"
    if (text.includes(',') && text.length < 100) {
      const prev = span.previousElementSibling;
      // Check if it looks like a location (has state/country pattern)
      if (/^[A-Z][a-z]+(?:,\s*[A-Z][a-z\s]+)+$/.test(text) ||
          /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*$/.test(text)) {
        return text;
      }
    }
  }
  
  // Fallback: Look for known location patterns
  const locationMatch = pageText.match(/📍\s*([^\n]+)/);
  if (locationMatch) {
    return locationMatch[1].trim();
  }
  
  return null;
}

/**
 * Extract group tags
 */
function extractGroupTags() {
  const pageText = document.body?.innerText || '';
  
  // Look for Tags section
  const tagsMatch = pageText.match(/Tags\s*\n([^\n]+)/);
  if (tagsMatch) {
    return tagsMatch[1].trim();
  }
  
  // Look for bullet-separated tags
  const spans = document.querySelectorAll('span');
  for (const span of spans) {
    const text = span.innerText?.trim() || '';
    if (text.includes('•') && text.length < 200 && !text.includes('members')) {
      return text;
    }
  }
  
  return null;
}

/**
 * Extract group admins
 */
function extractGroupAdmins() {
  const pageText = document.body?.innerText || '';
  
  // Match "X and Y are admins" or "X is an admin" 
  // Use .+? instead of [^.]+ to allow periods in names like "H."
  const adminPatterns = [
    /^(.+?)\s+are admins/im,
    /^(.+?)\s+is an admin/im,
    /\n(.+?)\s+are admins/i,
    /\n(.+?)\s+is an admin/i
  ];
  
  for (const pattern of adminPatterns) {
    const match = pageText.match(pattern);
    if (match) {
      let admins = match[1].trim();
      // Remove "and X other members" patterns but keep the first admin name
      admins = admins.replace(/\s+and\s+\d+\s+other\s+members?/i, '');
      // Clean up any leading/trailing artifacts
      admins = admins.replace(/^[\s\n]+|[\s\n]+$/g, '');
      if (admins.length > 0 && admins.length < 100) {
        return admins;
      }
    }
  }
  
  // Fallback: Try to find admin names near "admins" keyword
  const spans = document.querySelectorAll('span');
  for (const span of spans) {
    const text = span.innerText?.trim() || '';
    if (text.includes('are admins') || text.includes('is an admin')) {
      let admins = text.replace(/\s+(are admins|is an admin).*$/i, '').trim();
      admins = admins.replace(/\s+and\s+\d+\s+other\s+members?/i, '');
      if (admins.length > 0 && admins.length < 100) {
        return admins;
      }
    }
  }
  
  return null;
}

/**
 * Extract group created date
 */
function extractGroupCreated() {
  const pageText = document.body?.innerText || '';
  
  // Match "Created X years ago", "16 years ago", etc.
  const createdPatterns = [
    /Created\s*\n?\s*(\d+\s+(?:year|month|week|day)s?\s+ago)/i,
    /Created\s*\n?\s*(a\s+(?:year|month|week|day)\s+ago)/i,
    /Created\s*\n?\s*(\d+\s+(?:year|month|week|day)s?)/i
  ];
  
  for (const pattern of createdPatterns) {
    const match = pageText.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  
  // Also check for "Group created on" format (gives actual date)
  const dateMatch = pageText.match(/Group created on ([^.\n]+)/i);
  if (dateMatch) {
    return dateMatch[1].trim();
  }
  
  return null;
}

/**
 * Extract group activity (posts today, posts month) - numbers only
 */
function extractGroupActivity() {
  const pageText = document.body?.innerText || '';
  const result = {
    postsToday: null,
    postsMonth: null
  };
  
  // Match "X new posts today"
  const todayMatch = pageText.match(/(\d+)\s*new posts? today/i);
  if (todayMatch) {
    result.postsToday = todayMatch[1];
  }
  
  // Match "X in the last month"
  const monthMatch = pageText.match(/(\d+)\s*in the last month/i);
  if (monthMatch) {
    result.postsMonth = monthMatch[1];
  }
  
  return result;
}

/**
 * Extract group rules (titles only, semicolon-separated)
 */
function extractGroupRules() {
  const rules = [];
  const pageText = document.body?.innerText || '';
  
  // Check if page has rules section
  if (!pageText.includes('Group rules') && !pageText.includes('rules from the admin')) {
    return null;
  }
  
  // Find numbered rules (1. Rule, 2. Rule, etc.)
  const ruleMatches = pageText.matchAll(/^\s*(\d+)\s+([^\n]+)/gm);
  for (const match of ruleMatches) {
    const ruleNum = parseInt(match[1]);
    const ruleText = match[2].trim();
    
    // Only capture if it looks like a rule title (not too long, starts with capital)
    if (ruleNum <= 20 && ruleText.length < 100 && /^[A-Z]/.test(ruleText)) {
      // Skip if it's a description line (usually starts with common words)
      if (!/^(We|You|This|If|Please|Give|Make|Share|Being|Selling)/i.test(ruleText)) {
        rules.push(ruleText);
      } else if (ruleText.length < 50) {
        // Short enough to be a title
        rules.push(ruleText);
      }
    }
  }
  
  // Also look for rule headers with specific patterns
  const headers = document.querySelectorAll('span[dir="auto"]');
  for (const header of headers) {
    const text = header.innerText?.trim() || '';
    // Check if parent has a number before it
    const parent = header.parentElement;
    if (parent) {
      const prevText = parent.previousElementSibling?.innerText?.trim();
      if (/^\d+$/.test(prevText) && text.length < 80 && text.length > 3) {
        if (!rules.includes(text)) {
          rules.push(text);
        }
      }
    }
  }
  
  return rules.length > 0 ? rules.join('; ') : null;
}

/**
 * Main group extraction function
 */
async function extractGroupData() {
  debugLog('Starting group extraction');
  
  const data = {};
  
  // Basic info
  data['Name'] = extractGroupName();
  data['Category'] = extractGroupType();
  data['Followers'] = extractGroupMembers();
  
  // Description with contact parsing
  const descResult = extractGroupDescription();
  data['Description'] = descResult.description;
  if (descResult.email) data['Email'] = descResult.email;
  if (descResult.phone) data['Phone'] = descResult.phone;
  if (descResult.website) data['Website'] = descResult.website;
  
  // Location and tags
  data['City'] = extractGroupLocation();
  data['Services'] = extractGroupTags();
  
  // Admin and activity (only available in full About view)
  if (hasFullAboutSection()) {
    data['Admins'] = extractGroupAdmins();
    data['Created'] = extractGroupCreated();
    
    const activity = extractGroupActivity();
    data['Posts Today'] = activity.postsToday;
    data['Posts Month'] = activity.postsMonth;
    
    data['Group Rules'] = extractGroupRules();
  }
  
  // URL
  data['Facebook URL'] = window.location.href;
  
  // Clean empty values
  Object.keys(data).forEach(key => {
    if (data[key] === null || data[key] === undefined || data[key] === '') {
      delete data[key];
    }
  });
  
  debugLog('Group data extracted:', data);
  return data;
}

/**
 * Handle group extraction with auto-navigation
 */
async function handleGroupExtraction(button) {
  debugLog('Handling group extraction');
  
  // Check if already extracted this session
  const groupUrl = getGroupBaseUrl();
  if (extractedGroupUrlsThisSession.has(groupUrl)) {
    showGroupAlreadyExtracted();
    return { data: null, pending: false, alreadyExtracted: true };
  }
  
  try {
    // Check if we need to navigate to /about for full data
    if (groupNeedsAboutNavigation()) {
      // Extract basic data first
      const basicData = await extractGroupData();
      debugLog('Basic group data:', basicData);
      
      // Store in session for continuation after navigation
      sessionStorage.setItem('eml_group_pending', JSON.stringify({
        url: groupUrl,
        data: basicData,
        timestamp: Date.now()
      }));
      
      debugLog('Stored pending group extraction, navigating to /about');
      
      // Navigate to about page
      window.location.href = groupUrl + '/about';
      return { pending: true };
    }
    
    // Already on /about or full About visible - extract everything
    let data = await extractGroupData();
    
    // Check for pending data to merge (from main page extraction)
    const pending = sessionStorage.getItem('eml_group_pending');
    if (pending) {
      try {
        const pendingData = JSON.parse(pending);
        
        // Only merge if same group and recent (within 30 seconds)
        if (pendingData.url === groupUrl && 
            Date.now() - pendingData.timestamp < 30000) {
          debugLog('Merging with pending data');
          // Merge: new data (from /about) takes priority
          data = { ...pendingData.data, ...data };
        }
      } catch (e) {
        debugLog('Error parsing pending data:', e);
      }
      sessionStorage.removeItem('eml_group_pending');
    }
    
    return { data, pending: false };
    
  } catch (error) {
    debugLog('Error during group extraction:', error);
    return { data: null, pending: false };
  }
}

/* =============================================================================
   FLOATING EXTRACT BUTTON
   ============================================================================= */

let currentButtonState = 'extract';

/**
 * Find the group header h1 element
 */
function findGroupH1() {
  const h1 = document.querySelector('h1');
  if (h1 && h1.innerText.trim().length > 0) {
    const text = h1.innerText.trim().toLowerCase();
    // Make sure it's not a navigation element
    if (!INVALID_NAMES.includes(text)) {
      return h1;
    }
  }
  return null;
}

function createExtractButton() {
  if (document.querySelector('.eml-extract-btn')) return;
  
  const button = document.createElement('button');
  button.className = 'eml-extract-btn';
  
  const baseStyles = `
    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
    color: white; border: none;
    border-radius: 50px; font-weight: 600;
    cursor: pointer; box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
    transition: all 0.2s ease;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  `;
  
  // Always set button text to Extract Data
  button.innerHTML = getButtonHtml('Extract Data');
  currentButtonState = 'extract';
  
  // Check if this is an actual group page (extractable)
  if (isGroupPage()) {
    const groupH1 = findGroupH1();
    
    if (groupH1) {
      // Insert button inline right after the h1 text
      button.style.cssText = `
        display: inline-flex;
        align-items: center;
        margin-left: 12px;
        padding: 6px 14px; 
        font-size: 12px;
        vertical-align: middle;
        ${baseStyles}
      `;
      
      // Insert after h1 element
      groupH1.parentNode.insertBefore(button, groupH1.nextSibling);
    } else {
      // Fallback: floating button bottom-right
      button.style.cssText = `
        position: fixed; bottom: 100px; right: 20px;
        padding: 14px 28px; font-size: 15px;
        z-index: 2147483646; ${baseStyles}
      `;
      document.body.appendChild(button);
    }
  }
  // Groups system pages (feed, discover, etc.) - show floating button
  else if (isGroupsSystemPage()) {
    button.style.cssText = `
      position: fixed; bottom: 100px; right: 20px;
      padding: 14px 28px; font-size: 15px;
      z-index: 2147483646; ${baseStyles}
    `;
    document.body.appendChild(button);
  }
  // Profile/Page or other pages
  else {
    const onAboutPage = isOnAboutPage();
    const introSection = findIntroSection();
    
    // Only try to attach to intro section on extractable profile/page
    if (introSection && !onAboutPage && isExtractablePage()) {
      button.style.cssText = `
        position: absolute; top: 10px; right: 10px;
        padding: 10px 20px; font-size: 13px;
        z-index: 1000; ${baseStyles}
      `;
      
      const computedStyle = window.getComputedStyle(introSection);
      if (computedStyle.position === 'static') {
        introSection.style.position = 'relative';
      }
      introSection.appendChild(button);
    } else {
      // Floating button for all other cases
      button.style.cssText = `
        position: fixed; bottom: 100px; right: 20px;
        padding: 14px 28px; font-size: 15px;
        z-index: 2147483646; ${baseStyles}
      `;
      document.body.appendChild(button);
    }
  }
  
  button.addEventListener('mouseenter', () => {
    button.style.transform = 'scale(1.05)';
    button.style.boxShadow = '0 6px 20px rgba(99, 102, 241, 0.5)';
  });
  
  button.addEventListener('mouseleave', () => {
    button.style.transform = 'scale(1)';
    button.style.boxShadow = '0 4px 15px rgba(99, 102, 241, 0.4)';
  });
  
  button.addEventListener('click', handleButtonClick);
}

// Timeout for resetting button state
let buttonResetTimeout = null;

/**
 * Reset button to Extract state
 */
function resetButtonToExtract() {
  const button = document.querySelector('.eml-extract-btn');
  if (!button) return;
  
  // Use correct text based on page type
  if (isGroupPage() || isGroupsSystemPage()) {
    button.innerHTML = getButtonHtml('Extract Data');
  } else {
    button.innerHTML = getButtonHtml('Extract Data');
  }
  currentButtonState = 'extract';
  button.disabled = false;
  button.style.opacity = '1';
  button.style.background = 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)';
}

/**
 * Schedule button reset to Extract state
 * @param {number} delayMs - Delay in milliseconds
 */
function scheduleButtonReset(delayMs) {
  // Clear any existing timeout
  if (buttonResetTimeout) {
    clearTimeout(buttonResetTimeout);
  }
  
  buttonResetTimeout = setTimeout(() => {
    resetButtonToExtract();
    buttonResetTimeout = null;
  }, delayMs);
}

async function handleButtonClick() {
  const button = document.querySelector('.eml-extract-btn');
  if (!button) return;
  
  debugLog('handleButtonClick called', {
    url: window.location.href,
    isGroupsSystemPage: isGroupsSystemPage(),
    isGroupPage: isGroupPage(),
    isExtractablePage: isExtractablePage()
  });
  
  // Check if on groups system page (feed, discover, joins, etc.)
  if (isGroupsSystemPage()) {
    debugLog('Detected groups system page, showing message');
    showGroupsSystemMessage();
    return;
  }
  
  if (!isExtractablePage()) {
    showNonExtractableMessage();
    return;
  }
  
  // Complete state - do nothing (button should be disabled anyway)
  if (currentButtonState === 'complete') {
    return;
  }
  
  // GROUP EXTRACTION
  if (isGroupPage()) {
    button.innerHTML = '⏳ Extracting...';
    button.disabled = true;
    button.style.opacity = '0.7';
    
    const result = await handleGroupExtraction(button);
    
    if (result.pending) {
      // Navigation to /about in progress, don't update button
      return;
    }
    
    // Handle already extracted case
    if (result.alreadyExtracted) {
      button.innerHTML = '✅ Complete';
      currentButtonState = 'complete';
      button.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
      button.disabled = true;
      button.style.opacity = '1';
      // Reset to Extract Data after 5 seconds
      scheduleButtonReset(5000);
      return;
    }
    
    // Check if we got meaningful data (at least a name or URL)
    const hasData = result.data && (result.data['Name'] || result.data['Facebook URL']);
    
    if (hasData) {
      // Save group data to separate storage
      await saveGroupData(result.data);
      
      // Track this group as extracted
      const groupUrl = getGroupBaseUrl();
      extractedGroupUrlsThisSession.add(groupUrl);
      
      button.innerHTML = '✅ Done!';
      currentButtonState = 'done';
      
      setTimeout(() => {
        button.innerHTML = '✅ Complete';
        currentButtonState = 'complete';
        button.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
        button.disabled = true;
        button.style.opacity = '1';
        // Reset to Extract Data after 5 seconds
        scheduleButtonReset(5000);
      }, 1500);
    } else {
      // No data extracted - show error notification
      showNotification(`
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 24px;">⚠️</span>
          <div>
            <div style="font-weight: 600; margin-bottom: 4px;">Extraction Failed</div>
            <div style="opacity: 0.9; font-size: 12px;">Try refreshing the page or visit the group's About tab.</div>
          </div>
        </div>
      `, 'warning');
      
      button.innerHTML = getButtonHtml('Extract Data');
      currentButtonState = 'extract';
      button.disabled = false;
      button.style.opacity = '1';
    }
    return;
  }
  
  // PROFILE/PAGE EXTRACTION (existing logic)
  
  // Extract More - only from main page, navigate to About
  if (currentButtonState === 'extractMore' && !isOnAboutPage()) {
    button.innerHTML = '⏳ Loading...';
    button.disabled = true;
    
    const currentUrl = window.location.href;
    let aboutUrl;
    if (currentUrl.includes('profile.php')) {
      aboutUrl = currentUrl.includes('?') 
        ? currentUrl.replace(/(\?|&)sk=[^&]*/, '') + '&sk=about'
        : currentUrl + '?sk=about';
    } else {
      aboutUrl = currentUrl.replace(/\/$/, '').replace(/\/about.*$/, '') + '/about';
    }
    
    window.location.href = aboutUrl;
    return;
  }
  
  // Mark this URL as "extract requested" for auto-extract on reload
  const extractKey = `eml_extract_${getNormalizedUrl()}`;
  sessionStorage.setItem(extractKey, 'true');
  
  // Normal extraction
  button.innerHTML = '⏳ Extracting...';
  button.disabled = true;
  button.style.opacity = '0.7';
  
  const result = await performExtraction();
  
  if (result && !result.alreadyExtracted) {
    button.innerHTML = '✅ Done!';
    currentButtonState = 'done';
    
    setTimeout(() => {
      if (isOnAboutPage()) {
        // On About page: Show complete, stay disabled
        button.innerHTML = '✅ Complete';
        currentButtonState = 'complete';
        button.disabled = true;
        // Reset to Extract Data after 5 seconds
        scheduleButtonReset(5000);
      } else {
        // On Main page: Show Extract More
        button.innerHTML = getButtonHtml('Extract More Data');
        currentButtonState = 'extractMore';
        button.disabled = false;
        // Reset to Extract Data after 10 seconds
        scheduleButtonReset(10000);
      }
      button.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
      button.style.opacity = '1';
    }, 1500);
  } else if (result && result.alreadyExtracted) {
    if (isOnAboutPage()) {
      button.innerHTML = '✅ Complete';
      currentButtonState = 'complete';
      button.disabled = true;
      // Reset to Extract Data after 5 seconds
      scheduleButtonReset(5000);
    } else {
      button.innerHTML = getButtonHtml('Extract More Data');
      currentButtonState = 'extractMore';
      button.disabled = false;
      // Reset to Extract Data after 10 seconds
      scheduleButtonReset(10000);
    }
    button.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
    button.style.opacity = '1';
  } else {
    button.innerHTML = getButtonHtml('Extract Data');
    currentButtonState = 'extract';
    button.disabled = false;
    button.style.opacity = '1';
  }
}

/**
 * Save group data to separate storage
 */
async function saveGroupData(data) {
  debugLog('Saving group data:', data);
  
  return new Promise((resolve) => {
    chrome.storage.local.get(['extractedGroupData'], (result) => {
      const groupData = result.extractedGroupData || [];
      
      // Normalize URL for comparison
      const normalizeGroupUrl = (url) => {
        if (!url) return '';
        return url
          .replace(/\/about\/?$/, '')
          .replace(/\/$/, '')
          .toLowerCase();
      };
      
      const newUrl = normalizeGroupUrl(data['Facebook URL']);
      
      // Check for duplicate (same Facebook URL)
      const existingIndex = groupData.findIndex(
        item => normalizeGroupUrl(item['Facebook URL']) === newUrl && newUrl !== ''
      );
      
      let isNewRecord = false;
      
      if (existingIndex >= 0) {
        // Update existing entry (merge)
        groupData[existingIndex] = { ...groupData[existingIndex], ...data };
      } else {
        // Add new entry
        isNewRecord = true;
        groupData.push(data);
      }
      
      // Keep max 10000 records
      while (groupData.length > 10000) {
        groupData.shift();
      }
      
      chrome.storage.local.set({ extractedGroupData: groupData }, () => {
        debugLog('Group data saved. Total groups:', groupData.length);
        
        // Increment daily count for NEW records (not merges)
        if (isNewRecord) {
          safeMessage({ action: 'incrementDailyCount' }).then(() => {
            debugLog('Daily count incremented for new group');
            resolve({ isNew: true });
          });
        } else {
          resolve({ isNew: false });
        }
      });
    });
  });
}

/* =============================================================================
   AUTO EXTRACTION
   ============================================================================= */

let hasAutoExtracted = false;

async function runAutoExtract() {
  if (!isExtractablePage()) return;
  if (hasAutoExtracted) return;
  
  const button = document.querySelector('.eml-extract-btn');
  
  // GROUP: Check for pending group extraction (after navigation to /about)
  if (isGroupPage()) {
    const pending = sessionStorage.getItem('eml_group_pending');
    if (pending) {
      try {
        const pendingData = JSON.parse(pending);
        const groupUrl = getGroupBaseUrl();
        
        // Verify this is the same group and recent
        if (pendingData.url === groupUrl && 
            Date.now() - pendingData.timestamp < 30000) {
          hasAutoExtracted = true;
          
          if (button) {
            button.innerHTML = '⏳ Extracting...';
            button.disabled = true;
            button.style.opacity = '0.7';
          }
          
          // Extract full data from /about page
          const fullData = await extractGroupData();
          
          // Merge with pending data
          const mergedData = { ...pendingData.data, ...fullData };
          
          // Save merged data
          await saveGroupData(mergedData);
          
          // Track this group as extracted
          extractedGroupUrlsThisSession.add(groupUrl);
          
          // Clear pending
          sessionStorage.removeItem('eml_group_pending');
          
          if (button) {
            button.innerHTML = '✅ Complete';
            button.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
            currentButtonState = 'complete';
            button.disabled = true;
            button.style.opacity = '1';
            scheduleButtonReset(5000);
          }
          return;
        }
      } catch (e) {
        debugLog('Error processing pending group extraction:', e);
      }
      sessionStorage.removeItem('eml_group_pending');
    }
    
    // Check if auto mode is enabled for groups
    const settings = await new Promise(resolve => {
      chrome.storage.local.get(['extractionMode'], resolve);
    });
    
    // Skip if not auto mode
    if (settings.extractionMode !== 'auto') {
      return;
    }
    
    // Auto mode = check if premium
    const permission = await checkCanExtract();
    if (!permission.allowed || permission.reason !== 'premium') {
      return; // Free users don't get auto-extract
    }
    
    // Check if already extracted this session
    const groupUrl = getGroupBaseUrl();
    if (extractedGroupUrlsThisSession.has(groupUrl)) {
      return;
    }
    
    hasAutoExtracted = true;
    
    if (button) {
      button.innerHTML = '⏳ Extracting...';
      button.disabled = true;
      button.style.opacity = '0.7';
    }
    
    // For auto-mode, navigate to /about if needed for full data
    if (groupNeedsAboutNavigation()) {
      // Extract basic data first
      const basicData = await extractGroupData();
      
      // Store in session for continuation after navigation
      sessionStorage.setItem('eml_group_pending', JSON.stringify({
        url: groupUrl,
        data: basicData,
        timestamp: Date.now()
      }));
      
      // Navigate to about page
      window.location.href = groupUrl + '/about';
      return;
    }
    
    // Already on /about or full About visible - extract everything
    const data = await extractGroupData();
    await saveGroupData(data);
    
    // Track this group as extracted
    extractedGroupUrlsThisSession.add(groupUrl);
    
    if (button) {
      button.innerHTML = '✅ Complete';
      button.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
      currentButtonState = 'complete';
      button.disabled = true;
      button.style.opacity = '1';
      scheduleButtonReset(5000);
    }
    return;
  }
  
  // PROFILE/PAGE: Existing logic
  const onAbout = isOnAboutPage();
  
  // Check if user previously pressed extract on this URL (auto-extract on reload)
  const extractKey = `eml_extract_${getNormalizedUrl()}`;
  const shouldAutoExtractOnReload = sessionStorage.getItem(extractKey) === 'true';
  
  // On About page: Always auto-extract (for merge purposes)
  if (onAbout) {
    hasAutoExtracted = true;
    
    if (button) {
      button.innerHTML = '⏳ Extracting...';
      button.disabled = true;
      button.style.opacity = '0.7';
    }
    
    const result = await performExtraction();
    
    if (button) {
      button.innerHTML = '✅ Complete';
      button.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
      currentButtonState = 'complete';
      button.disabled = true; // Keep disabled - no more actions on About page
      button.style.opacity = '1';
      // Reset to Extract Data after 5 seconds
      scheduleButtonReset(5000);
    }
    return;
  }
  
  // Auto-extract on reload: If user previously pressed extract for this URL
  if (shouldAutoExtractOnReload) {
    hasAutoExtracted = true;
    
    if (button) {
      button.innerHTML = '⏳ Extracting...';
      button.disabled = true;
      button.style.opacity = '0.7';
    }
    
    const result = await performExtraction();
    
    if (result && !result.alreadyExtracted && button) {
      button.innerHTML = '✅ Done!';
      currentButtonState = 'done';
      
      setTimeout(() => {
        button.innerHTML = getButtonHtml('Extract More Data');
        currentButtonState = 'extractMore';
        button.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
        button.disabled = false;
        button.style.opacity = '1';
        // Reset to Extract Data after 10 seconds
        scheduleButtonReset(10000);
      }, 1500);
    } else if (result && result.alreadyExtracted && button) {
      button.innerHTML = getButtonHtml('Extract More Data');
      currentButtonState = 'extractMore';
      button.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
      button.disabled = false;
      button.style.opacity = '1';
      // Reset to Extract Data after 10 seconds
      scheduleButtonReset(10000);
    } else if (button) {
      button.innerHTML = getButtonHtml('Extract Data');
      currentButtonState = 'extract';
      button.disabled = false;
      button.style.opacity = '1';
    }
    return;
  }
  
  // On Main page: Check mode and subscription
  const settings = await new Promise(resolve => {
    chrome.storage.local.get(['extractionMode'], resolve);
  });
  
  // Manual mode = don't auto extract
  if (settings.extractionMode !== 'auto') {
    return;
  }
  
  // Auto mode = check if premium
  const permission = await checkCanExtract();
  if (!permission.allowed || permission.reason !== 'premium') {
    return; // Free users don't get auto-extract
  }
  
  hasAutoExtracted = true;
  
  if (button) {
    button.innerHTML = '⏳ Extracting...';
    button.disabled = true;
    button.style.opacity = '0.7';
  }
  
  const result = await performExtraction();
  
  if (result && !result.alreadyExtracted && button) {
    button.innerHTML = '✅ Done!';
    currentButtonState = 'done';
    
    setTimeout(() => {
      button.innerHTML = getButtonHtml('Extract More Data');
      currentButtonState = 'extractMore';
      button.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
      button.disabled = false;
      button.style.opacity = '1';
      // Reset to Extract Data after 10 seconds
      scheduleButtonReset(10000);
    }, 1500);
  } else if (result && result.alreadyExtracted && button) {
    button.innerHTML = getButtonHtml('Extract More Data');
    currentButtonState = 'extractMore';
    button.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
    button.disabled = false;
    button.style.opacity = '1';
    // Reset to Extract Data after 10 seconds
    scheduleButtonReset(10000);
  } else if (button) {
    button.innerHTML = getButtonHtml('Extract Data');
    currentButtonState = 'extract';
    button.disabled = false;
    button.style.opacity = '1';
  }
}

/* =============================================================================
   INITIALIZATION
   ============================================================================= */

const extractedUrlsThisSession = new Set();
const extractedGroupUrlsThisSession = new Set();
let urlCheckTimeout = null;

function resetExtractionState() {
  currentButtonState = 'extract';
  hasAutoExtracted = false;
}

function init() {
  if (!window.location.href.includes('facebook.com')) return;
  
  resetExtractionState();
  
  setTimeout(() => {
    // Always show button on Facebook
    createExtractButton();
    
    // Only auto-extract on extractable pages
    if (isExtractablePage()) {
      setTimeout(runAutoExtract, CONFIG.AUTO_EXTRACT_DELAY);
    }
  }, CONFIG.INIT_DELAY);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

let lastUrl = location.href;
const observer = new MutationObserver(() => {
  if (urlCheckTimeout) return;
  
  urlCheckTimeout = setTimeout(() => {
    urlCheckTimeout = null;
    const currentUrl = location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      const oldBtn = document.querySelector('.eml-extract-btn');
      if (oldBtn) oldBtn.remove();
      init();
    }
  }, CONFIG.URL_CHECK_DEBOUNCE);
});

const observeTarget = document.querySelector('[role="main"]') || document.body;
observer.observe(observeTarget, { subtree: true, childList: true });

window.addEventListener('popstate', () => setTimeout(init, 1000));

log('Extract My Leads content script initialized');
