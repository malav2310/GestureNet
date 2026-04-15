import { useState, useRef, useCallback } from 'react';
import { useHandTracking } from './hooks/useHandTracking';
import { useSwipeDetector } from './hooks/useSwipeDetector';
import { CameraView } from './components/CameraView';
import { SignalChart } from './components/SignalChart';
import { StatusPanel } from './components/StatusPanel';
import { SwipeHistory } from './components/SwipeHistory';
import './App.css';

function App() {
  const [isRunning, setIsRunning] = useState(false);
  const [lastSwipe, setLastSwipe] = useState(null);
  const [signalHistory, setSignalHistory] = useState([]);
  const [swipeWindow, setSwipeWindow] = useState(null);
  const [swipeHistory, setSwipeHistory] = useState([]);
  const [params, setParams] = useState({
    lag: 20,
    minDrift: 0.25,
    cooldownFrames: 20
  });
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [bufferFull, setBufferFull] = useState(false);
  const swipeResetTimer = useRef(null);

  const videoRef = useRef(null);

  const { processFrame, reset } = useSwipeDetector(params);

  const onFrame = useCallback((maxX) => {
    const result = processFrame(maxX);
    setSignalHistory(prev => [...prev.slice(-199), { maxX, signal: result.signal }]);
    setSwipeWindow(result.swipeWindow);
    setIsCalibrating(result.isCalibrating);
    setBufferFull(result.bufferFull);
    if (result.swipe) {
      setLastSwipe(result.swipe);
      setSwipeWindow(result.swipeWindow);
      // Collect swipe history
      const swipeEntry = {
        swipe: result.swipe,
        timestamp: new Date().toLocaleTimeString(),
        buffer: result.buffer,
        reason: result.swipe === 'LEFT' ? 'Trough followed by peak with sufficient drift' : 'Peak followed by trough with sufficient drift',
        drift: result.drift,
        prevValue: result.prevValue,
        currentValue: result.currentValue
      };
      setSwipeHistory(prev => [swipeEntry, ...prev.slice(0, 49)]); // keep last 50
      if (swipeResetTimer.current) clearTimeout(swipeResetTimer.current);
      swipeResetTimer.current = setTimeout(() => {
        setLastSwipe(null);
        setSwipeWindow(null);
      }, 1500);
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
    setSwipeWindow(null);
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
          currentMetrics={signalHistory.length > 0 ? signalHistory[signalHistory.length - 1] : null}
        />
      </div>
      <div className="middle">
        <SignalChart signalHistory={signalHistory} lag={params.lag} />
        <SwipeHistory swipeHistory={swipeHistory} />
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