import { useRef, useCallback } from 'react';

export function useSwipeDetector({ lag = 20, minDrift = 0.25, cooldownFrames = 20 }) {
  const signalBuffer = useRef([]);
  const currentSequence = useRef({ type: 0, startValue: null, startFrame: null, lastValue: null, lastFrame: null });
  const lastEvent = useRef(null);
  const frameCount = useRef(0);
  const lastSwipeFrame = useRef(0);
  const lastSample = useRef({ value: null, frame: null });

  const reset = useCallback(() => {
    signalBuffer.current = [];
    currentSequence.current = { type: 0, startValue: null, startFrame: null, lastValue: null, lastFrame: null };
    lastEvent.current = null;
    frameCount.current = 0;
    lastSwipeFrame.current = 0;
    lastSample.current = { value: null, frame: null };
  }, []);

  const processFrame = useCallback((maxX) => {
    frameCount.current += 1;
    signalBuffer.current.push(maxX);
    const bufferFull = signalBuffer.current.length >= lag;

    if (!bufferFull) {
      return {
        signal: 0,
        swipe: null,
        isCalibrating: true,
        bufferFull: false,
        swipeWindow: null,
        buffer: [...signalBuffer.current],
        drift: null,
        prevValue: null,
        currentValue: null
      };
    }

    if (signalBuffer.current.length > lag) {
      signalBuffer.current.shift();
    }

    let swipe = null;
    let swipeWindow = null;
    let drift = null;
    let prevValue = null;
    let currentValue = null;

    const previousSample = lastSample.current;
    if (previousSample.value === null) {
      lastSample.current = { value: maxX, frame: frameCount.current };
      return {
        signal: 0,
        swipe: null,
        isCalibrating: false,
        bufferFull: true,
        swipeWindow: null,
        buffer: [...signalBuffer.current],
        drift: null,
        prevValue: null,
        currentValue: null
      };
    }

    const comparison = maxX > previousSample.value ? 1 : maxX < previousSample.value ? -1 : 0;
    const run = currentSequence.current;

    const completeSequence = (event) => {
      if (lastEvent.current) {
        const calculatedDrift = Math.abs(event.value - lastEvent.current.value);
        if (calculatedDrift >= minDrift && frameCount.current - lastSwipeFrame.current >= cooldownFrames) {
          if (lastEvent.current.type === 'peak' && event.type === 'trough') {
            swipe = 'RIGHT';
          } else if (lastEvent.current.type === 'trough' && event.type === 'peak') {
            swipe = 'LEFT';
          }
          if (swipe) {
            lastSwipeFrame.current = frameCount.current;
            swipeWindow = { start: lastEvent.current.frame, end: event.frame };
            drift = calculatedDrift;
            prevValue = lastEvent.current.value;
            currentValue = event.value;
          }
        }
      }
      lastEvent.current = event;
    };

    if (run.type === 0) {
      if (comparison === 1) {
        currentSequence.current = {
          type: 1,
          startValue: previousSample.value,
          startFrame: previousSample.frame,
          lastValue: maxX,
          lastFrame: frameCount.current
        };
      } else if (comparison === -1) {
        currentSequence.current = {
          type: -1,
          startValue: previousSample.value,
          startFrame: previousSample.frame,
          lastValue: maxX,
          lastFrame: frameCount.current
        };
      }
    } else if (run.type === 1) {
      if (comparison >= 0) {
        currentSequence.current.lastValue = maxX;
        currentSequence.current.lastFrame = frameCount.current;
      } else {
        const peakEvent = { type: 'peak', value: run.lastValue, frame: run.lastFrame };
        completeSequence(peakEvent);
        currentSequence.current = {
          type: -1,
          startValue: peakEvent.value,
          startFrame: peakEvent.frame,
          lastValue: maxX,
          lastFrame: frameCount.current
        };
      }
    } else if (run.type === -1) {
      if (comparison <= 0) {
        currentSequence.current.lastValue = maxX;
        currentSequence.current.lastFrame = frameCount.current;
      } else {
        const troughEvent = { type: 'trough', value: run.lastValue, frame: run.lastFrame };
        completeSequence(troughEvent);
        currentSequence.current = {
          type: 1,
          startValue: troughEvent.value,
          startFrame: troughEvent.frame,
          lastValue: maxX,
          lastFrame: frameCount.current
        };
      }
    }

    lastSample.current = { value: maxX, frame: frameCount.current };

    return {
      signal: currentSequence.current.type,
      swipe,
      isCalibrating: false,
      bufferFull: true,
      swipeWindow,
      buffer: [...signalBuffer.current],
      drift,
      prevValue,
      currentValue
    };
  }, [lag, minDrift, cooldownFrames]);

  return { processFrame, reset };
}
