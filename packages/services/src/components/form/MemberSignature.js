import SignatureCanvas from 'react-signature-canvas';
import React, { Component } from 'react';

export class MemberSignature extends Component {
  constructor(props) {
    super(props);
    this.encodedFieldName = '[name="' + props.encodedFieldName + '"]';
  }
  sigPad = {};

  clear = () => {
    this.sigPad.clear();
    $(this.encodedFieldName).val('');
  };

  changeColor = () => {
    var r = Math.round(Math.random() * 255);
    var g = Math.round(Math.random() * 255);
    var b = Math.round(Math.random() * 255);
    var color = 'rgb(' + r + ',' + g + ',' + b + ')';

    this.sigPad.getSignaturePad().penColor = color;
  };

  undo = () => {
    var data = this.sigPad.toData();
    if (data) {
      data.pop(); // remove the last dot or line
      this.sigPad.fromData(data);
    }

    this.sigPad.isEmpty()
      ? $(this.encodedFieldName).val('')
      : $(this.encodedFieldName).val(this.sigPad.toDataURL());
  };

  onBegin = () => {
    $(this.encodedFieldName).val('');
  };

  onEnd = () => {
    $(this.encodedFieldName).val(this.sigPad.toDataURL());
  };

  render() {
    return (
      <div id="signature-pad" className="signature-pad">
        <div className="signature-pad--body">
          <SignatureCanvas
            clearOnResize={false}
            onBegin={this.onBegin}
            onEnd={this.onEnd}
            ref={ref => {
              this.sigPad = ref;
            }}
          />
        </div>
        <div className="signature-pad--footer">
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
              <button
                type="button"
                className="button"
                onClick={this.changeColor}
              >
                Change color
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
