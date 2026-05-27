// background.js - Service Worker for ReadShift

const DEFAULT_SETTINGS = {
  enabled: false,
  mode: "both",           // "lexend" | "bionic" | "both"
  preset: "default",      // "default" | "adhd" | "dyslexia" | "speed"
  fontSize: 16,
  lineSpacing: 1.6,
  letterSpacing: 0.02,
  fixationLevel: 3
};

chrome.runtime.onInstalled.addListener(() => {
  // Initialize default settings in storage on install if they don't exist
  chrome.storage.sync.get(["enabled"], (result) => {
    if (result.enabled === undefined) {
      chrome.storage.sync.set(DEFAULT_SETTINGS);
    }
  });
});
