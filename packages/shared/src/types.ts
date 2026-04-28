// Store types
export interface StoreSummary {
  id: string;
  banner: string;
  name: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
}

export interface RefreshMetadata {
  effectiveDate: string;
  refreshedAt: string;
  isStale: boolean;
  sourceRunId: string;
}

// Product types
export interface NormalizedProduct {
  productId: string;
  name: string;
  brand: string;
  category: string;
  packageSize: string;
  unit: string;
  regularPrice: number | null;
  salePrice: number | null;
  currentPrice: number;
  promoMetadata: Record<string, unknown> | null;
}

// Deal types
export interface ScoredDeal {
  productId: string;
  name: string;
  category: string;
  currentPrice: number;
  regularPrice: number | null;
  discountPct: number | null;
  dealScore: number;
  discountScore: number;
  valueScore: number;
  basketRelevanceScore: number;
  normalizedUnitPrice: number | null;
  normalizedUnitLabel: string | null;
  relevanceTier: 'A' | 'B' | 'C' | 'D' | 'E';
  confidenceLevel: 'high' | 'medium' | 'low';
  explanationSummary: string;
}

// Average cart types
export interface BenchmarkLineItem {
  category: string;
  canonicalItem: string;
  matchedProductId: string;
  matchedProductName: string;
  matchType: 'exact' | 'substitute' | 'fallback';
  unitType: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  pricingSourceDate: string;
  substitutionReason?: string;
}

export interface AverageCartResult {
  store: StoreSummary;
  refresh: RefreshMetadata;
  basketVersion: string;
  householdSize: number;
  coverageScore: number;
  total: number;
  currency: string;
  lineItems: BenchmarkLineItem[];
}

// Weekly cart types
export interface WeeklyCartLineItem {
  category: string;
  canonicalItem: string;
  matchedProductId: string;
  matchedProductName: string;
  matchType: 'exact' | 'substitute' | 'fallback';
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  normalizedUnitLabel: string;
  substitutionReason?: string;
  selectionExplanation: string;
}

export interface WeeklyCartResult {
  store: StoreSummary;
  refresh: RefreshMetadata;
  policyVersion: string;
  basketVersion: string;
  householdSize: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  categoryCoverage: Record<string, boolean>;
  total: number;
  currency: string;
  lineItems: WeeklyCartLineItem[];
}

// Store comparison types
export interface StoreComparisonEntry {
  store: StoreSummary;
  averageCartTotal: number;
  recommendedCartTotal: number;
  dealSignal: number;
  coverageScore: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  rank: number;
}

export interface StoreCompareResult {
  postalCode: string;
  householdSize: number;
  refresh: RefreshMetadata;
  stores: StoreComparisonEntry[];
}

// API response wrappers
export interface StoresResponse {
  postalCode: string;
  stores: StoreSummary[];
}

export interface DealsResponse {
  store: StoreSummary;
  refresh: RefreshMetadata;
  scoringVersion: string;
  items: ScoredDeal[];
}

// Error type
export interface ApiError {
  error: {
    code: 'INVALID_INPUT' | 'NOT_FOUND' | 'STALE_DATA' | 'DATA_UNAVAILABLE' | 'INTERNAL_ERROR';
    message: string;
    details?: Record<string, unknown>;
  };
}

// Household size constants
export const STANDARD_HOUSEHOLD_SIZES = [1, 2, 4, 6] as const;
export const MAX_HOUSEHOLD_SIZE = 12;
export const MIN_HOUSEHOLD_SIZE = 1;
