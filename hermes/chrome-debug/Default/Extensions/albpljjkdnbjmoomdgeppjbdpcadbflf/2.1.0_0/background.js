/**
 * Extract My Leads - Background Service Worker
 * @version 2.0.1
 * @description Handles subscription management, daily limits, and data storage
 * 
 * @author Krofile
 * @license MIT
 */

'use strict';

importScripts("./js/ExtPay.js");

/* =============================================================================
   CONFIGURATION
   ============================================================================= */

const CONFIG = {
  DAILY_FREE_LIMIT: 25,
  TRIAL_DAYS: 7,
  MAX_STORED_RECORDS: 10000
};

/* =============================================================================
   EXTPAY INITIALIZATION
   ============================================================================= */

const extpay = ExtPay("extract-my-leads");
extpay.startBackground();

/* =============================================================================
   PREMIUM ACCESS MANAGEMENT
   ============================================================================= */

/**
 * Check if user has premium access (paid or active trial)
 * @returns {Promise<boolean>}
 */
async function hasPremiumAccess() {
  try {
    const user = await extpay.getUser();
    
    if (user.paid) {
      return true;
    }
    
    if (user.trialStartedAt) {
      const now = new Date();
      const trialStart = new Date(user.trialStartedAt);
      const daysSinceTrialStart = Math.floor((now - trialStart) / (1000 * 60 * 60 * 24));
      
      if (daysSinceTrialStart < CONFIG.TRIAL_DAYS) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error("[EML] Error checking premium access:", error);
    return false;
  }
}

/* =============================================================================
   DAILY LIMIT MANAGEMENT
   ============================================================================= */

/**
 * Get today's date string for tracking daily limits
 * @returns {string}
 */
function getTodayString() {
  const today = new Date();
  return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
}

/**
 * Get daily extraction statistics
 * @returns {Promise<Object>}
 */
async function getDailyStats() {
  const today = getTodayString();
  
  return new Promise((resolve) => {
    chrome.storage.local.get(["dailyExtractions", "lastExtractionDate"], (result) => {
      let count = 0;
      
      if (result.lastExtractionDate === today) {
        count = result.dailyExtractions || 0;
      }
      
      resolve({
        count: count,
        limit: CONFIG.DAILY_FREE_LIMIT,
        remaining: Math.max(0, CONFIG.DAILY_FREE_LIMIT - count),
        date: today
      });
    });
  });
}

/**
 * Increment daily extraction count
 * @returns {Promise<Object>}
 */
async function incrementDailyCount() {
  const today = getTodayString();
  
  return new Promise((resolve) => {
    chrome.storage.local.get(["dailyExtractions", "lastExtractionDate"], (result) => {
      let count = 0;
      
      if (result.lastExtractionDate === today) {
        count = result.dailyExtractions || 0;
      }
      
      count += 1;
      
      chrome.storage.local.set({
        dailyExtractions: count,
        lastExtractionDate: today
      }, () => {
        resolve({
          count: count,
          limit: CONFIG.DAILY_FREE_LIMIT,
          remaining: Math.max(0, CONFIG.DAILY_FREE_LIMIT - count)
        });
      });
    });
  });
}

/**
 * Check if user can extract
 * @returns {Promise<Object>}
 */
async function canExtract() {
  const isPremium = await hasPremiumAccess();
  if (isPremium) {
    return { allowed: true, isPremium: true };
  }
  
  const stats = await getDailyStats();
  return {
    allowed: stats.remaining > 0,
    isPremium: false,
    remaining: stats.remaining,
    limit: stats.limit
  };
}

/* =============================================================================
   MESSAGE HANDLERS
   ============================================================================= */

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  
  // Save extracted data (with merge support)
  if (request.action === "saveData") {
    const data = request.data;
    data['Extracted At'] = new Date().toISOString();
    
    chrome.storage.local.get(["extractedData"], (result) => {
      let extractedData = result.extractedData || [];
      
      // Normalize URL for matching
      const normalizeUrl = (url) => {
        if (!url) return '';
        return url
          .replace(/\/about\/?$/, '')
          .replace(/\/about_life_events.*$/, '')
          .replace(/\/about_work_and_education.*$/, '')
          .replace(/\/about_places.*$/, '')
          .replace(/\/about_contact_and_basic_info.*$/, '')
          .replace(/\/about_family_and_relationships.*$/, '')
          .replace(/\/about_details.*$/, '')
          .replace(/\/about_overview.*$/, '')
          .replace(/[?&]sk=about[^&]*/, '')
          .replace(/\?$/, '')
          .replace(/\/$/, '')
          .toLowerCase();
      };
      
      const newUrl = normalizeUrl(data['Facebook URL']);
      
      // Find existing record by Facebook URL
      const existingIndex = extractedData.findIndex(record => {
        const recordUrl = normalizeUrl(record['Facebook URL']);
        return recordUrl === newUrl && newUrl !== '';
      });
      
      let merged = false;
      
      if (existingIndex >= 0) {
        // MERGE: New data fills gaps in existing record
        const existing = extractedData[existingIndex];
        
        Object.entries(data).forEach(([key, value]) => {
          if (!value) return;
          
          // Always update timestamp
          if (key === 'Extracted At') {
            existing[key] = value;
            return;
          }
          
          // For Description: prefer longer/more detailed version
          if (key === 'Description') {
            if (!existing[key] || value.length > existing[key].length) {
              existing[key] = value;
            }
            return;
          }
          
          // Don't overwrite existing data (except default categories)
          if (existing[key] && existing[key] !== 'Personal' && existing[key] !== 'Business') {
            return;
          }
          
          existing[key] = value;
        });
        
        extractedData[existingIndex] = existing;
        merged = true;
        console.log(`[EML] Merged data for: ${newUrl}`);
      } else {
        // NEW: Push new record
        extractedData.push(data);
        console.log(`[EML] Added new record for: ${newUrl}`);
      }
      
      // Enforce storage limit
      if (extractedData.length > CONFIG.MAX_STORED_RECORDS) {
        extractedData = extractedData.slice(-CONFIG.MAX_STORED_RECORDS);
        console.log(`[EML] Storage cleanup: kept last ${CONFIG.MAX_STORED_RECORDS} records`);
      }
      
      chrome.storage.local.set({ extractedData: extractedData }, () => {
        // Only increment daily count for NEW records, not merges
        if (!merged) {
          incrementDailyCount().then(() => {
            sendResponse({ success: true, count: extractedData.length, merged: false });
          });
        } else {
          sendResponse({ success: true, count: extractedData.length, merged: true });
        }
      });
    });
    return true;
  }
  
  // Get extraction mode
  if (request.message === "getLocalStorage") {
    chrome.storage.local.get(["extractionMode"], (result) => {
      sendResponse(result.extractionMode === "auto");
    });
    return true;
  }
  
  // Get daily stats
  if (request.action === "getDailyStats") {
    getDailyStats().then(sendResponse);
    return true;
  }
  
  // Increment daily count
  if (request.action === "incrementDailyCount") {
    incrementDailyCount().then(sendResponse);
    return true;
  }
  
  // Check if can extract
  if (request.action === "canExtract") {
    canExtract().then(sendResponse);
    return true;
  }
  
  // Check premium access
  if (request.action === "hasPremiumAccess") {
    hasPremiumAccess().then((result) => {
      sendResponse({ isPremium: result });
    });
    return true;
  }
  
  // Check subscription
  if (request.action === "checkSubscription") {
    hasPremiumAccess().then((result) => {
      sendResponse({ isPaid: result });
    });
    return true;
  }
  
  // Open payment page
  if (request.action === "openPaymentPage") {
    extpay.openPaymentPage();
    sendResponse({ success: true });
    return true;
  }
  
  // Open trial page
  if (request.action === "openTrialPage") {
    extpay.openTrialPage("7-day");
    sendResponse({ success: true });
    return true;
  }
});

/* =============================================================================
   EXTPAY EVENT LISTENERS
   ============================================================================= */

extpay.onPaid.addListener((user) => {
  console.log("[EML] User paid!", user);
  
  chrome.notifications.create({
    type: "basic",
    iconUrl: "./icons/icon128.png",
    title: "Welcome to Premium!",
    message: "Thank you for your purchase. Enjoy unlimited extractions!"
  });
});

extpay.onTrialStarted.addListener((user) => {
  console.log("[EML] Trial started!", user);
  
  chrome.notifications.create({
    type: "basic",
    iconUrl: "./icons/icon128.png",
    title: "Trial Started!",
    message: "Your 7-day free trial has begun. Enjoy all premium features!"
  });
});

console.log("[EML] Background service worker initialized");
