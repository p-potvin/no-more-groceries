export const stores = [
  {
    id: 'rcss-montreal-central',
    banner: 'SUPERSTORE',
    name: 'Real Canadian Superstore Montréal Central',
    address: '250 Av. des Canadiens, Montréal, QC',
  },
  {
    id: 'nofrills-plateau',
    banner: 'NOFRILLS',
    name: 'No Frills Plateau',
    address: '455 Rue Rachel E, Montréal, QC',
  },
  {
    id: 'provigo-mile-end',
    banner: 'PROVIGO',
    name: 'Provigo Mile End',
    address: '50 Av. du Parc, Montréal, QC',
  },
];

export const dealsByStore = {
  'rcss-montreal-central': [
    { id: 'd1', name: 'Chicken Breast Family Pack', price: 12.99, discountLabel: '18% off', note: 'High-value protein staple for weekly meal prep.' },
    { id: 'd2', name: 'Blueberries 1 pint', price: 2.88, discountLabel: '22% off', note: 'Strong produce value compared with benchmark pricing.' },
    { id: 'd3', name: 'Greek Yogurt 750g', price: 4.49, discountLabel: '15% off', note: 'Good breakfast and snack basket fit.' },
  ],
  'nofrills-plateau': [
    { id: 'd4', name: 'Bananas', price: 1.77, discountLabel: '12% off', note: 'Budget fruit anchor for benchmark baskets.' },
    { id: 'd5', name: 'Ground Beef Medium', price: 9.49, discountLabel: '20% off', note: 'Useful for family-size weekly cart planning.' },
    { id: 'd6', name: 'Whole Wheat Bread', price: 2.49, discountLabel: '10% off', note: 'Staple item with strong basket relevance.' },
  ],
  'provigo-mile-end': [
    { id: 'd7', name: 'Salmon Fillets', price: 14.99, discountLabel: '17% off', note: 'Premium protein with a meaningful sale delta.' },
    { id: 'd8', name: 'Spinach Clamshell', price: 3.99, discountLabel: '16% off', note: 'Useful fresh produce item for 7-day cart composition.' },
    { id: 'd9', name: 'Eggs 12 pack', price: 3.79, discountLabel: '9% off', note: 'Core benchmark basket item with broad utility.' },
  ],
};

export function buildAverageCart(storeId, householdSize) {
  const factor = Number(householdSize) || 1;
  const baseItems = [
    { name: 'Milk', quantity: factor, unitPrice: 4.29 },
    { name: 'Eggs', quantity: factor, unitPrice: 3.79 },
    { name: 'Chicken', quantity: factor, unitPrice: 12.99 },
    { name: 'Rice', quantity: 1, unitPrice: 5.49 },
    { name: 'Vegetables', quantity: factor + 1, unitPrice: 4.99 },
    { name: 'Fruit', quantity: factor + 1, unitPrice: 4.49 },
  ];

  const adjustment = storeId === 'provigo-mile-end' ? 1.08 : storeId === 'nofrills-plateau' ? 0.95 : 1;
  const items = baseItems.map((item) => ({ ...item, unitPrice: Number((item.unitPrice * adjustment).toFixed(2)) }));
  const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  return {
    storeId,
    householdSize: factor,
    total: Number(total.toFixed(2)),
    summary: `Estimated benchmark cart total for ${factor} person${factor > 1 ? 's' : ''}.`,
    items,
    refreshTimestamp: new Date().toISOString(),
  };
}

export function buildRecommendedCart(storeId, householdSize) {
  const factor = Number(householdSize) || 1;
  const items = [
    { name: 'Chicken Breast', quantity: `${Math.max(1, factor)} packs` },
    { name: 'Rice', quantity: `${Math.max(1, Math.ceil(factor / 2))} bag` },
    { name: 'Eggs', quantity: `${factor} dozen` },
    { name: 'Greek Yogurt', quantity: `${factor} tubs` },
    { name: 'Bananas', quantity: `${factor * 7} units` },
    { name: 'Mixed Vegetables', quantity: `${factor + 2} bags` },
    { name: 'Bread', quantity: `${Math.max(1, Math.ceil(factor / 2))} loaves` },
  ];

  const averageCart = buildAverageCart(storeId, factor);

  return {
    storeId,
    householdSize: factor,
    total: Number((averageCart.total * 0.92).toFixed(2)),
    summary: `Recommended 7-day cart optimized for a ${factor}-person household using high-utility staples and current deals.`,
    items,
    refreshTimestamp: new Date().toISOString(),
  };
}

export function buildComparison(postalCode, householdSize) {
  return stores.map((store) => ({
    id: store.id,
    name: store.name,
    postalCode,
    estimatedTotal: buildAverageCart(store.id, householdSize).total,
  })).sort((a, b) => a.estimatedTotal - b.estimatedTotal);
}
