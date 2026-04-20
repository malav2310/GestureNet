// popup.js

document.getElementById('start').addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'start' });
  window.close();
});

document.getElementById('stop').addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'stop' });
  window.close();
});