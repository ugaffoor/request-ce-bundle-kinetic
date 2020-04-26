import React from 'react';
import { Link } from 'react-router-dom';
import { bundle } from 'react-kinetic-core';
import { connect } from 'react-redux';
import { compose, lifecycle, withState, withHandlers } from 'recompose';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { PageTitle } from 'common';
import {
  actions,
  buildFormConfigurationObject,
} from '../../../redux/modules/settingsForms';
import { actions as queueActions } from '../../../redux/modules/settingsQueue';
import { I18n } from '../../../../../app/src/I18nProvider';

export const TextInput = ({ value, name, setInputs, inputs, className }) => (
  <input
    className={`form-control ${className}`}
    name={name}
    value={value || ''}
    type="text"
    onChange={event => {
      setInputs({ ...inputs, [name]: event.target.value });
    }}
  />
);
export const NumberInput = ({ value, name, setInputs, inputs, className }) => (
  <input
    className={`form-control ${className}`}
    name={name}
    value={value || ''}
    type="number"
    onChange={event => setInputs({ ...inputs, [name]: event.target.value })}
  />
);
export const Select = ({
  selected,
  name,
  type,
  data,
  setInputs,
  inputs,
  className,
  multiple,
}) => {
  let optionElements = '<option></option>';
  let options;
  if (data) {
    const kappName = type.charAt(0).toUpperCase() + type.slice(1);
    if (type === 'teams') {
      options = data
        .filter(team => !team.name.includes('Role'))
        .map(team => {
          return { value: team.name, label: `${kappName} > ${team.name}` };
        });
    } else if (type === 'notifications') {
      options = data.map(notification => {
        return {
          value: notification.values.Name,
          label: `${kappName} > ${notification.values.Name}`,
        };
      });
    } else if (type === 'subtasks') {
      options = data.forms
        .filter(form => form.type === 'Task' || form.type === 'Subtask')
        .map(form => ({ value: form.slug, label: form.name }));
    } else {
      options = data.kapps
        .find(kapp => kapp.slug === type)
        .forms.map(form => {
          return { value: form.slug, label: `${kappName} > ${form.label}` };
        });
    }
    optionElements = options.map(option => {
      return (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      );
    });
  }
  return (
    <select
      className={`form-control ${className}`}
      name={name}
      value={selected}
      onChange={event => {
        let value = event.target.value;
        if (multiple) {
          const options = event.target.options;
          value = [];
          for (let i = 0, l = options.length; i < l; i++) {
            if (options[i].selected) {
              value.push(options[i].value);
            }
          }
        }
        setInputs({ ...inputs, [name]: value });
      }}
      multiple={multiple}
    >
      <option />
      {optionElements}
    </select>
  );
};

