import { compose, withHandlers, withProps, withState } from 'recompose';
import { List } from 'immutable';
import { Inbox } from './Inbox';

/**
 * There is no message source yet, so the list is always empty and the
 * dropdown renders its empty state. Replace `withProps` with a `connect`
 * to the relevant redux module when messaging is implemented.
 */
export const InboxContainer = compose(
  withProps({ messages: List() }),
  withState('isOpen', 'setIsOpen', false),
  withHandlers({
    toggle: props => () => props.setIsOpen(open => !open),
  }),
)(Inbox);
