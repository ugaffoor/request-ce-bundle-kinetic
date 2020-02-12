import React, { Fragment, Component } from 'react';
import { connect } from 'react-redux';
import { compose, withHandlers, withState, lifecycle } from 'recompose';
import { Link } from 'react-router-dom';
import { Map, Seq } from 'immutable';
import { push } from 'connected-react-router';
import { toastActions, PageTitle } from 'common';
import { actions } from '../../../redux/modules/settingsNotifications';
import { NotificationMenu } from './NotificationMenu';
import ReactQuill, { Quill } from 'react-quill';
import ImageResize from 'quill-image-resize-module-react';

Quill.register('modules/imageResize', ImageResize);
var Block = Quill.import('blots/block');
Block.tagName = 'DIV';
Quill.register(Block, true);

var Size = Quill.import('attributors/style/size');
Size.whitelist = ['10px', '18px', '32px', '64px'];
Quill.register(Size, true);

const fields = {
  Name: {
    required: true,
  },
  Status: {
    required: true,
  },
  Subject: {
    required: values => values.get('Type') === 'Template',
    visible: values => values.get('Type') === 'Template',
  },
  'HTML Content': {
    required: values => values.get('Type') === 'Template',
  },
  'Text Content': {
    required: values => values.get('Type') === 'Template',
  },
  Type: {
    required: true,
  },
};

const evaluate = (condition, values) =>
  typeof condition === 'boolean'
    ? condition
    : typeof condition === 'function'
    ? condition(values)
    : false;

const isRequired = (name, values) => evaluate(fields[name].required, values);

const isVisible = (name, values) => evaluate(fields[name].visible, values);

const isValid = values =>
  !Object.entries(fields).some(
    ([name, _]) => isRequired(name, values) && !values.get(name),
  );
function imageHandler() {
  var range = quillRef.getSelection();
  var value = prompt('What is the image URL');
  if (value) {
    quillRef.insertEmbed(range.index, 'image', value, Quill.sources.USER);
  }
}

export class HTMLContent extends Component {
  constructor(props) {
    super(props);
    this.setDirty = this.props.setDirty;
    this.values = null;
    this.setValues = this.props.setValues;
    this.setValues.bind(this);
    this.setCursorPosition = this.props.setCursorPosition;
    this.setCursorPosition.bind(this);
    this.setSelection = this.props.setSelection;
    this.setSelection.bind(this);
    this.setQuillRef = this.props.setQuillRef;
    this.setQuillRef.bind(this);
    this.reactQuillRef = null;
    this.attachQuillRefs = this.attachQuillRefs.bind(this);
  }
  componentDidMount() {
    this.attachQuillRefs(this);
  }
  componentWillReceiveProps(nextProps) {
    if (this.values === null) {
      console.log('HTMLContent componentWillReceiveProps');
      this.values = nextProps.values;
    }
  }
  modules = {
    toolbar: {
      container: [
        ['bold', 'italic', 'underline', 'strike'], // toggled buttons
        ['blockquote', 'code-block'],

        [{ size: ['10px', '18px', '32px', '64px'] }],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ indent: '-1' }, { indent: '+1' }], // outdent/indent

        [{ align: [] }],
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        [{ color: [] }, { background: [] }], // dropdown with defaults from theme
        [{ font: [] }],
        ['link'],
        ['image'],
        ['clean'],
      ],
      handlers: {
        image: imageHandler,
      },
    },
    imageResize: {
      parchment: Quill.import('parchment'),
    },
  };
  formats = [
    'header',
    'bold',
    'italic',
    'underline',
    'strike',
    'blockquote',
    'list',
    'bullet',
    'indent',
    'link',
    'image',
    'color',
    'width',
    'height',
    'table',
    'td',
    'tr',
    'width',
    'height',
    'align',
    'text-align',
    'size',
  ];
  attachQuillRefs = props => variable => {
    const quillRef = this.reactQuillRef ? this.reactQuillRef.getEditor() : null;
    if (quillRef != null) this.quillRef = quillRef;
  };
  handleHTMLChange(event) {
    console.log('in handleHTMLChange');
    if (this.values !== null) {
      this.setValues(this.values.set('HTML Content', event));
      console.log('in handleHTMLChange');
    }
  }

  handleHTMLBlur(event) {
    console.log('in handleHTMLBlur');
    const name = 'HTML Content';
    const start = event.index;
    const end = event.index + event.length;
    this.setCursorPosition({ name, start, end });
    this.setSelection(this.values.get(name).substring(start, end));

    //          this.setDirty(true);
    //        this.setValues(this.values.set("HTML Content", this.reactQuillRef.editingArea.innerHTML));
  }
  render() {
    return (
      <ReactQuill
        ref={el => {
          this.reactQuillRef = el;
          if (el !== null) this.setQuillRef(el.getEditor());
        }}
        value={this.props.values.get('HTML Content')}
        onChange={this.handleHTMLChange}
        modules={this.modules}
        formats={this.formats}
        onBlur={this.handleHTMLBlur}
        setDirty={this.setDirty}
        values={this.values}
        setValues={this.setValues}
        setCursorPosition={this.setCursorPosition}
        setSelection={this.setSelection}
        reactQuillRef={this.reactQuillRef}
      />
    );
  }
}

