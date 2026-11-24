import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState, tick, CURVE_POINTS } from '../src/lib/sim.js';

test('seeds from demo fixtures', () => {
  const s = createInitialState();
  assert.equal(s.equity, 128412.55);
  assert.equal(s.positions.length, 4);
  assert.equal(s.curve.length, CURVE_POINTS);
  assert.equal(s.trades, 0);
});

test('equity rises on high draws and falls on low draws', () => {
  const s = createInitialState();
  const up = tick(s, () => 0.99);
  const down = tick(s, () => 0.01);
  assert.ok(up.equity > s.equity);
  assert.ok(down.equity < s.equity);
});

test('high draws skip trading since the probability gate fails', () => {
  const s = createInitialState();
  const next = tick(s, () => 0.99);
  assert.equal(next.trades, 0);
});

test('curve stays capped at thirty points', () => {
  let s = createInitialState();
  for (let i = 0; i < 10; i++) s = tick(s, () => 0.5);
  assert.equal(s.curve.length, CURVE_POINTS);
});

test('forced trade appends activity and log entries', () => {
  const s = createInitialState();
  const next = tick(s, () => 0.5, { forceTrade: true });
  assert.equal(next.trades, 1);
  assert.equal(next.activity.length, s.activity.length + 1);
  assert.equal(next.agentLog.length, 1);
  assert.match(next.agentLog[0].text, /TSLA/);
  assert.match(next.agentLog[0].text, /simulated/);
});

test('selling a full position closes it', () => {
  const s = {
    ...createInitialState(),
    positions: [{ symbol: 'TSLA', kind: 'stock', qty: 5, avg: 240, last: 248, pnl: 40 }],
  };
  // rand 0.5 picks TSLA, side sold, qty 21 which covers the 5 held.
  const next = tick(s, () => 0.5, { forceTrade: true });
  assert.equal(next.positions.length, 0);
  assert.match(next.agentLog[0].text, /Closed TSLA/);
});

test('position prices move every tick', () => {
  const s = createInitialState();
  const next = tick(s, () => 0.99);
  assert.notDeepEqual(
    next.positions.map((p) => p.last),
    s.positions.map((p) => p.last),
  );
});
