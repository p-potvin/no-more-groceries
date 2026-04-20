# API Contracts
## Product
PC Express Daily Grocery Deals SPA

## Version
MVP v1

## Status
Draft

## Owner
Architecture / Backend

## Purpose
Define the external read API contracts used by the React SPA.

These contracts are optimized for:
- fast read access
- precomputed outputs
- stable DTOs
- explicit stale-data signaling

---

# 1. General Conventions

## Base Path
`/api`

## Response Format
All successful responses must be JSON.

## Error Format
All failed responses should use a common shape:

```json
{
  "error": {
    "code": "string_code",
    "message": "human readable message",
    "details": {}
  }
}
```

## Common Error Codes
- `INVALID_INPUT`
- `NOT_FOUND`
- `STALE_DATA`
- `DATA_UNAVAILABLE`
- `INTERNAL_ERROR`

## Timestamps
Use ISO 8601 timestamps in UTC.

## Currency
All monetary fields use numeric decimal values in CAD unless otherwise specified.

---

# 2. Common DTO Fields

## StoreSummary
```json
{
  "id": "string",
  "banner": "string",
  "name": "string",
  "address": "string",
  "city": "string",
  "province": "string",
  "postalCode": "string"
}
```

## RefreshMetadata
```json
{
  "effectiveDate": "2026-04-19",
  "refreshedAt": "2026-04-19T10:00:00Z",
  "isStale": false,
  "sourceRunId": "string"
}
```

## MoneyLine
```json
{
  "unitPrice": 4.99,
  "lineTotal": 9.98,
  "currency": "CAD"
}
```

---

# 3. GET /api/stores

## Purpose
Return nearby stores for a postal code.

## Query Parameters
- `postalCode` (required, string)

## Example Request
`GET /api/stores?postalCode=H2X1Y4`

## Success Response
```json
{
  "postalCode": "H2X1Y4",
  "stores": [
    {
      "id": "12345",
      "banner": "MAXI",
      "name": "Maxi Montréal Example",
      "address": "123 Example St",
      "city": "Montréal",
      "province": "QC",
      "postalCode": "H2X1Y4"
    }
  ]
}
```

## Validation Rules
- reject empty postal code
- normalize spaces/casing before lookup

## Error Cases
- invalid postal code format → `400 INVALID_INPUT`
- no stores found → `200` with empty `stores` array

---

# 4. GET /api/deals

## Purpose
Return precomputed ranked daily deals for a selected store.

## Query Parameters
- `storeId` (required, string)
- `limit` (optional, integer)

## Example Request
`GET /api/deals?storeId=12345&limit=20`

## Success Response
```json
{
  "store": {
    "id": "12345",
    "banner": "MAXI",
    "name": "Maxi Montréal Example",
    "address": "123 Example St",
    "city": "Montréal",
    "province": "QC",
    "postalCode": "H2X1Y4"
  },
  "refresh": {
    "effectiveDate": "2026-04-19",
    "refreshedAt": "2026-04-19T10:00:00Z",
    "isStale": false,
    "sourceRunId": "run_2026_04_19_01"
  },
  "scoringVersion": "deal-score-v1",
  "items": [
    {
      "productId": "prod_001",
      "name": "Store Brand Milk 2L",
      "category": "dairy",
      "currentPrice": 3.99,
      "regularPrice": 4.99,
      "discountPct": 0.2004,
      "dealScore": 78.4,
      "discountScore": 40,
      "valueScore": 82,
      "basketRelevanceScore": 100,
      "normalizedUnitPrice": 2.00,
      "normalizedUnitLabel": "per L",
      "relevanceTier": "A",
      "confidenceLevel": "high",
      "explanationSummary": "High discount and better-than-average unit price for a core weekly staple."
    }
  ]
}
```

## Notes
- `limit` default: 20
- items are returned highest score first

## Error Cases
- unknown store → `404 NOT_FOUND`
- no computed output → `404 DATA_UNAVAILABLE`

---

# 5. GET /api/average-cart

## Purpose
Return the precomputed benchmark weekly grocery cart estimate for a store and household size.

## Query Parameters
- `storeId` (required, string)
- `householdSize` (required, integer)

## Example Request
`GET /api/average-cart?storeId=12345&householdSize=4`

## Success Response
```json
{
  "store": {
    "id": "12345",
    "banner": "MAXI",
    "name": "Maxi Montréal Example",
    "address": "123 Example St",
    "city": "Montréal",
    "province": "QC",
    "postalCode": "H2X1Y4"
  },
  "refresh": {
    "effectiveDate": "2026-04-19",
    "refreshedAt": "2026-04-19T10:00:00Z",
    "isStale": false,
    "sourceRunId": "run_2026_04_19_01"
  },
  "basketVersion": "benchmark-v1",
  "householdSize": 4,
  "coverageScore": 0.88,
  "total": 164.73,
  "currency": "CAD",
  "lineItems": [
    {
      "category": "dairy",
      "canonicalItem": "milk",
      "matchedProductId": "prod_001",
      "matchedProductName": "Store Brand Milk 2L",
      "matchType": "exact",
      "unitType": "L",
      "quantity": 4,
      "unitPrice": 3.99,
      "lineTotal": 15.96,
      "pricingSourceDate": "2026-04-19"
    }
  ]
}
```

## Validation Rules
- `householdSize` must be integer >= 1
- max supported upper bound can be enforced by implementation, but default should accept reasonable custom sizes

## Error Cases
- invalid household size → `400 INVALID_INPUT`
- missing computed output → `404 DATA_UNAVAILABLE`

---

