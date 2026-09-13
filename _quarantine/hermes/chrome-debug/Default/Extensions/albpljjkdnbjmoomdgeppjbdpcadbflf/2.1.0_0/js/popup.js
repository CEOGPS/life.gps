/**
 * Extract My Leads - Popup Script
 * @version 2.1.0
 * @description Handles popup UI, CSV export, subscription management, and user settings
 * 
 * Pricing Tiers:
 * - Free: 25 extractions/day
 * - Trial: 7-day free trial with full access
 * - Pro: $9.99/month subscription
 * - Lifetime: $49.99 one-time (50% off with GET50)
 * 
 * @author Krofile
 * @license MIT
 */

'use strict';

/* =============================================================================
   CONFIGURATION
   ============================================================================= */

const CONFIG = {
  TRIAL_DAYS: 7,
  DAILY_FREE_LIMIT: 25,
  MAX_COLUMNS: 100,
  PROMO: {
    code: 'GET50',
    discount: '50% off',
    enabled: true
  }
};

const PRIORITY_COLUMNS = [
  'Name', 'Verified', 'Category', 'Email', 'Phone', 'Phone 2',
  'Work', 'Work 2', 'Work 3', 'Past Work', 'Past Work 2',
  'Education', 'Education 2', 'Education 3',
  'City', 'Hometown', 'Address',
  'Followers', 'Following', 'Likes', 'Friends',
  'Rating', 'Reviews', 'Price Range', 'Services',
  'Website', 'Website 2', 'Website 3',
  'Krofile', 'Krofile 2',
  'Instagram', 'Instagram 2', 'Instagram 3',
  'TikTok', 'TikTok 2', 'X/Twitter', 'LinkedIn', 'LinkedIn 2',
  'YouTube', 'YouTube 2', 'Spotify', 'WhatsApp',
  'Telegram', 'Discord', 'Snapchat', 'Pinterest', 'Facebook',
  'Twitch', 'SoundCloud', 'Apple Music', 'Bandcamp', 'Patreon',
  'Ko-fi', 'Linktree', 'Beacons', 'Calendly', 'GitHub',
  'Behance', 'Dribbble', 'Medium', 'Substack', 'Yelp', 'TripAdvisor',
  'Signal', 'LINE', 'Viber', 'WeChat',
  'Channel Name', 'Channel URL', 'Channel Members',
  'Description',
  'Facebook URL'
];

// Group-specific columns
const GROUP_PRIORITY_COLUMNS = [
  'Name',           // Group name
  'Category',       // Public/Private
  'Followers',      // Member count
  'Email',          // From description
  'Phone',          // From description
  'Website',        // From description
  'City',           // Location
  'Services',       // Tags
  'Admins',         // NEW: Admin names
  'Created',        // NEW: Created date
  'Posts Today',    // NEW: Posts count today
  'Posts Month',    // NEW: Posts count this month
  'Group Rules',    // NEW: Rule titles
  'Description',
  'Facebook URL'
];

const END_COLUMNS = [
  'Other Link 1', 'Other Link 2', 'Other Link 3', 
  'Other Link 4', 'Other Link 5', 'Extracted At'
];

/* =============================================================================
   STATE
   ============================================================================= */

let extpay = null;

let userState = {
  isPaid: false,
  isTrialActive: false,
  isLifetime: false,
  trialDaysLeft: 0,
  subscriptionStatus: null,
  email: null
};

/* =============================================================================
   CSV UTILITIES
   ============================================================================= */

/**
 * Escape value for CSV format with injection protection
 * @param {*} value - Value to escape
 * @returns {string} Escaped CSV value
 */
function escapeCSV(value) {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  let stringValue = String(value);

  const dangerousChars = ['=', '+', '-', '@', '\t', '\r'];
  if (dangerousChars.some(char => stringValue.startsWith(char))) {
    stringValue = "'" + stringValue;
  }

  if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
    return '"' + stringValue.replace(/"/g, '""') + '"';
  }

  return stringValue;
}

