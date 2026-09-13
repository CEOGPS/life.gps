(function () {
  if (window.__snapcode_pro_injected) return;
  window.__snapcode_pro_injected = true;

  let isPickerActive = false;
  let pickerMode = 'extract'; // 'extract' or 'screenshot'
  let hoveredElement = null;
  let highlightBox = null;
  let infoLabel = null;
  let originalCursor = '';

  function createHighlightUI() {
    if (highlightBox) return;

    highlightBox = document.createElement('div');
    highlightBox.id = 'sc-picker-highlighter';

    // Different colors based on mode
    const color = pickerMode === 'screenshot' ? '#f59e0b' : '#a855f7';

    highlightBox.className = 'sc-picker-highlighter sc-hidden sc-vars';
    highlightBox.style.borderColor = color;
    highlightBox.style.backgroundColor = `${color}1a`;
    highlightBox.style.boxShadow = `0 0 15px ${color}4d`;

    infoLabel = document.createElement('div');
    infoLabel.id = 'sc-picker-info';
    infoLabel.className = 'sc-picker-info';
    infoLabel.style.backgroundColor = color;

    highlightBox.appendChild(infoLabel);
    document.body.appendChild(highlightBox);
  }

  function updateHighlightColor() {
    if (!highlightBox || !infoLabel) return;

    const color = pickerMode === 'screenshot' ? '#f59e0b' : '#a855f7';
    highlightBox.style.borderColor = color;
    highlightBox.style.backgroundColor = `${color}1a`;
    highlightBox.style.boxShadow = `0 0 15px ${color}4d`;
    infoLabel.style.backgroundColor = color;
  }

  function updateHighlight(el) {
    if (!highlightBox) return;

    if (!el || el === highlightBox || el === infoLabel || el.id?.startsWith('sc-')) {
      highlightBox.classList.add('sc-hidden');
      return;
    }

    const rect = el.getBoundingClientRect();
    highlightBox.classList.remove('sc-hidden');
    highlightBox.style.width = `${rect.width}px`;
    highlightBox.style.height = `${rect.height}px`;
    highlightBox.style.top = `${rect.top + window.scrollY}px`; // Use scroll position for absolute positioning if needed, wait.
    // Actually the CSS says position: fixed, so rect.top/left is fine. 
    // Wait, rect.top is relative to viewport. Position: fixed is also relative to viewport.
    highlightBox.style.top = `${rect.top}px`;
    highlightBox.style.left = `${rect.left}px`;

    const classVal = el.getAttribute('class') || '';
    const className = classVal ? `.${classVal.trim().split(/\s+/).join('.')}` : '';
    const idName = el.id ? `#${el.id}` : '';
    infoLabel.textContent = `${el.tagName.toLowerCase()}${idName}${className}`;

    // Position label inside if too close to top
    if (rect.top < 40) {
      infoLabel.style.top = '100%';
      infoLabel.style.marginTop = '4px';
    } else {
      infoLabel.style.top = '-30px';
      infoLabel.style.marginTop = '0';
    }
  }

  function handleMouseMove(e) {
    if (!isPickerActive) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (el !== hoveredElement) {
      hoveredElement = el;
      updateHighlight(el);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape' && isPickerActive) {
      deactivatePicker();
    }
  }

  function handleClick(e) {
    if (!isPickerActive) return;
    e.preventDefault();
    e.stopPropagation();

    const el = hoveredElement;
    if (el) {
      try {
        if (pickerMode === 'extract') {
          extractElementData(el);
        } else if (pickerMode === 'screenshot') {
          captureElementScreenshot(el);
        }
      } catch (err) {
        console.error('SnapCode Pro Error:', err);
      }
    }
    deactivatePicker();
  }

  // Capture element screenshot
  function captureElementScreenshot(el) {
    const rect = el.getBoundingClientRect();

    // Mark element for identification by background script
    el.setAttribute('data-sc-screenshot-target', 'true');

    // Send bounds to background script
    chrome.runtime.sendMessage({
      action: 'captureElement',
      bounds: {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        top: rect.top,
        left: rect.left
      }
    });
  }

  let helpBar = null;

  function createHelpBar() {
    if (helpBar) return;

    const color = pickerMode === 'screenshot' ? '#f59e0b' : '#a855f7';
    const modeText = pickerMode === 'screenshot'
      ? 'Click an element to screenshot'
      : 'Click an element to extract';

    helpBar = document.createElement('div');
    helpBar.id = 'sc-picker-help-bar';
    helpBar.className = 'sc-picker-help sc-vars';

    helpBar.innerHTML = `
      <span style="width: 8px; height: 8px; border-radius: 50%; background: ${color}"></span>
      <span>${modeText}. Press <kbd>ESC</kbd> to cancel.</span>
    `;

    document.body.appendChild(helpBar);
  }

  function activatePicker(mode = 'extract') {
    pickerMode = mode;
    isPickerActive = true;

    // Remove existing highlight if any
    if (highlightBox) {
      highlightBox.remove();
      highlightBox = null;
    }

    createHighlightUI();
    createHelpBar();

    // Save original cursor
    originalCursor = document.body.style.cursor;

    document.addEventListener('mousemove', handleMouseMove, true);
    document.addEventListener('click', handleClick, true);
    document.addEventListener('keydown', handleKeyDown, true);
    document.body.style.setProperty('cursor', 'crosshair', 'important');
  }

  function deactivatePicker() {
    isPickerActive = false;
    if (highlightBox) highlightBox.classList.add('sc-hidden');
    if (helpBar) helpBar.remove();
    helpBar = null;

    document.removeEventListener('mousemove', handleMouseMove, true);
    document.removeEventListener('click', handleClick, true);
    document.removeEventListener('keydown', handleKeyDown, true);

    document.body.style.removeProperty('cursor');
    document.body.style.cursor = originalCursor;
  }

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "togglePicker") {
      if (isPickerActive) {
        deactivatePicker();
      } else {
        activatePicker(request.mode || 'extract');
      }
    }
  });


  /**
   * CSS Extraction Logic
   */
  function formatCSS(css) {
    let formatted = '';
    let indent = 0;
    const lines = css.split('\n');
    lines.forEach(line => {
      if (line.includes('}')) indent--;
      formatted += '  '.repeat(indent) + line.trim() + '\n';
      if (line.includes('{')) indent++;
    });
    return formatted.trim();
  }

  const IMPORTANT_PROPS = [
    // Layout & Positioning
    'display', 'position', 'top', 'right', 'bottom', 'left', 'inset', 'float', 'clear', 'z-index',
    'vertical-align', 'box-sizing', 'visibility', 'opacity', 'overflow-x', 'overflow-y',
    'pointer-events', 'cursor',

    // Dimensions
    'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
    'aspect-ratio', 'object-fit', 'object-position',

    // Flexbox (Longhands)
    'flex-direction', 'flex-wrap', 'justify-content', 'align-items', 'align-content',
    'flex-grow', 'flex-shrink', 'flex-basis', 'align-self', 'order', 'gap', 'row-gap', 'column-gap',

    // Grid (Longhands)
    'grid-template-columns', 'grid-template-rows', 'grid-auto-flow', 'grid-auto-columns', 'grid-auto-rows',
    'grid-column-start', 'grid-column-end', 'grid-row-start', 'grid-row-end',

    // Spacing (Longhands)
    'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
    'margin-top', 'margin-right', 'margin-bottom', 'margin-left',

    // Typography
    'color', 'font-family', 'font-size', 'font-weight', 'line-height', 'text-align',
    'text-transform', 'text-decoration', 'letter-spacing', 'white-space', 'word-break', 'text-overflow',
    'font-style', 'font-variant', 'direction',

    // Borders (Longhands)
    'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width',
    'border-top-style', 'border-right-style', 'border-bottom-style', 'border-left-style',
    'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color',
    'border-top-left-radius', 'border-top-right-radius', 'border-bottom-right-radius', 'border-bottom-left-radius',

    // Background
    'background-color', 'background-image', 'background-size', 'background-position', 'background-repeat',
    'background-clip', 'background-origin', 'background-attachment',

    // Effects & Interactivity
    'box-shadow', 'transition', 'transform', 'filter', 'backdrop-filter',
    'outline-width', 'outline-style', 'outline-color', 'list-style-type', 'list-style-position',

    // SVG Specific
    'fill', 'fill-opacity', 'stroke', 'stroke-width', 'stroke-opacity',
    'stroke-linecap', 'stroke-linejoin', 'stroke-dasharray', 'stop-color', 'stop-opacity'
  ];




  let browserDefaultsMap = new Map();

  function getBrowserDefaults(tagName) {
    if (browserDefaultsMap.has(tagName)) return browserDefaultsMap.get(tagName);

    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    const iDoc = iframe.contentDocument || iframe.contentWindow.document;
    const el = iDoc.createElement(tagName);
    iDoc.body.appendChild(el);
    const styles = iDoc.defaultView.getComputedStyle(el);

    const defaults = {};
    IMPORTANT_PROPS.forEach(prop => {
      defaults[prop] = styles.getPropertyValue(prop);
    });

    document.body.removeChild(iframe);
    browserDefaultsMap.set(tagName, defaults);
    return defaults;
  }

  function getElementCSS(el, uniqueId) {
    let mainCss = '';

    // 1. Capture Main Element Styles
    const styles = window.getComputedStyle(el);
    const defaults = getBrowserDefaults(el.tagName.toLowerCase());
    let cssBody = '';

    IMPORTANT_PROPS.forEach(prop => {
      const val = styles.getPropertyValue(prop);
      const defVal = defaults[prop];
      const isInheritedProp = [
        'font-family', 'color', 'line-height', 'font-size', 'text-align',
        'text-decoration', 'text-transform', 'list-style', 'vertical-align',
        'white-space', 'word-break'
      ].includes(prop);

      // Specifically ignore 'crosshair' cursor as it's added by our picker
      if (prop === 'cursor' && val === 'crosshair') return;

      // Root Element Normalization (to avoid components flying off-screen in preview)
      if (uniqueId === 'sc-1') {
        if (prop === 'position' && (val === 'absolute' || val === 'fixed')) {
          cssBody += `  position: relative !important;\n`;
          return;
        }
        if (['top', 'left', 'bottom', 'right', 'inset'].includes(prop) && parseInt(val) < -5000) {
          cssBody += `  ${prop}: auto !important;\n`;
          return;
        }
        if (prop === 'margin-top' || prop === 'margin-left' || prop === 'margin-bottom' || prop === 'margin-right') {
          cssBody += `  ${prop}: 0 !important;\n`;
          return;
        }
        if (prop === 'transform') {
          cssBody += `  transform: none !important;\n`;
          return;
        }
      }

      // Skip border stroke properties if width is 0 or style is none (but ALWAYS keep radius)
      if (prop.startsWith('border-') && !prop.includes('radius')) {
        const side = prop.split('-')[1]; // top, right, etc.
        const width = styles.getPropertyValue(`border-${side}-width`);
        const style = styles.getPropertyValue(`border-${side}-style`);
        if (parseFloat(width) === 0 || style === 'none') return;
      }


      // Skip outline properties if width is 0 or style is none
      if (prop.startsWith('outline-')) {
        const width = styles.getPropertyValue('outline-width');
        const style = styles.getPropertyValue('outline-style');
        if (parseFloat(width) === 0 || style === 'none') return;
      }

      // Favor longhand if shorthand is empty or too generic
      if ((prop === 'background' || prop === 'border') && (val === '' || val.includes('none') || val.includes('0px'))) {
        return;
      }

      if (val && (val !== defVal || isInheritedProp)) {
        cssBody += `  ${prop}: ${val};\n`;
      }

    });

    // Capture CSS Variables (essential for modern sites like Facebook)
    // Optimization: Only capture if value differs from parent to avoid massive redundancy
    const parentStyles = el.parentElement ? window.getComputedStyle(el.parentElement) : null;

    for (let i = 0; i < styles.length; i++) {
      const prop = styles[i];
      if (prop.startsWith('--')) {
        const val = styles.getPropertyValue(prop);
        if (val && val.length < 500) {
          const parentVal = parentStyles ? parentStyles.getPropertyValue(prop) : null;
          if (val !== parentVal) {
            cssBody += `  ${prop}: ${val};\n`;
          }
        }
      }
    }

    // Root normalization to ensure it fits the preview perfectly
    if (uniqueId === 'sc-1') {
      cssBody += `  max-width: 100% !important;\n`;
      cssBody += `  height: auto !important;\n`;
      cssBody += `  box-sizing: border-box !important;\n`;
      cssBody += `  margin: 0 auto !important;\n`;
      cssBody += `  flex-shrink: 1 !important;\n`;
    }


    mainCss += `[data-sc-id="${uniqueId}"] {\n${cssBody}}\n`;


    // 2. Capture Pseudo-elements (::before, ::after)
    ['::before', '::after'].forEach(pseudo => {
      const pStyles = window.getComputedStyle(el, pseudo);
      const content = pStyles.getPropertyValue('content');

      // Only capture if pseudo-element actually exists/has content
      if (content && content !== 'none' && content !== '""') {
        let pBody = '';
        IMPORTANT_PROPS.forEach(prop => {
          const val = pStyles.getPropertyValue(prop);
          // We include 'content' as it's mandatory for pseudo-elements
          if (val) pBody += `  ${prop}: ${val};\n`;
        });
        if (pBody) {
          pBody += `  content: ${content};\n`;
          mainCss += `[data-sc-id="${uniqueId}"]${pseudo} {\n${pBody}}\n`;
        }
      }
    });

    return mainCss;
  }


  function deepExtract(el, result = { html: '', css: '' }, idCounter = { val: 0 }) {
    const currentId = `sc-${++idCounter.val}`;
    const clone = el.cloneNode(false); // Clone without children
    clone.setAttribute('data-sc-id', currentId);

    // Start tag
    let html = clone.outerHTML;
    const closingTagIndex = html.lastIndexOf('</');
    const startTag = html.substring(0, closingTagIndex !== -1 ? closingTagIndex : html.length);
    const closeTag = closingTagIndex !== -1 ? html.substring(closingTagIndex) : '';

    result.css += getElementCSS(el, currentId);
    result.html += startTag;

    // Process children
    for (const child of el.childNodes) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        deepExtract(child, result, idCounter);
      } else if (child.nodeType === Node.TEXT_NODE) {
        result.html += child.textContent;
      }
    }

    result.html += closeTag;
    return result;
  }

  // Pretty-print HTML with proper indentation
  function formatHTML(html) {
    const INDENT = '  ';
    let formatted = '';
    let indent = 0;

    // Split by tags while keeping the tags
    const tokens = html.split(/(<[^>]+>)/g).filter(t => t.trim());

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      // Check if it's a tag
      if (token.startsWith('<')) {
        const isClosing = token.startsWith('</');
        const isSelfClosing = token.endsWith('/>') || /^<(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)/i.test(token);
        const isVoid = /^<(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)/i.test(token);

        if (isClosing) {
          indent = Math.max(0, indent - 1);
        }

        formatted += INDENT.repeat(indent) + token + '\n';

        if (!isClosing && !isSelfClosing && !isVoid) {
          indent++;
        }
      } else {
        // It's text content
        const trimmed = token.trim();
        if (trimmed) {
          formatted += INDENT.repeat(indent) + trimmed + '\n';
        }
      }
    }

    return formatted.trim();
  }

  // Minify CSS
  function minifyCSS(css) {
    return css
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\s+/g, ' ')
      .replace(/\s*([{}:;,])\s*/g, '$1')
      .replace(/;}/g, '}')
      .trim();
  }

  function extractElementData(el) {
    const data = deepExtract(el);
    const formattedHTML = formatHTML(data.html);
    const compressedCSS = minifyCSS(data.css);
    showResultModal(formattedHTML, compressedCSS);
  }

  async function showResultModal(html, css) {
    const modalId = 'sc-extractor-modal';
    let existingModal = document.getElementById(modalId);
    if (existingModal) existingModal.remove();

    const existingStyles = document.getElementById('sc-extractor-modal-styles');
    if (existingStyles) existingStyles.remove();

    // Create modal container
    const modalContainer = document.createElement('div');
    modalContainer.id = modalId;
    modalContainer.className = 'sc-vars';

    // Explicit inline styles to ensure visibility regardless of host page CSS
    Object.assign(modalContainer.style, {
      all: 'initial',
      position: 'fixed',
      inset: '0',
      zIndex: '2147483647',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(4px)',
      opacity: '1',
      transition: 'opacity 0.2s ease',
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif"
    });

    // Append early to ensure it's in the DOM
    document.body.appendChild(modalContainer);

    // Use Shadow DOM for style isolation
    const shadow = modalContainer.attachShadow({ mode: 'open' });

    try {
      // Inject Custom CSS into Shadow DOM
      const styleResponse = await fetch(chrome.runtime.getURL('styles.css')).catch(err => {
        console.warn('SnapCode Pro: Could not fetch styles.css, using fallback styles.', err);
        return null;
      });

      const customCSS = styleResponse ? await styleResponse.text() : '';

      const styleSheet = document.createElement('style');
      const fontLink = document.createElement('link');
      fontLink.rel = 'stylesheet';
      fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap';
      shadow.appendChild(fontLink);

      styleSheet.textContent = customCSS + `
        :host {
          all: initial;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          position: fixed !important;
          inset: 0 !important;
          z-index: 2147483647 !important;
          background: rgba(0, 0, 0, 0.75) !important;
          backdrop-filter: blur(4px) !important;
          padding: 24px !important;
          font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
        }

        * { box-sizing: border-box; }
        #sc-modal-root { font-family: 'Inter', system-ui, -apple-system, sans-serif; }

        #sc-code-pane span { display: inline; margin: 0; padding: 0; }
      `;
      shadow.appendChild(styleSheet);

      const modalRoot = document.createElement('div');
      modalRoot.id = 'sc-modal-root';
      modalRoot.className = 'sc-modal-container';
      modalRoot.innerHTML = `
          <!-- Header -->
          <div class="sc-modal-header">
            <div class="sc-header-left">
              <div class="sc-logo-box">
                <svg width="18" height="18" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M42 42 L28 64 L42 86" stroke="white" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M86 42 L100 64 L86 86" stroke="white" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" />
                  <circle cx="64" cy="64" r="16" fill="white" />
                  <circle cx="64" cy="64" r="10" fill="#4f46e5" />
                </svg>
              </div>

              <div>
                <h1>SnapCode Pro</h1>
                <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: var(--sc-text-light);">Capture Success</span>
              </div>
            </div>
            <button id="sc-cancel-top" class="sc-close-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>

          <!-- Tabs -->
          <div class="sc-tabs-container">
            <div class="sc-tabs">
              <button class="sc-tab active" data-view="preview">Preview</button>
              <button class="sc-tab" data-view="html">HTML</button>
              <button class="sc-tab" data-view="css">CSS</button>
            </div>
          </div>

          <!-- Content Area -->
          <div class="sc-content-area" style="flex-direction: column;">
            <div class="sc-pane-header">
              <button class="sc-contrast-btn" id="sc-toggle-contrast" title="Toggle dark background for better contrast">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
                Contrast Mode
              </button>
            </div>
            <div class="sc-pane">
              <div id="sc-preview-pane-root" class="sc-preview-pane-content"></div>
              <pre id="sc-code-pane" class="sc-code-pane sc-hidden"></pre>
            </div>
          </div>

          <!-- Footer -->
          <div class="sc-modal-footer">
            <button class="sc-btn sc-btn-ghost" id="sc-cancel">Cancel</button>
            <button class="sc-btn sc-btn-primary" id="sc-copy-all">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
              Copy All
            </button>
            <button class="sc-btn sc-btn-primary sc-hidden" id="sc-copy">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
              Copy Code
            </button>
          </div>
      `;

      shadow.appendChild(modalRoot);



      // Elements
      const pane = shadow.querySelector('.sc-pane');
      const contrastBtn = shadow.querySelector('#sc-toggle-contrast');

      contrastBtn.addEventListener('click', () => {
        pane.classList.toggle('sc-pane-dark');
        contrastBtn.classList.toggle('active');
      });

      const codePane = shadow.querySelector('#sc-code-pane');
      const copyBtn = shadow.querySelector('#sc-copy');
      const copyAllBtn = shadow.querySelector('#sc-copy-all');
      const tabs = shadow.querySelectorAll('.sc-tab');

      let currentView = 'preview';

      // Close handlers
      const closeModal = () => {
        modalContainer.style.opacity = '0';
        setTimeout(() => modalContainer.remove(), 200);
      };

      shadow.querySelector('#sc-cancel').addEventListener('click', (e) => {
        e.stopPropagation();
        closeModal();
      });
      shadow.querySelector('#sc-cancel-top').addEventListener('click', (e) => {
        e.stopPropagation();
        closeModal();
      });
      modalRoot.addEventListener('click', (e) => {
        e.stopPropagation();
      });

      // View switching

      // Pre-calculate content
      const highlightedHTML = html; // No highlighting, just raw
      const highlightedCSS = css;   // No highlighting, just raw

      codePane.textContent = highlightedHTML; // Default is HTML view if not preview
      codePane.dataset.rawCode = highlightedHTML;

      function switchView(view) {
        currentView = view;
        tabs.forEach(t => {
          t.classList.toggle('active', t.dataset.view === view);
        });

        if (view === 'preview') {
          previewPane.classList.remove('sc-hidden');
          previewPane.style.display = 'flex';
          codePane.classList.add('sc-hidden');
          copyBtn.classList.add('sc-hidden');
          copyAllBtn.classList.remove('sc-hidden');

          const stageShadow = previewPane.shadowRoot || previewPane.attachShadow({ mode: 'open' });
          stageShadow.innerHTML = `
          <style>
            :host {
              all: initial;
              display: block;
              width: 100%;
              min-height: 100%;
              font-family: 'Inter', system-ui, sans-serif;
              background: transparent;
            }
            .stage {
              padding: 64px 48px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: flex-start;
              min-height: 100%;
              width: 100%;
              box-sizing: border-box;
            }
            /* Ensure the root element doesn't touch the edges */
            .stage > * {
              max-width: 100% !important;
              box-shadow: 0 0 0 1px rgba(0,0,0,0.05); /* Subtle border for visibility if the element has none */
            }
            ${css}
          </style>
          <div class="stage">${html}</div>
        `;
        } else {
          previewPane.classList.add('sc-hidden');
          previewPane.style.display = 'none';
          codePane.classList.remove('sc-hidden');
          copyBtn.classList.remove('sc-hidden');
          copyAllBtn.classList.add('sc-hidden');

          const code = view === 'html' ? html : css;
          codePane.innerHTML = view === 'html' ? highlightHTML_internal(code) : highlightCSS_internal(code);
          codePane.dataset.rawCode = code;

          copyBtn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
          Copy ${view.toUpperCase()}
        `;
        }
      }

      const previewPane = shadow.querySelector('#sc-preview-pane-root');

      // Syntax highlighting functions
      function escapeHtml(str) {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      }

      function highlightHTML_internal(code) {
        let result = '';
        let i = 0;
        while (i < code.length) {
          if (code[i] === '<') {
            let tagEnd = code.indexOf('>', i);
            if (tagEnd === -1) tagEnd = code.length;
            const fullTag = code.substring(i, tagEnd + 1);
            const inner = code.substring(i + 1, tagEnd);
            const isClosing = inner.startsWith('/');
            const nameMatch = inner.match(/^\/?([a-zA-Z][a-zA-Z0-9-]*)/);
            if (nameMatch) {
              const tagName = nameMatch[1];
              const rest = inner.substring(nameMatch[0].length);
              result += '<span class="sc-hl-punctuation">&lt;' + (isClosing ? '/' : '') + '</span>';
              result += '<span class="sc-hl-tag">' + escapeHtml(tagName) + '</span>';
              let attrs = rest.replace(/(\s+)([a-zA-Z_:][a-zA-Z0-9_:.-]*)=("[^"]*"|'[^']*')/g,
                (match, space, name, value) => {
                  return space + '<span class="sc-hl-attr">' + escapeHtml(name) + '</span><span class="sc-hl-punctuation">=</span><span class="sc-hl-string">' + escapeHtml(value) + '</span>';
                }
              );
              result += attrs;
              result += (fullTag.endsWith('/>') ? '<span class="sc-hl-punctuation">/&gt;</span>' : '<span class="sc-hl-punctuation">&gt;</span>');
            } else {
              result += escapeHtml(fullTag);
            }
            i = tagEnd + 1;
          } else {
            let next = code.indexOf('<', i);
            if (next === -1) next = code.length;
            result += escapeHtml(code.substring(i, next));
            i = next;
          }
        }
        return result;
      }

      function highlightCSS_internal(code) {
        let result = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const lines = result.split('\n');
        return lines.map(line => {
          if (line.trim().startsWith('/*') || line.includes('/*')) return `<span class="sc-hl-comment">${line}</span>`;
          if (line.includes('{') && !line.includes(':')) return line.replace(/^(.+?)(\{)/, '<span class="sc-hl-selector">$1</span><span class="sc-hl-punctuation">$2</span>');
          if (line.trim() === '}') return '<span class="sc-hl-punctuation">}</span>';
          const propMatch = line.match(/^(\s*)([\w-]+)(\s*:\s*)(.+?)(;?)(\s*)$/);
          if (propMatch) {
            const [, indent, prop, colon, value, semi, trailing] = propMatch;
            return `${indent}<span class="sc-hl-property">${prop}</span><span class="sc-hl-punctuation">${colon}</span><span class="sc-hl-value">${value}</span><span class="sc-hl-punctuation">${semi}</span>${trailing}`;
          }
          return line;
        }).join('\n');
      }


      tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
          e.stopPropagation();
          switchView(tab.dataset.view);
        });
      });

      function handleCopy(btn, text, originalHtml) {
        navigator.clipboard.writeText(text).then(() => {
          const originalClass = btn.className;
          btn.className = 'sc-btn sc-btn-success';
          btn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
          Copied!
        `;
          setTimeout(() => {
            btn.className = originalClass;
            btn.innerHTML = originalHtml;
          }, 2000);
        });
      }

      copyBtn.addEventListener('click', () => {
        const rawCode = codePane.dataset.rawCode || codePane.textContent;
        const originalHtml = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg> Copy ${currentView.toUpperCase()}`;
        handleCopy(copyBtn, rawCode, originalHtml);
      });

      copyAllBtn.addEventListener('click', () => {
        const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Extracted UI Element - SnapCode Pro</title>
  <!-- 
    Extracted with SnapCode Pro
    Author: KWS Everywhere Team
    URL: https://kwseverywhere.com
  -->

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body {
      margin: 0;
      padding: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background-color: #f8fafc;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
    }
    
${css}
  </style>
</head>
<body>
${html}
</body>
</html>`;
        const originalHtml = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg> Copy All`;
        handleCopy(copyAllBtn, fullHtml, originalHtml);
      });

      switchView('preview');
    } catch (err) {
      console.error('SnapCode Pro Error (showResultModal):', err);
      // Remove the container if it failed to initialize properly
      if (modalContainer && modalContainer.parentNode) {
        modalContainer.remove();
      }
    }
  }

})();
