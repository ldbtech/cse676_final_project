import { useEffect, useState } from 'react';

const SECTIONS = [
  {
    key: 'setup.reddit',
    title: 'Reddit sentiment',
    hint: 'Free app keys from reddit.com/prefs/apps, plus the subs and tickers to watch.',
    fields: [
      { name: 'clientId', label: 'Client ID' },
      { name: 'clientSecret', label: 'Client secret', secret: true },
      { name: 'subreddits', label: 'Subreddits', placeholder: 'stocks, wallstreetbets, futures' },
      { name: 'keywords', label: 'Keywords', placeholder: 'AAPL, ES, CPI, earnings' },
    ],
  },
  {
    key: 'setup.yahoo',
    title: 'Yahoo Finance',
    hint: 'No key needed. Symbols and bar interval only.',
    fields: [
      { name: 'symbols', label: 'Symbols', placeholder: 'AAPL, MSFT, ES=F, NQ=F' },
      { name: 'interval', label: 'Interval', placeholder: '1d' },
    ],
  },
  {
    key: 'setup.news',
    title: 'News',
    hint: 'GDELT and RSS need no key. A NewsAPI key is optional.',
    fields: [
      { name: 'query', label: 'Query', placeholder: 'stock market OR futures' },
      { name: 'rss', label: 'RSS feeds (one per line)', multiline: true, placeholder: 'https://…' },
      { name: 'newsApiKey', label: 'NewsAPI key (optional)', secret: true },
    ],
  },
];

function blankValues() {
  const out = {};
  for (const s of SECTIONS) {
    out[s.key] = {};
    for (const f of s.fields) out[s.key][f.name] = '';
  }
  return out;
}

export default function Setup({ store }) {
  const [values, setValues] = useState(blankValues);
  const [messages, setMessages] = useState({});

  useEffect(() => {
    const next = blankValues();
    for (const s of SECTIONS) {
      const res = store.load(s.key);
      if (res.ok && res.value) next[s.key] = { ...next[s.key], ...res.value };
    }
    setValues(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function edit(sectionKey, name, value) {
    setValues((v) => ({ ...v, [sectionKey]: { ...v[sectionKey], [name]: value } }));
  }

  function save(sectionKey) {
    const res = store.save(sectionKey, {
      ...values[sectionKey],
      updatedAt: new Date().toISOString(),
    });
    setMessages((m) => ({
      ...m,
      [sectionKey]: res.ok
        ? { ok: true, text: `Saved locally at ${new Date().toLocaleTimeString()}.` }
        : { ok: false, text: `Save failed: ${res.error}` },
    }));
  }

  return (
    <div>
      {SECTIONS.map((s) => (
        <div className="panel" key={s.key}>
          <h2>{s.title}</h2>
          <p className="hint">{s.hint}</p>
          {s.fields.map((f) => (
            <div className="field" key={f.name}>
              <label>{f.label}</label>
              {f.multiline ? (
                <textarea
                  value={values[s.key][f.name]}
                  placeholder={f.placeholder || ''}
                  onChange={(e) => edit(s.key, f.name, e.target.value)}
                />
              ) : (
                <input
                  type={f.secret ? 'password' : 'text'}
                  value={values[s.key][f.name]}
                  placeholder={f.placeholder || ''}
                  autoComplete="off"
                  spellCheck="false"
                  onChange={(e) => edit(s.key, f.name, e.target.value)}
                />
              )}
            </div>
          ))}
          <button className="btn btn-primary" onClick={() => save(s.key)}>
            Save {s.title}
          </button>
          {messages[s.key] && (
            <p className={messages[s.key].ok ? 'save-msg ok' : 'save-msg error'}>
              {messages[s.key].text}
            </p>
          )}
        </div>
      ))}
      <p className="foot-note">
        Saved in this browser only. The pipeline backend reads these settings once it lands.
      </p>
    </div>
  );
}
