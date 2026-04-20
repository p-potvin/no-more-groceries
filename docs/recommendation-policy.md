# Recommendation Policy Specification
## Product
PC Express Daily Grocery Deals SPA

## Version
MVP v1

## Status
Draft

## Owner
Product / Domain

## Purpose
Define the deterministic policy used to generate the **recommended 7-day grocery cart** for a household of size `X` at a selected store.

The recommendation policy is intended to produce a cart that is:
- practical
- category-balanced
- household-size aware
- store-specific
- explainable
- stable enough for daily precomputation

It is not intended to be a personalized meal planner.

---

# 1. Principles

## Goals
- Produce a realistic weekly grocery cart for a household size.
- Favor common staple items and broad grocery coverage.
- Use store-specific matching and pricing.
- Prefer acceptable low-cost options over premium options.
- Provide explanations and substitutions when exact matches fail.
- Keep behavior deterministic for the same date/store/household size.

## Non-Goals
The MVP policy does not attempt to:
- optimize for individual taste
- optimize macros or nutrition plans
- build recipe-level meal prep plans
- support strict dietary or allergy constraints
- guarantee checkout-ready inventory
- adapt to a user’s pantry on hand

---

# 2. Output Definition

A recommended weekly cart is a structured output containing:
- selected store metadata
- household size
- effective date
- basket version and policy version
- itemized recommended products
- quantities
- substitutions and reasons
- category coverage
- total estimated spend
- confidence metadata

The result must be shoppable in principle, even if not synced to retailer checkout in MVP.

---

# 3. Baseline Household Assumption

The recommended cart assumes a general-purpose household with:
- breakfast staples
- lunch basics
- dinner staples
- snack coverage
- pantry support items
- limited household essentials

It assumes:
- most meals are prepared at home
- a balanced mix of fresh, refrigerated, frozen, and pantry goods
- no specialty diet constraints

---

# 4. Household Size Support

## Standard Sizes
The system should support:
- 1 person
- 2 persons
- 4 persons
- 6 persons

## Custom Size
Custom household size `X` is allowed and must scale from the same baseline rules.

## Scaling Rules
Use category-specific scaling:
- direct-consumption items → linear scaling
- shared staples → sublinear scaling
- durable items → stepwise or prorated scaling

---

# 5. Cart Composition Model

## Core Category Targets
Each weekly cart should include items from these major categories:
- produce
- dairy and eggs
- grains / bakery
- protein
- pantry staples
- snacks / extras
- beverages
- limited household essentials

## Composition Goal
The system should construct a cart by satisfying category quotas rather than by generating recipes.

The recommended cart is therefore:
- category-driven
- staple-first
- value-aware
- substitution-tolerant

---

# 6. Required Category Quotas

## 6.1 Produce
Must include at least:
- 2 fruit lines
- 4 vegetable lines
- 1 frozen vegetable line

Preferred canonical items:
- bananas
- apples
- potatoes
- onions
- carrots
- lettuce
- tomatoes
- frozen mixed vegetables

## 6.2 Dairy and Eggs
Must include at least:
- 1 milk line
- 1 eggs line
- 1 yogurt or cheese line

Preferred canonical items:
- milk
- eggs
- yogurt
- cheese
- butter

## 6.3 Grains / Bakery
Must include at least:
- 1 bread line
- 1 rice or pasta line
- 1 breakfast grain line

Preferred canonical items:
- bread
- rice
- pasta
- oats or cereal
- tortillas optional

## 6.4 Protein
Must include at least:
- 2 animal or budget protein lines
- 1 legume or shelf-stable protein line

Preferred canonical items:
- chicken
- ground beef
- canned tuna
- beans
- peanut butter

## 6.5 Pantry Staples
Must include at least:
- 2 cooking/support items
- 1 sauce/tomato base item

Preferred canonical items:
- oil
- flour
- sugar
- canned tomatoes or pasta sauce
- broth or soup

## 6.6 Snacks / Extras
Should include:
- 1–3 lines depending on household size

