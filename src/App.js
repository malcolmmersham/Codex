import { useState, useEffect, useCallback, useMemo } from 'https://esm.sh/react@18.3.1';
import { html } from 'https://esm.sh/htm/react';

// ─── FRAMEWORK DEFINITION ──────────────────────────────────────────────────

const PILLARS = [
  { id: 'moat', label: 'Moat & Durability', gateQuestion: 'Is the moat durable?', weight: 0.25, failAction: 'stop', description: 'Competitive advantage, pricing power, barriers to entry, durability of the business model', rubric: { 10: 'Exceptional moat — regulatory licence, network effects, or near-impossible switching costs compounding over decades', 8: 'Strong moat — clear pricing power and durable competitive advantage with minimal erosion risk', 6: 'Moderate moat — meaningful advantages but subject to competitive pressure or disruption', 4: 'Weak moat — some differentiation but easily replicated or commoditising', 2: 'No moat — commodity business competing on price alone' } },
  { id: 'management', label: 'Management Quality', gateQuestion: 'Is management trustworthy?', weight: 0.15, failAction: 'stop', description: 'Track record, capital allocation discipline, shareholder alignment, transparency', rubric: { 10: 'Exceptional — proven capital allocators, skin in the game, long track record of under-promise/over-deliver', 8: 'Strong — good track record, aligned incentives, conservative guidance', 6: 'Adequate — reasonable management, some concerns on capital allocation or communication', 4: 'Weak — questionable decisions, excessive dilution, or opacity', 2: 'Red flag — history of destruction, misleading guidance, or governance failure' } },
  { id: 'balanceSheet', label: 'Balance Sheet Safety', gateQuestion: 'Is the balance sheet safe?', weight: 0.20, failAction: 'reassess', description: 'Net debt/equity, interest coverage, free cash flow, ability to survive a prolonged downturn', rubric: { 10: 'Net cash position, strong FCF, zero liquidity risk', 8: 'Conservative leverage, high interest coverage (>10×), robust FCF', 6: 'Moderate leverage, adequate coverage, positive FCF', 4: 'Elevated leverage, tight coverage, FCF breakeven or negative', 2: 'Highly leveraged, at risk of covenant breach or capital raise' } },
  { id: 'growth', label: 'Growth Trajectory', weight: 0.15, failAction: 'none', description: 'Revenue and earnings growth trend, addressable market size, reinvestment optionality', rubric: { 10: 'Explosive and durable growth (>20% p.a.) in a large, underpenetrated market', 8: 'Strong growth (10–20% p.a.) with a long runway and compounding reinvestment', 6: 'Steady growth (5–10% p.a.), reliable compounder', 4: 'Slow growth (0–5% p.a.) or cyclical', 2: 'Declining revenues or structural shrinkage' } },
  { id: 'valuation', label: 'Valuation & Margin of Safety', gateQuestion: 'Is there a margin of safety?', weight: 0.15, failAction: 'watchlist', description: 'Current price vs intrinsic value, PE vs 5-year average, upside/downside asymmetry', rubric: { 10: 'Trading at a deep discount (>40%) to conservatively estimated intrinsic value', 8: 'Meaningful discount (20–40%) — strong asymmetry in favour of buyer', 6: 'Fair value or slight discount — acceptable entry on quality', 4: 'Moderately overvalued — requires near-perfect execution to justify', 2: 'Significantly overvalued — priced for perfection, minimal margin of safety' } },
  { id: 'marketContext', label: 'Market Context', gateQuestion: 'Is the market context favourable?', weight: 0.10, failAction: 'watchlist', description: 'Temporal (cycle position), Structural (permanent vs cyclical drivers), Irrational (fear vs greed pricing)', rubric: { 10: '5–6 favourable signals — exceptional timing, business good and market offering it cheaply', 8: '4 favourable signals — strong entry, proceed with conviction sizing', 6: '2–3 favourable signals — acceptable entry, size conservatively', 4: '1 favourable signal — wait, timing is against you', 2: '0 favourable signals — watchlist only regardless of business quality' } },
];

const MC_SIGNALS = [
  { id: 'temporal_cycle', dimension: 'Temporal', question: 'Earnings cycle position', favourable: 'Trough or early recovery — earnings are depressed or normalised, not at cyclical peak', unfavourable: 'Late cycle or peak — trailing earnings are elevated and likely to mean-revert' },
  { id: 'temporal_price', dimension: 'Temporal', question: '12-month price move', favourable: 'Stock is flat or down while earnings are stable/growing — narrative has moved faster than fundamentals', unfavourable: 'Stock up 50%+ in the last 12 months without corresponding earnings growth — the multiple expansion has already done the work' },
  { id: 'structural_permanent', dimension: 'Structural', question: 'Are thesis drivers permanent?', favourable: 'At least one driver is regulatory moat, network effect, supply constraint, or demographic — forces that compound regardless of cycle', unfavourable: 'Primary thesis drivers are commodity price, stimulus, interest rate environment, or sector sentiment — all of which reverse' },
  { id: 'structural_horizon', dimension: 'Structural', question: 'Will this advantage exist in 5 years?', favourable: 'High confidence the competitive position strengthens or compounds over the investment horizon', unfavourable: 'Meaningful risk the advantage erodes through technology change, regulatory reversal, or competitive entry' },
  { id: 'irrational_sentiment', dimension: 'Irrational', question: 'Is the market pricing fear or greed?', favourable: 'Selloff driven by sector contagion, narrative fear, or macro noise unrelated to company fundamentals. Insiders buying.', unfavourable: 'Stock making new highs on narrative, analyst upgrades post-run, retail inflow, or CEO flagging caution while market ignores it' },
  { id: 'irrational_price', dimension: 'Irrational', question: 'Does the price match the fundamentals?', favourable: 'Trailing PE is at or below the stock\'s 5-year average with no fundamental deterioration — the stock is cheaper than its own history', unfavourable: 'Forward PE is 3× sector median or requires a decade of flawless execution — the price embeds no margin for error' },
];

const MARKET_PHASES = ['Early Expansion', 'Mid Expansion', 'Late Expansion', 'Peak', 'Early Contraction', 'Mid Contraction', 'Late Contraction', 'Trough'];
const RATE_ENVIRONMENTS = ['Cutting', 'Low & Stable', 'Rising', 'High & Stable'];
const RISK_SENTIMENTS = ['Fear', 'Caution', 'Neutral', 'Optimism', 'Greed'];
const EXCHANGES = ['NASDAQ', 'NYSE', 'ASX', 'NZX', 'LSE', 'TSX', 'OTHER'];
const SECTORS = ['Technology', 'Healthcare', 'Financials', 'Consumer Discretionary', 'Consumer Staples', 'Industrials', 'Energy', 'Materials', 'Utilities', 'Real Estate', 'Communication Services'];
const HORIZONS = ['< 6 months', '6–12 months', '1–2 years', '2–3 years', '3–5 years', '5+ years'];

const DEFAULT_MC_SIGNALS = Object.fromEntries(MC_SIGNALS.map(s => [s.id, { value: null, notes: '' }]));

const DEFAULT_MARKET_CONTEXT = {
  phase: 'Mid Expansion', rateEnvironment: 'High & Stable', riskSentiment: 'Neutral',
  keyTheme: '', tailwinds: [], headwinds: [], sectorRotation: '', assessment: '', lastUpdated: null,
};

