const https = require('https');
const fs = require('fs');
const path = require('path');

const urls = [
  'https://developer.ebay.com/api-docs/master/buy/browse/openapi/3/buy_browse_v1_oas3.json',
  'https://developer.ebay.com/api-docs/master/buy/deal/openapi/3/buy_deal_v1_oas3.json',
  'https://developer.ebay.com/api-docs/master/buy/feed/openapi/3/buy_feed_v1_beta_oas3.json',
  'https://developer.ebay.com/api-docs/master/buy/marketing/openapi/3/buy_marketing_v1_beta_oas3.json',
//  'https://developer.ebay.com/api-docs/master/buy/marketplace_insights/openapi/3/buy_marketplace_insights_v1_beta_oas3.json', N/A
  'https://developer.ebay.com/api-docs/master/buy/offer/openapi/3/buy_offer_v1_beta_oas3.json',
  'https://developer.ebay.com/api-docs/master/buy/order/openapi/3/buy_order_v2_oas3.json',
//  'https://developer.ebay.com/api-docs/master/cancellation/openapi/3/cancellation_oas3.json', post-order, custom spec
//  'https://developer.ebay.com/api-docs/master/case/openapi/3/case_oas3.json', post-order, custom spec
  'https://developer.ebay.com/api-docs/master/commerce/catalog/openapi/3/commerce_catalog_v1_beta_oas3.json',
  'https://developer.ebay.com/api-docs/master/commerce/charity/openapi/3/commerce_charity_v1_oas3.json',
  'https://developer.ebay.com/api-docs/master/commerce/identity/openapi/3/commerce_identity_v1_oas3.json',
  'https://developer.ebay.com/api-docs/master/commerce/media/openapi/3/commerce_media_v1_beta_oas3.json',
  'https://developer.ebay.com/api-docs/master/commerce/notification/openapi/3/commerce_notification_v1_oas3.json',
  'https://developer.ebay.com/api-docs/master/commerce/taxonomy/openapi/3/commerce_taxonomy_v1_oas3.json',
  'https://developer.ebay.com/api-docs/master/commerce/translation/openapi/3/commerce_translation_v1_beta_oas3.json',
  'https://developer.ebay.com/api-docs/master/developer/analytics/openapi/3/developer_analytics_v1_beta_oas3.json',
  'https://developer.ebay.com/api-docs/master/developer/key-management/openapi/3/developer_key_management_v1_oas3.json',
//  'https://developer.ebay.com/api-docs/master/inquiry/openapi/3/inquiry_oas3.json', post-order, custom spec
//  'https://developer.ebay.com/api-docs/master/return/openapi/3/return_oas3.json', post-order, custom spec
  'https://developer.ebay.com/api-docs/master/sell/account/openapi/3/sell_account_v1_oas3.json',
//  'https://developer.ebay.com/api-docs/master/sell/account/v2/openapi/3/sell_account_v2_oas3.json', static contract omits the SetUserPreferencesRequest schema (dangling $ref); fetch manually from developer.ebay.com/docs/fetch (rawSchema=true, browser session) instead
  'https://developer.ebay.com/api-docs/master/sell/analytics/openapi/3/sell_analytics_v1_oas3.json',
//  sell/compliance: API decommissioned by eBay 2026-03-30 (docs and spec removed)
  'https://developer.ebay.com/api-docs/master/sell/feed/openapi/3/sell_feed_v1_oas3.json',
  'https://developer.ebay.com/api-docs/master/sell/finances/openapi/3/sell_finances_v1_oas3.json',
  'https://developer.ebay.com/api-docs/master/sell/fulfillment/openapi/3/sell_fulfillment_v1_oas3.json',
  'https://developer.ebay.com/api-docs/master/sell/inventory/openapi/3/sell_inventory_v1_oas3.json',
//  'https://developer.ebay.com/api-docs/master/sell/listing/openapi/3/sell_listing_v1_beta_oas3.json', N/A
  'https://developer.ebay.com/api-docs/master/sell/logistics/openapi/3/sell_logistics_v1_oas3.json',
  'https://developer.ebay.com/api-docs/master/sell/marketing/openapi/3/sell_marketing_v1_oas3.json',
  'https://developer.ebay.com/api-docs/master/sell/metadata/openapi/3/sell_metadata_v1_oas3.json',
  'https://developer.ebay.com/api-docs/master/sell/negotiation/openapi/3/sell_negotiation_v1_oas3.json',
  'https://developer.ebay.com/api-docs/master/sell/recommendation/openapi/3/sell_recommendation_v1_oas3.json',
  'https://developer.ebay.com/api-docs/master/sell/stores/openapi/3/sell_stores_v1_oas3.json'
];

const outputDir = './specs';