const NotificationComponent = ({
  loading,
  submission,
  type,
  title,
  dirty,
  setDirty,
  values,
  setValues,
  selection,
  handleFieldChange,
  handleFieldBlur,
  handleHTMLChange,
  handleHTMLBlur,
  handleSubmit,
  handleVariableSelection,
  quillRef,
  setCursorPosition,
  setSelection,
  setQuillRef,
}) => (
  <div className="page-container page-container--notifications">
    <PageTitle
      parts={[
        submission ? submission.label : `New ${title}`,
        'Notifications',
        'Settings',
      ]}
    />
    <div className="page-panel page-panel--scrollable">
      <div className="page-title">
        <div className="page-title__wrapper">
          <h3>
            <Link to="/">home</Link> /{` `}
            <Link to="/settings">settings</Link> /{` `}
            <Link to={`/settings/notifications/${type}`}>
              notification {type}
            </Link>
            {` `}/
          </h3>
          {!loading && (
            <h1>{submission ? submission.label : `New ${title}`}</h1>
          )}
        </div>
      </div>
      {!loading && values && (
        <form onSubmit={handleSubmit}>
          <Fragment>
            <NotificationMenu
              selection={selection}
              onSelect={handleVariableSelection}
              quillRef={quillRef}
            />
          </Fragment>
          <div className="form-group required">
            <label className="field-label" htmlFor="name">
              Name
            </label>
            <input
              type="text"
              id="name"
              name="Name"
              onChange={handleFieldChange}
              onBlur={handleFieldBlur}
              value={values.get('Name')}
            />
          </div>

          <div className="radio required">
            <label className="field-label">Status</label>
            <label>
              <input
                type="radio"
                name="Status"
                value="Active"
                onChange={handleFieldChange}
                onBlur={handleFieldBlur}
                checked={values.get('Status') === 'Active'}
              />
              Active
            </label>
            <label>
              <input
                type="radio"
                name="Status"
                value="Inactive"
                onChange={handleFieldChange}
                onBlur={handleFieldBlur}
                checked={values.get('Status') === 'Inactive'}
              />
              Inactive
            </label>
          </div>
          {isVisible('Subject', values) && (
            <div className="form-group required">
              <label className="field-label" htmlFor="subject">
                Subject
              </label>
              <textarea
                id="subject"
                name="Subject"
                rows="2"
                onChange={handleFieldChange}
                onBlur={handleFieldBlur}
                value={values.get('Subject')}
              />
            </div>
          )}
          <div className="form-group required">
            <label className="field-label" htmlFor="htmlContent">
              HTML Content
            </label>
            <HTMLContent
              values={values}
              quillRef={quillRef}
              setDirty={setDirty}
              setValues={setValues}
              setCursorPosition={setCursorPosition}
              setSelection={setSelection}
              setQuillRef={setQuillRef}
            />
          </div>
          <div
            className={`form-group ${
              isRequired('Text Content', values) ? 'required' : ''
            }`}
          >
            <label className="field-label" htmlFor="textContent">
              Text Content
            </label>
            <textarea
              id="textContent"
              name="Text Content"
              rows="8"
              onChange={handleFieldChange}
              onBlur={handleFieldBlur}
              value={values.get('Text Content')}
            />
          </div>
          <div className="form__footer">
            <div className="form_footer__right">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!isValid(values)}
              >
                Save
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  </div>
);

export const handleSubmit = props => event => {
  event.preventDefault();
  props.saveNotification(
    props.values.toJS(),
    props.submission && props.submission.id,
    submission => {
      const action = props.submission ? 'Updated' : 'Created';
      props.push(`/settings/notifications/${props.type}`);
      props.addSuccess(
        `Successfully ${action.toLowerCase()} ${props.title.toLowerCase()} (${
          submission.handle
        })`,
        `${action} ${props.title}`,
      );
    },
  );
};

export const handleFieldChange = props => event => {
  props.setDirty(true);
  props.setValues(props.values.set(event.target.name, event.target.value));
};

export const handleFieldBlur = props => event => {
  const { name, selectionStart: start, selectionEnd: end } = event.target;
  if (['Subject', 'HTML Content', 'Text Content'].includes(name)) {
    props.setCursorPosition({ name, start, end });
    props.setSelection(props.values.get(name).substring(start, end));
  } else {
    props.setCursorPosition(null);
    props.setSelection(null);
  }
};

export const handleVariableSelection = props => variable => {
  if (props.cursorPosition) {
    const { name, start, end } = props.cursorPosition;
    if (name === 'HTML Content') {
      console.log('quillRef:' + quillRef);
      quillRef.editor.insertText(start, variable);
      var text = quillRef.getContents();
      props.setValues(props.values.set(name, text));
    } else {
      const value = props.values.get(name);
      const newValue = Seq(value || [])
        .take(start)
        .concat(Seq(variable))
        .concat(Seq(value || []).skip(end))
        .join('');
      props.setValues(props.values.set(name, newValue));
    }
  }
};

var quillRef = null;

const setQuillRef = props => ref => {
  quillRef = ref;
};
export const mapStateToProps = (state, props) => ({
  submission: state.space.settingsNotifications.notification,
  type: props.match.params.type,
  title: props.match.params.type === 'templates' ? 'Template' : 'Snippet',
  loading: state.space.settingsNotifications.notificationLoading,
  saving: state.space.settingsNotifications.saving,
});

export const mapDispatchToProps = {
  fetchNotification: actions.fetchNotification,
  resetNotification: actions.resetNotification,
  saveNotification: actions.saveNotification,
  fetchVariables: actions.fetchVariables,
  addSuccess: toastActions.addSuccess,
  push,
};

export const Notification = compose(
  connect(mapStateToProps, mapDispatchToProps),
  withState('dirty', 'setDirty', false),
  withState('values', 'setValues', props =>
    Map(Object.keys(fields).map(field => [field, ''])).set('Type', props.title),
  ),
  withState('cursorPosition', 'setCursorPosition', null),
  withState('selection', 'setSelection', null),
  withHandlers({
    handleSubmit,
    handleFieldChange,
    handleFieldBlur,
    handleVariableSelection,
    setQuillRef,
  }),
  lifecycle({
    componentWillMount() {
      this.props.fetchNotification(this.props.match.params.id);
    },
    componentWillReceiveProps(nextProps) {
      if (this.props.match.params.id !== nextProps.match.params.id) {
        this.props.fetchNotification(nextProps.match.params.id);
      }
      if (this.props.submission !== nextProps.submission) {
        this.props.setValues(
          Object.keys(fields).reduce(
            (values, field) =>
              values.set(field, nextProps.submission.values[field] || ''),
            Map(),
          ),
        );
        this.props.setDirty(false);
      }
    },
    componentWillUnmount() {
      this.props.resetNotification();
    },
  }),
)(NotificationComponent);
