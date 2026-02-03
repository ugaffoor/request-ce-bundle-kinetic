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

    // GBK 6.0 compliance
    let gbk6Recommend = false;
    let belt = props.memberItem.values['Ranking Belt'];
    if (
      statusIndicator === 'ready' &&
      (belt === 'Grey / White Belt 1 Red Stripe' ||
        belt === 'Grey / White Belt 2 Red Stripes' ||
        belt === 'Grey / White Belt 3 Red Stripes' ||
        belt === 'Grey / White Belt 4 Red Stripes' ||
        belt === 'Grey / White Belt 1 Black Stripe' ||
        belt === 'Grey / White Belt 2 Black Stripes' ||
        belt === 'Grey / White Belt 3 Black Stripes')
    ) {
      gbk6Recommend = true;
    }
    this.state = {
      statusIndicator,
      percentageStyle,
      statusText,
      showPromotionDialog,
      gbk6Recommend,
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
      // GBK 6.0 compliance
      let gbk6Recommend = false;
      let belt = nextProps.memberItem.values['Ranking Belt'];
      if (
        statusIndicator === 'ready' &&
        (belt === 'Grey / White Belt 1 Red Stripe' ||
          belt === 'Grey / White Belt 2 Red Stripes' ||
          belt === 'Grey / White Belt 3 Red Stripes' ||
          belt === 'Grey / White Belt 4 Red Stripes' ||
          belt === 'Grey / White Belt 1 Black Stripe' ||
          belt === 'Grey / White Belt 2 Black Stripes' ||
          belt === 'Grey / White Belt 3 Black Stripes')
      ) {
        gbk6Recommend = true;
      }

      this.setState({
        statusIndicator: statusIndicator,
        percentageStyle: percentageStyle,
        statusText: statusText,
        showPromotionDialog: showPromotionDialog,
        gbk6Recommend: gbk6Recommend,
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
            <div className="percent" style={this.state.percentageStyle} />
          </div>
          <div className="gradeStatus">{this.state.statusText}</div>
          {this.state.gbk6Recommend && (
            <div className="gbk6">
              The GBK 6.0 now requires this member to be promoted to the next
              belt.
            </div>
          )}
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
