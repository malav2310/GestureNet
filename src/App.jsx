import { useState, useRef, useCallback } from 'react';
import { useHandTracking } from './hooks/useHandTracking';
import { useSwipeDetector } from './hooks/useSwipeDetector';
import { CameraView } from './components/CameraView';
import { SignalChart } from './components/SignalChart';
import { StatusPanel } from './components/StatusPanel';
import './App.css';

function App() {
  const [isRunning, setIsRunning] = useState(false);
  const [lastSwipe, setLastSwipe] = useState(null);
  const [signalHistory, setSignalHistory] = useState([]);
  const [params, setParams] = useState({
    lag: 5,
    threshold: 2.5,
    influence: 0.3,
    minDrift: 0.15,
    cooldownFrames: 20
  });
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [bufferFull, setBufferFull] = useState(false);
  const [isBelowThreshold, setIsBelowThreshold] = useState(false);
  const swipeResetTimer = useRef(null);

  const videoRef = useRef(null);

  const { processFrame, reset } = useSwipeDetector(params);

  const onFrame = useCallback((maxX) => {
    const result = processFrame(maxX);
    setSignalHistory(prev => [...prev.slice(-199), { maxX, signal: result.signal, zScore: result.zScore, avgFilter: result.avgFilter, stdFilter: result.stdFilter }]);
    setIsCalibrating(result.isCalibrating);
    setBufferFull(result.bufferFull);
    setIsBelowThreshold(result.isBelowThreshold);
    if (result.swipe) {
      setLastSwipe(result.swipe);
      if (swipeResetTimer.current) clearTimeout(swipeResetTimer.current);
      swipeResetTimer.current = setTimeout(() => setLastSwipe(null), 1500);
      const event = result.swipe === 'LEFT' ? 'ArrowLeft' : 'ArrowRight';
      document.dispatchEvent(new KeyboardEvent('keydown', { key: event, keyCode: result.swipe === 'LEFT' ? 37 : 39, bubbles: true }));
      setTimeout(() => document.dispatchEvent(new KeyboardEvent('keyup', { key: event, keyCode: result.swipe === 'LEFT' ? 37 : 39, bubbles: true })), 50);
    }
  }, [processFrame]);

  useHandTracking(videoRef, isRunning, onFrame);

  const handleParamChange = (newParams) => {
    setParams(newParams);
    reset();
    setSignalHistory([]);
  };

  const toggleRunning = () => {
    setIsRunning(!isRunning);
    if (!isRunning) {
      setLastSwipe(null);
      setSignalHistory([]);
    }
  };

  return (
    <div className="app">
      <div className="top">
        <CameraView videoRef={videoRef} />
        <StatusPanel
          isRunning={isRunning}
          lastSwipe={lastSwipe}
          params={params}
          onParamChange={handleParamChange}
          isCalibrating={isCalibrating}
          bufferFull={bufferFull}
          isBelowThreshold={isBelowThreshold}
          currentMetrics={signalHistory.length > 0 ? signalHistory[signalHistory.length - 1] : null}
        />
      </div>
      <div className="middle">
        <SignalChart signalHistory={signalHistory} threshold={params.threshold} />
      </div>
      <div className="bottom">
        <button onClick={toggleRunning} className="start-button">
          {isRunning ? 'Stop' : 'Start'}
        </button>
      </div>
    </div>
  );
}

export default App;