"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { recordKairosActivity } from "@/lib/game/kairos-activity";

type Book = { id: string; commonName: string; numberOfChapters: number };
type ContentItem = { type: string; number?: number; content?: unknown[] };
type Chapter = { copyright?: string; book: { commonName: string }; chapter: { number: number; content: ContentItem[] }; nextChapterApiLink: string | null; previousChapterApiLink: string | null };
const plain = (items: unknown[] = []) => items.map((item) => {
  if (typeof item === "string") return item;
  if (item && typeof item === "object" && "text" in item) return String((item as { text: unknown }).text);
  return "";
}).join("");

export function BibleReader({ compact = false }: { compact?: boolean }) {
  const [version, setVersion] = useState<"KJV" | "NKJV">("KJV");
  const [books, setBooks] = useState<Book[]>([]);
  const [bookId, setBookId] = useState("JHN");
  const [chapterNumber, setChapterNumber] = useState(3);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const selected = books.find((book) => book.id === bookId);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/scripture/books", { signal: controller.signal })
      .then(async (r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data: { books?: Book[] }) => setBooks(data.books ?? []))
      .catch(() => { if (!controller.signal.aborted) setError("The Bible catalogue could not load. Check your connection and try again."); });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setChapter(null);
    void fetch(`/api/scripture/${encodeURIComponent(bookId)}/${chapterNumber}?version=${version}`, { signal: controller.signal })
      .then(async (r) => { const data=await r.json();if (!r.ok) throw new Error(data.error??"This chapter could not load.");return data; })
      .then((data: Chapter) => { setChapter(data); void recordKairosActivity("bible_read"); })
      .catch((error: unknown) => { if (!controller.signal.aborted) { setChapter(null); setError(error instanceof Error?error.message:"This chapter could not load. Please try again."); } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [bookId, chapterNumber, version]);

  const go = (direction: -1 | 1) => {
    if (!selected) return;
    const next = chapterNumber + direction;
    if (next >= 1 && next <= selected.numberOfChapters) setChapterNumber(next);
    else if (direction === 1) {
      const index = books.findIndex((book) => book.id === selected.id);
      const nextBook = books[index + 1];
      if (nextBook) { setBookId(nextBook.id); setChapterNumber(1); }
    } else if (direction === -1) {
      const index = books.findIndex((book) => book.id === selected.id);
      const previousBook = books[index - 1];
      if (previousBook) { setBookId(previousBook.id); setChapterNumber(previousBook.numberOfChapters); }
    }
  };

  return (
    <section className={compact ? "rounded-2xl bg-[#fffdf8] p-4 text-[#20172b]" : "rounded-3xl border border-[#dfd2bd] bg-[#fffdf8] p-5 text-[#20172b] shadow-sm sm:p-8"}>
      <div className="flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor="bible-version">Bible version</label>
        <select id="bible-version" value={version} onChange={e=>setVersion(e.target.value as "KJV"|"NKJV")} className="min-h-11 rounded-xl border border-[#d8cbb6] bg-white px-3 font-bold text-[#20172b]"><option value="KJV">KJV</option><option value="NKJV">NKJV</option></select>
        <label className="sr-only" htmlFor="bible-book">Bible book</label>
        <select id="bible-book" value={bookId} onChange={(e) => { setBookId(e.target.value); setChapterNumber(1); }} className="min-h-11 max-w-[65%] rounded-xl border border-[#d8cbb6] bg-white px-3 font-bold text-[#20172b]">
          {(books.length ? books : [{ id: "JHN", commonName: "John", numberOfChapters: 21 }]).map((book) => <option key={book.id} value={book.id}>{book.commonName}</option>)}
        </select>
        <label className="sr-only" htmlFor="bible-chapter">Chapter</label>
        <select id="bible-chapter" value={chapterNumber} onChange={(e) => setChapterNumber(Number(e.target.value))} className="min-h-11 rounded-xl border border-[#d8cbb6] bg-white px-3 font-bold text-[#20172b]">
          {Array.from({ length: selected?.numberOfChapters ?? 21 }, (_, i) => <option key={i + 1} value={i + 1}>Chapter {i + 1}</option>)}
        </select>
      </div>
      <div className="mt-5 max-h-[58dvh] space-y-3 overflow-y-auto pr-1" aria-live="polite">
        {loading && <p className="py-8 text-center text-sm text-[#65596d]">Loading scripture…</p>}
        {error && <p role="alert" className="rounded-xl bg-[#fff0e8] p-4 text-sm text-[#783b26]">{error}</p>}
        {!loading && error && version === "NKJV" && <a href={`https://www.biblegateway.com/passage/?search=${encodeURIComponent(`${selected?.commonName ?? "John"} ${chapterNumber}`)}&version=NKJV`} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center rounded-full bg-[#7049a8] px-5 text-sm font-black text-white">Read this chapter in NKJV ↗</a>}
        {!loading && chapter?.chapter.content.map((item, index) => item.type === "heading" ? <h3 key={`h-${index}`} className="pt-3 font-black text-[#7049a8]">{plain(item.content)}</h3> : item.type === "verse" ? <p key={`v-${item.number}`} className="leading-7"><sup className="mr-1 font-bold text-[#8f7433]">{item.number}</sup>{plain(item.content)}</p> : null)}
      </div>
      <div className="mt-5 flex items-center justify-between border-t border-[#e5dac9] pt-4">
        <button type="button" onClick={() => go(-1)} disabled={loading} className="inline-flex min-h-11 items-center gap-1 rounded-full px-3 font-bold text-[#7049a8] hover:bg-[#f4eef9] disabled:opacity-40"><ChevronLeft className="size-4"/>Previous</button>
        <p className="text-xs text-[#65596d]">{version === "KJV"?"King James Version":"New King James Version"}</p>
        <button type="button" onClick={() => go(1)} disabled={loading} className="inline-flex min-h-11 items-center gap-1 rounded-full px-3 font-bold text-[#7049a8] hover:bg-[#f4eef9] disabled:opacity-40">Next<ChevronRight className="size-4"/></button>
      </div>
      {chapter?.copyright && <p className="mt-3 text-[10px] leading-relaxed text-[#65596d]">{chapter.copyright}</p>}
    </section>
  );
}
