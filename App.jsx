import React, { useCallback, useEffect, useMemo, useReducer, useState } from 'react';

// In Electron the main process injects __API_PORT__ before DOM load.
// In browser dev mode the Vite proxy forwards /api → localhost:8787.
const API_BASE = (typeof window !== 'undefined' && window.__API_PORT__)
  ? `http://127.0.0.1:${window.__API_PORT__}`
  : '';

// ─────────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────────
function fmtCurrency(n) {
  if (n == null) return '—';
  return '$' + Number(n).toFixed(2);
}

function fmtPct(n) {
  if (n == null || n === 0) return null;
  return Math.round(n * 100) + '% off';
}

function coverageClass(score) {
  if (score >= 0.85) return 'coverage-high';
  if (score >= 0.60) return 'coverage-medium';
  return 'coverage-low';
}

// ─────────────────────────────────────────────────────────────────────────────
// API
// ─────────────────────────────────────────────────────────────────────────────
async function apiFetch(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

// ─────────────────────────────────────────────────────────────────────────────
// State reducer
// ─────────────────────────────────────────────────────────────────────────────
const initState = {
  postalCode:    'H2X 1Y4',
  householdSize: 2,
  stores:        [],
  selectedStoreId: '',
  deals:         null,
  averageCart:   null,
  recommendedCart: null,
  comparison:    null,
  loading:       false,
  loadingMessage: '',
  error:         null,
  tab:           'deals',
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_POSTAL':         return { ...state, postalCode: action.payload };
    case 'SET_SIZE':           return { ...state, householdSize: action.payload };
    case 'SET_STORES':         return { ...state, stores: action.payload };
    case 'SET_STORE':          return { ...state, selectedStoreId: action.payload };
    case 'SET_DEALS':          return { ...state, deals: action.payload };
    case 'SET_AVG_CART':       return { ...state, averageCart: action.payload };
    case 'SET_REC_CART':       return { ...state, recommendedCart: action.payload };
    case 'SET_COMPARISON':     return { ...state, comparison: action.payload };
    case 'SET_LOADING':        return { ...state, loading: action.payload, loadingMessage: action.msg ?? '' };
    case 'SET_ERROR':          return { ...state, error: action.payload, loading: false };
    case 'SET_TAB':            return { ...state, tab: action.payload };
    default:                   return state;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function Spinner({ message }) {
  return (
    <div className="loading-state" role="status">
      <div className="spinner" aria-hidden="true" />
      <span>{message || 'Loading…'}</span>
    </div>
  );
}

function Empty({ icon = '🛒', message = 'No data available.' }) {
  return (
    <div className="empty-state">
      <div style={{ fontSize: '2rem' }}>{icon}</div>
      <p>{message}</p>
    </div>
  );
}

function RefreshMeta({ refresh }) {
  if (!refresh) return null;
  const date = refresh.effectiveDate ?? refresh.refreshedAt?.slice(0, 10);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      {refresh.isStale && <span className="stale-label">Stale data</span>}
      <span className="refresh-label">Updated {date}</span>
    </div>
  );
}

function TierTag({ tier }) {
  if (!tier) return null;
  const cls = { A: 'tag-tier-a', B: 'tag-tier-b', C: 'tag-tier-c' }[tier] ?? 'tag-category';
  return <span className={`tag ${cls}`}>Tier {tier}</span>;
}

// ── Deals view ────────────────────────────────────────────────────────────────
function DealsView({ deals, loading }) {
  if (loading) return <Spinner message="Scoring today's deals…" />;
  if (!deals)  return <Empty icon="🏷️" message="Select a store to see deals." />;

  const items = deals.items ?? deals.deals ?? [];
  if (!items.length) return <Empty icon="🏷️" message="No deals found for this store today." />;

  return (
    <>
      {deals.refresh && (
        <div style={{ marginBottom: '1rem' }}>
          <RefreshMeta refresh={deals.refresh} />
        </div>
      )}
      <div className="scroll-area">
        <ul className="deal-list" aria-label="Best deals">
          {items.map((deal, i) => {
            const pct    = fmtPct(deal.discountPct);
            const score  = deal.dealScore ?? deal.score;
            const catKey = (deal.category ?? '').toLowerCase();
            return (
              <li key={deal.productId ?? deal.id ?? i} className="deal-item">
                <div className="deal-info">
                  <div className="deal-name">{deal.name}</div>
                  {deal.explanationSummary && (
                    <div className="deal-note">{deal.explanationSummary}</div>
                  )}
                  <div className="deal-tags">
                    {deal.category && <span className="tag tag-category">{deal.category}</span>}
                    <TierTag tier={deal.relevanceTier} />
                    {pct && <span className="tag tag-discount">{pct}</span>}
                  </div>
                </div>
                <div className="deal-prices">
                  <div className="deal-price-current">{fmtCurrency(deal.currentPrice ?? deal.price)}</div>
                  {deal.regularPrice && deal.regularPrice !== deal.currentPrice && (
                    <div className="deal-price-regular">{fmtCurrency(deal.regularPrice)}</div>
                  )}
                  {score != null && (
                    <div className="deal-score-bar">
                      <div className="score-track">
                        <div className="score-fill" style={{ width: `${Math.min(100, score)}%` }} />
                      </div>
                      <span className="score-value">{Number(score).toFixed(0)}</span>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}

// ── Average cart view ─────────────────────────────────────────────────────────
function AverageCartView({ data, loading, householdSize }) {
  if (loading) return <Spinner message="Computing benchmark cart…" />;
  if (!data)   return <Empty icon="🧺" message="Select a store and household size." />;

  const items    = data.lineItems ?? data.items ?? [];
  const coverage = data.coverageScore;

  return (
    <>
      {data.refresh && <div style={{ marginBottom: '0.75rem' }}><RefreshMeta refresh={data.refresh} /></div>}
      <div className="cart-summary">
        <span className="total-amount">{fmtCurrency(data.total)}</span>
        <span className="total-label">weekly est. · {householdSize} person{householdSize !== 1 ? 's' : ''}</span>
        {coverage != null && (
          <span className={`coverage-pill ${coverageClass(coverage)}`}>
            {Math.round(coverage * 100)}% matched
          </span>
        )}
      </div>
      {data.summary && <p style={{ fontSize: '0.8rem', color: 'var(--text-2)', marginBottom: '0.8rem' }}>{data.summary}</p>}
      <div className="scroll-area">
        <ul className="cart-list" aria-label="Average cart items">
          {items.map((item, i) => {
            const unavail = item.matchType === 'unavailable';
            const isSub   = item.matchType === 'substitute';
            return (
              <li key={item.canonicalItem ?? item.name ?? i} className={`cart-item ${unavail ? 'unavailable' : ''}`}>
                <div className="cart-item-left">
                  <span className="category-badge">{item.category}</span>
                  <span className="cart-item-name">{item.matchedProductName ?? item.name ?? item.canonicalItem}</span>
                  {isSub && <div className="cart-item-sub">↩ substitute</div>}
                  {unavail && <div className="cart-item-unavailable">Not available</div>}
                </div>
                <div className="cart-item-right">
                  {!unavail && <div className="cart-item-price">{fmtCurrency(item.lineTotal)}</div>}
                  <div className="cart-item-qty">
                    {item.quantity}× {fmtCurrency(item.unitPrice)}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}

// ── Weekly cart view ──────────────────────────────────────────────────────────
function WeeklyCartView({ data, loading, householdSize }) {
  if (loading) return <Spinner message="Building your 7-day cart…" />;
  if (!data)   return <Empty icon="📅" message="Select a store and household size." />;

  const items    = data.lineItems ?? [];
  const coverage = data.categoryCoverage ?? {};
  const catKeys  = Object.keys(coverage);

  return (
    <>
      {data.refresh && <div style={{ marginBottom: '0.75rem' }}><RefreshMeta refresh={data.refresh} /></div>}
      <div className="cart-summary">
        <span className="total-amount">{fmtCurrency(data.total)}</span>
        <span className="total-label">7-day cart · {householdSize}pax</span>
        {data.confidenceLevel && (
          <span className={`coverage-pill ${
            data.confidenceLevel === 'high' ? 'coverage-high' :
            data.confidenceLevel === 'medium' ? 'coverage-medium' : 'coverage-low'
          }`}>{data.confidenceLevel} confidence</span>
        )}
      </div>

      {catKeys.length > 0 && (
        <div className="category-grid">
          {catKeys.map((cat) => (
            <div key={cat} className={`cat-tile ${coverage[cat] ? 'covered' : 'not-covered'}`}>
              {coverage[cat] ? '✓' : '✗'} {cat}
            </div>
          ))}
        </div>
      )}

      <div className="scroll-area" style={{ marginTop: '1rem' }}>
        <ul className="cart-list" aria-label="Weekly cart items">
          {items.map((item, i) => {
            const unavail = item.matchType === 'unavailable';
            const isSub   = item.matchType === 'substitute';
            return (
              <li key={item.canonicalItem ?? i} className={`cart-item ${unavail ? 'unavailable' : ''}`}>
                <div className="cart-item-left">
                  <span className="category-badge">{item.category}</span>
                  <span className="cart-item-name">{item.matchedProductName ?? item.canonicalItem}</span>
                  {item.selectionExplanation && (
                    <div className="cart-item-meta">{item.selectionExplanation}</div>
                  )}
                  {isSub && item.substitutionReason && (
                    <div className="cart-item-sub">↩ {item.substitutionReason}</div>
                  )}
                  {unavail && <div className="cart-item-unavailable">Not available this week</div>}
                </div>
                <div className="cart-item-right">
                  {!unavail && <div className="cart-item-price">{fmtCurrency(item.lineTotal)}</div>}
                  <div className="cart-item-qty">Qty: {item.quantity}</div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}

// ── Comparison view ───────────────────────────────────────────────────────────
function CompareView({ data, loading, selectedStoreId, onSelectStore }) {
  if (loading) return <Spinner message="Comparing nearby stores…" />;
  if (!data)   return <Empty icon="🗺️" message="Do a postal code search to compare stores." />;

  const stores = data.stores ?? [];
  if (!stores.length) return <Empty icon="🗺️" message="No stores found for comparison." />;

  return (
    <>
      {data.refresh && <div style={{ marginBottom: '0.75rem' }}><RefreshMeta refresh={data.refresh} /></div>}
      <ul className="compare-list" aria-label="Store comparison">
        {stores.map((entry, i) => {
          const s = entry.store ?? entry;
          const id = s.id ?? s.store_id;
          const isSelected = id === selectedStoreId;
          return (
            <li
              key={id}
              className={`compare-item ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelectStore(id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onSelectStore(id)}
              aria-pressed={isSelected}
            >
              <div className={`compare-rank rank-${entry.rank ?? i + 1}`}>#{entry.rank ?? i + 1}</div>
              <div>
                <div className="compare-name">{s.name}</div>
                <div className="compare-addr">
                  {s.banner && <strong style={{ color: 'var(--accent)', marginRight: '0.35rem' }}>{s.banner}</strong>}
                  {s.address ?? ''}
                </div>
              </div>
              <div className="compare-signal">
                <div className="compare-total">{fmtCurrency(entry.averageCartTotal)}</div>
                <div className="compare-per">week</div>
                {entry.dealSignal > 0 && (
                  <>
                    <div className="deal-signal-label">Deal score</div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--green)' }}>
                      {Number(entry.dealSignal).toFixed(0)}
                    </div>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main App
// ─────────────────────────────────────────────────────────────────────────────
const HOUSEHOLD_SIZES = [1, 2, 4, 6];

const TABS = [
  { id: 'deals',   label: '🏷️ Best Deals' },
  { id: 'cart',    label: '🧺 Avg Cart' },
  { id: 'weekly',  label: '📅 Weekly Cart' },
  { id: 'compare', label: '🗺️ Compare' },
];

export default function App() {
  const [state, dispatch] = useReducer(reducer, initState);
  const {
    postalCode, householdSize, stores, selectedStoreId,
    deals, averageCart, recommendedCart, comparison,
    loading, loadingMessage, error, tab,
  } = state;

  const selectedStore = useMemo(
    () => stores.find((s) => s.id === selectedStoreId) ?? null,
    [stores, selectedStoreId]
  );

  // ── Load dashboard data for selected store ──────────────────────────────
  const loadDashboard = useCallback(async (storeId, size) => {
    if (!storeId) return;
    dispatch({ type: 'SET_LOADING', payload: true, msg: 'Loading store data…' });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const [dealsData, avgData, recData, cmpData] = await Promise.all([
        apiFetch(`/api/deals?storeId=${encodeURIComponent(storeId)}&limit=30`),
        apiFetch(`/api/average-cart?storeId=${encodeURIComponent(storeId)}&householdSize=${size}`),
        apiFetch(`/api/recommended-cart?storeId=${encodeURIComponent(storeId)}&householdSize=${size}`),
        apiFetch(`/api/store-compare?postalCode=${encodeURIComponent(postalCode)}&householdSize=${size}`),
      ]);

      dispatch({ type: 'SET_DEALS',      payload: dealsData });
      dispatch({ type: 'SET_AVG_CART',   payload: avgData });
      dispatch({ type: 'SET_REC_CART',   payload: recData });
      dispatch({ type: 'SET_COMPARISON', payload: cmpData });
    } catch (e) {
      dispatch({ type: 'SET_ERROR', payload: e.message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [postalCode]);

  // ── Search stores by postal code ─────────────────────────────────────────
  async function loadStores() {
    if (!postalCode.trim()) return;
    dispatch({ type: 'SET_LOADING', payload: true, msg: 'Searching nearby stores…' });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const data  = await apiFetch(`/api/stores?postalCode=${encodeURIComponent(postalCode)}`);
      const list  = (data.stores ?? []).map((s) => ({
        id:         s.id,
        banner:     s.banner,
        name:       s.name,
        address:    s.address,
        city:       s.city,
        province:   s.province,
        postalCode: s.postalCode,
      }));
      dispatch({ type: 'SET_STORES', payload: list });

      const next = list.some((s) => s.id === selectedStoreId) ? selectedStoreId : (list[0]?.id ?? '');
      dispatch({ type: 'SET_STORE', payload: next });
      dispatch({ type: 'SET_LOADING', payload: false });

      if (next) loadDashboard(next, householdSize);
    } catch (e) {
      dispatch({ type: 'SET_ERROR', payload: e.message });
    }
  }

  // ── Initial load ─────────────────────────────────────────────────────────
  useEffect(() => { loadStores(); }, []); // eslint-disable-line

  // ── Store / size change ───────────────────────────────────────────────────
  useEffect(() => {
    if (selectedStoreId) loadDashboard(selectedStoreId, householdSize);
  }, [selectedStoreId, householdSize]); // eslint-disable-line

  const handleSelectStore = (id) => {
    dispatch({ type: 'SET_STORE', payload: id });
    dispatch({ type: 'SET_TAB',   payload: 'deals' });
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="app-shell">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <header className="hero">
        <div className="hero-brand">
          <p className="eyebrow">PC Express · Daily Intelligence</p>
          <h1>No More Groceries</h1>
          <p className="subcopy">
            Daily deals, benchmark cart pricing, and a 7-day recommended cart — for your store.
          </p>
        </div>
        <div className="hero-stats">
          <div className="stat-chip">
            <span>Store</span>
            <strong title={selectedStore?.name}>{selectedStore?.name ?? '—'}</strong>
          </div>
          <div className="stat-chip">
            <span>Banner</span>
            <strong>{selectedStore?.banner ?? '—'}</strong>
          </div>
          <div className="stat-chip">
            <span>Household</span>
            <strong>{householdSize} person{householdSize !== 1 ? 's' : ''}</strong>
          </div>
        </div>
      </header>

      {/* ── Controls ──────────────────────────────────────────────────────── */}
      <div className="controls-panel" role="search">
        <div className="form-field">
          <label htmlFor="postal-input">Postal Code</label>
          <input
            id="postal-input"
            value={postalCode}
            onChange={(e) => dispatch({ type: 'SET_POSTAL', payload: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && loadStores()}
            placeholder="e.g. H2X 1Y4"
            autoComplete="postal-code"
          />
        </div>

        <div className="form-field">
          <label htmlFor="store-select">Store</label>
          <select
            id="store-select"
            value={selectedStoreId}
            onChange={(e) => dispatch({ type: 'SET_STORE', payload: e.target.value })}
          >
            {stores.length === 0 && <option value="">No stores loaded</option>}
            {stores.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label>Household Size</label>
          <div className="size-picker">
            {HOUSEHOLD_SIZES.map((n) => (
              <button
                key={n}
                className={`size-btn ${householdSize === n ? 'active' : ''}`}
                onClick={() => dispatch({ type: 'SET_SIZE', payload: n })}
                aria-pressed={householdSize === n}
              >{n}</button>
            ))}
            <input
              type="number"
              min="1"
              max="20"
              value={HOUSEHOLD_SIZES.includes(householdSize) ? '' : householdSize}
              placeholder="Custom"
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (v >= 1) dispatch({ type: 'SET_SIZE', payload: v });
              }}
              style={{ width: '72px', textAlign: 'center' }}
              aria-label="Custom household size"
            />
          </div>
        </div>

        <button
          className="btn-primary"
          onClick={loadStores}
          disabled={loading}
          id="search-btn"
          aria-label="Search nearby stores"
        >
          {loading ? '…' : 'Search stores'}
        </button>

        {selectedStore && (
          <div className="store-meta-bar" style={{ width: '100%' }}>
            📍 {selectedStore.address}{selectedStore.city ? `, ${selectedStore.city}` : ''}{selectedStore.province ? `, ${selectedStore.province}` : ''}
          </div>
        )}
      </div>

      {/* ── Error banner ──────────────────────────────────────────────────── */}
      {error && (
        <div className="banner error" role="alert">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* ── Loading banner ─────────────────────────────────────────────────*/}
      {loading && (
        <div className="banner info" role="status">
          <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
          <span>{loadingMessage || 'Loading…'}</span>
        </div>
      )}

      {/* ── Tab navigation ────────────────────────────────────────────────── */}
      <nav className="tab-nav" aria-label="Dashboard sections" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tab-btn ${tab === t.id ? 'active' : ''}`}
            onClick={() => dispatch({ type: 'SET_TAB', payload: t.id })}
            role="tab"
            aria-selected={tab === t.id}
            id={`tab-${t.id}`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* ── Tab panels ────────────────────────────────────────────────────── */}
      <div role="tabpanel" aria-labelledby={`tab-${tab}`}>
        {tab === 'deals' && (
          <div className="card">
            <div className="card-header">
              <h2>🏷️ Best Deals Today</h2>
              <RefreshMeta refresh={deals?.refresh} />
            </div>
            <div className="card-body">
              <DealsView deals={deals} loading={loading} />
            </div>
          </div>
        )}

        {tab === 'cart' && (
          <div className="card">
            <div className="card-header">
              <h2>🧺 Average Weekly Cart</h2>
              <RefreshMeta refresh={averageCart?.refresh} />
            </div>
            <div className="card-body">
              <AverageCartView data={averageCart} loading={loading} householdSize={householdSize} />
            </div>
          </div>
        )}

        {tab === 'weekly' && (
          <div className="card">
            <div className="card-header">
              <h2>📅 Recommended 7-Day Cart</h2>
              <RefreshMeta refresh={recommendedCart?.refresh} />
            </div>
            <div className="card-body">
              <WeeklyCartView data={recommendedCart} loading={loading} householdSize={householdSize} />
            </div>
          </div>
        )}

        {tab === 'compare' && (
          <div className="card">
            <div className="card-header">
              <h2>🗺️ Nearby Store Comparison</h2>
              <RefreshMeta refresh={comparison?.refresh} />
            </div>
            <div className="card-body">
              <CompareView
                data={comparison}
                loading={loading}
                selectedStoreId={selectedStoreId}
                onSelectStore={handleSelectStore}
              />
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