Preferred canonical items:
- crackers
- chips
- granola bars or cookies

## 6.7 Beverages
Should include:
- 1 juice line
- 0–1 coffee or tea line

## 6.8 Household Essentials
Optional but allowed in default weekly cart if coverage is good:
- toilet paper
- dish soap

---

# 7. Canonical Item Set

The weekly recommendation engine should use the benchmark basket item family as its primary canonical source, with the same substitution framework where possible.

## Minimum Canonical Set
The engine should attempt to fill from these canonical items:
- bananas
- apples
- potatoes
- onions
- carrots
- lettuce
- tomatoes
- frozen vegetables
- milk
- eggs
- yogurt
- cheese
- bread
- rice
- pasta
- oats/cereal
- chicken
- ground beef
- canned tuna
- beans
- peanut butter
- oil
- canned tomatoes or pasta sauce
- broth/soup
- crackers
- chips
- granola bars/cookies
- juice

---

# 8. Quantity Planning Rules

## Quantity Inputs
Quantities are determined by:
- household size
- canonical baseline quantity
- category scaling rule
- package-size normalization

## Quantity Strategy
The engine should first compute target consumption quantities, then map those targets to available retail package sizes.

## Rules
- Prefer exact or near-exact quantity coverage.
- Prefer fewer packages when normalized value is similar.
- Avoid excessive overbuy unless only large package sizes exist.
- Permit modest overage for pantry and durable items.

## Rounding
### Fresh / perishable items
Round toward practical weekly purchase sizes with minimal overbuy.

### Pantry / durable items
Allow full-unit rounding and optionally prorated display in derived views.

### Protein
Prefer enough quantity to cover weekly quota even if retail package sizes force slight overage.

---

# 9. Product Matching Policy

## Match Order
For each canonical item, select products in this order:
1. exact preferred match
2. acceptable same-category substitute
3. cheapest normalized comparable item
4. fallback representative item within category

## Preferred Product Characteristics
- standard packaging
- mainstream/basic product type
- store-brand acceptable
- good normalized value
- clear size and price metadata

## Avoid
- premium gourmet variants
- specialty diet variants without necessity
- oversized bulk packages that distort a weekly recommendation
- unclear promo bundles
- prepared foods replacing staples

---

# 10. Substitution Rules

## Allowed Substitute Criteria
A substitute is valid if it:
- serves the same household role
- belongs to same or adjacent functional category
- has comparable unit family or understandable equivalence
- does not materially increase cost without necessity

## Substitute Priority
1. store-brand standard item
2. mainstream standard item
3. alternate size with normalized value retained
4. adjacent category fallback

## Example Substitutions
- romaine hearts for lettuce
- marble cheese for cheddar
- penne for spaghetti
- canned diced tomatoes for pasta sauce
- canned salmon for tuna
- whole chicken for chicken pieces if normalized value is better and category role remains valid

## Substitution Metadata
Each non-exact selection must include:
- `substitutionType`
- `substitutionReason`
- `originalCanonicalItem`
- `selectedProductName`

---

# 11. Cost Optimization Policy

## Objective
The weekly cart should prioritize **practical low-cost adequacy**, not strict cheapest-item-only behavior.

## Rules
- Prefer cheapest acceptable comparable item within each canonical line.
- Do not automatically choose premium products even if on sale, unless normalized value remains strong.
- Consider deal score as a secondary ranking signal where multiple acceptable items exist.
- Preserve category coverage before optimizing minor line-item savings.

## Selection Heuristic
When multiple acceptable candidates exist, prefer the product with the best combined:
- normalized value
- relevance to household use
- packaging practicality
- current discount signal

Suggested MVP helper score:
`selectionScore = 0.50 * valueScore + 0.25 * dealScore + 0.25 * packagingPracticalityScore`

This helper score is internal selection logic and not a user-facing ranked score.

---

# 12. Packaging Practicality Policy

## Goal
Avoid obviously awkward weekly cart choices.

