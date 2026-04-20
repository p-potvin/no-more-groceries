# Product Requirements Document
## Product
PC Express Daily Grocery Deals SPA

## Version
MVP v1

## Status
Draft

## Owner
Product

## Summary
Build a React single-page application that refreshes daily using PC Express data and helps users answer three questions for a selected store:

1. What are the best grocery deals today?
2. How much will an average weekly grocery cart cost for my household size?
3. What is a recommended pre-filled 7-day grocery cart for `X` people?

The application must support store selection in two ways:
- by nearby stores based on postal code
- by manual store selection from a list

The application will rely on a backend that performs daily refresh, normalization, precomputation, and API serving.

---

# 1. Problem Statement

Users can browse grocery products store by store, but it is harder to quickly understand:
- which deals are actually worth buying
- how expensive a weekly grocery run will be
- what a practical weekly cart should look like for a household size

Raw retailer search results are not enough because they do not provide:
- normalized deal ranking
- benchmark cart pricing
- household-size-aware weekly recommendations
- fast comparison across nearby stores

This product solves that by turning store and product data into a daily consumer dashboard.

---

# 2. Goals

## Primary Goals
- Show best daily deals for a selected store.
- Show average weekly grocery cart cost for household size `X`.
- Show a recommended 7-day grocery cart for household size `X`.
- Allow store selection via postal code or manual selection.
- Refresh data automatically once per day.
- Make results fast to load on mobile and desktop.

## Secondary Goals
- Enable comparison of nearby stores on weekly cost and deal quality.
- Make outputs explainable so users understand why items were selected or ranked.
- Build the system so pricing and cart rules can evolve without redesigning the app.

---

# 3. Non-Goals

The MVP will not include:
- checkout handoff
- user accounts
- persistent preferences
- advanced meal planning
- precise dietary personalization
- real-time stock guarantees
- push notifications
- live per-minute price updates
- loyalty personalization
- coupon clipping
- basket editing synced back to retailer cart

---

# 4. Users

## Primary User
A shopper who wants to reduce weekly grocery spend and make faster store decisions.

## Example User Needs
- “Show me the best value items at my nearby store.”
- “Estimate my weekly grocery total for 2 people.”
- “Give me a realistic 7-day cart for a family of 4.”
- “Compare stores near me before I choose one.”

---

# 5. Core User Stories

## Store Selection
- As a user, I can enter a postal code and view nearby PC Express stores.
- As a user, I can manually choose a store from a list.
- As a user, I can switch stores and immediately see updated pricing outputs.

## Deals
- As a user, I can see the best daily deals for my selected store.
- As a user, I can understand why a deal is ranked highly.

## Average Cart
- As a user, I can enter household size `X` and see estimated weekly grocery cost.
- As a user, I can inspect the items and quantities behind that estimate.

## Recommended Cart
- As a user, I can generate a recommended 7-day cart for household size `X`.
- As a user, I can see item quantities, substitutions, and total estimate.

## Comparison
- As a user, I can compare nearby stores using the same household size assumptions.

---

# 6. MVP Scope

## Included
- Postal-code-based nearby store search
- Manual store selection
- Daily best deals by store
- Average weekly grocery cart by household size
- Recommended 7-day weekly cart by household size
- Nearby store comparison
- Daily refresh timestamp and stale-data handling
- Responsive React SPA
- Backend APIs backed by precomputed daily outputs

## Excluded
- Authentication
- Saved carts
- Checkout submission
- Live retailer cart syncing
- Historical price charts
- Dietary presets beyond simple default assumptions
- Personalized recommendations based on prior behavior

---

# 7. Product Definitions

## Best Deals
A ranked list of products for a selected store computed from:
- discount percentage
- normalized unit price
- relevance to a benchmark weekly basket

The ranking must avoid low-value noise such as misleading “deals” on non-useful or incomparable items.

## Average Grocery Cart
A benchmark weekly basket for a household size `X`, using deterministic category quotas and item mappings. It is not derived from arbitrary user carts.

