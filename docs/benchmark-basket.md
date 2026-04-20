# Benchmark Basket Specification
## Product
PC Express Daily Grocery Deals SPA

## Version
MVP v1

## Status
Draft

## Owner
Product / Domain

## Purpose
Define the deterministic weekly benchmark basket used to calculate the **average grocery cart total** for a household of size `X`.

This benchmark is:
- stable
- explainable
- store-agnostic at the category level
- store-specific at the product matching level

It is not intended to represent every household. It is intended to provide a consistent baseline for comparing stores and estimating weekly grocery spend.

---

# 1. Design Principles

## Principles
- Use a **weekly** time horizon.
- Prefer **essential grocery categories** over subjective items.
- Keep the basket **small enough to match reliably** across stores.
- Keep quantities **deterministic** and easy to scale.
- Allow **acceptable substitutions** when exact matches are unavailable.
- Optimize for **comparability**, not personalization.

## Exclusions
The benchmark basket does not attempt to model:
- restaurant meals
- prepared meals
- luxury items
- specialty diets
- coupon behavior
- loyalty-only pricing effects
- deep pantry stocking events

---

# 2. Basket Scope

## Included Categories
- produce
- dairy
- eggs
- bakery/grains
- protein
- pantry staples
- snacks/basic extras
- beverages
- household essentials (limited set)

## Excluded Categories for MVP
- alcohol
- vitamins/supplements
- baby products
- pet food
- cosmetics
- seasonal/non-recurring items

---

# 3. Household Size Support

## Standard Sizes
Predefined benchmark outputs should support:
- 1 person
- 2 persons
- 4 persons
- 6 persons

## Custom Size
Custom household size `X` is supported by scaling from the per-person weekly baseline using category-specific scaling rules.

---

# 4. Basket Construction Model

## Baseline Method
The benchmark basket is defined as:
- a set of **core weekly grocery lines**
- each line with:
  - category
  - canonical item
  - preferred unit
  - base weekly quantity for 1 person
  - scaling rule
  - allowed substitutions

## Matching Method
At runtime or precompute time, each canonical item is mapped to:
1. exact preferred product match if available
2. acceptable substitute within same category and similar unit
3. cheapest acceptable comparable item
4. fallback category representative item

---

# 5. Canonical Weekly Basket

## 5.1 Produce

### Bananas
- canonical_item: bananas
- preferred_unit: kg or bunch equivalent
- qty_1p: 1.0 kg
- scaling: linear
- substitutions:
  - loose bananas
  - bunch bananas

### Apples
- canonical_item: apples
- preferred_unit: lb or kg bag / loose equivalent
- qty_1p: 1.0 kg
- scaling: linear
- substitutions:
  - gala apples
  - fuji apples
  - ambrosia apples
  - mixed apples bag

### Potatoes
- canonical_item: potatoes
- preferred_unit: bag
- qty_1p: 1.5 kg
- scaling: sublinear after 4 persons
- substitutions:
  - russet potatoes
  - white potatoes
  - yellow potatoes

### Onions
- canonical_item: onions
- preferred_unit: bag or loose
- qty_1p: 0.75 kg
- scaling: linear
- substitutions:
  - yellow onions
  - white onions

### Carrots
- canonical_item: carrots
- preferred_unit: bag
- qty_1p: 0.9 kg
- scaling: linear
- substitutions:
  - whole carrots
  - bagged carrots

### Lettuce / Salad Base
- canonical_item: lettuce
- preferred_unit: head or clamshell
- qty_1p: 1 unit
- scaling: linear
- substitutions:
  - romaine hearts
  - iceberg lettuce
  - spring mix

### Tomatoes
- canonical_item: tomatoes
- preferred_unit: lb or pack
- qty_1p: 0.75 kg
- scaling: linear
- substitutions:
  - vine tomatoes
  - roma tomatoes
  - cocktail tomatoes

### Frozen Vegetables
- canonical_item: frozen mixed vegetables
- preferred_unit: bag
- qty_1p: 1 bag
- scaling: linear
- substitutions:
  - mixed vegetables
  - broccoli florets
  - peas/carrots mix

---

## 5.2 Dairy and Eggs

### Milk
- canonical_item: milk
- preferred_unit: 2L equivalent
- qty_1p: 2 L
- scaling: linear
- substitutions:
  - 1% milk
  - 2% milk
  - homogenized milk

### Yogurt
- canonical_item: yogurt
- preferred_unit: tub
- qty_1p: 1 tub
- scaling: linear
- substitutions:
  - plain yogurt
  - vanilla yogurt
  - greek yogurt only if nearest comparable price/weight

### Cheese
- canonical_item: cheddar cheese
- preferred_unit: block
- qty_1p: 400 g
- scaling: sublinear after 4 persons
- substitutions:
  - marble cheese
  - mozzarella block
  - store-brand cheddar

### Butter
- canonical_item: butter
- preferred_unit: 454 g
- qty_1p: 0.5 unit
- scaling: stepwise
- substitutions:
  - salted butter
  - unsalted butter

