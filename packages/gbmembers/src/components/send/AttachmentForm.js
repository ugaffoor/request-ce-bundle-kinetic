import React, { Component } from 'react';
import { CoreForm } from '@kineticdata/react';
import DocumentTitle from 'react-document-title';
import $ from 'jquery';
import ReactDOM from 'react-dom';

class UploadAttachment extends React.Component {
  render() {
    return (
      <span>
        <CoreForm
          kapp="gbmembers"
          form="email-attachment"
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
class Attachment extends React.Component {
  render() {
    let attachments =
      typeof this.props.campaignItem.values['Attachments'] === 'object'
        ? this.props.campaignItem.values['Attachments']
        : JSON.parse(this.props.campaignItem.values['Attachments']);
    let list = [];
    attachments.forEach((attachment, index) => {
      list.push(
        <tr key={index} style={{ cursor: 'pointer' }}>
          <td onClick={e => this.props.setUpload()}>
            {attachment.substring(attachment.lastIndexOf('/') + 1)}
          </td>
        </tr>,
      );
    });
    return (
      <table>
        <tbody>{list}</tbody>
      </table>
    );
  }
}

const util = require('util');

export class AttachmentForm extends Component {
  constructor(props) {
    super(props);
    this.state = { editing: false };
    this.appliedForm = this.appliedForm.bind(this);
    this.setUpload = this.setUpload.bind(this);
    this.cancel = this.cancel.bind(this);
    this.defaultValues = {
      originatingID: this.props.campaignItem.id,
    };
    if (this.props.setIsDirty) this.setIsDirty = this.props.setIsDirty;
  }
  cancel() {
    ReactDOM.render(
      React.createElement(Attachment, {
        campaignItem: this.props.campaignItem,
        setUpload: this.setUpload,
      }),
      $('.attachment-form')[0],
    );
  }
  setUpload() {
    ReactDOM.render(
      React.createElement(UploadAttachment, {
        submissionId: '0f104411-0565-11e8-8ffe-87d52fe83b7b',
        appliedForm: this.appliedForm,
        defaultValues: this.defaultValues,
        cancel: this.cancel,
      }),
      $('.attachment-form')[0],
    );
  }
  appliedForm(response, actions) {
    let attachments = [];
    response.submission.values.Attachments.forEach(attachment => {
      attachments.push(
        window.location.pathname.split('/gbmembers')[0] +
          '/submissions/' +
          attachment.link.split('/submissions/')[1],
      );
    });

    this.props.campaignItem.values['Attachments'] = attachments;
    this.setState(this.state);
    if (this.setIsDirty) this.setIsDirty(true);
  }

  render() {
    return (
      <DocumentTitle title="Attachment Upload">
        <div className="attachment-form">
          {this.props.campaignItem.values['Attachments'] === undefined ? (
            <CoreForm
              kapp="gbmembers"
              form="email-attachment"
              completed={this.appliedForm}
              values={this.defaultValues}
            />
          ) : (
            <Attachment
              campaignItem={this.props.campaignItem}
              setUpload={this.setUpload}
            />
          )}
        </div>
      </DocumentTitle>
    );
  }
}
