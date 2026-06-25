import { operations } from '../../../../types/restful/specs/commerce_feedback_v1_beta_oas3.js';
import { LeaveFeedbackRequest, RespondToFeedbackRequest } from '../../../../types/restfulTypes.js';
import Restful, { OpenApi } from '../../index.js';

/**
 * The eBay Feedback API includes resources for retrieving items awaiting feedback, retrieving and
 * submitting feedback entries, providing feedback rating summaries, and responding to feedback.
 * These methods allow users to manage feedback across buying and selling activities.
 *
 * https://api.ebay.com/oauth/api_scope/commerce.feedback
 */
export default class Feedback extends Restful implements OpenApi<operations> {

  static id = 'Feedback';

  get basePath(): string {
    return '/commerce/feedback/v1';
  }

  /**
   * This method retrieves the order line items that are awaiting feedback from the user.
   *
   * @param filter This query parameter limits the response using one or more comma-separated filters.
   * @param limit The maximum number of entries to return on each page of the paginated response.
   * @param offset The number of entries to skip in the result set before returning the first entry.
   * @param sort This query parameter configures the order of the returned items.
   */
  public getItemsAwaitingFeedback({
    filter,
    limit,
    offset,
    sort
  }: {
    filter?: string,
    limit?: number,
    offset?: number,
    sort?: string,
  } = {}) {
    return this.get('/awaiting_feedback', {
      params: {
        filter,
        limit,
        offset,
        sort
      }
    });
  }

  /**
   * This method retrieves feedback for the specified user ID and feedback type (received or left).
   *
   * @param userId The eBay username of the user for which feedback is being retrieved.
   * @param feedbackType The type of feedback records to return (e.g. FEEDBACK_RECEIVED or FEEDBACK_LEFT).
   * @param feedbackId Returns only the specific feedback record identified by this feedback ID.
   * @param filter Limits the response using one or more comma-separated filters (e.g. commentType).
   * @param limit The maximum number of entries to return on each page of the paginated response.
   * @param listingId Limits feedback entries to those associated with the specified listing.
   * @param offset The number of entries to skip in the result set before returning the first entry.
   * @param orderLineItemId Retrieves feedback entries related to the specified order line item ID.
   * @param sort Configures the order of the returned items.
   * @param transactionId Limits feedback entries to those associated with the specified transaction ID.
   */
  public getFeedback({
    userId,
    feedbackType,
    feedbackId,
    filter,
    limit,
    listingId,
    offset,
    orderLineItemId,
    sort,
    transactionId
  }: {
    userId: string,
    feedbackType: string,
    feedbackId?: string,
    filter?: string,
    limit?: number,
    listingId?: string,
    offset?: number,
    orderLineItemId?: string,
    sort?: string,
    transactionId?: string,
  }) {
    return this.get('/feedback', {
      params: {
        user_id: userId,
        feedback_type: feedbackType,
        feedback_id: feedbackId,
        filter,
        limit,
        listing_id: listingId,
        offset,
        order_line_item_id: orderLineItemId,
        sort,
        transaction_id: transactionId
      }
    });
  }

  /**
   * This method submits a feedback entry for an order line item.
   *
   * @param body LeaveFeedbackRequest
   */
  public leaveFeedback(body: LeaveFeedbackRequest) {
    return this.post('/feedback', body);
  }

  /**
   * This method retrieves a summary of the feedback ratings for the specified user.
   *
   * @param userId The eBay username of the user for which the rating summary is being retrieved.
   * @param filter Limits the response based on the specified filter values (e.g. ratingType).
   */
  public getFeedbackRatingSummary({
    userId,
    filter
  }: {
    userId: string,
    filter: string,
  }) {
    return this.get('/feedback_rating_summary', {
      params: {
        user_id: userId,
        filter
      }
    });
  }

  /**
   * This method submits a response (a public reply or a follow-up) to a feedback entry.
   *
   * @param body RespondToFeedbackRequest
   */
  public respondToFeedback(body: RespondToFeedbackRequest) {
    return this.post('/respond_to_feedback', body);
  }
}
