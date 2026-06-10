// ─────────────────────────────────────────────────────────────────────────────
// The Tairāwhiti Notebook
// A public intelligence system that happens to generate advisory work.
// ─────────────────────────────────────────────────────────────────────────────
import { html, useState, useEffect, useMemo, useCallback, useRef } from './h.js';
import {
  Search,
  ArrowRight,
  ArrowUpRight,
  X,
  Database,
  Cpu,
  TrendingUp,
  Scale,
  Map as MapIcon,
  HeartPulse,
  Mountain,
  CornerDownRight,
} from 'https://esm.sh/lucide-react@0.460.0?deps=react@18.3.1';
import {
  THEMES,
  THOUGHTS,
  FRAMEWORKS,
  OFFERS,
  themeById,
  frameworkById,
  offerById,
  thoughtById,
  counts,
} from './data.js';
import { KnowledgeGraph } from './graph.js';

const ICONS = {
  database: Database,
  cpu: Cpu,
  'trending-up': TrendingUp,
  scale: Scale,
  map: MapIcon,
  'heart-pulse': HeartPulse,
  mountain: Mountain,
};

const CONTACT_EMAIL = 'malcolm@trusttairawhiti.nz';

// ─── Routing ─────────────────────────────────────────────────────────────────

function useHashRoute() {
  const [hash, setHash] = useState(() => window.location.hash || '#/');
  useEffect(() => {
    const onChange = () => {
      setHash(window.location.hash || '#/');
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  return [parts[0] || 'home', parts[1] || null];
}

function go(path) {
  window.location.hash = path;
}

// kind/id from a graph node → route
function routeFor(kind, id) {
  return { thought: `/thought/${id}`, theme: `/theme/${id}`, framework: `/framework/${id}`, offer: `/work/${id}` }[kind];
}

const fmtDate = (iso) =>
  new Date(iso + 'T00:00:00').toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' });

// ─── Small shared pieces ─────────────────────────────────────────────────────

function Link({ to, className, children, onClick }) {
  return html`<a
    href=${'#' + to}
    className=${className}
    onClick=${(e) => {
      e.preventDefault();
      if (onClick) onClick();
      go(to);
    }}
    >${children}</a
  >`;
}

function ThemeIcon({ id, size = 16 }) {
  const t = themeById[id];
  const Cmp = t && ICONS[t.icon];
  return Cmp ? html`<${Cmp} size=${size} strokeWidth=${1.6} />` : null;
}

function TagRow({ themes }) {
  return html`<div className="tag-row">
    ${themes.map(
      (id) =>
        html`<${Link} key=${id} to=${`/theme/${id}`} className="tag"
          ><${ThemeIcon} id=${id} size=${13} /> ${themeById[id].title}<//
        >`
    )}
  </div>`;
}

function ConnectedCount({ frameworks, offers }) {
  const f = frameworks?.length || 0;
  const o = offers?.length || 0;
  if (!f && !o) return null;
  return html`<div className="connected">
    ${f > 0 && html`<span>${f} ${f === 1 ? 'Framework' : 'Frameworks'}</span>`}
    ${f > 0 && o > 0 && html`<span className="dot">·</span>`}
    ${o > 0 && html`<span>${o} ${o === 1 ? 'Advisory Offer' : 'Advisory Offers'}</span>`}
  </div>`;
}

// ─── Thought card + stream ───────────────────────────────────────────────────

function ThoughtCard({ t }) {
  return html`<article className="thought-card">
    <${Link} to=${`/thought/${t.id}`} className="thought-card-link">
      <h3 className="thought-card-title">${t.title}</h3>
      <p className="thought-card-excerpt">${t.excerpt}</p>
    <//>
    <div className="thought-card-meta">
      <span>${fmtDate(t.date)}</span>
      <span className="dot">·</span>
      <span>${t.readingTime} min read</span>
    </div>
    <${TagRow} themes=${t.themes} />
    <${ConnectedCount} frameworks=${t.frameworks} offers=${t.offers} />
  </article>`;
}

// ─── Home ────────────────────────────────────────────────────────────────────

function Home({ onOpenNode }) {
  const stream = useMemo(() => [...THOUGHTS].sort((a, b) => b.date.localeCompare(a.date)), []);
  return html`
    <div>
      <header className="hero">
        <h1 className="hero-title">The Tairāwhiti Notebook</h1>
        <p className="hero-sub">
          Ideas, observations, frameworks, and research on data, investment, AI, governance, and regional development.
        </p>
        <a href="#thoughts" className="hero-cta" onClick=${(e) => {
          e.preventDefault();
          document.getElementById('thoughts')?.scrollIntoView({ behavior: 'smooth' });
        }}>Explore the Notebook <${ArrowRight} size=${16} /></a>
      </header>

      <div className="home-grid" id="thoughts">
        <section className="stream">
          <div className="section-eyebrow">Latest thoughts</div>
          ${stream.map((t) => html`<${ThoughtCard} key=${t.id} t=${t} />`)}
        </section>
        <aside className="graph-col">
          <div className="section-eyebrow">Knowledge graph</div>
          <p className="graph-hint">Every thought connects to themes, frameworks, and ways to work together. Follow a link.</p>
          <${KnowledgeGraph} onOpen=${onOpenNode} />
        </aside>
      </div>
    </div>
  `;
}

// ─── Thought page ────────────────────────────────────────────────────────────

function ThoughtPage({ id }) {
  const t = thoughtById[id];
  if (!t) return html`<${NotFound} />`;
  const fws = t.frameworks.map((x) => frameworkById[x]).filter(Boolean);
  const ofs = t.offers.map((x) => offerById[x]).filter(Boolean);
  return html`<article className="reading">
    <${Crumb} label="Notebook" to="/" />
    <h1 className="reading-title">${t.title}</h1>
    <div className="reading-meta">
      <span>${fmtDate(t.date)}</span><span className="dot">·</span><span>${t.readingTime} min read</span>
    </div>
    <${TagRow} themes=${t.themes} />
    <div className="prose">${t.body.map((p, i) => html`<p key=${i}>${p}</p>`)}</div>
    <${ConnectionsPanel}
      groups=${[
        { label: 'Connected themes', items: t.themes.map((x) => ({ to: `/theme/${x}`, title: themeById[x].title })) },
        { label: 'Connected frameworks', items: fws.map((f) => ({ to: `/framework/${f.id}`, title: f.title })) },
        { label: 'Connected advisory offers', items: ofs.map((o) => ({ to: `/work/${o.id}`, title: o.title })) },
      ]}
    />
  </article>`;
}

// ─── Themes ──────────────────────────────────────────────────────────────────

function ThemesPage() {
  const c = useMemo(counts, []);
  return html`<div className="page">
    <${PageHead}
      eyebrow="Themes"
      title="The ideas this notebook keeps returning to"
      sub="Themes are the threads that run through the thinking. Pull one and follow it across thoughts, frameworks, and advisory work." />
    <div className="card-grid">
      ${THEMES.map(
        (t) => html`<${Link} key=${t.id} to=${`/theme/${t.id}`} className="theme-card">
          <div className="theme-card-icon"><${ThemeIcon} id=${t.id} size=${22} /></div>
          <h3 className="theme-card-title">${t.title}</h3>
          <p className="theme-card-desc">${t.description}</p>
          <div className="theme-card-counts">
            <span>${c[t.id].thoughts} thoughts</span>
            <span>${c[t.id].frameworks} frameworks</span>
            <span>${c[t.id].offers} offers</span>
          </div>
        <//>`
      )}
    </div>
  </div>`;
}

function ThemePage({ id }) {
  const t = themeById[id];
  if (!t) return html`<${NotFound} />`;
  const thoughts = THOUGHTS.filter((x) => x.themes.includes(id)).sort((a, b) => b.date.localeCompare(a.date));
  const fws = FRAMEWORKS.filter((x) => x.themes.includes(id));
  const ofs = OFFERS.filter((x) => x.themes.includes(id));
  const related = t.related.map((x) => themeById[x]).filter(Boolean);
  return html`<div className="page reading">
    <${Crumb} label="Themes" to="/themes" />
    <div className="theme-hero">
      <div className="theme-card-icon big"><${ThemeIcon} id=${id} size=${28} /></div>
      <h1 className="reading-title">${t.title}</h1>
    </div>
    <p className="lede">${t.description}</p>

    ${section('Thoughts', thoughts.map((x) => html`<${ThoughtCard} key=${x.id} t=${x} />`), 'stream')}
    ${fws.length > 0 && section('Frameworks', fws.map((f) => html`<${MiniLink} key=${f.id} to=${`/framework/${f.id}`} title=${f.title} desc=${f.description} />`))}
    ${ofs.length > 0 && section('Advisory offers', ofs.map((o) => html`<${MiniLink} key=${o.id} to=${`/work/${o.id}`} title=${o.title} desc=${o.problem} />`))}
    ${related.length > 0 &&
    html`<div className="related-themes">
      <span className="section-eyebrow">Related themes</span>
      <div className="tag-row">${related.map((r) => html`<${Link} key=${r.id} to=${`/theme/${r.id}`} className="tag"><${ThemeIcon} id=${r.id} size=${13} /> ${r.title}<//>`)}</div>
    </div>`}
  </div>`;
}

// ─── Frameworks ──────────────────────────────────────────────────────────────

function FrameworksPage() {
  return html`<div className="page">
    <${PageHead}
      eyebrow="Frameworks"
      title="Thinking, turned into reusable tools"
      sub="Frameworks are where loose observations harden into something you can apply. Each one names a problem and gives it a structure." />
    <div className="list">
      ${FRAMEWORKS.map(
        (f) => html`<${Link} key=${f.id} to=${`/framework/${f.id}`} className="list-row">
          <div>
            <h3 className="list-row-title">${f.title}</h3>
            <p className="list-row-desc">${f.description}</p>
            <${TagRow} themes=${f.themes} />
          </div>
          <${ArrowUpRight} size=${20} className="list-row-arrow" />
        <//>`
      )}
    </div>
  </div>`;
}

function FrameworkPage({ id }) {
  const f = frameworkById[id];
  if (!f) return html`<${NotFound} />`;
  const ofs = f.offers.map((x) => offerById[x]).filter(Boolean);
  const thoughts = THOUGHTS.filter((x) => x.frameworks.includes(id));
  return html`<div className="page reading">
    <${Crumb} label="Frameworks" to="/frameworks" />
    <h1 className="reading-title">${f.title}</h1>
    <p className="lede">${f.description}</p>
    <${TagRow} themes=${f.themes} />

    <h2 className="sub-head">The problem it addresses</h2>
    <div className="prose"><p>${f.problem}</p></div>

    <h2 className="sub-head">Overview</h2>
    <div className="prose"><p>${f.overview}</p></div>

    <h2 className="sub-head">The framework</h2>
    <ol className="diagram">
      ${f.stages.map(
        (s, i) => html`<li key=${i} className="diagram-step">
          <span className="diagram-num">${i + 1}</span>
          <div><strong>${s.name}</strong><span>${s.detail}</span></div>
        </li>`
      )}
    </ol>

    <${ConnectionsPanel}
      groups=${[
        { label: 'Related thoughts', items: thoughts.map((x) => ({ to: `/thought/${x.id}`, title: x.title })) },
        { label: 'Related offers', items: ofs.map((o) => ({ to: `/work/${o.id}`, title: o.title })) },
      ]} />
  </div>`;
}

// ─── Work together ───────────────────────────────────────────────────────────

function WorkPage() {
  return html`<div className="page">
    <${PageHead}
      eyebrow="Work together"
      title="Start with a problem, not a service"
      sub="These are not packages. They are starting points for solving a specific kind of problem, shaped around what your organisation actually needs." />
    <div className="offers">
      ${OFFERS.map(
        (o) => html`<${Link} key=${o.id} to=${`/work/${o.id}`} className="offer-card">
          <div className="offer-problem">“${o.problem}”</div>
          <h3 className="offer-title">${o.title}</h3>
          <div className="offer-foot"><span>${o.duration}</span><${ArrowRight} size=${16} /></div>
        <//>`
      )}
    </div>
    <${ContactStrip} />
  </div>`;
}

function OfferPage({ id }) {
  const o = offerById[id];
  if (!o) return html`<${NotFound} />`;
  const thoughts = THOUGHTS.filter((x) => x.offers.includes(id));
  return html`<div className="page reading">
    <${Crumb} label="Work together" to="/work" />
    <div className="offer-problem big">“${o.problem}”</div>
    <h1 className="reading-title">${o.title}</h1>
    <${TagRow} themes=${o.themes} />

    <h2 className="sub-head">Approach</h2>
    <div className="prose"><p>${o.approach}</p></div>

    <div className="offer-grid">
      <div>
        <h2 className="sub-head">Deliverables</h2>
        <ul className="ticks">${o.deliverables.map((d, i) => html`<li key=${i}>${d}</li>`)}</ul>
      </div>
      <div>
        <h2 className="sub-head">Typical duration</h2>
        <p className="duration">${o.duration}</p>
      </div>
    </div>

    ${thoughts.length > 0 &&
    html`<${ConnectionsPanel}
      groups=${[{ label: 'Thinking behind this', items: thoughts.map((x) => ({ to: `/thought/${x.id}`, title: x.title })) }]} />`}

    <${ContactStrip} subject=${o.title} />
  </div>`;
}

// ─── About ───────────────────────────────────────────────────────────────────

function AboutPage() {
  return html`<div className="page reading narrow">
    <${PageHead} eyebrow="About" title="How I think about this work" />
    <h2 className="sub-head">What I do</h2>
    <div className="prose">
      <p>I help organisations make better decisions through data, investment thinking, AI, governance, and regional intelligence. The work is less about producing reports and more about improving the quality of the decisions an organisation is able to make.</p>
    </div>
    <h2 className="sub-head">How I think</h2>
    <div className="prose">
      <p>From evidence, slowly, and in public. I am drawn to the gap between what gets measured and what matters, and to bringing investment discipline — asymmetry, margin of safety, the willingness to stop — into places it does not usually reach.</p>
      <p>This notebook is the working out. The thoughts are written in public, connected to the frameworks they belong to, and to the advisory work they sometimes become.</p>
    </div>
    <h2 className="sub-head">Areas of interest</h2>
    <${TagRow} themes=${THEMES.map((t) => t.id)} />
    <h2 className="sub-head">Current themes being explored</h2>
    <div className="prose">
      <p>AI as regional infrastructure, the difference between activity and value in impact measurement, and what resilience really costs before the event rather than after.</p>
    </div>
    <${ContactStrip} />
  </div>`;
}

// ─── Reusable layout bits ────────────────────────────────────────────────────

function PageHead({ eyebrow, title, sub }) {
  return html`<header className="page-head">
    <div className="section-eyebrow">${eyebrow}</div>
    <h1 className="page-title">${title}</h1>
    ${sub && html`<p className="page-sub">${sub}</p>`}
  </header>`;
}

function Crumb({ label, to }) {
  return html`<${Link} to=${to} className="crumb"><${CornerDownRight} size=${14} /> ${label}<//>`;
}

