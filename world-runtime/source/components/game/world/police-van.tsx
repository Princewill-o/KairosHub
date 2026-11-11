"use client";
/**
 * Being taken in: a Metropolitan Police van with Battenburg livery and blue
 * lights drives you across London to Crown Court or HMP Thames. A short
 * cinematic between the arrest and where you're going.
 */
export function PoliceVan({ dest }: { dest: "court" | "prison" }) {
  return (
    <div className="pv-scene" role="status" aria-live="polite" data-dest={dest}>
      <div className="pv-sky" aria-hidden><span className="pv-sun" /></div>
      <div className="pv-city" aria-hidden>{Array.from({ length: 14 }, (_, i) => <i key={i} style={{ height: 60 + ((i * 53) % 110), width: 40 + ((i * 29) % 40) }} />)}</div>
      <div className={`pv-dest pv-${dest}`} aria-hidden>
        <b>{dest === "court" ? "CROWN COURT" : "HMP THAMES"}</b>
        <span>{dest === "court" ? "Royal Arms · Justice" : "State Penitentiary"}</span>
        <div className="pv-columns">{Array.from({ length: dest === "court" ? 5 : 0 }, (_, i) => <i key={i} />)}</div>
        {dest === "prison" && <div className="pv-wire" />}
      </div>
      <div className="pv-road" aria-hidden><i /></div>
      <div className="pv-van" aria-hidden>
        <div className="pv-bar"><i className="pv-blue" /><i className="pv-red" /></div>
        <div className="pv-body">
          <span className="pv-batt" />
          <b>POLICE</b>
          <small>METROPOLITAN POLICE</small>
          <span className="pv-window"><em className="pv-cuffed" /></span>
        </div>
        <span className="pv-wheel pv-w1" /><span className="pv-wheel pv-w2" />
      </div>
      <p className="pv-caption">
        <small>Metropolitan Police</small>
        {dest === "court" ? "Handcuffed in the back of the van, you're driven to Crown Court to face the judge." : "Cuffed and silent, you're driven through the gates of HMP Thames."}
      </p>
    </div>
  );
}
