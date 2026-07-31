import {describe, expect, it, vi} from 'vitest';
import Restful from '../../../src/api/restful/index.js';
import Auth from '../../../src/auth/index.js';
import type {IEBayApiRequest} from '../../../src/request.js';

import buyTests from './buy/index.js';
import commerceTests from './commerce/index.js';
import developerTests from './developer/index.js';
import postOrderTests from './postOrder/index.js';
import sellTests from './sell/index.js';

const allTests = {
  Buy: buyTests,
  Commerce: commerceTests,
  Developer: developerTests,
  Sell: sellTests,
  PostOrder: postOrderTests
};

const appConfig = {appId: 'appId', certId: 'certId', sandbox: false, siteId: 77};

function createReq(): IEBayApiRequest<any> {
  return {
    get: vi.fn().mockResolvedValue({data: {}}),
    delete: vi.fn().mockResolvedValue({data: {}}),
    put: vi.fn().mockResolvedValue({data: {}}),
    patch: vi.fn().mockResolvedValue({data: {}}),
    post: vi.fn().mockResolvedValue({data: {}}),
    postForm: vi.fn().mockResolvedValue({data: {}}),
    instance: vi.fn().mockResolvedValue({data: {}})
  };
}

/**
 * Method names declared on the Restful base class. These are infrastructure, not eBay operations,
 * so they are never expected to appear in a spec.
 */
const inheritedMembers = new Set(Object.getOwnPropertyNames(Restful.prototype));

/**
 * The public methods an API class declares itself, ignoring getters such as `basePath`.
 */
function declaredMethods(RestfulApi: any): string[] {
  const {prototype} = RestfulApi;
  return Object.getOwnPropertyNames(prototype).filter(name => {
    if (name === 'constructor' || inheritedMembers.has(name)) {
      return false;
    }
    const descriptor = Object.getOwnPropertyDescriptor(prototype, name);
    return typeof descriptor?.value === 'function';
  });
}

const request = createReq();

const auth = new Auth(appConfig, request);
auth.OAuth2.setClientToken({
  access_token: 'token',
  expires_in: 1,
  token_type: 'test'
});

describe('Open API Tests', () => {
  Object.entries(allTests).forEach(([name, tests]) => {
    describe('API > restful > ' + name, () => {
      tests.forEach((Oas, RestfulApi) => {
        it('should match name with id', () => {
          expect(RestfulApi.id).toBe(RestfulApi.name);
        });

        const api = new RestfulApi(appConfig, request, auth);

        if (Oas.servers) {
          it('"' + name + ':' + RestfulApi.name + '" should return url', () => {
            expect(
              Oas.servers.map((server: any) => server.url.replace('{basePath}', server.variables.basePath.default))
            ).toContain(api.baseUrl);
          });

          it('"' + name + ':' + RestfulApi.name + '" should return correct path', () => {
            expect(api.basePath).toBe(
              Oas.servers[0].variables.basePath.default
            );
          });
        }

        it(`"${name}:${RestfulApi.name}" should not implement methods that are absent from the spec`, () => {
          const operationIds = new Set<string>();
          Object.values(Oas.paths).forEach((endpoint: any) => {
            Object.values(endpoint).forEach((call: any) => {
              if (call && call.operationId) {
                operationIds.add(call.operationId);
              }
            });
          });

          const orphaned = declaredMethods(RestfulApi).filter(method => !operationIds.has(method));

          expect(
            orphaned,
            `"${RestfulApi.name}" implements [${orphaned.join(', ')}], which eBay no longer ` +
            'publishes. Remove the method, or restore the operation to the spec if it is still supported.'
          ).toEqual([]);
        });

        Object.keys(Oas.paths).forEach((path: any) => {
          Object.keys(Oas.paths[path]).forEach(method => {
            const endpoint = Oas.paths[path];
            const call = endpoint[method];
            if (!call.operationId || call.deprecated) {
              return;
            }
            const queryParams = path.match(/(?<={).+?(?=})/gi);
            const paramsInPath = queryParams ? queryParams : [];
            const paramsInHeader = call.parameters
              ? call.parameters.filter((p: any) => p.in === 'header')
              : [];
            const paramsInBody = (call.parameters
              ? call.parameters.filter((p: any) => p.in === 'body')
              : []).reduce((result: any, p: any) => {
              result[p.name] = p.name;
              return result;
            }, {});
            const args = paramsInPath
              .map((paramName: any) => '{' + paramName + '}')
              .concat(paramsInHeader.map((p: any) => p.name))
              .concat(paramsInBody);

            const req: any = createReq();

            const restApi = new RestfulApi(appConfig, req, auth);

            it(`"${name}:${RestfulApi.name}" should implement this method (${path}). `, () => {
              expect(
                restApi[call.operationId],
                'expected to have "' + call.operationId + '" implemented.'
              ).toBeTypeOf('function');
            });

            it(`"${name}:${RestfulApi.name}:${call.operationId}" call correct method ${method} (${path}).`, () => {
              return restApi[call.operationId](...args).then(() => {
                expect(req[method]).toHaveBeenCalledOnce();
              });
            });

            it(`"${name}:${RestfulApi.name}:${call.operationId}" calls correct url (${path}).`, () => {
              return restApi[call.operationId](...args).then(() => {
                expect(decodeURI(req[method].mock.calls[0][0])).toBe(decodeURI(encodeURI(restApi.baseUrl + path)));
              });
            });
          });
        });
      });
    });
  });
});
