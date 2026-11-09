"use client";
/**
 * Friends on the phone: add by friend code, chat with end-to-end encryption
 * and call with your voice (mute / unmute / hang up).
 *
 * Encryption: each device makes an ECDH P-256 key pair; only the public key is
 * uploaded. Each conversation uses AES-GCM with a key both phones derive on
 * their own, so the server only ever sees ciphertext. Calls are peer-to-peer
 * WebRTC audio; the server only passes on the connection set-up.
 * Friendships open only after both people accept and each child's parent approves.
 */
import { useCallback, useEffect, useRef, useState } from "react";

type Friend = { id: string; name: string; publicKey: string | null; status: "active" | "sent" | "received" | "awaiting-parents" };
type Me = { id: string; name: string; code: string; hasKey: boolean; child: boolean };
type Line = { mine: boolean; text: string; at: number };

const KEY_STORE = "kairos-friends-key-v1";
const b64 = (buf: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(buf as ArrayBuffer)));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
async function api<T>(path: string, body?: unknown): Promise<T> {
  const r = await fetch(`/api/friends${path}`, body === undefined ? { credentials: "same-origin" } : { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || "Friends is unavailable right now.");
  return data as T;
}
/** This device's key pair; the private half never leaves the device. */
async function deviceKeys() {
  const saved = localStorage.getItem(KEY_STORE);
  if (saved) {
    const { pub, priv } = JSON.parse(saved);
    return { pub, priv: await crypto.subtle.importKey("jwk", priv, { name: "ECDH", namedCurve: "P-256" }, false, ["deriveKey"]) };
  }
  const pair = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveKey"]);
  const pub = await crypto.subtle.exportKey("jwk", pair.publicKey);
  const priv = await crypto.subtle.exportKey("jwk", pair.privateKey);
  localStorage.setItem(KEY_STORE, JSON.stringify({ pub, priv }));
  return { pub, priv: pair.privateKey };
}
async function sharedKey(priv: CryptoKey, theirs: string) {
  const pub = await crypto.subtle.importKey("jwk", JSON.parse(theirs), { name: "ECDH", namedCurve: "P-256" }, false, []);
  return crypto.subtle.deriveKey({ name: "ECDH", public: pub }, priv, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}
async function seal(key: CryptoKey, text: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(text));
  return { ciphertext: b64(ct), iv: b64(iv) };
}
async function open(key: CryptoKey, ciphertext: string, iv: string) {
  try { return new TextDecoder().decode(await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(iv) }, key, unb64(ciphertext))); }
  catch { return "(Sent to another of your devices)"; }
}

export function FriendsChatApp() {
  const [me, setMe] = useState<Me | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [error, setError] = useState("");
  const [code, setCode] = useState("");
  const [chat, setChat] = useState<Friend | null>(null);
  const keys = useRef<Awaited<ReturnType<typeof deviceKeys>> | null>(null);
  const refresh = useCallback(async () => {
    try {
      const data = await api<{ me: Me; friends: Friend[] }>("");
      keys.current ??= await deviceKeys();
      if (!data.me.hasKey) await api("/key", { publicKey: keys.current.pub });
      setMe(data.me); setFriends(data.friends); setError("");
    } catch (e) { setError((e as Error).message); }
  }, []);
  useEffect(() => { void refresh(); const t = setInterval(refresh, 8000); return () => clearInterval(t); }, [refresh]);
  const call = useCall(me);

  if (call.state !== "idle") return <CallScreen call={call} />;
  if (chat && keys.current) return <ChatThread friend={chat} priv={keys.current.priv} onBack={() => setChat(null)} onCall={() => call.start(chat)} />;
  return (
    <div className="kp-stack">
      {error && <div className="kp-card"><b>Friends</b><p>{error}</p><small className="kp-muted">Friends works with a family account. A parent approves every new friend.</small></div>}
      {me && (
        <div className="kp-card">
          <small className="kp-eyebrow">Your friend code</small>
          <h3 style={{ letterSpacing: ".18em" }}>{me.code}</h3>
          <p className="kp-muted">Share it only with people you know in real life. Messages are end-to-end encrypted. {me.child ? "Your parent approves each friend." : ""}</p>
          <form onSubmit={async (e) => { e.preventDefault(); try { await api("/request", { code }); setCode(""); await refresh(); } catch (err) { setError((err as Error).message); } }} style={{ display: "flex", gap: 8 }}>
            <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={8} placeholder="Friend code" aria-label="Friend code" className="kp-search" style={{ flex: 1 }} />
            <button className="kp-action" disabled={code.length !== 8}>Add</button>
          </form>
        </div>
      )}
      {friends.map((f) => (
        <article key={f.id} className="kp-contact">
          <div className="kp-avatar small">{f.name[0]}</div>
          <div>
            <b>{f.name}</b>
            <small>{f.status === "active" ? "Friend · encrypted" : f.status === "sent" ? "Request sent" : f.status === "received" ? "Wants to be friends" : "Waiting for parents to approve"}</small>
          </div>
          {f.status === "received" && <>
            <button className="kp-action" onClick={async () => { await api("/respond", { id: f.id, accept: true }); await refresh(); }}>Accept</button>
            <button className="kp-option" onClick={async () => { await api("/respond", { id: f.id, accept: false }); await refresh(); }}>No</button>
          </>}
          {f.status === "active" && <>
            <button className="kp-action" onClick={() => setChat(f)}>Chat</button>
            <button className="kp-action" onClick={() => call.start(f)}>Call</button>
          </>}
        </article>
      ))}
      {me && !friends.length && <p className="kp-muted">No friends yet. Swap friend codes with someone you know.</p>}
    </div>
  );
}

