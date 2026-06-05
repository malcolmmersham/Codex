import { useState, useEffect, useCallback, useMemo } from 'https://esm.sh/react@18.3.1';

// ─── FRAMEWORK DEFINITION ──────────────────────────────────────────────────

const PILLARS = [
  {
    id: 'moat',
    label: 'Moat & Durability',
    gateQuestion: 'Is the moat durable?',
    weight: 0.25,
    failAction: 'stop',
    description: 'Competitive advantage, pricing power, barriers to entry, durability of the business model',
    rubric: {
      10: 'Exceptional moat — regulatory licence, network effects, or near-impossible switching costs compounding over decades',
      8: 'Strong moat — clear pricing power and durable competitive advantage with minimal erosion risk',
      6: 'Moderate moat — meaningful advantages but subject to competitive pressure or disruption',
      4: 'Weak moat — some differentiation but easily replicated or commoditising',
      2: 'No moat — commodity business competing on price alone',
    },
  },
  {
    id: 'management',
    label: 'Management Quality',
    gateQuestion: 'Is management trustworthy?',
    weight: 0.15,
    failAction: 'stop',
    description: 'Track record, capital allocation discipline, shareholder alignment, transparency',
    rubric: {
      10: 'Exceptional — proven capital allocators, skin in the game, long track record of under-promise/over-deliver',
      8: 'Strong — good track record, aligned incentives, conservative guidance',
      6: 'Adequate — reasonable management, some concerns on capital allocation or communication',
      4: 'Weak — questionable decisions, excessive dilution, or opacity',
      2: 'Red flag — history of destruction, misleading guidance, or governance failure',
    },
  },
  {
    id: 'balanceSheet',
    label: 'Balance Sheet Safety',
    gateQuestion: 'Is the balance sheet safe?',
    weight: 0.20,
    failAction: 'reassess',
    description: 'Net debt/equity, interest coverage, free cash flow, ability to survive a prolonged downturn',
    rubric: {
      10: 'Net cash position, strong FCF, zero liquidity risk',
      8: 'Conservative leverage, high interest coverage (>10×), robust FCF',
      6: 'Moderate leverage, adequate coverage, positive FCF',
      4: 'Elevated leverage, tight coverage, FCF breakeven or negative',
      2: 'Highly leveraged, at risk of covenant breach or capital raise',
    },
  },
  {
    id: 'growth',
    label: 'Growth Trajectory',
    weight: 0.15,
    failAction: 'none',
    description: 'Revenue and earnings growth trend, addressable market size, reinvestment optionality',
    rubric: {
      10: 'Explosive and durable growth (>20% p.a.) in a large, underpenetrated market',
      8: 'Strong growth (10–20% p.a.) with a long runway and compounding reinvestment',
      6: 'Steady growth (5–10% p.a.), reliable compounder',
      4: 'Slow growth (0–5% p.a.) or cyclical',
      2: 'Declining revenues or structural shrinkage',
    },
  },
  {
    id: 'valuation',
    label: 'Valuation & Margin of Safety',
    gateQuestion: 'Is there a margin of safety?',
    weight: 0.15,
    failAction: 'watchlist',
    description: 'Current price vs intrinsic value, PE vs 5-year average, upside/downside asymmetry',
    rubric: {
      10: 'Trading at a deep discount (>40%) to conservatively estimated intrinsic value',
      8: 'Meaningful discount (20–40%) — strong asymmetry in favour of buyer',
      6: 'Fair value or slight discount — acceptable entry on quality',
      4: 'Moderately overvalued — requires near-perfect execution to justify',
      2: 'Significantly overvalued — priced for perfection, minimal margin of safety',
    },
  },
  {
    id: 'marketContext',
    label: 'Market Context',
    gateQuestion: 'Is the market context favourable?',
    weight: 0.10,
    failAction: 'watchlist',
    description: 'Temporal (cycle position), Structural (permanent vs cyclical drivers), Irrational (fear vs greed pricing)',
    rubric: {
      10: '5–6 favourable signals — exceptional timing, business good and market offering it cheaply',
      8: '4 favourable signals — strong entry, proceed with conviction sizing',
      6: '2–3 favourable signals — acceptable entry, size conservatively',
      4: '1 favourable signal — wait, timing is against you',
      2: '0 favourable signals — watchlist only regardless of business quality',
    },
  },
];

const MC_SIGNALS = [
  {
    id: 'temporal_cycle',
    dimension: 'Temporal',
    question: 'Earnings cycle position',
    favourable: 'Trough or early recovery — earnings are depressed or normalised, not at cyclical peak',
    unfavourable: 'Late cycle or peak — trailing earnings are elevated and likely to mean-revert',
  },
  {
    id: 'temporal_price',
    dimension: 'Temporal',
    question: '12-month price move',
    favourable: 'Stock is flat or down while earnings are stable/growing — narrative has moved faster than fundamentals, or vice versa',
    unfavourable: 'Stock up 50%+ in the last 12 months without corresponding earnings growth — the multiple expansion has already done the work',
  },
  {
    id: 'structural_permanent',
    dimension: 'Structural',
    question: 'Are thesis drivers permanent?',
    favourable: 'At least one driver is regulatory moat, network effect, supply constraint, or demographic — forces that compound or persist regardless of cycle',
    unfavourable: 'Primary thesis drivers are commodity price, stimulus, interest rate environment, or sector sentiment — all of which reverse',
  },
  {
    id: 'structural_horizon',
    dimension: 'Structural',
    question: 'Will this advantage exist in 5 years?',
    favourable: 'High confidence the competitive position strengthens or compounds over the investment horizon',
    unfavourable: 'Meaningful risk the advantage erodes through technology change, regulatory reversal, or competitive entry',
  },
  {
    id: 'irrational_sentiment',
    dimension: 'Irrational',
    question: 'Is the market pricing fear or greed?',
    favourable: 'Selloff driven by sector contagion, narrative fear, or macro noise unrelated to company fundamentals. Insiders buying.',
    unfavourable: 'Stock making new highs on narrative, analyst upgrades post-run, retail inflow, or CEO flagging caution while market ignores it',
  },
  {
    id: 'irrational_price',
    dimension: 'Irrational',
    question: 'Does the price match the fundamentals?',
    favourable: 'Trailing PE is at or below the stock\'s 5-year average with no fundamental deterioration — the stock is cheaper than its own history',
    unfavourable: 'Forward PE is 3× sector median or requires a decade of flawless execution — the price embeds no margin for error',
  },
];

const MARKET_PHASES = [
  'Early Expansion', 'Mid Expansion', 'Late Expansion', 'Peak',
  'Early Contraction', 'Mid Contraction', 'Late Contraction', 'Trough',
];
const RATE_ENVIRONMENTS = ['Cutting', 'Low & Stable', 'Rising', 'High & Stable'];
const RISK_SENTIMENTS = ['Fear', 'Caution', 'Neutral', 'Optimism', 'Greed'];
const EXCHANGES = ['NASDAQ', 'NYSE', 'ASX', 'NZX', 'LSE', 'TSX', 'OTHER'];
const SECTORS = [
  'Technology', 'Healthcare', 'Financials', 'Consumer Discretionary',
  'Consumer Staples', 'Industrials', 'Energy', 'Materials',
  'Utilities', 'Real Estate', 'Communication Services',
];
const HORIZONS = ['< 6 months', '6–12 months', '1–2 years', '2–3 years', '3–5 years', '5+ years'];

const DEFAULT_MC_SIGNALS = Object.fromEntries(
  MC_SIGNALS.map(s => [s.id, { value: null, notes: '' }])
);

const DEFAULT_MARKET_CONTEXT = {
  phase: 'Mid Expansion',
  rateEnvironment: 'High & Stable',
  riskSentiment: 'Neutral',
  keyTheme: '',
  tailwinds: [],
  headwinds: [],
  sectorRotation: '',
  assessment: '',
  lastUpdated: null,
};

