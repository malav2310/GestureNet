import './SwipeHistory.css';

export function SwipeHistory({ swipeHistory }) {
  return (
    <div className="swipe-history">
      <h3>Swipe History</h3>
      <div className="history-list">
        {swipeHistory.length === 0 ? (
          <div className="no-swipes">No swipes detected yet.</div>
        ) : (
          swipeHistory.map((entry, index) => (
            <div key={index} className="history-item">
              <div className="header">
                <strong>{entry.swipe}</strong> at {entry.timestamp}
              </div>
              <div className="details">
                <div>Buffer: [{entry.buffer.join(', ')}]</div>
                <div>Drift: {entry.drift != null ? entry.drift.toFixed(2) : 'N/A'}</div>
                <div>Prev Value: {entry.prevValue != null ? entry.prevValue.toFixed(2) : 'N/A'}</div>
                <div>Current Value: {entry.currentValue != null ? entry.currentValue.toFixed(2) : 'N/A'}</div>
                <div>Reason: {entry.reason}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
