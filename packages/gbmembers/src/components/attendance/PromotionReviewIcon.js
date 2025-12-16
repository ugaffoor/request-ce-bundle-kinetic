import React, { Component } from 'react';
import { PromotionReviewDialogContainer } from './PromotionReviewDialog';
import { ReactComponent as Review } from '../../images/review.svg';

export class PromotionReviewIcon extends Component {
  constructor(props) {
    super(props);
    this.setShowPromotionReviewDialog = this.setShowPromotionReviewDialog.bind(
      this,
    );

    this.state = {
      showPromotionReviewDialog: false,
    };
  }
  UNSAFE_componentWillReceiveProps(nextProps) {}
  componentDidMount() {}
  setShowPromotionReviewDialog(show) {
    this.setState({
      showPromotionReviewDialog: show,
    });
  }
  render() {
    return (
      <span className="promotionReviewIcon">
        <span placeholder="Review Attendance">
          <Review
            className="icon review icon-svg"
            onClick={e => this.setShowPromotionReviewDialog(true)}
          />
        </span>
        {this.state.showPromotionReviewDialog && (
          <PromotionReviewDialogContainer
            setShowPromotionReviewDialog={this.setShowPromotionReviewDialog}
            memberItem={this.props.memberItem}
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