function ChatThread({ friend, priv, onBack, onCall }: { friend: Friend; priv: CryptoKey; onBack: () => void; onCall: () => void }) {
  const [lines, setLines] = useState<Line[]>([]);
  const [text, setText] = useState("");
  const [note, setNote] = useState("");
  const key = useRef<CryptoKey | null>(null);
  const after = useRef(0);
  useEffect(() => {
    let live = true;
    const pull = async () => {
      if (!friend.publicKey) return;
      key.current ??= await sharedKey(priv, friend.publicKey);
      const { messages } = await api<{ messages: { mine: boolean; ciphertext: string; iv: string; at: number }[] }>(`/messages?with=${encodeURIComponent(friend.id)}&after=${after.current}`).catch(() => ({ messages: [] }));
      const opened = await Promise.all(messages.map(async (m) => ({ mine: m.mine, at: m.at, text: await open(key.current!, m.ciphertext, m.iv) })));
      if (!live || !opened.length) return;
      after.current = opened[opened.length - 1].at;
      setLines((l) => [...l, ...opened]);
    };
    void pull();
    const t = setInterval(pull, 2000);
    return () => { live = false; clearInterval(t); };
  }, [friend, priv]);
  const send = async () => {
    const body = text.trim();
    if (!body || !key.current) return;
    setText("");
    try { await api("/messages", { to: friend.id, ...(await seal(key.current, body.slice(0, 1000))) }); }
    catch (e) { setNote((e as Error).message); }
  };
  return (
    <div className="kp-stack">
      <div className="kp-thread">
        <p className="kp-sys"><button className="kp-back" onClick={onBack}>‹ Friends</button> {friend.name} · end-to-end encrypted <button className="kp-action" onClick={onCall}>Call</button></p>
        {lines.map((l, i) => <p key={i} className={`kp-bubble ${l.mine ? "me" : "them"}`}>{l.text}</p>)}
        {note && <p className="kp-sys">{note}</p>}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); void send(); }} style={{ display: "flex", gap: 8 }}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Message" aria-label="Message" className="kp-search" style={{ flex: 1 }} maxLength={1000} />
        <button className="kp-action" disabled={!text.trim()}>Send</button>
      </form>
      <div style={{ display: "flex", gap: 8 }}>
        <button className="kp-option" onClick={async () => { await api("/block", { id: friend.id }); onBack(); }}>Block</button>
        <button className="kp-option" onClick={async () => {
          // Reporting shares the recent messages from this device with your parent.
          const excerpt = lines.slice(-20).map((l) => `${l.mine ? "Me" : friend.name}: ${l.text}`).join("\n");
          await api("/report", { id: friend.id, excerpt }); onBack();
        }}>Report to my parent</button>
      </div>
    </div>
  );
}