function MiniLink({ to, title, desc }) {
  return html`<${Link} to=${to} className="mini-link">
    <strong>${title}</strong>${desc && html`<span>${desc}</span>`}<${ArrowUpRight} size=${16} className="mini-link-arrow" />
  <//>`;
}

function section(title, children, variant) {
  return html`<section className="theme-section">
    <span className="section-eyebrow">${title}</span>
    <div className=${variant === 'stream' ? 'stream tight' : 'mini-list'}>${children}</div>
  </section>`;
}

function ConnectionsPanel({ groups }) {
  const active = groups.filter((g) => g.items.length > 0);
  if (active.length === 0) return null;
  return html`<div className="connections">
    <div className="connections-rule"></div>
    ${active.map(
      (g) => html`<div key=${g.label} className="connections-group">
        <span className="connections-label">${g.label}</span>
        <div className="connections-items">
          ${g.items.map(
            (it) => html`<${Link} key=${it.to} to=${it.to} className="conn-chip">${it.title} <${ArrowRight} size=${13} /><//>`
          )}
        </div>
      </div>`
    )}
  </div>`;
}

function ContactStrip({ subject }) {
  const href = `mailto:${CONTACT_EMAIL}${subject ? `?subject=${encodeURIComponent(subject)}` : ''}`;
  return html`<div className="contact-strip">
    <div>
      <div className="section-eyebrow">Work together</div>
      <p>${subject ? `Interested in ${subject}?` : 'Have a decision worth thinking through?'} Start a conversation.</p>
    </div>
    <a className="contact-btn" href=${href}>Contact Malcolm <${ArrowRight} size=${16} /></a>
  </div>`;
}