/**
 * Get all unique columns from records with priority ordering
 * @param {Array} records - Extracted data records
 * @param {Array} priorityColumns - Priority column order (defaults to PRIORITY_COLUMNS)
 * @returns {Array} Ordered column names (max 100)
 */
function getAllColumns(records, priorityColumns = PRIORITY_COLUMNS) {
  const columnsSet = new Set();
  
  priorityColumns.forEach(col => {
    records.forEach(record => {
      if (record[col]) columnsSet.add(col);
    });
  });
  
  records.forEach(record => {
    Object.keys(record).forEach(key => {
      if (!END_COLUMNS.includes(key)) {
        columnsSet.add(key);
      }
    });
  });
  
  const columns = [];
  
  // Add priority columns first (in order)
  priorityColumns.forEach(col => {
    if (columnsSet.has(col) && columns.length < CONFIG.MAX_COLUMNS) {
      columns.push(col);
      columnsSet.delete(col);
    }
  });
  
  // Add remaining columns (alphabetized)
  const remainingCols = [];
  columnsSet.forEach(col => {
    if (!END_COLUMNS.includes(col)) {
      remainingCols.push(col);
    }
  });
  remainingCols.sort();
  remainingCols.forEach(col => {
    if (columns.length < CONFIG.MAX_COLUMNS) {
      columns.push(col);
    }
  });
  
  // Add end columns last (if space available)
  END_COLUMNS.forEach(col => {
    if (columns.length < CONFIG.MAX_COLUMNS) {
      const exists = records.some(record => record[col]);
      if (exists) {
        columns.push(col);
      }
    }
  });
  
  return columns;
}

/**
 * Convert records to CSV string
 * @param {Array} records - Data records
 * @param {Array} priorityColumns - Priority column order (optional)
 * @returns {string} CSV content
 */
function convertToCSV(records, priorityColumns = PRIORITY_COLUMNS) {
  if (!records || records.length === 0) {
    return '';
  }
  
  const columns = getAllColumns(records, priorityColumns);
  let csvContent = columns.map(col => escapeCSV(col)).join(',') + '\n';
  
  records.forEach(record => {
    const row = columns.map(col => escapeCSV(record[col] || ''));
    csvContent += row.join(',') + '\n';
  });
  
  return csvContent;
}

/**
 * Generate filename with current date
 * @param {string} type - Type of data ('pages' or 'groups')
 * @returns {string} Filename
 */
function generateFilename(type = 'pages') {
  const currentDate = new Date();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0");
  const day = String(currentDate.getDate()).padStart(2, "0");
  const year = String(currentDate.getFullYear());
  const prefix = type === 'groups' ? 'groups' : 'leads';
  return `${prefix}_${month}${day}${year}.csv`;
}

/**
 * Download CSV file
 * @param {string} csvContent - CSV content
 * @param {string} type - Type of data ('pages' or 'groups')
 */
