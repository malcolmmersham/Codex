const dataset = [
  {
    indicator: 'Tairāwhiti Great Place',
    values: [76.6, 66.0, 62.6, 56.7],
    change: -19.9,
  },
  {
    indicator: 'Diverse Employment',
    values: [34.7, 25.2, 25.1, 23.7],
    change: -11.1,
  },
  {
    indicator: 'Attractive for Youth',
    values: [35.1, 23.0, 22.8, 21.7],
    change: -13.4,
  },
  {
    indicator: 'Thriving City Centre',
    values: [11.2, 7.7, 8.2, 7.9],
    change: -3.2,
  },
  {
    indicator: 'Good for Business',
    values: [27.5, 21.9, 17.0, 17.3],
    change: -10.3,
  },
  {
    indicator: 'Training/Career',
    values: [34.2, 30.8, 30.2, 23.4],
    change: -10.8,
  },
  {
    indicator: 'Digital/Technology',
    values: [32.7, 24.2, 26.6, 25.6],
    change: -7.1,
  },
  {
    indicator: 'Pride in Tairāwhiti',
    values: [41.8, 31.9, 29.6, 30.9],
    change: -11.0,
  },
  {
    indicator: 'Confident Finding Job',
    values: [43.4, 40.0, 32.5, 32.4],
    change: -11.1,
  },
] as const;

const years = ['2022', '2023', '2024', '2025'];
const lowest = Math.min(...dataset.flatMap((item) => item.values));
const highest = Math.max(...dataset.flatMap((item) => item.values));
const avg2025 = dataset.reduce((acc, item) => acc + item.values[3], 0) / dataset.length;
const avgChange = dataset.reduce((acc, item) => acc + item.change, 0) / dataset.length;

function sparklinePoints(values: readonly number[]): string {
  const width = 180;
  const height = 56;

  return values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - ((value - lowest) / (highest - lowest)) * height;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
}

function App() {
  return (
    <main className="dashboard">
      <section className="hero">
        <p className="eyebrow">Tairāwhiti perception tracker</p>
        <h1>Momentum is slipping across every key indicator</h1>
        <p>
          A high-impact visual snapshot of community sentiment from 2022–2025. Each signal trends
          downward, with youth appeal, jobs confidence, and the city&apos;s overall attractiveness
          experiencing the sharpest drops.
        </p>
        <div className="stats-grid">
          <article>
            <span>Indicators tracked</span>
            <strong>{dataset.length}</strong>
          </article>
          <article>
            <span>Average score (2025)</span>
            <strong>{avg2025.toFixed(1)}%</strong>
          </article>
          <article>
            <span>Average net change</span>
            <strong>{avgChange.toFixed(1)}pp</strong>
          </article>
        </div>
      </section>

      <section className="card-grid" aria-label="Indicator trend cards">
        {dataset.map((entry) => {
          const latest = entry.values[entry.values.length - 1];
          const relative = (latest / highest) * 100;

          return (
            <article className="trend-card" key={entry.indicator}>
              <header>
                <h2>{entry.indicator}</h2>
                <span className="chip chip-danger">↓ Declining</span>
              </header>

              <div className="value-row">
                <strong>{latest.toFixed(1)}%</strong>
                <small>{entry.change.toFixed(1)}pp since 2022</small>
              </div>

              <div className="progress-wrap" role="img" aria-label={`2025 level ${latest.toFixed(1)}%`}>
                <div className="progress" style={{ width: `${relative}%` }} />
              </div>

              <svg viewBox="0 0 180 56" className="sparkline" aria-hidden="true">
                <polyline points={sparklinePoints(entry.values)} />
                {entry.values.map((point, i) => {
                  const x = (i / (entry.values.length - 1)) * 180;
                  const y = 56 - ((point - lowest) / (highest - lowest)) * 56;
                  return <circle key={`${entry.indicator}-${years[i]}`} cx={x} cy={y} r="2.8" />;
                })}
              </svg>

              <dl>
                {entry.values.map((val, i) => (
                  <div key={years[i]}>
                    <dt>{years[i]}</dt>
                    <dd>{val.toFixed(1)}%</dd>
                  </div>
                ))}
              </dl>
            </article>
          );
        })}
      </section>
    </main>
  );
}

export default App;
