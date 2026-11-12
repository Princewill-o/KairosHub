import postgres from "postgres";
import { createPostgresFamilyDb } from "../../../server/family-postgres.mjs";
import { createFamilyEdgeHandler } from "../../../server/family-edge.mjs";
import { createResendMailer } from "../../../server/emails.mjs";
const connection = Deno.env.get("SUPABASE_DB_URL");
if (!connection) throw Error("Family database connection is not configured.");
// Reuse a bounded pool for this isolate. Supabase keeps database credentials in
// the function environment; none are bundled into the browser or Worker.
const sql = postgres(connection, {
  prepare: false,
  max: 1,
  idle_timeout: 10,
  connect_timeout: 8,
  ssl: "require",
});
const origins = [
  "http://localhost:4173",
  "http://127.0.0.1:4173",
  "https://kairos-story-games.packzpackz50.chatgpt.site",
  ...(Deno.env.get("KAIROS_ALLOWED_ORIGINS") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
];
Deno.serve(
  createFamilyEdgeHandler({
    DB: createPostgresFamilyDb(sql),
    // Verification and welcome emails go out when RESEND_API_KEY and KAIROS_MAIL_FROM are set.
    MAIL: createResendMailer(Deno.env.get("RESEND_API_KEY"), Deno.env.get("KAIROS_MAIL_FROM")),
  }, origins),
);