// eBay sits behind Akamai Bot Manager: the first request 403s but sets
// bot-mitigation cookies (bm_ss/bm_s/bm_so), and a retry carrying those
// cookies is allowed through. Node's https does not persist cookies, so we
// keep a small shared jar and send a browser User-Agent.
const userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const cookies = {};

function cookieHeader() {
  return Object.entries(cookies).map(([name, value]) => `${name}=${value}`).join('; ');
}

function storeCookies(setCookie) {
  for (const entry of setCookie || []) {
    const pair = entry.split(';')[0];
    const eq = pair.indexOf('=');
    if (eq !== -1) {
      cookies[pair.slice(0, eq).trim()] = pair.slice(eq + 1).trim();
    }
  }
}

function request(url, redirectsLeft = 5) {
  return new Promise((resolve, reject) => {
    const headers = {
      'User-Agent': userAgent,
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'https://developer.ebay.com/'
    };
    const cookie = cookieHeader();
    if (cookie) {
      headers.Cookie = cookie;
    }

    https.get(url, { headers }, (response) => {
      storeCookies(response.headers['set-cookie']);

      const statusCode = response.statusCode;
      const location = response.headers.location;
      if (statusCode >= 300 && statusCode < 400 && location) {
        response.resume();
        if (redirectsLeft === 0) {
          reject(new Error(`too many redirects (last: ${location})`));
          return;
        }
        resolve(request(new URL(location, url).toString(), redirectsLeft - 1));
        return;
      }

      // Decode as UTF-8 up front. Concatenating raw Buffers into a string would corrupt any
      // multi-byte character that straddles a chunk boundary, and several specs contain them.
      response.setEncoding('utf8');
      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('error', reject);
      response.on('end', () => resolve({ statusCode, body: data }));
    }).on('error', reject);
  });
}

/**
 * The operationIds a spec declares, used to warn when a refresh silently drops operations.
 */
function operationIds(spec) {
  const ids = new Set();
  for (const methods of Object.values(spec.paths || {})) {
    for (const operation of Object.values(methods)) {
      if (operation && operation.operationId) {
        ids.add(operation.operationId);
      }
    }
  }
  return ids;
}

function readExistingSpec(filepath) {
  if (!fs.existsSync(filepath)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(filepath, 'utf8'));
  } catch (error) {
    return null;
  }
}

// Create output directory
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// Download a file
async function downloadFile(url) {
  const filename = path.basename(new URL(url).pathname);
  if (!filename.endsWith('.json')) {
    throw new Error(`refusing to write non-JSON filename "${filename}"`);
  }
  const filepath = path.join(outputDir, filename);

  let response = await request(url);
  // Retry once with the freshly-issued bot-mitigation cookies.
  if (response.statusCode === 403) {
    response = await request(url);
  }
  if (response.statusCode !== 200) {
    throw new Error(`HTTP ${response.statusCode}`);
  }

  // Akamai Bot Manager answers a blocked request with HTTP 200 and an HTML challenge page.
  // Parsing before writing keeps that from silently overwriting a good committed spec.
  let spec;
  try {
    spec = JSON.parse(response.body);
  } catch (error) {
    throw new Error(`response was not JSON (${response.body.length} bytes, starts with "${response.body.slice(0, 40).replace(/\s+/g, ' ')}")`);
  }
  if (!spec.paths) {
    throw new Error('response parsed as JSON but has no "paths" — not an OpenAPI document');
  }

  const previous = readExistingSpec(filepath);
  const dropped = previous
    ? [...operationIds(previous)].filter(id => !operationIds(spec).has(id))
    : [];

  fs.writeFileSync(filepath, response.body);
  return {filename, dropped};
}

// Download all files
async function downloadAll() {
  console.log(`Downloading ${urls.length} files to ${outputDir}/`);

  let success = 0;
  let failed = 0;
  const droppedOperations = [];

  for (const url of urls) {
    try {
      const {filename, dropped} = await downloadFile(url);
      console.log(`✓ ${filename}`);
      if (dropped.length) {
        droppedOperations.push({filename, dropped});
      }
      success++;
    } catch (error) {
      console.log(`✗ ${path.basename(new URL(url).pathname)} - ${error.message}`);
      failed++;
    }

    // Small delay between downloads
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  if (droppedOperations.length) {
    console.log('\n⚠ Operations that disappeared in this refresh — check whether the matching API');
    console.log('  class still implements them (npm test enforces that it must not):');
    for (const {filename, dropped} of droppedOperations) {
      console.log(`  ${filename}: ${dropped.join(', ')}`);
    }
  }

  console.log(`\nDone! Success: ${success}, Failed: ${failed}`);
  return failed;
}

downloadAll().then(failed => {
  process.exit(failed > 0 ? 1 : 0);
}).catch(error => {
  console.error(error);
  process.exit(1);
});
