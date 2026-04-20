# GestureNet Browser Extension

This extension allows you to control web pages using hand gestures detected via your camera.

## Installation

1. Download the MediaPipe Hands library files:
   - Go to https://cdn.jsdelivr.net/npm/@mediapipe/hands/
   - Download the following files into the `extension/lib/` folder:
     - `hands.js`
     - `camera_utils.js` (from https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/)
     - All `.wasm` and other asset files (hands_solution_packed_assets_loader.js, hands_solution_simd_wasm_bin.js, etc.)
   
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the `extension` folder
5. The extension should now be installed

## Usage

1. Click the extension icon in the toolbar
2. Click "Start Gesture Control" to begin
3. Allow camera permission when prompted
4. Perform left or right swipe gestures with your hand to simulate left/right arrow key presses
5. Click "Stop Gesture Control" to stop

## How it works

- Uses MediaPipe Hands for hand tracking
- Detects horizontal movement of the hand
- Simulates keyboard events for arrow keys

## Permissions

- `activeTab`: To interact with the current tab
- `scripting`: To inject scripts
- `storage`: For future features
- `host_permissions`: `<all_urls>` to work on any website