export const FormContainer = ({
  updateFormSettings,
  inputs,
  setInputs,
  loading,
  form,
  kappLoading,
  settingsForms,
  queueSettings: {
    queueSettingsKapp: kapp,
    loading: loadingQueue,
    loadingTeams,
    teams,
    spaceKapps,
  },
  kappSlug,
  notificationsLoading,
  notifications,
  handleColumnOrderChange,
  handleColumnChange,
}) =>
  !loading &&
  !kappLoading &&
  !loadingTeams &&
  !loadingQueue &&
  !notificationsLoading &&
  form && (
    <div className="page-container page-container--panels page-container--datastore">
      <PageTitle parts={['Settings', form.name]} />
      <div className="page-panel page-panel--two-thirds page-panel--scrollable">
        <div className="page-title">
          <div className="page-title__wrapper">
            <h3>
              <Link to={`/kapps/${kappSlug}`}>
                <I18n>queue</I18n>
              </Link>{' '}
              /{` `}
              <Link to={`/kapps/${kappSlug}/settings`}>
                <I18n>settings</I18n>
              </Link>{' '}
              /{` `}
              <Link to={`/kapps/${kappSlug}/settings/forms`}>
                <I18n>forms</I18n>
              </Link>{' '}
              /{` `}
              <Link to={`/kapps/${kappSlug}/settings/forms/${form.slug}`}>
                <I18n context={`kapps.${kappSlug}.forms.${form.slug}`}>
                  {form.name}
                </I18n>
              </Link>{' '}
            </h3>
            <h1>
              <I18n>Form Settings</I18n>
            </h1>
          </div>
          <a
            href={`${bundle.spaceLocation()}/app/#/${kappSlug}/author/form/${
              form.slug
            }/builder`}
            className="btn btn-primary"
            target="_blank"
          >
            <I18n>Form Builder</I18n>{' '}
            <i className="fa fa-fw fa-external-link" />
          </a>
        </div>
        <div className="general-settings">
          <h3 className="section__title">
            <I18n>General Settings</I18n>
          </h3>
          <div className="form settings">
            <div className="form-group">
              <label>
                <I18n>Description</I18n>
              </label>
              <textarea
                className="form-control col-12"
                name="description"
                value={inputs.description}
                type="text"
                onChange={event =>
                  setInputs({
                    ...inputs,
                    description: event.target.value,
                  })
                }
              />
            </div>
            <div className="form-group">
              <label>
                <I18n>Form Type</I18n>
              </label>
              <select
                className="form-control col-6"
                name="type"
                value={inputs.type}
                onChange={event =>
                  setInputs({ ...inputs, type: event.target.value })
                }
              >
                {settingsForms.queueKapp.formTypes.map(type => (
                  <option key={type.name} value={type.name}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>
                <I18n>Form Status</I18n>
              </label>
              <select
                className="form-control col-6"
                name="status"
                value={inputs.status}
                onChange={event =>
                  setInputs({ ...inputs, status: event.target.value })
                }
              >
                <option key="New">New</option>
                <option key="Active">Active</option>
                <option key="Inactive">Inactive</option>
                <option key="Delete">Delete</option>
              </select>
            </div>
          </div>
        </div>
        <div className="table-display-settings">
          <h3 className="section__title">Table Display Settings</h3>
          <div className="form settings">
            <table className="table table-datastore table-draggable">
              <thead>
                <tr className="header">
                  <th>
                    <I18n>Field</I18n>
                  </th>
                  <th>
                    <I18n>Visible in Table</I18n>
                  </th>
                </tr>
              </thead>
              {inputs.columns && (
                <DragDropContext onDragEnd={handleColumnOrderChange}>
                  <Droppable droppableId="columns">
                    {provided => (
                      <tbody ref={provided.innerRef}>
                        {inputs.columns.map((col, index) => (
                          <Draggable
                            key={col.name}
                            draggableId={col.name}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <tr
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`${
                                  snapshot.isDragging ? 'dragging' : ''
                                }`}
                              >
                                <td>
                                  {col.type === 'value' ? (
                                    <I18n>{col.label}</I18n>
                                  ) : (
                                    <i>
                                      <I18n>{col.label}</I18n>{' '}
                                      <small>
                                        <I18n>(system field)</I18n>
                                      </small>
                                    </i>
                                  )}
                                </td>
                                <td>
                                  <input
                                    onChange={e =>
                                      handleColumnChange(
                                        index,
                                        'visible',
                                        e.target.checked,
                                      )
                                    }
                                    type="checkbox"
                                    checked={col.visible}
                                  />
                                </td>
                              </tr>
                            )}
                          </Draggable>
                        ))}
                      </tbody>
                    )}
                  </Droppable>
                </DragDropContext>
              )}
            </table>
          </div>
        </div>
        <div className="attribute-settings">
          <h3 className="section__title">
            <I18n>Attributes</I18n>
          </h3>
          <div className="form settings">
            {inputs['Permitted Subtasks'] && (
              <div className="form-group">
                <label>
                  <I18n>Permitted Subtasks</I18n>
                </label>
                <Select
                  selected={inputs['Permitted Subtasks']}
                  name="Permitted Subtasks"
                  type="subtasks"
                  data={kapp}
                  setInputs={setInputs}
                  inputs={inputs}
                  className="col-8"
                  multiple="true"
                />
              </div>
            )}
            {inputs['Prohibit Subtasks'] && (
              <div className="form-group">
                <label>
                  <I18n>Prohibit Subtasks</I18n>
                </label>
                <I18n
                  render={translate => (
                    <select
                      value={
                        inputs['Prohibit Subtasks'] === 'Yes' ||
                        inputs['Prohibit Subtasks'] === 'True'
                          ? 'Yes'
                          : 'No'
                      }
                      onChange={event =>
                        setInputs({
                          ...inputs,
                          'Prohibit Subtasks': event.target.value,
                        })
                      }
                      className="form-control col-8"
                    >
                      <option value="No">{translate('No')}</option>
                      <option value="Yes">{translate('Yes')}</option>
                    </select>
                  )}
                />
              </div>
            )}
            <div className="form-group">
              <label>
                <I18n>Owning Team</I18n>
              </label>
              <Select
                selected={inputs['Owning Team']}
                name="Owning Team"
                type="teams"
                data={teams}
                setInputs={setInputs}
                inputs={inputs}
                className="col-8"
                multiple="true"
              />
            </div>

            {inputs['Allow Reassignment'] && (
              <div className="form-group">
                <label>
                  <I18n>Allow Reassignment</I18n>
                </label>
                <I18n
                  render={translate => (
                    <select
                      value={
                        inputs['Allow Reassignment'] === 'No' ||
                        inputs['Allow Reassignment'] === 'False'
                          ? 'No'
                          : 'Yes'
                      }
                      onChange={event =>
                        setInputs({
                          ...inputs,
                          'Allow Reassignment': event.target.value,
                        })
                      }
                      className="form-control col-8"
                    >
                      <option value="No">{translate('No')}</option>
                      <option value="Yes">{translate('Yes')}</option>
                    </select>
                  )}
                />
              </div>
            )}

            {inputs['Assignable Teams'] && (
              <div className="form-group">
                <label>
                  <I18n>Assignable Teams</I18n>
                </label>
                <Select
                  selected={inputs['Assignable Teams']}
                  name="Assignable Teams"
                  type="teams"
                  data={teams}
                  setInputs={setInputs}
                  inputs={inputs}
                  className="col-8"
                  multiple="true"
                />
              </div>
            )}

            <div className="form-group">
              <label>
                <I18n>Notification Template Name - Complete</I18n>
              </label>
              <Select
                selected={inputs['Notification Template Name - Complete']}
                name="Notification Template Name - Complete"
                type="notifications"
                data={notifications}
                setInputs={setInputs}
                inputs={inputs}
                className="col-8"
              />
            </div>

            <div className="form-group">
              <label>
                <I18n>Notification Template Name - Create</I18n>
              </label>
              <Select
                selected={inputs['Notification Template Name - Create']}
                name="Notification Template Name - Create"
                type="notifications"
                data={notifications}
                setInputs={setInputs}
                inputs={inputs}
                className="col-8"
              />
            </div>
          </div>
        </div>

        <div className="form__footer">
          <span className="form__footer__right">
            <button
              className="btn btn-primary"
              onClick={() => {
                const newObj = { form, inputs, kappSlug };
                updateFormSettings(newObj);
              }}
            >
              <I18n>Save Changes</I18n>
            </button>
          </span>
        </div>
      </div>
      <div className="page-panel page-panel--one-thirds page-panel--transparent page-panel--sidebar page-panel--datastore-sidebar">
        <h3>
          <I18n>Form Settings</I18n>
        </h3>
        <h4>
          <I18n>General Settings</I18n>
        </h4>
        <p>
          <I18n>
            To update the form fields, click the Form Builder button, which will
            open the form builder in a new window. You will need to reload this
            page after making changes in the form builder.
          </I18n>
        </p>
        <h4>
          <I18n>Table Display Settings</I18n>
        </h4>
        <p>
          <I18n>
            The Display Table Settings section lists all of the fields that
            exist on this form. You may select which fields you'd like to be
            visible in the table when viewing records.
          </I18n>
        </p>
        <h4>
          <I18n>Categories</I18n>
        </h4>
        <p>
          <I18n>
            You can update the categories associated with this form by checking
            them off in the Category Settings area.
          </I18n>
        </p>
      </div>
    </div>
  );

