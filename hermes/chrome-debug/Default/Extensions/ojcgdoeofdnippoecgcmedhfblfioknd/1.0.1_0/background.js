// Message listener for various actions
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fullPageScreenshot') {
    captureFullPage(request.tabId).then(() => sendResponse({ success: true }));
    return true; // Keep channel open for async response
  } else if (request.action === 'captureElement') {
    // Get the sender tab ID if not provided
    const tabId = sender.tab ? sender.tab.id : request.tabId;
    captureElement(tabId, request.bounds).then(() => sendResponse({ success: true }));
    return true; // Keep channel open for async response
  }
});

// Generate filename with timestamp
function generateFilename(prefix) {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `${prefix}_${timestamp}.png`;
}

// Capture visible tab screenshot with retry logic
async function captureVisibleTab(windowId = null) {
  return new Promise((resolve, reject) => {
    chrome.tabs.captureVisibleTab(windowId, { format: 'png' }, (dataUrl) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(dataUrl);
      }
    });
  });
}

// Delay helper
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Capture full page by scrolling and stitching
async function captureFullPage(tabId) {
  let originalDimensions = null;

  try {
    // 1. Setup page: Disable smooth scroll and find floating elements
    await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        // Force auto scroll behavior
        const style = document.createElement('style');
        style.id = 'sc-temp-scroll-fix';
        style.innerHTML = 'html, body { scroll-behavior: auto !important; }';
        document.head.appendChild(style);

        const floating = [];
        const viewportHeight = window.innerHeight;
        document.querySelectorAll('*').forEach(el => {
          if (el.id === 'sc-extractor-modal' || el.id === 'sc-modal-root') return;
          const s = window.getComputedStyle(el);
          if (s.position === 'fixed' || s.position === 'sticky') {
            const rect = el.getBoundingClientRect();
            floating.push({
              el: el,
              originalVisibility: el.style.visibility,
              isTop: rect.top < viewportHeight / 2
            });
          }
        });
        window._sc_floating = floating;
      }
    });

    // 2. Get dimensions
    const [{ result: dimensions }] = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        const h = document.documentElement;
        const b = document.body;
        const height = Math.max(
          h.scrollHeight, h.offsetHeight, h.clientHeight,
          b.scrollHeight, b.offsetHeight, b.clientHeight
        );
        return {
          scrollHeight: height,
          viewportHeight: window.innerHeight,
          viewportWidth: window.innerWidth,
          scrollX: window.scrollX,
          scrollY: window.scrollY,
          devicePixelRatio: window.devicePixelRatio || 1
        };
      }
    });

    originalDimensions = dimensions;
    const { scrollHeight, viewportHeight } = dimensions;
    const screenshots = [];
    const scrollPositions = [];

    let currentY = 0;
    while (currentY < scrollHeight) {
      scrollPositions.push(currentY);
      currentY += viewportHeight;
    }

    // Capture each position
    for (let i = 0; i < scrollPositions.length; i++) {
      const yPos = scrollPositions[i];

      // Update floating visibility and scroll
      const [{ result: actualY }] = await chrome.scripting.executeScript({
        target: { tabId },
        func: (index, total, targetY) => {
          if (window._sc_floating) {
            window._sc_floating.forEach(item => {
              const shouldShow = (index === 0 && item.isTop) || (index === total - 1 && !item.isTop);
              item.el.style.visibility = shouldShow ? item.originalVisibility : 'hidden';
            });
          }
          window.scrollTo(0, targetY);
          return window.scrollY;
        },
        args: [i, scrollPositions.length, yPos]
      });

      await delay(600);

      try {
        const dataUrl = await captureVisibleTab(null);
        screenshots.push({ dataUrl, y: yPos, actualY: actualY });
      } catch (error) {
        console.error(`Capture fail at ${yPos}:`, error);
      }
    }

    if (screenshots.length > 0) {
      const finalImage = await stitchScreenshots(screenshots, dimensions);
      // Save to storage and open preview page
      await chrome.storage.local.set({ lastScreenshot: finalImage });
      chrome.tabs.create({ url: 'screenshot-preview.html' });
    }

  } catch (error) {
    console.error('Full page screenshot error:', error);
  } finally {
    // 3. Restore page state (even if error occurred)
    try {
      if (originalDimensions) {
        await chrome.scripting.executeScript({
          target: { tabId },
          func: (x, y) => {
            window.scrollTo(x, y);
            const fix = document.getElementById('sc-temp-scroll-fix');
            if (fix) fix.remove();
            if (window._sc_floating) {
              window._sc_floating.forEach(item => {
                item.el.style.visibility = item.originalVisibility;
              });
              delete window._sc_floating;
            }
          },
          args: [originalDimensions.scrollX, originalDimensions.scrollY]
        });
      }
    } catch (restoreError) {
      console.error('Failed to restore page state:', restoreError);
    }
  }
}

// Convert blob to data URL
async function blobToDataURL(blob) {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `data:${blob.type};base64,${btoa(binary)}`;
}

