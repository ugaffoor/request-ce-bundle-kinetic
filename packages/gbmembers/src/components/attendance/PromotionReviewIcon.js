import React, { Component } from 'react';
import moment from 'moment';
import { PromotionReviewDialogContainer } from './PromotionReviewDialog';
import reviewIcon from '../../images/review.svg?raw';
import SVGInline from 'react-svg-inline';
import { actions as attendanceActions } from '../../redux/modules/attendance';

export class PromotionReviewIcon extends Component {
  constructor(props) {
    super(props);
    this.setShowPromotionReviewDialog = this.setShowPromotionReviewDialog.bind(
      this,
    );

    this.state = {
      showPromotionReviewDialog: false,
      member: this.props.memberItem,
    };
  }
  componentWillReceiveProps(nextProps) {}
  componentWillMount() {}
  setShowPromotionReviewDialog(show) {
    this.setState({
      showPromotionReviewDialog: show,
    });
  }
  render() {
    return (
      <span className="promotionReviewIcon">
        <span placeholder="Review Attendance">
          <SVGInline
            svg={reviewIcon}
            className="icon review"
            onClick={e => this.setShowPromotionReviewDialog(true)}
          />
        </span>
        {this.state.showPromotionReviewDialog && (
          <PromotionReviewDialogContainer
            setShowPromotionReviewDialog={this.setShowPromotionReviewDialog}
            memberItem={this.state.member}
            belts={this.props.belts}
            allMembers={this.props.allMembers}
            setIsDirty={this.props.setIsDirty}
          />
        )}
      </span>
    );
  }
}

export default PromotionReviewIcon;
