import {beforeEach, describe, expect, it, vi} from 'vitest';
import OAuth2 from '../../src/auth/oAuth2.js';

function throwingStub(name: string) {
  return vi.fn(() => {
    const error = new Error();
    error.name = name;
    throw error;
  });
}

describe('OAuth2', () => {
  const config = {appId: 'appId', certId: 'certId', sandbox: true, siteId: 0, devId: 'devId'};
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
        data: {
          access_token: 'new_access_token'
        }
      }),
      instance: vi.fn()
    };
  });

  describe('Generate AuthUrl', () => {
    it('generate correct production AuthUrl', () => {
      expect(OAuth2.generateAuthUrl(false, 'appId', 'ruName', ['scope1']))
        .toBe('https://auth.ebay.com/oauth2/authorize?client_id=appId&redirect_uri=ruName&response_type=code&state=&scope=scope1');
    });

    it('generate correct sandbox AuthUrl', () => {
      expect(OAuth2.generateAuthUrl(true, 'appId', 'ruName', ['scope1'], 'state'))
        .toBe('https://auth.sandbox.ebay.com/oauth2/authorize?client_id=appId&redirect_uri=ruName&response_type=code&state=state&scope=scope1');
    });

    it('generate correct sandbox AuthUrl', () => {
      const oAuth2 = new OAuth2({...config, ruName: 'ruName', scope: []}, req);
      const url = oAuth2.generateAuthUrl('ruName', [], 'state');
      expect(url).toBe('https://auth.sandbox.ebay.com/oauth2/authorize?client_id=appId&redirect_uri=ruName&response_type=code&state=state&scope=');
    });

    it('requires ruName', () => {
      const oAuth2 = new OAuth2(config, req);
      expect(() => oAuth2.generateAuthUrl()).toThrowError(new Error('RuName is required.'));
    });
  });

  describe('Scope', () => {
    it('sets and returns correct scope', () => {
      const oAuth2 = new OAuth2(config, req);
      oAuth2.setScope(['scope1']);
      expect(oAuth2.getScope()).toEqual(['scope1']);
    });
  });

  describe('Obtain Tokens', () => {
    it('returns client access token', async () => {
      const oAuth2 = new OAuth2(config, req);
      oAuth2.setClientToken(cred);

      const token = await oAuth2.getApplicationAccessToken();

      expect(token).toBe('access_token');
    });

    it('throws error if refresh didn\'t work', async () => {
      const oAuth2 = new OAuth2(config, {
        ...req,
        postForm: throwingStub('error')
      });

      await expect(oAuth2.getApplicationAccessToken()).rejects.toHaveProperty('name', 'error');
    });

    it('refresh the client access token', async () => {
      const oAuth2 = new OAuth2(config, req);

      const token = await oAuth2.getApplicationAccessToken();
      expect(token).toBe('new_access_token');
    });

    it('return token correctly', async () => {
      const oAuth2 = new OAuth2(config, req);

      const token = await oAuth2.getToken('code');
      expect(token.access_token).toBe('new_access_token');
    });

    it('return token correctly', async () => {
      const oAuth2 = new OAuth2(config, req);

      await oAuth2.getToken('code', 'ruNameX');
      expect(req.postForm.mock.calls[0][1].redirect_uri).toBe('ruNameX');
    });

    it('throws error on getToken', async () => {
      const oAuth2 = new OAuth2(config, {...req, postForm: throwingStub('error')});

      await expect(oAuth2.getToken('code')).rejects.toHaveProperty('name', 'error');
    });

    it('set and get credentials', () => {
      const oAuth2 = new OAuth2(config, req);
      expect(oAuth2.getCredentials()).toBe(null);

      oAuth2.setCredentials(cred);
      expect(oAuth2.getCredentials()).toEqual(cred);
    });
  });

  describe('Refresh Client Token', () => {
    it('Throws error if appId is not defined', async () => {
      const oAuth2 = new OAuth2({...config, appId: ''}, req);
      await expect(oAuth2.obtainApplicationAccessToken()).rejects.toThrowError(new Error('Missing App ID (Client Id)'));
    });

    it('Throws error if appId is not defined', async () => {
      const oAuth2 = new OAuth2({...config, certId: ''}, req);
      await expect(oAuth2.obtainApplicationAccessToken()).rejects.toThrowError(new Error('Missing Cert Id (Client Secret)'));
    });

    it('throws error on refreshToken if no credentials are not set', async () => {
      const oAuth2 = new OAuth2(config, req);

      await expect(oAuth2.refreshUserAccessToken())
        .rejects.toThrowError(new Error('Failed to refresh the user access token. Token or refresh_token is not set.'));
    });

    it('throws error on refreshAuthToken if request failed', async () => {
      const oAuth2 = new OAuth2(config, {...req, postForm: throwingStub('error')});
      oAuth2.setCredentials(cred);
      await expect(oAuth2.refreshUserAccessToken()).rejects.toHaveProperty('name', 'error');
    });

    it('throws error on refreshToken if authToken or client token are not defined', async () => {
      const oAuth2 = new OAuth2(config, req);
      await expect(oAuth2.refreshToken())
        .rejects.toThrowError(new Error('Missing credentials. To refresh a token an application access token or user access token must be already set.'));
    });

    it('calls refreshAuthToken', async () => {
      const oAuth2 = new OAuth2(config, req);
      oAuth2.setCredentials(cred);
      await oAuth2.refreshToken();
      // @ts-ignore

      expect(req.postForm).toHaveBeenCalled();
      expect(req.postForm.mock.calls[0][1].grant_type).toBe('refresh_token');
    });

    it('calls refreshClientToken', async () => {
      const oAuth2 = new OAuth2(config, req);
      await oAuth2.setClientToken(cred);
      await oAuth2.refreshToken();
      // @ts-ignore

      expect(req.postForm).toHaveBeenCalled();
      expect(req.postForm.mock.calls[0][1].grant_type).toBe('client_credentials');
    });

    it('emits an refresh event', () => {
      const oAuth2 = new OAuth2(config, req);
      oAuth2.setCredentials({
        access_token: 'access_token',
        expires_in: 0,
        token_type: 'token_type',
        refresh_token: 'refresh_token',
        refresh_token_expires_in: 0
      });

      const refreshAuthToken = vi.fn();
      oAuth2.on('refreshAuthToken', refreshAuthToken);

      return oAuth2.refreshUserAccessToken().then(() => {
        expect(oAuth2.getUserAccessToken()).toBe('new_access_token');
  
        expect(refreshAuthToken).toHaveBeenCalled();
        expect(refreshAuthToken.mock.calls[0][0].access_token).toBe('new_access_token');
      });
    });
  });
});
