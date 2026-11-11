// Live Kharis Church updates for Kairos World: the latest message and branch list from kharis.org.
// kharis.org publishes no feed, so this reads the public home page, keeps only plain facts,
// and caches for an hour. The game falls back to its bundled notices when this is unavailable.
const SOURCE = 'https://kharis.org/';
const BRANCH_SLUGS = ['london','birmingham','brighton','bristol','chatham','chelmsford','coventry','croydon','luton','manchester','northampton','nottingham','orpington','reading'];
const clean = (s) => s.replace(/<[^>]*>/g, ' ').replace(/&#8217;|&rsquo;/g, "'").replace(/&amp;/g, '&').replace(/&#8211;|&ndash;/g, '–').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
export function parseKharisHome(html) {
  const video = /youtube\.com\/watch\?v=([\w-]{11})/.exec(html)?.[1] ?? /youtu\.be\/([\w-]{11})/.exec(html)?.[1] ?? /youtube(?:-nocookie)?\.com\/embed\/([\w-]{11})/.exec(html)?.[1] ?? null;
  let title = null;
  if (video) {
    const at = html.search(new RegExp(video));
    const around = html.slice(Math.max(0, at - 1500), at + 600);
    const heads = [...around.matchAll(/<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/gi)].map((m) => clean(m[1])).filter((t) => t && t.length < 90 && !/latest message/i.test(t));
    title = heads.at(-1) ?? null;
  }
  const branches = BRANCH_SLUGS.filter((slug) => new RegExp(`kharis\\.org/${slug}/?["']`, 'i').test(html));
  const notices = [];
  if (/spurgeon/i.test(html)) notices.push({ title: "Kharis's new home", detail: "Kharis has acquired the former Spurgeon's College and is restoring it.", href: 'https://spurgeonscentre.org/' });
  return { source: SOURCE, latestMessage: video ? { video, title: title ?? 'Latest message', href: `https://www.youtube.com/watch?v=${video}` } : null, branches, notices };
}
export async function handleKharisUpdates(request, fetcher = fetch) {
  if (request.method !== 'GET') return Response.json({ error: 'Use GET.' }, { status: 405 });
  try {
    const res = await fetcher(SOURCE, { headers: { accept: 'text/html' }, signal: AbortSignal.timeout(8000), redirect: 'follow' });
    if (!res.ok) throw Error('upstream');
    const html = (await res.text()).slice(0, 600_000);
    return Response.json({ ...parseKharisHome(html), fetchedAt: new Date().toISOString() }, { headers: { 'Cache-Control': 'public, max-age=3600' } });
  } catch {
    return Response.json({ error: 'kharis.org is unavailable right now.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
