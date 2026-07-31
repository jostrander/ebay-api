import {beforeEach, describe, expect, it, vi} from 'vitest';
import Traditional from '../../../src/api/traditional/index.js';
import Auth from '../../../src/auth/index.js';
import type {IEBayApiRequest} from '../../../src/request.js';
import type {eBayConfig} from '../../../src/types/index.js';

describe('Traditional', () => {
  const config: eBayConfig = {
    authToken: 'eBayAuthToken',
    appId: 'appId',
    certId: 'certId',
    sandbox: true,
    siteId: 0,
    devId: 'devId'
  };

  const request: IEBayApiRequest<any> = {
    get: vi.fn(),
    delete: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
    postForm: vi.fn(),
    instance: vi.fn()
  };

  let auth: Auth;

  beforeEach(() => {
    auth = new Auth(config, request);
  });

  it('return correct eBayAuthToken', () => {
    const traditional = new Traditional(config, request, auth);
    expect(traditional.auth.authNAuth.eBayAuthToken).toBe('eBayAuthToken');
  });

  it('use "eBayAuthToken" if useIaf is set to false', () => {
    const post = vi.fn().mockResolvedValue({data: '<GetAccount></GetAccount>'});
    const req: IEBayApiRequest<any> = {
      get: vi.fn(),
      delete: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      post,
      postForm: vi.fn(),
      instance: vi.fn()
    };
    const traditional = new Traditional(config, req, auth);

    const trading = traditional.createTradingApi();
    return trading.GetAccount({}, {raw: true, useIaf: false}).then(data => {
      expect(post.mock.calls[0][1]).toBe([
        '<?xml version="1.0" encoding="utf-8"?>',
        '<GetAccountRequest xmlns="urn:ebay:apis:eBLBaseComponents">',
        '<RequesterCredentials><eBayAuthToken>eBayAuthToken</eBayAuthToken></RequesterCredentials>',
        '</GetAccountRequest>'
      ].join(''));
      expect(data).toBe('<GetAccount></GetAccount>');
    });
  });

  it('use Auth Token event if "accessToken" is available', () => {
    const post = vi.fn().mockResolvedValue({data: '<GetAccountResponse></GetAccountResponse>'});
    const req: IEBayApiRequest<any> = {
      get: vi.fn(),
      delete: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      post,
      postForm: vi.fn(),
      instance: vi.fn()
    };
    auth.OAuth2.setCredentials({
      access_token: 'accessToken',
      refresh_token_expires_in: 0,
      refresh_token: 'refresh_token',
      token_type: 'token_type',
      expires_in: 0
    });

    const traditional = new Traditional(config, req, auth);
    const trading = traditional.createTradingApi();
    return trading.GetAccount({}, {raw: true}).then(data => {
      expect(post.mock.calls[0][1]).toBe([
        '<?xml version="1.0" encoding="utf-8"?>',
        '<GetAccountRequest xmlns="urn:ebay:apis:eBLBaseComponents">',
        '<RequesterCredentials><eBayAuthToken>eBayAuthToken</eBayAuthToken></RequesterCredentials></GetAccountRequest>'
      ].join(''));
      expect(data).toBe('<GetAccountResponse></GetAccountResponse>');
      expect(post.mock.calls[0][2].headers['X-EBAY-API-IAF-TOKEN']).toBe(undefined);
    });
  });

  it('use IAF token if "accessToken" is available', () => {
    const post = vi.fn().mockResolvedValue({data: '<GetAccountResponse></GetAccountResponse>'});
    const req: IEBayApiRequest<any> = {
      get: vi.fn(),
      delete: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      post,
      postForm: vi.fn(),
      instance: vi.fn()
    };
    auth.OAuth2.setCredentials({
      access_token: 'accessToken',
      refresh_token_expires_in: 0,
      refresh_token: 'refresh_token',
      token_type: 'token_type',
      expires_in: 0
    });

    auth.authNAuth.setAuthToken(null);
    const traditional = new Traditional(config, req, auth);
    const trading = traditional.createTradingApi();
    return trading.GetAccount({}, {raw: true}).then(data => {
      expect(post.mock.calls[0][1]).toBe([
        '<?xml version="1.0" encoding="utf-8"?>',
        '<GetAccountRequest xmlns="urn:ebay:apis:eBLBaseComponents">',
        '</GetAccountRequest>'
      ].join(''));
      expect(data).toBe('<GetAccountResponse></GetAccountResponse>');
      expect(post.mock.calls[0][2].headers['X-EBAY-API-IAF-TOKEN']).toBe('accessToken');
    });
  });

  it('throws EBayIAFTokenExpired of error code is 21917053', async () => {
    const post = vi.fn().mockResolvedValue({data: '<GetAccountResponse><Ack>Failure</Ack><Errors><ErrorCode>21917053</ErrorCode></Errors></GetAccountResponse>'});
    const req: IEBayApiRequest<any> = {
      get: vi.fn(),
      delete: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      post,
      postForm: vi.fn(),
      instance: vi.fn()
    };
    auth.OAuth2.setCredentials({
      access_token: 'accessToken',
      refresh_token_expires_in: 0,
      refresh_token: 'refresh_token',
      token_type: 'token_type',
      expires_in: 0
    });
    const traditional = new Traditional(config, req, auth);
    const trading = traditional.createTradingApi();
    await expect(trading.GetAccount({})).rejects.toHaveProperty('name', 'EBayIAFTokenExpired');
  });

  it('returns response', async () => {
    const post = vi.fn().mockResolvedValue({data: 'data'});
    const req: IEBayApiRequest<any> = {
      get: vi.fn(),
      delete: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      post,
      postForm: vi.fn(),
      instance: vi.fn()
    };
    auth.OAuth2.setCredentials({
      access_token: 'accessToken',
      refresh_token_expires_in: 0,
      refresh_token: 'refresh_token',
      token_type: 'token_type',
      expires_in: 0
    });
    const traditional = new Traditional(config, req, auth);
    const trading = traditional.createTradingApi();
    const response = await trading.GetAccount({}, {returnResponse: true});
    expect(response).toEqual({data: 'data'});
  });
});
