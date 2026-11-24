import { useEffect, useState } from 'react';

const SECTIONS = [
  {
    key: 'broker.alpaca-paper',
    title: 'Alpaca paper',
    hint: 'Free paper keys. Safe default for testing strategies.',
  },
  {
    key: 'broker.alpaca-live',
    title: 'Alpaca live',
    hint: 'Required before Real mode unlocks. Fund the account on Alpaca’s site, never here.',
  },
];

export default function Broker({ store }) {
  const [values, setValues] = useState({ 'broker.alpaca-paper': { key: '', secret: '' }, 'broker.alpaca-live': { key: '', secret: '' } });
  const [messages, setMessages] = useState({});

  useEffect(() => {
    const next = {};
    for (const s of SECTIONS) {
      const res = store.load(s.key);
      next[s.key] = {
        key: (res.ok && res.value && res.value.key) || '',
        secret: (res.ok && res.value && res.value.secret) || '',
      };
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
          <div className="field">
            <label>API key</label>
            <input
              type="text"
              value={values[s.key].key}
              autoComplete="off"
              spellCheck="false"
              onChange={(e) => edit(s.key, 'key', e.target.value)}
            />
          </div>
          <div className="field">
            <label>Secret key</label>
            <input
              type="password"
              value={values[s.key].secret}
              autoComplete="off"
              onChange={(e) => edit(s.key, 'secret', e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={() => save(s.key)}>
            Save {s.title} keys
          </button>
          {messages[s.key] && (
            <p className={messages[s.key].ok ? 'save-msg ok' : 'save-msg error'}>
              {messages[s.key].text}
            </p>
          )}
        </div>
      ))}

      <div className="panel">
        <h2>Status</h2>
        <ul className="bullets">
          <li>Keys stay in this browser until the backend vault lands.</li>
          <li>Connection checks need the backend, so nothing is verified yet.</li>
          <li>Fund or withdraw on Alpaca’s own site. This app never takes bank logins.</li>
        </ul>
      </div>
    </div>
  );
}
