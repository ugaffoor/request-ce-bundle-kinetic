import { connect } from 'react-redux';
import { compose, lifecycle, withHandlers, withState } from 'recompose';
import { selectCurrentKapp } from 'common';
import { Catalog } from './Catalog';
import { actions } from '../../redux/modules/registrations';

const mapStateToProps = state => ({
  kapp: selectCurrentKapp(state),
  registrations: state.registrations.registrations.data,
  registrationsLoading: state.registrations.registrations.registrationsLoading,
  allLeads: state.registrations.registrations.allLeads,
});

const mapDispatchToProps = {
  fetchRegistrations: actions.fetchRegistrations,
  fetchLeads: actions.fetchLeads,
};

export const CatalogContainer = compose(
  connect(mapStateToProps, mapDispatchToProps),
  lifecycle({
    UNSAFE_componentWillMount() {
      this.props.fetchLeads();
      this.props.fetchRegistrations();
    },
    UNSAFE_componentWillUpdate(nextProps) {
      if (this.props.coreState !== nextProps.coreState) {
        this.props.fetchLeads();
        this.props.fetchRegistrations();
      }
    },
  }),
  withState('selectedLead', 'setSelectedLead', null),
  withHandlers({
    getAllLeads: ({ allLeads }) => () => {
      let leadsVals = [];
      allLeads.forEach(lead => {
        leadsVals.push({
          label: lead.values['Last Name'] + ' ' + lead.values['First Name'],
          value: lead.id,
        });
      });
      return leadsVals;
    },
    selectLead: ({ fetchRegistrations, allLeads }) => (
      leadID,
      setSelectedLead,
    ) => {
      fetchRegistrations({ leadID: leadID, allLeads: allLeads });
    },
  }),
)(Catalog);