function downloadCSV(csvContent, type = 'pages') {
  const BOM = "\uFEFF";
  const csvData = BOM + csvContent;

  const blob = new Blob([csvData], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = generateFilename(type);

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* =============================================================================
   EXTPAY & SUBSCRIPTION
   ============================================================================= */

/**
 * Initialize ExtPay payment system
 * @returns {Promise<void>}
 */
async function initializeExtPay() {
  const script = document.createElement("script");
  script.src = chrome.runtime.getURL("./js/ExtPay.js");

  return new Promise((resolve) => {
    script.onload = () => {
      extpay = ExtPay("extract-my-leads");
      resolve();
    };
    document.head.appendChild(script);
  });
}

/**
 * Check and update user subscription status
 * @returns {Promise<Object>} User state
 */
async function checkUserStatus() {
  try {
    const user = await extpay.getUser();
    
    // Store email if available
    if (user.email) {
      userState.email = user.email;
    }
    
    if (user.paid) {
      userState.isPaid = true;
      userState.subscriptionStatus = user.subscriptionStatus;
      
      if (!user.subscriptionStatus || user.subscriptionStatus === null) {
        userState.isLifetime = true;
      }
      
      return userState;
    }
    
    if (user.trialStartedAt) {
      const now = new Date();
      const trialStart = new Date(user.trialStartedAt);
      const daysSinceTrialStart = Math.floor((now - trialStart) / (1000 * 60 * 60 * 24));
      
      if (daysSinceTrialStart < CONFIG.TRIAL_DAYS) {
        userState.isTrialActive = true;
        userState.trialDaysLeft = CONFIG.TRIAL_DAYS - daysSinceTrialStart;
      }
    }
    
    return userState;
  } catch (error) {
    console.error("[EML] Error checking user status:", error);
    return userState;
  }
}

/**
 * Check if user has premium access (paid or trial)
 * @returns {boolean}
 */
function hasPremiumAccess() {
  return userState.isPaid || userState.isTrialActive;
}

/* =============================================================================
   DAILY STATS
   ============================================================================= */

/**
 * Get daily extraction statistics from background
 * @returns {Promise<Object>}
 */
async function getDailyStats() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: "getDailyStats" }, (response) => {
      resolve(response || { count: 0, limit: CONFIG.DAILY_FREE_LIMIT, remaining: CONFIG.DAILY_FREE_LIMIT });
    });
  });
}

/**
 * Update daily limit display in UI
 */
function updateDailyLimitDisplay() {
  getDailyStats().then(stats => {
    const limitCount = document.getElementById("limitCount");
    const limitProgress = document.getElementById("limitProgress");
    
    if (limitCount) {
      // Show count/limit (e.g., "1/25" = 1 used of 25 allowed)
      limitCount.textContent = `${stats.count}/${stats.limit}`;
    }
    
    if (limitProgress) {
      // Progress bar fills up as extractions are used
      const percentage = (stats.count / stats.limit) * 100;
      limitProgress.style.width = `${percentage}%`;
      
      // Add "low" class when only 5 or fewer remaining
      if (stats.remaining <= 5) {
        limitProgress.classList.add('low');
      } else {
        limitProgress.classList.remove('low');
      }
    }
  });
}

/* =============================================================================
   UI UPDATES
   ============================================================================= */

/**
 * Update recent captures list
 */
function updateRecentCaptures() {
  chrome.storage.local.get(["extractedData"], function (result) {
    const records = result.extractedData || [];
    const captureList = document.getElementById("captureList");
    const recentCount = document.getElementById("recentCount");
    
    if (recentCount) {
      recentCount.textContent = `${records.length} items`;
    }
    
    if (captureList) {
      if (records.length === 0) {
        captureList.innerHTML = '<div class="empty-state">No captures yet. Visit a Facebook page to start.</div>';
        return;
      }
      
      captureList.innerHTML = "";
      const recentItems = records.slice(-3).reverse();

      recentItems.forEach((record, index) => {
        const name = record['Name'] || 'Unknown';
        const captureItem = document.createElement("div");
        captureItem.className = "capture-item";
        captureItem.innerHTML = `
          <span class="item-number">${index + 1}</span>
          <span class="page-name">${name}</span>
        `;
        captureList.appendChild(captureItem);
      });
    }
  });
}

/**
 * Update extraction count display
 */
function updateExtractCount() {
  chrome.storage.local.get(["extractedData"], function (result) {
    const records = result.extractedData || [];
    const extractCount = document.getElementById("extractCount");
    if (extractCount) {
      extractCount.textContent = records.length;
    }
  });
}

/**
 * Update group recent captures list
 */
