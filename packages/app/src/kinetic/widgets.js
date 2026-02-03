import React from 'react';
import ReactDOM from 'react-dom';
import { bundle } from '@kineticdata/react';
import Select from 'react-select';

import { SignatureCanvasWrapper } from '../components/SignatureCanvasWrapper';
import { QuillEditorWrapper } from '../components/QuillEditorWrapper';
import { DatepickerWrapper } from '../components/DatepickerWrapper';

/**
 * IMPORTANT:
 * This file must be imported eagerly (index.js)
 * DO NOT lazy-load this file
 */

bundle.config.widgets = {
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
};