### Eggs
- canonical_item: eggs
- preferred_unit: dozen
- qty_1p: 1 dozen
- scaling: linear
- substitutions:
  - large eggs
  - extra large eggs if similar normalized value

---

## 5.3 Bakery / Grains

### Bread
- canonical_item: sandwich bread
- preferred_unit: loaf
- qty_1p: 1 loaf
- scaling: linear
- substitutions:
  - whole wheat bread
  - white bread
  - multigrain bread

### Rice
- canonical_item: rice
- preferred_unit: bag
- qty_1p: 1 kg
- scaling: sublinear after 2 persons
- substitutions:
  - long grain rice
  - basmati rice
  - jasmine rice
- note: select lowest acceptable normalized unit price

### Pasta
- canonical_item: dry pasta
- preferred_unit: 900 g equivalent
- qty_1p: 0.9 kg
- scaling: linear
- substitutions:
  - spaghetti
  - penne
  - fusilli
  - macaroni

### Oats / Cereal
- canonical_item: oats or cereal
- preferred_unit: standard package
- qty_1p: 1 package
- scaling: linear
- substitutions:
  - rolled oats
  - basic cereal
- note: oats preferred over premium cereal when both available

### Tortillas / Wraps
- canonical_item: tortillas
- preferred_unit: package
- qty_1p: 1 package
- scaling: sublinear after 4 persons
- substitutions:
  - flour tortillas
  - whole wheat wraps

---

## 5.4 Protein

### Chicken
- canonical_item: chicken thighs or breasts
- preferred_unit: tray or kg
- qty_1p: 1.2 kg
- scaling: linear
- substitutions:
  - chicken thighs
  - chicken breasts
  - whole chicken if better normalized value

### Ground Beef
- canonical_item: ground beef
- preferred_unit: tray
- qty_1p: 0.75 kg
- scaling: linear
- substitutions:
  - lean ground beef
  - medium ground beef
- note: choose cheapest acceptable normalized option

### Canned Tuna / Equivalent Budget Protein
- canonical_item: canned tuna
- preferred_unit: can multipack or singles
- qty_1p: 3 cans
- scaling: linear
- substitutions:
  - canned salmon
  - canned beans only as fallback in store-poor matches

### Dried / Canned Beans
- canonical_item: beans
- preferred_unit: cans or dry bag
- qty_1p: 2 cans equivalent
- scaling: linear
- substitutions:
  - black beans
  - chickpeas
  - kidney beans

### Peanut Butter
- canonical_item: peanut butter
- preferred_unit: jar
- qty_1p: 1 jar
- scaling: sublinear after 2 persons
- substitutions:
  - smooth peanut butter
  - crunchy peanut butter

---

## 5.5 Pantry Staples

### Cooking Oil
- canonical_item: vegetable or canola oil
- preferred_unit: bottle
- qty_1p: 0.33 bottle
- scaling: stepwise
- substitutions:
  - canola oil
  - vegetable oil

### Flour
- canonical_item: all-purpose flour
- preferred_unit: bag
- qty_1p: 0.25 bag
- scaling: stepwise
- substitutions:
  - all-purpose flour
- note: include via prorated weekly cost, not always full-unit purchase in display unless chosen for matching simplicity

### Sugar
- canonical_item: white sugar
- preferred_unit: bag
- qty_1p: 0.2 bag
- scaling: stepwise
- substitutions:
  - granulated sugar

### Canned Tomatoes / Pasta Sauce
- canonical_item: canned tomatoes or pasta sauce
- preferred_unit: cans/jars
- qty_1p: 2 units
- scaling: linear
- substitutions:
  - pasta sauce
  - canned diced tomatoes

### Soup / Stock
- canonical_item: broth or soup
- preferred_unit: carton/can
- qty_1p: 2 units
- scaling: linear
- substitutions:
  - chicken broth
  - vegetable broth
  - basic canned soup

---

## 5.6 Snacks / Basic Extras

### Crackers
- canonical_item: crackers
- preferred_unit: box
- qty_1p: 1 box
- scaling: sublinear after 4 persons
- substitutions:
  - soda crackers
  - basic snack crackers

### Chips / Simple Snack
- canonical_item: chips
- preferred_unit: bag
- qty_1p: 1 bag
- scaling: linear
- substitutions:
  - plain chips
  - store-brand chips

### Cookies / Granola Bars
- canonical_item: cookies or granola bars
- preferred_unit: package
- qty_1p: 1 package
- scaling: linear
- substitutions:
  - basic cookies
  - granola bars

---

## 5.7 Beverages

### Juice
- canonical_item: juice
- preferred_unit: carton
- qty_1p: 1 carton
- scaling: linear
- substitutions:
  - orange juice
  - apple juice
  - store-brand juice

### Coffee / Tea
- canonical_item: coffee or tea
- preferred_unit: standard package
- qty_1p: 0.33 package
- scaling: stepwise
- substitutions:
  - ground coffee
  - tea bags
- note: choose one representative caffeine staple, not both

---

## 5.8 Household Essentials

