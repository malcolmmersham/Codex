import React from 'https://esm.sh/react@18.3.1';

const BRAND = {
  name: 'Trust Tairāwhiti',
  kaupapa: 'Tātau Tātau',
  colours: {
    deepPurple: '#1c0f33',
    blue: '#007da4',
    yellow: '#ffd100',
    green: '#3eaf49',
    orange: '#ff9e18',
    pink: '#e60a95',
    red: '#d22630',
  },
};

const DATA = [
  { indicator: 'Tairāwhiti Great Place', y2022: 76.6, y2023: 66.0, y2024: 62.6, y2025: 56.7, change: -19.9 },
  { indicator: 'Diverse Employment', y2022: 34.7, y2023: 25.2, y2024: 25.1, y2025: 23.7, change: -11.1 },
  { indicator: 'Attractive for Youth', y2022: 35.1, y2023: 23.0, y2024: 22.8, y2025: 21.7, change: -13.4 },
  { indicator: 'Thriving City Centre', y2022: 11.2, y2023: 7.7, y2024: 8.2, y2025: 7.9, change: -3.2 },
  { indicator: 'Good for Business', y2022: 27.5, y2023: 21.9, y2024: 17.0, y2025: 17.3, change: -10.3 },
  { indicator: 'Training/Career', y2022: 34.2, y2023: 30.8, y2024: 30.2, y2025: 23.4, change: -10.8 },
  { indicator: 'Digital/Technology', y2022: 32.7, y2023: 24.2, y2024: 26.6, y2025: 25.6, change: -7.1 },
  { indicator: 'Pride in Tairāwhiti', y2022: 41.8, y2023: 31.9, y2024: 29.6, y2025: 30.9, change: -11.0 },
  { indicator: 'Confident Finding Job', y2022: 43.4, y2023: 40.0, y2024: 32.5, y2025: 32.4, change: -11.1 },
];

const YEARS = [2022, 2023, 2024, 2025];
const fmt = (value) => `${value.toFixed(1)}%`;
const fmtPP = (value) => `${value.toFixed(1)}pp`;

const values = DATA.flatMap((d) => [d.y2022, d.y2023, d.y2024, d.y2025]);
const MIN = Math.min(...values);
const MAX = Math.max(...values);
const AVG2025 = DATA.reduce((sum, row) => sum + row.y2025, 0) / DATA.length;
const AVG_CHANGE = DATA.reduce((sum, row) => sum + row.change, 0) / DATA.length;
const strongestDrop = [...DATA].sort((a, b) => a.change - b.change)[0];

function linePoints(vals, width = 220, height = 68) {
  return vals
    .map((v, i) => {
      const x = (i / (vals.length - 1)) * width;
      const y = height - ((v - MIN) / (MAX - MIN || 1)) * height;
      return `${x},${y}`;
    })
    .join(' ');
}

function IndicatorLine({ row }) {
  const vals = [row.y2022, row.y2023, row.y2024, row.y2025];
  return React.createElement(
    'svg',
    { className: 'sparkline', viewBox: '0 0 220 68', role: 'img', 'aria-label': `${row.indicator} trend` },
    React.createElement('polyline', { points: linePoints(vals) }),
    vals.map((v, i) => {
      const x = (i / (vals.length - 1)) * 220;
      const y = 68 - ((v - MIN) / (MAX - MIN || 1)) * 68;
      return React.createElement('circle', { key: `${row.indicator}-${YEARS[i]}`, cx: x, cy: y, r: 3.1 });
    }),
  );
}

function Pillar({ title, subtitle, copy, color }) {
  return React.createElement(
    'article',
    { className: 'pillar', style: { '--pillar-color': color } },
    React.createElement('h3', null, `${title} / ${subtitle}`),
    React.createElement('p', null, copy),
  );
}

