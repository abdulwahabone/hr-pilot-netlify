import { getDatabase } from "@netlify/database";
import { drizzle as drizzleNeonHttp } from "drizzle-orm/neon-http";
import { drizzle as drizzleNodePg, type NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

export type Db = NodePgDatabase<typeof schema>;

// Netlify Database hands out the connection for wherever the code runs: the
// production database or a deploy preview's branch when deployed, and the local
// database that `netlify dev` starts. No connection string to configure.
//
// Deployed functions get the "serverless" driver (queries over Neon's HTTP API);
// `netlify dev` gets the "server" driver (a regular pg pool). This is the same
// split drizzle-orm's own `netlify-db` driver makes. The functions only run single
// statements, never interactive transactions, so both behave the same for them.
export function createDb(): Db {
  const connection = getDatabase();
  if (connection.driver === "serverless") {
    return drizzleNeonHttp({ client: connection.httpClient, schema }) as unknown as Db;
  }
  return drizzleNodePg({ client: connection.pool, schema });
}
