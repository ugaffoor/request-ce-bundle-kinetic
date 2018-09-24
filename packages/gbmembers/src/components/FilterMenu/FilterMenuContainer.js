import { connect } from 'react-redux';
import { compose, withHandlers } from 'recompose';
import { is, List } from 'immutable';
import { push } from 'connected-react-router';
import { FilterMenu } from './FilterMenu';
import { actions } from '../../redux/modules/filterMenu';
import { actions as appActions } from '../../redux/modules/memberApp';

const selectAppliedAssignments = state => {
  if (state.member.filterMenu.get('currentFilter')) {
    const assignments = state.member.filterMenu.get('currentFilter')
      .assignments;

    return List([
      assignments.mine && 'Mine',
      assignments.teammates && 'Teammates',
      assignments.unassigned && 'Unassigned',
    ]).filter(assignmentType => !!assignmentType);
  }
  return List([]);
};

export const mapStateToProps = state => ({
  teams: state.member.app.myTeams,
  isOpen: state.member.filterMenu.get('isOpen'),
  activeSection: state.member.filterMenu.get('activeSection'),
  currentFilter: state.member.filterMenu.get('currentFilter'),
  isDirty: !is(
    state.member.filterMenu.get('currentFilter'),
    state.member.filterMenu.get('initialFilter'),
  ),
  filterName: state.member.filterMenu.get('filterName'),
  appliedAssignments: selectAppliedAssignments(state),
});

export const mapDispatchToProps = {
  close: actions.close,
  reset: actions.reset,
  setFilterName: actions.setFilterName,
  showSection: actions.showSection,
  addPersonalFilter: appActions.addPersonalFilter,
  updatePersonalFilter: appActions.updatePersonalFilter,
  removePersonalFilter: appActions.removePersonalFilter,
  push,
};

export const FilterMenuContainer = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  withHandlers({
    applyFilterHandler: props => () => {
      props.setAdhocFilter(
        props.currentFilter.set('name', '').set('type', 'adhoc'),
      );
      props.push('/custom');
      props.close();
    },
    handleSaveFilter: ({
      addPersonalFilter,
      updatePersonalFilter,
      fetchList,
      currentFilter,
      filterName,
      push,
      close,
    }) => () => {
      if (
        currentFilter.type === 'custom' &&
        currentFilter.name === filterName
      ) {
        // Update Personal Filter
        updatePersonalFilter(currentFilter);
        fetchList(currentFilter);
      } else {
        addPersonalFilter(
          currentFilter.set('name', filterName).set('type', 'custom'),
        );
        push(`/custom/${filterName}`);
      }

      close();
    },
    handleChangeFilterName: ({ setFilterName }) => e =>
      setFilterName(e.target.value),
  }),
)(FilterMenu);
