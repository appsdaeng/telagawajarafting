import postgres from "postgres";

/**
 * Postgres connection for the portal and the booking API.
 *
 * Uses the `postgres` driver rather than an ORM: it is a single small package
 * with no codegen or native engine, which keeps the Vercel build predictable.
 * The schema lives in `db/schema.sql` and is applied to the database, so the SQL
 * in `lib/` is the source of truth for queries too.
 *
 * The connection is created lazily and never at import time, so `next build`
 * succeeds with no DATABASE_URL set — the portal reports that it is not
 * configured instead of failing the public site's deploy.
 */
const connectionString = process.env.DATABASE_URL?.trim() ?? "";

export const databaseConfigured = connectionString.length > 0;

function sslFor(url: string) {
  if (/localhost|127\.0\.0\.1/.test(url)) {
    return false as const;
  }

  // Supabase (and every hosted Postgres) requires TLS.
  return "require" as const;
}

const globalForDb = globalThis as unknown as {
  twrSql?: ReturnType<typeof postgres>;
};

export const sql =
  globalForDb.twrSql ??
  postgres(connectionString || "postgresql://unconfigured:unconfigured@127.0.0.1:5432/unconfigured", {
    max: 3,
    idle_timeout: 20,
    connect_timeout: 10,
    // Supabase's pooler runs in transaction mode, which cannot reuse prepared
    // statements across requests.
    prepare: false,
    ssl: connectionString ? sslFor(connectionString) : false,
    onnotice: () => {},
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.twrSql = sql;
}
