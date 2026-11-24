import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCSV } from '../src/lib/csv.js';

test('parses a simple table', () => {
  const res = parseCSV('symbol,close\nAAPL,231.1\nMSFT,501.9\n');
  assert.deepEqual(res.columns, ['symbol', 'close']);
  assert.deepEqual(res.rows, [
    ['AAPL', '231.1'],
    ['MSFT', '501.9'],
  ]);
});

test('handles quoted commas and escaped quotes', () => {
  const res = parseCSV('note,value\n"hello, world",1\n"she said ""hi""",2\n');
  assert.deepEqual(res.rows, [
    ['hello, world', '1'],
    ['she said "hi"', '2'],
  ]);
});

test('skips blank lines and CRLF endings', () => {
  const res = parseCSV('a,b\r\n1,2\r\n\r\n3,4\r\n');
  assert.deepEqual(res.rows, [
    ['1', '2'],
    ['3', '4'],
  ]);
});

test('empty input yields no columns', () => {
  assert.deepEqual(parseCSV('   \n\n'), { columns: [], rows: [] });
});

test('unterminated quotes throw instead of misaligning', () => {
  assert.throws(() => parseCSV('a,b\n"oops,1\n'), /unterminated/);
});
