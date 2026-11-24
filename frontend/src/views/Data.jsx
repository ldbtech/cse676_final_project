import { useEffect, useState } from 'react';
import { parseCSV } from '../lib/csv.js';

const SECTORS = [
  { sector: 'Technology', symbols: 'AAPL, MSFT, NVDA', coverage: 'Yahoo + Reddit' },
  { sector: 'Financials', symbols: 'JPM, GS, V', coverage: 'Yahoo + Reddit' },
  { sector: 'Energy', symbols: 'XOM, CVX', coverage: 'Yahoo' },
  { sector: 'Healthcare', symbols: 'UNH, LLY', coverage: 'Yahoo' },
  { sector: 'Consumer', symbols: 'AMZN, TSLA', coverage: 'Yahoo + Reddit' },
  { sector: 'Industrials', symbols: 'CAT, HON', coverage: 'Yahoo' },
  { sector: 'Index futures', symbols: 'ES=F, NQ=F', coverage: 'Yahoo' },
  { sector: 'Commodities', symbols: 'GC=F, CL=F', coverage: 'Manual + Yahoo' },
];

const KINDS = [
  { kind: 'Price bars (OHLCV)', source: 'Yahoo Finance', format: 'API · CSV upload' },
  { kind: 'Reddit sentiment', source: 'Reddit API', format: 'API · CSV upload' },
  { kind: 'News headlines', source: 'GDELT · RSS · NewsAPI', format: 'API · CSV upload' },
  { kind: 'Fundamentals', source: 'Manual upload', format: 'CSV upload' },
  { kind: 'Options chain', source: 'Manual upload', format: 'CSV upload' },
  { kind: 'Futures curves', source: 'Manual upload', format: 'CSV upload' },
];

const PREVIEW_ROWS = 8;
const MAX_STORE_ROWS = 2000;
const MAX_STAGED = 20;

export default function Data({ store }) {
  const [staged, setStaged] = useState([]);
  const [draft, setDraft] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const res = store.load('data.uploads');
    if (res.ok && Array.isArray(res.value)) setStaged(res.value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function persist(next) {
    const res = store.save('data.uploads', next);
    if (res.ok) {
      setStaged(next);
      return true;
    }
    setMessage({ ok: false, text: `Save failed: ${res.error}` });
    return false;
  }

  function onFile(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = parseCSV(String(reader.result || ''));
        if (parsed.columns.length === 0) {
          setMessage({ ok: false, text: 'No columns found. Is this a CSV file?' });
          return;
        }
        setDraft({ name: file.name, ...parsed, rowCount: parsed.rows.length });
        setMessage(null);
      } catch (err) {
        setMessage({ ok: false, text: `Could not parse ${file.name}: ${err.message}` });
      }
    };
    reader.onerror = () => setMessage({ ok: false, text: `Could not read ${file.name}.` });
    reader.readAsText(file);
    e.target.value = '';
  }

  function stageDraft() {
    if (!draft) return;
    const entry = {
      name: draft.name,
      columns: draft.columns,
      rows: draft.rows.slice(0, MAX_STORE_ROWS),
      rowCount: draft.rowCount,
      savedAt: new Date().toISOString(),
    };
    if (persist([entry, ...staged].slice(0, MAX_STAGED))) {
      setDraft(null);
      setMessage({ ok: true, text: `Staged ${entry.name} (${entry.rowCount} rows) in this browser.` });
    }
  }

  return (
    <div>
      <div className="panel">
        <div className="panel-head">
          <h2>Sector coverage</h2>
          <span className="pill demo">Planned map</span>
        </div>
        <table className="grid">
          <thead>
            <tr>
              <th>Sector</th>
              <th>Tracked symbols</th>
              <th>Coverage</th>
            </tr>
          </thead>
          <tbody>
            {SECTORS.map((s) => (
              <tr key={s.sector}>
                <td>
                  <strong>{s.sector}</strong>
                </td>
                <td>{s.symbols}</td>
                <td>{s.coverage}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>Data kinds</h2>
          <span className="pill demo">Planned map</span>
        </div>
        <table className="grid">
          <thead>
            <tr>
              <th>Kind</th>
              <th>Source</th>
              <th>Format</th>
            </tr>
          </thead>
          <tbody>
            {KINDS.map((k) => (
              <tr key={k.kind}>
                <td>
                  <strong>{k.kind}</strong>
                </td>
                <td>{k.source}</td>
                <td>{k.format}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="panel">
        <h2>Manual upload</h2>
        <p className="hint">
          Drop in a CSV when an API does not cover the data. Preview it, then stage it.
          Staged files persist in this browser until the backend store lands.
        </p>
        <div className="upload-row">
          <input type="file" accept=".csv,text/csv" onChange={onFile} aria-label="Choose CSV file" />
          {draft && (
            <button className="btn btn-primary" onClick={stageDraft}>
              Stage {draft.name}
            </button>
          )}
        </div>

        {draft && (
          <div>
            <div className="proposal-meta">
              {draft.rowCount} rows · {draft.columns.length} columns
              {draft.rowCount > MAX_STORE_ROWS && ` · staging keeps the first ${MAX_STORE_ROWS}`}
              {' '}· previewing first {Math.min(PREVIEW_ROWS, draft.rowCount)}
            </div>
            <div className="preview-scroll">
              <table className="grid">
                <thead>
                  <tr>
                    {draft.columns.map((c) => (
                      <th key={c}>{c || '(blank)'}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {draft.rows.slice(0, PREVIEW_ROWS).map((r, i) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <tr key={i}>
                      {draft.columns.map((c, j) => (
                        <td key={`${c}-${j}`}>{r[j] ?? ''}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {message && (
          <p className={message.ok ? 'save-msg ok' : 'save-msg error'}>{message.text}</p>
        )}
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>Staged uploads</h2>
          <span className="pill demo">This browser</span>
        </div>
        {staged.length === 0 ? (
          <p className="hint">Nothing staged yet.</p>
        ) : (
          <table className="grid">
            <thead>
              <tr>
                <th>File</th>
                <th>Rows</th>
                <th>Columns</th>
                <th>Staged at</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {staged.map((s) => (
                <tr key={s.name + s.savedAt}>
                  <td>
                    <strong>{s.name}</strong>
                  </td>
                  <td>{s.rowCount}</td>
                  <td>{s.columns.length}</td>
                  <td>{new Date(s.savedAt).toLocaleString()}</td>
                  <td>
                    <button
                      className="btn btn-sell"
                      onClick={() => persist(staged.filter((x) => x !== s))}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
