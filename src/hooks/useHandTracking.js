import { useEffect, useRef } from 'react';

export function useHandTracking(videoRef, isRunning, onFrame) {
  const handsRef = useRef(null);
  const cameraRef = useRef(null);

  useEffect(() => {
    if (!isRunning) return;

    const initHands = async () => {
      const hands = new Hands({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
      });

      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      hands.onResults((results) => {
        if (results.multiHandLandmarks && results.multiHandLandmarks[0]) {
          const landmarks = results.multiHandLandmarks[0];
          const maxX = Math.max(...landmarks.map(l => l.x));
          onFrame(maxX);
        }
      });

      await hands.initialize();

      handsRef.current = hands;

      const camera = new Camera(videoRef.current, {
        onFrame: async () => {
          await hands.send({image: videoRef.current});
        },
        width: 640,
        height: 480
      });
      camera.start();
      cameraRef.current = camera;
    };

    initHands();

    return () => {
      if (cameraRef.current) {
        cameraRef.current.stop();
        cameraRef.current = null;
      }
      if (handsRef.current) {
        handsRef.current.close();
        handsRef.current = null;
      }
    };
  }, [isRunning, videoRef, onFrame]);
}