// On-demand reader: existing game questions and answer keys remain available offline.
const STORE = 'kairos-scripture-web-v1';
export async function loadScripture(reference, {fetcher = fetch, storage = globalThis.localStorage} = {}) {
  let saved = {};
  try { saved = JSON.parse(storage.getItem(STORE) || '{}') || {}; } catch {}
  const key = reference.trim().toLowerCase();
  if (saved[key]?.translationId === 'web' && typeof saved[key].text === 'string') return {...saved[key], saved: true};
  const response = await fetcher('/api/scripture?reference=' + encodeURIComponent(reference), {signal: AbortSignal.timeout(10000)});
  const passage = await response.json();
  if (!response.ok) throw Error(passage.error || 'Passage unavailable. Please retry.');
  if (passage.translationId !== 'web' || typeof passage.text !== 'string') throw Error('Invalid passage. Please retry.');
  try { storage.setItem(STORE, JSON.stringify(Object.fromEntries([...Object.entries(saved).slice(-39), [key, passage]]))); } catch {}
  return passage;
}
export function installScriptureReader(app) {
  const mount = () => {
    const main = app.querySelector('main');
    if (!main || main.querySelector('[data-scripture-reader]')) return;
    const panel = document.createElement('details');
    panel.dataset.scriptureReader = '';
    panel.className = 'scripture-reader';
    panel.innerHTML = `<summary>Read Scripture</summary><p>Look up the passage for your game. World English Bible (WEB); wording may differ from the KJV quotations in games.</p><form><label>Bible reference <input name="reference" placeholder="John 3:16-18" required maxlength="100" autocomplete="off"></label><button class="secondary" type="submit">Read passage</button></form><p role="status" aria-live="polite"></p><blockquote hidden></blockquote><small>Free Scripture from <a href="https://bible-api.com" target="_blank" rel="noopener noreferrer">bible-api.com</a> · WEB public domain. Previously read passages are saved on this device when storage is available.</small>`;
    const form = panel.querySelector('form'), status = panel.querySelector('[role=status]'), quote = panel.querySelector('blockquote'), button = panel.querySelector('button');
    panel.addEventListener('toggle', () => {
      if (!panel.open || form.elements.reference.value) return;
      const match = main.querySelector('#stage')?.textContent.match(/(?:[1-3]\s+)?(?:Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|Samuel|Kings|Chronicles|Ezra|Nehemiah|Esther|Job|Psalms?|Proverbs|Ecclesiastes|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|Romans|Corinthians|Galatians|Ephesians|Philippians|Colossians|Thessalonians|Timothy|Titus|Philemon|Hebrews|James|Peter|Jude|Revelation)\s+\d+(?::\d+(?:[–-]\d+)?)?/i);
      if (match) form.elements.reference.value = match[0];
    });
    form.addEventListener('submit', async event => {
      event.preventDefault(); button.disabled = true; quote.hidden = true; status.textContent = 'Loading Scripture…';
      try {
        let storage; try {storage = localStorage;} catch {storage = {getItem:()=>null,setItem:()=>{}};}
        const passage = await loadScripture(form.elements.reference.value, {storage});
        quote.textContent = passage.text;
        const cite = document.createElement('cite'); cite.textContent = `${passage.reference} · World English Bible`; quote.append(cite); quote.hidden = false;
        status.textContent = passage.saved ? 'Saved passage — available offline.' : 'Passage ready.';
      } catch (error) { status.textContent = error.message === 'Failed to fetch' ? 'You are offline. Previously read references still work; reconnect to load a new passage.' : error.message; }
      finally {button.disabled = false;}
    });
    main.append(panel);
  };
  new MutationObserver(mount).observe(app, {childList:true, subtree:true});
  mount();
}
