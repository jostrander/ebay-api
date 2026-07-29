/**
 * eBay declares its "filter" query parameters as a single comma-separated string, never as an array.
 * Axios is configured with `paramsSerializer: {indexes: null}`, so handing it an array would emit
 * the parameter repeatedly (`?filter=a&filter=b`) instead of once. Join here so callers can pass
 * either shape.
 *
 * @param filter A single filter string, or a list of criteria to be joined.
 */
export const toFilter = (filter?: string | string[]) =>
  Array.isArray(filter) ? filter.join(',') : filter;
