import React, { Component } from 'react';
import { CoreForm } from 'react-kinetic-core';
import DocumentTitle from 'react-document-title';
import $ from 'jquery';
import ReactDOM from 'react-dom';
import { CameraFeed } from './Member/CameraFeed';
import { bundle } from 'react-kinetic-core';

class UploadPhoto extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      photoMode: 'Camera',
    };
  }
  render() {
    return (
      <span>
        <CoreForm
          kapp="gbmembers"
          form="member-photo"
          values={this.props.defaultValues}
          completed={this.props.appliedEditForm}
        />
        <button
          type="button"
          className="btn btn-primary"
          onClick={e => this.props.cancel()}
        >
          Cancel
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={e => {
            if (this.state.photoMode === 'Camera') {
              this.setState({ photoMode: 'Upload' });
              $('#CameraFeedDiv').hide();
              $('.embedded-core-form')
                .find("[data-element-name='Photo']")
                .show();
              K('button[Submit Button]').show();
            } else {
              this.setState({ photoMode: 'Camera' });
              $('#CameraFeedDiv').show();
              $('.embedded-core-form')
                .find("[data-element-name='Photo']")
                .hide();
            }
          }}
        >
          {this.state.photoMode === 'Camera'
            ? 'Switch to Upload'
            : 'Switch to Camera'}
        </button>
      </span>
    );
  }
}
class Photo extends React.Component {
  render() {
    return (
      <img
        src={this.props.memberItem.values['Photo']}
        alt="Member Photograph"
        className="photo"
        onClick={e => this.props.setUpload()}
      />
    );
  }
}
export class PhotoForm extends Component {
  constructor(props) {
    super(props);
    this.state = { editing: false };
    this.appliedForm = this.appliedForm.bind(this);
    this.appliedEditForm = this.appliedEditForm.bind(this);
    this.handleLoaded = this.handleLoaded.bind(this);
    this.setUpload = this.setUpload.bind(this);
    this.cancel = this.cancel.bind(this);

    this.defaultValues = {
      originatingID: this.props.memberItem.id,
      Filename: this.props.memberItem.values['Member ID'] + '.png',
    };
    if (this.props.setIsDirty) this.setIsDirty = this.props.setIsDirty;
    this.state = {
      photoMode: 'Camera',
    };
  }
  componentWillUnmount() {
    console.log('PhotoForm unload');
    if (
      window.cameraFeedEl &&
      window.cameraFeedEl.videoPlayer.srcObject !== null
    )
      window.cameraFeedEl.videoPlayer.srcObject
        .getTracks()
        .forEach(track => track.stop());
  }
  cancel() {
    window.cameraFeedEl.videoPlayer.srcObject
      .getTracks()
      .forEach(track => track.stop());
    ReactDOM.render(
      React.createElement(Photo, {
        memberItem: this.props.memberItem,
        setUpload: this.setUpload,
      }),
      $('.photo-form')[0],
    );
  }
  switchModes() {
    this.setState({
      photoMode: this.state.photoMode === 'Camera' ? 'Upload' : 'Camera',
    });
  }
  setUpload() {
    ReactDOM.render(
      React.createElement(UploadPhoto, {
        submissionId: '0f104411-0565-11e8-8ffe-87d52fe83b7b',
        memberItem: this.props.memberItem,
        appliedEditForm: this.appliedEditForm,
        defaultValues: this.defaultValues,
        cancel: this.cancel,
        photoMode: this.state.photoMode,
        switchModes: this.switchModes,
      }),
      $('.photo-form')[0],
    );
  }
  appliedForm(response, actions) {
    if (
      response.submission.values.Photo !== null &&
      response.submission.values.Photo.length > 0
    ) {
      var link =
        //      window.location.pathname.split('/gbmembers')[0] +
        '/submissions/' +
        response.submission.values.Photo[0].link.split('/submissions/')[1];
      this.props.memberItem.values['Photo'] = link;
    } else {
      this.props.memberItem.values['Photo'] = K('field[Photo Image]').value();
    }
    //    ReactDOM.render(React.createElement(Photo, {memberItem: this.props.memberItem, setUpload: this.setUpload}),$('.photo-form')[0]);
    window.cameraFeedEl.videoPlayer.srcObject
      .getTracks()
      .forEach(track => track.stop());
    this.setState(this.state);
    if (this.setIsDirty) this.setIsDirty(true);
  }
  appliedEditForm(response, actions) {
    if (
      response.submission.values.Photo !== null &&
      response.submission.values.Photo.length > 0
    ) {
      var link =
        '/submissions/' +
        response.submission.values.Photo[0].link.split('/submissions/')[1];
      this.props.memberItem.values['Photo'] = link;
    } else {
      this.props.memberItem.values['Photo'] = K('field[Photo Image]').value();
    }
    window.cameraFeedEl.videoPlayer.srcObject
      .getTracks()
      .forEach(track => track.stop());
    ReactDOM.render(
      React.createElement(Photo, {
        memberItem: this.props.memberItem,
        setUpload: this.setUpload,
      }),
      $('.photo-form')[0],
    );
    this.setState(this.state);
    if (this.setIsDirty) this.setIsDirty(true);
  }
  handleLoaded() {
    console.log('Photo form loaded');
  }
  render() {
    return (
      <DocumentTitle title="Photo Upload">
        <div className="photo-form">
          {this.props.memberItem.values['Photo'] === undefined ? (
            <span>
              <CoreForm
                kapp="gbmembers"
                form="member-photo"
                completed={this.appliedForm}
                onLoaded={this.handleLoaded}
                values={this.defaultValues}
              />
              <button
                type="button"
                className="btn btn-primary"
                onClick={e => {
                  if (this.state.photoMode === 'Camera') {
                    this.setState({ photoMode: 'Upload' });
                    $('#CameraFeedDiv').hide();
                    $('.embedded-core-form')
                      .find("[data-element-name='Photo']")
                      .show();
                    K('button[Submit Button]').show();
                  } else {
                    this.setState({ photoMode: 'Camera' });
                    $('#CameraFeedDiv').show();
                    $('.embedded-core-form')
                      .find("[data-element-name='Photo']")
                      .hide();
                  }
                }}
              >
                {this.state.photoMode === 'Camera'
                  ? 'Switch to Upload'
                  : 'Switch to Camera'}
              </button>
            </span>
          ) : (
            <Photo
              memberItem={this.props.memberItem}
              setUpload={this.setUpload}
            />
          )}
        </div>
      </DocumentTitle>
    );
  }
}

bundle.config.widgets2 = {
  cameraFeed: ({ element, height, width, ref }) => {
    ReactDOM.render(<CameraFeed ref={ref} />, element);
  },
};
