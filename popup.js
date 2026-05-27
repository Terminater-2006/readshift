// popup.js - UI logic for ReadShift

const PRESETS = {
  default:  { fontSize: 16, lineSpacing: 1.6, letterSpacing: 0.02, fixationLevel: 3 },
  adhd:     { fontSize: 16, lineSpacing: 1.8, letterSpacing: 0.02, fixationLevel: 3 },
  dyslexia: { fontSize: 18, lineSpacing: 1.7, letterSpacing: 0.06, fixationLevel: 2 },
  speed:    { fontSize: 16, lineSpacing: 1.5, letterSpacing: 0.01, fixationLevel: 4 }
};

let currentSettings = {};

// DOM Elements
const masterToggle = document.getElementById('master-toggle');
const modePills = document.querySelectorAll('.pill');
const presetSelect = document.getElementById('preset-select');

const sliderFontSize = document.getElementById('fontSize');
const sliderLineSpacing = document.getElementById('lineSpacing');
const sliderLetterSpacing = document.getElementById('letterSpacing');
const sliderFixationLevel = document.getElementById('fixationLevel');

const valFontSize = document.getElementById('val-fontSize');
const valLineSpacing = document.getElementById('val-lineSpacing');
const valLetterSpacing = document.getElementById('val-letterSpacing');
const valFixationLevel = document.getElementById('val-fixationLevel');

const groupFontSize = document.getElementById('group-fontSize');
const groupLineSpacing = document.getElementById('group-lineSpacing');
const groupLetterSpacing = document.getElementById('group-letterSpacing');
const groupFixationLevel = document.getElementById('group-fixationLevel');

const statWords = document.getElementById('stat-words');
const statTime = document.getElementById('stat-time');

const btnReset = document.getElementById('btn-reset');
const btnPdf = document.getElementById('btn-pdf');
const btnSave = document.getElementById('btn-save');

const modal = document.getElementById('pro-modal');
const closeModalBtn = document.getElementById('close-modal');

// Debounce Utility
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.sync.get(null, (result) => {
        if (result && Object.keys(result).length > 0) {
            currentSettings = result;
        } else {
            // Fallback to default if not set yet
            currentSettings = {
                enabled: false,
                mode: "both",
                preset: "default",
                ...PRESETS.default
            };
        }
        updateUIFromSettings();
        requestStats();
    });
});

function updateUIFromSettings() {
    masterToggle.checked = currentSettings.enabled;
    
    modePills.forEach(pill => {
        if (pill.dataset.mode === currentSettings.mode) {
            pill.classList.add('active');
        } else {
            pill.classList.remove('active');
        }
    });

    presetSelect.value = currentSettings.preset;

    sliderFontSize.value = currentSettings.fontSize;
    valFontSize.textContent = currentSettings.fontSize + 'px';
    
    sliderLineSpacing.value = currentSettings.lineSpacing;
    valLineSpacing.textContent = currentSettings.lineSpacing;
    
    sliderLetterSpacing.value = currentSettings.letterSpacing;
    valLetterSpacing.textContent = currentSettings.letterSpacing + 'em';
    
    sliderFixationLevel.value = currentSettings.fixationLevel;
    valFixationLevel.textContent = currentSettings.fixationLevel;

    updateSliderVisibility();
}

function updateSliderVisibility() {
    const mode = currentSettings.mode;
    
    const showLexend = mode === 'lexend' || mode === 'both';
    const showBionic = mode === 'bionic' || mode === 'both';

    groupFontSize.style.display = showLexend ? 'flex' : 'none';
    groupLineSpacing.style.display = showLexend ? 'flex' : 'none';
    groupLetterSpacing.style.display = showLexend ? 'flex' : 'none';
    
    groupFixationLevel.style.display = showBionic ? 'flex' : 'none';
}

const saveAndNotify = debounce(async () => {
    // Save to storage
    await chrome.storage.sync.set(currentSettings);
    
    // Notify content script
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.id) {
            try {
                await chrome.tabs.sendMessage(tab.id, { type: "READSHIFT_UPDATE", settings: currentSettings });
            } catch (err) {
                // Content script might not be injected yet
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['content.js']
                });
                // Re-send message after injection
                await chrome.tabs.sendMessage(tab.id, { type: "READSHIFT_UPDATE", settings: currentSettings });
            }
        }
    } catch (error) {
        console.error("Error communicating with tab:", error);
    }
}, 300);

async function requestStats() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.id) {
            // Note: If content script is not loaded, this will fail silently. That's fine for stats request.
            await chrome.tabs.sendMessage(tab.id, { type: "READSHIFT_REQUEST_STATS" });
        }
    } catch (e) {
        // Ignore errors
    }
}

// Event Listeners

masterToggle.addEventListener('change', (e) => {
    currentSettings.enabled = e.target.checked;
    saveAndNotify();
});

modePills.forEach(pill => {
    pill.addEventListener('click', (e) => {
        currentSettings.mode = e.target.dataset.mode;
        updateUIFromSettings();
        saveAndNotify();
    });
});

presetSelect.addEventListener('change', (e) => {
    const val = e.target.value;
    currentSettings.preset = val;
    if (PRESETS[val]) {
        currentSettings.fontSize = PRESETS[val].fontSize;
        currentSettings.lineSpacing = PRESETS[val].lineSpacing;
        currentSettings.letterSpacing = PRESETS[val].letterSpacing;
        currentSettings.fixationLevel = PRESETS[val].fixationLevel;
        updateUIFromSettings();
        saveAndNotify();
    }
});

function handleSliderChange(key, element, valElement, suffix = '') {
    element.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        currentSettings[key] = val;
        valElement.textContent = val + suffix;
        currentSettings.preset = 'custom';
        presetSelect.value = 'custom';
        saveAndNotify();
    });
}

handleSliderChange('fontSize', sliderFontSize, valFontSize, 'px');
handleSliderChange('lineSpacing', sliderLineSpacing, valLineSpacing, '');
handleSliderChange('letterSpacing', sliderLetterSpacing, valLetterSpacing, 'em');
handleSliderChange('fixationLevel', sliderFixationLevel, valFixationLevel, '');

btnReset.addEventListener('click', () => {
    currentSettings = {
        enabled: currentSettings.enabled, // Preserve on/off state
        mode: "both",
        preset: "default",
        ...PRESETS.default
    };
    updateUIFromSettings();
    saveAndNotify();
});

// Pro Modal Logic
btnPdf.addEventListener('click', () => modal.classList.add('visible'));
btnSave.addEventListener('click', () => modal.classList.add('visible'));
closeModalBtn.addEventListener('click', () => modal.classList.remove('visible'));
modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('visible');
});

// Stats Listener
chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "READSHIFT_STATS") {
        statWords.textContent = msg.wordCount.toLocaleString();
        statTime.textContent = msg.readTime + " min";
    }
});
