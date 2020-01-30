import React, { Component } from 'react';

export class CameraFeed extends Component {
  /**
   * Processes available devices and identifies one by the label
   * @memberof CameraFeed
   * @instance
   */
  processDevices(devices) {
    devices.forEach(device => {
      if (device.kind === 'videoinput') this.setDevice(device);
    });
  }

  /**
   * Sets the active device and starts playing the feed
   * @memberof CameraFeed
   * @instance
   */
  async setDevice(device) {
    const { deviceId } = device;
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { deviceId },
    });
    this.videoPlayer.srcObject = stream;
    this.videoPlayer.play();
  }

  /**
   * On mount, grab the users connected devices and process them
   * @memberof CameraFeed
   * @instance
   * @override
   */
  async componentDidMount() {
    console.log('Before enumerateDevices navigator:' + navigator);
    console.log(
      'Before enumerateDevices navigator.mediaDevices:' +
        navigator.mediaDevices,
    );
    console.log(
      'Before enumerateDevices navigator.mediaDevices.enumerateDevices:' +
        navigator.mediaDevices.enumerateDevices,
    );
    const cameras = await navigator.mediaDevices.enumerateDevices();
    console.log('cameras:' + cameras);
    this.processDevices(cameras);
  }
  async componentWillUnmount() {
    console.log('CameraFeed unload');
  }

  /**
   * Handles taking a still image from the video feed on the camera
   * @memberof CameraFeed
   * @instance
   */
  takePhoto = () => {
    //        const { sendFile } = this.props;
    const context = this.canvas.getContext('2d');
    context.drawImage(this.videoPlayer, 0, 0, 100, 100);
    let data = this.canvas.toDataURL();
    K('field[Photo Image]').value(data);
    K('button[Submit Button]').show();
  };

  render() {
    return (
      <div className="c-camera-feed">
        <div className="c-camera-feed__viewer">
          <video
            ref={ref => (this.videoPlayer = ref)}
            width="160"
            heigh="160"
          />
        </div>
        <button onClick={this.takePhoto}>Take photo!</button>
        <div className="c-camera-feed__stage">
          <canvas width="100" height="100" ref={ref => (this.canvas = ref)} />
        </div>
      </div>
    );
  }
}
