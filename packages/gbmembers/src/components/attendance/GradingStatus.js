import React, { Component } from 'react';
import { PromotionDialogContainer } from './PromotionDialog';

export class GradingStatus extends Component {
  constructor(props) {
    super(props);
    let statusIndicator = props.memberItem.statusIndicator;
    let statusText = props.memberItem.statusText;

    let percentageStyle = {
      width: props.memberItem.attendancePerc + '%',
    };
    let showPromotionDialog = false;
    this.state = {
      statusIndicator,
      percentageStyle,
      statusText,
      showPromotionDialog,
    };
  }
  UNSAFE_componentWillReceiveProps(nextProps) {
    if (!this.state.showPromotionDialog) {
      let statusIndicator = nextProps.memberItem.statusIndicator;
      let statusText = nextProps.memberItem.statusText;

      let percentageStyle = {
        width: nextProps.memberItem.attendancePerc + '%',
      };
      let showPromotionDialog = false;
      this.setState({
        statusIndicator: statusIndicator,
        percentageStyle: percentageStyle,
        statusText: statusText,
        showPromotionDialog: showPromotionDialog,
      });
    }
  }
  componentDidMount() {}
  setShowPromotionDialog(gradingStatusThis, show) {
    gradingStatusThis.setState({ showPromotionDialog: show });
  }
  render() {
    return (
      <div
        className="grading"
        onClick={e => {
          this.setShowPromotionDialog(this, true);
        }}
      >
        <div className={this.state.statusIndicator} title="Grading History">
          <div className="bar">
            <div className="percent" style={this.state.percentageStyle}></div>
          </div>
          <div className="gradeStatus">{this.state.statusText}</div>
        </div>
        {this.state.showPromotionDialog && (
          <PromotionDialogContainer
            setIsDirty={this.props.setIsDirty}
            setShowPromotionDialog={this.setShowPromotionDialog}
            memberItem={this.props.memberItem}
            allMembers={this.props.allMembers}
            belts={this.props.belts}
            gradingStatus={this}
            statusIndicator={this.state.statusIndicator}
            percentageStyle={this.state.percentageStyle}
            statusText={this.state.statusText}
            promotionSort={this.state.promotionSort}
          />
        )}
      </div>
    );
  }
}

export default GradingStatus;
