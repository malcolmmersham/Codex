// ─────────────────────────────────────────────────────────────────────────────
// The Tairāwhiti Notebook — content graph
//
// Every entity is a node. Relationships are expressed by id references so the
// knowledge graph and the cross-links between pages stay in sync from a single
// source of truth. In the full build this is backed by Sanity; here it is a
// local seed dataset with the same shape.
// ─────────────────────────────────────────────────────────────────────────────

export const THEMES = [
  {
    id: 'data',
    title: 'Data',
    icon: 'database',
    description:
      'How organisations collect, govern, and actually use data to make decisions — and why most dashboards quietly stop being used.',
    related: ['governance', 'ai'],
  },
  {
    id: 'ai',
    title: 'AI',
    icon: 'cpu',
    description:
      'Artificial intelligence as infrastructure rather than novelty. What it changes about decisions, work, and the cost of thinking.',
    related: ['data', 'governance'],
  },
  {
    id: 'investments',
    title: 'Investments',
    icon: 'trending-up',
    description:
      'Investment thinking applied beyond markets — to programmes, regions, and public capital. Asymmetry, patience, and margin of safety.',
    related: ['governance', 'regional'],
  },
  {
    id: 'governance',
    title: 'Governance',
    icon: 'scale',
    description:
      'Decision rights, accountability, and the quiet machinery that determines whether good intentions survive contact with reality.',
    related: ['data', 'investments'],
  },
  {
    id: 'regional',
    title: 'Regional Development',
    icon: 'map',
    description:
      'Building durable capability in places the centre tends to overlook. Intelligence, resilience, and self-determination at the regional scale.',
    related: ['investments', 'wellbeing', 'tairawhiti'],
  },
  {
    id: 'wellbeing',
    title: 'Wellbeing',
    icon: 'heart-pulse',
    description:
      'Measuring what matters to people and communities, not just what is convenient to count. Outcomes over activity.',
    related: ['regional', 'governance'],
  },
  {
    id: 'tairawhiti',
    title: 'Tairāwhiti',
    icon: 'mountain',
    description:
      'Thinking rooted in a specific place on the East Coast of Aotearoa. What regional intelligence looks like when it is built from here, for here.',
    related: ['regional', 'wellbeing'],
  },
];

export const OFFERS = [
  {
    id: 'data-strategy-review',
    title: 'Data Strategy Review',
    problem: 'We need better decisions from our data.',
    approach:
      'A structured review of how data flows through your organisation — what is collected, who uses it, and where decisions are actually made. We map the gap between the data you hold and the decisions you need, then sequence the smallest changes that move the needle.',
    deliverables: [
      'Current-state data and decision map',
      'Prioritised set of decision gaps',
      'A pragmatic 6–12 month roadmap',
      'A short readout for the board or leadership team',
    ],
    duration: '3–5 weeks',
    themes: ['data', 'governance'],
  },
  {
    id: 'ai-readiness-assessment',
    title: 'AI Readiness Assessment',
    problem: 'We need an AI roadmap.',
    approach:
      'A grounded assessment of where AI can genuinely help — and where it is a distraction. We look at your data foundations, governance, capability, and the specific decisions or workflows where AI changes the economics. No hype, no pilots for the sake of pilots.',
    deliverables: [
      'AI readiness scorecard across five dimensions',
      'A shortlist of high-value, low-regret use cases',
      'Governance and risk guardrails',
      'A staged adoption roadmap',
    ],
    duration: '4–6 weeks',
    themes: ['ai', 'data', 'governance'],
  },
  {
    id: 'governance-review',
    title: 'Governance & Decision Framework Review',
    problem: 'We need better governance.',
    approach:
      'We examine how decisions are made, not just how they are minuted. Where do decision rights sit? What gets escalated, and what quietly never does? We design a lightweight decision framework that gives the board clarity without drowning management in process.',
    deliverables: [
      'Decision-rights and escalation map',
      'A right-sized governance framework',
      'Board reporting redesign',
      'Facilitated working session',
    ],
    duration: '4–8 weeks',
    themes: ['governance', 'investments'],
  },
  {
    id: 'impact-reporting',
    title: 'Impact Reporting & Outcomes Design',
    problem: 'We need better impact measurement.',
    approach:
      'Most impact reports measure activity instead of value. We rebuild your measurement around the outcomes that actually matter — what changed for people — and design reporting that funders trust and that your team can sustain.',
    deliverables: [
      'Outcomes and value model',
      'A small set of meaningful measures',
      'Reporting template and cadence',
      'Funder-ready narrative structure',
    ],
    duration: '4–6 weeks',
    themes: ['wellbeing', 'governance', 'data'],
  },
];

