// The existing family service uses a small D1-shaped interface. Bind its static
// statements to Postgres without accepting SQL from HTTP clients.
const tables = [
  "family_accounts",
  "family_children",
  "family_sessions",
  "learning_results",
  "family_auth_limits",
];
const numeric = new Set([
  "runs",
  "best",
  "last",
  "completed_at",
  "created_at",
  "expires_at",
  "count",
  "n",
  "consent_at",
  "updated_at",
]);
export function postgresQuery(statement) {
  let index = 0;
  return statement
    .replace(
      /substr\(datetime\(completed_at \/ 1000, 'unixepoch'\),1,10\)/g,
      "to_char(to_timestamp(completed_at / 1000.0) AT TIME ZONE 'UTC', 'YYYY-MM-DD')",
    )
    .replace(
      new RegExp("\\b(" + tables.join("|") + ")\\b", "g"),
      "kairos_games.$1",
    )
    .replace(/\?/g, () => "$" + ++index);
}
const normalize = (row) =>
  row
    ? Object.fromEntries(
        Object.entries(row).map(([key, value]) => [
          key,
          numeric.has(key) && typeof value === "string" && /^-?\d+$/.test(value)
            ? Number(value)
            : value,
        ]),
      )
    : null;
export function createPostgresFamilyDb(sql) {
  return {
    prepare(statement) {
      const query = postgresQuery(statement);
      return {
        bind(...values) {
          const execute = () => sql.unsafe(query, values);
          return {
            async first() {
              const rows = await execute();
              return normalize(rows[0]);
            },
            async all() {
              return { results: (await execute()).map(normalize) };
            },
            async run() {
              const rows = await execute();
              return { meta: { changes: rows.count ?? rows.length } };
            },
          };
        },
      };
    },
  };
}