export const setInitialInputs = ({ setInputs, form }) => () => {
  const config = buildFormConfigurationObject(form);
  console.log(form.attributesMap);
  setInputs({
    description: form.description,
    type: form.type,
    status: form.status,
    'Permitted Subtasks': form.attributesMap['Permitted Subtasks']
      ? form.attributesMap['Permitted Subtasks'][0]
        ? form.attributesMap['Permitted Subtasks'][0].split(',')
        : []
      : '',
    'Prohibit Subtasks': form.attributesMap['Prohibit Subtasks']
      ? form.attributesMap['Prohibit Subtasks'][0]
        ? form.attributesMap['Prohibit Subtasks'][0]
        : 'No'
      : '',
    'Owning Team': form.attributesMap['Owning Team']
      ? form.attributesMap['Owning Team']
      : '',
    'Allow Reassignment': form.attributesMap['Allow Reassignment']
      ? form.attributesMap['Allow Reassignment'][0]
        ? form.attributesMap['Allow Reassignment'][0]
        : 'Yes'
      : '',
    'Assignable Teams': form.attributesMap['Assignable Teams']
      ? form.attributesMap['Assignable Teams']
      : '',
    'Notification Template Name - Complete': form.attributesMap[
      'Notification Template Name - Complete'
    ]
      ? form.attributesMap['Notification Template Name - Complete'][0]
      : '',
    'Notification Template Name - Create': form.attributesMap[
      'Notification Template Name - Create'
    ]
      ? form.attributesMap['Notification Template Name - Create'][0]
      : '',
    columns: config.columns,
  });
};

