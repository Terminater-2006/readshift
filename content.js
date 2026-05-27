// content.js - Core Engine for ReadShift

// Injection Guard
if (window.__readShiftLoaded) {
    // If the script is already loaded but being injected again (e.g. by popup), 
    // it just early returns. The existing instance will handle messages.
    console.log("ReadShift: Already loaded.");
} else {
    window.__readShiftLoaded = true;

    // Configuration & State
    const SKIP_TAGS = new Set([
        'SCRIPT', 'STYLE', 'CODE', 'PRE', 'KBD', 'SAMP', 'VAR',
        'NAV', 'HEADER', 'FOOTER', 'ASIDE', 'BUTTON', 'INPUT',
        'TEXTAREA', 'SELECT', 'OPTION', 'IFRAME', 'NOSCRIPT'
    ]);

    // WeakMap to store original TextNodes for undo functionality without memory leaks
    const originalNodes = new WeakMap();
    let currentSettings = null;

    // Debounce Helper
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Bionic Bolding Logic
    function getBoldLength(wordLength, fixationLevel) {
        const ratio = 0.3 + (fixationLevel - 1) * 0.1; // 0.3 at level 1, 0.7 at level 5
        if (wordLength <= 1) return 1;
        if (wordLength <= 3) return 1;
        if (wordLength <= 5) return 2;
        return Math.max(2, Math.ceil(wordLength * ratio));
    }

    function createBionicSpan(text, fixationLevel) {
        const wrapper = document.createElement('span');
        wrapper.setAttribute('data-readshift', 'true');

        // Split text by words and whitespace, preserving spaces
        const words = text.split(/(\s+)/);
        
        for (const word of words) {
            if (/^\s+$/.test(word) || word.length === 0) {
                // If it's whitespace, just append as a text node
                wrapper.appendChild(document.createTextNode(word));
                continue;
            }

            // Word processing
            const boldLen = getBoldLength(word.length, fixationLevel);
            const boldPart = word.substring(0, boldLen);
            const normalPart = word.substring(boldLen);

            const b = document.createElement('b');
            b.textContent = boldPart;
            wrapper.appendChild(b);
            
            if (normalPart.length > 0) {
                wrapper.appendChild(document.createTextNode(normalPart));
            }
        }
        return wrapper;
    }

    // Checking if an element should be skipped based on RTL or SKIP_TAGS
    function shouldSkipElement(element) {
        if (!element) return false;
        
        // Skip hidden elements
        const style = window.getComputedStyle(element);
        if (style.display === 'none' || style.visibility === 'hidden') {
            return true;
        }

        // Check tags and attributes
        let curr = element;
        while (curr && curr !== document.body && curr !== document.documentElement) {
            if (curr.tagName && SKIP_TAGS.has(curr.tagName.toUpperCase())) return true;
            if (curr.dir === 'rtl' || (curr.lang && curr.lang.startsWith('ar'))) return true; // basic RTL check
            if (curr.hasAttribute && curr.hasAttribute('data-readshift')) return true;
            
            curr = curr.parentNode;
        }
        return false;
    }

    // DOM Traversal & Modification
    function applyBionicToSubtree(rootNode, fixationLevel) {
        const walker = document.createTreeWalker(
            rootNode,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function(node) {
                    // Skip empty/whitespace-only nodes
                    if (!node.nodeValue || /^\s*$/.test(node.nodeValue)) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    // Check if parent should be skipped
                    if (shouldSkipElement(node.parentNode)) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );

        const nodesToProcess = [];
        let currentNode = walker.nextNode();
        while (currentNode) {
            nodesToProcess.push(currentNode);
            currentNode = walker.nextNode();
        }

        nodesToProcess.forEach(textNode => {
            const span = createBionicSpan(textNode.nodeValue, fixationLevel);
            originalNodes.set(span, textNode); // Store original for undo
            textNode.parentNode.replaceChild(span, textNode);
        });
    }

    // Undo Bionic Bolding
    function undoBionicInSubtree(rootNode) {
        const bionicSpans = rootNode.querySelectorAll ? rootNode.querySelectorAll('span[data-readshift="true"]') : [];
        bionicSpans.forEach(span => {
            const originalNode = originalNodes.get(span);
            if (originalNode && span.parentNode) {
                span.parentNode.replaceChild(originalNode, span);
            }
        });
    }

    // Lexend Application
    function applyLexendStyle(fontSize, lineSpacing, letterSpacing) {
        document.body.classList.add('readshift-lexend');
        
        let styleTag = document.getElementById('readshift-dynamic-styles');
        if (!styleTag) {
            styleTag = document.createElement('style');
            styleTag.id = 'readshift-dynamic-styles';
            document.head.appendChild(styleTag);
        }

        styleTag.textContent = `
            .readshift-lexend, 
            .readshift-lexend p, 
            .readshift-lexend li, 
            .readshift-lexend td, 
            .readshift-lexend div, 
            .readshift-lexend span:not([data-readshift]), 
            .readshift-lexend article, 
            .readshift-lexend blockquote {
                font-size: ${fontSize}px !important;
                line-height: ${lineSpacing} !important;
                letter-spacing: ${letterSpacing}em !important;
            }
        `;
    }

    function removeLexendStyle() {
        document.body.classList.remove('readshift-lexend');
        const styleTag = document.getElementById('readshift-dynamic-styles');
        if (styleTag) styleTag.remove();
    }

    // Reading Stats
    function calculateAndSendStats() {
        const text = document.body.innerText.trim();
        const wordCount = text ? text.split(/\s+/).length : 0;
        const readTime = Math.ceil(wordCount / 200); // avg 200 wpm
        chrome.runtime.sendMessage({ type: "READSHIFT_STATS", wordCount, readTime }).catch(() => {});
    }

    // Apply overall settings
    function applySettings(settings) {
        currentSettings = settings;
        
        if (!settings.enabled) {
            undoBionicInSubtree(document.body);
            removeLexendStyle();
            return;
        }

        // Handle Bionic
        if (settings.mode === 'bionic' || settings.mode === 'both') {
            // If already applied with different settings, we might want to undo first, 
            // but for simplicity and safety, we'll just undo all and reapply if fixation level changed.
            // Or just blindly undo and reapply to guarantee state.
            undoBionicInSubtree(document.body);
            applyBionicToSubtree(document.body, settings.fixationLevel);
        } else {
            undoBionicInSubtree(document.body);
        }

        // Handle Lexend
        if (settings.mode === 'lexend' || settings.mode === 'both') {
            applyLexendStyle(settings.fontSize, settings.lineSpacing, settings.letterSpacing);
        } else {
            removeLexendStyle();
        }

        calculateAndSendStats();
    }

    // Mutation Observer for dynamic content
    const observer = new MutationObserver(debounce((mutations) => {
        if (!currentSettings || !currentSettings.enabled) return;

        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    if (currentSettings.mode === 'bionic' || currentSettings.mode === 'both') {
                        applyBionicToSubtree(node, currentSettings.fixationLevel);
                    }
                }
            }
        }
        
        // Recalculate stats occasionally if DOM changes significantly
        calculateAndSendStats();
    }, 200));

    observer.observe(document.body, { childList: true, subtree: true });

    // Message Listener from Popup
    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
        if (msg.type === "READSHIFT_UPDATE") {
            applySettings(msg.settings);
            sendResponse({ status: "ok" });
        } else if (msg.type === "READSHIFT_REQUEST_STATS") {
            calculateAndSendStats();
        }
    });

    // Initial check for settings in case content script was injected after page load
    chrome.storage.sync.get(null, (result) => {
        if (result && Object.keys(result).length > 0) {
            applySettings(result);
        }
    });
}