const SAMPLE_STOCKS = [
  {
    id: 'sample-1', ticker: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', sector: 'Technology',
    owned: true, shares: 10, costBasis: 175.00, addedDate: '2024-01-15',
    thesis: "Apple's ecosystem lock-in, Services revenue compounding, and Apple Intelligence integration create durable competitive advantages. The transition from hardware margin to software/services margin improves earnings quality significantly.",
    catalysts: ['Apple Intelligence driving the upgrade cycle', 'Services revenue crossing $100B+', 'India manufacturing reducing geopolitical risk'],
    risks: ['China revenue represents ~19% of total', 'EU regulatory pressure on App Store economics', 'Discretionary spending sensitivity in recession'],
    targetPrice: 230, horizon: '2–3 years',
    scores: { moat: 9, management: 8, balanceSheet: 10, growth: 7, valuation: 6, marketContext: 7 },
    mcSignals: { temporal_cycle: { value: 'favourable', notes: 'Services segment still in expansion phase' }, temporal_price: { value: 'neutral', notes: 'Stock broadly flat vs 12 months ago' }, structural_permanent: { value: 'favourable', notes: 'Ecosystem lock-in and App Store network effects are structural' }, structural_horizon: { value: 'favourable', notes: 'Switching costs compound with each Apple device added to household' }, irrational_sentiment: { value: 'neutral', notes: 'No extreme fear or greed signal currently' }, irrational_price: { value: 'unfavourable', notes: 'PE slightly above 5-year average' } },
    notes: '', lastPrice: 0, priceHistory: [], lastUpdated: null,
  },
  {
    id: 'sample-2', ticker: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ', sector: 'Technology',
    owned: true, shares: 5, costBasis: 380.00, addedDate: '2024-02-01',
    thesis: 'Azure cloud growth plus Copilot AI integration across Office 365 creates a massive monetisation opportunity. Enterprise switching costs are extremely high — once a company is on Azure + M365 + Teams + Dynamics, the exit cost is prohibitive.',
    catalysts: ['Copilot enterprise seat adoption (currently < 5% of M365 base)', 'Azure market share gains from Google Cloud', 'GitHub Copilot developer moat deepening'],
    risks: ['Enterprise IT budget tightening delays Copilot adoption', 'OpenAI dependency — key model provider also a potential competitor', 'Antitrust scrutiny on Teams bundling'],
    targetPrice: 500, horizon: '2–3 years',
    scores: { moat: 10, management: 9, balanceSheet: 10, growth: 8, valuation: 6, marketContext: 7 },
    mcSignals: { temporal_cycle: { value: 'favourable', notes: 'Copilot adoption is early innings — < 5% penetration of addressable base' }, temporal_price: { value: 'neutral', notes: 'Modest appreciation, roughly in line with earnings growth' }, structural_permanent: { value: 'favourable', notes: 'Enterprise workflow lock-in (M365, Azure, Teams) is structural' }, structural_horizon: { value: 'favourable', notes: 'Switching costs increase with every workload migrated to Azure' }, irrational_sentiment: { value: 'neutral', notes: 'Fairly priced, no fear or greed extreme' }, irrational_price: { value: 'unfavourable', notes: 'PE at premium to market — requires continued strong execution' } },
    notes: '', lastPrice: 0, priceHistory: [], lastUpdated: null,
  },
  {
    id: 'sample-3', ticker: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ', sector: 'Technology',
    owned: false, shares: 0, costBasis: 0, addedDate: '2024-03-01',
    thesis: 'Dominant AI accelerator position with CUDA software moat creates a two-sided network effect. The Blackwell platform extends this lead. Watching for a better entry after the 200%+ run.',
    catalysts: ['Blackwell GPU ramp addressing inference demand', 'Sovereign AI government contracts', 'NIM microservices enabling enterprise AI deployment'],
    risks: ['Customer concentration — top 5 customers > 50% of data centre revenue', 'AMD MI300X gaining traction, Google/Amazon custom silicon', 'US export controls on H20 chips to China'],
    targetPrice: 110, horizon: '1–2 years',
    scores: { moat: 9, management: 8, balanceSheet: 9, growth: 10, valuation: 4, marketContext: 5 },
    mcSignals: { temporal_cycle: { value: 'unfavourable', notes: 'Earnings at cyclical peak driven by AI infrastructure buildout' }, temporal_price: { value: 'unfavourable', notes: 'Stock up ~200% over 18 months' }, structural_permanent: { value: 'favourable', notes: 'CUDA developer ecosystem is a genuine structural moat' }, structural_horizon: { value: 'favourable', notes: 'AI inference compute demand likely to remain for 5+ years' }, irrational_sentiment: { value: 'unfavourable', notes: 'Retail and momentum inflows, very consensus long positioning' }, irrational_price: { value: 'unfavourable', notes: 'Forward PE ~35× requires near-perfect execution' } },
    notes: 'Watching for pullback to ~$90–110 range for an entry. Business quality is exceptional but timing is wrong at current levels.',
    lastPrice: 0, priceHistory: [], lastUpdated: null,
  },
];

// ─── STORAGE ──────────────────────────────────────────────────────────────

const STORAGE_KEY = 'codex_v2';

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      return { stocks: p.stocks || SAMPLE_STOCKS, marketContext: { ...DEFAULT_MARKET_CONTEXT, ...(p.marketContext || {}) } };
    }
  } catch {}
  return { stocks: SAMPLE_STOCKS, marketContext: DEFAULT_MARKET_CONTEXT };
}

function saveState(s) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
}

// ─── UTILITIES ──────────────────────────────────────────────────────────────

const fmt$ = (v, d = 2) => {
  if (v == null || isNaN(v)) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: d, maximumFractionDigits: d }).format(v);
};
const fmtPct = (v, d = 1) => {
  if (v == null || isNaN(v)) return '—';
  return `${v >= 0 ? '+' : ''}${v.toFixed(d)}%`;
};

function calcScore(scores) {
  if (!scores) return 0;
  return PILLARS.reduce((t, p) => t + (scores[p.id] || 5) * p.weight, 0);
}

function countFav(mcSignals) {
  if (!mcSignals) return 0;
  return Object.values(mcSignals).filter(s => s && s.value === 'favourable').length;
}

function getSignal(score) {
  if (score >= 8.5) return { label: 'Strong Buy', color: '#4ade80' };
  if (score >= 7.5) return { label: 'Buy', color: '#86efac' };
  if (score >= 6.5) return { label: 'Watch', color: '#facc15' };
  if (score >= 5.5) return { label: 'Neutral', color: '#fb923c' };
  if (score >= 4.0) return { label: 'Caution', color: '#f97316' };
  return { label: 'Avoid', color: '#f87171' };
}

function plColor(v) {
  if (v > 0) return '#4ade80';
  if (v < 0) return '#f87171';
  return '#94a3b8';
}

function runGates(scores) {
  const gates = PILLARS.filter(p => p.gateQuestion);
  const results = [];
  let verdict = 'BUY';
  for (const p of gates) {
    const score = scores[p.id] || 0;
    const pass = score >= 5;
    results.push({ pillar: p.label, question: p.gateQuestion, pass, score, failAction: p.failAction });
    if (!pass) {
      if (p.failAction === 'stop') { verdict = 'STOP'; break; }
      if (p.failAction === 'reassess') verdict = 'REASSESS';
      if (p.failAction === 'watchlist' && verdict === 'BUY') verdict = 'WATCHLIST';
    }
  }
  return { gates: results, verdict };
}

const vColor = (v) => ({ BUY: '#4ade80', WATCHLIST: '#facc15', REASSESS: '#fb923c', STOP: '#f87171' }[v] || '#94a3b8');

// ─── YAHOO FINANCE ──────────────────────────────────────────────────────────

