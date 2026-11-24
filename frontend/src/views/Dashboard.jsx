import { useEffect, useRef, useState } from 'react';

const money = (n) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

function Sparkline({ data }) {
  const w = 280;
  const h = 64;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const pts = data
    .map(
      (v, i) =>
        `${((i / (data.length - 1)) * w).toFixed(1)},${(
          h -
          4 -
          ((v - min) / (max - min || 1)) * (h - 8)
        ).toFixed(1)}`,
    )
    .join(' ');
  return (
    <svg className="spark" viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Equity trend">
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function useFlash(value) {
  const prev = useRef(value);
  const [dir, setDir] = useState(null);
  useEffect(() => {
    if (value > prev.current) setDir('up');
    else if (value < prev.current) setDir('down');
    prev.current = value;
  }, [value]);
  return dir;
}

export default function Dashboard({ sim, running }) {
  const dayPnl = sim.equity - sim.dayOpen;
  const dayPnlPct = (dayPnl / sim.dayOpen) * 100;
  const pnlUp = dayPnl >= 0;
  const flash = useFlash(sim.equity);
  const feedChip = running ? (
    <span className="pill live">Live</span>
  ) : (
    <span className="pill demo">Paused</span>
  );

  return (
    <div>
      <div className="stat-row">
        <div className="stat">
          <div className="stat-label">Equity</div>
          <div className={flash === 'down' ? 'stat-value down' : 'stat-value up'}>
            {money(sim.equity)}
          </div>
          <div className="stat-sub">
            {running ? 'Live sim · 30-point trend, $k' : 'Paused — start the agent'}
          </div>
          <Sparkline data={sim.curve} />
        </div>
        <div className="stat">
          <div className="stat-label">Cash</div>
          <div className="stat-value">{money(sim.cash)}</div>
          <div className="stat-sub">Settled funds</div>
        </div>
        <div className="stat">
          <div className="stat-label">Day P&amp;L</div>
          <div className={pnlUp ? 'stat-value up' : 'stat-value down'}>
            {pnlUp ? '+' : ''}
            {money(dayPnl)}
          </div>
          <div className="stat-sub">
            {pnlUp ? '+' : ''}
            {dayPnlPct.toFixed(2)}% today
          </div>
        </div>
        <div className="stat">
          <div className="stat-label">Positions</div>
          <div className="stat-value">{sim.positions.length}</div>
          <div className="stat-sub">{sim.trades} simulated fills today</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>Open positions</h2>
          {feedChip}
        </div>
        {sim.positions.length === 0 ? (
          <p className="hint">Flat. The agent holds no positions right now.</p>
        ) : (
          <table className="grid">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Type</th>
                <th>Qty</th>
                <th>Avg</th>
                <th>Last</th>
                <th>P&amp;L</th>
              </tr>
            </thead>
            <tbody>
              {sim.positions.map((p) => (
                <tr key={p.symbol}>
                  <td>
                    <strong>{p.symbol}</strong>
                  </td>
                  <td>{p.kind}</td>
                  <td>{p.qty}</td>
                  <td>{p.avg}</td>
                  <td>{p.last}</td>
                  <td className={p.pnl >= 0 ? 'up' : 'down'}>
                    {p.pnl >= 0 ? '+' : ''}
                    {money(p.pnl)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>Recent activity</h2>
          {feedChip}
        </div>
        <ul className="activity">
          {sim.activity.map((a) => (
            <li key={a.time + a.text}>
              <time>{a.time}</time>
              <span>{a.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
