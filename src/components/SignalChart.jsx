import { useEffect, useRef } from 'react';

export function SignalChart({ signalHistory, lag = 20 }) {
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
    const visibleCount = Math.min(len - start, width);
    const currentX = visibleCount - 1;
    const windowWidth = Math.min(lag, visibleCount);
    const windowXStart = Math.max(0, currentX - windowWidth + 1);

    const values = signalHistory.slice(start).map(h => h.maxX);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal || 1;
    const padding = range * 0.1;

    const scaleY = (val) => height - ((val - (minVal - padding)) / (range + 2 * padding)) * height;

    for (let i = 0; i < visibleCount; i++) {
      const h = signalHistory[start + i];
      if (h.signal === 1) {
        ctx.fillStyle = 'rgba(0, 255, 0, 0.12)';
      } else if (h.signal === -1) {
        ctx.fillStyle = 'rgba(255, 0, 0, 0.12)';
      } else {
        continue;
      }
      ctx.fillRect(i, 0, 1, height);
    }

    ctx.strokeStyle = '#1e90ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < visibleCount; i++) {
      const h = signalHistory[start + i];
      const y = scaleY(h.maxX);
      if (i === 0) {
        ctx.moveTo(i, y);
      } else {
        ctx.lineTo(i, y);
      }
    }
    ctx.stroke();

    if (lag > 0) {
      ctx.fillStyle = 'rgba(255, 215, 0, 0.25)';
      ctx.fillRect(windowXStart, 0, currentX - windowXStart + 1, height);

      ctx.strokeStyle = 'rgba(0, 180, 0, 1)';
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(windowXStart + 0.5, 0);
      ctx.lineTo(windowXStart + 0.5, height);
      ctx.stroke();
    }

    const current = signalHistory[len - 1];
    if (current) {
      const cy = scaleY(current.maxX);
      const cx = currentX;
      ctx.fillStyle = '#1e90ff';
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, 2 * Math.PI);
      ctx.fill();

      ctx.strokeStyle = '#ff4500';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 7, 0, 2 * Math.PI);
      ctx.stroke();
    }

    ctx.fillStyle = '#333';
    ctx.font = '11px monospace';
    ctx.textBaseline = 'top';

    let textY = 5;
    const textX = 5;

    ctx.fillText('Signal (blue)', textX, textY);
    textY += 12;
    ctx.fillStyle = 'rgba(255, 215, 0, 0.8)';
    ctx.fillRect(textX, textY + 2, 10, 10);
    ctx.fillStyle = '#333';
    ctx.fillText('Lag window', textX + 14, textY);
    textY += 14;
    ctx.strokeStyle = 'rgba(0, 200, 0, 0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(textX, textY + 5);
    ctx.lineTo(textX + 20, textY + 5);
    ctx.stroke();
    ctx.fillStyle = '#333';
    ctx.fillText('Window start', textX + 24, textY - 1);
    textY += 14;
    ctx.fillStyle = '#1e90ff';
    ctx.beginPath();
    ctx.arc(textX + 5, textY + 6, 4, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#ff4500';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(textX + 5, textY + 6, 7, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.fillStyle = '#333';
    ctx.fillText('Current point', textX + 14, textY - 1);
  }, [signalHistory, lag]);

  return <canvas ref={canvasRef} width={600} height={150} />;
}
