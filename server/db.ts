import { createDb, type Db } from "../db/client";

// One client per function instance: the module stays loaded between invocations
// of a warm function, so later requests reuse it.
let db: Db | undefined;

export function getDb(): Db {
  db ??= createDb();
  return db;
}