## Practicality Signals
Reward:
- common retail sizes
- straightforward count/weight equivalence
- packages close to target quantity

Demote:
- extreme bulk sizes
- tiny premium trial sizes
- odd bundles that exceed weekly needs materially

## Packaging Practicality Score
Internal 0–100 heuristic:
- 100 = ideal weekly fit
- 50 = acceptable but imperfect
- 0 = impractical for MVP weekly recommendation

---

# 13. Budget Modes

## MVP Default Mode
Only one default mode is required:
- `standard-value`

This mode prioritizes low-cost practical shopping with normal category coverage.

## Not in MVP
Do not implement separate modes yet for:
- ultra-budget
- premium
- high-protein
- kid-focused
- vegetarian

These may be added in later versions with explicit versioning.

---

# 14. Confidence Policy

Each recommended cart should include a confidence indicator.

## Confidence Inputs
- percentage of canonical lines matched exactly
- reliance on substitutions
- pricing metadata quality
- comparable coverage quality
- category coverage completeness

## Confidence Levels
- `high`
- `medium`
- `low`

### High
- strong category coverage
- few substitutions
- reliable price metadata

### Medium
- acceptable coverage with moderate substitutions

### Low
- several fallback lines or weak metadata

Confidence should be exposed to UI but not used to suppress valid results unless coverage is too poor.

---

# 15. Coverage Thresholds

## Minimum Valid Cart Threshold
A weekly cart is valid only if:
- all major categories except optional household essentials are represented
- at least 75% of target canonical lines are matched exactly or via acceptable substitute
- at least 2 protein lines and 4 produce lines are present

## Fallback Behavior
If thresholds are not met:
- return a low-confidence cart only if still practically usable
- flag missing coverage in metadata
- reduce store-comparison confidence

If cart is not practically usable:
- do not expose as valid recommended cart
- fall back to average-cart-only availability for that store/date

---

# 16. Output Schema Requirements

Each cart result should include:
- `storeId`
- `storeName`
- `effectiveDate`
- `householdSize`
- `policyVersion`
- `basketVersion`
- `total`
- `lineItems[]`
- `categoryCoverage`
- `confidenceLevel`
- `staleDataFlag`

Each line item should include:
- `category`
- `canonicalItem`
- `matchedProductId`
- `matchedProductName`
- `matchType` (`exact`, `substitute`, `fallback`)
- `quantity`
- `unitPrice`
- `lineTotal`
- `normalizedUnitLabel`
- `substitutionReason` if applicable
- `selectionExplanation`

---

# 17. Explanation Requirements

The engine must provide human-readable explanation metadata for each selected line where possible.

## Example Explanations
- `Selected as the lowest-cost acceptable milk option for the weekly household target.`
- `Chosen instead of the canonical pasta type because it offered better unit value.`
- `Selected as a substitute due to unavailable standard lettuce at this store.`

## Cart-Level Explanation
The overall cart may include a summary such as:
- `Balanced weekly cart built from staple grocery categories using store-specific value picks and substitutions where needed.`

---

# 18. Store Comparison Use

When a recommended cart is used in store comparison:
- use identical household-size rules across all stores
- use same canonical item set and policy version
- compare totals only when category coverage is above threshold
- expose confidence differences where coverage quality varies materially

---

# 19. Versioning

All weekly cart outputs must include:
- `policyVersion`

Initial value:
- `weekly-cart-policy-v1`

Any change to:
- canonical item set
- category quotas
- substitution rules
- quantity scaling
- packaging practicality rules
- budget policy

must increment the policy version.

---

# 20. Final Decision Summary

The MVP weekly recommendation policy generates a deterministic 7-day grocery cart by:
- filling required category quotas
- scaling quantities by household size
- matching store-specific products
- selecting low-cost practical options
- applying acceptable substitutions when needed

This produces a cart that is:
- practical enough for weekly shopping
- explainable in UI
- stable enough for daily precomputed use
- comparable across nearby stores
