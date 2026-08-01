import {beforeEach, describe, expect, it, vi} from 'vitest';
import ApiFactory from '../../src/api/apiFactory.js';
import type {IEBayApiRequest} from '../../src/request.js';
import type {eBayConfig} from '../../src/types/index.js';

describe('FactoryTest', () => {
  let config: eBayConfig;
  const request: IEBayApiRequest<any> = {
    get: vi.fn(),
    delete: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
    postForm: vi.fn(),
    instance: vi.fn()
  };

  beforeEach(() => {
    config = {appId: 'appId', certId: 'certId', sandbox: true, siteId: 0, devId: 'devId'};
  });

  it('Throws an error if siteId is not defined', () => {
    delete config.siteId;
    const factory = new ApiFactory(config, request);
    expect(factory.createTradingApi.bind(factory)).toThrowError(new Error('siteId is required for trading API.'));
  });
});
