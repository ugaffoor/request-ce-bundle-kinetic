import React from 'react';
import PropTypes from 'prop-types';
import { getJson } from '../Member/MemberUtils';

export class DropDownFormatter extends React.Component {
  static propTypes = {
    options: PropTypes.arrayOf(
      PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.shape({
          id: PropTypes.string,
          title: PropTypes.string,
          //value: PropTypes.string,
          text: PropTypes.string,
        }),
      ]),
    ).isRequired,
    //value: PropTypes.string.isRequired
  };

  shouldComponentUpdate(nextProps: any): boolean {
    return nextProps.value !== this.props.value;
  }

  render(): ?ReactElement {
    if (this.props.multiple) {
      console.log('### Formatter # value = ' + this.props.value);
      let values = getJson(this.props.value);
      let message = this.props.message;
      let options = [];

      if (values) {
        options = this.props.options.filter(function(v) {
          return values.some(program => v === program || v.value === program);
        });
      }

      let titles = options.map(option => option.title);
      let texts = options.map(option => option.text);

      let title = titles.join(' | ');
      let text = texts.join(', ');

      if (text) {
        return <div title={title}>{text}</div>;
      } else {
        return (
          <div style={gridCellDiv} title={message}>
            &nbsp;
            {text}
          </div>
        );
      }
    } else {
      let value = this.props.value;
      let message = this.props.message;
      let option = this.props.options.filter(function(v) {
        return v === value || v.value === value;
      })[0];
      if (!option) {
        option = value;
      }
      let title = option.title || option.value || option;
      let text = option.text || option.value || option;
      if (text) {
        return <div title={title}>{text}</div>;
      } else {
        return (
          <div style={gridCellDiv} title={message}>
            &nbsp;
            {text}
          </div>
        );
      }
    }
  }
}

var gridCellDiv = {
  border: '1px black groove',
  background: '#FF4141',
};
