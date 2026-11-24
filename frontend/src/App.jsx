import { useEffect, useMemo, useState } from 'react';
import Dashboard from './views/Dashboard.jsx';
import Agent from './views/Agent.jsx';
import Data from './views/Data.jsx';
import Setup from './views/Setup.jsx';
import Broker from './views/Broker.jsx';
import { browserStore } from './lib/storage.js';
import { createInitialState, tick } from './lib/sim.js';

const NAV = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'agent', label: 'Agent' },
  { id: 'data', label: 'Data' },
  { id: 'setup', label: 'Sources' },
  { id: 'broker', label: 'Broker' },
];

const TITLES = {
  dashboard: 'Dashboard',
  agent: 'Agent',
  data: 'Data',
  setup: 'Sources',
  broker: 'Broker',
};

const TICK_MS = 1500;

function stamp() {
  return new Date().toLocaleTimeString('en-US', { hour12: false });
}

const CONTROL_NOTES = {
  running: 'Agent started by user.',
  paused: 'Agent paused by user. Open simulated positions held.',
  stopped: 'Agent stopped by user. Strategy halted.',
};

export default function App() {
  const store = useMemo(() => browserStore(), []);
  const [view, setView] = useState('dashboard');
  const [mode, setMode] = useState('paper');
  const [notice, setNotice] = useState(null);
  const [agentStatus, setAgentStatus] = useState('stopped');
  const [sim, setSim] = useState(() => {
    const s = createInitialState();
    s.agentLog = [{ time: stamp(), text: 'Agent loaded. Status: stopped.' }];
    return s;
  });

  useEffect(() => {
    if (agentStatus !== 'running') return undefined;
    setSim((s) => tick(s));
    const id = setInterval(() => setSim((s) => tick(s)), TICK_MS);
    return () => clearInterval(id);
  }, [agentStatus]);

  function controlAgent(next) {
    setAgentStatus(next);
    const entry = { time: stamp(), text: CONTROL_NOTES[next] };
    setSim((s) => ({ ...s, agentLog: [entry, ...s.agentLog].slice(0, 50) }));
  }

  function tryMode(next) {
    if (next === 'real') {
      const res = store.load('broker.alpaca-live');
      const creds = res.ok ? res.value : null;
      if (!creds || !creds.key || !creds.secret) {
        setNotice('Add Alpaca live keys under Broker before switching to real mode.');
        return;
      }
      setNotice('Real mode armed. V1 simulates runs; order routing needs the backend.');
    } else {
      setNotice(null);
    }
    setMode(next);
  }

  const running = agentStatus === 'running';

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-name">Fin Console</div>
          <div className="brand-sub">supervised agent trading</div>
        </div>
        <nav>
          {NAV.map((item) => (
            <button
              key={item.id}
              className={view === item.id ? 'nav-btn active' : 'nav-btn'}
              onClick={() => setView(item.id)}
            >
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="side-note">Local only · loopback · v1 scaffold</div>
      </aside>

      <div className="main">
        <header className="topbar">
          <h1>{TITLES[view]}</h1>
          <div className="mode-toggle" role="group" aria-label="Trading mode">
            <button
              className={mode === 'paper' ? 'seg active' : 'seg'}
              aria-pressed={mode === 'paper'}
              onClick={() => tryMode('paper')}
            >
              Paper
            </button>
            <button
              className={mode === 'real' ? 'seg seg-real active' : 'seg seg-real'}
              aria-pressed={mode === 'real'}
              onClick={() => tryMode('real')}
            >
              Real
            </button>
          </div>
        </header>

        <div className={mode === 'paper' ? 'mode-banner paper' : 'mode-banner real'}>
          {mode === 'paper'
            ? 'Paper mode — simulated fills, no broker orders.'
            : 'Real mode — live keys on file. V1 simulates runs; routing needs the backend.'}
        </div>
        {notice && <div className="notice">{notice}</div>}

        <main className="content">
          {view === 'dashboard' && <Dashboard sim={sim} running={running} />}
          {view === 'agent' && (
            <Agent mode={mode} store={store} status={agentStatus} log={sim.agentLog} onControl={controlAgent} />
          )}
          {view === 'data' && <Data store={store} />}
          {view === 'setup' && <Setup store={store} />}
          {view === 'broker' && <Broker store={store} />}
        </main>
      </div>
    </div>
  );
}