function updateGroupRecentCaptures() {
  chrome.storage.local.get(["extractedGroupData"], function (result) {
    const records = result.extractedGroupData || [];
    const captureList = document.getElementById("groupCaptureList");
    const recentCount = document.getElementById("recentGroupCount");
    
    if (recentCount) {
      recentCount.textContent = `${records.length} items`;
    }
    
    if (captureList) {
      if (records.length === 0) {
        captureList.innerHTML = '<div class="empty-state">No groups yet. Visit a Facebook group to start.</div>';
        return;
      }
      
      captureList.innerHTML = "";
      const recentItems = records.slice(-3).reverse();

      recentItems.forEach((record, index) => {
        const name = record['Name'] || 'Unknown Group';
        const category = record['Category'] || '';
        const captureItem = document.createElement("div");
        captureItem.className = "capture-item";
        captureItem.innerHTML = `
          <span class="item-number">${index + 1}</span>
          <span class="page-name">${name}</span>
          <span class="item-category" style="font-size: 11px; color: var(--gray-400);">${category}</span>
        `;
        captureList.appendChild(captureItem);
      });
    }
  });
}

/**
 * Update group extraction count display
 */
function updateGroupExtractCount() {
  chrome.storage.local.get(["extractedGroupData"], function (result) {
    const records = result.extractedGroupData || [];
    const extractCount = document.getElementById("groupExtractCount");
    if (extractCount) {
      extractCount.textContent = records.length;
    }
  });
}

/**
 * Update UI based on user subscription state
 */
function updateUIForUserState() {
  const userBadge = document.getElementById("userBadge");
  const badgeText = document.getElementById("badgeText");
  const badgeArrow = document.getElementById("badgeArrow");
  const userEmail = document.getElementById("userEmail");
  const userPlan = document.getElementById("userPlan");
  const limitSection = document.getElementById("limitSection");
  const promoBanner = document.getElementById("promoBanner");
  const trialBanner = document.getElementById("trialBanner");
  const trialDays = document.getElementById("trialDays");
  const loginLink = document.getElementById("loginLink");
  const manageAccount = document.getElementById("manageAccount");
  const manageAccountIcon = document.getElementById("manageAccountIcon");
  const manageAccountText = document.getElementById("manageAccountText");
  
  userBadge.className = "user-badge";
  
  // Check if user is logged in (has email or is paid)
  const isLoggedIn = userState.email || userState.isPaid || userState.isTrialActive;
  
  if (isLoggedIn) {
    // Make badge clickable for logged-in users
    userBadge.classList.add("clickable");
    badgeArrow.classList.remove("hidden");
    
    // Hide the "Already paid? Login" link
    if (loginLink) loginLink.style.display = "none";
    
    // Update user info in dropdown
    if (userState.email) {
      userEmail.textContent = userState.email;
    } else {
      userEmail.textContent = "Premium User";
    }
  } else {
    userBadge.classList.remove("clickable");
    badgeArrow.classList.add("hidden");
    
    // Show the "Already paid? Login" link
    if (loginLink) loginLink.style.display = "flex";
  }
  
  if (userState.isPaid) {
    if (userState.isLifetime) {
      userBadge.classList.add("lifetime");
      badgeText.textContent = "Lifetime";
      userPlan.textContent = "Lifetime Member";
      // Hide manage account for lifetime users (nothing to manage)
      if (manageAccount) manageAccount.style.display = "none";
    } else {
      userBadge.classList.add("pro");
      badgeText.textContent = "Pro";
      userPlan.textContent = "Pro Subscriber";
      // Show manage subscription for monthly/yearly subscribers
      if (manageAccount) {
        manageAccount.style.display = "flex";
        manageAccountIcon.textContent = "⚙️";
        manageAccountText.textContent = "Manage Subscription";
      }
    }
    limitSection.classList.add("hidden");
    promoBanner.classList.add("hidden");
    trialBanner.classList.add("hidden");
  } else if (userState.isTrialActive) {
    userBadge.classList.add("trial");
    badgeText.textContent = "Trial";
    userPlan.textContent = `Trial - ${userState.trialDaysLeft} day${userState.trialDaysLeft !== 1 ? 's' : ''} left`;
    // Show upgrade button for trial users
    if (manageAccount) {
      manageAccount.style.display = "flex";
      manageAccountIcon.textContent = "🚀";
      manageAccountText.textContent = "Upgrade to Pro";
    }
    limitSection.classList.add("hidden");
    promoBanner.classList.add("hidden");
    trialBanner.classList.remove("hidden");
    trialDays.textContent = `${userState.trialDaysLeft} day${userState.trialDaysLeft !== 1 ? 's' : ''} left`;
  } else {
    userBadge.classList.add("free");
    badgeText.textContent = "Free";
    userPlan.textContent = "Free Plan";
    // Show upgrade button for free users (if they somehow get to dropdown)
    if (manageAccount) {
      manageAccount.style.display = "flex";
      manageAccountIcon.textContent = "🚀";
      manageAccountText.textContent = "Upgrade to Pro";
    }
    limitSection.classList.remove("hidden");
    trialBanner.classList.add("hidden");
    
    chrome.storage.local.get(["promoDismissed"], (result) => {
      if (!result.promoDismissed && CONFIG.PROMO.enabled) {
        promoBanner.classList.remove("hidden");
      } else {
        promoBanner.classList.add("hidden");
      }
    });
    
    updateDailyLimitDisplay();
  }
}