# 6. GET /api/recommended-cart

## Purpose
Return the precomputed recommended 7-day grocery cart for a store and household size.

## Query Parameters
- `storeId` (required, string)
- `householdSize` (required, integer)

## Example Request
`GET /api/recommended-cart?storeId=12345&householdSize=4`

## Success Response
```json
{
  "store": {
    "id": "12345",
    "banner": "MAXI",
    "name": "Maxi Montréal Example",
    "address": "123 Example St",
    "city": "Montréal",
    "province": "QC",
    "postalCode": "H2X1Y4"
  },
  "refresh": {
    "effectiveDate": "2026-04-19",
    "refreshedAt": "2026-04-19T10:00:00Z",
    "isStale": false,
    "sourceRunId": "run_2026_04_19_01"
  },
  "policyVersion": "weekly-cart-policy-v1",
  "basketVersion": "benchmark-v1",
  "householdSize": 4,
  "confidenceLevel": "high",
  "categoryCoverage": {
    "produce": true,
    "dairy": true,
    "grains": true,
    "protein": true,
    "pantry": true,
    "snacks": true,
    "beverages": true,
    "householdEssentials": false
  },
  "total": 172.64,
  "currency": "CAD",
  "lineItems": [
    {
      "category": "protein",
      "canonicalItem": "chicken",
      "matchedProductId": "prod_200",
      "matchedProductName": "Chicken Thighs Family Pack",
      "matchType": "exact",
      "quantity": 2,
      "unitPrice": 11.49,
      "lineTotal": 22.98,
      "normalizedUnitLabel": "per pack",
      "selectionExplanation": "Selected as the lowest-cost acceptable chicken option for the weekly household target."
    },
    {
      "category": "produce",
      "canonicalItem": "lettuce",
      "matchedProductId": "prod_350",
      "matchedProductName": "Romaine Hearts 3 Pack",
      "matchType": "substitute",
      "quantity": 1,
      "unitPrice": 4.99,
      "lineTotal": 4.99,
      "normalizedUnitLabel": "per pack",
      "substitutionReason": "Standard lettuce unavailable; selected acceptable salad-base substitute.",
      "selectionExplanation": "Chosen as the closest low-cost salad-base substitute."
    }
  ]
}
```

## Error Cases
- invalid household size → `400 INVALID_INPUT`
- no valid recommended cart output → `404 DATA_UNAVAILABLE`

---

# 7. GET /api/store-compare

## Purpose
Compare nearby stores using the same household-size assumptions.

## Query Parameters
- `postalCode` (required, string)
- `householdSize` (required, integer)

## Example Request
`GET /api/store-compare?postalCode=H2X1Y4&householdSize=4`

## Success Response
```json
{
  "postalCode": "H2X1Y4",
  "householdSize": 4,
  "refresh": {
    "effectiveDate": "2026-04-19",
    "refreshedAt": "2026-04-19T10:00:00Z",
    "isStale": false,
    "sourceRunId": "run_2026_04_19_01"
  },
  "stores": [
    {
      "store": {
        "id": "12345",
        "banner": "MAXI",
        "name": "Maxi Montréal Example",
        "address": "123 Example St",
        "city": "Montréal",
        "province": "QC",
        "postalCode": "H2X1Y4"
      },
      "averageCartTotal": 164.73,
      "recommendedCartTotal": 172.64,
      "dealSignal": 74.2,
      "coverageScore": 0.88,
      "confidenceLevel": "high",
      "rank": 1
    }
  ]
}
```

## Notes
- `dealSignal` is an aggregate summary of current store-level deal quality for comparison use
- rank ordering should default to lowest valid average cart total, with confidence-aware handling

## Error Cases
- invalid postal code or household size → `400 INVALID_INPUT`
- no stores found → `200` with empty `stores` array

---

# 8. Optional Health Endpoint

## GET /api/health

### Purpose
Basic operational readiness check.

### Response
```json
{
  "ok": true,
  "service": "api",
  "timestamp": "2026-04-19T10:00:00Z"
}
```

---

# 9. Validation Notes

## Postal Code
- normalize whitespace and case
- format validation is implementation-specific by target geography, but MVP should at minimum reject empty values

## Household Size
- integer only
- minimum `1`
- suggested maximum soft cap for MVP: `12`

## Store ID
- opaque string from normalized store record

---

# 10. Stale Data Behavior

## Rule
Computed endpoints may return stale data when the latest refresh fails but a previous successful output exists.

## Contract Requirement
When stale output is returned:
- `refresh.isStale = true`
- `effectiveDate` should reflect the source date of the output actually returned

## Not an Error by Default
Returning stale but valid output should still be a `200` response.

---

# 11. Pagination and Limits

## MVP
Pagination is not required for the core endpoints.

## Optional Limit Parameter
Only `GET /api/deals` may support `limit` in MVP.

Recommended default max:
- `50`

---

# 12. Version Metadata Requirements

Computed endpoints should include version metadata where applicable:
- deals → `scoringVersion`
- average cart → `basketVersion`
- recommended cart → `policyVersion`, `basketVersion`

This allows frontend display and future compatibility handling.

---

# 13. Backward Compatibility Rule

Once the SPA is wired to these response DTOs, changes to field names or required structures should be treated as contract changes and versioned intentionally.

Avoid silent shape changes.

---

# 14. Final Summary

The MVP API surface is intentionally narrow:
- one lookup endpoint for nearby stores
- three primary output endpoints for deals and carts
- one comparison endpoint

All are read-optimized and designed to expose:
- store context
- refresh context
- version metadata
- deterministic computed outputs