### Toilet Paper
- canonical_item: toilet paper
- preferred_unit: standard pack
- qty_1p: 0.25 pack
- scaling: stepwise
- substitutions:
  - store-brand TP
  - mainstream TP brand

### Dish Soap
- canonical_item: dish soap
- preferred_unit: bottle
- qty_1p: 0.2 bottle
- scaling: stepwise
- substitutions:
  - any standard dish soap

---

# 6. Scaling Rules

## Rule Types

### Linear
Used for items with direct consumption growth by household size.

Formula:
`scaled_qty = base_qty_1p * household_size`

Examples:
- milk
- eggs
- bread
- bananas
- chicken

### Sublinear
Used for shared items with some efficiency from larger households.

Formula:
`scaled_qty = base_qty_1p * (0.85 + 0.15 * household_size)` for designated categories  
Implementation may simplify to explicit lookup table.

Examples:
- cheese
- rice
- crackers
- tortillas
- potatoes

### Stepwise
Used for durable or slow-turn items.

Formula:
Purchase full retail unit when threshold crossed.

Examples:
- oil
- flour
- sugar
- coffee/tea
- toilet paper
- dish soap
- butter

---

# 7. Standard Household Quantity Table

## 1 Person
Use `qty_1p` exactly.

## 2 Persons
Use:
- linear items: `2.0x`
- sublinear items: `1.7x`
- stepwise items: threshold-based rounding

## 4 Persons
Use:
- linear items: `4.0x`
- sublinear items: `3.1x`
- stepwise items: threshold-based rounding

## 6 Persons
Use:
- linear items: `6.0x`
- sublinear items: `4.5x`
- stepwise items: threshold-based rounding

## Custom `X`
Use:
- linear: `qty_1p * X`
- sublinear: category formula or nearest interpolated lookup
- stepwise: prorated weekly consumption or rounded unit threshold depending on endpoint policy

---

# 8. Pricing Rules

## General Rule
The benchmark calculator should price each line using:
1. exact preferred product
2. acceptable substitute
3. cheapest normalized comparable item

## Unit Normalization
All candidate products should be normalized by:
- weight
- count
- volume
- per-unit pack equivalence where applicable

## Sale Pricing
If a valid sale price exists, use sale price.

## Missing Regular Price
If only one price is available, treat it as effective current price.

## Multi-Buy Promotions
For MVP:
- include only when directly computable from returned pricing data
- otherwise ignore complex promo conditions

---

# 9. Substitution Policy

## Allowed Substitute Criteria
A substitute is valid if it:
- belongs to same functional category
- is within acceptable size/unit family
- is not premium-only unless no standard option exists
- is not specialty/dietary niche unless unavoidable

## Preferred Substitute Order
1. store-brand basic item
2. mainstream standard item
3. larger/smaller size normalized to value
4. adjacent category fallback

## Rejection Rules
Reject products that are:
- premium gourmet variants
- party-size bulk packs with poor comparability
- specialty diet items unless category-empty
- prepared/ready-to-eat replacements for staple items

---

# 10. Output Schema Requirements

Each benchmark result line should include:
- `category`
- `canonicalItem`
- `matchedProductId`
- `matchedProductName`
- `matchType` (`exact`, `substitute`, `fallback`)
- `unitType`
- `quantity`
- `unitPrice`
- `lineTotal`
- `pricingSourceDate`
- `substitutionReason` if not exact

The overall result should include:
- `storeId`
- `storeName`
- `householdSize`
- `effectiveDate`
- `basketVersion`
- `total`
- `lineItems[]`
- `coverageScore`
- `staleDataFlag`

---

# 11. Coverage and Quality Thresholds

## Minimum Coverage
A benchmark output is valid only if:
- at least 80% of canonical lines are matched
- all major categories are represented:
  - produce
  - dairy/eggs
  - grains
  - protein
  - pantry

## Fallback Behavior
If coverage is below threshold:
- show partial output only if product rules allow it
- flag output as low-confidence
- degrade store comparison ranking confidence

---

# 12. Display Policy

## In UI
The average cart view should show:
- total weekly estimate
- category subtotals
- key line items
- substitutions when used

## Optional Detail Expansion
The UI may collapse:
- prorated pantry items
- household essentials
- lower-salience extras

---

# 13. Versioning

## Basket Version
All benchmark results must be tagged with:
- `basketVersion`

Initial value:
- `benchmark-v1`

Any change to:
- categories
- quantities
- scaling rules
- substitution rules

must increment the basket version.

---

# 14. Open Implementation Choices

These are allowed but must be fixed in engineering docs:
- whether stepwise items are displayed as prorated weekly cost or full purchased unit cost
- whether coffee/tea is always included or category-conditional
- whether snacks/basic extras are mandatory or optional in store comparison mode

---

# 15. Final Decision Summary

The MVP benchmark basket is:
- a deterministic weekly household basket
- broad enough to estimate real grocery spend
- constrained enough to match across stores reliably
- scalable by household size
- explainable in UI and stable for comparisons
