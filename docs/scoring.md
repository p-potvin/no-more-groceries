# Deal Scoring Specification
## Product
PC Express Daily Grocery Deals SPA

## Version
MVP v1

## Status
Draft

## Owner
Product / Domain

## Purpose
Define the deterministic scoring model used to rank the **best daily grocery deals** for a selected store.

The goal of the scoring system is to surface deals that are not only discounted, but also:
- genuinely good value
- comparable across package sizes
- relevant to a practical weekly grocery basket
- explainable to the end user

---

# 1. Principles

## Goals
- Rank deals in a way that is stable and explainable.
- Reward real savings, not just promotional labeling.
- Normalize across size, count, and unit differences.
- Favor items that matter in a practical weekly basket.
- Avoid noisy, misleading, or low-utility results.

## Non-Goals
The MVP scoring model does not attempt to:
- personalize deals by shopper history
- model loyalty-only pricing complexity
- predict future price movement
- optimize for nutrition or dietary goals
- incorporate real-time stock reliability beyond available metadata

---

# 2. Deal Scoring Overview

Each candidate product receives a composite `dealScore` from 0 to 100.

The score is built from three weighted components:
1. `discountScore`
2. `valueScore`
3. `basketRelevanceScore`

## Default Weighting
`dealScore = 0.45 * discountScore + 0.35 * valueScore + 0.20 * basketRelevanceScore`

This weighting prioritizes actual savings first, value second, and household usefulness third.

---

# 3. Candidate Eligibility

A product is eligible for scoring only if it meets all required conditions.

## Required Conditions
- Has a valid effective current price
- Belongs to a supported grocery category or subcategory
- Can be normalized against unit, weight, volume, or count when comparability matters
- Is not explicitly excluded by noise-filter rules

## Preferred Conditions
- Has both regular and current price
- Has size or pack metadata sufficient for normalization
- Maps to benchmark basket category or adjacent category

---

# 4. Effective Price Rules

## Effective Current Price
Use the current sale/promotional price when present and valid.

If no sale/promotional price is available, use the listed current price.

## Regular Price
Use the regular/non-sale price when present and valid.

If regular price is missing, `discountScore` may degrade gracefully rather than failing the whole candidate.

## Multi-Buy Promotions
For MVP:
- include only if the effective per-unit promo price can be computed directly from returned metadata
- otherwise treat the item using the listed current price only

---

# 5. Component 1: Discount Score

## Purpose
Reward products that are materially discounted relative to regular price.

## Formula
If both `regularPrice` and `currentPrice` are available and `regularPrice > currentPrice`:

`discountPct = (regularPrice - currentPrice) / regularPrice`

`discountScore = min(100, discountPct * 100 * discountMultiplier)`

Where:
- `discountMultiplier = 2.0` for MVP calibration

This means:
- 10% discount → 20 score
- 20% discount → 40 score
- 30% discount → 60 score
- 50% discount → 100 score cap

## Fallback Rule
If regular price is missing or invalid:
- set `discountScore = 0`
- do not discard candidate if `valueScore` and `basketRelevanceScore` remain strong

## Guardrails
Set `discountScore = 0` when:
- regular price <= 0
- current price <= 0
- regular price <= current price

---

# 6. Component 2: Value Score

## Purpose
Reward products whose normalized current price is good compared with comparable items in the same category.

## Normalization Requirement
Normalize candidate price to one of:
- price per kg
- price per 100 g
- price per L
- price per 100 mL
- price per unit/count
- equivalent pack-normalized price

## Comparable Set
Each candidate is evaluated against a store-local comparable set defined by:
- same category or subcategory
- compatible unit family
- acceptable packaging similarity

Examples:
- cheese block vs cheese block
- pasta dry vs pasta dry
- milk 2L vs milk by liter equivalent
- eggs dozen vs eggs by count equivalent

## Formula
Let:
- `candidateUnitPrice = normalized current price`
- `medianComparableUnitPrice = median normalized price of comparable set`

Then:
`valueAdvantage = (medianComparableUnitPrice - candidateUnitPrice) / medianComparableUnitPrice`

`valueScore = clamp(50 + valueAdvantage * 100, 0, 100)`

Interpretation:
- candidate at median comparable price → 50
- candidate cheaper than median → above 50
- candidate more expensive than median → below 50

## Fallback Rule
If comparable set is too small or normalization is not reliable:
- assign `valueScore = 50`
- mark explanation metadata as low-confidence

## Minimum Comparable Threshold
Use a minimum threshold of:
- 3 comparable items when available
- otherwise fallback to category representative median or neutral score of 50

---

# 7. Component 3: Basket Relevance Score

## Purpose
Favor items that matter to a realistic weekly grocery run.

## Relevance Tiers
Assign each product to one of the following tiers.

### Tier A — Core Basket Staples
Score: `100`

Examples:
- milk
- eggs
- bread
- bananas
- rice
- pasta
- potatoes
- onions
- carrots
- chicken
- ground beef
- canned beans
- canned tomatoes

### Tier B — Common Weekly Basket Items
Score: `75`

Examples:
- yogurt
- cheese
- lettuce
- tomatoes
- frozen vegetables
- juice
- crackers
- peanut butter
- soup/broth

### Tier C — Optional Weekly Extras
Score: `50`

Examples:
- chips
- cookies
- granola bars
- coffee/tea
- tortillas

### Tier D — Low Basket Relevance
Score: `25`