export function App() {
  const [sortBy, setSortBy] = React.useState('decline');

  const sorted = React.useMemo(() => {
    const copy = [...DATA];
    if (sortBy === 'decline') copy.sort((a, b) => a.change - b.change);
    if (sortBy === '2025') copy.sort((a, b) => b.y2025 - a.y2025);
    if (sortBy === 'name') copy.sort((a, b) => a.indicator.localeCompare(b.indicator));
    return copy;
  }, [sortBy]);

  return React.createElement(
    'main',
    { className: 'app-shell' },
    React.createElement(
      'section',
      { className: 'hero' },
      React.createElement('p', { className: 'eyebrow' }, `${BRAND.name} • ${BRAND.kaupapa}`),
      React.createElement('h1', null, 'He Tohu Ora / Regional Wellbeing Signals'),
      React.createElement(
        'p',
        { className: 'hero-copy' },
        `Kia ora. We’re seeing a clear slide across every indicator from 2022 to 2025. The biggest drop is ${strongestDrop.indicator} (${fmtPP(strongestDrop.change)}).`
      ),
      React.createElement(
        'p',
        { className: 'hero-copy' },
        `What matters most for your whānau and community? Kōrero mai. We’ll keep listening, sharing, and acting together.`
      ),
      React.createElement(
        'div',
        { className: 'kpi-grid' },
        React.createElement('article', null, React.createElement('span', null, 'Indicators tracked'), React.createElement('strong', null, DATA.length)),
        React.createElement('article', null, React.createElement('span', null, 'Average in 2025'), React.createElement('strong', null, fmt(AVG2025))),
        React.createElement('article', null, React.createElement('span', null, 'Average change'), React.createElement('strong', { className: 'neg' }, fmtPP(AVG_CHANGE))),
      ),
    ),

    React.createElement(
      'section',
      { className: 'pillars' },
      React.createElement(Pillar, {
        title: 'Te Mana',
        subtitle: 'Shared Pride',
        copy: 'People feeling proud of Tairāwhiti has softened. We can rebuild confidence by backing visible local wins.',
        color: BRAND.colours.yellow,
      }),
      React.createElement(Pillar, {
        title: 'Te Ihi',
        subtitle: 'Shared Prosperity',
        copy: 'Business confidence and career pathways are under pressure. Our next step is practical support that people can feel month by month.',
        color: BRAND.colours.blue,
      }),
      React.createElement(Pillar, {
        title: 'Te Wehi',
        subtitle: 'Shared Opportunity',
        copy: 'Young people are telling us opportunity feels weaker. We need clearer pathways into jobs, skills, and future-focused sectors.',
        color: BRAND.colours.green,
      }),
    ),

    React.createElement(
      'section',
      { className: 'toolbar' },
      React.createElement('h2', null, 'Ngā ia / Indicator trends'),
      React.createElement(
        'div',
        { className: 'sort-wrap' },
        React.createElement('label', { htmlFor: 'sortBy' }, 'Sort by'),
        React.createElement(
          'select',
          { id: 'sortBy', value: sortBy, onChange: (e) => setSortBy(e.target.value) },
          React.createElement('option', { value: 'decline' }, 'Largest decline'),
          React.createElement('option', { value: '2025' }, 'Highest 2025 score'),
          React.createElement('option', { value: 'name' }, 'Name A–Z'),
        ),
      ),
    ),

    React.createElement(
      'section',
      { className: 'cards' },
      sorted.map((row) => {
        const pct = (row.y2025 / MAX) * 100;
        return React.createElement(
          'article',
          { key: row.indicator, className: 'card' },
          React.createElement(
            'header',
            { className: 'card-head' },
            React.createElement('h3', null, row.indicator),
            React.createElement('span', { className: 'badge' }, 'Declining'),
          ),
          React.createElement(
            'div',
            { className: 'value-band' },
            React.createElement('strong', null, fmt(row.y2025)),
            React.createElement('small', null, `${fmtPP(row.change)} since 2022`),
          ),
          React.createElement('div', { className: 'bar-bg' }, React.createElement('div', { className: 'bar', style: { width: `${pct}%` } })),
          React.createElement(IndicatorLine, { row }),
          React.createElement(
            'dl',
            { className: 'year-grid' },
            YEARS.map((year) =>
              React.createElement(
                'div',
                { key: `${row.indicator}-${year}` },
                React.createElement('dt', null, year),
                React.createElement('dd', null, fmt(row[`y${year}`])),
              ),
            ),
          ),
        );
      }),
    ),
  );
}
