import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { store } from '../../../app/src';

export default (content, container) =>
  ReactDOM.render(<Provider store={store}>{content}</Provider>, container);