## Recommended 7-Day Cart
A practical weekly cart for a household size `X`, generated using:
- category coverage rules
- quantity scaling rules
- store-specific product matching
- lowest acceptable substitute logic

---

# 8. Functional Requirements

## 8.1 Store Selection

### Requirements
- User can enter postal code.
- System returns nearby stores with normalized metadata.
- User can manually choose a store from available results or a list.
- Selected store becomes active context across views.

### Acceptance Criteria
- Postal code search returns zero, one, or many stores.
- UI clearly shows selected store name and banner.
- Store switching updates all deal and cart data.

---

## 8.2 Best Deals View

### Requirements
- Show ranked deal list for selected store.
- Show current price and, when available, regular price.
- Show savings indicators and ranking explanation.
- Support category labels if available.
- Show refresh date.

### Acceptance Criteria
- List is precomputed daily.
- Each deal includes enough metadata to explain ranking.
- Empty state appears when deal coverage is insufficient.
- Stale-data warning appears when latest refresh failed or is outdated.

---

## 8.3 Average Cart View

### Requirements
- User can choose household size.
- System returns weekly benchmark cart estimate for selected store and household size.
- Show total estimate and itemized breakdown.
- Show substitutions where exact benchmark items are unavailable.

### Acceptance Criteria
- Supports household sizes: 1, 2, 4, 6, and custom `X`.
- Output includes quantities, unit pricing, and line totals.
- Total is reproducible for same store/date/household size.

---

## 8.4 Recommended 7-Day Cart View

### Requirements
- User can choose household size.
- System returns precomputed weekly recommended cart for selected store and household size.
- Show itemized products, quantities, explanations, substitutions, and total estimate.

### Acceptance Criteria
- Cart covers a full week using deterministic baseline assumptions.
- Missing product matches trigger valid substitutions.
- Output is practical, category-balanced, and store-specific.

---

## 8.5 Store Comparison

### Requirements
- User can compare nearby stores using same household size.
- Show average cart total and a summary deal signal per store.
- Allow quick switch from comparison result into a chosen store view.

### Acceptance Criteria
- Comparison is normalized across stores.
- Results are based on same benchmark assumptions.
- Stores can be ranked by weekly total and/or deal quality.

---

## 8.6 Data Freshness

### Requirements
- System refreshes once daily.
- UI shows latest successful refresh timestamp.
- System falls back to last known good data when refresh fails.
- UI indicates stale data clearly.

### Acceptance Criteria
- Daily pipeline is idempotent.
- Failed refresh does not break read paths.
- Users can distinguish fresh vs stale results.

---

# 9. User Flows

## Flow A: Nearby Store Selection
1. User opens app.
2. User enters postal code.
3. App returns nearby stores.
4. User selects a store.
5. App loads:
   - best deals
   - average cart
   - recommended weekly cart

## Flow B: Manual Store Change
1. User opens current store selector.
2. User chooses another store from list.
3. App reloads all outputs for new store.

## Flow C: Household Size Change
1. User changes household size.
2. App reloads average cart and weekly cart.
3. Deals remain tied to store, unless deal relevance depends on household context in a future version.

## Flow D: Compare Stores
1. User requests comparison after postal code lookup.
2. App shows nearby stores ranked on weekly total and summary deal signal.
3. User selects a store to enter detailed dashboard.

---

# 10. UX Requirements

## Global
- Mobile-first layout
- Fast initial render
- Minimal friction from landing to useful output
- Persistent selected store in client state
- Clear refresh timestamp
- Clear empty/error/stale states

## Key Screens
- Landing / store selection
- Dashboard
- Best deals view
- Average cart view
- Recommended weekly cart view
- Store comparison view

## UI Requirements
- Selected store visible at all times
- Household size control easy to find
- Ranking explanations concise and readable
- Totals prominent
- Itemized details accessible without clutter

---

# 11. Data and Computation Requirements

## Store Data
Must capture:
- store id
- banner
- store name
- postal code
- address
- location metadata if available

## Product Data
Must capture where possible:
- product id
- name
- brand
- category
- package size
- unit
- regular price
- sale price
- promo metadata

