import './CameraView.css';

export function CameraView({ videoRef }) {
  return (
    <div className="camera-view">
      <video
        ref={videoRef}
        muted
        autoPlay
        playsInline
        width={640}
        height={480}
        style={{ display: 'block' }}
      />
    </div>
  );
}