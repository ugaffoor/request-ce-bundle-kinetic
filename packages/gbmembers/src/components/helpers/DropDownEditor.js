import React from 'react';
import PropTypes from 'prop-types';
import $ from 'jquery';
import ReactDOM from 'react-dom';
import { getJson } from '../Member/MemberUtils';
import '../../styles/react_data_grid.scss';
import './jquery.multiselect.css';
<script src="./jquery.multiselect.js" />;

const {
  editors: { EditorBase },
} = require('react-data-grid');
export class DropDownEditor extends EditorBase {
  componentDidMount() {
    if (this.props.multiple) {
      $(this.refs.dataGridProgramSelect).multiselect({
        texts: { placeholder: 'Select Program' },
      });
    }
    //this.getInputNode().multiselect();
  }

  getInputNode() {
    return ReactDOM.findDOMNode(this);
  }

  onClick() {
    this.getInputNode().focus();
  }

  onDoubleClick() {
    this.getInputNode().focus();
  }

  getValue(): any {
    let value;
    if (this.props.multiple) {
      value = [...this.getInputNode().options]
        .filter(option => option.selected)
        .map(option => option.value);
    } else {
      value = this.getInputNode().value;
    }
    let updated = {};
    updated[this.props.column.key] = value;
    return updated;
  }

  render(): ?ReactElement {
    let isMultiple = this.props.multiple ? true : false;
    let defaultValue = this.props.multiple
      ? getJson(this.props.value)
      : this.props.value;
    return (
      <select
        ref="dataGridProgramSelect"
        id="dataGridProgramSelect"
        style={this.getStyle()}
        style={{ height: 'auto' }}
        defaultValue={defaultValue}
        multiple={isMultiple}
        onBlur={this.props.onBlur}
        onChange={this.onChange}
      >
        {this.renderOptions()}
      </select>
    );
  }

  renderOptions(): Array<ReactElement> {
    let options = [];
    this.props.options.forEach(function(name) {
      if (typeof name === 'string') {
        options.push(
          <option key={name} value={name}>
            {name}
          </option>,
        );
      } else {
        options.push(
          <option key={name.id} value={name.value} title={name.title}>
            {name.text || name.value}
          </option>,
        );
      }
    }, this);
    return options;
  }
}

DropDownEditor.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        id: PropTypes.string,
        title: PropTypes.string,
        value: PropTypes.string,
        text: PropTypes.string,
      }),
    ]),
  ).isRequired,
};
