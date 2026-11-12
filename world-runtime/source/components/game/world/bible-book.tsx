"use client";
/**
 * The Bible as a real book: open it, pick a book and chapter from the contents, and
 * turn the pages. Text is paginated to fit each page, and every turn is a 3D page-flip.
 * KJV from the site's /api/scripture endpoints; Psalm 23 is bundled for when you're offline.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

type Verse = { n: number; text: string; heading?: boolean };
type Book = { id: string; name: string; chapters: number };
const KEY = "kairos-bible-place";
const PSALM_23: Verse[] = [
  "The LORD is my shepherd; I shall not want.",
  "He maketh me to lie down in green pastures: he leadeth me beside the still waters.",
  "He restoreth my soul: he leadeth me in the paths of righteousness for his name's sake.",
  "Yea, though I walk through the valley of the shadow of death, I will fear no evil: for thou art with me; thy rod and thy staff they comfort me.",
  "Thou preparest a table before me in the presence of mine enemies: thou anointest my head with oil; my cup runneth over.",
  "Surely goodness and mercy shall follow me all the days of my life: and I will dwell in the house of the LORD for ever.",
].map((text, i) => ({ n: i + 1, text }));
const FALLBACK_BOOKS: Book[] = [{ id: "GEN", name: "Genesis", chapters: 50 }, { id: "PSA", name: "Psalms", chapters: 150 }, { id: "PRO", name: "Proverbs", chapters: 31 }, { id: "MAT", name: "Matthew", chapters: 28 }, { id: "JHN", name: "John", chapters: 21 }, { id: "ROM", name: "Romans", chapters: 16 }];
const flat = (part: unknown): string => typeof part === "string" ? part : Array.isArray(part) ? part.map(flat).join(" ") : part && typeof part === "object" ? flat((part as { text?: unknown; content?: unknown }).text ?? (part as { content?: unknown }).content ?? "") : "";

function useSinglePage() {
  const [single, setSingle] = useState(() => typeof window !== "undefined" && window.innerWidth < 760);
  useEffect(() => { const on = () => setSingle(window.innerWidth < 760); addEventListener("resize", on); return () => removeEventListener("resize", on); }, []);
  return single;
}

export function BibleBook({ onClose, startRef }: { onClose: () => void; startRef?: { book: string; chapter: number } }) {
  const single = useSinglePage();
  const [books, setBooks] = useState<Book[]>(FALLBACK_BOOKS);
  const [place, setPlace] = useState<{ book: string; chapter: number }>(() => {
    if (startRef) return startRef;
    try { const p = JSON.parse(localStorage.getItem(KEY) ?? "null"); if (p?.book && p?.chapter) return p; } catch { /* storage optional */ }
    return { book: "JHN", chapter: 3 };
  });
  const [verses, setVerses] = useState<Verse[] | null>(null);
  const [status, setStatus] = useState("");
  const [fallback, setFallback] = useState(false);
  const [pages, setPages] = useState<Verse[][]>([]);
  const [spread, setSpread] = useState(0); // index of the left page shown
  const [contents, setContents] = useState(false);
  const [pickBook, setPickBook] = useState<Book | null>(null);
  const [flip, setFlip] = useState<{ dir: 1 | -1; front: Verse[]; back: Verse[]; then: () => void } | null>(null);
  const measure = useRef<HTMLDivElement>(null);
  const per = single ? 1 : 2;
  const bookName = fallback ? "Psalms" : books.find((b) => b.id === place.book)?.name ?? place.book;
  const chapterNo = fallback ? 23 : place.chapter;

  useEffect(() => {
    fetch("/api/scripture/books?version=KJV").then((r) => r.json()).then((d) => {
      const list = (d.books ?? []).map((b: { id: string; name?: string; commonName?: string; numberOfChapters?: number }) => ({ id: b.id, name: b.commonName || b.name || b.id, chapters: b.numberOfChapters || 50 }));
      if (list.length) setBooks(list);
    }).catch(() => {});
  }, []);
  useEffect(() => {
    let dead = false;
    setVerses(null); setStatus("Opening…");
    try { localStorage.setItem(KEY, JSON.stringify(place)); } catch { /* storage optional */ }
    fetch(`/api/scripture/${place.book}/${place.chapter}?version=KJV`).then(async (r) => {
      const d = await r.json(); if (!r.ok) throw Error(d.error || "unavailable");
      const out: Verse[] = [];
      for (const c of d.chapter?.content ?? []) {
        if (c.type === "heading") out.push({ n: 0, text: flat(c.content), heading: true });
        if (c.type === "verse") out.push({ n: c.number, text: flat(c.content).replace(/\s+/g, " ").trim() });
      }
      if (!dead) { setVerses(out); setStatus(""); setFallback(false); }
    }).catch(() => {
      if (dead) return;
      setVerses(PSALM_23); setFallback(true); setStatus("");
    });
    return () => { dead = true; };
  }, [place]);

  // Paginate: pour verses into a hidden page of the same size until it overflows.
  useLayoutEffect(() => {
    const box = measure.current;
    if (!box || !verses) return;
    const out: Verse[][] = []; let page: Verse[] = [];
    box.innerHTML = "";
    const add = (v: Verse) => {
      const p = document.createElement("p");
      p.className = v.heading ? "bb-h" : "bb-v";
      p.innerHTML = v.heading ? v.text : `<sup>${v.n}</sup>${v.text.replace(/[&<]/g, (c) => (c === "&" ? "&amp;" : "&lt;"))}`;
      box.appendChild(p);
      return p;
    };
    // The first page carries the chapter title.
    const title = document.createElement("h2"); title.className = "bb-title"; title.textContent = "x"; box.appendChild(title);
    for (const v of verses) {
      add(v);
      if (box.scrollHeight > box.clientHeight + 1 && page.length) {
        out.push(page); page = [];
        box.innerHTML = ""; add(v);
      }
      page.push(v);
    }
    if (page.length) out.push(page);
    box.innerHTML = "";
    setPages(out); setSpread(0);
  }, [verses, single]);

  const last = Math.max(0, pages.length - 1);
  const pageAt = (i: number) => pages[i] ?? [];
  const goChapter = useCallback((delta: 1 | -1) => {
    const b = books.find((x) => x.id === place.book);
    const idx = books.findIndex((x) => x.id === place.book);
    if (delta > 0) {
      if (b && place.chapter < b.chapters) setPlace({ book: place.book, chapter: place.chapter + 1 });
      else if (idx >= 0 && idx < books.length - 1) setPlace({ book: books[idx + 1].id, chapter: 1 });
    } else {
      if (place.chapter > 1) setPlace({ book: place.book, chapter: place.chapter - 1 });
      else if (idx > 0) setPlace({ book: books[idx - 1].id, chapter: books[idx - 1].chapters });
    }
  }, [books, place]);
  const turn = useCallback((dir: 1 | -1) => {
    if (flip || contents) return;
    const target = spread + dir * per;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (target > last || target < 0) {
      // Past the end of the chapter: flip into the next (or previous) one.
      const go = () => goChapter(dir);
      if (reduced) return go();
      setFlip({ dir, front: dir > 0 ? pageAt(spread + per - 1) : pageAt(spread), back: [], then: go });
      return;
    }
    if (reduced) { setSpread(target); return; }
    setFlip({ dir, front: single && dir < 0 ? pageAt(target) : dir > 0 ? pageAt(spread + per - 1) : pageAt(spread), back: dir > 0 ? pageAt(target) : pageAt(target + per - 1), then: () => setSpread(target) });
  }, [flip, contents, spread, per, last, goChapter, pages]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); if (contents) setContents(false); else onClose(); }
      if (e.key === "ArrowRight") { e.preventDefault(); turn(1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); turn(-1); }
    };
    window.addEventListener("keydown", k, true); return () => window.removeEventListener("keydown", k, true);
  }, [turn, onClose, contents]);

  const Page = ({ v, i, side }: { v: Verse[]; i: number; side: "left" | "right" }) => (
    <div className={`bb-page bb-${side}`}>
      {i === 0 && <h2 className="bb-title">{bookName} {chapterNo}</h2>}
      {v.map((x, k) => x.heading ? <p key={k} className="bb-h">{x.text}</p> : <p key={k} className="bb-v"><sup>{x.n}</sup>{x.text}</p>)}
      <span className="bb-folio">{i < pages.length ? `${bookName} ${chapterNo} · ${i + 1}` : ""}</span>
    </div>
  );

  // Swipe to turn on touch screens.
  const touch = useRef<number | null>(null);
  return (
    <div className="bb-backdrop" role="dialog" aria-modal="true" aria-label={`Bible: ${bookName} ${place.chapter}`} onTouchStart={(e) => { touch.current = e.touches[0].clientX; }} onTouchEnd={(e) => { if (touch.current === null) return; const dx = e.changedTouches[0].clientX - touch.current; if (Math.abs(dx) > 50) turn(dx < 0 ? 1 : -1); touch.current = null; }}>
      <div className="bb-bar">
        <button onClick={() => { setContents(true); setPickBook(null); }}>Contents</button>
        <b>{bookName} {chapterNo} <small>KJV{fallback ? " · offline" : ""}</small></b>
        <button onClick={onClose} aria-label="Close the Bible">Close</button>
      </div>
      <div className={single ? "bb-book bb-single" : "bb-book"}>
        <i className="bb-ribbon" aria-hidden />
        {contents ? (
          <div className="bb-contents">
            {!pickBook ? <>
              <h2 className="bb-title">Contents</h2>
              <div className="bb-books">{books.map((b, i) => <button key={b.id} className={i === 39 ? "bb-nt" : ""} onClick={() => setPickBook(b)}>{b.name}</button>)}</div>
            </> : <>
              <h2 className="bb-title">{pickBook.name}</h2>
              <div className="bb-chapters">{Array.from({ length: pickBook.chapters }, (_, i) => <button key={i} onClick={() => { setPlace({ book: pickBook.id, chapter: i + 1 }); setContents(false); }}>{i + 1}</button>)}</div>
              <button className="bb-link" onClick={() => setPickBook(null)}>‹ All books</button>
            </>}
          </div>
        ) : !verses ? <div className="bb-page bb-left bb-loading"><p>{status}</p></div> : <>
          <Page v={pageAt(spread)} i={spread} side="left" />
          {!single && <Page v={pageAt(spread + 1)} i={spread + 1} side="right" />}
          {flip && <div className={`bb-leaf bb-leaf-${flip.dir > 0 ? "fwd" : "back"}`} onAnimationEnd={() => { const f = flip; setFlip(null); f.then(); }}>
            <div className="bb-face bb-front">{flip.front.map((x, k) => x.heading ? <p key={k} className="bb-h">{x.text}</p> : <p key={k} className="bb-v"><sup>{x.n}</sup>{x.text}</p>)}</div>
            <div className="bb-face bb-back">{flip.back.map((x, k) => x.heading ? <p key={k} className="bb-h">{x.text}</p> : <p key={k} className="bb-v"><sup>{x.n}</sup>{x.text}</p>)}</div>
          </div>}
        </>}
        {/* Hidden page used to measure how many verses fit. */}
        <div ref={measure} className="bb-page bb-measure" aria-hidden />
      </div>
      {!contents && <div className="bb-nav">
        <button onClick={() => turn(-1)} aria-label="Previous page">‹</button>
        <span>{status || `Page ${Math.min(pages.length, spread + 1)}${per > 1 && spread + 2 <= pages.length ? `–${spread + 2}` : ""} of ${pages.length}`}</span>
        <button onClick={() => turn(1)} aria-label="Next page">›</button>
      </div>}
    </div>
  );
}
