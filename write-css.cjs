const fs = require('fs');

const css = `
@reference "./tailwind.css";

/* ── Elegance / Utility Reset ────────────────────────────────────────────── */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-size: 16px;
  scroll-behavior: smooth;
}

body {
  @apply bg-paper text-ink;
  background-color: var(--color-paper);
  color: var(--color-ink);
  min-height: 100vh;
  line-height: 1.6;
}

/* Typography Selection */
.eyebrow {
  @apply text-accent uppercase tracking-widest font-bold text-xs mb-2 block;
}

.title-primary {
  font-family: 'Playfair Display', serif;
  font-size: 4rem;
  line-height: 1.05;
  font-style: italic;
  font-weight: 500;
  color: var(--color-accent);
  margin-bottom: 0.5rem;
  letter-spacing: -0.02em;
}

.subcopy {
  @apply text-slate mt-4 max-w-lg text-lg leading-relaxed font-light;
}

/* ── App shell ───────────────────────────────────────────────────────────── */
.app-shell {
  max-width: 1400px;
  margin: 0 auto;
  padding: 4rem 2rem 6rem;
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 4rem;
  align-items: flex-start;
}

@media (max-width: 900px) {
  .app-shell {
    grid-template-columns: 1fr;
    padding: 2rem 1rem;
    gap: 2rem;
  }
}

/* ── Hero header (Sidebar styling) ────────────────────────────────────────── */
.hero {
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 4rem;
}

.hero-brand {
  margin-bottom: 3rem;
  border-left: 2px solid var(--color-accent);
  padding-left: 1.5rem;
}

.hero-stats {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-top: 2rem;
}

.stat-chip {
  background: transparent;
  border-bottom: 1px solid rgba(0,0,0,0.1);
  padding: 0.5rem 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-chip span {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-slate);
}

.stat-chip strong {
  font-size: 1.1rem;
  font-family: 'Playfair Display', serif;
  font-style: italic;
  color: var(--color-ink);
}

.lang-toggle {
  align-self: flex-start;
  margin-top: 1rem;
  background: transparent;
  border: 1px solid var(--color-accent);
  color: var(--color-accent);
  padding: 0.4rem 1rem;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  cursor: pointer;
  transition: all 0.3s ease;
}

.lang-toggle:hover {
  background: var(--color-accent);
  color: white;
}

/* ── Right Column Container ─────────────────────────────────────────────── */
.content-area {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* ── Controls (Postal Code / Search) ────────────────────────────────────── */
.controls-panel {
  background: var(--color-surface);
  border: 1px solid rgba(0,0,0,0.08);
  padding: 2.5rem;
  box-shadow: 12px 12px 0px rgba(139,0,0,0.04);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1.5rem;
  position: relative;
  z-index: 10;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-field label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-slate);
  font-weight: 600;
}

.form-field input, .form-field select {
  background: transparent;
  border: none;
  border-bottom: 2px solid rgba(0,0,0,0.1);
  padding: 0.5rem 0;
  font-size: 1.1rem;
  font-family: 'DM Sans', sans-serif;
  color: var(--color-ink);
  outline: none;
  transition: border-color 0.3s ease;
  border-radius: 0;
}

.form-field input:focus, .form-field select:focus {
  border-bottom-color: var(--color-accent);
}

.size-picker {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.size-btn {
  background: transparent;
  border: 1px solid rgba(0,0,0,0.1);
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'DM Sans';
  cursor: pointer;
  transition: all 0.2s ease;
}

.size-btn.active {
  background: var(--color-accent);
  color: white;
  border-color: var(--color-accent);
}

.size-btn:hover:not(.active) {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.btn-primary {
  grid-column: 1 / -1;
  background: var(--color-ink);
  color: white;
  border: none;
  padding: 1.25rem;
  font-family: 'DM Sans', sans-serif;
  font-size: 1rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  cursor: pointer;
  transition: background 0.3s ease, transform 0.2s ease;
  margin-top: 0.5rem;
}

.btn-primary:hover {
  background: var(--color-accent);
}

.btn-primary:active {
  transform: translateY(2px);
}

/* ── Tabs Navigation ────────────────────────────────────────────────────── */
.tab-nav {
  display: flex;
  gap: 2rem;
  border-bottom: 1px solid rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

.tab-btn {
  background: none;
  border: none;
  padding: 1rem 0;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-slate);
  cursor: pointer;
  position: relative;
  transition: color 0.3s ease;
}

.tab-btn.active {
  color: var(--color-accent);
  font-weight: 600;
}

.tab-btn::after {
  content: "";
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--color-accent);
  transform: scaleX(0);
  transition: transform 0.3s ease;
  transform-origin: left;
}

.tab-btn.active::after {
  transform: scaleX(1);
}

/* ── Content Cards & Lists ──────────────────────────────────────────────── */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(0,0,0,0.05);
}

.card-header h2 {
  font-family: 'Playfair Display', serif;
  font-size: 2.5rem;
  font-style: italic;
  font-weight: 400;
  color: var(--color-ink);
}

.refresh-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-slate);
}

/* Deals List */
.deal-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.deal-item {
  display: flex;
  justify-content: space-between;
  padding: 1.5rem;
  background: var(--color-surface);
  border: 1px solid rgba(0,0,0,0.05);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
  animation-fill-mode: backwards;
}

.deal-item:hover {
  transform: translateX(4px) translateY(-2px);
  box-shadow: 8px 8px 0px rgba(139,0,0,0.05);
  border-color: rgba(139,0,0,0.2);
}

@keyframes slideUp {
  0% { opacity: 0; transform: translateY(20px); }
  100% { opacity: 1; transform: translateY(0); }
}

.deal-item:nth-child(1) { animation-delay: 0.05s; }
.deal-item:nth-child(2) { animation-delay: 0.1s; }
.deal-item:nth-child(3) { animation-delay: 0.15s; }
.deal-item:nth-child(4) { animation-delay: 0.2s; }
.deal-item:nth-child(5) { animation-delay: 0.25s; }

.deal-info .deal-name {
  font-size: 1.15rem;
  font-weight: 500;
  color: var(--color-ink);
  margin-bottom: 0.4rem;
}

.deal-info .deal-note {
  font-size: 0.85rem;
  color: var(--color-slate);
  margin-bottom: 0.8rem;
  font-style: italic;
}

.deal-tags {
  display: flex;
  gap: 0.5rem;
}

.tag {
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: 0.2rem 0.5rem;
  border: 1px solid;
}

.tag-category { border-color: rgba(0,0,0,0.1); color: var(--color-slate); }
.tag-tier-a { border-color: var(--color-gold); color: var(--color-gold); }
.tag-tier-b { border-color: var(--color-accent); color: var(--color-accent); }
.tag-discount { background: var(--color-accent); color: white; border-color: var(--color-accent); }

.deal-prices {
  text-align: right;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
}

.deal-price-current {
  font-family: 'Playfair Display', serif;
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--color-accent);
  line-height: 1;
}

.deal-price-regular {
  font-size: 0.9rem;
  color: var(--color-slate);
  text-decoration: line-through;
  margin-top: 0.25rem;
}

.deal-score-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.score-track {
  width: 60px;
  height: 2px;
  background: rgba(0,0,0,0.1);
}

.score-fill {
  height: 100%;
  background: var(--color-gold);
}

.score-value {
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--color-ink);
}

/* Empty / Loading States */
.empty-state {
  padding: 4rem 2rem;
  text-align: center;
  border: 1px dashed rgba(0,0,0,0.1);
  color: var(--color-slate);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.loading-state {
  padding: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  color: var(--color-accent);
  font-style: italic;
  font-family: 'Playfair Display', serif;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid rgba(139,0,0,0.2);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Compare View */
.compare-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  list-style: none;
}

.compare-item {
  background: var(--color-surface);
  border: 1px solid rgba(0,0,0,0.08);
  padding: 2rem;
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
}

.compare-item:hover, .compare-item.active, .compare-item.selected {
  border-color: var(--color-accent);
  box-shadow: 6px 6px 0px rgba(139,0,0,0.05);
}

.compare-rank {
  position: absolute;
  top: -10px;
  right: -10px;
  width: 32px;
  height: 32px;
  background: var(--color-ink);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Playfair Display', serif;
  font-style: italic;
  font-size: 0.9rem;
}

.compare-rank.rank-1 { background: var(--color-accent); }

.compare-name {
  font-size: 1.25rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.compare-addr {
  font-size: 0.85rem;
  color: var(--color-slate);
  margin-bottom: 1.5rem;
}

.compare-signal {
  border-top: 1px solid rgba(0,0,0,0.05);
  padding-top: 1rem;
}

.compare-total {
  font-family: 'Playfair Display', serif;
  font-size: 2rem;
  font-weight: 600;
  color: var(--color-ink);
  line-height: 1;
}

.compare-per {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-slate);
  margin-top: 0.25rem;
}
`;

fs.writeFileSync('styles.css', css);
