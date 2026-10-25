import { handleFamily } from "./family.mjs";
// The public function keeps the existing password and scoped-session checks.
// Supabase project credentials are never returned to the caller.
export function createFamilyEdgeHandler(env, allowedOrigins) {
  const origins = new Set(allowedOrigins);
  return async (request) => {
    const origin = request.headers.get("origin");
    const json = (error, status) =>
      Response.json(
        { error },
        { status, headers: { "Cache-Control": "no-store" } },
      );
    if (!origins.has(origin)) return json("Origin not allowed.", 403);
    const path = new URL(request.url).pathname;
    const match = path.match(
      /^\/(?:functions\/v1\/)?kairos-family(\/api\/family(?:\/.*)?)$/,
    );
    if (!match) return json("Not found.", 404);
    const headers = new Headers({
      "Content-Type": "application/json",
      Origin: origin,
    });
    const cookie = request.headers.get("cookie");
    if (cookie) headers.set("cookie", cookie);
    // This comes from the Supabase gateway; do not use browser identity headers.
    const ip = request.headers
      .get("x-forwarded-for")
      ?.split(",")
      .at(-1)
      ?.trim();
    if (ip) headers.set("cf-connecting-ip", ip);
    let body;
    if (request.method === "POST") {
      if (Number(request.headers.get("content-length")) > 8192)
        return json("Request too large.", 413);
      body = await request.text();
      if (body.length > 8192) return json("Request too large.", 413);
    }
    const forwarded = new Request(origin + match[1], {
      method: request.method,
      headers,
      body,
    });
    return handleFamily(forwarded, env);
  };
}
