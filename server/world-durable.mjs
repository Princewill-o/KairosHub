import { createRoom, roomKey, TICK_MS } from './world-protocol.mjs';

/** Route /api/world/connect?map=…&server=… to the Durable Object for that room. */
export async function handleWorldConnect(request, env) {
  if (request.headers.get('Upgrade') !== 'websocket') return new Response('Expected a WebSocket', { status: 426 });
  if (!env.WORLD_ROOMS) return new Response('Online world is not configured', { status: 503 });
  const key = roomKey(request.url);
  return env.WORLD_ROOMS.get(env.WORLD_ROOMS.idFromName(key)).fetch(request);
}

/** One Kairos World room (a map on a server), shared by everyone in it. */
export class WorldRoom {
  constructor(state) {
    this.state = state;
    this.room = createRoom();
    this.timer = null;
  }
  async fetch(request) {
    const pair = new WebSocketPair();
    const [client, socket] = Object.values(pair);
    socket.accept();
    const id = this.room.open((s) => { try { socket.send(s); } catch { /* closed */ } });
    if (!id) { socket.close(1013, 'Room full'); return new Response(null, { status: 101, webSocket: client }); }
    socket.addEventListener('message', (e) => this.room.message(id, typeof e.data === 'string' ? e.data : ''));
    const bye = () => { this.room.close(id); if (!this.room.size && this.timer) { clearInterval(this.timer); this.timer = null; } };
    socket.addEventListener('close', bye);
    socket.addEventListener('error', bye);
    this.timer ??= setInterval(() => this.room.tick(), TICK_MS);
    return new Response(null, { status: 101, webSocket: client });
  }
}