function NotFound() {
  return html`<div className="page reading">
    <h1 className="reading-title">Not found</h1>
    <p className="lede">That idea isn't in the notebook — yet.</p>
    <${Link} to="/" className="conn-chip">Back to the notebook <${ArrowRight} size=${13} /><//>
  </div>`;
}

// ─── Search ──────────────────────────────────────────────────────────────────

function buildIndex() {
  const idx = [];
  for (const t of THOUGHTS) idx.push({ type: 'Thought', title: t.title, to: `/thought/${t.id}`, text: t.excerpt + ' ' + t.body.join(' ') });
  for (const t of THEMES) idx.push({ type: 'Theme', title: t.title, to: `/theme/${t.id}`, text: t.description });
  for (const f of FRAMEWORKS) idx.push({ type: 'Framework', title: f.title, to: `/framework/${f.id}`, text: f.description + ' ' + f.problem + ' ' + f.overview });
  for (const o of OFFERS) idx.push({ type: 'Offer', title: o.title, to: `/work/${o.id}`, text: o.problem + ' ' + o.approach });
  return idx;
}

function SearchOverlay({ open, onClose }) {
  const [q, setQ] = useState('');
  const index = useMemo(buildIndex, []);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setQ('');
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return [];
    const terms = query.split(/\s+/);
    return index
      .map((item) => {
        const hay = (item.title + ' ' + item.text).toLowerCase();
        let score = 0;
        for (const term of terms) {
          if (item.title.toLowerCase().includes(term)) score += 3;
          else if (hay.includes(term)) score += 1;
          else return null;
        }
        return { item, score };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((r) => r.item);
  }, [q, index]);

  if (!open) return null;
  const openResult = (to) => {
    onClose();
    go(to);
  };

  return html`<div className="search-overlay" onClick=${onClose}>
    <div className="search-panel" onClick=${(e) => e.stopPropagation()}>
      <div className="search-input-row">
        <${Search} size=${18} />
        <input
          ref=${inputRef}
          className="search-input"
          placeholder="Search thoughts, themes, frameworks, offers…"
          value=${q}
          onInput=${(e) => setQ(e.target.value)}
          onKeyDown=${(e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'Enter' && results[0]) openResult(results[0].to);
          }}
        />
        <button className="search-close" onClick=${onClose}><${X} size=${16} /></button>
      </div>
      <div className="search-results">
        ${q.trim() === ''
          ? html`<div className="search-empty">Start typing to explore the notebook.</div>`
          : results.length === 0
          ? html`<div className="search-empty">No matches for “${q}”.</div>`
          : results.map(
              (r) => html`<button key=${r.to} className="search-result" onClick=${() => openResult(r.to)}>
                <span className=${`search-type type-${r.type.toLowerCase()}`}>${r.type}</span>
                <span className="search-result-title">${r.title}</span>
                <${ArrowRight} size=${15} />
              </button>`
            )}
      </div>
    </div>
  </div>`;
}

