import test from 'node:test';
import assert from 'node:assert/strict';
import { createStore } from '../src/lib/storage.js';

function memory() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => {
      map.set(k, v);
    },
  };
}

test('round-trips saved values', () => {
  const store = createStore(memory());
  assert.deepEqual(store.save('setup', { a: 1 }), { ok: true });
  assert.deepEqual(store.load('setup'), { ok: true, value: { a: 1 } });
});

test('missing keys load as null', () => {
  const store = createStore(memory());
  assert.deepEqual(store.load('absent'), { ok: true, value: null });
});

test('save reports a throwing backend instead of dropping data', () => {
  const throwing = {
    getItem: () => null,
    setItem: () => {
      throw new Error('quota exceeded');
    },
  };
  const res = createStore(throwing).save('setup', { a: 1 });
  assert.equal(res.ok, false);
  assert.match(res.error, /quota exceeded/);
});

test('load reports corrupt payloads instead of throwing', () => {
  const backend = memory();
  backend.setItem('finconsole.setup', '{oops');
  const res = createStore(backend).load('setup');
  assert.equal(res.ok, false);
  assert.ok(res.error.length > 0);
});
