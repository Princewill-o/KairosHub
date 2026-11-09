"use client";
/**
 * Kairos Mall shop counter, in the phone's ink style. Browse a department,
 * pick standard or express delivery, pay in Grace, and track the van.
 */
import { useEffect, useState } from "react";
import { buyMallItem } from "@/app/games/world/actions";
import {
  DELIVERY, DEPTS, MALL, etaSeconds, mallItem, orderCost, orderStatus, placeOrder, readMall, wear, writeMall,
  type Dept, type MallState, type Speed,
} from "@/game/core/mall";

const STATUS = { packing: "Packing at the warehouse", "on-the-way": "Out for delivery", arriving: "Driver arriving", delivered: "At your front door", collected: "Collected" } as const;

export function MallDialog({ dept, playerId, clout, onPaid, onWear, onClose }: {
  dept: Dept | "orders";
  playerId: string;
  clout: number;
  onPaid: (left: number, message: string) => void;
  onWear: (state: MallState) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<Dept | "orders">(dept);
  const [state, setState] = useState<MallState>(() => readMall(localStorage, playerId));
  const [speed, setSpeed] = useState<Speed>("standard");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [, tick] = useState(0);
  useEffect(() => { const t = setInterval(() => tick((n) => n + 1), 1000); return () => clearInterval(t); }, []);
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopPropagation(); onClose(); } };
    window.addEventListener("keydown", k, true);
    return () => window.removeEventListener("keydown", k, true);
  }, [onClose]);
  const save = (next: MallState) => { setState(next); writeMall(localStorage, next, playerId); };
  const buy = async (id: string) => {
    setBusy(true); setError("");
    const r = await buyMallItem(id, speed);
    setBusy(false);
    if (!r.ok) { setError(r.error ?? "Couldn't place that order."); return; }
    save(placeOrder(readMall(localStorage, playerId), id, speed));
    onPaid(r.clout ?? clout, `${mallItem(id)?.name} ordered · ${speed === "express" ? "express delivery, about 90 seconds" : "standard delivery, about 6 minutes"} to your house.`);
    setTab("orders");
  };
  const items = MALL.filter((m) => m.dept === tab);
  const now = Date.now();
  return (
    <div className="kp-backdrop" role="dialog" aria-modal="true" aria-label="Kairos Mall">
      <div className="km-mall">
        <header>
          <div><small className="kp-eyebrow">Kairos Mall</small><h2>{tab === "orders" ? "Your orders" : tab}</h2></div>
          <span className="km-mall-wallet">{clout.toLocaleString()} Grace</span>
          <button className="km-mall-close" onClick={onClose} aria-label="Close">×</button>
        </header>
        <nav className="km-mall-tabs">
          {[...DEPTS, "orders" as const].map((d) => <button key={d} className={d === tab ? "on" : ""} onClick={() => setTab(d)}>{d === "orders" ? `Orders (${state.orders.filter((o) => !o.collected).length})` : d}</button>)}
        </nav>
        {tab !== "orders" && (
          <>
            <div className="km-mall-delivery">
              {(Object.keys(DELIVERY) as Speed[]).map((s) => (
                <label key={s} className={speed === s ? "on" : ""}><input type="radio" name="speed" checked={speed === s} onChange={() => setSpeed(s)} />{DELIVERY[s].label}</label>
              ))}
            </div>
            <div className="km-mall-grid">
              {items.map((m) => (
                <article key={m.id} className="kp-card km-mall-item">
                  <div className="km-mall-swatch" style={{ background: m.colour }}>
                    {m.wear?.print && m.wear.print !== "none" && <b>{m.name.replace(/ hoodie$/, "").toUpperCase()}</b>}
                    {m.was && <i>SALE</i>}
                  </div>
                  <h3>{m.name}</h3>
                  <p className="kp-muted">{m.blurb}</p>
                  <p className="km-mall-price">{m.was && <s>{m.was}</s>} <b>{m.price}</b> Grace{DELIVERY[speed].fee ? ` + ${DELIVERY[speed].fee} express` : ""}</p>
                  <button className="kp-primary" disabled={busy || clout < orderCost(m.id, speed)} onClick={() => buy(m.id)}>
                    {clout < orderCost(m.id, speed) ? "Need more Grace" : "Buy & deliver"}
                  </button>
                </article>
              ))}
            </div>
          </>
        )}
        {tab === "orders" && (
          <div className="km-mall-orders">
            {!state.orders.length && <p className="kp-muted">No orders yet. Everything you buy is delivered by van to your house on London Square.</p>}
            {state.orders.map((o) => {
              const item = mallItem(o.item);
              const status = orderStatus(o, now);
              return (
                <article key={o.id} className="kp-card">
                  <b>{item?.name}</b>
                  <small>{STATUS[status]}{status !== "delivered" && status !== "collected" ? ` · ${etaSeconds(o, now)}s` : ""} · {o.speed}</small>
                  <div className="km-meter"><span>{STATUS[status]}</span><i style={{ width: `${Math.min(100, Math.round(((now - o.placed) / (o.eta - o.placed)) * 100))}%` }} /></div>
                  {status === "delivered" && <small>Go home to open your parcel.</small>}
                </article>
              );
            })}
            {state.wardrobe.length > 0 && (
              <>
                <h3>Your wardrobe</h3>
                <div className="km-mall-grid">
                  {state.wardrobe.map((id) => {
                    const item = mallItem(id);
                    if (!item) return null;
                    return (
                      <article key={id} className="kp-card km-mall-item">
                        <div className="km-mall-swatch" style={{ background: item.colour }} />
                        <h3>{item.name}</h3>
                        <button className="kp-primary" onClick={() => { const next = wear(state, id); save(next); onWear(next); }}>Wear it</button>
                      </article>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
        {error && <p className="km-scripture" role="alert">{error}</p>}
      </div>
    </div>
  );
}