export const FRAMEWORKS = [
  {
    id: 'data-maturity-model',
    title: 'Regional Data Maturity Model',
    description:
      'Five stages describing how a region or organisation moves from collecting data to making confident decisions with it.',
    problem:
      'Regions invest heavily in collecting data but rarely in the capability to use it. Maturity is uneven, invisible, and hard to talk about. Without a shared language, every conversation about data starts from zero.',
    overview:
      'The model maps five stages — Ad hoc, Aware, Capable, Embedded, and Generative. Each stage names the behaviours, decisions, and infrastructure that distinguish it from the last. The point is not to reach the top; it is to know where you are and to take the next honest step.',
    stages: [
      { name: 'Ad hoc', detail: 'Data exists but is scattered, manual, and untrusted.' },
      { name: 'Aware', detail: 'Leaders know what they hold and where the gaps are.' },
      { name: 'Capable', detail: 'Reliable data flows into recurring decisions.' },
      { name: 'Embedded', detail: 'Decisions assume good data; governance is routine.' },
      { name: 'Generative', detail: 'Data creates new options — including AI-assisted ones.' },
    ],
    themes: ['data', 'regional', 'governance'],
    offers: ['data-strategy-review'],
  },
  {
    id: 'ai-readiness-framework',
    title: 'AI Readiness Framework',
    description:
      'Five dimensions that determine whether an organisation can actually get value from AI — before buying any tools.',
    problem:
      'AI readiness is usually treated as a technology question. It is mostly not. The constraint is rarely the model; it is data, decision rights, capability, and trust.',
    overview:
      'Readiness is assessed across Data Foundations, Decision Fit, Capability, Governance, and Culture. A high score in one dimension cannot rescue a low score in another — readiness is the weakest link. The framework turns an anxious, open-ended question into a tractable diagnosis.',
    stages: [
      { name: 'Data Foundations', detail: 'Is the underlying data accessible, clean, and governed?' },
      { name: 'Decision Fit', detail: 'Are there decisions where AI changes the economics?' },
      { name: 'Capability', detail: 'Can people use, question, and supervise the output?' },
      { name: 'Governance', detail: 'Are risk, privacy, and accountability handled?' },
      { name: 'Culture', detail: 'Will the organisation trust and adopt it?' },
    ],
    themes: ['ai', 'data', 'governance'],
    offers: ['ai-readiness-assessment'],
  },
  {
    id: 'impact-value-framework',
    title: 'Impact Value Framework',
    description:
      'A way to move impact measurement from counting activity to evidencing value — what actually changed, and for whom.',
    problem:
      'Impact reports are full of activity: sessions delivered, people reached, dollars spent. Activity is easy to count and easy to game. Value — the change in someone\'s life or a system\'s behaviour — is harder, and it is the only thing that matters.',
    overview:
      'The framework separates four layers: Inputs, Activities, Outcomes, and Value. Most reporting stops at Activities. This pushes the conversation up the stack to Outcomes (what changed) and Value (why it was worth it), with a small set of measures that a team can actually sustain.',
    stages: [
      { name: 'Inputs', detail: 'What was invested — money, time, capability.' },
      { name: 'Activities', detail: 'What was done — the easy-to-count layer.' },
      { name: 'Outcomes', detail: 'What changed for people as a result.' },
      { name: 'Value', detail: 'Why that change was worth the investment.' },
    ],
    themes: ['wellbeing', 'governance', 'data'],
    offers: ['impact-reporting'],
  },
  {
    id: 'investment-governance-framework',
    title: 'Investment Governance Framework',
    description:
      'Bringing investment discipline — asymmetry, decision gates, margin of safety — to how organisations and regions allocate capital.',
    problem:
      'Public and programme spending is often governed by process rather than by judgement about return. Decisions accrete; nobody owns the portfolio view. Capital flows to the loudest case rather than the best one.',
    overview:
      'The framework applies four investment ideas to organisational capital: a clear thesis per initiative, explicit decision gates, margin of safety in assumptions, and a portfolio view that allows things to be stopped. It gives boards a disciplined way to say no — and to say yes with conviction.',
    stages: [
      { name: 'Thesis', detail: 'Why this, why now, and what has to be true.' },
      { name: 'Gates', detail: 'Pre-agreed points to continue, reshape, or stop.' },
      { name: 'Margin of Safety', detail: 'Conservative assumptions and downside cover.' },
      { name: 'Portfolio', detail: 'The whole allocation seen and managed together.' },
    ],
    themes: ['investments', 'governance', 'regional'],
    offers: ['governance-review'],
  },
];

