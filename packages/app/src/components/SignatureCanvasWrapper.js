import React from 'react';
import SignatureCanvas from 'react-signature-canvas';

export class SignatureCanvasWrapper extends React.Component {
  constructor(props) {
    super(props);
    this.onEnd = this.onEnd.bind(this);
  }

  setValue(value) {
    const { height, width } = this.props;
    if (value) {
      this.signatureCanvas.fromDataURL(value, { height, width });
    } else {
      this.signatureCanvas.clear();
    }
  }

  componentDidMount() {
    const { initialValue, height, width, disable } = this.props;
    if (initialValue) {
      this.signatureCanvas.fromDataURL(initialValue, { height, width });
    }
    if (disable) this.signatureCanvas.off();
  }

  clear = () => {
    this.signatureCanvas.clear();
    const { onChange } = this.props;
    if (typeof onChange === 'function') {
      onChange('');
    }
  };
  undo = () => {
    var data = this.signatureCanvas.toData();
    if (data) {
      data.pop(); // remove the last dot or line
      this.signatureCanvas.fromData(data);
    }
  };
  onEnd() {
    const { onChange } = this.props;
    if (typeof onChange === 'function') {
      onChange(this.signatureCanvas.toDataURL());
    }
  }

  render() {
    const { height, width, disable } = this.props;
    return (
      <div className="signature-pad">
        <SignatureCanvas
          canvasProps={{ height, width }}
          onEnd={this.onEnd}
          ref={el => (this.signatureCanvas = el)}
        />
        <div
          className={
            'signature-pad--footer' + (this.props.disable ? ' disabled' : '')
          }
        >
          <div className="description">Sign above</div>
          <div className="signature-pad--actions">
            <div>
              <button
                type="button"
                className="button clear"
                onClick={this.clear}
              >
                Clear
              </button>
              <button type="button" className="button" onClick={this.undo}>
                Undo
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
