import { useState, useEffect } from 'react';
import './StatusPanel.css';

export function StatusPanel({ isRunning, lastSwipe, params, onParamChange, isCalibrating, bufferFull, isBelowThreshold, currentMetrics }) {
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
    if (isBelowThreshold) return '⚠ Below Threshold';
    return '✓ No Detection';
  };

  const getZScoreColor = () => {
    if (!currentMetrics) return '#999';
    const abzScore = Math.abs(currentMetrics.zScore);
    if (abzScore > params.threshold) {
      return currentMetrics.zScore > 0 ? '#00cc00' : '#ff3333';
    }
    if (abzScore > params.threshold * 0.6) return '#ffbb00';
    return '#666';
  };

  return (
    <div className="status-panel">
      {/* Status Dot */}
      <div className="status-header">
        <div className={`status-dot ${isRunning ? 'running' : 'stopped'}`}></div>
        <span className="status-label">{isRunning ? 'Running' : 'Stopped'}</span>
      </div>

      {/* Swipe Detection Bar */}
      <div className={`swipe-bar ${swipeFlash ? 'flash' : ''} ${lastSwipe ? 'active' : 'inactive'}`}>
        {lastSwipe ? (
          <span className={`swipe-text ${lastSwipe === 'LEFT' ? 'left' : 'right'}`}>
            {lastSwipe === 'LEFT' ? '← LEFT SWIPE' : 'RIGHT SWIPE →'}
          </span>
        ) : (
          <span className="no-swipe">No swipe</span>
        )}
      </div>

      {/* Metrics Display */}
      <div className="metrics-display">
        <div className="metric">
          <label>Detection:</label>
          <span className="metric-value detection">{getDetectionStatus()}</span>
        </div>
        <div className="metric">
          <label>Z-Score:</label>
          <span className="metric-value z-score" style={{ color: getZScoreColor() }}>
            {currentMetrics ? currentMetrics.zScore.toFixed(2) : '—'}
          </span>
        </div>
        <div className="metric">
          <label>Rolling Mean:</label>
          <span className="metric-value">{currentMetrics ? currentMetrics.avgFilter.toFixed(3) : '—'}</span>
        </div>
        <div className="metric">
          <label>Std Dev:</label>
          <span className="metric-value">{currentMetrics ? currentMetrics.stdFilter.toFixed(3) : '—'}</span>
        </div>
        <div className="metric">
          <label>Threshold:</label>
          <span className="metric-value">{params.threshold.toFixed(1)}σ</span>
        </div>
      </div>

      {/* Buffer & Threshold Status */}
      <div className="diagnostic-bar">
        <div className={`indicator ${isCalibrating ? 'calibrating' : bufferFull ? 'ready' : 'waiting'}`}>
          {isCalibrating ? '⟳ Calibrating' : bufferFull ? '✓ Buffer Full' : '○ Filling'}
        </div>
        <div className={`indicator ${isBelowThreshold ? 'below-threshold' : 'normal'}`}>
          {isBelowThreshold ? '⚠️ Below Threshold' : '✓ Threshold OK'}
        </div>
      </div>
      <div className="params">
        <label>
          Lag: <input type="number" min="5" max="60" step="1" value={params.lag} onChange={(e) => handleParamChange('lag', e.target.value)} />
        </label>
        <label>
          Threshold: <input type="number" min="1" max="5" step="0.1" value={params.threshold} onChange={(e) => handleParamChange('threshold', e.target.value)} />
        </label>
        <label>
          Influence: <input type="number" min="0" max="1" step="0.1" value={params.influence} onChange={(e) => handleParamChange('influence', e.target.value)} />
        </label>
        <label>
          Min Drift: <input type="number" min="0.05" max="0.5" step="0.05" value={params.minDrift} onChange={(e) => handleParamChange('minDrift', e.target.value)} />
        </label>
        <label>
          Cooldown: <input type="number" min="5" max="60" step="1" value={params.cooldownFrames} onChange={(e) => handleParamChange('cooldownFrames', e.target.value)} />
        </label>
      </div>
    </div>
  );
}