export const THOUGHTS = [
  {
    id: 'dashboards-fail',
    title: 'Why dashboards fail after year one',
    date: '2026-05-28',
    readingTime: 2,
    featured: true,
    excerpt:
      'A dashboard is a promise about decisions. Most break that promise quietly, and you only notice when nobody opens them anymore.',
    body: [
      'A dashboard is built in a moment of optimism. Someone has wrestled the data into one place, the charts are clean, and for a few weeks people actually look at it. Then, slowly, they stop.',
      'The failure is rarely technical. The dashboard keeps working. What fails is the link between the numbers on screen and the decisions someone has to make on Monday morning. If a metric does not change what anyone does, watching it is just a habit waiting to be dropped.',
      'The dashboards that survive year one share one trait: each panel answers a question that a specific person has to act on. Not "how are we doing" but "do I need to intervene here, this week." Everything else is decoration, and decoration is the first thing to go stale.',
      'So before adding another chart, ask the harder question: whose decision does this serve, and what would they do differently if the line moved? If you cannot answer, you are not building a dashboard. You are building something that will quietly fail after year one.',
    ],
    themes: ['data', 'governance'],
    frameworks: ['data-maturity-model'],
    offers: ['data-strategy-review'],
  },
  {
    id: 'impact-activity-value',
    title: 'Most impact reports measure activity instead of value',
    date: '2026-05-20',
    readingTime: 2,
    featured: true,
    excerpt:
      'Sessions delivered. People reached. Dollars spent. All easy to count, all beside the point. Value is what changed, and it is harder.',
    body: [
      'Open almost any impact report and you will find the same shape: a wall of activity. Number of workshops run. Number of people through the door. Number of resources distributed. It reads as productivity, and it is comforting, and it tells you almost nothing.',
      'Activity is easy to count because we control it. Value is hard because it lives in someone else — a changed decision, a recovered relationship, a household that is steadier than it was. We measure activity and quietly hope it stands in for value.',
      'It rarely does. A programme can be enormously busy and change very little, and a quiet intervention can change a great deal. If your measurement cannot tell those two apart, it is not measuring impact. It is measuring effort.',
      'The fix is not more data. It is a small number of measures aimed one level up — at what changed for people — and the discipline to report those even when they are less flattering than the activity count.',
    ],
    themes: ['wellbeing', 'governance', 'data'],
    frameworks: ['impact-value-framework'],
    offers: ['impact-reporting'],
  },
  {
    id: 'ai-infrastructure',
    title: 'AI is becoming infrastructure',
    date: '2026-05-12',
    readingTime: 3,
    featured: true,
    excerpt:
      'The interesting question is no longer what AI can do. It is what becomes cheap when intelligence itself becomes cheap.',
    body: [
      'We are past the demo phase. The useful frame now is not "look what it can do" but "what was previously expensive and is about to become cheap." When a capability becomes infrastructure — like electricity, like bandwidth — the story stops being the technology and starts being everything it quietly enables.',
      'When the cost of reading, summarising, drafting, and translating falls toward zero, organisations that were rationing those activities can stop rationing them. That is the real shift. Not robots; abundance of a thing that used to be scarce.',
      'For a small region this is unusually good news. Capability that once required scale — a research function, a translation service, a first-draft analyst — can now be assembled by a handful of people who know what good looks like. The constraint moves from cost to judgement.',
      'Which is also the catch. Infrastructure rewards those who know what to build on it. The organisations that benefit will be the ones with clear decisions to make and the data discipline to feed them. The technology is becoming a commodity. Knowing what to ask of it is not.',
    ],
    themes: ['ai', 'data', 'regional'],
    frameworks: ['ai-readiness-framework'],
    offers: ['ai-readiness-assessment'],
  },
  {
    id: 'regional-resilience',
    title: 'Regional resilience is underestimated',
    date: '2026-05-04',
    readingTime: 2,
    featured: false,
    excerpt:
      'Resilience is treated as the absence of disaster. It is better understood as the presence of options.',
    body: [
      'After a flood or a closure, the conversation turns to recovery — getting back to how things were. But the regions that come through best are rarely the ones that restored the status quo fastest. They are the ones that already held options: alternative routes, local capability, relationships that did not depend on the centre.',
      'Resilience, in other words, is not toughness. It is optionality. It is the quiet, unglamorous investment in capacity you hope never to need, made in the years when nothing is going wrong and nobody is paying attention.',
      'This is hard to fund because it looks like inefficiency. Spare capacity, local duplication, relationships maintained "just in case" — all of it is the first thing a tidy spreadsheet cuts. And then the event arrives, and the region with no slack discovers what the slack was for.',
      'Tairāwhiti knows this in its body. The work is to name it, value it, and protect it before the next event — not after.',
    ],
    themes: ['regional', 'tairawhiti', 'investments'],
    frameworks: ['investment-governance-framework'],
    offers: [],
  },
  {
    id: 'saying-no',
    title: 'Good governance is mostly the ability to say no',
    date: '2026-04-22',
    readingTime: 2,
    featured: false,
    excerpt:
      'Boards are good at approving things. The harder, more valuable skill is stopping things that should never have started.',
    body: [
      'Most governance energy goes into approval — the paper, the recommendation, the vote. But approval is the easy half. Every initiative arrives with a champion, a narrative, and momentum. Saying yes flows downhill.',
      'The scarce skill is the structured no: stopping an initiative that is underperforming, or declining a plausible idea because it does not clear the bar. Without explicit gates, nothing is ever stopped. It just quietly continues, absorbing capital and attention that the best ideas needed.',
      'Investors live by this. A portfolio that cannot exit is not a portfolio; it is a collection. The same is true of an organisation\'s initiatives. Decision gates — pre-agreed points to continue, reshape, or stop — are how a board earns the right to say yes with conviction.',
    ],
    themes: ['governance', 'investments'],
    frameworks: ['investment-governance-framework'],
    offers: ['governance-review'],
  },
  {
    id: 'data-without-decisions',
    title: 'Data without decisions is just storage',
    date: '2026-04-10',
    readingTime: 1,
    featured: false,
    excerpt:
      'The maturity of a data function is not measured by what it collects. It is measured by what it changes.',
    body: [
      'It is possible to be data-rich and decision-poor. Warehouses full, reports flowing, and yet the same calls made the same way they always were. Collection became the goal, and the goal quietly detached from any decision.',
      'A simple test cuts through it: name a decision that was made differently last quarter because of something in the data. If the answer comes easily, the function is working. If it is a struggle, you do not have a data capability. You have storage with good intentions.',
    ],
    themes: ['data', 'governance'],
    frameworks: ['data-maturity-model'],
    offers: ['data-strategy-review'],
  },
  {
    id: 'margin-of-safety-public',
    title: 'Margin of safety belongs in public investment too',
    date: '2026-03-30',
    readingTime: 2,
    featured: false,
    excerpt:
      'Private investors assume their forecasts are wrong and build in room. Public business cases too often assume they are right.',
    body: [
      'A disciplined investor never trusts their own forecast. They build a margin of safety — a gap between what they pay and what they think a thing is worth — precisely because the future will surprise them. The margin is humility, made operational.',
      'Public business cases rarely carry the same humility. Benefits are projected confidently, costs optimistically, and the downside case is thin or absent. When reality diverges, as it always does, there is no buffer to absorb it.',
      'Bringing margin of safety into regional and public investment is not about being timid. It is about being honest that assumptions are assumptions, and sizing commitments so that being wrong is survivable. The best regional bets will be the ones that still make sense when the optimistic numbers do not arrive.',
    ],
    themes: ['investments', 'regional', 'governance'],
    frameworks: ['investment-governance-framework'],
    offers: [],
  },
  {
    id: 'wellbeing-what-we-count',
    title: 'We measure what is easy, then call it what matters',
    date: '2026-03-18',
    readingTime: 2,
    featured: false,
    excerpt:
      'The gap between what a community values and what a system counts is where good intentions quietly leak away.',
    body: [
      'Every measurement system encodes a theory of what matters. Too often the theory is unspoken and the choice is made by convenience: we count what the existing system already produces, then narrate it as if it were the point.',
      'For wellbeing this is especially costly. The things people value most — belonging, security, dignity, connection — are the hardest to put in a cell of a spreadsheet. So they fall out of the report, and over time out of the strategy, until the system optimises for the proxy and forgets the thing.',
      'The discipline is to start from what the community actually values and only then ask how to evidence it — accepting rougher measures of important things over precise measures of trivial ones. Better a blurry photograph of the right subject than a sharp one of the wrong.',
    ],
    themes: ['wellbeing', 'tairawhiti', 'data'],
    frameworks: ['impact-value-framework'],
    offers: ['impact-reporting'],
  },
];

