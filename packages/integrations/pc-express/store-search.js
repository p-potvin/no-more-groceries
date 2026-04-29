import { ApifyClient } from 'apify-client';
import fs from 'fs';
import path from 'path';

const client = new ApifyClient({
  token: process.env.APIFY_TOKEN || process.env.APIFY_API_KEY,
});

// Simple file-based cache for Apify responses
const CACHE_DIR = path.join(process.cwd(), '.cache');
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

function getCache(key) {
  try {
    const file = path.join(CACHE_DIR, `${key}.json`);
    if (fs.existsSync(file)) {
      const stats = fs.statSync(file);
      if (Date.now() - stats.mtimeMs < CACHE_TTL_MS) {
        return JSON.parse(fs.readFileSync(file, 'utf8'));
      }
    }
  } catch (err) {
    // Ignore cache read errors
  }
  return null;
}

function setCache(key, data) {
  try {
    const file = path.join(CACHE_DIR, `${key}.json`);
    fs.writeFileSync(file, JSON.stringify(data), 'utf8');
  } catch (err) {
    // Ignore cache write errors
  }
}

/**
 * PC Express Store Search Adapter
 * Uses Apify to auto-discover PC Express retail locations via Google Maps
});

/**
 * PC Express Store Search Adapter
 * Uses Apify to auto-discover PC Express retail locations via Google Maps.
 */

/**
 * @typedef {Object} Store
 * @property {string} id
 * @property {string} banner
 * @property {string} name
 * @property {string} address
 * @property {string} city
 * @property {string} province
 * @property {string} postalCode
 */

/** @type {Store[]} */
const MOCK_STORES = [
  {
    id: 'rcss-montreal-central',
    banner: 'SUPERSTORE',
    name: 'Real Canadian Superstore Montréal Central',
    address: '250 Av. des Canadiens-de-Montréal',
    city: 'Montréal',
    province: 'QC',
    postalCode: 'H3B 2S2',
  },
  {
    id: 'nofrills-plateau',
    banner: 'NOFRILLS',
    name: 'No Frills Le Plateau',
    address: '455 Rue Rachel E',
    city: 'Montréal',
    province: 'QC',
    postalCode: 'H2J 2G9',
  },
  {
    id: 'provigo-mile-end',
    banner: 'PROVIGO',
    name: 'Provigo Mile End',
    address: '50 Av. du Parc',
    city: 'Montréal',
    province: 'QC',
    postalCode: 'H2W 1B3',
  },
  {
    id: 'maxi-rosemont',
    banner: 'MAXI',
    name: 'Maxi Rosemont',
    address: '4475 Rue Beaubien E',
    city: 'Montréal',
    province: 'QC',
    postalCode: 'H1T 1T9',
  },
  {
    id: 'nofrills-verdun',
    banner: 'NOFRILLS',
    name: 'No Frills Verdun',
    address: '400 Av. de Verdun',
    city: 'Verdun',
    province: 'QC',
    postalCode: 'H4G 1M4',
  },
];

const storeIndex = new Map(MOCK_STORES.map((s) => [s.id, s]));

/**
 * Search for nearby PC Express stores by postal code.
 * @param {string} postalCode
 * @param {Object} [options]
 * @param {number} [options.limit=10]
 * @returns {Promise<{ stores: Store[], postalCode: string, _isMock: true }>}
 */
export async function searchStoresByPostalCode(postalCode, options = {}) {
    if (!postalCode || postalCode.trim() === '') {
      const err = new Error('postalCode is required');
      err.code = 'INVALID_INPUT';
      throw err;
    }

    const normalized = postalCode.trim().toUpperCase().replace(/\s+/g, '');
    const limit = options.limit ?? 10;
    const fallbackLimit = limit;
    
    try {
      if (process.env.APIFY_TOKEN || process.env.APIFY_API_KEY) {
        const cacheKey = `stores_${normalized}`;
        const cachedStores = getCache(cacheKey);

        if (cachedStores) {
          console.log(`[apify] Returning cached Loblaws/PC Express stores near ${normalized}`);
          return {
            postalCode: normalized,
            stores: cachedStores.slice(0, limit),
            _isMock: false
          };
        }

        console.log(`[apify] Searching Loblaws/PC Express stores near ${normalized} using compass/crawler-google-places`);
        
        const run = await client.actor("compass/crawler-google-places").call({
          searchStringsArray: ["Real Canadian Superstore", "No Frills", "Provigo", "Maxi", "Loblaws"],
          locationQuery: `${normalized} Canada`,
          language: "en",
          maxCrawledPlacesPerSearch: limit,
          scrapeContacts: false,
          scrapePlaceDetailPage: false,
          includeWebResults: false,
          scrapeReviewsPersonalData: false,
          maxImages: 0,
          maxReviews: 0,
          maxQuestions: 0
        });

        const { items } = await client.dataset(run.defaultDatasetId).listItems();
        
        if (items && items.length > 0) {
          const mappedStores = items.map((p) => {
            let banner = 'LOBLAWS';
            const nameUp = p.title?.toUpperCase() || '';
            if (nameUp.includes('NO FRILLS')) banner = 'NOFRILLS';
            else if (nameUp.includes('SUPERSTORE')) banner = 'SUPERSTORE';
            else if (nameUp.includes('PROVIGO')) banner = 'PROVIGO';
            else if (nameUp.includes('MAXI')) banner = 'MAXI';

            return {
              id: p.placeId || `apify-${p.cid}`,
              banner,
              name: p.title,
              address: p.street,
              city: p.city,
              province: p.state,
              postalCode: p.postalCode,
            };
          });

          setCache(cacheKey, mappedStores);

          return {
            postalCode: normalized,
            stores: mappedStores.slice(0, limit),
            _isMock: false
          };
        }
        console.log(`[apify] No live stores found via Apify for ${normalized}, falling back to static mocks.`);
      }
    } catch (err) {
      console.error(`[apify] Agent run failed during live store search: ${err.message}`);
    }

    // Simulate async network call
    await new Promise((r) => setTimeout(r, 0));

    const sortedStores = [...MOCK_STORES].sort((a, b) => {
      const pcA = (a.postalCode || '').replace(/\s+/g, '').toUpperCase();
      const pcB = (b.postalCode || '').replace(/\s+/g, '').toUpperCase();
      
      let matchA = 0;
      while (matchA < normalized.length && matchA < pcA.length && normalized[matchA] === pcA[matchA]) matchA++;
      
      let matchB = 0;
      while (matchB < normalized.length && matchB < pcB.length && normalized[matchB] === pcB[matchB]) matchB++;
      
      if (matchA !== matchB) {
        return matchB - matchA; // Sort by longest match descending
      }
      return (a.name || '').localeCompare(b.name || '');
    });

    return {
      postalCode: normalized,
      stores: sortedStores.slice(0, fallbackLimit),
      _isMock: true,
    };
  }

export async function getStoreById(storeId) {
  await new Promise((r) => setTimeout(r, 0));
  return storeIndex.get(storeId) ?? null;
}

/** Expose mock store list for seeding / testing */
export { MOCK_STORES };
