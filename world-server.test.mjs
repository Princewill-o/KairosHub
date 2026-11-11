import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import WebSocket from 'ws';
import { createRoom, filterChat, roomKey } from './server/world-protocol.mjs';

test('world room: hello, join, move broadcast, chat filter, leave, capacity', () => {
  const room = createRoom({ capacity: 2 });
  const a = [], b = [], c = [];
  const ia = room.open((s) => a.push(JSON.parse(s)));
  const ib = room.open((s) => b.push(JSON.parse(s)));
  assert.equal(room.open((s) => c.push(JSON.parse(s))), null);
  assert.equal(c[0].t, 'full');
  room.message(ia, JSON.stringify({ t: 'hello', name: 'Ada<script>', avatar: { skin: '#fff' }, x: 10, y: 20 }));
  room.message(ib, JSON.stringify({ t: 'hello', name: 'Bo', x: 30, y: 40 }));
  assert.equal(b.find((m) => m.t === 'welcome').players[0].username, 'Adascript');
  assert.ok(a.some((m) => m.t === 'join' && m.p.username === 'Bo'));
  room.message(ia, JSON.stringify({ t: 'move', x: 50, y: 60, d: 2, heading: 1.2 }));
  room.message(ia, JSON.stringify({ t: 'move', x: 99999, y: 99999 })); // teleport ignored (and too soon)
  room.tick();
  const st = b.find((m) => m.t === 'state');
  assert.deepEqual(st.ps[0].slice(0, 3), [ia, 50, 60]);
  room.message(ib, JSON.stringify({ t: 'chat', text: 'hello shit world' }));
  assert.equal(a.find((m) => m.t === 'chat').text, 'hello **** world');
  room.close(ib);
  assert.ok(a.some((m) => m.t === 'leave' && m.id === ib));
  assert.equal(filterChat('a'.repeat(300)).length, 140);
  assert.equal(roomKey('https://x/api/world/connect?map=city&server=lse-1'), 'city:lse-1');
});

test('Node world server: two players see each other move and chat', async () => {
  const port = 18000 + Math.floor(Math.random() * 1000);
  const srv = spawn(process.execPath, ['server/world-server.mjs'], { env: { ...process.env, PORT: String(port) }, stdio: 'pipe' });
  await new Promise((r) => srv.stdout.once('data', r));
  const url = `ws://127.0.0.1:${port}/api/world/connect?map=city&server=test-1`;
  const join = (name) => new Promise((res) => { const ws = new WebSocket(url); const inbox = []; ws.on('message', (d) => inbox.push(JSON.parse(d))); ws.on('open', () => { ws.send(JSON.stringify({ t: 'hello', name, x: 1, y: 1 })); setTimeout(() => res({ ws, inbox }), 150); }); });
  const A = await join('Ama'), B = await join('Ben');
  A.ws.send(JSON.stringify({ t: 'move', x: 120, y: 80, d: 1 }));
  A.ws.send(JSON.stringify({ t: 'chat', text: 'Hi Ben!' }));
  await new Promise((r) => setTimeout(r, 350));
  assert.ok(A.inbox.some((m) => m.t === 'join' && m.p.username === 'Ben'));
  assert.ok(B.inbox.some((m) => m.t === 'state' && m.ps.some((p) => p[1] === 120)));
  assert.ok(B.inbox.some((m) => m.t === 'chat' && m.text === 'Hi Ben!'));
  const health = await (await fetch(`http://127.0.0.1:${port}/health`)).json();
  assert.equal(health.players, 2);
  A.ws.close(); B.ws.close(); srv.kill();
});