// ─── Lookups & graph derivation ──────────────────────────────────────────────

export const byId = (list) => Object.fromEntries(list.map((x) => [x.id, x]));
export const themeById = byId(THEMES);
export const frameworkById = byId(FRAMEWORKS);
export const offerById = byId(OFFERS);
export const thoughtById = byId(THOUGHTS);

export function counts() {
  const c = {};
  for (const t of THEMES) c[t.id] = { thoughts: 0, frameworks: 0, offers: 0 };
  for (const th of THOUGHTS) for (const id of th.themes) if (c[id]) c[id].thoughts++;
  for (const f of FRAMEWORKS) for (const id of f.themes) if (c[id]) c[id].frameworks++;
  for (const o of OFFERS) for (const id of o.themes) if (c[id]) c[id].offers++;
  return c;
}

// Build the node/edge sets for the knowledge graph from the relationships
// declared above. Each entity becomes a node; references become edges.
export function buildGraph() {
  const nodes = [];
  const edges = [];
  const seen = new Set();
  const addEdge = (a, b, kind) => {
    const key = `${a}->${b}`;
    if (seen.has(key)) return;
    seen.add(key);
    edges.push({ id: key, source: a, target: b, kind });
  };

  for (const t of THOUGHTS) nodes.push({ id: `thought:${t.id}`, kind: 'thought', label: t.title, ref: t });
  for (const t of THEMES) nodes.push({ id: `theme:${t.id}`, kind: 'theme', label: t.title, ref: t });
  for (const f of FRAMEWORKS) nodes.push({ id: `framework:${f.id}`, kind: 'framework', label: f.title, ref: f });
  for (const o of OFFERS) nodes.push({ id: `offer:${o.id}`, kind: 'offer', label: o.title, ref: o });

  for (const t of THOUGHTS) {
    for (const id of t.themes) addEdge(`thought:${t.id}`, `theme:${id}`, 'thought-theme');
    for (const id of t.frameworks) addEdge(`thought:${t.id}`, `framework:${id}`, 'thought-framework');
  }
  for (const f of FRAMEWORKS) {
    for (const id of f.themes) addEdge(`theme:${id}`, `framework:${f.id}`, 'theme-framework');
    for (const id of f.offers) addEdge(`framework:${f.id}`, `offer:${id}`, 'framework-offer');
  }
  for (const t of THEMES) {
    for (const id of t.related) {
      // de-dupe symmetric theme links by ordering ids
      const [a, b] = [t.id, id].sort();
      addEdge(`theme:${a}`, `theme:${b}`, 'theme-theme');
    }
  }
  return { nodes, edges };
}
