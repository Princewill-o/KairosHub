"use client";
import { useMemo, useState } from "react";
import { DEPTS, DELIVERY, MALL, type Speed } from "@/game/core/mall";
import { DARK } from "@/game/core/web";

const gbp = (n: number) => `£${n.toLocaleString("en-GB")}`;
/** The phone's browser: Kairos Shop (delivered to your door) and, if you go looking, the Basement. */
export function WebApp() {
  const [site, setSite] = useState<"home" | "shop" | "dark">("home");
  const [dept, setDept] = useState(DEPTS[1]);
  const [speed, setSpeed] = useState<Speed>("standard");
  const [msg, setMsg] = useState<string | null>(null);
  const items = useMemo(() => MALL.filter((m) => m.dept === dept), [dept]);
  const url = site === "home" ? "kairos.search" : site === "shop" ? "shop.kairos.co.uk" : "basement7x2q…onion";
  const send = (type: string, detail: Record<string, unknown>) => window.dispatchEvent(new CustomEvent(type, { detail: { ...detail, reply: (t: string) => setMsg(t) } }));
  return (
    <div className={`wb-app wb-${site}`}>
      <div className="wb-bar"><button onClick={() => { setSite("home"); setMsg(null); }} aria-label="Home">Home</button><span className="wb-url" data-site={site}>{site === "dark" ? "Not secure · " : "Secure · "}{url}</span></div>
      {msg && <p className="wb-msg" role="status">{msg}</p>}
      {site === "home" && (
        <div className="wb-home">
          <h3>Kairos Search</h3>
          <button className="wb-link" onClick={() => setSite("shop")}><b>Kairos Shop</b><small>Clothes, furniture, tech. Delivered to your door.</small></button>
          <button className="wb-link" onClick={() => setSite("dark")}><b>basement7x2q.onion</b><small>“Anything you want. No questions.” (you know you shouldn't)</small></button>
        </div>
      )}
      {site === "shop" && (
        <div className="wb-shop">
          <nav>{DEPTS.map((d) => <button key={d} aria-pressed={d === dept} onClick={() => setDept(d)}>{d}</button>)}</nav>
          <label className="wb-speed">Delivery: <select value={speed} onChange={(e) => setSpeed(e.target.value as Speed)}>{(Object.keys(DELIVERY) as Speed[]).map((s) => <option key={s} value={s}>{DELIVERY[s].label}{DELIVERY[s].fee ? ` (+${gbp(DELIVERY[s].fee)})` : ""}</option>)}</select></label>
          <ul>{items.map((m) => (
            <li key={m.id}><span className="wb-swatch" style={{ background: m.colour }} /><span><b>{m.name}</b><small>{m.blurb}</small></span>
              <button onClick={() => send("kairos-web-order", { item: m.id, speed })}>{m.was ? <s>{gbp(m.was)}</s> : null} {gbp(m.price)}</button></li>
          ))}</ul>
        </div>
      )}
      {site === "dark" && (
        <div className="wb-dark">
          <p className="wb-warn">This is the dark web. Everything here is illegal, a scam, or both. Proverbs 1:10.</p>
          <ul>{DARK.map((d) => (
            <li key={d.id}><span><b>{d.name}</b><small>{d.seller} · {d.blurb}</small></span><button onClick={() => send("kairos-web-dark", { item: d.id })}>{d.price ? gbp(d.price) : "Accept"}</button></li>
          ))}</ul>
          <button className="wb-leave" onClick={() => setSite("home")}>Close the tab and walk away</button>
        </div>
      )}
    </div>
  );
}
