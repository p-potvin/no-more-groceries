import http from 'node:http';
import { URL } from 'node:url';
import { buildAverageCart, buildComparison, buildRecommendedCart, dealsByStore, stores } from './mock-data.mjs';

const port = Number(process.env.PORT || 8787);

function json(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(JSON.stringify(payload));
}

const server = http.createServer((req, res) => {
  if (!req.url) {
    return json(res, 400, { error: 'Missing URL' });
  }

  const url = new URL(req.url, `http://localhost:${port}`);
  const pathname = url.pathname;

  if (pathname === '/api/health') {
    return json(res, 200, {
      ok: true,
      service: 'no-more-groceries-api',
      refreshTimestamp: new Date().toISOString(),
    });
  }

  if (pathname === '/api/stores') {
    const postalCode = url.searchParams.get('postalCode') || 'H2X 1Y4';
    return json(res, 200, {
      postalCode,
      stores,
      refreshTimestamp: new Date().toISOString(),
    });
  }

  if (pathname === '/api/deals') {
    const storeId = url.searchParams.get('storeId') || stores[0].id;
    return json(res, 200, {
      storeId,
      deals: dealsByStore[storeId] || [],
      refreshTimestamp: new Date().toISOString(),
    });
  }

  if (pathname === '/api/average-cart') {
    const storeId = url.searchParams.get('storeId') || stores[0].id;
    const householdSize = Number(url.searchParams.get('householdSize') || 2);
    return json(res, 200, buildAverageCart(storeId, householdSize));
  }

  if (pathname === '/api/recommended-cart') {
    const storeId = url.searchParams.get('storeId') || stores[0].id;
    const householdSize = Number(url.searchParams.get('householdSize') || 2);
    return json(res, 200, buildRecommendedCart(storeId, householdSize));
  }

  if (pathname === '/api/store-compare') {
    const postalCode = url.searchParams.get('postalCode') || 'H2X 1Y4';
    const householdSize = Number(url.searchParams.get('householdSize') || 2);
    return json(res, 200, {
      postalCode,
      stores: buildComparison(postalCode, householdSize),
      refreshTimestamp: new Date().toISOString(),
    });
  }

  return json(res, 404, { error: 'Not found' });
});

server.listen(port, () => {
  console.log(`Mock API listening on http://localhost:${port}`);
});