const SAMPLE_STOCKS = [
  {
    id: 'sample-1',
    ticker: 'AAPL',
    name: 'Apple Inc.',
    exchange: 'NASDAQ',
    sector: 'Technology',
    owned: true,
    shares: 10,
    costBasis: 175.00,
    addedDate: '2024-01-15',
    thesis: "Apple's ecosystem lock-in, Services revenue compounding, and Apple Intelligence integration create durable competitive advantages. The transition from hardware margin to software/services margin improves earnings quality significantly.",
    catalysts: ['Apple Intelligence driving the upgrade cycle', 'Services revenue crossing $100B+', 'India manufacturing reducing geopolitical risk'],
    risks: ['China revenue represents ~19% of total', 'EU regulatory pressure on App Store economics', 'Discretionary spending sensitivity in recession'],
    targetPrice: 230,
    horizon: '2–3 years',
    scores: { moat: 9, management: 8, balanceSheet: 10, growth: 7, valuation: 6, marketContext: 7 },
    mcSignals: {
      temporal_cycle: { value: 'favourable', notes: 'Services segment still in expansion phase, hardware cycle approaching trough' },
      temporal_price: { value: 'neutral', notes: 'Stock broadly flat vs 12 months ago' },
      structural_permanent: { value: 'favourable', notes: 'Ecosystem lock-in and App Store network effects are structural' },
      structural_horizon: { value: 'favourable', notes: 'Switching costs compound with each Apple device added to household' },
      irrational_sentiment: { value: 'neutral', notes: 'No extreme fear or greed signal currently' },
      irrational_price: { value: 'unfavourable', notes: 'PE slightly above 5-year average on hardware margin concerns' },
    },
    notes: '',
    lastPrice: 0,
    priceHistory: [],
    lastUpdated: null,
  },
  {
    id: 'sample-2',
    ticker: 'MSFT',
    name: 'Microsoft Corporation',
    exchange: 'NASDAQ',
    sector: 'Technology',
    owned: true,
    shares: 5,
    costBasis: 380.00,
    addedDate: '2024-02-01',
    thesis: 'Azure cloud growth plus Copilot AI integration across Office 365 creates a massive monetisation opportunity. Enterprise switching costs are extremely high — once a company is on Azure + M365 + Teams + Dynamics, the exit cost is prohibitive.',
    catalysts: ['Copilot enterprise seat adoption (currently < 5% of M365 base)', 'Azure market share gains from Google Cloud', 'GitHub Copilot developer moat deepening'],
    risks: ['Enterprise IT budget tightening delays Copilot adoption', 'OpenAI dependency — key model provider also a potential competitor', 'Antitrust scrutiny on Teams bundling'],
    targetPrice: 500,
    horizon: '2–3 years',
    scores: { moat: 10, management: 9, balanceSheet: 10, growth: 8, valuation: 6, marketContext: 7 },
    mcSignals: {
      temporal_cycle: { value: 'favourable', notes: 'Copilot adoption is early innings — still at < 5% penetration of addressable base' },
      temporal_price: { value: 'neutral', notes: 'Modest appreciation, roughly in line with earnings growth' },
      structural_permanent: { value: 'favourable', notes: 'Enterprise workflow lock-in (M365, Azure, Teams) is structural' },
      structural_horizon: { value: 'favourable', notes: 'Switching costs increase with every workload migrated to Azure' },
      irrational_sentiment: { value: 'neutral', notes: 'Fairly priced, no fear or greed extreme' },
      irrational_price: { value: 'unfavourable', notes: 'PE at premium to market — requires continued strong execution' },
    },
    notes: '',
    lastPrice: 0,
    priceHistory: [],
    lastUpdated: null,
  },
  {
    id: 'sample-3',
    ticker: 'NVDA',
    name: 'NVIDIA Corporation',
    exchange: 'NASDAQ',
    sector: 'Technology',
    owned: false,
    shares: 0,
    costBasis: 0,
    addedDate: '2024-03-01',
    thesis: 'Dominant AI accelerator position with CUDA software moat creates a two-sided network effect — developers build on CUDA, which demands NVIDIA hardware, which attracts more developers. The Blackwell platform extends this lead. Watching for a better entry after the 200%+ run.',
    catalysts: ['Blackwell GPU ramp addressing inference demand', 'Sovereign AI government contracts', 'NIM microservices enabling enterprise AI deployment'],
    risks: ['Customer concentration — top 5 customers are > 50% of data centre revenue', 'AMD MI300X gaining traction, Google/Amazon custom silicon', 'US export controls on H20 chips to China'],
    targetPrice: 110,
    horizon: '1–2 years',
    scores: { moat: 9, management: 8, balanceSheet: 9, growth: 10, valuation: 4, marketContext: 5 },
    mcSignals: {
      temporal_cycle: { value: 'unfavourable', notes: 'Earnings at cyclical peak driven by AI infrastructure buildout — sustainability uncertain' },
      temporal_price: { value: 'unfavourable', notes: 'Stock up ~200% over 18 months — narrative has run hard' },
      structural_permanent: { value: 'favourable', notes: 'CUDA developer ecosystem is a genuine structural moat' },
      structural_horizon: { value: 'favourable', notes: 'AI inference compute demand likely to remain for 5+ years' },
      irrational_sentiment: { value: 'unfavourable', notes: 'Retail and momentum inflows, very consensus long positioning' },
      irrational_price: { value: 'unfavourable', notes: 'Forward PE ~35× requires near-perfect execution and no margin compression' },
    },
    notes: 'Watching for pullback to ~$90–110 range for an entry. Business quality is exceptional but timing is wrong at current levels.',
    lastPrice: 0,
    priceHistory: [],
    lastUpdated: null,
  },
];

// ─── STORAGE ──────────────────────────────────────────────────────────────

const STORAGE_KEY = 'codex_v2';

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        stocks: parsed.stocks || SAMPLE_STOCKS,
        marketContext: { ...DEFAULT_MARKET_CONTEXT, ...(parsed.marketContext || {}) },
      };
    }
  } catch {}
  return { stocks: SAMPLE_STOCKS, marketContext: DEFAULT_MARKET_CONTEXT };
}

function saveState(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
}

// ─── UTILITIES ─────────────────────────────────────────────────────────────

const fmt$ = (v, d = 2) => {
  if (v == null || isNaN(v)) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: d, maximumFractionDigits: d }).format(v);
};

const fmtPct = (v, d = 1) => {
  if (v == null || isNaN(v)) return '—';
  return `${v >= 0 ? '+' : ''}${v.toFixed(d)}%`;
};

const fmtLarge = (v) => {
  if (!v || isNaN(v)) return '—';
  if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
  return fmt$(v);
};

function calcWeightedScore(scores) {
  if (!scores) return 0;
  return PILLARS.reduce((t, p) => t + (scores[p.id] || 5) * p.weight, 0);
}

function countFavourableSignals(mcSignals) {
  if (!mcSignals) return 0;
  return Object.values(mcSignals).filter(s => s.value === 'favourable').length;
}

