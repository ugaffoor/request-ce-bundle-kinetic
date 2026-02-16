import React, { Component } from 'react';

export class CameraFeed extends Component {
  state = {
    facingMode: 'user',
    cameraEnabled: false,
  };

  videoPlayer = null;
  canvas = null;
  stream = null;

  componentWillUnmount() {
    this.stopCamera();
  }

  startCamera = async () => {
    try {
      // Must be HTTPS (except localhost)
      if (
        window.location.protocol !== 'https:' &&
        window.location.hostname !== 'localhost'
      ) {
        alert('Camera requires HTTPS');
        return;
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        alert('Camera not supported');
        return;
      }

      this.stopCamera();

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: this.state.facingMode,
        },
      });

      this.stream = stream;
      this.videoPlayer.srcObject = stream;
      await this.videoPlayer.play();

      this.setState({ cameraEnabled: true });
    } catch (err) {
      console.error('Camera error:', err.name, err.message);
      alert('Camera permission denied. Please allow camera access.');
    }
  };

  stopCamera = () => {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  };

  toggleCamera = () => {
    this.setState(
      prev => ({
        facingMode: prev.facingMode === 'user' ? 'environment' : 'user',
      }),
      () => {
        if (this.state.cameraEnabled) {
          this.startCamera();
        }
      },
    );
  };

  takePhoto = () => {
    if (!this.stream) return;

    const context = this.canvas.getContext('2d');

    let width = this.videoPlayer.videoWidth;
    let height = this.videoPlayer.videoHeight;

    while (width > 200) {
      width /= 2;
      height /= 2;
    }

    this.canvas.width = width;
    this.canvas.height = height;

    context.drawImage(this.videoPlayer, 0, 0, width, height);

    const data = this.canvas.toDataURL('image/png');

    K('field[Photo Image]').value(data);
    K('button[Submit Button]').show();
  };

  render() {
    const { cameraEnabled, facingMode } = this.state;
    const isFront = facingMode === 'user';

    return (
      <div className="c-camera-feed">
        <div className="c-camera-feed__viewer">
          <video
            ref={ref => (this.videoPlayer = ref)}
            autoPlay
            playsInline
            muted
            width="150"
            height="150"
            style={{
              transform: isFront ? 'scaleX(-1)' : 'none',
            }}
          />
        </div>

        <div className="c-camera-feed__controls">
          {!cameraEnabled && (
            <button onClick={this.startCamera}>Enable camera</button>
          )}

          {cameraEnabled && (
            <>
              <button onClick={this.toggleCamera}>Switch camera</button>
              <button onClick={this.takePhoto}>Take photo</button>
            </>
          )}
        </div>

        <canvas ref={ref => (this.canvas = ref)} style={{ display: 'none' }} />
      </div>
    );
  }
}
