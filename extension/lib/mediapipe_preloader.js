// Injected into the MAIN world BEFORE hands.js so the MediaPipe wasm/data
// loaders can resolve asset URLs to the extension's own lib/ directory.
// The global __GestureNetLibBase is set by background.js via executeScript args
// before this file is evaluated.
(function () {
  var base = window.__GestureNetLibBase;
  if (!base) return;

  function locateFile(file) {
    return base + file;
  }

  window.createMediapipeSolutionsPackedAssets = Object.assign(
    {},
    window.createMediapipeSolutionsPackedAssets || {},
    { locateFile: locateFile }
  );

  window.createMediapipeSolutionsWasm = Object.assign(
    {},
    window.createMediapipeSolutionsWasm || {},
    { locateFile: locateFile }
  );
})();
