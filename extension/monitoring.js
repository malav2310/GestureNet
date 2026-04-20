// monitoring.js — Runs in the extension's monitoring.html popup page.
// Uses MediaPipe Tasks Vision HandLandmarker to track hand X position and detect swipe gestures.

import { FilesetResolver, HandLandmarker } from './lib/vision_bundle.mjs';

// ── DOM references ────────────────────────────────────────────────────────────
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const swipeIndicator = document.getElementById('swipe-indicator');

// ── State ─────────────────────────────────────────────────────────────────────
let handLandmarker = null;
let stream = null;
let isRunning = false;
let processIntervalId = null;

// ── Swipe detector (ported from useSwipeDetector.js) ──────────────────────────
function createSwipeDetector({ lag = 20, minDrift = 0.25, cooldownFrames = 20 } = {}) {
  let signalBuffer = [];
  let currentSequence = { type: 0, startValue: null, startFrame: null, lastValue: null, lastFrame: null };
  let lastEvent = null;
  let frameCount = 0;
  let lastSwipeFrame = 0;
  let lastSample = { value: null, frame: null };

  const reset = () => {
    signalBuffer = [];
    currentSequence = { type: 0, startValue: null, startFrame: null, lastValue: null, lastFrame: null };
    lastEvent = null;
    frameCount = 0;
    lastSwipeFrame = 0;
    lastSample = { value: null, frame: null };
  };

  const processFrame = (x) => {
    frameCount++;
    signalBuffer.push(x);
    if (signalBuffer.length < lag) return { swipe: null };
    if (signalBuffer.length > lag) signalBuffer.shift();

    if (lastSample.value === null) {
      lastSample = { value: x, frame: frameCount };
      return { swipe: null };
    }

    const comparison = x > lastSample.value ? 1 : x < lastSample.value ? -1 : 0;
    const run = currentSequence;
    let swipe = null;

    const completeSequence = (event) => {
      if (lastEvent) {
        const drift = Math.abs(event.value - lastEvent.value);
        if (drift >= minDrift && frameCount - lastSwipeFrame >= cooldownFrames) {
          if (lastEvent.type === 'peak' && event.type === 'trough') swipe = 'RIGHT';
          else if (lastEvent.type === 'trough' && event.type === 'peak') swipe = 'LEFT';
          if (swipe) lastSwipeFrame = frameCount;
        }
      }
      lastEvent = event;
    };

    if (run.type === 0) {
      if (comparison === 1) {
        currentSequence = { type: 1, startValue: lastSample.value, startFrame: lastSample.frame, lastValue: x, lastFrame: frameCount };
      } else if (comparison === -1) {
        currentSequence = { type: -1, startValue: lastSample.value, startFrame: lastSample.frame, lastValue: x, lastFrame: frameCount };
      }
    } else if (run.type === 1) {
      if (comparison >= 0) {
        currentSequence.lastValue = x; currentSequence.lastFrame = frameCount;
      } else {
        const peak = { type: 'peak', value: run.lastValue, frame: run.lastFrame };
        completeSequence(peak);
        currentSequence = { type: -1, startValue: peak.value, startFrame: peak.frame, lastValue: x, lastFrame: frameCount };
      }
    } else if (run.type === -1) {
      if (comparison <= 0) {
        currentSequence.lastValue = x; currentSequence.lastFrame = frameCount;
      } else {
        const trough = { type: 'trough', value: run.lastValue, frame: run.lastFrame };
        completeSequence(trough);
        currentSequence = { type: 1, startValue: trough.value, startFrame: trough.frame, lastValue: x, lastFrame: frameCount };
      }
    }

    lastSample = { value: x, frame: frameCount };
    return { swipe };
  };

  return { processFrame, reset };
}

const swipeDetector = createSwipeDetector();

// ── Draw hand landmarks ───────────────────────────────────────────────────────
function drawLandmarksOverlay(landmarks) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const point of landmarks) {
    ctx.beginPath();
    ctx.arc(point.x * canvas.width, point.y * canvas.height, 4, 0, 2 * Math.PI);
    ctx.fillStyle = '#a78bfa';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function onResults(landmarks) {
  if (!isRunning) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!landmarks || landmarks.length === 0) return;

  drawLandmarksOverlay(landmarks[0]);

  const maxX = Math.max(...landmarks[0].map((l) => l.x));
  const { swipe } = swipeDetector.processFrame(maxX);
  if (swipe) {
    swipeIndicator.textContent = swipe === 'LEFT' ? '👈 Left' : '👉 Right';
    setTimeout(() => { swipeIndicator.textContent = ''; }, 800);
    chrome.runtime.sendMessage({ type: 'SWIPE', direction: swipe });
  }
}

// ── Processing loop ───────────────────────────────────────────────────────────
let lastVideoTime = -1;
const PROCESS_INTERVAL_MS = 33; // ~30 FPS target without relying on window paint cycles.

function processFrame() {
  if (!isRunning) return;
  if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;

  if (video.currentTime !== lastVideoTime) {
    lastVideoTime = video.currentTime;
    const result = handLandmarker.detectForVideo(video, performance.now());
    onResults(result.landmarks);
  }
}

function startProcessingLoop() {
  if (processIntervalId !== null) return;
  processIntervalId = setInterval(processFrame, PROCESS_INTERVAL_MS);
}

function stopProcessingLoop() {
  if (processIntervalId !== null) {
    clearInterval(processIntervalId);
    processIntervalId = null;
  }
}

// ── Camera + MediaPipe init ───────────────────────────────────────────────────
async function initTracking() {
  try {
    statusEl.textContent = 'Loading MediaPipe…';

    const wasmPath = chrome.runtime.getURL('lib/wasm');
    const modelPath = chrome.runtime.getURL('lib/hand_landmarker.task');

    const vision = await FilesetResolver.forVisionTasks(wasmPath);
    handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: modelPath,
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numHands: 1,
      minHandDetectionConfidence: 0.5,
      minHandPresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    statusEl.textContent = 'Requesting camera…';

    stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
      audio: false,
    });

    video.srcObject = stream;
    await new Promise((resolve) => { video.onloadedmetadata = resolve; });
    await video.play();
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    statusEl.textContent = '✓ Tracking active';
    isRunning = true;
    startProcessingLoop();
  } catch (err) {
    console.error('Camera/model init failed:', err);
    statusEl.textContent = `✗ ${err.message}`;
  }
}

// ── Cleanup on close ──────────────────────────────────────────────────────────
window.addEventListener('beforeunload', () => {
  isRunning = false;
  stopProcessingLoop();
  if (stream) stream.getTracks().forEach(t => t.stop());
  swipeDetector.reset();
});

// ── Bootstrap ─────────────────────────────────────────────────────────────────
initTracking();