Examples:
- niche condiments
- premium desserts
- specialty snacks
- non-essential novelty items

### Tier E — Excluded / Noise
Score: `0`
These should generally be filtered before ranking.

Examples:
- highly specialized diet products with no basket role
- seasonal impulse items
- luxury gourmet items
- party-size bulk packs that break comparison logic

---

# 8. Composite Score Calculation

## Formula
`dealScore = 0.45 * discountScore + 0.35 * valueScore + 0.20 * basketRelevanceScore`

## Output Range
- Minimum: `0`
- Maximum: `100`

## Rounding
Round final score to one decimal place for storage.
Round to nearest whole number for UI display if desired.

---

# 9. Tie-Break Rules

If two items have equal or near-equal `dealScore`, break ties in this order:

1. Higher `basketRelevanceScore`
2. Higher `discountPct`
3. Better normalized unit value
4. Lower absolute current price
5. Store-brand/basic item preference
6. Stable alphabetical fallback by product name

Near-equal threshold for tie handling:
- score difference <= `1.0`

---

# 10. Noise Filtering Rules

Products should be filtered out before ranking when they match noisy or misleading patterns.

## Filter Out
- specialty diet items unless category has no standard products
- luxury or gourmet premium variants without basket role
- oversized party packs that distort normalized comparison
- unclear bundle pricing with no computable per-unit effect
- non-food items outside limited household-essential scope
- prepared meals substituting for staple categories
- products with missing or malformed price metadata that cannot support scoring

## Soft Demotion Instead of Exclusion
For borderline cases:
- assign lower `basketRelevanceScore`
- apply lower ranking priority rather than hard filtering

---

# 11. Category-Specific Rules

## Produce
- Prefer normalization by kg or lb equivalence
- Loose and bagged produce may be compared if unit conversion is reliable
- Exotic specialty produce should receive lower relevance unless mapped to basket

## Dairy
- Compare similar product forms only
- Greek yogurt can substitute for yogurt, but may not always compare directly to standard tubs without weight normalization

## Meat / Protein
- Prefer per-kg comparison
- Ground beef should compare with ground beef, not steaks
- Chicken thighs and breasts may compare within chicken protein group if configured, but whole chicken should be marked as substitute-comparable, not exact-comparable

## Pantry
- Compare like-for-like where possible
- Dry pasta types may compare together
- Rice varieties may compare together only after normalization and with a modest comparability penalty if quality tier differs materially

## Snacks / Extras
- Maintain lower relevance ceiling unless mapped into benchmark basket

---

# 12. Confidence Metadata

Each scored deal should carry a confidence indicator.

## Confidence Inputs
- completeness of price metadata
- confidence of unit normalization
- size of comparable set
- confidence of category mapping

## Suggested Confidence Levels
- `high`
- `medium`
- `low`

## Rules
### High
- valid regular and current price
- normalized unit price available
- comparable set >= 3
- category confidently mapped

### Medium
- one partial field missing or comparable set limited

### Low
- fallback assumptions used for normalization or comparables

Confidence does not directly change `dealScore` in MVP, but should be available to UI and future ranking refinements.

---

# 13. Explanation Metadata

Each ranked deal should include explanation metadata for UI display.

## Required Fields
- `dealScore`
- `discountScore`
- `valueScore`
- `basketRelevanceScore`
- `discountPct` when available
- `normalizedUnitPrice`
- `normalizedUnitLabel`
- `relevanceTier`
- `confidenceLevel`
- `explanationSummary`

## Example Explanation Summary
- `High discount and better-than-average unit price for a core weekly staple.`
- `Moderate discount, but strong value for this category and high weekly-cart relevance.`
- `Good discount, but lower weekly relevance than core staples.`

---

# 14. Ranking Output Requirements

The ranked deals endpoint should return:
- top deals for the selected store
- score metadata
- refresh timestamp
- category label
- effective current price
- regular price if available
- promo indicator if available
- confidence and explanation fields

The system may return:
- top N overall deals
- top N by major category

Suggested MVP default:
- top 20 overall deals
- optional top 5 per category for UI tabs/filters

---

# 15. Fallback Behavior

If insufficient comparable pricing data exists for a category:
- keep eligible products if pricing is valid
- assign neutral `valueScore = 50`
- lower confidence to `medium` or `low`

If regular price is unavailable:
- keep eligible products if value and relevance are meaningful
- assign `discountScore = 0`
- reflect missing discount in explanation

If both discount and value data are unreliable:
- exclude from top-ranked results

---

# 16. Calibration Guidance

Initial weight calibration for MVP:
- `discountScore`: 45%
- `valueScore`: 35%
- `basketRelevanceScore`: 20%

Potential future tuning areas:
- category-specific weights
- store-brand boost
- stock/availability boost
- historical price deviation score
- user-specific preference weighting

Do not implement these future tunings in MVP without versioning the scoring model.

---

# 17. Versioning

All scored outputs must include:
- `scoringVersion`

Initial value:
- `deal-score-v1`

Any change to:
- weights
- tier mappings
- normalization rules
- tie-break logic
- exclusion rules

must increment the scoring version.

---

# 18. Final Decision Summary

The MVP deal scoring model ranks products using a weighted blend of:
- actual discount
- normalized category value
- relevance to a practical grocery basket

This creates rankings that are:
- more useful than raw sale lists
- comparable across package sizes
- explainable in UI
- stable enough for daily precomputed outputs
