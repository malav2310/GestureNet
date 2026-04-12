import { useEffect, useState } from 'react';

export function useCamera(videoRef, isRunning) {
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isRunning) {
      navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })
        .then((mediaStream) => {
          setStream(mediaStream);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
          setError(null);
        })
        .catch((err) => {
          setError(err);
        });
    } else {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isRunning, videoRef, stream]);

  return { stream, error };
}