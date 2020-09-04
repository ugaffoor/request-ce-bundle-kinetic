import React from 'react';
import createClass from 'create-react-class';
import components from 'react-select';

export const OptionClass = createClass({
  render() {
    return (
      <div>
        <components.Option {...this.props}>
          <input
            type="checkbox"
            checked={this.props.isSelected}
            value={this.props.value}
            onChange={e => console.log()}
          />{' '}
          <label>{this.props.label}</label>
        </components.Option>
      </div>
    );
  },
});

export const MultiValue = props => {
  return (
    <components.MultiValue {...props}>
      <span>{props.data.label}</span>
    </components.MultiValue>
  );
};