const handleColumnOrderChange = ({ setInputs, inputs }) => ({
  source,
  destination,
}) => {
  if (destination && source.index !== destination.index) {
    const updated = inputs.columns.update(cols => {
      const col = cols.get(source.index);
      return cols.delete(source.index).insert(destination.index, col);
    });
    setInputs({ ...inputs, columns: updated });
  }
};

const handleColumnChange = ({ setInputs, inputs }) => (index, prop, value) => {
  const updated = inputs.columns.setIn([index, prop], value);
  setInputs({ ...inputs, columns: updated });
};

const mapStateToProps = (state, { match: { params } }) => ({
  form: state.queue.settingsForms.currentForm,
  formChanges: state.queue.settingsForms.currentFormChanges,
  loading: state.queue.settingsForms.loading,
  kappLoading: state.queue.settingsForms.kappLoading,
  notificationsLoading: state.queue.settingsForms.notificationsLoading,
  notifications: state.queue.settingsForms.notifications,
  settingsForms: state.queue.settingsForms,
  queueSettings: state.queue.queueSettings,
  kappSlug: state.app.config.kappSlug,
});

const mapDispatchToProps = {
  updateFormSettings: actions.updateForm,
  fetchFormSettings: actions.fetchForm,
  fetchKapp: actions.fetchKapp,
  fetchNotifications: actions.fetchNotifications,
  fetchQueueSettings: queueActions.fetchQueueSettings,
  fetchQueueSettingsTeams: queueActions.fetchQueueSettingsTeams,
  fetchQueueSettingsSpace: queueActions.fetchQueueSettingsSpace,
};

export const FormSettings = compose(
  connect(mapStateToProps, mapDispatchToProps),
  withState('inputs', 'setInputs', {}),
  withHandlers({
    setInitialInputs,
    handleColumnOrderChange,
    handleColumnChange,
  }),
  lifecycle({
    componentWillMount() {
      this.props.fetchFormSettings({
        formSlug: this.props.match.params.id,
        kappSlug: this.props.kappSlug,
      });
      this.props.fetchKapp(this.props.kappSlug);
      this.props.fetchNotifications();
      this.props.fetchQueueSettings();
      this.props.fetchQueueSettingsTeams();
      this.props.fetchQueueSettingsSpace();
    },
    componentWillReceiveProps(nextProps) {
      nextProps.loading === false &&
        nextProps.form !== this.props.form &&
        nextProps.setInitialInputs();
    },
  }),
)(FormContainer);