/* =============================================================================
   DOWNLOAD FUNCTIONS
   ============================================================================= */

/**
 * Download all extracted data as CSV
 */
function downloadTextfile() {
  chrome.storage.local.get(["extractedData"], function (result) {
    const records = result.extractedData || [];
    if (records.length === 0) {
      alert("No data to download. Extract some pages first!");
      return;
    }
    const csvContent = convertToCSV(records);
    downloadCSV(csvContent);
  });
}

/**
 * Clear all extracted data (preserves daily limit tracking)
 */
function clearExtractedData() {
  chrome.storage.local.get(["extractedData"], function (result) {
    const records = result.extractedData || [];
    if (records.length === 0) {
      alert("No data to clear.");
      return;
    }
    
    const confirmClear = confirm(
      `Are you sure you want to delete ${records.length} extracted record${records.length !== 1 ? 's' : ''}?\n\nThis cannot be undone. Your daily extraction limit will NOT be reset.`
    );
    
    if (confirmClear) {
      // Only clear extractedData, preserve dailyExtractions and lastExtractionDate
      chrome.storage.local.set({ extractedData: [] }, function() {
        updateExtractCount();
        updateRecentCaptures();
        alert("All extracted data has been cleared.");
      });
    }
  });
}

/**
 * Download all group data as CSV
 */
function downloadGroupData() {
  chrome.storage.local.get(["extractedGroupData"], function (result) {
    const records = result.extractedGroupData || [];
    if (records.length === 0) {
      alert("No group data to download. Extract some groups first!");
      return;
    }
    const csvContent = convertToCSV(records, GROUP_PRIORITY_COLUMNS);
    downloadCSV(csvContent, 'groups');
  });
}

/**
 * Clear all group data
 */
function clearGroupData() {
  chrome.storage.local.get(["extractedGroupData"], function (result) {
    const records = result.extractedGroupData || [];
    if (records.length === 0) {
      alert("No group data to clear.");
      return;
    }
    
    const confirmClear = confirm(
      `Are you sure you want to delete ${records.length} group record${records.length !== 1 ? 's' : ''}?\n\nThis cannot be undone.`
    );
    
    if (confirmClear) {
      chrome.storage.local.set({ extractedGroupData: [] }, function() {
        updateGroupExtractCount();
        updateGroupRecentCaptures();
        alert("All group data has been cleared.");
      });
    }
  });
}

/**
 * Switch between Pages and Groups tabs
 */