/* ── Voice calls ───────────────────────────────────────────────────────── */
type CallState = "idle" | "calling" | "ringing" | "connected" | "ended";
function useCall(me: Me | null) {
  const [state, setState] = useState<CallState>("idle");
  const [peer, setPeer] = useState<{ id: string; name: string } | null>(null);
  const [muted, setMuted] = useState(false);
  const pc = useRef<RTCPeerConnection | null>(null);
  const local = useRef<MediaStream | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const pendingOffer = useRef<string | null>(null);
  const signal = (to: string, kind: string, data = "") => api("/signal", { to, kind, data }).catch(() => {});
  const close = useCallback(() => {
    pc.current?.close(); pc.current = null;
    local.current?.getTracks().forEach((t) => t.stop()); local.current = null;
    setState("ended"); setTimeout(() => { setState("idle"); setPeer(null); setMuted(false); }, 1200);
  }, []);
  const connect = useCallback(async (to: string) => {
    const conn = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
    pc.current = conn;
    local.current = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    local.current.getTracks().forEach((t) => conn.addTrack(t, local.current!));
    conn.onicecandidate = (e) => { if (e.candidate) void signal(to, "ice", JSON.stringify(e.candidate)); };
    conn.ontrack = (e) => { audio.current ??= new Audio(); audio.current.srcObject = e.streams[0]; void audio.current.play(); setState("connected"); };
    conn.onconnectionstatechange = () => { if (["failed", "closed", "disconnected"].includes(conn.connectionState)) close(); };
    return conn;
  }, [close]);
  // Listen for incoming calls and call set-up.
  useEffect(() => {
    if (!me) return;
    const t = setInterval(async () => {
      const { signals } = await api<{ signals: { from: string; name: string; kind: string; data: string }[] }>("/signal").catch(() => ({ signals: [] }));
      for (const s of signals) {
        if (s.kind === "offer" && !pc.current) { pendingOffer.current = s.data; setPeer({ id: s.from, name: s.name }); setState("ringing"); }
        else if (s.kind === "answer") await pc.current?.setRemoteDescription(JSON.parse(s.data));
        else if (s.kind === "ice") await pc.current?.addIceCandidate(JSON.parse(s.data)).catch(() => {});
        else if (s.kind === "hangup" || s.kind === "decline") close();
      }
    }, 1500);
    return () => clearInterval(t);
  }, [me, close]);
  return {
    state, peer, muted,
    start: async (f: Friend) => {
      try {
        setPeer({ id: f.id, name: f.name }); setState("calling");
        const conn = await connect(f.id);
        const offer = await conn.createOffer();
        await conn.setLocalDescription(offer);
        await signal(f.id, "offer", JSON.stringify(offer));
      } catch { close(); }
    },
    answer: async () => {
      if (!peer || !pendingOffer.current) return;
      try {
        const conn = await connect(peer.id);
        await conn.setRemoteDescription(JSON.parse(pendingOffer.current));
        const reply = await conn.createAnswer();
        await conn.setLocalDescription(reply);
        await signal(peer.id, "answer", JSON.stringify(reply));
      } catch { close(); }
    },
    decline: () => { if (peer) void signal(peer.id, "decline"); close(); },
    hangUp: () => { if (peer) void signal(peer.id, "hangup"); close(); },
    toggleMute: () => { const next = !muted; local.current?.getAudioTracks().forEach((t) => { t.enabled = !next; }); setMuted(next); },
  };
}
function CallScreen({ call }: { call: ReturnType<typeof useCall> }) {
  return (
    <div className="kp-call">
      <div className="kp-avatar">{call.peer?.name[0]}</div>
      <h3>{call.peer?.name}</h3>
      <p>{call.state === "calling" ? "Calling…" : call.state === "ringing" ? "Incoming call" : call.state === "connected" ? (call.muted ? "Connected · you're muted" : "Connected") : "Call ended"}</p>
      <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
        {call.state === "ringing" && <><button className="kp-primary" onClick={call.answer}>Answer</button><button className="kp-option" onClick={call.decline}>Decline</button></>}
        {(call.state === "connected" || call.state === "calling") && <>
          <button className="kp-option" onClick={call.toggleMute} aria-pressed={call.muted}>{call.muted ? "Unmute" : "Mute"}</button>
          <button className="kp-primary" style={{ borderImageSource: "url(/world-ui/cartoon/buttons/Button_Long_Red.png)" }} onClick={call.hangUp}>Hang up</button>
        </>}
      </div>
    </div>
  );
}
