import SignatureCanvas from 'react-signature-canvas';
import React, { Component } from 'react';

export class MemberSignature extends Component {
  sigPad = {}

  clear = () => {
    this.sigPad.clear();
    $('[name="Encoded Member Signature"]').val('');
  }

  changeColor = () => {
    var r = Math.round(Math.random() * 255);
    var g = Math.round(Math.random() * 255);
    var b = Math.round(Math.random() * 255);
    var color = "rgb(" + r + "," + g + "," + b +")";

    this.sigPad.getSignaturePad().penColor = color;
  }

  undo = () => {
    var data = this.sigPad.toData();
    if (data) {
      data.pop(); // remove the last dot or line
      this.sigPad.fromData(data);
    }

    this.sigPad.isEmpty() ? $('[name="Encoded Member Signature"]').val('') :
     $('[name="Encoded Member Signature"]').val(this.sigPad.toDataURL());
  }

  onBegin = () => {
    $('[name="Encoded Member Signature"]').val('');
  }

  onEnd = () => {
    $('[name="Encoded Member Signature"]').val(this.sigPad.toDataURL());
  }

  render () {
    return <div id="signature-pad" className="signature-pad">
    <div className="signature-pad--body">
      <SignatureCanvas clearOnResize={false} onBegin={this.onBegin} onEnd={this.onEnd}
        ref={(ref) => { this.sigPad = ref }} />
    </div>
    <div className="signature-pad--footer">
      <div className="description">Sign above</div>
      <div className="signature-pad--actions">
        <div>
          <button type="button" className="button clear" onClick={this.clear}>Clear</button>
          <button type="button" className="button" onClick={this.changeColor}>Change color</button>
          <button type="button" className="button" onClick={this.undo}>Undo</button>
        </div>
      </div>
    </div>
  </div>
  }
}
