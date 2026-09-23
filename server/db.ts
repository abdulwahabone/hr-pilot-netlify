import { createDb, type Db } from "../db/client";

// One postgres-js pool per function instance: the module stays loaded between
// invocations of a warm function, so later requests reuse the open connection.
let db: Db | undefined;

export function getDb(): Db {
  db ??= createDb({ max: 3, idle_timeout: 20, connect_timeout: 10 }).db;
  return db;
}
