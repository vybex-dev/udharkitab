/**
 * lib/db.js
 * All SQLite operations for UdharKitab.
 * Uses expo-sqlite v16 (async API — SDK 54).
 *
 * Migration order fix:
 *  1. Create base tables (no indexes on migrated columns)
 *  2. ALTER TABLE to add any missing columns
 *  3. Create indexes (safe now that all columns exist)
 *
 */

import * as SQLite from "expo-sqlite";
import {
  pushCustomerBundle,
  deleteCustomerCloud,
  pushAllCustomersToCloud,
  pullAllCustomersFromCloud,
  deleteAllCloudCustomerData,
} from "./cloudSync";

const META_KEY_CLOUD_SYNC_ENABLED = "cloud_sync_enabled";

let _dbPromise = null;
let _db = null; // resolved db instance for health checks

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isLockedError(e) {
  const msg = String(e?.message || e || "");
  return msg.includes("database is locked") || msg.includes("SQLITE_BUSY");
}

/**
 * Opens the DB and runs migrations, retrying a few times if SQLite reports
 * "database is locked". This shows up almost exclusively right after the
 * app process was killed abruptly (e.g. a native library force-exiting the
 * app, or Android reclaiming memory) while a WAL checkpoint or transaction
 * was mid-flight — the OS can take a moment to fully release the previous
 * process's file lock. It's transient and resolves itself within a second
 * or two; retrying beats surfacing a scary error on first launch.
 */
async function openAndMigrate() {
  const attempts = 5;
  for (let i = 0; i < attempts; i++) {
    try {
      const db = await SQLite.openDatabaseAsync("udharkitab.db");
      await db.execAsync(`PRAGMA journal_mode = WAL;`);
      await createTables(db);
      return db;
    } catch (e) {
      if (!isLockedError(e) || i === attempts - 1) throw e;
      console.warn(
        `openDB: database locked, retrying (${i + 1}/${attempts})...`,
      );
      await sleep(300 * (i + 1));
    }
  }
}

export function openDB() {
  if (!_dbPromise) {
    _dbPromise = (async () => {
      const db = await openAndMigrate();
      _db = db;
      return db;
    })().catch((err) => {
      _dbPromise = null;
      _db = null;
      throw err;
    });
  }
  return _dbPromise;
}

/**
 * Call this to fully reset the DB singleton — e.g. after a hot reload or
 * when the native object has been released. Safe to call multiple times.
 */
export async function closeDB() {
  const promise = _dbPromise;
  _dbPromise = null;
  _db = null;
  if (promise) {
    try {
      const db = await promise;
      await db.closeAsync();
    } catch {
      // already closed / released — ignore
    }
  }
}

/**
 * Returns a healthy DB connection.
 * If the existing connection's native handle has been released (Android
 * "shared object already released" crash), it resets the singleton and
 * opens a fresh connection automatically.
 */
export async function getDB() {
  // Fast path: promise exists, try it
  if (_dbPromise) {
    try {
      const db = await _dbPromise;
      // Probe the connection with a no-op to detect a released handle
      await db.getFirstAsync(`SELECT 1;`);
      return db;
    } catch (e) {
      // Native handle released or connection broken — reset and fall through
      _dbPromise = null;
      _db = null;
    }
  }
  // Slow path: open a fresh connection
  return openDB();
}

export async function initDB() {
  await openDB();
}

/**
 * Recognizes the native-handle-died-mid-query error shape — e.g.
 * "NativeDatabase.prepareAsync has been rejected... received class
 * java.lang.Integer" or "SharedObject... already released". getDB()'s own
 * SELECT-1 probe only catches a dead handle *before* a query starts; if the
 * handle dies in the gap between that probe succeeding and the real query
 * actually running (common under Fast Refresh, or when several queries fire
 * concurrently via Promise.all right after a cold start), the failure shows
 * up here instead, as a raw native crash rather than a normal JS rejection.
 */
function isStaleConnectionError(e) {
  const msg = String(e?.message || e || "");
  return (
    msg.includes("NativeDatabase") ||
    msg.includes("SharedObject") ||
    msg.includes("has been rejected") ||
    msg.includes("already released") ||
    msg.includes("cannot be cast") ||
    msg.includes("NullPointerException") ||
    isLockedError(e)
  );
}

/**
 * Runs `fn` against a healthy db connection, and — only for the stale-handle
 * error shape above — drops the connection and retries exactly once against
 * a freshly opened one. Any other error (a real SQL bug, a constraint
 * violation, etc.) passes straight through; this is specifically for the
 * native-handle-died class of failure, not a general retry-everything net.
 */
export async function withDb(fn) {
  const db = await getDB();
  try {
    return await fn(db);
  } catch (e) {
    if (!isStaleConnectionError(e)) throw e;
    console.warn(
      "withDb: stale native connection detected mid-query, retrying once:",
      e?.message || e,
    );
    await closeDB();
    const freshDb = await getDB();
    return fn(freshDb);
  }
}

