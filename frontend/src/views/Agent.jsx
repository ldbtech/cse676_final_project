import { useEffect, useState } from 'react';

const STATUS_LABEL = { stopped: 'Stopped', running: 'Running', paused: 'Paused' };

const BLANK_CONFIG = { instructions: '', symbols: '', maxPosition: '', dailyLoss: '' };

export default function Agent({ mode, store, status, log, onControl }) {
  const [config, setConfig] = useState(BLANK_CONFIG);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const res = store.load('agent.config');
    if (res.ok && res.value) setConfig({ ...BLANK_CONFIG, ...res.value });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function save() {
    const res = store.save('agent.config', {
      ...config,
      updatedAt: new Date().toISOString(),
    });
    setMessage(
      res.ok
        ? { ok: true, text: `Direction saved at ${new Date().toLocaleTimeString()}.` }
        : { ok: false, text: `Save failed: ${res.error}` },
    );
  }

  return (
    <div>
      <div className="panel">
        <div className="status-line">
          <h2>Agent control</h2>
          <span className={`pill status-${status}`}>{STATUS_LABEL[status]}</span>
          <span className="pill demo">Simulated run</span>
        </div>
        <p className="hint">
          {mode === 'paper'
            ? 'Paper mode: the agent trades simulated fills. Stop or pause it any time.'
            : 'Real mode: v1 still simulates runs. Live order routing needs the backend.'}
        </p>
        <div className="controls">
          <button
            className="btn btn-buy"
            disabled={status === 'running'}
            onClick={() => onControl('running')}
          >
            Start
          </button>
          <button
            className="btn"
            disabled={status !== 'running'}
            onClick={() => onControl('paused')}
          >
            Pause
          </button>
          <button
            className="btn btn-sell"
            disabled={status === 'stopped'}
            onClick={() => onControl('stopped')}
          >
            Stop
          </button>
        </div>
      </div>

      <div className="panel">
        <h2>Direct the agent</h2>
        <p className="hint">Strategy notes and guardrails. The agent reads these on its next run.</p>
        <div className="field wide">
          <label>Strategy instructions</label>
          <textarea
            value={config.instructions}
            placeholder="e.g. Momentum on large-cap tech, hold 1–5 days, avoid earnings week."
            onChange={(e) => setConfig({ ...config, instructions: e.target.value })}
          />
        </div>
        <div className="field">
          <label>Allowed symbols</label>
          <input
            type="text"
            value={config.symbols}
            placeholder="AAPL, MSFT, ES=F"
            autoComplete="off"
            spellCheck="false"
            onChange={(e) => setConfig({ ...config, symbols: e.target.value })}
          />
        </div>
        <div className="field">
          <label>Max position size (USD)</label>
          <input
            type="text"
            inputMode="numeric"
            value={config.maxPosition}
            placeholder="5000"
            autoComplete="off"
            onChange={(e) => setConfig({ ...config, maxPosition: e.target.value })}
          />
        </div>
        <div className="field">
          <label>Daily loss limit (USD)</label>
          <input
            type="text"
            inputMode="numeric"
            value={config.dailyLoss}
            placeholder="500"
            autoComplete="off"
            onChange={(e) => setConfig({ ...config, dailyLoss: e.target.value })}
          />
        </div>
        <button className="btn btn-primary" onClick={save}>
          Save direction
        </button>
        {message && (
          <p className={message.ok ? 'save-msg ok' : 'save-msg error'}>{message.text}</p>
        )}
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>Agent log</h2>
          <span className="pill demo">This session</span>
        </div>
        {log.length === 0 ? (
          <p className="hint">No entries yet.</p>
        ) : (
          <ul className="activity">
            {log.map((entry, i) => (
              // eslint-disable-next-line react/no-array-index-key
              <li key={`${entry.time}-${i}`}>
                <time>{entry.time}</time>
                <span>{entry.text}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
