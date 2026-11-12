import { handleFamily } from "./family.mjs";
import { createResendMailer } from "./emails.mjs";
export const SUPABASE_FAMILY_URL =
  "https://yrqkafiqwllkphroztqk.supabase.co/functions/v1/kairos-family";
const json = (error, status) =>
  Response.json(
    { error },
    { status, headers: { "Cache-Control": "no-store" } },
  );
export async function handleFamilyBackend(request, env = {}, fetcher = fetch) {
  if (env.FAMILY_BACKEND === "d1") return handleFamily(request, { ...env, MAIL: createResendMailer(env.RESEND_API_KEY, env.KAIROS_MAIL_FROM) });
  const url = new URL(request.url);
  if (!["GET", "POST"].includes(request.method))
    return json("Method not allowed.", 405);
  if (request.method === "POST" && request.headers.get("origin") !== url.origin)
    return json("Origin not allowed.", 403);
  const headers = new Headers({
    "Content-Type": "application/json",
    Origin: url.origin,
  });
  const cookie = (request.headers.get("cookie") || "")
    .split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith("kairos_family="));
  if (cookie) headers.set("cookie", cookie);
  let body;
  if (request.method === "POST") {
    if (Number(request.headers.get("content-length")) > 8192)
      return json("Request too large.", 413);
    body = await request.text();
    if (body.length > 8192) return json("Request too large.", 413);
  }
  try {
    const response = await fetcher(SUPABASE_FAMILY_URL + url.pathname, {
      method: request.method,
      headers,
      body,
      signal: AbortSignal.timeout(12000),
      redirect: "manual",
    });
    if (response.status >= 300 && response.status < 400)
      throw Error("Unexpected family redirect");
    if (!response.headers.get("content-type")?.includes("application/json"))
      throw Error("Invalid family response");
    const outgoing = new Headers({
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    });
    const cookies =
      typeof response.headers.getSetCookie === "function"
        ? response.headers.getSetCookie()
        : typeof response.headers.getAll === "function"
          ? response.headers.getAll("Set-Cookie")
          : [response.headers.get("set-cookie") || ""];
    const session = cookies
      .flatMap((value) => value.split(/,(?=\s*[^;,=]+=)/))
      .map((value) => value.trim())
      .find((value) => value.startsWith("kairos_family="));
    if (session?.startsWith("kairos_family="))
      outgoing.set("set-cookie", session);
    return new Response(await response.text(), {
      status: response.status,
      headers: outgoing,
    });
  } catch (error) {
    console.error("Family upstream unavailable", error.name, error.message);
    return json(
      "Family saves are temporarily unavailable. Your device copy is still available; please retry.",
      503,
    );
  }
}
