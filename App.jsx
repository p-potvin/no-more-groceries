import React, { useEffect, useMemo, useState } from 'react';

const API_BASE = 'http://localhost:8787';

function Section({ title, children }) {
  return (
    <section className="card">
      <div className="section-header">
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}

export default function App() {
  const [postalCode, setPostalCode] = useState('H2X 1Y4');
  const [householdSize, setHouseholdSize] = useState(2);
  const [stores, setStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [deals, setDeals] = useState([]);
  const [averageCart, setAverageCart] = useState(null);
  const [recommendedCart, setRecommendedCart] = useState(null);
  const [comparison, setComparison] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedStore = useMemo(
    () => stores.find((store) => store.id === selectedStoreId) || null,
    [stores, selectedStoreId]
  );

  async function fetchJson(path) {
    const response = await fetch(`${API_BASE}${path}`);
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }
    return response.json();
  }

  async function refreshAll(nextStoreId) {
    const storeId = nextStoreId || selectedStoreId;
    if (!storeId) return;

    setLoading(true);
    setError('');

    try {
      const [dealsData, averageCartData, recommendedCartData, comparisonData] = await Promise.all([
        fetchJson(`/api/deals?storeId=${encodeURIComponent(storeId)}`),
        fetchJson(`/api/average-cart?storeId=${encodeURIComponent(storeId)}&householdSize=${householdSize}`),
        fetchJson(`/api/recommended-cart?storeId=${encodeURIComponent(storeId)}&householdSize=${householdSize}`),
        fetchJson(`/api/store-compare?postalCode=${encodeURIComponent(postalCode)}&householdSize=${householdSize}`),
      ]);

      setDeals(dealsData.deals || []);
      setAverageCart(averageCartData);
      setRecommendedCart(recommendedCartData);
      setComparison(comparisonData.stores || []);
    } catch (err) {
      setError(err.message || 'Unable to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }

  async function loadStores() {
    setLoading(true);
    setError('');

    try {
      const storesData = await fetchJson(`/api/stores?postalCode=${encodeURIComponent(postalCode)}`);
      const nextStores = storesData.stores || [];
      setStores(nextStores);

      const firstStoreId = nextStores[0]?.id || '';
      const nextStoreId = selectedStoreId && nextStores.some((store) => store.id === selectedStoreId)
        ? selectedStoreId
        : firstStoreId;

      setSelectedStoreId(nextStoreId);

      if (nextStoreId) {
        await refreshAll(nextStoreId);
      }
    } catch (err) {
      setError(err.message || 'Unable to load stores.');
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedStoreId) {
      refreshAll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStoreId, householdSize]);

  return (
    <div className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">PC Express Deals Dashboard</p>
          <h1>No More Groceries</h1>
          <p className="subcopy">
            Daily grocery deal tracking, benchmark cart pricing, and a recommended 7-day cart.
          </p>
        </div>
        <div className="hero-stats">
          <div className="stat">
            <span>Selected store</span>
            <strong>{selectedStore ? selectedStore.name : '—'}</strong>
          </div>
          <div className="stat">
            <span>Household size</span>
            <strong>{householdSize}</strong>
          </div>
        </div>
      </header>

      <Section title="Controls">
        <div className="controls-grid">
          <label>
            Postal code
            <input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
          </label>
          <label>
            Household size
            <input
              type="number"
              min="1"
              max="12"
              value={householdSize}
              onChange={(e) => setHouseholdSize(Number(e.target.value) || 1)}
            />
          </label>
          <label>
            Store
            <select value={selectedStoreId} onChange={(e) => setSelectedStoreId(e.target.value)}>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
          </label>
          <button onClick={loadStores}>Refresh nearby stores</button>
        </div>
      </Section>

      {error ? <p className="error-banner">{error}</p> : null}
      {loading ? <p className="loading-banner">Loading dashboard…</p> : null}

      <div className="dashboard-grid">
        <Section title="Best deals">
          <ul className="list-reset">
            {deals.map((deal) => (
              <li key={deal.id} className="list-row">
                <div>
                  <strong>{deal.name}</strong>
                  <p>{deal.note}</p>
                </div>
                <div className="price-block">
                  <span>${deal.price.toFixed(2)}</span>
                  <small>{deal.discountLabel}</small>
                </div>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Average weekly cart">
          {averageCart ? (
            <div>
              <p className="big-number">${averageCart.total.toFixed(2)}</p>
              <p>{averageCart.summary}</p>
              <ul className="list-reset compact-list">
                {averageCart.items.map((item) => (
                  <li key={item.name} className="list-row compact">
                    <span>{item.name}</span>
                    <span>{item.quantity} × ${item.unitPrice.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Section>

        <Section title="Recommended 7-day cart">
          {recommendedCart ? (
            <div>
              <p className="big-number">${recommendedCart.total.toFixed(2)}</p>
              <p>{recommendedCart.summary}</p>
              <ul className="list-reset compact-list">
                {recommendedCart.items.map((item) => (
                  <li key={item.name} className="list-row compact">
                    <span>{item.name}</span>
                    <span>{item.quantity}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Section>

        <Section title="Nearby store comparison">
          <ul className="list-reset compact-list">
            {comparison.map((store) => (
              <li key={store.id} className="list-row compact">
                <span>{store.name}</span>
                <span>${store.estimatedTotal.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </div>
  );
}
