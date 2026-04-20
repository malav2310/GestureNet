// background.js — Service worker for GestureNet extension.
// Opens the monitoring page and relays swipe events to active tab content scripts.

let monitoringWindowId = null;
let isMonitoring = false;

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {

  // ── Start ──────────────────────────────────────────────────────────────────
  if (msg.action === 'start') {
    if (isMonitoring) { sendResponse({ success: true }); return true; }

    chrome.windows.create({
      url: chrome.runtime.getURL('monitoring.html'),
      type: 'popup',
      width: 460,
      height: 400,
      focused: true,
    }, (win) => {
      monitoringWindowId = win.id;
      isMonitoring = true;
      sendResponse({ success: true });
    });
    return true; // async
  }

  // ── Stop ───────────────────────────────────────────────────────────────────
  if (msg.action === 'stop') {
    isMonitoring = false;
    if (monitoringWindowId !== null) {
      chrome.windows.remove(monitoringWindowId).catch(() => {});
      monitoringWindowId = null;
    }
    sendResponse({ success: true });
    return true;
  }

  // ── Swipe from monitoring page → relay to active content script ────────────
  if (msg.type === 'SWIPE') {
    chrome.tabs.query({ active: true, currentWindow: false }, (tabs) => {
      for (const tab of tabs) {
        if (tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
          chrome.tabs.sendMessage(tab.id, { type: 'SWIPE', direction: msg.direction }).catch(() => {});
        }
      }
    });
    return true;
  }
});

// Tidy up if monitoring window is closed by user
chrome.windows.onRemoved.addListener((windowId) => {
  if (windowId === monitoringWindowId) {
    monitoringWindowId = null;
    isMonitoring = false;
  }
});
