import {beforeEach, describe, expect, it, vi} from 'vitest';
import AuthNAuth from '../../src/auth/authNAuth.js';

describe('AuthNAuth', () => {
  const config = {appId: 'appId', certId: 'certId', sandbox: true, siteId: 0, devId: 'devId'};
  let req: any = null;
  beforeEach(() => {
    req = {
      get: vi.fn().mockResolvedValue({data: {}}),
      delete: vi.fn().mockResolvedValue({data: {}}),
      put: vi.fn().mockResolvedValue({data: {}}),
      patch: vi.fn().mockResolvedValue({data: {}}),
      post: vi.fn().mockResolvedValue({data: {}}),
      postForm: vi.fn().mockResolvedValue({
        data: {
          access_token: 'new_access_token'
        }
      }),
      instance: vi.fn()
    };
  });

  it('Sets the auth token', () => {
    const auth = new AuthNAuth({...config, authToken: 'authToken'}, req);
    expect(auth.getAuthToken()?.eBayAuthToken).toBe('authToken');
  });

  describe('Get session id and auth url', () => {
    it('Throws error if devId is not defined', async () => {
      const auth = new AuthNAuth({...config, devId: undefined}, req);
      await expect(auth.getSessionIdAndAuthUrl()).rejects.toThrowError(new Error('DevId is required.'));
    });

    it('Throws error if ruName is not defined', async () => {
      const auth = new AuthNAuth({...config}, req);
      await expect(auth.getSessionIdAndAuthUrl()).rejects.toThrowError(new Error('RuName is required.'));
    });

    it('Throws error if siteId is not a Number', async () => {
      // @ts-ignore
      const auth = new AuthNAuth({...config, siteId: 'xxx', ruName: 'ruName'}, req);
      await expect(auth.getSessionIdAndAuthUrl()).rejects.toThrowError(new Error('"siteId" is required for Auth\'n\'Auth.'));
    });

    it('Throws error if siteId is not a Number', async () => {
      const post = vi.fn().mockResolvedValue({
        data: `<?xml version="1.0" encoding="utf-8"?>
<GetSessionIDResponse xmlns="urn:ebay:apis:eBLBaseComponents">
   <SessionID>SessionID</SessionID>
</GetSessionIDResponse>`
      });
      // @ts-ignore
      const auth = new AuthNAuth({...config, ruName: 'ruName'}, {...req, post});

      const data = await auth.getSessionIdAndAuthUrl();
      expect(data.sessionId).toBe('SessionID');
      expect(data.url).toBe('https://signin.sandbox.ebay.com/ws/eBayISAPI.dll?SignIn&RuName=ruName&SessID=SessionID');
    });
  });

  describe('Auth Token', () => {
    it('Throws error if devId is not defined', async () => {
      const auth = new AuthNAuth({...config, devId: undefined}, req);
      await expect(auth.mintToken('SessionID')).rejects.toThrowError(new Error('DevId is required.'));
    });

    it('fetch auth token', async () => {
      const post = vi.fn().mockResolvedValue({
        data: `<?xml version="1.0" encoding="utf-8"?>
<GetSessionIDResponse xmlns="urn:ebay:apis:eBLBaseComponents">
   <SessionID>SessionID</SessionID>
</GetSessionIDResponse>`
      });
      const auth = new AuthNAuth(config, {...req, post});
      await auth.mintToken('SessionID');
    });

    it('sets and gets the token correctly', async () => {
      // @ts-ignore
      const auth = new AuthNAuth(config, req);
      auth.setAuthToken('authToken');
      expect(auth.eBayAuthToken).toBe('authToken');
    });
  });


  it('Returns correct XML request config', async () => {
    const auth = new AuthNAuth(config, req);
    const xmlConfig = await auth.getRequestConfig('callName');
    expect(xmlConfig).toEqual({
      useIaf: false,
      xmlns: 'urn:ebay:apis:eBLBaseComponents',
      endpoint: 'https://api.sandbox.ebay.com/ws/api.dll',
      headers: {
        'X-EBAY-API-CALL-NAME': 'callName',
        'X-EBAY-API-CERT-NAME': 'certId',
        'X-EBAY-API-APP-NAME': 'appId',
        'X-EBAY-API-DEV-NAME': 'devId',
        'X-EBAY-API-SITEID': 0,
        'X-EBAY-API-COMPATIBILITY-LEVEL': 967
      }
    });
  });

  describe('Generate AuthUrl', () => {
    it('generates correct auth url', () => {
      const url = AuthNAuth.generateAuthUrl(false, 'ruName', 'sessionId', true);
      expect(url).toBe('https://signin.ebay.com/ws/eBayISAPI.dll?SignIn&RuName=ruName&SessID=sessionId&prompt=login');
    });
  });
});