function mcFavourableScore(count) {
  if (count >= 5) return 10;
  if (count === 4) return 8;
  if (count === 3) return 6;
  if (count === 2) return 5;
  if (count === 1) return 3;
  return 1;
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

function runDecisionGates(scores) {
  const gates = PILLARS.filter(p => p.gateQuestion);
  const results = [];
  let passed = true;
  let finalVerdict = 'BUY';

  for (const p of gates) {
    const score = scores[p.id] || 0;
    const pass = score >= 5;
    results.push({ pillar: p.label, question: p.gateQuestion, pass, score, failAction: p.failAction });
    if (!pass) {
      passed = false;
      if (p.failAction === 'stop') { finalVerdict = 'STOP'; break; }
      if (p.failAction === 'reassess') finalVerdict = 'REASSESS';
      if (p.failAction === 'watchlist' && finalVerdict === 'BUY') finalVerdict = 'WATCHLIST';
    }
  }

  return { gates: results, verdict: finalVerdict };
}

// ─── YAHOO FINANCE FETCH ────────────────────────────────────────────────────

async function fetchYahoo(ticker) {
  try {
    const r = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1y`,
      { mode: 'cors' }
    );
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const d = await r.json();
    const res = d.chart?.result?.[0];
    if (!res) throw new Error('no result');
    const meta = res.meta;
    const ts = res.timestamp || [];
    const closes = res.indicators?.quote?.[0]?.close || [];
    const priceHistory = ts
      .map((t, i) => ({ date: new Date(t * 1000).toISOString().split('T')[0], price: closes[i] }))
      .filter(x => x.price != null);
    return {
      currentPrice: meta.regularMarketPrice,
      previousClose: meta.previousClose,
      marketCap: meta.marketCap,
      fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: meta.fiftyTwoWeekLow,
      currency: meta.currency,
      priceHistory,
    };
  } catch (e) {
    console.warn(`[Yahoo] ${ticker}: ${e.message}`);
    return null;
  }
}

// ─── SVG CHARTS ─────────────────────────────────────────────────────────────

function SparkLine({ data, w = 100, h = 36 }) {
  const prices = (data || []).map(d => d.price).filter(p => p != null);
  if (prices.length < 2) {
    return (
      <svg width={w} height={h}>
        <line x1="0" y1={h / 2} x2={w} y2={h / 2} stroke="#334155" strokeWidth="1" strokeDasharray="4,2" />
      </svg>
    );
  }
  const mn = Math.min(...prices), mx = Math.max(...prices), rng = mx - mn || 1;
  const pts = prices.map((p, i) => `${(i / (prices.length - 1)) * w},${h - 2 - ((p - mn) / rng) * (h - 4)}`).join(' ');
  const up = prices[prices.length - 1] >= prices[0];
  return (
    <svg width={w} height={h}>
      <polyline points={pts} fill="none" stroke={up ? '#4ade80' : '#f87171'} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function PriceChart({ data, w = 640, h = 180 }) {
  const prices = (data || []).map(d => d.price).filter(p => p != null);
  if (prices.length < 2) return (
    <div style={{ height: h, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: '0.8rem' }}>
      No price history — refresh to load from Yahoo Finance
    </div>
  );
  const pd = { t: 16, r: 16, b: 28, l: 56 };
  const cw = w - pd.l - pd.r, ch = h - pd.t - pd.b;
  const mn = Math.min(...prices), mx = Math.max(...prices), rng = mx - mn || 1;
  const pts = prices.map((p, i) => `${(i / (prices.length - 1)) * cw},${ch - ((p - mn) / rng) * ch}`).join(' ');
  const areaPts = `0,${ch} ${pts} ${cw},${ch}`;
  const up = prices[prices.length - 1] >= prices[0];
  const lc = up ? '#4ade80' : '#f87171';
  const ac = up ? 'rgba(74,222,128,0.08)' : 'rgba(248,113,113,0.08)';
  const yLabels = [0, 0.5, 1].map(t => ({ y: ch - t * ch, v: fmt$(mn + t * rng, 0) }));
  const xLabels = [0, Math.floor(data.length / 2), data.length - 1].filter(i => data[i]).map(i => ({
    x: (i / (data.length - 1)) * cw,
    v: new Date(data[i].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }));
  const lx = cw, ly = ch - ((prices[prices.length - 1] - mn) / rng) * ch;
  return (
    <svg width={w} height={h} style={{ overflow: 'visible' }}>
      <g transform={`translate(${pd.l},${pd.t})`}>
        {yLabels.map((y, i) => (
          <g key={i}>
            <line x1={0} y1={y.y} x2={cw} y2={y.y} stroke="#1e293b" strokeWidth="1" />
            <text x={-6} y={y.y + 4} textAnchor="end" fill="#475569" fontSize="10">{y.v}</text>
          </g>
        ))}
        <polygon points={areaPts} fill={ac} />
        <polyline points={pts} fill="none" stroke={lc} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={lx} cy={ly} r="3.5" fill={lc} />
        {xLabels.map((x, i) => (
          <text key={i} x={x.x} y={ch + 18} textAnchor="middle" fill="#475569" fontSize="10">{x.v}</text>
        ))}
      </g>
    </svg>
  );
}

function RadarChart({ scores, size = 220 }) {
  const n = PILLARS.length, cx = size / 2, cy = size / 2, mr = size / 2 - 32;
  const angles = PILLARS.map((_, i) => (i * 2 * Math.PI) / n - Math.PI / 2);
  const gridPts = (t) => angles.map(a => `${cx + Math.cos(a) * mr * t},${cy + Math.sin(a) * mr * t}`).join(' ');
  const dataPts = PILLARS.map((p, i) => {
    const v = (scores[p.id] || 0) / 10;
    return `${cx + Math.cos(angles[i]) * mr * v},${cy + Math.sin(angles[i]) * mr * v}`;
  });
  return (
    <svg width={size} height={size}>
      {[0.2, 0.4, 0.6, 0.8, 1].map((t, i) => (
        <polygon key={i} points={gridPts(t)} fill="none" stroke="#1e293b" strokeWidth="1" />
      ))}
      {angles.map((a, i) => (
        <line key={i} x1={cx} y1={cy} x2={cx + Math.cos(a) * mr} y2={cy + Math.sin(a) * mr} stroke="#1e293b" strokeWidth="1" />
      ))}
      <polygon points={dataPts.join(' ')} fill="rgba(99,102,241,0.25)" stroke="#6366f1" strokeWidth="2" />
      {PILLARS.map((p, i) => {
        const v = (scores[p.id] || 0) / 10;
        const px = cx + Math.cos(angles[i]) * mr * v;
        const py = cy + Math.sin(angles[i]) * mr * v;
        const lx = cx + Math.cos(angles[i]) * (mr + 20);
        const ly = cy + Math.sin(angles[i]) * (mr + 20);
        return (
          <g key={i}>
            <circle cx={px} cy={py} r="4" fill="#6366f1" />
            <text x={lx} y={ly + 3} textAnchor="middle" fill="#64748b" fontSize="9" dominantBaseline="middle">
              {p.label.split(' ')[0]} {scores[p.id] || 0}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── MARKET CONTEXT BANNER (permanent, shown on every view) ────────────────

function MCBanner({ ctx, onEdit }) {
  const [open, setOpen] = useState(false);
  const phaseColor = {
    'Early Expansion': '#86efac', 'Mid Expansion': '#4ade80', 'Late Expansion': '#facc15',
    'Peak': '#fb923c', 'Early Contraction': '#f87171', 'Mid Contraction': '#ef4444',
    'Late Contraction': '#dc2626', 'Trough': '#94a3b8',
  }[ctx.phase] || '#94a3b8';
  const sentColor = { Fear: '#f87171', Caution: '#fb923c', Neutral: '#94a3b8', Optimism: '#86efac', Greed: '#f87171' }[ctx.riskSentiment] || '#94a3b8';

  return (
    <div className="mc-banner">
      <div className="mc-banner-top" onClick={() => setOpen(o => !o)}>
        <div className="mc-banner-left">
          <span className="mc-label">Market Context</span>
          <span className="mc-chip" style={{ '--c': phaseColor }}>{ctx.phase}</span>
          <span className="mc-chip" style={{ '--c': sentColor }}>{ctx.riskSentiment} Sentiment</span>
          <span className="mc-chip" style={{ '--c': '#818cf8' }}>Rates: {ctx.rateEnvironment}</span>
          {ctx.keyTheme && <span className="mc-chip theme-chip">{ctx.keyTheme}</span>}
        </div>
        <div className="mc-banner-right">
          {ctx.lastUpdated && <span className="mc-updated">Updated {new Date(ctx.lastUpdated).toLocaleDateString()}</span>}
          <button className="btn-sm" onClick={e => { e.stopPropagation(); onEdit(); }}>Edit</button>
          <span className="chevron">{open ? '▲' : '▼'}</span>
        </div>
      </div>
      {open && (
        <div className="mc-banner-body">
          {ctx.assessment && <p className="mc-assessment">{ctx.assessment}</p>}
          <div className="mc-lists">
            {ctx.tailwinds?.length > 0 && (
              <div>
                <div className="mc-list-label" style={{ color: '#4ade80' }}>Tailwinds</div>
                <ul>{ctx.tailwinds.map((t, i) => <li key={i}>{t}</li>)}</ul>
              </div>
            )}
            {ctx.headwinds?.length > 0 && (
              <div>
                <div className="mc-list-label" style={{ color: '#f87171' }}>Headwinds</div>
                <ul>{ctx.headwinds.map((h, i) => <li key={i}>{h}</li>)}</ul>
              </div>
            )}
          </div>
          {ctx.sectorRotation && (
            <p className="mc-rotation"><strong>Sector Rotation:</strong> {ctx.sectorRotation}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────

function Dashboard({ stocks, marketContext }) {
  const owned = stocks.filter(s => s.owned && s.shares > 0);
  const totalVal = owned.reduce((s, x) => s + x.shares * (x.lastPrice || x.costBasis), 0);
  const totalCost = owned.reduce((s, x) => s + x.shares * x.costBasis, 0);
  const totalPL = totalVal - totalCost;
  const totalPLPct = totalCost > 0 ? (totalPL / totalCost) * 100 : 0;
  const avgScore = stocks.length ? stocks.reduce((s, x) => s + calcWeightedScore(x.scores), 0) / stocks.length : 0;
  const topConviction = [...stocks].sort((a, b) => calcWeightedScore(b.scores) - calcWeightedScore(a.scores)).slice(0, 4);

  return (
    <div className="view">
      <h2 className="view-title">Dashboard</h2>
      <div className="kpi-row">
        {[
          { label: 'Portfolio Value', value: fmt$(totalVal), sub: `${fmtPct(totalPLPct)} (${fmt$(totalPL)})`, subColor: plColor(totalPL) },
          { label: 'Positions', value: owned.length, sub: `${stocks.length - owned.length} on watchlist` },
          { label: 'Avg Codex Score', value: avgScore.toFixed(1), valueColor: getSignal(avgScore).color, sub: `across ${stocks.length} stocks` },
          { label: 'Market Phase', value: marketContext.phase, sub: `${marketContext.riskSentiment} sentiment` },
        ].map((k, i) => (
          <div key={i} className="kpi-card">
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value" style={{ color: k.valueColor }}>{k.value}</div>
            <div className="kpi-sub" style={{ color: k.subColor }}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="dash-grid">
        <div className="panel">
          <h3 className="panel-title">Top Conviction Picks</h3>
          {topConviction.map(s => {
            const sc = calcWeightedScore(s.scores);
            const sig = getSignal(sc);
            return (
              <div key={s.id} className="mini-row">
                <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                  <span className="ticker">{s.ticker}</span>
                  <span className="name-sm">{s.name}</span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ color: sig.color, fontWeight: 700 }}>{sc.toFixed(1)}</span>
                  <span className="sig-pill" style={{ '--c': sig.color }}>{sig.label}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="panel">
          <h3 className="panel-title">Portfolio Positions</h3>
          {owned.length === 0
            ? <p className="empty-hint">No owned positions yet. Add stocks with "Owned" enabled.</p>
            : owned.map(s => {
                const price = s.lastPrice || s.costBasis;
                const val = s.shares * price;
                const pl = (price - s.costBasis) * s.shares;
                const plp = totalVal > 0 ? (val / totalVal * 100) : 0;
                return (
                  <div key={s.id} className="mini-row">
                    <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                      <span className="ticker">{s.ticker}</span>
                      <span className="name-sm">{plp.toFixed(1)}% of portfolio</span>
                    </div>
                    <span style={{ color: plColor(pl), fontWeight: 600 }}>{fmt$(pl)}</span>
                  </div>
                );
              })
          }
        </div>
      </div>

      <div className="panel">
        <h3 className="panel-title">Decision Gate Summary</h3>
        <div className="gate-summary">
          {stocks.map(s => {
            const { verdict } = runDecisionGates(s.scores);
            const vColor = { BUY: '#4ade80', WATCHLIST: '#facc15', REASSESS: '#fb923c', STOP: '#f87171' }[verdict] || '#94a3b8';
            return (
              <div key={s.id} className="gate-chip">
                <span className="ticker-sm">{s.ticker}</span>
                <span style={{ color: vColor, fontSize: '0.7rem', fontWeight: 700 }}>{verdict}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── WATCHLIST ────────────────────────────────────────────────────────────────

function Watchlist({ stocks, onSelect, onAdd, onRefresh, refreshing }) {
  const [sortBy, setSortBy] = useState('score');
  const [filter, setFilter] = useState('all');

  const list = useMemo(() => {
    let r = [...stocks];
    if (filter === 'owned') r = r.filter(s => s.owned);
    if (filter === 'watching') r = r.filter(s => !s.owned);
    if (sortBy === 'score') r.sort((a, b) => calcWeightedScore(b.scores) - calcWeightedScore(a.scores));
    if (sortBy === 'ticker') r.sort((a, b) => a.ticker.localeCompare(b.ticker));
    if (sortBy === 'pl') r.sort((a, b) => {
      const plA = ((a.lastPrice || a.costBasis) - a.costBasis) * a.shares;
      const plB = ((b.lastPrice || b.costBasis) - b.costBasis) * b.shares;
      return plB - plA;
    });
    return r;
  }, [stocks, sortBy, filter]);

  return (
    <div className="view">
      <div className="view-header">
        <h2 className="view-title">Watchlist</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn-secondary" onClick={onRefresh} disabled={refreshing}>
            {refreshing ? '↻ Refreshing…' : '↻ Refresh Prices'}
          </button>
          <button className="btn-primary" onClick={onAdd}>+ Add Stock</button>
        </div>
      </div>

      <div className="table-controls">
        <div className="filter-tabs">
          {['all', 'owned', 'watching'].map(f => (
            <button key={f} className={`filter-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <select className="sort-sel" value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="score">Sort: Codex Score</option>
          <option value="ticker">Sort: Ticker A–Z</option>
          <option value="pl">Sort: P&amp;L</option>
        </select>
      </div>

      <div className="stock-table">
        <div className="tbl-head">
          <span>Stock</span>
          <span>Sector</span>
          <span>Price</span>
          <span>P&amp;L</span>
          <span>Trend</span>
          <span>Codex Score</span>
          <span>Verdict</span>
        </div>
        {list.map(s => {
          const sc = calcWeightedScore(s.scores);
          const sig = getSignal(sc);
          const price = s.lastPrice || s.costBasis;
          const pl = s.owned ? (price - s.costBasis) * s.shares : null;
          const plp = s.owned && s.costBasis > 0 ? ((price - s.costBasis) / s.costBasis) * 100 : null;
          const { verdict } = runDecisionGates(s.scores);
          const vColor = { BUY: '#4ade80', WATCHLIST: '#facc15', REASSESS: '#fb923c', STOP: '#f87171' }[verdict] || '#94a3b8';
          return (
            <div key={s.id} className="tbl-row" onClick={() => onSelect(s.id)}>
              <div className="stock-cell">
                <span className="ticker">{s.ticker}</span>
                <div>
                  <div className="stock-name">{s.name}</div>
                  <div className="stock-meta">{s.exchange} · {s.owned ? 'Owned' : 'Watching'}</div>
                </div>
              </div>
              <span className="cell-dim">{s.sector}</span>
              <span>{price > 0 ? fmt$(price) : '—'}</span>
              <span style={{ color: plColor(pl) }}>
                {pl !== null ? <><div>{fmt$(pl)}</div><div style={{ fontSize: '0.72rem' }}>{fmtPct(plp)}</div></> : '—'}
              </span>
              <span><SparkLine data={s.priceHistory} /></span>
              <span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <div className="score-track">
                    <div className="score-fill" style={{ width: `${sc * 10}%`, background: sig.color }} />
                  </div>
                  <span style={{ color: sig.color, fontWeight: 700 }}>{sc.toFixed(1)}</span>
                </div>
              </span>
              <span>
                <span className="verdict-badge" style={{ '--c': vColor }}>{verdict}</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── PORTFOLIO ──────────────────────────────────────────────────────────────

function Portfolio({ stocks }) {
  const owned = stocks.filter(s => s.owned && s.shares > 0);
  const totalVal = owned.reduce((s, x) => s + x.shares * (x.lastPrice || x.costBasis), 0);
  const totalCost = owned.reduce((s, x) => s + x.shares * x.costBasis, 0);
  const totalPL = totalVal - totalCost;
  const totalPLPct = totalCost > 0 ? (totalPL / totalCost) * 100 : 0;

  return (
    <div className="view">
      <h2 className="view-title">Portfolio</h2>
      <div className="port-summary">
        <div className="port-stat"><div className="port-lbl">Total Value</div><div className="port-big">{fmt$(totalVal)}</div></div>
        <div className="port-stat"><div className="port-lbl">Total P&amp;L</div><div className="port-big" style={{ color: plColor(totalPL) }}>{fmt$(totalPL)} <span style={{ fontSize: '1rem' }}>({fmtPct(totalPLPct)})</span></div></div>
        <div className="port-stat"><div className="port-lbl">Cost Basis</div><div className="port-big">{fmt$(totalCost)}</div></div>
        <div className="port-stat"><div className="port-lbl">Positions</div><div className="port-big">{owned.length}</div></div>
      </div>

      {owned.length === 0
        ? <div className="empty-state">No owned positions yet. Add stocks with "Owned" enabled.</div>
        : (
          <div className="pos-grid">
            {owned.map(s => {
              const price = s.lastPrice || s.costBasis;
              const val = s.shares * price;
              const pl = (price - s.costBasis) * s.shares;
              const plp = ((price - s.costBasis) / s.costBasis) * 100;
              const wt = totalVal > 0 ? (val / totalVal * 100) : 0;
              const sc = calcWeightedScore(s.scores);
              const sig = getSignal(sc);
              const { verdict } = runDecisionGates(s.scores);
              const vColor = { BUY: '#4ade80', WATCHLIST: '#facc15', REASSESS: '#fb923c', STOP: '#f87171' }[verdict] || '#94a3b8';
              return (
                <div key={s.id} className="pos-card">
                  <div className="pos-header">
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <span className="ticker lg">{s.ticker}</span>
                      <div>
                        <div className="stock-name">{s.name}</div>
                        <div className="stock-meta">{s.sector}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: sig.color, fontSize: '1.4rem', fontWeight: 700 }}>{sc.toFixed(1)}</div>
                      <div style={{ color: vColor, fontSize: '0.7rem', fontWeight: 700 }}>{verdict}</div>
                    </div>
                  </div>
                  <div className="pos-chart-wrap">
                    <PriceChart data={s.priceHistory} w={380} h={120} />
                  </div>
                  <div className="pos-stats">
                    {[
                      ['Shares', s.shares],
                      ['Avg Cost', fmt$(s.costBasis)],
                      ['Current', price > 0 ? fmt$(price) : '—'],
                      ['Value', fmt$(val)],
                      ['P&L', <span style={{ color: plColor(pl) }}>{fmt$(pl)} ({fmtPct(plp)})</span>],
                      ['Weight', `${wt.toFixed(1)}%`],
                      ['Target', fmt$(s.targetPrice)],
                      ['Horizon', s.horizon],
                    ].map(([l, v]) => (
                      <div key={l} className="pos-stat-item">
                        <div className="pos-stat-lbl">{l}</div>
                        <div className="pos-stat-val">{v}</div>
                      </div>
                    ))}
                  </div>
                  {s.thesis && (
                    <div className="pos-thesis">
                      <div className="thesis-lbl">Thesis</div>
                      <p>{s.thesis}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      }
    </div>
  );
}

// ─── STOCK DETAIL ─────────────────────────────────────────────────────────────

function StockDetail({ stock, marketContext, onEdit, onDelete, onBack }) {
  const sc = calcWeightedScore(stock.scores);
  const sig = getSignal(sc);
  const { gates, verdict } = runDecisionGates(stock.scores);
  const vColor = { BUY: '#4ade80', WATCHLIST: '#facc15', REASSESS: '#fb923c', STOP: '#f87171' }[verdict] || '#94a3b8';
  const mcSignals = stock.mcSignals || DEFAULT_MC_SIGNALS;
  const favCount = countFavourableSignals(mcSignals);
  const price = stock.lastPrice || stock.costBasis;
  const pl = stock.owned ? (price - stock.costBasis) * stock.shares : null;
  const plp = stock.owned && stock.costBasis > 0 ? ((price - stock.costBasis) / stock.costBasis) * 100 : null;

  const dimensionColor = { Temporal: '#f59e0b', Structural: '#6366f1', Irrational: '#ec4899' };

  return (
    <div className="view">
      <div className="detail-nav">
        <button className="btn-back" onClick={onBack}>← Back to Watchlist</button>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn-secondary" onClick={() => onEdit(stock)}>Edit</button>
          <button className="btn-danger" onClick={() => { if (window.confirm(`Remove ${stock.ticker}?`)) onDelete(stock.id); }}>Remove</button>
        </div>
      </div>

      {/* Header */}
      <div className="detail-hdr">
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span className="ticker xl">{stock.ticker}</span>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.4rem' }}>{stock.name}</h2>
            <div className="stock-meta">{stock.exchange} · {stock.sector} · {stock.owned ? `${stock.shares} shares owned` : 'Watchlist'}</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: sig.color, fontSize: '2.8rem', fontWeight: 700, lineHeight: 1 }}>{sc.toFixed(1)}</div>
          <div style={{ color: sig.color, fontWeight: 600 }}>{sig.label}</div>
          <div style={{ color: vColor, fontSize: '0.8rem', fontWeight: 700, marginTop: '0.2rem' }}>Gate: {verdict}</div>
        </div>
      </div>

      {/* Applied Market Context — always shown, permanent */}
      <div className="applied-mc">
        <div className="applied-mc-hdr">
          <span className="applied-mc-title">Applied Market Context</span>
          <span style={{ color: '#64748b', fontSize: '0.75rem' }}>
            This assessment is permanent and applies to all stock reviews
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
          {[
            [marketContext.phase, '#4ade80'],
            [`Rates: ${marketContext.rateEnvironment}`, '#818cf8'],
            [`Sentiment: ${marketContext.riskSentiment}`, '#f59e0b'],
            marketContext.keyTheme ? [marketContext.keyTheme, '#94a3b8'] : null,
          ].filter(Boolean).map(([label, color], i) => (
            <span key={i} className="badge" style={{ '--bc': color }}>{label}</span>
          ))}
        </div>
        {marketContext.assessment && <p className="mc-text">{marketContext.assessment}</p>}
      </div>

      <div className="detail-grid">
        {/* Pillar Scores */}
        <div className="panel">
          <h3 className="panel-title">Framework Scores</h3>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
            <RadarChart scores={stock.scores} size={210} />
            <div style={{ flex: 1 }}>
              {PILLARS.map(p => {
                const v = stock.scores[p.id] || 0;
                const c = getSignal(v).color;
                return (
                  <div key={p.id} className="pillar-row">
                    <div>
                      <div className="pillar-name">{p.label}</div>
                      {p.gateQuestion && (
                        <div className="pillar-gate">
                          Gate: {p.gateQuestion} → {v >= 5 ? 'PASS' : p.failAction.toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '120px' }}>
                      <div className="pillar-track">
                        <div className="pillar-fill" style={{ width: `${v * 10}%`, background: c }} />
                      </div>
                      <span style={{ color: c, fontWeight: 700 }}>{v}</span>
                    </div>
                  </div>
                );
              })}
              <div className="total-score-row">
                <span>Weighted Score</span>
                <span style={{ color: sig.color, fontWeight: 700, fontSize: '1.2rem' }}>{sc.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Decision Gates */}
        <div className="panel">
          <h3 className="panel-title">Decision Gate Sequence</h3>
          <div className="gate-list">
            {gates.map((g, i) => (
              <div key={i} className={`gate-row ${g.pass ? 'pass' : 'fail'}`}>
                <span className="gate-num">{i + 1}</span>
                <div className="gate-body">
                  <div className="gate-q">{g.question}</div>
                  <div className="gate-result">{g.pass ? '✓ PASS — continue' : `✗ FAIL — ${g.failAction}`}</div>
                </div>
                <span className="gate-score" style={{ color: getSignal(g.score).color }}>{g.score}</span>
              </div>
            ))}
            <div className={`gate-verdict gate-verdict-${verdict.toLowerCase()}`}>
              Final decision: <strong>{verdict}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Market Context Signals — 6 dimensions */}
      <div className="panel">
        <h3 className="panel-title">
          Market Context Assessment — {favCount}/6 Favourable
          <span className="mc-count-label" style={{
            color: favCount >= 4 ? '#4ade80' : favCount >= 2 ? '#facc15' : '#f87171',
          }}>
            {favCount >= 4 ? 'Strong Entry' : favCount >= 2 ? 'Acceptable — size conservatively' : 'Watchlist — timing is wrong'}
          </span>
        </h3>
        <div className="mc-signals-grid">
          {MC_SIGNALS.map(sig => {
            const sigData = mcSignals[sig.id] || { value: null, notes: '' };
            const valColor = sigData.value === 'favourable' ? '#4ade80' : sigData.value === 'unfavourable' ? '#f87171' : '#64748b';
            const dimColor = dimensionColor[sig.dimension];
            return (
              <div key={sig.id} className="mc-signal-card">
                <div className="mc-sig-header">
                  <span className="mc-dim-badge" style={{ '--dc': dimColor }}>{sig.dimension}</span>
                  <span className="mc-sig-q">{sig.question}</span>
                  {sigData.value && (
                    <span className="mc-sig-val" style={{ color: valColor }}>
                      {sigData.value === 'favourable' ? '✓ Favourable' : '✗ Unfavourable'}
                    </span>
                  )}
                </div>
                <div className="mc-sig-criteria">
                  <div className="mc-crit green"><strong>Favourable:</strong> {sig.favourable}</div>
                  <div className="mc-crit red"><strong>Unfavourable:</strong> {sig.unfavourable}</div>
                </div>
                {sigData.notes && (
                  <div className="mc-sig-notes">"{sigData.notes}"</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Price Chart */}
      <div className="panel">
        <h3 className="panel-title">
          Price History
          {stock.lastPrice > 0 && (
            <span style={{ color: '#94a3b8', fontWeight: 400, fontSize: '0.875rem', marginLeft: '0.75rem' }}>
              Current: {fmt$(stock.lastPrice)} · 52W H/L: {fmt$(stock.priceHistory.length ? Math.max(...stock.priceHistory.map(d => d.price)) : 0)} / {fmt$(stock.priceHistory.length ? Math.min(...stock.priceHistory.map(d => d.price)) : 0)}
            </span>
          )}
        </h3>
        <PriceChart data={stock.priceHistory} w={720} h={200} />
      </div>

      {/* Position Details */}
      {stock.owned && (
        <div className="panel">
          <h3 className="panel-title">Position</h3>
          <div className="pos-stats">
            {[
              ['Shares', stock.shares],
              ['Avg Cost', fmt$(stock.costBasis)],
              ['Current Price', stock.lastPrice > 0 ? fmt$(stock.lastPrice) : 'Awaiting refresh'],
              ['Total Cost', fmt$(stock.shares * stock.costBasis)],
              ['Current Value', stock.lastPrice > 0 ? fmt$(stock.shares * stock.lastPrice) : '—'],
              ['P&L', pl !== null ? <span style={{ color: plColor(pl) }}>{fmt$(pl)} ({fmtPct(plp)})</span> : '—'],
              ['Target Price', fmt$(stock.targetPrice)],
              ['Time Horizon', stock.horizon],
            ].map(([l, v]) => (
              <div key={l} className="pos-stat-item">
                <div className="pos-stat-lbl">{l}</div>
                <div className="pos-stat-val">{v}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!stock.owned && (
        <div className="panel">
          <h3 className="panel-title">Watchlist Details</h3>
          <div className="pos-stats">
            {[
              ['Target Price', fmt$(stock.targetPrice)],
              ['Time Horizon', stock.horizon],
              ['Added', new Date(stock.addedDate).toLocaleDateString()],
            ].map(([l, v]) => (
              <div key={l} className="pos-stat-item">
                <div className="pos-stat-lbl">{l}</div>
                <div className="pos-stat-val">{v}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Investment Thesis */}
      <div className="panel">
        <h3 className="panel-title">Investment Thesis</h3>
        {stock.thesis
          ? <p className="thesis-body">{stock.thesis}</p>
          : <p className="empty-hint">No thesis written yet. Click Edit to add one.</p>
        }
        <div className="thesis-grid">
          {stock.catalysts?.length > 0 && (
            <div>
              <h4 className="thesis-sub green">Key Catalysts</h4>
              <ul className="thesis-list">
                {stock.catalysts.map((c, i) => <li key={i}><span className="bull-dot green" />  {c}</li>)}
              </ul>
            </div>
          )}
          {stock.risks?.length > 0 && (
            <div>
              <h4 className="thesis-sub red">Key Risks</h4>
              <ul className="thesis-list">
                {stock.risks.map((r, i) => <li key={i}><span className="bull-dot red" /> {r}</li>)}
              </ul>
            </div>
          )}
        </div>
        {stock.notes && (
          <div className="notes-block">{stock.notes}</div>
        )}
      </div>
    </div>
  );
}

// ─── MARKET CONTEXT EDITOR ───────────────────────────────────────────────────

function MCEditor({ ctx, onSave, onClose }) {
  const [form, setForm] = useState({
    ...DEFAULT_MARKET_CONTEXT, ...ctx,
    tailwinds: [...(ctx.tailwinds || [])],
    headwinds: [...(ctx.headwinds || [])],
  });
  const [tw, setTw] = useState('');
  const [hw, setHw] = useState('');
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const addItem = (key, val, setter) => {
    if (!val.trim()) return;
    setForm(p => ({ ...p, [key]: [...p[key], val.trim()] }));
    setter('');
  };
  const removeItem = (key, i) => setForm(p => ({ ...p, [key]: p[key].filter((_, j) => j !== i) }));

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-hdr">
          <h3>Market Context Assessment</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <p className="modal-note">
            This assessment is permanent and applies automatically to all stock thesis documents and portfolio reviews.
          </p>
          <div className="form-row">
            {[
              ['Market Phase', 'phase', MARKET_PHASES],
              ['Rate Environment', 'rateEnvironment', RATE_ENVIRONMENTS],
              ['Risk Sentiment', 'riskSentiment', RISK_SENTIMENTS],
            ].map(([label, key, opts]) => (
              <div key={key} className="form-group">
                <label>{label}</label>
                <select value={form[key]} onChange={e => set(key, e.target.value)}>
                  {opts.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>
          <div className="form-group">
            <label>Key Macro Theme</label>
            <input type="text" value={form.keyTheme} onChange={e => set('keyTheme', e.target.value)} placeholder="e.g. AI infrastructure buildout, rate normalisation…" />
          </div>
          <div className="form-group">
            <label>Assessment Summary</label>
            <textarea rows={4} value={form.assessment} onChange={e => set('assessment', e.target.value)} placeholder="Write your overall market context assessment here…" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Tailwinds</label>
              <div className="tag-row">
                <input type="text" value={tw} onChange={e => setTw(e.target.value)} onKeyDown={e => e.key === 'Enter' && addItem('tailwinds', tw, setTw)} placeholder="Add tailwind, press Enter" />
                <button className="btn-sm" onClick={() => addItem('tailwinds', tw, setTw)}>+</button>
              </div>
              <div className="tag-list">
                {form.tailwinds.map((t, i) => <span key={i} className="tag green">{t} <button onClick={() => removeItem('tailwinds', i)}>×</button></span>)}
              </div>
            </div>
            <div className="form-group">
              <label>Headwinds</label>
              <div className="tag-row">
                <input type="text" value={hw} onChange={e => setHw(e.target.value)} onKeyDown={e => e.key === 'Enter' && addItem('headwinds', hw, setHw)} placeholder="Add headwind, press Enter" />
                <button className="btn-sm" onClick={() => addItem('headwinds', hw, setHw)}>+</button>
              </div>
              <div className="tag-list">
                {form.headwinds.map((h, i) => <span key={i} className="tag red">{h} <button onClick={() => removeItem('headwinds', i)}>×</button></span>)}
              </div>
            </div>
          </div>
          <div className="form-group">
            <label>Sector Rotation Notes</label>
            <input type="text" value={form.sectorRotation} onChange={e => set('sectorRotation', e.target.value)} placeholder="e.g. Rotating from growth into value, financials outperforming…" />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={() => onSave({ ...form, lastUpdated: new Date().toISOString() })}>Save Assessment</button>
        </div>
      </div>
    </div>
  );
}

// ─── STOCK FORM ──────────────────────────────────────────────────────────────

function StockForm({ stock, onSave, onClose }) {
  const empty = {
    ticker: '', name: '', exchange: 'NASDAQ', sector: '', owned: false,
    shares: 0, costBasis: 0, addedDate: new Date().toISOString().split('T')[0],
    thesis: '', catalysts: [], risks: [], targetPrice: 0, horizon: '2–3 years',
    scores: { moat: 5, management: 5, balanceSheet: 5, growth: 5, valuation: 5, marketContext: 5 },
    mcSignals: { ...DEFAULT_MC_SIGNALS },
    notes: '', lastPrice: 0, priceHistory: [], lastUpdated: null,
  };

  const [form, setForm] = useState(stock ? {
    ...empty, ...stock,
    catalysts: [...(stock.catalysts || [])],
    risks: [...(stock.risks || [])],
    mcSignals: { ...DEFAULT_MC_SIGNALS, ...(stock.mcSignals || {}) },
  } : empty);

  const [newCat, setNewCat] = useState('');
  const [newRisk, setNewRisk] = useState('');
  const [tab, setTab] = useState('basics');
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const setScore = (k, v) => setForm(p => ({ ...p, scores: { ...p.scores, [k]: parseInt(v) } }));
  const setMCSig = (id, key, val) => setForm(p => ({
    ...p,
    mcSignals: { ...p.mcSignals, [id]: { ...p.mcSignals[id], [key]: val } },
  }));

  const addTag = (key, val, setter) => {
    if (!val.trim()) return;
    setForm(p => ({ ...p, [key]: [...p[key], val.trim()] }));
    setter('');
  };
  const removeTag = (key, i) => setForm(p => ({ ...p, [key]: p[key].filter((_, j) => j !== i) }));

  const validate = () => {
    if (!form.ticker.trim()) { alert('Ticker symbol is required'); return false; }
    if (!form.name.trim()) { alert('Company name is required'); return false; }
    return true;
  };

  const dimensionColor = { Temporal: '#f59e0b', Structural: '#6366f1', Irrational: '#ec4899' };

  return (
    <div className="modal-overlay">
      <div className="modal wide-modal">
        <div className="modal-hdr">
          <h3>{stock ? `Edit ${stock.ticker}` : 'Add Stock'}</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-tabs">
          {[['basics', 'Basics'], ['thesis', 'Thesis'], ['scores', 'Framework Scores'], ['mc', 'Market Context Signals']].map(([id, label]) => (
            <button key={id} className={`modal-tab ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)}>{label}</button>
          ))}
        </div>
        <div className="modal-body">
          {tab === 'basics' && (
            <div>
              <div className="form-row">
                <div className="form-group">
                  <label>Ticker *</label>
                  <input type="text" value={form.ticker} onChange={e => set('ticker', e.target.value.toUpperCase())} placeholder="AAPL" />
                </div>
                <div className="form-group flex2">
                  <label>Company Name *</label>
                  <input type="text" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Apple Inc." />
                </div>
                <div className="form-group">
                  <label>Exchange</label>
                  <select value={form.exchange} onChange={e => set('exchange', e.target.value)}>
                    {EXCHANGES.map(x => <option key={x}>{x}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Sector</label>
                  <select value={form.sector} onChange={e => set('sector', e.target.value)}>
                    <option value="">Select…</option>
                    {SECTORS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Time Horizon</label>
                  <select value={form.horizon} onChange={e => set('horizon', e.target.value)}>
                    {HORIZONS.map(h => <option key={h}>{h}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Target Price ($)</label>
                  <input type="number" value={form.targetPrice} onChange={e => set('targetPrice', parseFloat(e.target.value) || 0)} step="0.01" />
                </div>
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input type="checkbox" checked={form.owned} onChange={e => set('owned', e.target.checked)} />
                  Owned position
                </label>
              </div>
              {form.owned && (
                <div className="form-row">
                  <div className="form-group">
                    <label>Shares</label>
                    <input type="number" value={form.shares} onChange={e => set('shares', parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="form-group">
                    <label>Cost Basis (per share)</label>
                    <input type="number" value={form.costBasis} onChange={e => set('costBasis', parseFloat(e.target.value) || 0)} step="0.01" />
                  </div>
                </div>
              )}
              <div className="form-group">
                <label>Notes</label>
                <textarea rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any additional notes, watch levels, entry conditions…" />
              </div>
            </div>
          )}

          {tab === 'thesis' && (
            <div>
              <div className="form-group">
                <label>Investment Thesis</label>
                <textarea rows={5} value={form.thesis} onChange={e => set('thesis', e.target.value)} placeholder="State your core investment thesis. Why will this business be more valuable in your holding period?" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Key Catalysts</label>
                  <div className="tag-row">
                    <input type="text" value={newCat} onChange={e => setNewCat(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTag('catalysts', newCat, setNewCat)} placeholder="Add catalyst, press Enter" />
                    <button className="btn-sm" onClick={() => addTag('catalysts', newCat, setNewCat)}>+</button>
                  </div>
                  <div className="tag-list">
                    {form.catalysts.map((c, i) => <span key={i} className="tag green">{c} <button onClick={() => removeTag('catalysts', i)}>×</button></span>)}
                  </div>
                </div>
                <div className="form-group">
                  <label>Key Risks</label>
                  <div className="tag-row">
                    <input type="text" value={newRisk} onChange={e => setNewRisk(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTag('risks', newRisk, setNewRisk)} placeholder="Add risk, press Enter" />
                    <button className="btn-sm" onClick={() => addTag('risks', newRisk, setNewRisk)}>+</button>
                  </div>
                  <div className="tag-list">
                    {form.risks.map((r, i) => <span key={i} className="tag red">{r} <button onClick={() => removeTag('risks', i)}>×</button></span>)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'scores' && (
            <div>
              <p className="hint-text">Score each pillar 1–10. The weighted score determines the overall Codex Score and decision signal.</p>
              {PILLARS.map(p => {
                const v = form.scores[p.id] || 5;
                const c = getSignal(v).color;
                return (
                  <div key={p.id} className="score-row">
                    <div className="score-row-info">
                      <div className="pillar-name">{p.label}</div>
                      <div className="pillar-desc">{p.description}</div>
                      {p.rubric && <div className="pillar-rubric">{p.rubric[Math.round(v / 2) * 2] || p.rubric[Object.keys(p.rubric).reduce((a, b) => Math.abs(b - v) < Math.abs(a - v) ? b : a)]}</div>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: '180px' }}>
                      <input type="range" min="1" max="10" value={v} onChange={e => setScore(p.id, e.target.value)} style={{ width: '120px', accentColor: c }} />
                      <span style={{ color: c, fontWeight: 700, fontSize: '1.2rem', minWidth: '1.5rem' }}>{v}</span>
                    </div>
                  </div>
                );
              })}
              <div className="score-total">
                Weighted Codex Score: <span style={{ color: getSignal(calcWeightedScore(form.scores)).color }}>
                  {calcWeightedScore(form.scores).toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {tab === 'mc' && (
            <div>
              <p className="hint-text">
                Assess each Market Context signal as Favourable, Unfavourable, or leave blank if unknown.
                Count favourable signals: 4+ = Strong Entry · 2–3 = Size Conservatively · 0–1 = Watchlist
              </p>
              {MC_SIGNALS.map(sig => {
                const sigData = form.mcSignals[sig.id] || { value: null, notes: '' };
                const dimColor = dimensionColor[sig.dimension];
                return (
                  <div key={sig.id} className="mc-form-row">
                    <div className="mc-form-header">
                      <span className="mc-dim-badge sm" style={{ '--dc': dimColor }}>{sig.dimension}</span>
                      <span className="mc-form-q">{sig.question}</span>
                    </div>
                    <div className="mc-criteria-hint">
                      <span className="mc-hint-green">✓ {sig.favourable}</span>
                      <span className="mc-hint-red">✗ {sig.unfavourable}</span>
                    </div>
                    <div className="mc-form-controls">
                      {['favourable', 'neutral', 'unfavourable'].map(v => (
                        <button
                          key={v}
                          className={`mc-btn ${sigData.value === v ? 'active-' + v : ''}`}
                          onClick={() => setMCSig(sig.id, 'value', sigData.value === v ? null : v)}
                        >
                          {v === 'favourable' ? '✓ Favourable' : v === 'neutral' ? '~ Neutral' : '✗ Unfavourable'}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      className="mc-notes-input"
                      value={sigData.notes}
                      onChange={e => setMCSig(sig.id, 'notes', e.target.value)}
                      placeholder="Notes on this signal…"
                    />
                  </div>
                );
              })}
              <div className="mc-count-summary">
                <span>Favourable signals: </span>
                <strong style={{ color: countFavourableSignals(form.mcSignals) >= 4 ? '#4ade80' : countFavourableSignals(form.mcSignals) >= 2 ? '#facc15' : '#f87171' }}>
                  {countFavourableSignals(form.mcSignals)}/6
                </strong>
                <span> → {countFavourableSignals(form.mcSignals) >= 4 ? 'Strong Entry' : countFavourableSignals(form.mcSignals) >= 2 ? 'Acceptable — size conservatively' : 'Watchlist — timing is wrong'}</span>
              </div>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={() => { if (validate()) onSave({ ...form, id: form.id || (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString()) }); }}>
            {stock ? 'Save Changes' : 'Add Stock'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── ROOT APP ────────────────────────────────────────────────────────────────

export default function App() {
  const [state, setState] = useState(loadState);
  const [view, setView] = useState('dashboard');
  const [selectedId, setSelectedId] = useState(null);
  const [showAddStock, setShowAddStock] = useState(false);
  const [editingStock, setEditingStock] = useState(null);
  const [showMCEditor, setShowMCEditor] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { saveState(state); }, [state]);

  const { stocks, marketContext } = state;

  const saveStock = useCallback((stock) => {
    setState(prev => {
      const exists = prev.stocks.find(s => s.id === stock.id);
      return {
        ...prev,
        stocks: exists
          ? prev.stocks.map(s => s.id === stock.id ? stock : s)
          : [...prev.stocks, stock],
      };
    });
    setShowAddStock(false);
    setEditingStock(null);
  }, []);

  const deleteStock = useCallback((id) => {
    setState(prev => ({ ...prev, stocks: prev.stocks.filter(s => s.id !== id) }));
    setView('watchlist');
    setSelectedId(null);
  }, []);

  const refreshPrices = useCallback(async () => {
    setRefreshing(true);
    const updated = await Promise.all(
      stocks.map(async s => {
        const data = await fetchYahoo(s.ticker);
        if (!data) return s;
        return {
          ...s,
          lastPrice: data.currentPrice,
          priceHistory: data.priceHistory.slice(-252),
          lastUpdated: new Date().toISOString(),
        };
      })
    );
    setState(prev => ({ ...prev, stocks: updated }));
    setRefreshing(false);
  }, [stocks]);

  const selectedStock = stocks.find(s => s.id === selectedId);

  const goDetail = (id) => { setSelectedId(id); setView('detail'); };

  return (
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
          {[
            ['dashboard', 'Dashboard'],
            ['watchlist', 'Watchlist'],
            ['portfolio', 'Portfolio'],
          ].map(([id, label]) => (
            <button
              key={id}
              className={`nav-btn ${view === id || (view === 'detail' && id === 'watchlist') ? 'active' : ''}`}
              onClick={() => setView(id)}
            >
              {label}
            </button>
          ))}
        </nav>
        <div className="hdr-right">
          {refreshing && <span className="refreshing-text">↻ Refreshing prices…</span>}
        </div>
      </header>

      <MCBanner ctx={marketContext} onEdit={() => setShowMCEditor(true)} />

      <main className="app-main">
        {view === 'dashboard' && <Dashboard stocks={stocks} marketContext={marketContext} />}
        {view === 'watchlist' && (
          <Watchlist
            stocks={stocks}
            onSelect={goDetail}
            onAdd={() => setShowAddStock(true)}
            onRefresh={refreshPrices}
            refreshing={refreshing}
          />
        )}
        {view === 'portfolio' && <Portfolio stocks={stocks} />}
        {view === 'detail' && selectedStock && (
          <StockDetail
            stock={selectedStock}
            marketContext={marketContext}
            onEdit={s => { setEditingStock(s); }}
            onDelete={deleteStock}
            onBack={() => setView('watchlist')}
          />
        )}
      </main>

      {(showAddStock || editingStock) && (
        <StockForm
          stock={editingStock}
          onSave={saveStock}
          onClose={() => { setShowAddStock(false); setEditingStock(null); }}
        />
      )}

      {showMCEditor && (
        <MCEditor
          ctx={marketContext}
          onSave={ctx => { setState(p => ({ ...p, marketContext: ctx })); setShowMCEditor(false); }}
          onClose={() => setShowMCEditor(false)}
        />
      )}
    </div>
  );
}
