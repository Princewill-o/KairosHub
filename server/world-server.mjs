#!/usr/bin/env node
/**
 * Self-hosted Kairos World realtime server (Node + ws). Same rooms and
 * protocol as the Cloudflare Durable Object. Run: PORT=8787 node server/world-server.mjs
 * Clients connect to ws(s)://host/api/world/connect?map=city&server=lse-1
 */
import http from 'node:http';
import { WebSocketServer } from 'ws';
import { createRoom, roomKey, TICK_MS } from './world-protocol.mjs';

const PORT = Number(process.env.PORT || 8787);
const ORIGINS = (process.env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
const rooms = new Map();
const roomFor = (key) => { let r = rooms.get(key); if (!r) { r = createRoom(); rooms.set(key, r); } return r; };

const server = http.createServer((req, res) => {
  if (req.url === '/health' || req.url === '/api/world/health') {
    const list = [...rooms.entries()].map(([k, r]) => ({ room: k, players: r.size }));
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify({ ok: true, players: list.reduce((t, r) => t + r.players, 0), rooms: list }));
    return;
  }
  res.writeHead(404); res.end('Kairos World server');
});
const wss = new WebSocketServer({ noServer: true, maxPayload: 64 * 1024 });
server.on('upgrade', (req, sock, head) => {
  const url = new URL(req.url, 'http://local');
  if (url.pathname !== '/api/world/connect') { sock.destroy(); return; }
  if (ORIGINS.length && !ORIGINS.includes(req.headers.origin)) { sock.destroy(); return; }
  wss.handleUpgrade(req, sock, head, (ws) => {
    const room = roomFor(roomKey(url.href));
    const id = room.open((s) => { if (ws.readyState === ws.OPEN) ws.send(s); });
    if (!id) { ws.close(1013, 'Room full'); return; }
    ws.on('message', (data) => room.message(id, data.toString()));
    ws.on('close', () => room.close(id));
    ws.on('error', () => room.close(id));
  });
});
setInterval(() => { for (const [k, r] of rooms) { r.tick(); if (!r.size) rooms.delete(k); } }, TICK_MS);
server.listen(PORT, () => console.log(`Kairos World server on :${PORT}`));