async function createTables(db) {
  // ── Step 1: Create base tables ────────────────────────────────────────────
  // Only the columns that existed from day-one — no migrated columns here.
  // This way CREATE TABLE IF NOT EXISTS on an old DB won't try to add columns
  // that don't exist yet, and the statements below won't reference them early.
  //
  // `payments` + `payment_allocations` are new but have no migrated columns
  // of their own, so they're safe to create here in Step 1 — they just
  // reference entries(id)/customers(id), which already exist above.
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS customers (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL COLLATE NOCASE,
      phone       TEXT,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS entries (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id  INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      amount       REAL    NOT NULL,
      note         TEXT,
      date         TEXT    NOT NULL,
      settled      INTEGER NOT NULL DEFAULT 0,
      created_at   TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE INDEX IF NOT EXISTS idx_entries_customer ON entries(customer_id);
    CREATE INDEX IF NOT EXISTS idx_entries_settled  ON entries(settled);

    -- One row per "money received" event. amount may cover one item, several
    -- items, or part of an item — see payment_allocations for the breakdown.
    CREATE TABLE IF NOT EXISTS payments (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      amount      REAL    NOT NULL,
      date        TEXT    NOT NULL,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
    );

    -- Which entries a payment was applied to, and how much went to each.
    CREATE TABLE IF NOT EXISTS payment_allocations (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      payment_id  INTEGER NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
      entry_id    INTEGER NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
      amount      REAL    NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_payments_customer ON payments(customer_id);
    CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(date);
    CREATE INDEX IF NOT EXISTS idx_payment_allocations_payment ON payment_allocations(payment_id);
    CREATE INDEX IF NOT EXISTS idx_payment_allocations_entry ON payment_allocations(entry_id);

    -- Ledger of a customer's advance/credit balance — the "khata carry
    -- forward" amount. A row is added with a positive amount when a
    -- payment is bigger than everything currently pending (the extra is
    -- credit owed back to the customer), and a negative amount when that
    -- credit is later applied against a new udhar entry. The customer's
    -- current balance is always SUM(amount) for that customer_id — never
    -- stored as a single mutable column, so it stays fully auditable and
    -- self-healing if a payment/entry it references is later deleted.
    CREATE TABLE IF NOT EXISTS customer_credits (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      amount      REAL    NOT NULL,
      reason      TEXT    NOT NULL, -- 'overpayment' | 'applied_to_entry' | 'manual_adjustment'
      payment_id  INTEGER REFERENCES payments(id) ON DELETE SET NULL,
      entry_id    INTEGER REFERENCES entries(id) ON DELETE SET NULL,
      date        TEXT    NOT NULL,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE INDEX IF NOT EXISTS idx_customer_credits_customer ON customer_credits(customer_id);

    -- Simple local key/value store. Holds the 90-day trial anchor
    -- (trial_started_at) and a local mirror of onboarding profile fields
    -- (shop_name, theme, onboarding_complete) so the app works fully
    -- offline after first launch. This is the offline source of truth
    -- between syncs with Supabase's "profiles" table — see lib/trial.js.
    CREATE TABLE IF NOT EXISTS app_meta (
      key    TEXT PRIMARY KEY,
      value  TEXT
    );
  `);

  // ── Step 2: Column migrations ─────────────────────────────────────────────
  // Check what columns actually exist, then add any that are missing.
  // Must happen BEFORE we create indexes that reference these columns.
  const cols = await db.getAllAsync(`PRAGMA table_info(entries);`);
  const colNames = cols.map((c) => c.name);

  if (!colNames.includes("settled_at")) {
    await db.execAsync(`ALTER TABLE entries ADD COLUMN settled_at TEXT;`);
  }
  if (!colNames.includes("due_date")) {
    await db.execAsync(`ALTER TABLE entries ADD COLUMN due_date TEXT;`);
  }
  // How much of this entry has been paid off so far. An entry only becomes
  // `settled` once paid_amount reaches amount — this is what makes partial /
  // split payments possible instead of all-or-nothing.
  if (!colNames.includes("paid_amount")) {
    await db.execAsync(
      `ALTER TABLE entries ADD COLUMN paid_amount REAL NOT NULL DEFAULT 0;`,
    );
  }

  // ── Step 3: Indexes on migrated columns ───────────────────────────────────
  // Safe to create now — the columns are guaranteed to exist.
  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_entries_settled_at ON entries(settled_at);
    CREATE INDEX IF NOT EXISTS idx_entries_due_date   ON entries(due_date);
  `);
}

// ── App meta (local key/value store) ────────────────────────────────────────

/**
 * Reads one value from app_meta. Returns null if the key isn't set.
 */
export async function getMeta(key) {
  return withDb((db) =>
    db.getFirstAsync(`SELECT value FROM app_meta WHERE key = ?;`, [key]),
  ).then((row) => row?.value ?? null);
}

/**
 * Writes one value to app_meta (insert or overwrite). `value` is stored as
 * TEXT — stringify anything that isn't already a string before calling.
 */
export async function setMeta(key, value) {
  return withDb((db) =>
    db.runAsync(
      `INSERT INTO app_meta (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value;`,
      [key, value],
    ),
  );
}

/**
 * Reads several keys at once. Returns an object keyed by the requested
 * names; keys with no stored value are omitted (caller should default them).
 */
export async function getMetaMany(keys) {
  if (!keys || keys.length === 0) return {};
  return withDb(async (db) => {
    const placeholders = keys.map(() => "?").join(",");
    const rows = await db.getAllAsync(
      `SELECT key, value FROM app_meta WHERE key IN (${placeholders});`,
      keys,
    );
    const out = {};
    for (const row of rows) out[row.key] = row.value;
    return out;
  });
}

// ── Cloud sync (customer data) ──────────────────────────────────────────────
// This is the "put my customers' data on the cloud" preference the person
// opts into during onboarding (app/onboarding/sync.jsx) or later from
// Settings. When it's on, every write below that touches a customer, entry,
// or payment fires a best-effort mirror to Firestore (see lib/cloudSync.js).
// Sync failures never affect the local write — SQLite stays authoritative.

/**
 * Whether the person has opted in to cloud sync of their customer data.
 */
export async function getCloudSyncEnabled() {
  const v = await getMeta(META_KEY_CLOUD_SYNC_ENABLED);
  return v === "1";
}

async function setCloudSyncEnabledLocal(enabled) {
  await setMeta(META_KEY_CLOUD_SYNC_ENABLED, enabled ? "1" : "0");
}

/**
 * Assembles one customer's full local state — the customer row plus all
 * their entries and payments (with each payment's allocations attached) —
 * ready to hand to lib/cloudSync.js. Returns null if the customer no
 * longer exists locally (e.g. deleted between the write and the sync).
 */
export async function getCustomerBundle(customerId) {
  return withDb(async (db) => {
    const [customer, entries, payments, credits] = await Promise.all([
      db.getFirstAsync(`SELECT * FROM customers WHERE id = ?;`, [customerId]),
      db.getAllAsync(
        `SELECT * FROM entries WHERE customer_id = ? ORDER BY id ASC;`,
        [customerId],
      ),
      db.getAllAsync(
        `SELECT * FROM payments WHERE customer_id = ? ORDER BY id ASC;`,
        [customerId],
      ),
      db.getAllAsync(
        `SELECT * FROM customer_credits WHERE customer_id = ? ORDER BY id ASC;`,
        [customerId],
      ),
    ]);
    if (!customer) return null;

    let allocations = [];
    const paymentIds = payments.map((p) => p.id);
    if (paymentIds.length) {
      const placeholders = paymentIds.map(() => "?").join(",");
      allocations = await db.getAllAsync(
        `SELECT * FROM payment_allocations WHERE payment_id IN (${placeholders});`,
        paymentIds,
      );
    }

    return {
      ...customer,
      entries,
      payments: payments.map((p) => ({
        ...p,
        allocations: allocations.filter((a) => a.payment_id === p.id),
      })),
      credits,
    };
  });
}

/**
 * Fire-and-forget: pushes one customer's current state to the cloud, but
 * only if sync is turned on. Called after every local write that touches
 * that customer's data. Never awaited by callers — a slow or failed cloud
 * write must never hold up (or fail) the local write that already succeeded.
 */
async function syncCustomerAfterWrite(customerId) {
  try {
    if (!customerId) return;
    if (!(await getCloudSyncEnabled())) return;
    const bundle = await getCustomerBundle(customerId);
    if (bundle) pushCustomerBundle(customerId, bundle).catch(() => {});
  } catch (e) {
    // Best-effort — a sync-prep failure must never surface to the caller
    // of the local write it's piggybacking on.
    console.warn(
      "syncCustomerAfterWrite: skipped (non-fatal):",
      e?.message || e,
    );
  }
}

/**
 * Same idea as syncCustomerAfterWrite, but for a customer that was just
 * deleted locally — mirrors the delete to the cloud instead of pushing state.
 */
async function syncCustomerDeleteAfterWrite(customerId) {
  try {
    if (!customerId) return;
    if (!(await getCloudSyncEnabled())) return;
    deleteCustomerCloud(customerId).catch(() => {});
  } catch (e) {
    console.warn(
      "syncCustomerDeleteAfterWrite: skipped (non-fatal):",
      e?.message || e,
    );
  }
}

/**
 * Turns cloud sync on: flips the local flag, then pushes every customer
 * currently on the device up to Firestore in one go, so nothing existing
 * is left behind (covers reinstalls and "turned it on later" cases, not
 * just onboarding). Runs in the background — callers don't need to await
 * the push itself to move on, just the flag flip.
 */
export async function enableCloudSync() {
  await setCloudSyncEnabledLocal(true);
  try {
    const customers = await withDb((db) =>
      db.getAllAsync(`SELECT id FROM customers;`),
    );
    const bundles = (
      await Promise.all(customers.map((c) => getCustomerBundle(c.id)))
    ).filter(Boolean);
    if (bundles.length) {
      pushAllCustomersToCloud(bundles).catch(() => {});
    }
  } catch (e) {
    console.warn(
      "enableCloudSync: initial push failed (non-fatal):",
      e?.message || e,
    );
  }
  return { success: true };
}

/**
 * Turns cloud sync off: flips the local flag and deletes everything
 * already synced for this user — the person withdrew consent to keep
 * their customers' data in the cloud, so it shouldn't linger there.
 * Local data on the device is untouched.
 */
export async function disableCloudSync() {
  await setCloudSyncEnabledLocal(false);
  deleteAllCloudCustomerData().catch(() => {});
  return { success: true };
}

/**
 * Restores customers/entries/payments from Firestore into local SQLite —
 * the missing half of the sync loop. pushCustomerBundle/pushAllCustomersToCloud
 * only ever sent data up; nothing ever brought it back down, so a returning
 * user who signed in on a fresh install (or after local storage was cleared)
 * got their shop name back via pullProfileFromCloud but not their actual
 * khatas. This is called from the same recovery step, right after that.
 *
 * Only restores into an EMPTY local database — if the device already has
 * customers (the normal case: same device, still logged in, or already
 * restored once), this is a no-op so a stale cloud snapshot can never
 * clobber newer local data. Preserves the original ids from Firestore so
 * entries/payments/allocations/credits keep pointing at the right rows.
 */
export async function restoreCustomersFromCloud() {
  return withDb(async (db) => {
    try {
      const existing = await db.getFirstAsync(
        `SELECT COUNT(*) AS count FROM customers;`,
      );
      if ((existing?.count ?? 0) > 0) {
        return { success: true, skipped: true, reason: "local-data-present" };
      }

      const result = await pullAllCustomersFromCloud();
      if (!result.success) return result;
      if (!result.bundles.length) return { success: true, count: 0 };

      await db.execAsync("BEGIN TRANSACTION;");
      try {
        for (const bundle of result.bundles) {
          await db.runAsync(
            `INSERT OR REPLACE INTO customers (id, name, phone, created_at)
             VALUES (?, ?, ?, ?);`,
            [bundle.id, bundle.name, bundle.phone ?? null, bundle.created_at],
          );

          for (const entry of bundle.entries || []) {
            await db.runAsync(
              `INSERT OR REPLACE INTO entries
                 (id, customer_id, amount, note, date, settled, created_at, settled_at, due_date, paid_amount)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
              [
                entry.id,
                bundle.id,
                entry.amount,
                entry.note ?? null,
                entry.date,
                entry.settled ?? 0,
                entry.created_at,
                entry.settled_at ?? null,
                entry.due_date ?? null,
                entry.paid_amount ?? 0,
              ],
            );
          }

          for (const payment of bundle.payments || []) {
            await db.runAsync(
              `INSERT OR REPLACE INTO payments (id, customer_id, amount, date, created_at)
               VALUES (?, ?, ?, ?, ?);`,
              [
                payment.id,
                bundle.id,
                payment.amount,
                payment.date,
                payment.created_at,
              ],
            );

            for (const alloc of payment.allocations || []) {
              await db.runAsync(
                `INSERT OR REPLACE INTO payment_allocations (id, payment_id, entry_id, amount)
                 VALUES (?, ?, ?, ?);`,
                [alloc.id, payment.id, alloc.entry_id, alloc.amount],
              );
            }
          }

          for (const credit of bundle.credits || []) {
            await db.runAsync(
              `INSERT OR REPLACE INTO customer_credits
                 (id, customer_id, amount, reason, payment_id, entry_id, date, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
              [
                credit.id,
                bundle.id,
                credit.amount,
                credit.reason,
                credit.payment_id ?? null,
                credit.entry_id ?? null,
                credit.date,
                credit.created_at,
              ],
            );
          }
        }
        await db.execAsync("COMMIT;");
      } catch (e) {
        await db.execAsync("ROLLBACK;");
        throw e;
      }

      // Data just came back from a cloud-synced account — keep the flag on
      // locally so future writes keep mirroring up, matching what the person
      // originally opted into.
      await setCloudSyncEnabledLocal(true);

      return { success: true, count: result.bundles.length };
    } catch (e) {
      console.warn(
        "restoreCustomersFromCloud: restore failed (non-fatal):",
        e?.message || e,
      );
      return { success: false, reason: "error", error: e };
    }
  });
}

/**
 * Quick stats used to show the person what they'd be losing before they
 * delete their account (see app/settings.jsx / DeleteAccountModal).
 */
export async function getAccountDeletionStats() {
  return withDb(async (db) => {
    const [customerRow, pendingRow, entryRow] = await Promise.all([
      db.getFirstAsync(`SELECT COUNT(*) AS count FROM customers;`),
      db.getFirstAsync(
        `SELECT COALESCE(SUM(amount - paid_amount), 0) AS total FROM entries WHERE settled = 0;`,
      ),
      db.getFirstAsync(`SELECT COUNT(*) AS count FROM entries;`),
    ]);
    return {
      customerCount: customerRow?.count ?? 0,
      totalPending: pendingRow?.total ?? 0,
      entryCount: entryRow?.count ?? 0,
    };
  });
}

/**
 * Permanently wipes every row of local app data (customers, entries,
 * payments, allocations, and the app_meta key/value store). This is the
 * local half of full account deletion — call the Firebase Auth + Firestore
 * deletion helpers alongside this. Irreversible.
 */
export async function wipeAllLocalData() {
  return withDb(async (db) => {
    await db.execAsync("BEGIN TRANSACTION;");
    try {
      await db.execAsync(`
        DELETE FROM payment_allocations;
        DELETE FROM payments;
        DELETE FROM customer_credits;
        DELETE FROM entries;
        DELETE FROM customers;
        DELETE FROM app_meta;
      `);
      await db.execAsync("COMMIT;");
    } catch (e) {
      await db.execAsync("ROLLBACK;");
      throw e;
    }
  });
}

// ── Customers ─────────────────────────────────────────────────────────────────

export async function getCustomersWithPending(sortBy = "highest") {
  return withDb((db) => {
    const orderMap = {
      highest: "pending DESC",
      recent: "last_entry_date DESC",
      name: "c.name ASC",
    };
    const order = orderMap[sortBy] ?? "pending DESC";
    return db.getAllAsync(`
      SELECT
        c.id, c.name, c.phone,
        COALESCE(SUM(CASE WHEN e.settled = 0 THEN (e.amount - e.paid_amount) ELSE 0 END), 0) AS pending,
        MAX(e.date) AS last_entry_date,
        COALESCE(SUM(CASE WHEN e.settled = 0 AND e.due_date IS NOT NULL AND e.due_date < date('now','localtime') THEN 1 ELSE 0 END), 0) AS overdue_count
      FROM customers c
      LEFT JOIN entries e ON e.customer_id = c.id
      GROUP BY c.id
      HAVING pending > 0
      ORDER BY ${order};
    `);
  });
}

/**
 * Customers who have at least one entry and are fully paid off — nothing
 * currently pending. Powers the "Settled" tab on the Home screen.
 */
export async function getSettledCustomers(sortBy = "recent") {
  return withDb((db) => {
    const orderMap = {
      highest: "total_settled DESC",
      recent: "last_settled_raw DESC",
      name: "c.name ASC",
    };
    const order = orderMap[sortBy] ?? "last_settled_raw DESC";
    return db.getAllAsync(`
      SELECT
        c.id, c.name, c.phone,
        COALESCE(SUM(e.amount), 0) AS total_settled,
        MAX(date(e.settled_at)) AS last_settled_date,
        MAX(e.settled_at) AS last_settled_raw
      FROM customers c
      INNER JOIN entries e ON e.customer_id = c.id
      GROUP BY c.id
      HAVING COUNT(e.id) > 0
         AND COALESCE(SUM(CASE WHEN e.settled = 0 THEN (e.amount - e.paid_amount) ELSE 0 END), 0) <= 0.009
      ORDER BY ${order};
    `);
  });
}

export async function getCustomer(customerId) {
  return withDb((db) =>
    db.getFirstAsync(`SELECT * FROM customers WHERE id = ?;`, [customerId]),
  );
}

export async function searchCustomers(queryText) {
  return withDb((db) =>
    db.getAllAsync(
      `SELECT id, name, phone FROM customers WHERE name LIKE ? ORDER BY name ASC LIMIT 10;`,
      [`%${queryText}%`],
    ),
  );
}

/**
 * Returns all customers whose name exactly matches (case-insensitive).
 * Used by NameDropdown to show the "Add another [name]" option.
 */
export async function getCustomersByExactName(name) {
  return withDb((db) =>
    db.getAllAsync(
      `SELECT id, name, phone FROM customers WHERE name = ? COLLATE NOCASE;`,
      [name.trim()],
    ),
  );
}

/**
 * Returns the customer that already owns this exact phone number, if any.
 * Used before creating a new customer, so the same number can't end up
 * attached to two different customer profiles.
 */
export async function getCustomerByPhone(phone, excludeId = null) {
  if (!phone) return null;
  return withDb((db) => {
    if (excludeId) {
      return db.getFirstAsync(
        `SELECT id, name, phone FROM customers WHERE phone = ? AND id != ? LIMIT 1;`,
        [phone, excludeId],
      );
    }
    return db.getFirstAsync(
      `SELECT id, name, phone FROM customers WHERE phone = ? LIMIT 1;`,
      [phone],
    );
  });
}

export async function insertCustomer({ name, phone = null }) {
  const result = await withDb((db) =>
    db.runAsync(`INSERT INTO customers (name, phone) VALUES (?, ?);`, [
      name.trim(),
      phone?.trim() || null,
    ]),
  );
  const id = result.lastInsertRowId;
  syncCustomerAfterWrite(id);
  return id;
}

export async function updateCustomer(customerId, { name, phone }) {
  await withDb((db) =>
    db.runAsync(`UPDATE customers SET name = ?, phone = ? WHERE id = ?;`, [
      name.trim(),
      phone ?? null,
      customerId,
    ]),
  );
  syncCustomerAfterWrite(customerId);
}

/**
 * Updates just the phone column — used by the "add a number to call" flow
 * on the customer profile, where we don't want to touch the name.
 */
export async function updateCustomerPhone(customerId, phone) {
  await withDb((db) =>
    db.runAsync(`UPDATE customers SET phone = ? WHERE id = ?;`, [
      phone?.trim() || null,
      customerId,
    ]),
  );
  syncCustomerAfterWrite(customerId);
}

export async function deleteCustomer(customerId) {
  await withDb((db) =>
    db.withTransactionAsync(async () => {
      await db.runAsync(
        `DELETE FROM payment_allocations WHERE entry_id IN (SELECT id FROM entries WHERE customer_id = ?);`,
        [customerId],
      );
      await db.runAsync(`DELETE FROM payments WHERE customer_id = ?;`, [
        customerId,
      ]);
      await db.runAsync(`DELETE FROM customer_credits WHERE customer_id = ?;`, [
        customerId,
      ]);
      await db.runAsync(`DELETE FROM entries WHERE customer_id = ?;`, [
        customerId,
      ]);
      await db.runAsync(`DELETE FROM customers WHERE id = ?;`, [customerId]);
    }),
  );
  syncCustomerDeleteAfterWrite(customerId);
}

// ── Entries ───────────────────────────────────────────────────────────────────

export async function getEntriesForCustomer(customerId) {
  return withDb((db) =>
    db.getAllAsync(
      `SELECT * FROM entries WHERE customer_id = ? ORDER BY settled ASC, date DESC, id DESC;`,
      [customerId],
    ),
  );
}

export async function getPendingAmountForCustomer(customerId) {
  return withDb(async (db) => {
    const row = await db.getFirstAsync(
      `SELECT COALESCE(SUM(amount - paid_amount), 0) AS total FROM entries WHERE customer_id = ? AND settled = 0;`,
      [customerId],
    );
    return row?.total ?? 0;
  });
}

export async function insertEntry({
  customerId,
  amount,
  note = null,
  date,
  dueDate = null,
}) {
  const result = await withDb((db) =>
    db.runAsync(
      `INSERT INTO entries (customer_id, amount, note, date, due_date) VALUES (?, ?, ?, ?, ?);`,
      [customerId, amount, note?.trim() || null, date, dueDate || null],
    ),
  );
  syncCustomerAfterWrite(customerId);
  return result.lastInsertRowId;
}

/**
 * Settle a single entry for whatever remains on it (handles entries that
 * already have a partial payment on them too).
 * Writes a matching payments row so "Received Today" stays accurate.
 */
export async function settleEntry(entryId) {
  let customerId = null;
  await withDb(async (db) => {
    const entry = await db.getFirstAsync(
      `SELECT customer_id, amount, paid_amount FROM entries WHERE id = ?;`,
      [entryId],
    );
    if (!entry) return;
    customerId = entry.customer_id;

    const remaining = entry.amount - entry.paid_amount;
    if (remaining <= 0.009) return; // already fully settled

    await db.execAsync("BEGIN TRANSACTION;");
    try {
      await db.runAsync(
        `UPDATE entries SET settled = 1, paid_amount = amount, settled_at = datetime('now','localtime') WHERE id = ?;`,
        [entryId],
      );
      const paymentResult = await db.runAsync(
        `INSERT INTO payments (customer_id, amount, date) VALUES (?, ?, date('now','localtime'));`,
        [entry.customer_id, remaining],
      );
      await db.runAsync(
        `INSERT INTO payment_allocations (payment_id, entry_id, amount) VALUES (?, ?, ?);`,
        [paymentResult.lastInsertRowId, entryId, remaining],
      );
      await db.execAsync("COMMIT;");
    } catch (e) {
      await db.execAsync("ROLLBACK;");
      throw e;
    }
  });
  if (customerId) syncCustomerAfterWrite(customerId);
}

export async function settleAllEntries(customerId) {
  await withDb(async (db) => {
    const pending = await db.getAllAsync(
      `SELECT id, amount, paid_amount FROM entries WHERE customer_id = ? AND settled = 0;`,
      [customerId],
    );
    if (pending.length === 0) return;

    const total = pending.reduce(
      (sum, e) => sum + (e.amount - e.paid_amount),
      0,
    );
    if (total <= 0.009) return;

    await db.execAsync("BEGIN TRANSACTION;");
    try {
      await db.runAsync(
        `UPDATE entries SET settled = 1, paid_amount = amount, settled_at = datetime('now','localtime') WHERE customer_id = ? AND settled = 0;`,
        [customerId],
      );
      const paymentResult = await db.runAsync(
        `INSERT INTO payments (customer_id, amount, date) VALUES (?, ?, date('now','localtime'));`,
        [customerId, total],
      );
      const paymentId = paymentResult.lastInsertRowId;

      for (const e of pending) {
        const remaining = e.amount - e.paid_amount;
        if (remaining <= 0.009) continue;
        await db.runAsync(
          `INSERT INTO payment_allocations (payment_id, entry_id, amount) VALUES (?, ?, ?);`,
          [paymentId, e.id, remaining],
        );
      }
      await db.execAsync("COMMIT;");
    } catch (e) {
      await db.execAsync("ROLLBACK;");
      throw e;
    }
  });
  syncCustomerAfterWrite(customerId);
}

/**
 * Record a payment that's been manually split across one or more specific
 * entries — used when a customer pays an amount that doesn't cleanly match
 * any single item (e.g. ₹100 against a ₹500 total spread across 3 items).
 *
 *   allocations: [{ entryId, amount }, ...]
 *
 * `allocations` may add up to LESS than `amount` — the caller (UI) is
 * expected to have already worked out a valid split against pending items;
 * this just double-checks it and never trusts it blindly. Each entry is
 * topped up by its allocated amount and flips to settled once paid_amount
 * reaches its full amount.
 *
 * If `amount` is more than the sum of `allocations` (i.e. the customer
 * paid more than everything selected/pending), the leftover is not
 * dropped — it's recorded as an advance/credit on the customer's khata
 * (see customer_credits) so it carries forward and can be applied to a
 * future udhar instead of the shopkeeper having to remember it manually.
 * `allocations` may be an empty array when the entire amount is an
 * advance (e.g. a customer with nothing currently pending pays ahead).
 */
export async function recordPayment({
  customerId,
  amount,
  allocations = [],
  date,
}) {
  const totalAllocated = allocations.reduce((sum, a) => sum + a.amount, 0);
  if (totalAllocated > amount + 0.01) {
    throw new Error("Allocation total cannot exceed payment amount");
  }
  const overpayment = amount - totalAllocated;

  const paymentId = await withDb(async (db) => {
    await db.execAsync("BEGIN TRANSACTION;");
    try {
      const paymentResult = await db.runAsync(
        `INSERT INTO payments (customer_id, amount, date) VALUES (?, ?, ?);`,
        [customerId, amount, date],
      );
      const pid = paymentResult.lastInsertRowId;

      for (const { entryId, amount: allocAmount } of allocations) {
        if (allocAmount <= 0) continue;

        const entry = await db.getFirstAsync(
          `SELECT amount, paid_amount FROM entries WHERE id = ? AND customer_id = ?;`,
          [entryId, customerId],
        );
        if (!entry) throw new Error(`Entry ${entryId} not found`);

        const newPaid = entry.paid_amount + allocAmount;
        if (newPaid > entry.amount + 0.01) {
          throw new Error(
            `Allocation exceeds entry ${entryId}'s remaining due`,
          );
        }
        const isSettled = newPaid >= entry.amount - 0.009;

        await db.runAsync(
          `UPDATE entries
           SET paid_amount = ?,
               settled = ?,
               settled_at = CASE WHEN ? = 1 THEN datetime('now','localtime') ELSE settled_at END
           WHERE id = ?;`,
          [newPaid, isSettled ? 1 : 0, isSettled ? 1 : 0, entryId],
        );

        await db.runAsync(
          `INSERT INTO payment_allocations (payment_id, entry_id, amount) VALUES (?, ?, ?);`,
          [pid, entryId, allocAmount],
        );
      }

      if (overpayment > 0.009) {
        await db.runAsync(
          `INSERT INTO customer_credits (customer_id, amount, reason, payment_id, date) VALUES (?, ?, 'overpayment', ?, ?);`,
          [customerId, overpayment, pid, date],
        );
      }

      await db.execAsync("COMMIT;");
      return pid;
    } catch (e) {
      await db.execAsync("ROLLBACK;");
      throw e;
    }
  });

  syncCustomerAfterWrite(customerId);
  return paymentId;
}

// ── Customer credit / advance balance ("khata carry forward") ──────────────

/**
 * A customer's current advance/credit balance — money they've overpaid
 * that hasn't been applied to a new udhar yet. Always derived by summing
 * the ledger rather than stored as a mutable column, so it self-corrects
 * if a payment or entry it's tied to is later deleted.
 */
export async function getCustomerCreditBalance(customerId) {
  return withDb(async (db) => {
    const row = await db.getFirstAsync(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM customer_credits WHERE customer_id = ?;`,
      [customerId],
    );
    return row?.total ?? 0;
  });
}

/**
 * Full advance ledger for a customer (overpayments and the entries they
 * were later applied to), newest first — used to show a small history
 * under the advance balance on the customer's profile.
 */
export async function getCustomerCreditHistory(customerId) {
  return withDb((db) =>
    db.getAllAsync(
      `SELECT * FROM customer_credits WHERE customer_id = ? ORDER BY id DESC;`,
      [customerId],
    ),
  );
}

/**
 * Applies part (or all) of a customer's existing advance balance to one
 * of their entries — normally a udhar entry that was just created, once
 * the person has confirmed (in the UI) that they want the standing credit
 * used to offset it instead of collecting cash again.
 *
 * This mirrors what a cash payment does to the entry (paid_amount/settled),
 * but is funded from the credit ledger rather than a new `payments` row —
 * the cash was already received earlier when the credit was created, so
 * it must not be double-counted in "Received Today" stats.
 */
export async function applyCreditToEntry({ customerId, entryId, amount }) {
  if (amount <= 0) return;

  await withDb(async (db) => {
    await db.execAsync("BEGIN TRANSACTION;");
    try {
      const balanceRow = await db.getFirstAsync(
        `SELECT COALESCE(SUM(amount), 0) AS total FROM customer_credits WHERE customer_id = ?;`,
        [customerId],
      );
      const balance = balanceRow?.total ?? 0;
      if (amount > balance + 0.01) {
        throw new Error("Amount exceeds available credit balance");
      }

      const entry = await db.getFirstAsync(
        `SELECT amount, paid_amount FROM entries WHERE id = ? AND customer_id = ?;`,
        [entryId, customerId],
      );
      if (!entry) throw new Error(`Entry ${entryId} not found`);

      const newPaid = entry.paid_amount + amount;
      if (newPaid > entry.amount + 0.01) {
        throw new Error("Amount exceeds entry's remaining due");
      }
      const isSettled = newPaid >= entry.amount - 0.009;

      await db.runAsync(
        `UPDATE entries
         SET paid_amount = ?,
             settled = ?,
             settled_at = CASE WHEN ? = 1 THEN datetime('now','localtime') ELSE settled_at END
         WHERE id = ?;`,
        [newPaid, isSettled ? 1 : 0, isSettled ? 1 : 0, entryId],
      );

      await db.runAsync(
        `INSERT INTO customer_credits (customer_id, amount, reason, entry_id, date) VALUES (?, ?, 'applied_to_entry', ?, date('now','localtime'));`,
        [customerId, -amount, entryId],
      );

      await db.execAsync("COMMIT;");
    } catch (e) {
      await db.execAsync("ROLLBACK;");
      throw e;
    }
  });

  syncCustomerAfterWrite(customerId);
}

export async function deleteEntry(entryId) {
  let customerId = null;
  await withDb(async (db) => {
    const entry = await db.getFirstAsync(
      `SELECT customer_id FROM entries WHERE id = ?;`,
      [entryId],
    );
    if (entry) customerId = entry.customer_id;
    await db.runAsync(`DELETE FROM entries WHERE id = ?;`, [entryId]);
  });
  if (customerId) syncCustomerAfterWrite(customerId);
}

// ── Due date helpers ──────────────────────────────────────────────────────────

/**
 * Unsettled entries for a customer whose due_date has already passed.
 */
export async function getOverdueEntries(customerId) {
  return withDb((db) =>
    db.getAllAsync(
      `SELECT * FROM entries
       WHERE customer_id = ?
         AND settled = 0
         AND due_date IS NOT NULL
         AND due_date < date('now','localtime');`,
      [customerId],
    ),
  );
}

/**
 * Push the due_date forward on all currently-overdue entries for a customer.
 */
export async function updateOverdueDates(customerId, newDueDate) {
  await withDb((db) =>
    db.runAsync(
      `UPDATE entries
       SET due_date = ?
       WHERE customer_id = ?
         AND settled = 0
         AND due_date IS NOT NULL
         AND due_date < date('now','localtime');`,
      [newDueDate, customerId],
    ),
  );
  syncCustomerAfterWrite(customerId);
}

/**
 * Customers with at least one unsettled entry whose due_date is today.
 * Drives the "Due Today" strip on the Home screen.
 */
export async function getCustomersDueToday() {
  return withDb((db) =>
    db.getAllAsync(`
      SELECT
        c.id, c.name, c.phone,
        COALESCE(SUM(CASE WHEN e.settled = 0 THEN (e.amount - e.paid_amount) ELSE 0 END), 0) AS pending
      FROM customers c
      INNER JOIN entries e ON e.customer_id = c.id
      WHERE e.settled = 0
        AND e.due_date = date('now','localtime')
      GROUP BY c.id
      ORDER BY pending DESC;
    `),
  );
}

// ── Home stats ────────────────────────────────────────────────────────────────

export async function getHomeStats() {
  return withDb(async (db) => {
    const [pendingRow, receivedRow, customerRow] = await Promise.all([
      db.getFirstAsync(
        `SELECT COALESCE(SUM(amount - paid_amount), 0) AS total FROM entries WHERE settled = 0;`,
      ),
      db.getFirstAsync(`
        SELECT COALESCE(SUM(amount), 0) AS total FROM payments
        WHERE date = date('now','localtime');
      `),
      db.getFirstAsync(
        `SELECT COUNT(DISTINCT customer_id) AS count FROM entries WHERE settled = 0;`,
      ),
    ]);
    return {
      totalPending: pendingRow?.total ?? 0,
      todayReceived: receivedRow?.total ?? 0,
      activeCustomers: customerRow?.count ?? 0,
    };
  });
}

/**
 * Stats for the "Settled" tab — mirrors getHomeStats()'s shape but for
 * money received rather than money owed. Sourced from the `payments`
 * ledger (every recorded payment, across all customers) so it stays
 * accurate the same way "Received Today" does on the Pending tab.
 */
export async function getSettledStats() {
  return withDb(async (db) => {
    const [totalRow, todayRow] = await Promise.all([
      db.getFirstAsync(
        `SELECT COALESCE(SUM(amount), 0) AS total FROM payments;`,
      ),
      db.getFirstAsync(`
        SELECT COALESCE(SUM(amount), 0) AS total FROM payments
        WHERE date = date('now','localtime');
      `),
    ]);
    return {
      totalReceived: totalRow?.total ?? 0,
      todayReceived: todayRow?.total ?? 0,
    };
  });
}
