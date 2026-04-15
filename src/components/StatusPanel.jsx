import { useState, useEffect } from 'react';
import './StatusPanel.css';

export function StatusPanel({ isRunning, lastSwipe, params, onParamChange, isCalibrating, bufferFull, currentMetrics }) {
  const [swipeFlash, setSwipeFlash] = useState(false);

  useEffect(() => {
    if (lastSwipe) {
      setSwipeFlash(true);
      const timer = setTimeout(() => setSwipeFlash(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [lastSwipe]);

  const handleParamChange = (key, value) => {
    onParamChange({ ...params, [key]: parseFloat(value) });
  };

  const getDetectionStatus = () => {
    if (!bufferFull) return 'Calibrating...';
    if (lastSwipe === 'LEFT') return '← LEFT';
    if (lastSwipe === 'RIGHT') return '→ RIGHT';
    return 'Tracking';
  };

  const getTrendLabel = () => {
    if (!currentMetrics) return '—';
    if (currentMetrics.signal === 1) return 'Increasing';
    if (currentMetrics.signal === -1) return 'Decreasing';
    return 'Flat';
  };

  return (
    <div className="status-panel">
      <div className="status-header">
        <div className={`status-dot ${isRunning ? 'running' : 'stopped'}`}></div>
        <span className="status-label">{isRunning ? 'Running' : 'Stopped'}</span>
      </div>

      <div className={`swipe-bar ${swipeFlash ? 'flash' : ''} ${lastSwipe ? 'active' : 'inactive'}`}>
        {lastSwipe ? (
          <span className={`swipe-text ${lastSwipe === 'LEFT' ? 'left' : 'right'}`}>
            {lastSwipe === 'LEFT' ? '← LEFT SWIPE' : 'RIGHT SWIPE →'}
          </span>
        ) : (
          <span className="no-swipe">No swipe</span>
        )}
      </div>

      <div className="metrics-display">
        <div className="metric">
          <label>Detection:</label>
          <span className="metric-value detection">{getDetectionStatus()}</span>
        </div>
        <div className="metric">
          <label>Trend:</label>
          <span className="metric-value">{getTrendLabel()}</span>
        </div>
        <div className="metric">
          <label>Min Drift:</label>
          <span className="metric-value">{params.minDrift.toFixed(2)}</span>
        </div>
        <div className="metric">
          <label>Cooldown:</label>
          <span className="metric-value">{params.cooldownFrames}</span>
        </div>
      </div>

      <div className="diagnostic-bar">
        <div className={`indicator ${isCalibrating ? 'calibrating' : bufferFull ? 'ready' : 'waiting'}`}>
          {isCalibrating ? '⟳ Calibrating' : bufferFull ? '✓ Buffer Full' : '○ Filling'}
        </div>
      </div>
      <div className="params">
        <label>
          Lag: <input type="number" min="5" max="60" step="1" value={params.lag} onChange={(e) => handleParamChange('lag', e.target.value)} />
        </label>
        <label>
          Min Drift: <input type="number" min="0.01" max="1" step="0.01" value={params.minDrift} onChange={(e) => handleParamChange('minDrift', e.target.value)} />
        </label>
        <label>
          Cooldown: <input type="number" min="1" max="60" step="1" value={params.cooldownFrames} onChange={(e) => handleParamChange('cooldownFrames', e.target.value)} />
        </label>
      </div>
    </div>
  );
}
