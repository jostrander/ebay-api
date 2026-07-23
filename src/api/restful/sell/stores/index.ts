import {
  AddStoreCategoryRequest,
  DeleteStoreCategoryRequest,
  MoveStoreCategoryRequest,
  RenameStoreCategoryRequest
} from '../../../../types/index.js';
import {operations} from '../../../../types/restful/specs/sell_stores_v1_oas3.js';
import Restful, {OpenApi} from '../../index.js';

/**
 * The <b>Store API</b> allows sellers to retrieve and manage the categories of their eBay store.
 */
export default class Stores extends Restful implements OpenApi<operations> {

  static id = 'Stores';

  get basePath(): string {
    return '/sell/stores/v1';
  }

  /**
   * This method retrieves the details of an eBay store.
   */
  public getStore() {
    return this.get('/store');
  }

  /**
   * This method retrieves the category tree of a seller's eBay store.
   */
  public getStoreCategories() {
    return this.get('/store/categories');
  }

  /**
   * This method adds a single new category to a seller's eBay store.
   *
   * @param body The container for the category to be added to the seller's eBay store.
   */
  public addStoreCategory(body?: AddStoreCategoryRequest) {
    return this.post('/store/categories', body);
  }

  /**
   * This method renames a single existing category of a seller's eBay store.
   *
   * @param categoryId The unique identifier of the eBay store category to be renamed.
   * @param body The container with the new name of the eBay store category.
   */
  public renameStoreCategory(categoryId: string, body?: RenameStoreCategoryRequest) {
    categoryId = encodeURIComponent(categoryId);
    return this.put(`/store/categories/${categoryId}`, body);
  }

  /**
   * This method deletes a single existing category of a seller's eBay store.
   *
   * @param categoryId The unique identifier of the eBay store category to be deleted.
   * @param body The container specifying where to move any listings and child categories of the deleted category.
   */
  public deleteStoreCategory(categoryId: string, body?: DeleteStoreCategoryRequest) {
    categoryId = encodeURIComponent(categoryId);
    return this.delete(`/store/categories/${categoryId}`, {data: body});
  }

  /**
   * This method moves a single existing category of a seller's eBay store. This operation is
   * asynchronous; a successful call returns the <b>getStoreTask</b> URI in the Location response
   * header, which the seller calls to retrieve the status of the move operation.
   *
   * @param body The container specifying the category to move and its destination.
   */
  public moveStoreCategory(body: MoveStoreCategoryRequest) {
    return this.post('/store/categories/move_category', body);
  }

  /**
   * This method retrieves the details and status of a single eBay store task.
   *
   * @param taskId The unique identifier of the eBay store task to retrieve.
   */
  public getStoreTask(taskId: string) {
    taskId = encodeURIComponent(taskId);
    return this.get(`/store/tasks/${taskId}`);
  }

  /**
   * This method retrieves the details and status of a seller's eBay store tasks.
   */
  public getStoreTasks() {
    return this.get('/store/tasks');
  }
}
