import React from 'react';
import {
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from 'reactstrap';
import { CoreForm } from '@kineticdata/react';
import classNames from 'classnames';
import ReactToPrint from 'react-to-print';
import { ReactComponent as PrinterIcon } from '../../../../gbmembers/src/images/Print.svg';
import { withState, withHandlers, compose } from 'recompose';

const globals = import('common/globals');

export const NavigationControlsComponent = ({
  handleNextPage,
  handlePreviousPage,
  dropdownOpen,
  handleToggle,
  displayPages,
  handlePageChange,
  currentLoc,
}) => (
  <div className="btn-group">
    <button
      type="button"
      className="btn btn-inverse"
      onClick={handlePreviousPage}
      value={currentLoc}
      disabled={currentLoc <= 0}
    >
      <span className="icon">
        <span className="fa fa-fw fa-caret-left" />
      </span>
    </button>
    <div className="navigation-dropdown">
      <Dropdown isOpen={dropdownOpen} toggle={handleToggle}>
        <DropdownToggle caret>{`Page ${currentLoc + 1} `}</DropdownToggle>
        <DropdownMenu>
          {displayPages.map((pageName, idx) => {
            const str = `${idx + 1}. ${pageName}`;
            return (
              <DropdownItem
                key={pageName}
                value={idx}
                onClick={handlePageChange}
              >
                {str.length > 13 ? `${str.slice(0, 13).trim()}...` : str}
              </DropdownItem>
            );
          })}
        </DropdownMenu>
      </Dropdown>
    </div>
    <button
      type="button"
      className="btn btn-inverse"
      onClick={handleNextPage}
      value={currentLoc}
      disabled={currentLoc >= displayPages.length - 1}
    >
      <span className="icon">
        <span className="fa fa-fw fa-caret-right" />
      </span>
    </button>
  </div>
);

const setState = (props, loc) => {
  props.setReviewPage(props.displayPages[loc]);
  props.setCurrentLoc(loc);
  props.setFormLoaded(false);
};

const handlePreviousPage = props => event => {
  const loc = parseInt(event.currentTarget.value, 10) - 1;
  setState(props, loc);
};

const handleNextPage = props => event => {
  const loc = parseInt(event.currentTarget.value, 10) + 1;
  setState(props, loc);
};

const handlePageChange = props => event => {
  const loc = parseInt(event.currentTarget.value, 10);
  setState(props, loc);
};

const handleToggle = props => () => {
  props.setDropdownOpen(!props.dropdownOpen);
};

const NavigationControls = compose(
  withState('dropdownOpen', 'setDropdownOpen', false),
  withHandlers({
    handlePreviousPage,
    handleNextPage,
    handleToggle,
    handlePageChange,
  }),
)(NavigationControlsComponent);
var compThis;

export class ReviewRequest extends React.Component {
  constructor(props) {
    super(props);
    compThis = this;
    this.componentRef = React.createRef();
    this.componentRef2 = React.createRef();

    this.setFormLoaded = this.setFormLoaded.bind(this);
    this.setDisplayTop = this.setDisplayTop.bind(this);
    this.setDisplayPages = this.setDisplayPages.bind(this);
    this.setMultiPageForm = this.setMultiPageForm.bind(this);
    this.setCurrentLoc = this.setCurrentLoc.bind(this);
    this.setReviewPage = this.setReviewPage.bind(this);

    this.formLoaded = false;
    this.displayTop = false;
    this.displayPages = null;
    this.currentLoc = 0;
    this.reviewPage = true;

    this.state = {
      multiPageForm: false,
    };
  }

  setFormLoaded(value) {
    this.formLoaded = value;
  }
  setDisplayTop(value) {
    this.displayTop = value;
  }
  setDisplayPages(value) {
    this.displayPages = value;
  }
  setMultiPageForm(value) {
    this.setState({
      multiPageForm: value,
    });
  }
  setCurrentLoc(value) {
    this.currentLoc = value;
  }
  setReviewPage(value) {
    this.reviewPage = value;
    this.setState({
      multiPageForm: this.state.multiPageForm,
    });
  }

  handleLoaded(form) {
    if (!compThis.displayPages) {
      compThis.setDisplayPages(form.displayablePages());
      compThis.setDisplayTop(true);
      if (form.displayablePages().length > 1) {
        compThis.setMultiPageForm(true);
      }
      const currentLoc = form
        .displayablePages()
        .findIndex(currentPage => currentPage === form.page().name());
      compThis.setCurrentLoc(currentLoc);
    }

    compThis.setFormLoaded(true);

    compThis.setState({
      dummy: true,
    });
  }
  render() {
    return this.state.multiPageForm ? (
      <div className="multi-page--service">
        {this.displayTop && (
          <div className="page-display--top">
            <h3>{this.displayPages[this.currentLoc]}</h3>
            <NavigationControls
              {...{
                setFormLoaded: this.setFormLoaded,
                setCurrentLoc: this.setCurrentLoc,
                setReviewPage: this.setReviewPage,
                currentLoc: this.currentLoc,
                displayPages: this.displayPages,
              }}
            />
          </div>
        )}
        <div className="form-wrapper--review">
          <div
            className={classNames({
              hidden: !this.formLoaded,
            })}
          >
            <ReactToPrint
              trigger={() => (
                <PrinterIcon className="icon icon-svg barcodePrint" />
              )}
              content={() => this.componentRef.current}
              onBeforePrint={() => new Promise(r => setTimeout(r, 1000))}
            />
            <div ref={this.componentRef}>
              <CoreForm
                loaded={this.handleLoaded}
                submission={this.props.submission.id}
                review={this.reviewPage}
                globals={globals}
              />
            </div>
          </div>
          <div
            className={classNames('load-wrapper', {
              hidden: this.formLoaded,
            })}
          >
            <span className="fa fa-spinner fa-spin fa-lg fa-fw" />
          </div>
        </div>
        {this.formLoaded && (
          <div className="page-display--bottom">
            <NavigationControls
              {...{
                setFormLoaded: this.setFormLoaded,
                setCurrentLoc: this.setCurrentLoc,
                setReviewPage: this.setReviewPage,
                currentLoc: this.currentLoc,
                displayPages: this.displayPages,
              }}
            />
          </div>
        )}
      </div>
    ) : (
      <span>
        <ReactToPrint
          trigger={() => <PrinterIcon className="icon icon-svg barcodePrint" />}
          content={() => this.componentRef2.current}
          onBeforePrint={() => new Promise(r => setTimeout(r, 1000))}
        />
        <div ref={this.componentRef2}>
          <CoreForm
            loaded={this.handleLoaded}
            submission={this.props.submission.id}
            review
            globals={globals}
          />
        </div>
      </span>
    );
  }
}
