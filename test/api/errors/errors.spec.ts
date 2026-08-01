import {describe, expect, it} from 'vitest';
import {
  checkEBayTraditionalResponse,
  EbayApiError,
  EBayApiError,
  EBayError,
  extractEBayError,
  handleEBayError
} from '../../../src/errors/index.js';
import {readJSONSync} from '../jsonfile.js';

function catchError(fn: () => void): unknown {
  try {
    fn();
  } catch (error) {
    return error;
  }
  throw new Error('Expected the call to throw');
}

describe('eBay Errors', () => {
  const errors = readJSONSync('./errors.json', import.meta.url);

  Object.entries(errors).forEach(([key, payload]: [string, any]) => {
    it('maps errors correctly for ' + key, () => {
      const result = {
        response: {
          data: payload
        }
      };

      const {message, description} = extractEBayError(result);
      expect(message).toBe('Error Message');
      if (description) {
        expect(description).toBe('description');
      }
    });
  });

  it('Throw correct error chain', () => {
    const traditional = catchError(() => handleEBayError({
      response: {
        data: errors.traditional
      }
    }));
    expect(traditional).toBeInstanceOf(EBayApiError);
    expect(traditional).toHaveProperty('errorCode', 930);

    expect(() => handleEBayError({
      response: {
        data: errors.oauth
      }
    })).toThrow(EbayApiError);

    const restful = catchError(() => handleEBayError({
      response: {
        data: errors.restful
      }
    }));
    expect(restful).toBeInstanceOf(EBayError);
    expect(restful).toHaveProperty('errorCode', 1);
  });

  it('Does not throw if the error is warning', () => {
    expect(() => checkEBayTraditionalResponse({}, {
      'Timestamp': '2021-10-23T19:11:42.335Z',
      'Ack': 'Warning',
      'Errors': {
        'ShortMessage': 'Error Message',
        'LongMessage': 'description',
        'ErrorCode': 930,
        'SeverityCode': 'Error',
        'ErrorClassification': 'RequestError'
      },
      'Version': 1177,
      'Build': 'E1177_CORE_APIMSG_19110890_R1'
    })).not.toThrow();
  })

});