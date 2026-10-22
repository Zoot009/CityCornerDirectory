import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { Pool, types } from "pg";
import { env } from "@/lib/env";

// numeric (rating, score) and bigint (ids, counts) arrive as strings by default.
types.setTypeParser(types.builtins.NUMERIC, Number);
types.setTypeParser(types.builtins.INT8, Number);

// Supabase signs its database certificates with its own CA. Pinning it gives verified TLS
// (like sslmode=verify-full). Download it from Dashboard > Database settings > SSL configuration
// into certs/; Supabase's file name (prod-ca-2021.crt) works as is.
const CERT_DIR = path.join(process.cwd(), "certs");
const CA_FILES = ["supabase-ca.crt", "prod-ca-2021.crt"].map((f) => path.join(CERT_DIR, f));

// One small pool per login per server process, reused across dev reloads. Created on first query, so
// importing this module (tests, type generation) needs no database.
type Login = "WEB_DATABASE_URL" | "WRITE_DATABASE_URL";
const g = globalThis as unknown as { pools?: Partial<Record<Login, Pool>> };

function pool(login: Login) {
  g.pools ??= {};
  if (g.pools[login]) return g.pools[login];
  const url = env[login];
  if (!url) throw new Error(`${login} is not set`);
  const local = ["localhost", "127.0.0.1"].includes(new URL(url).hostname);
  const caFile = CA_FILES.find((f) => existsSync(f));
  if (!local && !caFile) {
    throw new Error(
      `Database CA certificate missing: download it from Supabase (Database settings > SSL configuration) and put it in ${CERT_DIR}.`,
    );
  }
  // A build holds one connection (see next.config.ts): the sister sites share 15 session-pooler slots.
  // Forms are rare, so the write login gets one too.
  const max = process.env.NEXT_PHASE === "phase-production-build" || login === "WRITE_DATABASE_URL" ? 1 : 4;
  g.pools[login] = new Pool({ connectionString: url, max, ssl: caFile && !local ? { ca: readFileSync(caFile, "utf8") } : undefined });
  return g.pools[login];
}

export async function sql<T>(text: string, params: unknown[] = []): Promise<T[]> {
  return (await pool("WEB_DATABASE_URL").query(text, params)).rows as T[];
}

// Form submissions only: a separate login that can add to the inbox tables but can't touch listings.
export async function write(text: string, params: unknown[] = []) {
  await pool("WRITE_DATABASE_URL").query(text, params);
}
