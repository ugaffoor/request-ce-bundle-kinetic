import React from 'react';
import ReactDOM from 'react-dom';
import { bundle } from '@kineticdata/react';
import Select from 'react-select';

import { SignatureCanvasWrapper } from '../components/SignatureCanvasWrapper';
import { QuillEditorWrapper } from '../components/QuillEditorWrapper';
import { DatepickerWrapper } from '../components/DatepickerWrapper';
import { OpenWidgetWrapper } from '../components/OpenWidgetWrapper';

/**
 * IMPORTANT:
 * This file must be imported eagerly (index.js)
 * DO NOT lazy-load this file
 */

/**
 * bundle.config only exists once the Kinetic server has served an
 * authenticated bundle. When the session has expired the server returns an
 * anonymous bundle with no config, and assigning into it throws here -- at
 * module scope, before anything renders, so the app dies with a stack trace
 * instead of showing the login page the user actually needs.
 *
 * Registering widgets is pointless for an anonymous visitor anyway: they get
 * a login screen, and after signing in the page reloads with a real bundle
 * and this runs properly.
 */
if (!bundle.config) {
  console.warn(
    '[widgets] No bundle.config -- not signed in to Kinetic, so form widgets ' +
      'were not registered. They register on the next load after signing in.',
  );
}

const widgetConfig = bundle.config || {};

widgetConfig.widgets = {
  xdsoftDatepickerRemove: ({ element }) => {
    ReactDOM.unmountComponentAtNode(element);
  },
  xdsoftDatepicker: ({
    element,
    parentID,
    value,
    value_format,
    defaultValue,
    displayDateFormat,
    minDate,
    options,
    timepicker,
    datepicker,
    onSelectDate,
    onGenerate,
    inline,
  }) => {
    ReactDOM.render(
      <DatepickerWrapper
        parentID={parentID}
        value={value}
        value_format={value_format}
        defaultValue={defaultValue}
        minDate={minDate}
        displayDateFormat={displayDateFormat}
        options={options}
        inline={inline}
        timepicker={timepicker}
        datepicker={datepicker}
        onGenerate={onGenerate}
        onSelectDate={onSelectDate}
        scrollInput={false}
      />,
      element,
    );
  },
  signatureCanvas: ({
    element,
    initialValue,
    height,
    width,
    ref,
    onChange,
    disable,
  }) => {
    ReactDOM.render(
      <SignatureCanvasWrapper
        initialValue={initialValue}
        onChange={onChange}
        ref={ref}
        height={height}
        width={width}
        disable={disable}
      />,
      element,
    );
  },
  quillEditor: ({ element, editorContent, label, elementName }) => {
    ReactDOM.render(
      <QuillEditorWrapper
        text={editorContent}
        label={label}
        elementName={elementName}
      />,
      element,
    );
  },
  selectMenu: ({ element, value, onChange, options }) => {
    ReactDOM.render(
      <Select
        onChange={onChange}
        options={options}
        closeMenuOnSelect={true}
        hideSelectedOptions={false}
        isMulti={false}
        value={value}
      />,
      element,
    );
  },
  selectMultiMenu: ({ element, value, onChange, options }) => {
    ReactDOM.render(
      <Select
        onChange={onChange}
        options={options}
        closeMenuOnSelect={false}
        hideSelectedOptions={true}
        controlShouldRenderValue={true}
        isMulti={true}
        isClearable
        isSearchable
        value={value}
      />,
      element,
    );
  },
  openWidget: ({ element, organizationId }) => {
    ReactDOM.render(
      <OpenWidgetWrapper organizationId={organizationId} />,
      element,
    );
  },
  openWidgetRemove: ({ element }) => {
    ReactDOM.unmountComponentAtNode(element);
  },
};
