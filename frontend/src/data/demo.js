// Demo fixtures for the v1 scaffold. Every view labels these as demo data
// until the pipeline backend and broker wiring land.
export const portfolio = {
  equity: 128412.55,
  cash: 40210.0,
  dayPnl: 812.4,
  dayPnlPct: 0.64,
  positionCount: 4,
};

export const equityCurve = [
  124.1, 124.6, 124.2, 125.0, 125.4, 125.1, 125.9, 126.3, 126.0, 126.7,
  126.4, 127.0, 127.5, 127.2, 127.8, 128.1, 127.7, 128.0, 128.3, 128.1,
  128.6, 128.4, 128.9, 128.7, 129.0, 128.8, 129.2, 129.0, 129.3, 129.1,
];

export const positions = [
  { symbol: 'AAPL', kind: 'stock', qty: 120, avg: 228.4, last: 231.1, pnl: 324.0 },
  { symbol: 'MSFT', kind: 'stock', qty: 60, avg: 505.2, last: 501.9, pnl: -198.0 },
  { symbol: 'ESZ6', kind: 'future', qty: 2, avg: 6012.5, last: 6031.0, pnl: 370.0 },
  { symbol: 'AAPL 240C', kind: 'option', qty: 10, avg: 3.4, last: 3.95, pnl: 550.0 },
];

export const activity = [
  { time: '09:31', text: 'Agent bought 50 AAPL at 230.88 (simulated).' },
  { time: '09:15', text: 'Agent paused by user, resumed 2 minutes later.' },
  { time: '09:02', text: 'Reddit scan finished: 1,240 posts scored (demo).' },
  { time: '08:45', text: 'Yahoo sync finished: 12 symbols (demo).' },
];
