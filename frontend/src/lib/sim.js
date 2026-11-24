// Fake market feed for the v1 scaffold. Pure functions only: tick() takes a
// state plus a random source and returns the next state, so tests can drive
// it deterministically. Nothing here touches the network or a broker.
import { portfolio, positions, equityCurve, activity } from '../data/demo.js';

export const CURVE_POINTS = 30;
const TRADE_PROBABILITY = 0.3;

const TRADE_POOL = [
  { symbol: 'AAPL', base: 231.0, maxQty: 40 },
  { symbol: 'MSFT', base: 502.0, maxQty: 40 },
  { symbol: 'NVDA', base: 138.5, maxQty: 40 },
  { symbol: 'TSLA', base: 248.0, maxQty: 40 },
  { symbol: 'JPM', base: 244.0, maxQty: 40 },
  { symbol: 'ESZ6', base: 6030.0, maxQty: 2 },
];

const round2 = (n) => Math.round(n * 100) / 100;
const round1 = (n) => Math.round(n * 10) / 10;

export function createInitialState() {
  return {
    equity: portfolio.equity,
    cash: portfolio.cash,
    dayOpen: round2(portfolio.equity - portfolio.dayPnl),
    positions: positions.map((p) => ({ ...p })),
    curve: [...equityCurve],
    activity: [...activity],
    agentLog: [],
    trades: 0,
  };
}

function jitter(price, rand, vol) {
  return price * (1 + (rand() - 0.5) * 2 * vol);
}

function clock() {
  return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function applyTrade(state, rand) {
  const pool = state.positions.length >= 8
    ? TRADE_POOL.filter((t) => state.positions.some((p) => p.symbol === t.symbol))
    : TRADE_POOL;
  const pick = pool[Math.floor(rand() * pool.length)];
  let side = rand() < 0.5 ? 'bought' : 'sold';
  const qty = 1 + Math.floor(rand() * pick.maxQty);
  const price = round2(jitter(pick.base, rand, 0.002));

  const existing = state.positions.find((p) => p.symbol === pick.symbol);
  if (!existing && side === 'sold') side = 'bought'; // no naked shorts in the sim

  let positions;
  let note;
  if (!existing) {
    positions = [...state.positions, { symbol: pick.symbol, kind: 'stock', qty, avg: price, last: price, pnl: 0 }];
    note = `Opened ${pick.symbol}: bought ${qty} at ${price} (simulated).`;
  } else if (side === 'bought') {
    const newQty = existing.qty + qty;
    const avg = round2((existing.avg * existing.qty + price * qty) / newQty);
    positions = state.positions.map((p) =>
      p.symbol === pick.symbol ? { ...p, qty: newQty, avg } : p,
    );
    note = `Bought ${qty} ${pick.symbol} at ${price} (simulated).`;
  } else if (qty >= existing.qty) {
    positions = state.positions.filter((p) => p.symbol !== pick.symbol);
    note = `Closed ${pick.symbol}: sold ${existing.qty} at ${price} (simulated).`;
  } else {
    positions = state.positions.map((p) =>
      p.symbol === pick.symbol ? { ...p, qty: p.qty - qty } : p,
    );
    note = `Sold ${qty} ${pick.symbol} at ${price} (simulated).`;
  }

  const signed = side === 'bought' ? -qty * price : qty * price;
  const cash = round2(Math.max(0, state.cash + signed));
  const time = clock();
  return {
    positions,
    cash,
    activity: [{ time, text: `Agent ${note.charAt(0).toLowerCase()}${note.slice(1)}` }, ...state.activity].slice(0, 30),
    agentLog: [{ time, text: note }, ...state.agentLog].slice(0, 50),
    trades: state.trades + 1,
  };
}

export function tick(state, rand = Math.random, opts = {}) {
  const equity = round2(jitter(state.equity, rand, 0.002));
  let positions = state.positions.map((p) => {
    const last = jitter(p.last, rand, 0.006);
    return { ...p, last: round2(last), pnl: round2((last - p.avg) * p.qty) };
  });

  let next = { ...state, positions, equity, cash: state.cash };
  if (opts.forceTrade || rand() < TRADE_PROBABILITY) {
    const trade = applyTrade({ ...state, positions }, rand);
    next = { ...next, ...trade };
    // Recompute pnl for the traded row against fresh prices.
    next.positions = next.positions.map((p) => ({ ...p, pnl: round2((p.last - p.avg) * p.qty) }));
  }

  return {
    ...next,
    equity,
    curve: [...state.curve, round1(equity / 1000)].slice(-CURVE_POINTS),
  };
}
