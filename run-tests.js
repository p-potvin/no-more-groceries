/**
 * Test Runner — runs all test suites in order
 * Usage: node run-tests.js
 */

import { runTests as storeSearchTests }     from './packages/integrations/pc-express/__tests__/store-search.test.js';
import { runTests as productSearchTests }   from './packages/integrations/pc-express/__tests__/product-search.test.js';
import { runTests as unitNormTests }        from './packages/domain/deals/__tests__/unit-normalization.test.js';
import { runTests as scoreDealsTests }      from './packages/domain/deals/__tests__/score-deals.test.js';
import { runTests as avgCartTests }         from './packages/domain/average-cart/__tests__/calculate-average-cart.test.js';
import { runTests as weeklyCartTests }      from './packages/domain/weekly-cart/__tests__/generate-weekly-cart.test.js';

const suites = [
  { name: 'PC Express Store Search',   fn: storeSearchTests   },
  { name: 'PC Express Product Search', fn: productSearchTests  },
  { name: 'Unit Normalization',        fn: unitNormTests       },
  { name: 'Deal Scoring Engine',       fn: scoreDealsTests     },
  { name: 'Average Cart Calculator',   fn: avgCartTests        },
  { name: 'Weekly Cart Generator',     fn: weeklyCartTests     },
];

let passed = 0;
let failed = 0;

for (const suite of suites) {
  try {
    await suite.fn();
    console.log(`✅ ${suite.name}\n`);
    passed++;
  } catch (err) {
    console.error(`❌ ${suite.name} FAILED: ${err.message}`);
    if (process.env.DEBUG) console.error(err);
    failed++;
  }
}

const total = passed + failed;
console.log('─'.repeat(50));
console.log(`Results: ${passed}/${total} suites passed`);
if (failed > 0) {
  console.log(`${failed} suite(s) FAILED`);
  process.exit(1);
} else {
  console.log('All tests passed 🎉');
}
