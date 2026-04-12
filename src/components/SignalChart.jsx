import { useEffect, useRef } from 'react';

export function SignalChart({ signalHistory, threshold }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (signalHistory.length === 0) return;

    const width = canvas.width;
    const height = canvas.height;
    const len = signalHistory.length;
    const start = Math.max(0, len - width);

    // Find min and max for scaling including thresholds
    const values = signalHistory.slice(start).flatMap(h => {
      const upper = h.avgFilter + threshold * h.stdFilter;
      const lower = h.avgFilter - threshold * h.stdFilter;
      return [h.maxX, h.avgFilter, upper, lower];
    });
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal || 1;
    const padding = range * 0.1;

    const scaleY = (val) => height - ((val - (minVal - padding)) / (range + 2 * padding)) * height;

    // Draw backgrounds for detected signals
    for (let i = 0; i < Math.min(len - start, width); i++) {
      const h = signalHistory[start + i];
      if (h.signal === 1) {
        ctx.fillStyle = 'rgba(0, 255, 0, 0.15)';
      } else if (h.signal === -1) {
        ctx.fillStyle = 'rgba(255, 0, 0, 0.15)';
      } else {
        continue;
      }
      ctx.fillRect(i, 0, 1, height);
    }

    // Draw rolling mean line
    ctx.strokeStyle = 'orange';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    for (let i = 0; i < Math.min(len - start, width); i++) {
      const h = signalHistory[start + i];
      const y = scaleY(h.avgFilter);
      if (i === 0) {
        ctx.moveTo(i, y);
      } else {
        ctx.lineTo(i, y);
      }
    }
    ctx.stroke();

    // Draw threshold lines
    if (signalHistory[len - 1]) {
      const avg = signalHistory[len - 1].avgFilter;
      const std = signalHistory[len - 1].stdFilter;
      
      // Upper threshold
      const upper = avg + threshold * std;
      const yu = scaleY(upper);
      ctx.strokeStyle = 'rgba(255, 100, 100, 0.7)';
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(0, yu);
      ctx.lineTo(width, yu);
      ctx.stroke();

      // Lower threshold
      const lower = avg - threshold * std;
      const yl = scaleY(lower);
      ctx.strokeStyle = 'rgba(100, 100, 255, 0.7)';
      ctx.beginPath();
      ctx.moveTo(0, yl);
      ctx.lineTo(width, yl);
      ctx.stroke();

      ctx.setLineDash([]);
    }

    // Draw signal line
    ctx.strokeStyle = '#1e90ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < Math.min(len - start, width); i++) {
      const h = signalHistory[start + i];
      const y = scaleY(h.maxX);
      if (i === 0) {
        ctx.moveTo(i, y);
      } else {
        ctx.lineTo(i, y);
      }
    }
    ctx.stroke();

    // Draw current z-score indicator
    if (signalHistory[len - 1]) {
      const current = signalHistory[len - 1];
      const cy = scaleY(current.maxX);
      const zScore = current.zScore;
      
      // Draw circle at current point
      ctx.fillStyle = '#1e90ff';
      ctx.beginPath();
      ctx.arc(width - 1, cy, 4, 0, 2 * Math.PI);
      ctx.fill();

      // Color the circle based on z-score magnitude
      if (Math.abs(zScore) > threshold) {
        ctx.strokeStyle = zScore > 0 ? '#00cc00' : '#ff3333';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(width - 1, cy, 6, 0, 2 * Math.PI);
        ctx.stroke();
      }
    }

    // Draw legend
    ctx.fillStyle = '#333';
    ctx.font = '11px monospace';
    ctx.textBaseline = 'top';
    
    let textY = 5;
    const textX = 5;
    
    ctx.fillText('Signal (blue)', textX, textY);
    textY += 12;
    ctx.fillText('Rolling Mean (orange dash)', textX, textY);
    textY += 12;
    ctx.strokeStyle = 'rgba(255, 100, 100, 0.7)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(textX, textY - 3);
    ctx.lineTo(textX + 40, textY - 3);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(100, 100, 255, 0.7)';
    ctx.setLineDash([3, 3]);
    ctx.fillText('Upper/Lower Threshold', textX + 45, textY - 8);

  }, [signalHistory, threshold]);

  return <canvas ref={canvasRef} width={600} height={150} />;
}