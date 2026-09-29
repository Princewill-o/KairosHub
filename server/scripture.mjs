// Fixed upstream: never proxy arbitrary URLs supplied by a client.
export async function handleScripture(request, fetcher = fetch) {
  const json = (body, status = 200) => Response.json(body, {status, headers: {'Cache-Control': status === 200 ? 'public, max-age=86400' : 'no-store'}});
  if (request.method !== 'GET') return json({error: 'Use GET.'}, 405);
  const reference = (new URL(request.url).searchParams.get('reference') || '').replace(/\s*\(KJV\)\s*$/i, '').replace(/[–—]/g, '-').trim();
  if (reference.length > 100 || !/^(?:[1-3]\s+)?[A-Za-z]+(?:\s+[A-Za-z]+){0,3}\s+\d{1,3}(?::\d{1,3}(?:-\d{1,3})?)?$/.test(reference)) return json({error: 'Enter one chapter or verse range, for example John 3:16-18.'}, 400);
  const url = new URL('https://bible-api.com/' + encodeURIComponent(reference));
  url.searchParams.set('translation', 'web');
  url.searchParams.set('single_chapter_book_matching', 'indifferent');
  try {
    const cache = fetcher === fetch ? globalThis.caches?.default : null;
    const key = new Request(url);
    const cached = await cache?.match(key);
    if (cached) return cached;
    const response = await fetcher(url, {signal: AbortSignal.timeout(8000)});
    if (!response.ok) return json({error: response.status === 429 ? 'Bible service is busy. Please wait 30 seconds and try again.' : 'Passage unavailable. Check the reference and try again.'}, response.status === 429 ? 429 : response.status === 404 ? 404 : 502);
    const data = await response.json();
    if (data.translation_id !== 'web' || typeof data.text !== 'string' || !data.text.trim() || data.text.length > 100000 || !Array.isArray(data.verses) || typeof data.reference !== 'string') return json({error: 'Bible service returned an invalid passage. Please retry.'}, 502);
    const result = json({reference: data.reference, text: data.text.trim(), translation: 'World English Bible', translationId: 'web', source: 'https://bible-api.com', license: 'Public domain'});
    try { await cache?.put(key, result.clone()); } catch {} // Cache failures must not hide Scripture.
    return result;
  } catch { return json({error: 'Cannot reach the Bible service. Try again when connected.'}, 503); }
}