async function fetchYahoo(ticker) {
  try {
    const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1y`, { mode: 'cors' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const d = await r.json();
    const res = d.chart?.result?.[0];
    if (!res) throw new Error('no result');
    const meta = res.meta;
    const ts = res.timestamp || [];
    const closes = res.indicators?.quote?.[0]?.close || [];
    const priceHistory = ts.map((t, i) => ({ date: new Date(t * 1000).toISOString().split('T')[0], price: closes[i] })).filter(x => x.price != null);
    return { currentPrice: meta.regularMarketPrice, priceHistory };
  } catch (e) {
    console.warn(`[Yahoo] ${ticker}: ${e.message}`);
    return null;
  }
}

// ─── SVG CHARTS ──────────────────────────────────────────────────────────────

function SparkLine({ data, w = 100, h = 36 }) {
  const prices = (data || []).map(d => d.price).filter(p => p != null);
  if (prices.length < 2) {
    return html`<svg width=${w} height=${h}><line x1="0" y1=${h/2} x2=${w} y2=${h/2} stroke="#334155" stroke-width="1" stroke-dasharray="4,2" /></svg>`;
  }
  const mn = Math.min(...prices), mx = Math.max(...prices), rng = mx - mn || 1;
  const pts = prices.map((p, i) => `${(i / (prices.length - 1)) * w},${h - 2 - ((p - mn) / rng) * (h - 4)}`).join(' ');
  const up = prices[prices.length - 1] >= prices[0];
  return html`<svg width=${w} height=${h}><polyline points=${pts} fill="none" stroke=${up ? '#4ade80' : '#f87171'} stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round" /></svg>`;
}

function PriceChart({ data, w = 640, h = 180 }) {
  const entries = (data || []).filter(d => d.price != null);
  const prices = entries.map(d => d.price);
  if (prices.length < 2) return html`<div style=${{ height: h, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: '0.8rem' }}>No price history — click Refresh to load from Yahoo Finance</div>`;
  const pd = { t: 16, r: 16, b: 28, l: 56 };
  const cw = w - pd.l - pd.r, ch = h - pd.t - pd.b;
  const mn = Math.min(...prices), mx = Math.max(...prices), rng = mx - mn || 1;
  const pts = prices.map((p, i) => `${(i / (prices.length - 1)) * cw},${ch - ((p - mn) / rng) * ch}`).join(' ');
  const areaPts = `0,${ch} ${pts} ${cw},${ch}`;
  const up = prices[prices.length - 1] >= prices[0];
  const lc = up ? '#4ade80' : '#f87171';
  const ac = up ? 'rgba(74,222,128,0.08)' : 'rgba(248,113,113,0.08)';
  const yLabels = [0, 0.5, 1].map(t => ({ y: ch - t * ch, v: fmt$(mn + t * rng, 0) }));
  const xIdxs = [0, Math.floor(entries.length / 2), entries.length - 1];
  const lx = cw, ly = ch - ((prices[prices.length - 1] - mn) / rng) * ch;
  return html`
    <svg width=${w} height=${h} style="overflow:visible">
      <g transform=${`translate(${pd.l},${pd.t})`}>
        ${yLabels.map((y, i) => html`
          <g key=${i}>
            <line x1="0" y1=${y.y} x2=${cw} y2=${y.y} stroke="#1e293b" stroke-width="1" />
            <text x=${-6} y=${y.y + 4} text-anchor="end" fill="#475569" font-size="10">${y.v}</text>
          </g>
        `)}
        <polygon points=${areaPts} fill=${ac} />
        <polyline points=${pts} fill="none" stroke=${lc} stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
        <circle cx=${lx} cy=${ly} r="3.5" fill=${lc} />
        ${xIdxs.filter(i => entries[i]).map((i, j) => html`
          <text key=${j} x=${(i / (entries.length - 1)) * cw} y=${ch + 18} text-anchor="middle" fill="#475569" font-size="10">
            ${new Date(entries[i].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </text>
        `)}
      </g>
    </svg>
  `;
}

function RadarChart({ scores, size = 210 }) {
  const n = PILLARS.length, cx = size / 2, cy = size / 2, mr = size / 2 - 32;
  const angles = PILLARS.map((_, i) => (i * 2 * Math.PI) / n - Math.PI / 2);
  const gridPts = (t) => angles.map(a => `${cx + Math.cos(a) * mr * t},${cy + Math.sin(a) * mr * t}`).join(' ');
  const dataPts = PILLARS.map((p, i) => {
    const v = (scores[p.id] || 0) / 10;
    return `${cx + Math.cos(angles[i]) * mr * v},${cy + Math.sin(angles[i]) * mr * v}`;
  }).join(' ');
  return html`
    <svg width=${size} height=${size}>
      ${[0.2, 0.4, 0.6, 0.8, 1].map((t, i) => html`<polygon key=${i} points=${gridPts(t)} fill="none" stroke="#1e293b" stroke-width="1" />`)}
      ${angles.map((a, i) => html`<line key=${i} x1=${cx} y1=${cy} x2=${cx + Math.cos(a) * mr} y2=${cy + Math.sin(a) * mr} stroke="#1e293b" stroke-width="1" />`)}
      <polygon points=${dataPts} fill="rgba(99,102,241,0.25)" stroke="#6366f1" stroke-width="2" />
      ${PILLARS.map((p, i) => {
        const v = (scores[p.id] || 0) / 10;
        const px = cx + Math.cos(angles[i]) * mr * v;
        const py = cy + Math.sin(angles[i]) * mr * v;
        const lx = cx + Math.cos(angles[i]) * (mr + 20);
        const ly = cy + Math.sin(angles[i]) * (mr + 20);
        return html`
          <g key=${i}>
            <circle cx=${px} cy=${py} r="4" fill="#6366f1" />
            <text x=${lx} y=${ly + 3} text-anchor="middle" fill="#64748b" font-size="9" dominant-baseline="middle">${p.label.split(' ')[0]} ${scores[p.id] || 0}</text>
          </g>
        `;
      })}
    </svg>
  `;
}

// ─── MARKET CONTEXT BANNER (permanent) ────────────────────────────────────

function MCBanner({ ctx, onEdit }) {
  const [open, setOpen] = useState(false);
  const phaseColor = { 'Early Expansion': '#86efac', 'Mid Expansion': '#4ade80', 'Late Expansion': '#facc15', 'Peak': '#fb923c', 'Early Contraction': '#f87171', 'Mid Contraction': '#ef4444', 'Late Contraction': '#dc2626', 'Trough': '#94a3b8' }[ctx.phase] || '#94a3b8';
  const sentColor = { Fear: '#f87171', Caution: '#fb923c', Neutral: '#94a3b8', Optimism: '#86efac', Greed: '#f87171' }[ctx.riskSentiment] || '#94a3b8';

  return html`
    <div className="mc-banner">
      <div className="mc-banner-top" onClick=${() => setOpen(o => !o)}>
        <div className="mc-banner-left">
          <span className="mc-label">Market Context</span>
          <span className="mc-chip" style=${{ '--c': phaseColor }}>${ctx.phase}</span>
          <span className="mc-chip" style=${{ '--c': sentColor }}>${ctx.riskSentiment} Sentiment</span>
          <span className="mc-chip" style=${{ '--c': '#818cf8' }}>Rates: ${ctx.rateEnvironment}</span>
          ${ctx.keyTheme && html`<span className="mc-chip theme-chip">${ctx.keyTheme}</span>`}
        </div>
        <div className="mc-banner-right">
          ${ctx.lastUpdated && html`<span className="mc-updated">Updated ${new Date(ctx.lastUpdated).toLocaleDateString()}</span>`}
          <button className="btn-sm" onClick=${(e) => { e.stopPropagation(); onEdit(); }}>Edit</button>
          <span className="chevron">${open ? '▲' : '▼'}</span>
        </div>
      </div>
      ${open && html`
        <div className="mc-banner-body">
          ${ctx.assessment && html`<p className="mc-assessment">${ctx.assessment}</p>`}
          <div className="mc-lists">
            ${ctx.tailwinds?.length > 0 && html`
              <div>
                <div className="mc-list-label" style=${{ color: '#4ade80' }}>Tailwinds</div>
                <ul>${ctx.tailwinds.map((t, i) => html`<li key=${i}>${t}</li>`)}</ul>
              </div>
            `}
            ${ctx.headwinds?.length > 0 && html`
              <div>
                <div className="mc-list-label" style=${{ color: '#f87171' }}>Headwinds</div>
                <ul>${ctx.headwinds.map((h, i) => html`<li key=${i}>${h}</li>`)}</ul>
              </div>
            `}
          </div>
          ${ctx.sectorRotation && html`<p className="mc-rotation"><strong>Sector Rotation:</strong> ${ctx.sectorRotation}</p>`}
        </div>
      `}
    </div>
  `;
}

// ─── DASHBOARD ──────────────────────────────────────────────────────────────

function Dashboard({ stocks, marketContext }) {
  const owned = stocks.filter(s => s.owned && s.shares > 0);
  const totalVal = owned.reduce((s, x) => s + x.shares * (x.lastPrice || x.costBasis), 0);
  const totalCost = owned.reduce((s, x) => s + x.shares * x.costBasis, 0);
  const totalPL = totalVal - totalCost;
  const totalPLPct = totalCost > 0 ? (totalPL / totalCost) * 100 : 0;
  const avgScore = stocks.length ? stocks.reduce((s, x) => s + calcScore(x.scores), 0) / stocks.length : 0;
  const top = [...stocks].sort((a, b) => calcScore(b.scores) - calcScore(a.scores)).slice(0, 4);

  return html`
    <div className="view">
      <h2 className="view-title">Dashboard</h2>
      <div className="kpi-row">
        ${[
          { label: 'Portfolio Value', value: fmt$(totalVal), sub: `${fmtPct(totalPLPct)} (${fmt$(totalPL)})`, subColor: plColor(totalPL) },
          { label: 'Positions', value: String(owned.length), sub: `${stocks.length - owned.length} on watchlist` },
          { label: 'Avg Codex Score', value: avgScore.toFixed(1), valueColor: getSignal(avgScore).color, sub: `across ${stocks.length} stocks` },
          { label: 'Market Phase', value: marketContext.phase, sub: `${marketContext.riskSentiment} sentiment` },
        ].map((k, i) => html`
          <div key=${i} className="kpi-card">
            <div className="kpi-label">${k.label}</div>
            <div className="kpi-value" style=${{ color: k.valueColor }}>${k.value}</div>
            <div className="kpi-sub" style=${{ color: k.subColor }}>${k.sub}</div>
          </div>
        `)}
      </div>
      <div className="dash-grid">
        <div className="panel">
          <h3 className="panel-title">Top Conviction Picks</h3>
          ${top.map(s => {
            const sc = calcScore(s.scores);
            const sig = getSignal(sc);
            return html`
              <div key=${s.id} className="mini-row">
                <div style=${{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                  <span className="ticker">${s.ticker}</span>
                  <span className="name-sm">${s.name}</span>
                </div>
                <div style=${{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style=${{ color: sig.color, fontWeight: 700 }}>${sc.toFixed(1)}</span>
                  <span className="sig-pill" style=${{ '--c': sig.color }}>${sig.label}</span>
                </div>
              </div>
            `;
          })}
        </div>
        <div className="panel">
          <h3 className="panel-title">Portfolio Positions</h3>
          ${owned.length === 0
            ? html`<p className="empty-hint">No owned positions yet. Add stocks with "Owned" enabled.</p>`
            : owned.map(s => {
                const price = s.lastPrice || s.costBasis;
                const pl = (price - s.costBasis) * s.shares;
                const pct = totalVal > 0 ? (s.shares * price / totalVal * 100) : 0;
                return html`
                  <div key=${s.id} className="mini-row">
                    <div style=${{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                      <span className="ticker">${s.ticker}</span>
                      <span className="name-sm">${pct.toFixed(1)}% of portfolio</span>
                    </div>
                    <span style=${{ color: plColor(pl), fontWeight: 600 }}>${fmt$(pl)}</span>
                  </div>
                `;
              })
          }
        </div>
      </div>
      <div className="panel">
        <h3 className="panel-title">Decision Gate Summary</h3>
        <div className="gate-summary">
          ${stocks.map(s => {
            const { verdict } = runGates(s.scores);
            return html`
              <div key=${s.id} className="gate-chip">
                <span className="ticker-sm">${s.ticker}</span>
                <span style=${{ color: vColor(verdict), fontSize: '0.7rem', fontWeight: 700 }}>${verdict}</span>
              </div>
            `;
          })}
        </div>
      </div>
    </div>
  `;
}

// ─── WATCHLIST ────────────────────────────────────────────────────────────────

function Watchlist({ stocks, onSelect, onAdd, onRefresh, refreshing }) {
  const [sortBy, setSortBy] = useState('score');
  const [filter, setFilter] = useState('all');

  const list = useMemo(() => {
    let r = [...stocks];
    if (filter === 'owned') r = r.filter(s => s.owned);
    if (filter === 'watching') r = r.filter(s => !s.owned);
    if (sortBy === 'score') r.sort((a, b) => calcScore(b.scores) - calcScore(a.scores));
    if (sortBy === 'ticker') r.sort((a, b) => a.ticker.localeCompare(b.ticker));
    if (sortBy === 'pl') r.sort((a, b) => {
      const plA = ((a.lastPrice || a.costBasis) - a.costBasis) * a.shares;
      const plB = ((b.lastPrice || b.costBasis) - b.costBasis) * b.shares;
      return plB - plA;
    });
    return r;
  }, [stocks, sortBy, filter]);

  return html`
    <div className="view">
      <div className="view-header">
        <h2 className="view-title">Watchlist</h2>
        <div style=${{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn-secondary" onClick=${onRefresh} disabled=${refreshing}>
            ${refreshing ? '↻ Refreshing…' : '↻ Refresh Prices'}
          </button>
          <button className="btn-primary" onClick=${onAdd}>+ Add Stock</button>
        </div>
      </div>
      <div className="table-controls">
        <div className="filter-tabs">
          ${['all', 'owned', 'watching'].map(f => html`
            <button key=${f} className=${`filter-tab ${filter === f ? 'active' : ''}`} onClick=${() => setFilter(f)}>
              ${f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          `)}
        </div>
        <select className="sort-sel" value=${sortBy} onChange=${e => setSortBy(e.target.value)}>
          <option value="score">Sort: Codex Score</option>
          <option value="ticker">Sort: Ticker A–Z</option>
          <option value="pl">Sort: P&L</option>
        </select>
      </div>
      <div className="stock-table">
        <div className="tbl-head">
          <span>Stock</span><span>Sector</span><span>Price</span><span>P&L</span><span>Trend</span><span>Codex Score</span><span>Verdict</span>
        </div>
        ${list.map(s => {
          const sc = calcScore(s.scores);
          const sig = getSignal(sc);
          const price = s.lastPrice || s.costBasis;
          const pl = s.owned ? (price - s.costBasis) * s.shares : null;
          const plp = s.owned && s.costBasis > 0 ? ((price - s.costBasis) / s.costBasis) * 100 : null;
          const { verdict } = runGates(s.scores);
          return html`
            <div key=${s.id} className="tbl-row" onClick=${() => onSelect(s.id)}>
              <div className="stock-cell">
                <span className="ticker">${s.ticker}</span>
                <div>
                  <div className="stock-name">${s.name}</div>
                  <div className="stock-meta">${s.exchange} · ${s.owned ? 'Owned' : 'Watching'}</div>
                </div>
              </div>
              <span className="cell-dim">${s.sector}</span>
              <span>${price > 0 ? fmt$(price) : '—'}</span>
              <span style=${{ color: plColor(pl) }}>
                ${pl !== null ? html`<div>${fmt$(pl)}</div><div style=${{ fontSize: '0.72rem' }}>${fmtPct(plp)}</div>` : '—'}
              </span>
              <span>${html`<${SparkLine} data=${s.priceHistory} />`}</span>
              <span>
                <div style=${{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <div className="score-track"><div className="score-fill" style=${{ width: `${sc * 10}%`, background: sig.color }} /></div>
                  <span style=${{ color: sig.color, fontWeight: 700 }}>${sc.toFixed(1)}</span>
                </div>
              </span>
              <span><span className="verdict-badge" style=${{ '--c': vColor(verdict) }}>${verdict}</span></span>
            </div>
          `;
        })}
      </div>
    </div>
  `;
}

// ─── PORTFOLIO ──────────────────────────────────────────────────────────────

function Portfolio({ stocks }) {
  const owned = stocks.filter(s => s.owned && s.shares > 0);
  const totalVal = owned.reduce((s, x) => s + x.shares * (x.lastPrice || x.costBasis), 0);
  const totalCost = owned.reduce((s, x) => s + x.shares * x.costBasis, 0);
  const totalPL = totalVal - totalCost;
  const totalPLPct = totalCost > 0 ? (totalPL / totalCost) * 100 : 0;

  return html`
    <div className="view">
      <h2 className="view-title">Portfolio</h2>
      <div className="port-summary">
        ${[
          { label: 'Total Value', value: fmt$(totalVal) },
          { label: 'Total P&L', value: html`${fmt$(totalPL)} <span style=${{ fontSize: '1rem' }}>(${fmtPct(totalPLPct)})</span>`, color: plColor(totalPL) },
          { label: 'Cost Basis', value: fmt$(totalCost) },
          { label: 'Positions', value: String(owned.length) },
        ].map((s, i) => html`
          <div key=${i} className="port-stat">
            <div className="port-lbl">${s.label}</div>
            <div className="port-big" style=${{ color: s.color }}>${s.value}</div>
          </div>
        `)}
      </div>
      ${owned.length === 0
        ? html`<div className="empty-state">No owned positions yet. Add stocks with "Owned" enabled.</div>`
        : html`
          <div className="pos-grid">
            ${owned.map(s => {
              const price = s.lastPrice || s.costBasis;
              const val = s.shares * price;
              const pl = (price - s.costBasis) * s.shares;
              const plp = ((price - s.costBasis) / s.costBasis) * 100;
              const wt = totalVal > 0 ? (val / totalVal * 100) : 0;
              const sc = calcScore(s.scores);
              const sig = getSignal(sc);
              const { verdict } = runGates(s.scores);
              return html`
                <div key=${s.id} className="pos-card">
                  <div className="pos-header">
                    <div style=${{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <span className="ticker lg">${s.ticker}</span>
                      <div>
                        <div className="stock-name">${s.name}</div>
                        <div className="stock-meta">${s.sector}</div>
                      </div>
                    </div>
                    <div style=${{ textAlign: 'right' }}>
                      <div style=${{ color: sig.color, fontSize: '1.4rem', fontWeight: 700 }}>${sc.toFixed(1)}</div>
                      <div style=${{ color: vColor(verdict), fontSize: '0.7rem', fontWeight: 700 }}>${verdict}</div>
                    </div>
                  </div>
                  <div className="pos-chart-wrap"><${PriceChart} data=${s.priceHistory} w=${380} h=${120} /></div>
                  <div className="pos-stats">
                    ${[
                      ['Shares', String(s.shares)],
                      ['Avg Cost', fmt$(s.costBasis)],
                      ['Current', price > 0 ? fmt$(price) : '—'],
                      ['Value', fmt$(val)],
                      ['P&L', html`<span style=${{ color: plColor(pl) }}>${fmt$(pl)} (${fmtPct(plp)})</span>`],
                      ['Weight', `${wt.toFixed(1)}%`],
                      ['Target', fmt$(s.targetPrice)],
                      ['Horizon', s.horizon],
                    ].map(([l, v]) => html`
                      <div key=${l} className="pos-stat-item">
                        <div className="pos-stat-lbl">${l}</div>
                        <div className="pos-stat-val">${v}</div>
                      </div>
                    `)}
                  </div>
                  ${s.thesis && html`
                    <div className="pos-thesis">
                      <div className="thesis-lbl">Thesis</div>
                      <p>${s.thesis}</p>
                    </div>
                  `}
                </div>
              `;
            })}
          </div>
        `
      }
    </div>
  `;
}

// ─── STOCK DETAIL ─────────────────────────────────────────────────────────────

function StockDetail({ stock, marketContext, onEdit, onDelete, onBack }) {
  const sc = calcScore(stock.scores);
  const sig = getSignal(sc);
  const { gates, verdict } = runGates(stock.scores);
  const mcSignals = { ...DEFAULT_MC_SIGNALS, ...(stock.mcSignals || {}) };
  const favCount = countFav(mcSignals);
  const price = stock.lastPrice || stock.costBasis;
  const pl = stock.owned ? (price - stock.costBasis) * stock.shares : null;
  const plp = stock.owned && stock.costBasis > 0 ? ((price - stock.costBasis) / stock.costBasis) * 100 : null;
  const dimColor = { Temporal: '#f59e0b', Structural: '#6366f1', Irrational: '#ec4899' };

  return html`
    <div className="view">
      <div className="detail-nav">
        <button className="btn-back" onClick=${onBack}>← Back to Watchlist</button>
        <div style=${{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn-secondary" onClick=${() => onEdit(stock)}>Edit</button>
          <button className="btn-danger" onClick=${() => { if (window.confirm(`Remove ${stock.ticker}?`)) onDelete(stock.id); }}>Remove</button>
        </div>
      </div>

      <div className="detail-hdr">
        <div style=${{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span className="ticker xl">${stock.ticker}</span>
          <div>
            <h2 style=${{ margin: 0, fontSize: '1.4rem' }}>${stock.name}</h2>
            <div className="stock-meta">${stock.exchange} · ${stock.sector} · ${stock.owned ? `${stock.shares} shares owned` : 'Watchlist'}</div>
          </div>
        </div>
        <div style=${{ textAlign: 'right' }}>
          <div style=${{ color: sig.color, fontSize: '2.8rem', fontWeight: 700, lineHeight: 1 }}>${sc.toFixed(1)}</div>
          <div style=${{ color: sig.color, fontWeight: 600 }}>${sig.label}</div>
          <div style=${{ color: vColor(verdict), fontSize: '0.8rem', fontWeight: 700, marginTop: '0.2rem' }}>Gate: ${verdict}</div>
        </div>
      </div>

      <div className="applied-mc">
        <div className="applied-mc-hdr">
          <span className="applied-mc-title">Applied Market Context</span>
          <span style=${{ color: '#64748b', fontSize: '0.75rem' }}>Permanent — applies to all stock reviews</span>
        </div>
        <div style=${{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
          ${[
            [marketContext.phase, '#4ade80'],
            [`Rates: ${marketContext.rateEnvironment}`, '#818cf8'],
            [`Sentiment: ${marketContext.riskSentiment}`, '#f59e0b'],
            marketContext.keyTheme ? [marketContext.keyTheme, '#94a3b8'] : null,
          ].filter(Boolean).map(([label, color], i) => html`
            <span key=${i} className="badge" style=${{ '--bc': color }}>${label}</span>
          `)}
        </div>
        ${marketContext.assessment && html`<p className="mc-text">${marketContext.assessment}</p>`}
      </div>

      <div className="detail-grid">
        <div className="panel">
          <h3 className="panel-title">Framework Scores</h3>
          <div style=${{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
            <${RadarChart} scores=${stock.scores} size=${210} />
            <div style=${{ flex: 1 }}>
              ${PILLARS.map(p => {
                const v = stock.scores[p.id] || 0;
                const c = getSignal(v).color;
                return html`
                  <div key=${p.id} className="pillar-row">
                    <div>
                      <div className="pillar-name">${p.label}</div>
                      ${p.gateQuestion && html`<div className="pillar-gate">Gate: ${p.gateQuestion} → ${v >= 5 ? 'PASS' : p.failAction.toUpperCase()}</div>`}
                    </div>
                    <div style=${{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '120px' }}>
                      <div className="pillar-track"><div className="pillar-fill" style=${{ width: `${v * 10}%`, background: c }} /></div>
                      <span style=${{ color: c, fontWeight: 700 }}>${v}</span>
                    </div>
                  </div>
                `;
              })}
              <div className="total-score-row">
                <span>Weighted Score</span>
                <span style=${{ color: sig.color, fontWeight: 700, fontSize: '1.2rem' }}>${sc.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="panel">
          <h3 className="panel-title">Decision Gate Sequence</h3>
          <div className="gate-list">
            ${gates.map((g, i) => html`
              <div key=${i} className=${`gate-row ${g.pass ? 'pass' : 'fail'}`}>
                <span className="gate-num">${i + 1}</span>
                <div className="gate-body">
                  <div className="gate-q">${g.question}</div>
                  <div className="gate-result">${g.pass ? '✓ PASS — continue' : `✗ FAIL — ${g.failAction}`}</div>
                </div>
                <span className="gate-score" style=${{ color: getSignal(g.score).color }}>${g.score}</span>
              </div>
            `)}
            <div className=${`gate-verdict gate-verdict-${verdict.toLowerCase()}`}>
              Final decision: <strong>${verdict}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="panel">
        <h3 className="panel-title">
          Market Context Assessment — ${favCount}/6 Favourable
          <span className="mc-count-label" style=${{ color: favCount >= 4 ? '#4ade80' : favCount >= 2 ? '#facc15' : '#f87171' }}>
            ${favCount >= 4 ? 'Strong Entry' : favCount >= 2 ? 'Acceptable — size conservatively' : 'Watchlist — timing is wrong'}
          </span>
        </h3>
        <div className="mc-signals-grid">
          ${MC_SIGNALS.map(mcs => {
            const sd = mcSignals[mcs.id] || { value: null, notes: '' };
            const valColor = sd.value === 'favourable' ? '#4ade80' : sd.value === 'unfavourable' ? '#f87171' : '#64748b';
            return html`
              <div key=${mcs.id} className="mc-signal-card">
                <div className="mc-sig-header">
                  <span className="mc-dim-badge" style=${{ '--dc': dimColor[mcs.dimension] }}>${mcs.dimension}</span>
                  <span className="mc-sig-q">${mcs.question}</span>
                  ${sd.value && html`<span className="mc-sig-val" style=${{ color: valColor }}>${sd.value === 'favourable' ? '✓ Favourable' : '✗ Unfavourable'}</span>`}
                </div>
                <div className="mc-sig-criteria">
                  <div className="mc-crit green"><strong>Favourable:</strong> ${mcs.favourable}</div>
                  <div className="mc-crit red"><strong>Unfavourable:</strong> ${mcs.unfavourable}</div>
                </div>
                ${sd.notes && html`<div className="mc-sig-notes">"${sd.notes}"</div>`}
              </div>
            `;
          })}
        </div>
      </div>

      <div className="panel">
        <h3 className="panel-title">Price History</h3>
        <${PriceChart} data=${stock.priceHistory} w=${720} h=${200} />
      </div>

      ${stock.owned && html`
        <div className="panel">
          <h3 className="panel-title">Position</h3>
          <div className="pos-stats">
            ${[
              ['Shares', String(stock.shares)],
              ['Avg Cost', fmt$(stock.costBasis)],
              ['Current Price', stock.lastPrice > 0 ? fmt$(stock.lastPrice) : 'Awaiting refresh'],
              ['Total Cost', fmt$(stock.shares * stock.costBasis)],
              ['Current Value', stock.lastPrice > 0 ? fmt$(stock.shares * stock.lastPrice) : '—'],
              ['P&L', pl !== null ? html`<span style=${{ color: plColor(pl) }}>${fmt$(pl)} (${fmtPct(plp)})</span>` : '—'],
              ['Target Price', fmt$(stock.targetPrice)],
              ['Time Horizon', stock.horizon],
            ].map(([l, v]) => html`
              <div key=${l} className="pos-stat-item">
                <div className="pos-stat-lbl">${l}</div>
                <div className="pos-stat-val">${v}</div>
              </div>
            `)}
          </div>
        </div>
      `}

      ${!stock.owned && html`
        <div className="panel">
          <h3 className="panel-title">Watchlist Details</h3>
          <div className="pos-stats">
            ${[
              ['Target Price', fmt$(stock.targetPrice)],
              ['Time Horizon', stock.horizon],
              ['Added', new Date(stock.addedDate).toLocaleDateString()],
            ].map(([l, v]) => html`
              <div key=${l} className="pos-stat-item">
                <div className="pos-stat-lbl">${l}</div>
                <div className="pos-stat-val">${v}</div>
              </div>
            `)}
          </div>
        </div>
      `}

      <div className="panel">
        <h3 className="panel-title">Investment Thesis</h3>
        ${stock.thesis
          ? html`<p className="thesis-body">${stock.thesis}</p>`
          : html`<p className="empty-hint">No thesis written yet. Click Edit to add one.</p>`
        }
        <div className="thesis-grid">
          ${stock.catalysts?.length > 0 && html`
            <div>
              <h4 className="thesis-sub green">Key Catalysts</h4>
              <ul className="thesis-list">
                ${stock.catalysts.map((c, i) => html`<li key=${i}><span className="bull-dot green" /> ${c}</li>`)}
              </ul>
            </div>
          `}
          ${stock.risks?.length > 0 && html`
            <div>
              <h4 className="thesis-sub red">Key Risks</h4>
              <ul className="thesis-list">
                ${stock.risks.map((r, i) => html`<li key=${i}><span className="bull-dot red" /> ${r}</li>`)}
              </ul>
            </div>
          `}
        </div>
        ${stock.notes && html`<div className="notes-block">${stock.notes}</div>`}
      </div>
    </div>
  `;
}

// ─── MARKET CONTEXT EDITOR ────────────────────────────────────────────────────

function MCEditor({ ctx, onSave, onClose }) {
  const [form, setForm] = useState({ ...DEFAULT_MARKET_CONTEXT, ...ctx, tailwinds: [...(ctx.tailwinds || [])], headwinds: [...(ctx.headwinds || [])] });
  const [tw, setTw] = useState('');
  const [hw, setHw] = useState('');
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const addItem = (key, val, setter) => { if (!val.trim()) return; setForm(p => ({ ...p, [key]: [...p[key], val.trim()] })); setter(''); };
  const removeItem = (key, i) => setForm(p => ({ ...p, [key]: p[key].filter((_, j) => j !== i) }));

  return html`
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-hdr">
          <h3>Market Context Assessment</h3>
          <button className="close-btn" onClick=${onClose}>✕</button>
        </div>
        <div className="modal-body">
          <p className="modal-note">This assessment is permanent and applies automatically to all stock thesis documents and portfolio reviews.</p>
          <div className="form-row">
            ${[['Market Phase', 'phase', MARKET_PHASES], ['Rate Environment', 'rateEnvironment', RATE_ENVIRONMENTS], ['Risk Sentiment', 'riskSentiment', RISK_SENTIMENTS]].map(([label, key, opts]) => html`
              <div key=${key} className="form-group">
                <label>${label}</label>
                <select value=${form[key]} onChange=${e => set(key, e.target.value)}>
                  ${opts.map(o => html`<option key=${o} value=${o}>${o}</option>`)}
                </select>
              </div>
            `)}
          </div>
          <div className="form-group">
            <label>Key Macro Theme</label>
            <input type="text" value=${form.keyTheme} onInput=${e => set('keyTheme', e.target.value)} placeholder="e.g. AI infrastructure buildout, rate normalisation…" />
          </div>
          <div className="form-group">
            <label>Assessment Summary</label>
            <textarea rows="4" value=${form.assessment} onInput=${e => set('assessment', e.target.value)} placeholder="Write your overall market context assessment here…" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Tailwinds</label>
              <div className="tag-row">
                <input type="text" value=${tw} onInput=${e => setTw(e.target.value)} onKeyDown=${e => e.key === 'Enter' && addItem('tailwinds', tw, setTw)} placeholder="Add tailwind, press Enter" />
                <button className="btn-sm" onClick=${() => addItem('tailwinds', tw, setTw)}>+</button>
              </div>
              <div className="tag-list">
                ${form.tailwinds.map((t, i) => html`<span key=${i} className="tag green">${t} <button onClick=${() => removeItem('tailwinds', i)}>×</button></span>`)}
              </div>
            </div>
            <div className="form-group">
              <label>Headwinds</label>
              <div className="tag-row">
                <input type="text" value=${hw} onInput=${e => setHw(e.target.value)} onKeyDown=${e => e.key === 'Enter' && addItem('headwinds', hw, setHw)} placeholder="Add headwind, press Enter" />
                <button className="btn-sm" onClick=${() => addItem('headwinds', hw, setHw)}>+</button>
              </div>
              <div className="tag-list">
                ${form.headwinds.map((h, i) => html`<span key=${i} className="tag red">${h} <button onClick=${() => removeItem('headwinds', i)}>×</button></span>`)}
              </div>
            </div>
          </div>
          <div className="form-group">
            <label>Sector Rotation Notes</label>
            <input type="text" value=${form.sectorRotation} onInput=${e => set('sectorRotation', e.target.value)} placeholder="e.g. Rotating from growth into value, financials outperforming…" />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick=${onClose}>Cancel</button>
          <button className="btn-primary" onClick=${() => onSave({ ...form, lastUpdated: new Date().toISOString() })}>Save Assessment</button>
        </div>
      </div>
    </div>
  `;
}

// ─── STOCK FORM ───────────────────────────────────────────────────────────────

function StockForm({ stock, onSave, onClose }) {
  const empty = {
    ticker: '', name: '', exchange: 'NASDAQ', sector: '', owned: false,
    shares: 0, costBasis: 0, addedDate: new Date().toISOString().split('T')[0],
    thesis: '', catalysts: [], risks: [], targetPrice: 0, horizon: '2–3 years',
    scores: { moat: 5, management: 5, balanceSheet: 5, growth: 5, valuation: 5, marketContext: 5 },
    mcSignals: { ...DEFAULT_MC_SIGNALS },
    notes: '', lastPrice: 0, priceHistory: [], lastUpdated: null,
  };
  const [form, setForm] = useState(stock ? { ...empty, ...stock, catalysts: [...(stock.catalysts || [])], risks: [...(stock.risks || [])], mcSignals: { ...DEFAULT_MC_SIGNALS, ...(stock.mcSignals || {}) } } : empty);
  const [newCat, setNewCat] = useState('');
  const [newRisk, setNewRisk] = useState('');
  const [tab, setTab] = useState('basics');
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const setScore = (k, v) => setForm(p => ({ ...p, scores: { ...p.scores, [k]: parseInt(v) } }));
  const setMCSig = (id, key, val) => setForm(p => ({ ...p, mcSignals: { ...p.mcSignals, [id]: { ...(p.mcSignals[id] || {}), [key]: val } } }));
  const addTag = (key, val, setter) => { if (!val.trim()) return; setForm(p => ({ ...p, [key]: [...p[key], val.trim()] })); setter(''); };
  const removeTag = (key, i) => setForm(p => ({ ...p, [key]: p[key].filter((_, j) => j !== i) }));
  const dimColor = { Temporal: '#f59e0b', Structural: '#6366f1', Irrational: '#ec4899' };
  const fav = countFav(form.mcSignals);

  return html`
    <div className="modal-overlay">
      <div className="modal wide-modal">
        <div className="modal-hdr">
          <h3>${stock ? `Edit ${stock.ticker}` : 'Add Stock'}</h3>
          <button className="close-btn" onClick=${onClose}>✕</button>
        </div>
        <div className="modal-tabs">
          ${[['basics', 'Basics'], ['thesis', 'Thesis'], ['scores', 'Framework Scores'], ['mc', 'Market Context']].map(([id, label]) => html`
            <button key=${id} className=${`modal-tab ${tab === id ? 'active' : ''}`} onClick=${() => setTab(id)}>${label}</button>
          `)}
        </div>
        <div className="modal-body">
          ${tab === 'basics' && html`
            <div>
              <div className="form-row">
                <div className="form-group">
                  <label>Ticker *</label>
                  <input type="text" value=${form.ticker} onInput=${e => set('ticker', e.target.value.toUpperCase())} placeholder="AAPL" />
                </div>
                <div className="form-group flex2">
                  <label>Company Name *</label>
                  <input type="text" value=${form.name} onInput=${e => set('name', e.target.value)} placeholder="Apple Inc." />
                </div>
                <div className="form-group">
                  <label>Exchange</label>
                  <select value=${form.exchange} onChange=${e => set('exchange', e.target.value)}>
                    ${EXCHANGES.map(x => html`<option key=${x} value=${x}>${x}</option>`)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Sector</label>
                  <select value=${form.sector} onChange=${e => set('sector', e.target.value)}>
                    <option value="">Select…</option>
                    ${SECTORS.map(s => html`<option key=${s} value=${s}>${s}</option>`)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Time Horizon</label>
                  <select value=${form.horizon} onChange=${e => set('horizon', e.target.value)}>
                    ${HORIZONS.map(h => html`<option key=${h} value=${h}>${h}</option>`)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Target Price ($)</label>
                  <input type="number" value=${form.targetPrice} onInput=${e => set('targetPrice', parseFloat(e.target.value) || 0)} step="0.01" />
                </div>
              </div>
              <div className="form-group" style=${{ marginBottom: '0.875rem' }}>
                <label className="checkbox-label">
                  <input type="checkbox" checked=${form.owned} onChange=${e => set('owned', e.target.checked)} />
                  Owned position
                </label>
              </div>
              ${form.owned && html`
                <div className="form-row">
                  <div className="form-group">
                    <label>Shares</label>
                    <input type="number" value=${form.shares} onInput=${e => set('shares', parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="form-group">
                    <label>Cost Basis (per share)</label>
                    <input type="number" value=${form.costBasis} onInput=${e => set('costBasis', parseFloat(e.target.value) || 0)} step="0.01" />
                  </div>
                </div>
              `}
              <div className="form-group">
                <label>Notes</label>
                <textarea rows="2" value=${form.notes} onInput=${e => set('notes', e.target.value)} placeholder="Watch levels, entry conditions, extra notes…" />
              </div>
            </div>
          `}

          ${tab === 'thesis' && html`
            <div>
              <div className="form-group">
                <label>Investment Thesis</label>
                <textarea rows="5" value=${form.thesis} onInput=${e => set('thesis', e.target.value)} placeholder="State your core investment thesis. Why will this business be more valuable in your holding period?" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Key Catalysts</label>
                  <div className="tag-row">
                    <input type="text" value=${newCat} onInput=${e => setNewCat(e.target.value)} onKeyDown=${e => e.key === 'Enter' && addTag('catalysts', newCat, setNewCat)} placeholder="Add catalyst, press Enter" />
                    <button className="btn-sm" onClick=${() => addTag('catalysts', newCat, setNewCat)}>+</button>
                  </div>
                  <div className="tag-list">
                    ${form.catalysts.map((c, i) => html`<span key=${i} className="tag green">${c} <button onClick=${() => removeTag('catalysts', i)}>×</button></span>`)}
                  </div>
                </div>
                <div className="form-group">
                  <label>Key Risks</label>
                  <div className="tag-row">
                    <input type="text" value=${newRisk} onInput=${e => setNewRisk(e.target.value)} onKeyDown=${e => e.key === 'Enter' && addTag('risks', newRisk, setNewRisk)} placeholder="Add risk, press Enter" />
                    <button className="btn-sm" onClick=${() => addTag('risks', newRisk, setNewRisk)}>+</button>
                  </div>
                  <div className="tag-list">
                    ${form.risks.map((r, i) => html`<span key=${i} className="tag red">${r} <button onClick=${() => removeTag('risks', i)}>×</button></span>`)}
                  </div>
                </div>
              </div>
            </div>
          `}

          ${tab === 'scores' && html`
            <div>
              <p className="hint-text">Score each pillar 1–10. The weighted score determines the Codex Score and decision signal.</p>
              ${PILLARS.map(p => {
                const v = form.scores[p.id] || 5;
                const c = getSignal(v).color;
                const nearestKey = Object.keys(p.rubric).reduce((a, b) => Math.abs(b - v) < Math.abs(a - v) ? b : a);
                return html`
                  <div key=${p.id} className="score-row">
                    <div className="score-row-info">
                      <div className="pillar-name">${p.label}</div>
                      <div className="pillar-desc">${p.description}</div>
                      <div className="pillar-rubric">${p.rubric[nearestKey]}</div>
                    </div>
                    <div style=${{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: '180px' }}>
                      <input type="range" min="1" max="10" value=${v} onInput=${e => setScore(p.id, e.target.value)} style=${{ width: '120px', accentColor: c }} />
                      <span style=${{ color: c, fontWeight: 700, fontSize: '1.2rem', minWidth: '1.5rem' }}>${v}</span>
                    </div>
                  </div>
                `;
              })}
              <div className="score-total">
                Weighted Codex Score:${' '}
                <span style=${{ color: getSignal(calcScore(form.scores)).color }}>
                  ${calcScore(form.scores).toFixed(2)}
                </span>
              </div>
            </div>
          `}

          ${tab === 'mc' && html`
            <div>
              <p className="hint-text">
                Assess each Market Context signal. Count favourable signals: 4+ = Strong Entry · 2–3 = Size Conservatively · 0–1 = Watchlist
              </p>
              ${MC_SIGNALS.map(mcs => {
                const sd = form.mcSignals[mcs.id] || { value: null, notes: '' };
                return html`
                  <div key=${mcs.id} className="mc-form-row">
                    <div className="mc-form-header">
                      <span className="mc-dim-badge sm" style=${{ '--dc': dimColor[mcs.dimension] }}>${mcs.dimension}</span>
                      <span className="mc-form-q">${mcs.question}</span>
                    </div>
                    <div className="mc-criteria-hint">
                      <span className="mc-hint-green">✓ ${mcs.favourable}</span>
                      <span className="mc-hint-red">✗ ${mcs.unfavourable}</span>
                    </div>
                    <div className="mc-form-controls">
                      ${['favourable', 'neutral', 'unfavourable'].map(v => html`
                        <button key=${v} className=${`mc-btn ${sd.value === v ? 'active-' + v : ''}`} onClick=${() => setMCSig(mcs.id, 'value', sd.value === v ? null : v)}>
                          ${v === 'favourable' ? '✓ Favourable' : v === 'neutral' ? '~ Neutral' : '✗ Unfavourable'}
                        </button>
                      `)}
                    </div>
                    <input type="text" className="mc-notes-input" value=${sd.notes || ''} onInput=${e => setMCSig(mcs.id, 'notes', e.target.value)} placeholder="Notes on this signal…" />
                  </div>
                `;
              })}
              <div className="mc-count-summary">
                Favourable signals: ${' '}
                <strong style=${{ color: fav >= 4 ? '#4ade80' : fav >= 2 ? '#facc15' : '#f87171' }}>${fav}/6</strong>
                ${' '}→ ${fav >= 4 ? 'Strong Entry' : fav >= 2 ? 'Acceptable — size conservatively' : 'Watchlist — timing is wrong'}
              </div>
            </div>
          `}
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick=${onClose}>Cancel</button>
          <button className="btn-primary" onClick=${() => {
            if (!form.ticker.trim()) { alert('Ticker symbol is required'); return; }
            if (!form.name.trim()) { alert('Company name is required'); return; }
            const uid = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now());
            onSave({ ...form, id: form.id || uid });
          }}>
            ${stock ? 'Save Changes' : 'Add Stock'}
          </button>
        </div>
      </div>
    </div>
  `;
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────

export default function App() {
  const [state, setState] = useState(loadState);
  const [view, setView] = useState('dashboard');
  const [selectedId, setSelectedId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editStock, setEditStock] = useState(null);
  const [showMCEditor, setShowMCEditor] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { saveState(state); }, [state]);

  const { stocks, marketContext } = state;

  const saveStock = useCallback((stock) => {
    setState(prev => {
      const exists = prev.stocks.find(s => s.id === stock.id);
      return { ...prev, stocks: exists ? prev.stocks.map(s => s.id === stock.id ? stock : s) : [...prev.stocks, stock] };
    });
    setShowAdd(false);
    setEditStock(null);
  }, []);

  const deleteStock = useCallback((id) => {
    setState(prev => ({ ...prev, stocks: prev.stocks.filter(s => s.id !== id) }));
    setView('watchlist');
    setSelectedId(null);
  }, []);

  const refreshPrices = useCallback(async () => {
    setRefreshing(true);
    const updated = await Promise.all(stocks.map(async s => {
      const data = await fetchYahoo(s.ticker);
      return data ? { ...s, lastPrice: data.currentPrice, priceHistory: data.priceHistory.slice(-252), lastUpdated: new Date().toISOString() } : s;
    }));
    setState(prev => ({ ...prev, stocks: updated }));
    setRefreshing(false);
  }, [stocks]);

  const selectedStock = stocks.find(s => s.id === selectedId);

  return html`
    <div className="app">
      <header className="app-hdr">
        <div className="brand">
          <div className="brand-logo">C</div>
          <div>
            <div className="brand-name">Codex</div>
            <div className="brand-sub">Investment Manager</div>
          </div>
        </div>
        <nav className="app-nav">
          ${[['dashboard', 'Dashboard'], ['watchlist', 'Watchlist'], ['portfolio', 'Portfolio']].map(([id, label]) => html`
            <button key=${id} className=${`nav-btn ${view === id || (view === 'detail' && id === 'watchlist') ? 'active' : ''}`} onClick=${() => setView(id)}>
              ${label}
            </button>
          `)}
        </nav>
        <div className="hdr-right">
          ${refreshing && html`<span className="refreshing-text">↻ Refreshing prices…</span>`}
        </div>
      </header>

      <${MCBanner} ctx=${marketContext} onEdit=${() => setShowMCEditor(true)} />

      <main className="app-main">
        ${view === 'dashboard' && html`<${Dashboard} stocks=${stocks} marketContext=${marketContext} />`}
        ${view === 'watchlist' && html`<${Watchlist} stocks=${stocks} onSelect=${id => { setSelectedId(id); setView('detail'); }} onAdd=${() => setShowAdd(true)} onRefresh=${refreshPrices} refreshing=${refreshing} />`}
        ${view === 'portfolio' && html`<${Portfolio} stocks=${stocks} />`}
        ${view === 'detail' && selectedStock && html`<${StockDetail} stock=${selectedStock} marketContext=${marketContext} onEdit=${s => setEditStock(s)} onDelete=${deleteStock} onBack=${() => setView('watchlist')} />`}
      </main>

      ${(showAdd || editStock) && html`<${StockForm} stock=${editStock} onSave=${saveStock} onClose=${() => { setShowAdd(false); setEditStock(null); }} />`}
      ${showMCEditor && html`<${MCEditor} ctx=${marketContext} onSave=${ctx => { setState(p => ({ ...p, marketContext: ctx })); setShowMCEditor(false); }} onClose=${() => setShowMCEditor(false)} />`}
    </div>
  `;
}
