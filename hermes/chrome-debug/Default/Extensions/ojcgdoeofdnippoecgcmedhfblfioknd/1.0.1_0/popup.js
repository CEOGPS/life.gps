// Get current active tab
async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

// Check if we can run scripts on this page
function canRunOnPage(url) {
  if (!url) return false;
  // Can't run on chrome:// pages, chrome-extension:// pages, or chrome web store
  const restrictedPatterns = [
    /^chrome:\/\//,
    /^chrome-extension:\/\//,
    /^https:\/\/chrome\.google\.com\/webstore/,
    /^about:/,
    /^edge:\/\//,
    /^brave:\/\//
  ];
  return !restrictedPatterns.some(pattern => pattern.test(url));
}

// Inject content script if needed and send message
async function sendMessageToTab(tab, message) {
  if (!canRunOnPage(tab.url)) {
    alert('SnapCode Pro cannot run on this page (browser internal pages are restricted).');
    return false;
  }

  try {
    // Try to send message first (content script may already be loaded)
    await chrome.tabs.sendMessage(tab.id, message);
    return true;
  } catch (error) {
    // Content script not loaded, inject it first
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
      await chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ['styles.css']
      });
      // Small delay to let script initialize
      await new Promise(r => setTimeout(r, 100));
      // Now send the message
      await chrome.tabs.sendMessage(tab.id, message);
      return true;
    } catch (injectError) {
      console.error('Failed to inject content script:', injectError);
      alert('Could not activate SnapCode Pro on this page. Please refresh and try again.');
      return false;
    }
  }
}

// Extract UI button
document.getElementById('extract-ui').addEventListener('click', async () => {
  const tab = await getCurrentTab();
  const success = await sendMessageToTab(tab, { action: 'togglePicker', mode: 'extract' });
  if (success) window.close();
});

// Full Page Screenshot button
document.getElementById('full-screenshot').addEventListener('click', async () => {
  const tab = await getCurrentTab();

  if (!canRunOnPage(tab.url)) {
    alert('SnapCode Pro cannot take screenshots of browser internal pages.');
    return;
  }

  try {
    await chrome.runtime.sendMessage({ action: 'fullPageScreenshot', tabId: tab.id });
    window.close();
  } catch (error) {
    console.error('Screenshot error:', error);
    alert('Failed to capture screenshot. Please try again.');
  }
});

// Element Screenshot button
document.getElementById('element-screenshot').addEventListener('click', async () => {
  const tab = await getCurrentTab();
  const success = await sendMessageToTab(tab, { action: 'togglePicker', mode: 'screenshot' });
  if (success) window.close();
});