function switchTab(tab) {
  const tabPages = document.getElementById("tabPages");
  const tabGroups = document.getElementById("tabGroups");
  const pagesContent = document.getElementById("pagesTabContent");
  const groupsContent = document.getElementById("groupsTabContent");
  
  if (tab === 'pages') {
    tabPages.classList.add("active");
    tabGroups.classList.remove("active");
    pagesContent.classList.add("active");
    groupsContent.classList.remove("active");
  } else {
    tabGroups.classList.add("active");
    tabPages.classList.remove("active");
    groupsContent.classList.add("active");
    pagesContent.classList.remove("active");
  }
}

/* =============================================================================
   VIEW NAVIGATION
   ============================================================================= */

/**
 * Show main view
 */
function showMainView() {
  document.getElementById("mainView").classList.remove("hidden");
  document.getElementById("mainView").style.display = "block";
  document.getElementById("pricingView").classList.remove("active");
}

/**
 * Show pricing view
 */
function showPricingView() {
  document.getElementById("mainView").style.display = "none";
  document.getElementById("pricingView").classList.add("active");
}

/* =============================================================================
   SETTINGS
   ============================================================================= */

/**
 * Load saved settings from storage
 */
function loadSettings() {
  chrome.storage.local.get(["extractionMode"], (result) => {
    const mode = result.extractionMode || "manual";
    const manualBtn = document.getElementById("modeManual");
    const autoBtn = document.getElementById("modeAuto");
    
    if (mode === "auto") {
      manualBtn.classList.remove("active");
      autoBtn.classList.add("active");
    } else {
      manualBtn.classList.add("active");
      autoBtn.classList.remove("active");
    }
  });
}

/* =============================================================================
   EVENT LISTENERS
   ============================================================================= */

/**
 * Set up all event listeners
 */