## Computed Outputs
Must persist:
- daily ranked deals per store
- daily average cart outputs per store and household size
- daily weekly cart outputs per store and household size

---

# 12. Business Logic Requirements

## Deal Ranking
The system should rank deals using weighted components:
- discount percent
- normalized value by unit/size
- benchmark basket relevance

The output must be explainable, not just scored.

## Benchmark Basket
The system should use a deterministic benchmark basket model defined separately in `benchmark-basket.md`.

## Weekly Cart Generation
The system should use a deterministic recommendation policy defined separately in `recommendation-policy.md`.

---

# 13. API Requirements

## Required Read APIs
- `GET /api/stores?postalCode=...`
- `GET /api/deals?storeId=...`
- `GET /api/average-cart?storeId=...&householdSize=...`
- `GET /api/recommended-cart?storeId=...&householdSize=...`
- `GET /api/store-compare?postalCode=...&householdSize=...`

## API Expectations
- Fast read performance
- Responses served from precomputed results where possible
- Refresh timestamp included in all computed-output endpoints
- Clear error shape for invalid input and stale data

---

# 14. Non-Functional Requirements

## Performance
- Primary dashboard views should feel near-instant after initial store selection.
- API endpoints should read from cached or precomputed daily outputs.

## Reliability
- Last known good data must remain available after refresh failures.
- Jobs must be safe to rerun.

## Explainability
- Deal ranking and cart recommendations must expose explanation metadata.

## Scalability
- System should support multiple stores, banners, dates, and household sizes without redesign.

## Maintainability
- Business logic should be isolated from API and UI layers.

---

# 15. Success Metrics

## Product Metrics
- Store selection completion rate
- Dashboard load success rate
- Weekly cart generation success rate
- Store comparison usage rate

## Quality Metrics
- Daily refresh success rate
- Percentage of stores with valid computed outputs
- Percentage of benchmark basket lines successfully matched to products
- Percentage of weekly cart lines resolved without manual fallback

## UX Metrics
- Median time from app open to first useful result
- Error-state rate
- Stale-data exposure rate

---

# 16. Dependencies

## External
- PC Express store search
- PC Express product search
- Infrastructure for scheduled daily jobs

## Internal
- Benchmark basket spec
- Deal scoring spec
- Recommendation policy spec
- API contract spec
- DB schema

---

# 17. Risks

## Risk: poor product normalization
May reduce deal quality and cart matching accuracy.

### Mitigation
- Normalize units and package sizes
- Add substitution logic
- Add category alias mapping

## Risk: insufficient product coverage
Some benchmark items may not map cleanly.

### Mitigation
- Use category-level fallback terms
- Allow acceptable substitutes
- Track match coverage

## Risk: misleading deals
Discounts alone may over-rank poor-value items.

### Mitigation
- Use weighted score with unit normalization and basket relevance

## Risk: daily refresh failures
Could result in missing or stale outputs.

### Mitigation
- Idempotent jobs
- last-known-good fallback
- stale-data indicators
- alerting

---

# 18. Open Questions

These should be resolved before implementation begins:
- Which household sizes must be precomputed vs calculated on demand?
- Should comparison rank by cheapest total, best deals score, or a combined score?
- Should the MVP include taxes, fees, or subtotal only?
- Should household essentials like paper goods be included in benchmark basket or only food?
- How many nearby stores should comparison include by default?

---

# 19. Launch Readiness Criteria

The MVP is ready when:
- postal code search works
- manual store selection works
- best deals render for selected store
- average cart renders for selected store and household size
- recommended 7-day cart renders for selected store and household size
- comparison view works for nearby stores
- daily refresh runs automatically
- stale data is handled clearly
- core logic is test-covered
- production monitoring is enabled

---

# 20. Final MVP Decision Summary

The MVP will deliver a daily grocery intelligence dashboard for a selected PC Express store, focused on:
- deal discovery
- weekly cost estimation
- practical weekly cart generation

It will optimize for speed, determinism, and explainability rather than personalization or checkout depth.
