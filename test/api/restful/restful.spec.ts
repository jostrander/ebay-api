import {beforeEach, describe, expect, it, vi} from 'vitest';
import Restful, {defaultApiHeaders} from '../../../src/api/restful/index.js';
import {MarketplaceId} from '../../../src/enums/index.js';

class TestApi extends Restful {
  get basePath(): string {
    return '/basePath';
  }

  updateThings() {
    return this.post('/things', {
      headers: {
        'X-TEST': 'X-TEST'
      }
    });
  }

  deleteThing(body: any) {
    return this.delete('/things', {data: body});
  }
}

describe('Restful API', () => {
  const config = {
    appId: 'appId',
    certId: 'certId',
    sandbox: true,
    siteId: 0,
    devId: 'devId'
  };

  let req: any = null;
  const cred = {
    access_token: 'access_token',
    expires_in: 0,
    token_type: 'token_type',
    refresh_token: 'refresh_token',
    refresh_token_expires_in: 0
  };

  beforeEach(() => {
    req = {
      get: vi.fn(),
      delete: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      post: vi.fn(),
      postForm: vi.fn().mockResolvedValue({
        data: {access_token: 'new_access_token'}
      }),
      instance: vi.fn()
    };
  });

  describe('extend Restful API with additional parameters', () => {
    it('returns correct baseUrl', () => {
      const api = new TestApi(config, req);
      const apix = new TestApi(config, req).apix;
      const apiz = new TestApi(config, req).apiz;
      const apiy = new TestApi(config, req).api({subdomain: 'apiy'});

      expect(api.baseUrl).toBe('https://api.sandbox.ebay.com/basePath');
      expect(apix.baseUrl).toBe('https://apix.sandbox.ebay.com/basePath');
      expect(apiz.baseUrl).toBe('https://apiz.sandbox.ebay.com/basePath');
      expect(apiy.baseUrl).toBe('https://apiy.sandbox.ebay.com/basePath');
    });

    it('extends headers', async () => {
      const post = vi.fn().mockReturnValue({item: '1'});
      const api = new TestApi(config, {...req, post}).api({headers: {'X-HEADER': 'X-HEADER'}});
      api.auth.OAuth2.setCredentials(cred);

      await api.updateThings();
      expect(post.mock.calls[0][2].headers).toEqual({
        ...defaultApiHeaders,
        'Authorization': 'Bearer access_token',
        'X-HEADER': 'X-HEADER'
      });
    });
  });

  it('returns correct additional headers', () => {
    const api = new TestApi({
      ...config,
      marketplaceId: MarketplaceId.EBAY_DE
    }, req);

    expect(api.additionalHeaders).toEqual({
      'X-EBAY-C-MARKETPLACE-ID': MarketplaceId.EBAY_DE
    });
  });

  it('returns correct RequestConfig', async () => {
    // @ts-ignore
    const api = new TestApi(config, req, {
      getHeaderAuthorization: vi.fn().mockReturnValue({'Authorization': 'Authorization'})
    });

    expect(await api.enrichRequestConfig({
      method: 'post',
      path: '/',
      config: {
        headers: {
          'X-HEADER': 'X-HEADER'
        }
      }
    })).toEqual({
      headers: {
        'Authorization': 'Authorization',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Accept-Encoding': 'application/gzip',
        'X-HEADER': 'X-HEADER'
      }
    });
  });

  it('lets a per-request header override the default Content-Type', async () => {
    // @ts-ignore
    const api = new TestApi(config, req, {
      getHeaderAuthorization: vi.fn().mockReturnValue({'Authorization': 'Authorization'})
    });

    const {headers} = await api.enrichRequestConfig({
      method: 'post',
      path: '/',
      config: {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    });

    expect(headers['Content-Type']).toBe('multipart/form-data');
  });

  it('lets a per-request header override the app config headers', async () => {
    // @ts-ignore
    const api = new TestApi(config, req, {
      getHeaderAuthorization: vi.fn().mockReturnValue({'Authorization': 'Authorization'})
    }, {headers: {'Content-Type': 'application/json'}});

    const {headers} = await api.enrichRequestConfig({
      method: 'post',
      path: '/',
      config: {
        headers: {
          'Content-Type': 'application/octet-stream'
        }
      }
    });

    expect(headers['Content-Type']).toBe('application/octet-stream');
  });

  it('signs the body of a delete request', async () => {
    const del = vi.fn().mockReturnValue({data: {}});
    const api = new TestApi(config, {...req, delete: del}).api({sign: true});
    api.auth.OAuth2.setCredentials(cred);
    const getDigitalSignatureHeaders = vi.fn().mockReturnValue({});
    // @ts-ignore
    api.getDigitalSignatureHeaders = getDigitalSignatureHeaders;

    const body = {moveToCategoryId: '42'};
    await api.deleteThing(body);

    // second argument is the payload the signature is computed over
    expect(getDigitalSignatureHeaders.mock.calls[0][1]).toEqual(body);
    expect(del.mock.calls[0][1].data).toEqual(body);
  });

  it('keeps non-header request config alongside the merged headers', async () => {
    // @ts-ignore
    const api = new TestApi(config, req, {
      getHeaderAuthorization: vi.fn().mockReturnValue({'Authorization': 'Authorization'})
    });

    expect(await api.enrichRequestConfig({
      method: 'get',
      path: '/',
      config: {
        responseType: 'arraybuffer'
      }
    })).toEqual({
      responseType: 'arraybuffer',
      headers: {
        ...defaultApiHeaders,
        'Authorization': 'Authorization'
      }
    });
  });

  describe('restful response test', () => {
    it('returns data', async () => {
      const post = vi.fn().mockReturnValue({data: {item: '1'}});
      const api = new TestApi(config, {...req, post});

      const response = await api.updateThings();
      expect(response).toEqual({item: '1'});
    });

    it('returns response', async () => {
      const post = vi.fn().mockReturnValue({data: {item: '1'}});
      const api = new TestApi(config, {...req, post}, undefined, {returnResponse: true});

      const response = await api.updateThings();
      expect(response).toEqual({data: {item: '1'}});
    });
  });

  it('refresh the token if invalid token returned', async () => {
    const post = vi.fn().mockRejectedValueOnce({
      response: {
        data: {
          error: 'Invalid access token'
        }
      }
    }).mockResolvedValueOnce({data: {updateThings: 'ok'}});

    const api = new TestApi({
      ...config,
      autoRefreshToken: true
    }, {
      ...req,
      post,
      postForm: vi.fn().mockResolvedValue(cred)
    });

    api.auth.OAuth2.setCredentials(cred);

    const result = await api.updateThings();

    expect(post).toHaveBeenCalledTimes(2);
    expect(result).toEqual({updateThings: 'ok'});
  });

  it('refresh the token on PostOrder call if response is 401', async () => {
    const post = vi.fn().mockRejectedValueOnce({
      response: {
        status: 401
      }
    }).mockResolvedValueOnce({data: {updateThings: 'ok'}});

    const api = new TestApi({
      ...config,
      autoRefreshToken: true
    }, {
      ...req,
      post,
      postForm: vi.fn().mockResolvedValue(cred)
    }, undefined, {
      basePath: '/post-order/v2'
    });

    api.auth.OAuth2.setCredentials(cred);

    const result = await api.updateThings();

    expect(post).toHaveBeenCalledTimes(2);
    expect(result).toEqual({updateThings: 'ok'});
  });

  it('refresh the token on Inventory call if response is 403', async () => {
    const post = vi.fn().mockRejectedValueOnce({
      response: {
        status: 403
      }
    }).mockResolvedValueOnce({data: {updateThings: 'ok'}});

    const api = new TestApi({
      ...config,
      autoRefreshToken: true
    }, {
      ...req,
      post,
      postForm: vi.fn().mockResolvedValue(cred)
    }, undefined, {
      basePath: '/sell/inventory/v1'
    });

    api.auth.OAuth2.setCredentials(cred);

    const result = await api.updateThings();

    expect(post).toHaveBeenCalledTimes(2);
    expect(result).toEqual({updateThings: 'ok'});
  });

});
