import { useRef, useCallback } from 'react';

export function useSwipeDetector({ lag = 5, threshold = 2.5, influence = 0.3, minDrift = 0.15, cooldownFrames = 20 }) {
  const signalBuffer = useRef([]);
  const filteredBuffer = useRef([]);
  const avgFilter = useRef(0);
  const stdFilter = useRef(0);
  const currentRun = useRef({ type: 0, frames: [] });
  const lastEvent = useRef(null);
  const frameCount = useRef(0);
  const lastSwipeFrame = useRef(0);

  const reset = useCallback(() => {
    signalBuffer.current = [];
    filteredBuffer.current = [];
    avgFilter.current = 0;
    stdFilter.current = 0;
    currentRun.current = { type: 0, frames: [] };
    lastEvent.current = null;
    frameCount.current = 0;
    lastSwipeFrame.current = 0;
  }, []);

  const processFrame = useCallback((maxX) => {
    frameCount.current++;
    signalBuffer.current.push(maxX);
    const bufferFull = signalBuffer.current.length >= lag;
    
    if (!bufferFull) {
      return { signal: 0, zScore: 0, avgFilter: 0, stdFilter: 0, swipe: null, isCalibrating: true, bufferFull: false, isBelowThreshold: false };
    }
    if (signalBuffer.current.length > lag) {
      signalBuffer.current.shift();
    }

    let z = 0;
    if (stdFilter.current > 1e-8) {
      z = (maxX - avgFilter.current) / stdFilter.current;
    }
    const isBelowThreshold = Math.abs(z) > 0.5 && Math.abs(z) <= threshold; // signal present but below threshold
    const signal = Math.abs(z) > threshold ? (z > 0 ? 1 : -1) : 0;

    const filtered = signal !== 0 ? influence * maxX + (1 - influence) * avgFilter.current : maxX;
    filteredBuffer.current.push(filtered);
    if (filteredBuffer.current.length > lag) {
      filteredBuffer.current.shift();
    }

    avgFilter.current = filteredBuffer.current.reduce((a, b) => a + b, 0) / filteredBuffer.current.length;
    const variance = filteredBuffer.current.reduce((a, b) => a + Math.pow(b - avgFilter.current, 2), 0) / filteredBuffer.current.length;
    stdFilter.current = Math.sqrt(variance);

    let swipe = null;

    if (signal === currentRun.current.type && signal !== 0) {
      currentRun.current.frames.push({ frame: frameCount.current, value: maxX });
    } else if ((signal === 0 || signal === -currentRun.current.type) && currentRun.current.frames.length > 0) {
      // collapse run
      const run = currentRun.current;
      let event;
      if (run.type === 1) {
        const maxFrame = run.frames.reduce((prev, curr) => curr.value > prev.value ? curr : prev);
        event = { frame: maxFrame.frame, type: 'peak', value: maxFrame.value };
      } else if (run.type === -1) {
        const minFrame = run.frames.reduce((prev, curr) => curr.value < prev.value ? curr : prev);
        event = { frame: minFrame.frame, type: 'trough', value: minFrame.value };
      }

      if (lastEvent.current) {
        const drift = Math.abs(event.value - lastEvent.current.value);
        if (drift >= minDrift && frameCount.current - lastSwipeFrame.current >= cooldownFrames) {
          if (lastEvent.current.type === 'peak' && event.type === 'trough') {
            swipe = 'RIGHT';
            lastSwipeFrame.current = frameCount.current;
          } else if (lastEvent.current.type === 'trough' && event.type === 'peak') {
            swipe = 'LEFT';
            lastSwipeFrame.current = frameCount.current;
          }
        }
      }

      lastEvent.current = event;
      currentRun.current = { type: 0, frames: [] };
    }

    if (signal !== 0 && currentRun.current.type === 0) {
      currentRun.current = { type: signal, frames: [{ frame: frameCount.current, value: maxX }] };
    }

    return { signal, zScore: z, avgFilter: avgFilter.current, stdFilter: stdFilter.current, swipe, isCalibrating: false, bufferFull: true, isBelowThreshold };
  }, [lag, threshold, influence, minDrift, cooldownFrames]);

  return { processFrame, reset };
}