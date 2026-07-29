import {
  CouponRequest,
  CreateGuestCheckoutSessionRequest,
  ShippingAddressImpl,
  UpdateQuantity,
  UpdateShippingOption
} from '../../../../types/index.js';
import {operations} from '../../../../types/restful/specs/buy_order_v2_oas3.js';
import Api, {OpenApi} from '../../index.js';

/**
 * The Order API provides interfaces that let eBay guest buyers pay for items.
 *
 * As of Order API v2, only the guest checkout flow is available. The member checkout session,
 * proxy-guest checkout session, payment-info, initiate-payment and place-order operations from
 * v1 were removed by eBay and are no longer part of the API.
 *
 * Client Credentials: https://api.ebay.com/oauth/api_scope/buy.order
 */
export default class Order extends Api implements OpenApi<operations> {

  static id = 'Order';

  get basePath(): string {
    return '/buy/order/v2';
  }

  /**
   * This method creates an eBay guest checkout session, which is the first step in performing a checkout.
   *
   * @param body CreateGuestCheckoutSessionRequest
   */
  public initiateGuestCheckoutSession(body?: CreateGuestCheckoutSessionRequest) {
    return this.post('/guest_checkout_session/initiate', body);
  }

  /**
   * This method returns the details of the specified guest checkout session. The checkoutSessionId is passed in as a
   * URI parameter and is required.
   *
   * @param checkoutSessionId The eBay-assigned session ID, for a specific eBay marketplace, that is returned by the
   *     initiateGuestCheckoutSession method.
   */
  public getGuestCheckoutSession(checkoutSessionId: string) {
    checkoutSessionId = encodeURIComponent(checkoutSessionId);
    return this.get(`/guest_checkout_session/${checkoutSessionId}`);
  }

  /**
   * (Limited Release) You must be whitelisted to use this method. This method adds a coupon to an eBay guest
   * checkout session and applies it to all the eligible items in the order.
   *
   * @param checkoutSessionId The eBay-assigned session ID, for a specific eBay marketplace, that is returned by the
   *     initiateGuestCheckoutSession method.
   * @param body CouponRequest
   */
  public applyGuestCoupon(checkoutSessionId: string, body?: CouponRequest) {
    checkoutSessionId = encodeURIComponent(checkoutSessionId);
    return this.post(`/guest_checkout_session/${checkoutSessionId}/apply_coupon`, body);
  }

  /**
   * (Limited Release) You must be whitelisted to use this method. This method removes a coupon from an eBay guest
   * checkout session.
   *
   * @param checkoutSessionId The eBay-assigned session ID, for a specific eBay marketplace, that is returned by the
   *     initiateGuestCheckoutSession method.
   * @param body CouponRequest
   */
  public removeGuestCoupon(checkoutSessionId: string, body?: CouponRequest) {
    checkoutSessionId = encodeURIComponent(checkoutSessionId);
    return this.post(`/guest_checkout_session/${checkoutSessionId}/remove_coupon`, body);
  }

  /**
   * This method changes the quantity of the specified line item in an eBay guest checkout session.
   *
   * @param checkoutSessionId The eBay-assigned session ID, for a specific eBay marketplace, that is returned by the
   *     initiateGuestCheckoutSession method.
   * @param body UpdateQuantity
   */
  public updateGuestQuantity(checkoutSessionId: string, body?: UpdateQuantity) {
    checkoutSessionId = encodeURIComponent(checkoutSessionId);
    return this.post(`/guest_checkout_session/${checkoutSessionId}/update_quantity`, body);
  }

  /**
   * This method changes the shipping address for the order in an eBay guest checkout session.
   *
   * @param checkoutSessionId The eBay-assigned session ID, for a specific eBay marketplace, that is returned by the
   *     initiateGuestCheckoutSession method.
   * @param body ShippingAddressImpl
   */
  public updateGuestShippingAddress(checkoutSessionId: string, body?: ShippingAddressImpl) {
    checkoutSessionId = encodeURIComponent(checkoutSessionId);
    return this.post(`/guest_checkout_session/${checkoutSessionId}/update_shipping_address`, body);
  }

  /**
   * This method changes the shipping method for the specified line item in an eBay guest checkout session.
   *
   * @param checkoutSessionId The eBay-assigned session ID, for a specific eBay marketplace, that is returned by the
   *     initiateGuestCheckoutSession method.
   * @param body UpdateShippingOption
   */
  public updateGuestShippingOption(checkoutSessionId: string, body?: UpdateShippingOption) {
    checkoutSessionId = encodeURIComponent(checkoutSessionId);
    return this.post(`/guest_checkout_session/${checkoutSessionId}/update_shipping_option`, body);
  }

  /**
   * This method retrieves the details about a specific guest purchase order.
   *
   * @param purchaseOrderId The unique identifier of a purchase order made by a guest buyer, for which details are to
   *     be retrieved.
   */
  public getGuestPurchaseOrder(purchaseOrderId: string) {
    purchaseOrderId = encodeURIComponent(purchaseOrderId);
    return this.get(`/guest_purchase_order/${purchaseOrderId}`);
  }
}