// Stitch screenshots together
async function stitchScreenshots(screenshots, dimensions) {
  const { scrollHeight, viewportWidth, viewportHeight, devicePixelRatio = 1 } = dimensions;
  const canvasWidth = Math.ceil(viewportWidth * devicePixelRatio);
  const canvasHeight = Math.ceil(scrollHeight * devicePixelRatio);

  const canvas = new OffscreenCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext('2d');

  for (let i = 0; i < screenshots.length; i++) {
    const { dataUrl, y, actualY } = screenshots[i];
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const bitmap = await createImageBitmap(blob);

    const remainingHeight = scrollHeight - y;
    const drawHeight = Math.min(viewportHeight, remainingHeight);
    const sourceY = Math.max(0, y - actualY);

    ctx.drawImage(
      bitmap,
      0, Math.ceil(sourceY * devicePixelRatio), bitmap.width, Math.ceil(drawHeight * devicePixelRatio),
      0, Math.ceil(y * devicePixelRatio), canvasWidth, Math.ceil(drawHeight * devicePixelRatio)
    );

    bitmap.close();
  }

  const blob = await canvas.convertToBlob({ type: 'image/png' });
  return await blobToDataURL(blob);
}

// Capture specific element
async function captureElement(tabId, bounds) {
  try {
    await delay(200);
    const [{ result: pageInfo }] = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        const el = document.querySelector('[data-sc-screenshot-target]');
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        const styles = window.getComputedStyle(el);
        const borderRadius = styles.borderRadius;
        el.removeAttribute('data-sc-screenshot-target');
        return {
          bounds: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
          borderRadius: borderRadius,
          devicePixelRatio: window.devicePixelRatio || 1
        };

      }
    });

    if (!pageInfo) return;
    const { bounds: newBounds, borderRadius, devicePixelRatio } = pageInfo;
    await delay(300);
    const dataUrl = await captureVisibleTab(null);
    const croppedImage = await cropImage(dataUrl, newBounds, devicePixelRatio, borderRadius);


    // Save to storage and open preview page
    await chrome.storage.local.set({ lastScreenshot: croppedImage });
    chrome.tabs.create({ url: 'screenshot-preview.html' });

  } catch (error) {
    console.error('Element screenshot error:', error);
  }
}

// Crop image with transparency support
async function cropImage(dataUrl, bounds, devicePixelRatio = 1, borderRadius = '0px') {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const bitmap = await createImageBitmap(blob);

  const PADDING = 24;
  const scaledPadding = Math.ceil(PADDING * devicePixelRatio);

  // Use Math.round for better sub-pixel accuracy from bounds
  const scaledBounds = {
    x: Math.round(bounds.x * devicePixelRatio),
    y: Math.round(bounds.y * devicePixelRatio),
    width: Math.round(bounds.width * devicePixelRatio),
    height: Math.round(bounds.height * devicePixelRatio)
  };

  const cropX = Math.max(0, Math.min(scaledBounds.x, bitmap.width));
  const cropY = Math.max(0, Math.min(scaledBounds.y, bitmap.height));
  const cropWidth = Math.min(scaledBounds.width, bitmap.width - cropX);
  const cropHeight = Math.min(scaledBounds.height, bitmap.height - cropY);

  const canvasWidth = cropWidth + (scaledPadding * 2);
  const canvasHeight = cropHeight + (scaledPadding * 2);
  const canvas = new OffscreenCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext('2d');

  // Parse border radius
  const radiusValues = borderRadius.split(' ').map(v => parseInt(v) * devicePixelRatio || 0);
  let r = { tl: 0, tr: 0, br: 0, bl: 0 };
  if (radiusValues.length === 1) {
    r = { tl: radiusValues[0], tr: radiusValues[0], br: radiusValues[0], bl: radiusValues[0] };
  } else if (radiusValues.length === 2) {
    r = { tl: radiusValues[0], tr: radiusValues[1], br: radiusValues[0], bl: radiusValues[1] };
  } else if (radiusValues.length === 4) {
    r = { tl: radiusValues[0], tr: radiusValues[1], br: radiusValues[2], bl: radiusValues[3] };
  }

  // Small inset (1.5px equivalent) to "shave off" background bleed from anti-aliasing
  const INSET = 1.5 * devicePixelRatio;
  const iw = cropWidth - (INSET * 2);
  const ih = cropHeight - (INSET * 2);

  // Create path for the element's rounded rectangle with a slight inset
  ctx.beginPath();
  ctx.moveTo(scaledPadding + INSET + r.tl, scaledPadding + INSET);
  ctx.lineTo(scaledPadding + INSET + iw - r.tr, scaledPadding + INSET);
  ctx.quadraticCurveTo(scaledPadding + INSET + iw, scaledPadding + INSET, scaledPadding + INSET + iw, scaledPadding + INSET + r.tr);
  ctx.lineTo(scaledPadding + INSET + iw, scaledPadding + INSET + ih - r.br);
  ctx.quadraticCurveTo(scaledPadding + INSET + iw, scaledPadding + INSET + ih, scaledPadding + INSET + iw - r.br, scaledPadding + INSET + ih);
  ctx.lineTo(scaledPadding + INSET + r.bl, scaledPadding + INSET + ih);
  ctx.quadraticCurveTo(scaledPadding + INSET, scaledPadding + INSET + ih, scaledPadding + INSET, scaledPadding + INSET + ih - r.bl);
  ctx.lineTo(scaledPadding + INSET, scaledPadding + INSET + r.tl);
  ctx.quadraticCurveTo(scaledPadding + INSET, scaledPadding + INSET, scaledPadding + INSET + r.tl, scaledPadding + INSET);
  ctx.closePath();

  // Clip to the rounded rect and draw
  ctx.clip();
  ctx.drawImage(bitmap, cropX, cropY, cropWidth, cropHeight, scaledPadding, scaledPadding, cropWidth, cropHeight);

  bitmap.close();
  const croppedBlob = await canvas.convertToBlob({ type: 'image/png' });
  return await blobToDataURL(croppedBlob);
}


