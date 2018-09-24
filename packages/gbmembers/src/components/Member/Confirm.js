import InputDialog from './InputDialog';
import { createConfirmation } from 'react-confirm';
import $ from 'jquery';

export const confirmWithInput = createConfirmation(
  InputDialog,
  100,
  $('#mainContent')[0],
);