// ─── Shell ───────────────────────────────────────────────────────────────────

const NAV = [
  { label: 'Notebook', to: '/' },
  { label: 'Themes', to: '/themes' },
  { label: 'Frameworks', to: '/frameworks' },
  { label: 'Work Together', to: '/work' },
  { label: 'About', to: '/about' },
];

function Nav({ section, onSearch }) {
  return html`<nav className="nav">
    <${Link} to="/" className="brand">The Tairāwhiti Notebook</${Link}>
    <div className="nav-links">
      ${NAV.map(
        (n) => html`<${Link}
          key=${n.to}
          to=${n.to}
          className=${'nav-link' + (isActive(section, n.to) ? ' active' : '')}
          >${n.label}<//
        >`
      )}
      <button className="nav-search" onClick=${onSearch} aria-label="Search"><${Search} size=${17} /></button>
    </div>
  </nav>`;
}

function isActive(section, to) {
  if (to === '/') return section === 'home' || section === 'thought';
  const root = to.replace('/', '');
  return section === root || section === root.replace(/s$/, '');
}

function Footer() {
  return html`<footer className="footer">
    <div className="footer-inner">
      <div>
        <div className="brand">The Tairāwhiti Notebook</div>
        <p className="footer-tag">A public intelligence system that happens to generate advisory work.</p>
      </div>
      <div className="footer-links">
        ${NAV.map((n) => html`<${Link} key=${n.to} to=${n.to} className="footer-link">${n.label}<//>`)}
        <a className="footer-link" href=${`mailto:${CONTACT_EMAIL}`}>Contact</a>
      </div>
    </div>
    <div className="footer-meta">Tairāwhiti · Aotearoa New Zealand</div>
  </footer>`;
}

export default function App() {
  const [section, id] = useHashRoute();
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((v) => !v);
      } else if (e.key === '/' && !/input|textarea/i.test(document.activeElement?.tagName)) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const onOpenNode = useCallback((kind, nodeId) => go(routeFor(kind, nodeId)), []);

  let page;
  switch (section) {
    case 'home': page = html`<${Home} onOpenNode=${onOpenNode} />`; break;
    case 'thought': page = html`<${ThoughtPage} id=${id} />`; break;
    case 'themes': page = html`<${ThemesPage} />`; break;
    case 'theme': page = html`<${ThemePage} id=${id} />`; break;
    case 'frameworks': page = html`<${FrameworksPage} />`; break;
    case 'framework': page = html`<${FrameworkPage} id=${id} />`; break;
    case 'work': page = id ? html`<${OfferPage} id=${id} />` : html`<${WorkPage} />`; break;
    case 'about': page = html`<${AboutPage} />`; break;
    default: page = html`<${NotFound} />`;
  }

  return html`<div className="app">
    <${Nav} section=${section} onSearch=${() => setSearchOpen(true)} />
    <main className="main">${page}</main>
    <${Footer} />
    <${SearchOverlay} open=${searchOpen} onClose=${() => setSearchOpen(false)} />
  </div>`;
}
