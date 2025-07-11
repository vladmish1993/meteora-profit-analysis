import ClmmDb, {
  ClmmDbTx,
} from "@vladmish1993/meteora-dlmm-db/dist/clmm-db";
import initSqlJs, { type Database } from "sql.js";
import pkg from "../../package.json" assert { type: "json" };
import Dexie, { Table } from "dexie";
import { delay } from "@/services/util";

declare var self: Worker;

let db: Dexie;
let table: Table;
let sql: initSqlJs.SqlJsStatic;
/**
 * sql.js is loaded from the CDN. Keep this version in sync with the
 * dependency declared in package.json to avoid mismatches.
 */
const SQL_JS_VERSION = pkg.dependencies["sql.js"].replace("^", "");

async function init() {
  if (!db) {
    db = new Dexie("meteora-dlmm-db");
    db.version(1).stores({
      db: "id",
    });
    table = db.table("db");
    sql = await initSqlJs({
      locateFile: (file) =>
        `https://cdnjs.cloudflare.com/ajax/libs/sql.js/${SQL_JS_VERSION}/${file}`,
    });
  }
}

export interface DataWorkerMessage {
  transactions: ClmmDbTx[];
}

async function readData(walletAddress: string) {
  await init();
  const record = await table.get(1);
  const transactions: ClmmDbTx[] = [];
  if (record?.data) {
    const db = new sql.Database(record?.data);
    const statement = db.prepare(`
      SELECT * FROM v_transactions where owner_address = '${
        walletAddress
      }' and position_is_open = 0
    `);
    while (statement.step())
      transactions.push(statement.getAsObject() as ClmmDbTx);
    db.close();
    self.postMessage(
      transactions.filter((tx) => tx.owner_address == walletAddress),
    );
  } else {
    self.postMessage(transactions);
  }
}

self.onmessage = async (event: MessageEvent<string>) => {
  readData(event.data);
};

export default self;
