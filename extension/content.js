// content.js — Isolated-world content script.
// Receives SWIPE messages from the background service worker and
// simulates arrow-key presses on the host page.

console.log('[GestureNet] Content script loaded successfully on', window.location.href);

function simulateKeyPress(direction) {
  const key = direction === 'LEFT' ? 'ArrowLeft' : 'ArrowRight';
  const keyCode = direction === 'LEFT' ? 37 : 39;
  const keyboardEvent = new KeyboardEvent('keydown', {
    key,
    code: key,
    keyCode,
    which: keyCode,
    bubbles: true,
    cancelable: true,
  });

  const dispatched = document.dispatchEvent(keyboardEvent);
  console.log('[GestureNet] Swipe detected:', direction, '-> Triggered key event:', {
    type: keyboardEvent.type,
    key: keyboardEvent.key,
    code: keyboardEvent.code,
    keyCode: keyboardEvent.keyCode,
    which: keyboardEvent.which,
    dispatched,
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SWIPE') {
    simulateKeyPress(message.direction);
    sendResponse({ success: true });
  }
  return true;
});