function setupEventListeners() {
  // Download button - direct download (no filter modal)
  document.getElementById("downloadBtn").addEventListener("click", () => {
    downloadTextfile();
  });
  
  // Clear data button
  document.getElementById("clearDataBtn").addEventListener("click", () => {
    clearExtractedData();
  });
  
  // Mode toggle
  const modeManual = document.getElementById("modeManual");
  const modeAuto = document.getElementById("modeAuto");
  
  modeManual.addEventListener("click", () => {
    if (!hasPremiumAccess()) {
      showPricingView();
      return;
    }
    modeManual.classList.add("active");
    modeAuto.classList.remove("active");
    chrome.storage.local.set({ extractionMode: "manual" });
  });
  
  modeAuto.addEventListener("click", () => {
    if (!hasPremiumAccess()) {
      showPricingView();
      return;
    }
    modeAuto.classList.add("active");
    modeManual.classList.remove("active");
    chrome.storage.local.set({ extractionMode: "auto" });
  });
  
  // Upgrade links
  document.getElementById("showPricing").addEventListener("click", showPricingView);
  
  // Promo banner
  document.getElementById("promoBanner").addEventListener("click", (e) => {
    if (e.target.id !== "promoCodeCopy" && e.target.id !== "dismissPromo") {
      showPricingView();
    }
  });
  
  // Copy promo code
  document.getElementById("promoCodeCopy").addEventListener("click", (e) => {
    e.stopPropagation();
    const code = e.target.textContent;
    navigator.clipboard.writeText(code).then(() => {
      const originalText = e.target.textContent;
      e.target.textContent = "Copied!";
      e.target.style.background = "rgba(16, 185, 129, 0.4)";
      setTimeout(() => {
        e.target.textContent = originalText;
        e.target.style.background = "";
      }, 1500);
    });
  });
  
  // Dismiss promo
  document.getElementById("dismissPromo").addEventListener("click", (e) => {
    e.stopPropagation();
    chrome.storage.local.set({ promoDismissed: true });
    document.getElementById("promoBanner").classList.add("hidden");
  });
  
  // Back button
  document.getElementById("backToMain").addEventListener("click", showMainView);
  
  // Trial button
  document.getElementById("startTrialBtn").addEventListener("click", () => {
    extpay.openTrialPage("7-day");
  });
  
  // Lifetime button
  document.getElementById("buyLifetimeBtn").addEventListener("click", () => {
    extpay.openPaymentPage();
  });
  
  // Monthly plan card
  document.getElementById("monthlyPlanCard").addEventListener("click", (e) => {
    if (e.target.id !== "startTrialBtn") {
      extpay.openTrialPage("7-day");
    }
  });
  
  // Login link
  document.getElementById("loginLink").addEventListener("click", () => {
    extpay.openLoginPage();
  });
  
  // Tab switching
  document.getElementById("tabPages").addEventListener("click", () => {
    switchTab('pages');
  });
  
  document.getElementById("tabGroups").addEventListener("click", () => {
    switchTab('groups');
  });
  
  // Group download button
  document.getElementById("downloadGroupBtn").addEventListener("click", () => {
    downloadGroupData();
  });
  
  // Group clear data button
  document.getElementById("clearGroupDataBtn").addEventListener("click", () => {
    clearGroupData();
  });
  
  // User menu toggle
  const userBadge = document.getElementById("userBadge");
  const userDropdown = document.getElementById("userDropdown");
  
  userBadge.addEventListener("click", (e) => {
    // Only toggle if user is logged in (badge is clickable)
    if (userBadge.classList.contains("clickable")) {
      e.stopPropagation();
      userDropdown.classList.toggle("show");
    }
  });
  
  // Close dropdown when clicking outside
  document.addEventListener("click", (e) => {
    if (!userDropdown.contains(e.target) && !userBadge.contains(e.target)) {
      userDropdown.classList.remove("show");
    }
  });
  
  // Manage account button
  document.getElementById("manageAccount").addEventListener("click", () => {
    extpay.openPaymentPage();
    userDropdown.classList.remove("show");
  });
  
  // Logout button
  document.getElementById("logoutBtn").addEventListener("click", async () => {
    try {
      // Close dropdown
      userDropdown.classList.remove("show");
      
      // ExtPay uses these specific storage keys:
      const extpayKeys = [
        'extensionpay_user',
        'extensionpay_installed_at',
        'extensionpay_api_key'
      ];
      
      // Clear from sync storage (ExtPay's default)
      chrome.storage.sync.remove(extpayKeys, () => {
        console.log('[EML] Cleared ExtPay sync storage');
      });
      
      // Also clear from local storage (backup)
      chrome.storage.local.remove(extpayKeys, () => {
        console.log('[EML] Cleared ExtPay local storage');
        
        // Reload popup after storage is cleared
        setTimeout(() => {
          window.location.reload();
        }, 100);
      });
      
    } catch (error) {
      console.error("[EML] Error logging out:", error);
      window.location.reload();
    }
  });
}

/* =============================================================================
   INITIALIZATION
   ============================================================================= */

/**
 * Initialize the popup application
 */
async function initApp() {
  try {
    await initializeExtPay();
    await checkUserStatus();
    
    updateUIForUserState();
    updateExtractCount();
    updateRecentCaptures();
    updateGroupExtractCount();
    updateGroupRecentCaptures();
    loadSettings();
    setupEventListeners();
    
    document.getElementById("loadingState").classList.add("hidden");
    document.getElementById("appContainer").classList.remove("hidden");
    
    extpay.onPaid.addListener(() => {
      userState.isPaid = true;
      updateUIForUserState();
    });
    
    extpay.onTrialStarted.addListener(() => {
      userState.isTrialActive = true;
      userState.trialDaysLeft = CONFIG.TRIAL_DAYS;
      updateUIForUserState();
    });
    
  } catch (error) {
    console.error("[EML] Error initializing app:", error);
    document.getElementById("loadingState").innerHTML = 
      '<p style="color: #ef4444; text-align: center; padding: 20px;">Error loading. Please refresh.</p>';
  }
}

document.addEventListener("DOMContentLoaded", initApp);
