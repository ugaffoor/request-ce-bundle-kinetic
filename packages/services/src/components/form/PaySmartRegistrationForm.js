import React, { Fragment, Component } from 'react';
import { CoreForm } from 'react-kinetic-core';
import {
  KappLink as Link,
  ErrorNotFound,
  ErrorUnauthorized,
  ErrorUnexpected,
  PageTitle,
} from 'common';
import Select from 'react-select';

// Asynchronously import the global dependencies that are used in the embedded
// forms. Note that we deliberately do this as a const so that it should start
// immediately without making the application wait but it will likely be ready
// before users nagivate to the actual forms.
const globals = import('common/globals');

export const PaySmartRegistrationForm = ({
  form,
  category,
  submissionId,
  match,
  handleCreated,
  handleCompleted,
  handleLoaded,
  handleDelete,
  values,
  kappSlug,
  members,
  setSlectedMemberId,
}) => (
  <PaySmartForm
    form={form}
    category={category}
    submissionId={submissionId}
    match={match}
    handleCreated={handleCreated}
    handleCompleted={handleCompleted}
    handleLoaded={handleLoaded}
    handleDelete={handleDelete}
    values={values}
    kappSlug={kappSlug}
    members={members}
    setSlectedMemberId={setSlectedMemberId}
  />
);

class PaySmartForm extends Component {
  constructor(props) {
    super(props);
    this.getOptions = this.getOptions.bind(this);
    this.state = {
      selectedOption: null,
      options: this.getOptions(this.props.members),
    };
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.members.size !== this.props.members.size) {
      this.setState({
        options: this.getOptions(nextProps.members),
      });
    }
  }

  handleChange = selectedOption => {
    this.props.setSlectedMemberId(selectedOption ? selectedOption.value : null);
    this.setState({ selectedOption });
  };

  getOptions(members) {
    let options = [];
    if (!members || members.size <= 0) {
      return options;
    } else {
      members.forEach(member => {
        options.push({
          value: member.values['Member ID'],
          label: member.values['First Name'] + ' ' + member.values['Last Name'],
        });
      });
      return options;
    }
  }

  render() {
    const { selectedOption } = this.state;
    return (
      <div>
        {!this.props.submissionId && (
          <div className="row">
            <div className="col-md-12" style={{ margin: '10px' }}>
              <label htmlFor="memberList">Select Member</label>
              <Select
                value={selectedOption}
                onChange={this.handleChange}
                options={this.state.options}
                isClearable={true}
                className="member-dropdown"
              />
            </div>
          </div>
        )}
        <div className="row">
          <div className="col-md-12">
            {(this.props.submissionId || selectedOption) && (
              <Fragment>
                <PageTitle
                  parts={[this.props.form ? this.props.form.name : '']}
                />
                <span className="services-color-bar services-color-bar__blue-slate" />
                <div className="page-container page-container--services-form">
                  <div className="page-title">
                    <div className="page-title__wrapper">
                      <h3>
                        <Link to="/">services</Link> /{' '}
                        {this.props.match.url.startsWith('/request') && (
                          <Link to="/requests">requests</Link>
                        )}
                        {this.props.match.url.startsWith('/request') && ' / '}
                        {this.props.match.url.startsWith('/request') &&
                          this.props.match.params.type && (
                            <Link
                              to={`/requests/${this.props.match.params.type ||
                                ''}`}
                            >
                              {this.props.match.params.type}
                            </Link>
                          )}
                        {this.props.match.url.startsWith('/request') &&
                          this.props.match.params.type &&
                          ' / '}
                        {this.props.category && (
                          <Link to="/categories">categories</Link>
                        )}
                        {this.props.category && ' / '}
                        {this.props.category && (
                          <Link to={`/categories/${this.props.category.slug}`}>
                            {this.props.category.name}
                          </Link>
                        )}
                        {this.props.category && ' / '}
                      </h3>
                      {this.props.form && <h1>{this.props.form.name}</h1>}
                    </div>
                    {this.props.submissionId && (
                      <button
                        type="button"
                        onClick={this.props.handleDelete}
                        className="btn btn-outline-danger"
                      >
                        Cancel Request
                      </button>
                    )}
                  </div>
                  <div className="form-description">
                    {this.props.form && <p>{this.props.form.description}</p>}
                  </div>
                  <div className="embedded-core-form--wrapper">
                    {this.props.submissionId ? (
                      <CoreForm
                        submission={this.props.submissionId}
                        globals={globals}
                        loaded={this.props.handleLoaded}
                        completed={this.props.handleCompleted}
                      />
                    ) : (
                      <CoreForm
                        kapp={this.props.kappSlug}
                        form={this.props.form.slug}
                        globals={globals}
                        loaded={this.props.handleLoaded}
                        created={this.props.handleCreated}
                        completed={this.props.handleCompleted}
                        values={this.props.values}
                        notFoundComponent={ErrorNotFound}
                        unauthorizedComponent={ErrorUnauthorized}
                        unexpectedErrorComponent={ErrorUnexpected}
                        selectedOption={selectedOption}
                      />
                    )}
                  </div>
                </div>
              </Fragment>
            )}
          </div>
        </div>
      </div>
    );
  }
}
