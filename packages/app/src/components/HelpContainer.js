import { connect } from 'react-redux';
import { compose, lifecycle, withHandlers, withState } from 'recompose';
import { List } from 'immutable';
import { Help } from './Help';

export const mapStateToProps = state => ({
  Help: List(state.app.help.get('data')),
});

const mapDispatchToProps = state => ({});

export const HelpContainer = compose(
  connect(mapStateToProps, mapDispatchToProps),
  withState('isOpen', 'setIsOpen', false),
  withState('viewBy', 'setViewBy', 'all'),
  withState('viewByClicked', 'setViewByClicked', false),
  withState('filterValue', 'setFilterValue', ''),
  withHandlers({
    toggle: props => () => props.setIsOpen(open => !open),
  }),
  lifecycle({
    UNSAFE_componentWillMount() {},
    componentWillUnmount() {
      console.log('HELP Unmount');
    },
    UNSAFE_componentWillReceiveProps(nextProps) {
      var app = 'all';
      if (window.location.hash.includes('/kapps/gbmembers')) {
        app = 'members';
      } else if (window.location.hash.includes('/kapps/services')) {
        app = 'services';
      } else if (window.location.hash.includes('/kapps/registrations')) {
        app = 'waivers';
      } else if (window.location.hash === '#/') {
        app = 'home';
      }
      if (this.props.viewBy !== app && !this.props.viewByClicked) {
        this.props.setViewBy(app);
      }
    },
  }),
)(Help);
