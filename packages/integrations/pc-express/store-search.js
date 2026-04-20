/**
 * PC Express Store Search Adapter
 * Mock implementation — real PC Express has no public API.
 * In production this would call the actual PC Express store locator.
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

  const normalized = postalCode.trim().toUpperCase().replace(/\s+/, ' ');
  const limit = options.limit ?? 10;

  // Simulate async network call
  await new Promise((r) => setTimeout(r, 0));

  return {
    postalCode: normalized,
    stores: MOCK_STORES.slice(0, limit),
    _isMock: true,
  };
}

/**
 * Get a single store by ID.
 * @param {string} storeId
 * @returns {Promise<Store|null>}
 */
export async function getStoreById(storeId) {
  await new Promise((r) => setTimeout(r, 0));
  return storeIndex.get(storeId) ?? null;
}

/** Expose mock store list for seeding / testing */
export { MOCK_STORES };
