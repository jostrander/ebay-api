import {CommerceCatalogSearchParams} from '../../../../types/index.js';
import {operations} from '../../../../types/restful/specs/commerce_catalog_v1_beta_oas3.js';
import Restful, {OpenApi} from '../../index.js';

/**
 * Use the Catalog API to search the eBay catalog for products on which to base a seller's item listing;
 */
export default class Catalog extends Restful implements OpenApi<operations> {

  static id = 'Catalog';

  get basePath(): string {
    return '/commerce/catalog/v1_beta';
  }

  /**
   * This call retrieves details of the catalog product identified by the eBay product identifier (ePID) specified in
   * the request.
   *
   * @param epid The ePID of the product being requested.
   */
  public getProduct(epid: string) {
    const e = encodeURIComponent(epid);
    return this.get(`/product/${e}`);
  }

  /**
   * This call searches for and retrieves summaries of one or more products in the eBay catalog that match the search
   * criteria provided by a seller.
   *
   * @param params SearchCatalogParams
   */
  public search(params?: CommerceCatalogSearchParams) {
    return this.get('/product_summary/search', {
      params
    });
  }
}
