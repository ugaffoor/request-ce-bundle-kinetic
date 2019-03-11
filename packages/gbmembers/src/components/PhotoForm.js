import React, { Component } from 'react';
import { CoreForm } from 'react-kinetic-core';
import DocumentTitle from 'react-document-title';
import $ from 'jquery';
import ReactDOM from 'react-dom';

class UploadPhoto extends React.Component {
  render() {
    return (
      <span>
        <CoreForm
          kapp="gbmembers"
          form="member-photo"
          values={this.defaultValues}
          completed={this.props.appliedForm}
        />
        <button
          type="button"
          className="btn btn-primary"
          onClick={e => this.props.cancel()}
        >
          Cancel
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
    this.setUpload = this.setUpload.bind(this);
    this.cancel = this.cancel.bind(this);
    this.defaultValues = {
      originatingID: this.props.memberItem.id,
    };
    if (this.props.setIsDirty) this.setIsDirty = this.props.setIsDirty;
  }
  cancel() {
    ReactDOM.render(
      React.createElement(Photo, {
        memberItem: this.props.memberItem,
        setUpload: this.setUpload,
      }),
      $('.photo-form')[0],
    );
  }
  setUpload() {
    ReactDOM.render(
      React.createElement(UploadPhoto, {
        submissionId: '0f104411-0565-11e8-8ffe-87d52fe83b7b',
        appliedForm: this.appliedForm,
        defaultValues: this.defaultValues,
        cancel: this.cancel,
      }),
      $('.photo-form')[0],
    );
  }
  appliedForm(response, actions) {
    var link =
      //      window.location.pathname.split('/gbmembers')[0] +
      '/submissions/' +
      response.submission.values.Photo[0].link.split('/submissions/')[1];
    this.props.memberItem.values['Photo'] = link;
    //    ReactDOM.render(React.createElement(Photo, {memberItem: this.props.memberItem, setUpload: this.setUpload}),$('.photo-form')[0]);
    this.setState(this.state);
    if (this.setIsDirty) this.setIsDirty(true);
  }

  render() {
    return (
      <DocumentTitle title="Photo Upload">
        <div className="photo-form">
          {this.props.memberItem.values['Photo'] === undefined ? (
            <CoreForm
              kapp="gbmembers"
              form="member-photo"
              completed={this.appliedForm}
              values={this.defaultValues}
            />
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
