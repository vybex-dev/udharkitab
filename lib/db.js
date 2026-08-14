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

let _dbPromise = null;
let _db = null; // resolved db instance for health checks

export function openDB() {
  if (!_dbPromise) {
    _dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync("udharkitab.db");
      await db.execAsync(`PRAGMA journal_mode = WAL;`);
      await createTables(db);
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
  const db = await getDB();
  const row = await db.getFirstAsync(
    `SELECT value FROM app_meta WHERE key = ?;`,
    [key],
  );
  return row?.value ?? null;
}

/**
 * Writes one value to app_meta (insert or overwrite). `value` is stored as
 * TEXT — stringify anything that isn't already a string before calling.
 */
export async function setMeta(key, value) {
  const db = await getDB();
  await db.runAsync(
    `INSERT INTO app_meta (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value;`,
    [key, value],
  );
}

/**
 * Reads several keys at once. Returns an object keyed by the requested
 * names; keys with no stored value are omitted (caller should default them).
 */
export async function getMetaMany(keys) {
  if (!keys || keys.length === 0) return {};
  const db = await getDB();
  const placeholders = keys.map(() => "?").join(",");
  const rows = await db.getAllAsync(
    `SELECT key, value FROM app_meta WHERE key IN (${placeholders});`,
    keys,
  );
  const out = {};
  for (const row of rows) out[row.key] = row.value;
  return out;
}

/**
 * Quick stats used to show the person what they'd be losing before they
 * delete their account (see app/settings.jsx / DeleteAccountModal).
 */
export async function getAccountDeletionStats() {
  const db = await getDB();
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
}

/**
 * Permanently wipes every row of local app data (customers, entries,
 * payments, allocations, and the app_meta key/value store). This is the
 * local half of full account deletion — call the Firebase Auth + Firestore
 * deletion helpers alongside this. Irreversible.
 */
export async function wipeAllLocalData() {
  const db = await getDB();
  await db.execAsync("BEGIN TRANSACTION;");
  try {
    await db.execAsync(`
      DELETE FROM payment_allocations;
      DELETE FROM payments;
      DELETE FROM entries;
      DELETE FROM customers;
      DELETE FROM app_meta;
    `);
    await db.execAsync("COMMIT;");
  } catch (e) {
    await db.execAsync("ROLLBACK;");
    throw e;
  }
}

// ── Customers ─────────────────────────────────────────────────────────────────

export async function getCustomersWithPending(sortBy = "highest") {
  const db = await getDB();
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
}

/**
 * Customers who have at least one entry and are fully paid off — nothing
 * currently pending. Powers the "Settled" tab on the Home screen.
 */
export async function getSettledCustomers(sortBy = "recent") {
  const db = await getDB();
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
}

export async function getCustomer(customerId) {
  const db = await getDB();
  return db.getFirstAsync(`SELECT * FROM customers WHERE id = ?;`, [
    customerId,
  ]);
}

export async function searchCustomers(queryText) {
  const db = await getDB();
  return db.getAllAsync(
    `SELECT id, name, phone FROM customers WHERE name LIKE ? ORDER BY name ASC LIMIT 10;`,
    [`%${queryText}%`],
  );
}

/**
 * Returns all customers whose name exactly matches (case-insensitive).
 * Used by NameDropdown to show the "Add another [name]" option.
 */
export async function getCustomersByExactName(name) {
  const db = await getDB();
  return db.getAllAsync(
    `SELECT id, name, phone FROM customers WHERE name = ? COLLATE NOCASE;`,
    [name.trim()],
  );
}

/**
 * Returns the customer that already owns this exact phone number, if any.
 * Used before creating a new customer, so the same number can't end up
 * attached to two different customer profiles.
 */
export async function getCustomerByPhone(phone, excludeId = null) {
  const db = await getDB();
  if (!phone) return null;
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
}

export async function insertCustomer({ name, phone = null }) {
  const db = await getDB();
  const result = await db.runAsync(
    `INSERT INTO customers (name, phone) VALUES (?, ?);`,
    [name.trim(), phone?.trim() || null],
  );
  return result.lastInsertRowId;
}

export async function updateCustomer(customerId, { name, phone }) {
  const db = await getDB();
  await db.runAsync(`UPDATE customers SET name = ?, phone = ? WHERE id = ?;`, [
    name.trim(),
    phone ?? null,
    customerId,
  ]);
}

/**
 * Updates just the phone column — used by the "add a number to call" flow
 * on the customer profile, where we don't want to touch the name.
 */
export async function updateCustomerPhone(customerId, phone) {
  const db = await getDB();
  await db.runAsync(`UPDATE customers SET phone = ? WHERE id = ?;`, [
    phone?.trim() || null,
    customerId,
  ]);
}

export async function deleteCustomer(customerId) {
  const db = await getDB();
  // Foreign keys aren't enforced by default in SQLite, so ON DELETE CASCADE
  // in the schema won't actually run — clean up dependent rows explicitly.
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `DELETE FROM payment_allocations WHERE entry_id IN (SELECT id FROM entries WHERE customer_id = ?);`,
      [customerId],
    );
    await db.runAsync(`DELETE FROM payments WHERE customer_id = ?;`, [
      customerId,
    ]);
    await db.runAsync(`DELETE FROM entries WHERE customer_id = ?;`, [
      customerId,
    ]);
    await db.runAsync(`DELETE FROM customers WHERE id = ?;`, [customerId]);
  });
}

// ── Entries ───────────────────────────────────────────────────────────────────

export async function getEntriesForCustomer(customerId) {
  const db = await getDB();
  return db.getAllAsync(
    `SELECT * FROM entries WHERE customer_id = ? ORDER BY settled ASC, date DESC, id DESC;`,
    [customerId],
  );
}

export async function getPendingAmountForCustomer(customerId) {
  const db = await getDB();
  const row = await db.getFirstAsync(
    `SELECT COALESCE(SUM(amount - paid_amount), 0) AS total FROM entries WHERE customer_id = ? AND settled = 0;`,
    [customerId],
  );
  return row?.total ?? 0;
}

export async function insertEntry({
  customerId,
  amount,
  note = null,
  date,
  dueDate = null,
}) {
  const db = await getDB();
  const result = await db.runAsync(
    `INSERT INTO entries (customer_id, amount, note, date, due_date) VALUES (?, ?, ?, ?, ?);`,
    [customerId, amount, note?.trim() || null, date, dueDate || null],
  );
  return result.lastInsertRowId;
}

/**
 * Settle a single entry for whatever remains on it (handles entries that
 * already have a partial payment on them too).
 * Writes a matching payments row so "Received Today" stays accurate.
 */
export async function settleEntry(entryId) {
  const db = await getDB();
  const entry = await db.getFirstAsync(
    `SELECT customer_id, amount, paid_amount FROM entries WHERE id = ?;`,
    [entryId],
  );
  if (!entry) return;

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
}

export async function settleAllEntries(customerId) {
  const db = await getDB();
  const pending = await db.getAllAsync(
    `SELECT id, amount, paid_amount FROM entries WHERE customer_id = ? AND settled = 0;`,
    [customerId],
  );
  if (pending.length === 0) return;

  const total = pending.reduce((sum, e) => sum + (e.amount - e.paid_amount), 0);
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
}

/**
 * Record a payment that's been manually split across one or more specific
 * entries — used when a customer pays an amount that doesn't cleanly match
 * any single item (e.g. ₹100 against a ₹500 total spread across 3 items).
 *
 *   allocations: [{ entryId, amount }, ...]
 *
 * `amount` must equal the sum of `allocations` — the caller (UI) is expected
 * to have already worked out a valid split; this just double-checks it and
 * never trusts it blindly. Each entry is topped up by its allocated amount
 * and flips to settled once paid_amount reaches its full amount.
 */
export async function recordPayment({ customerId, amount, allocations, date }) {
  if (!allocations || allocations.length === 0) {
    throw new Error("recordPayment requires at least one allocation");
  }

  const totalAllocated = allocations.reduce((sum, a) => sum + a.amount, 0);
  if (Math.abs(totalAllocated - amount) > 0.01) {
    throw new Error("Allocation total does not match payment amount");
  }

  const db = await getDB();

  await db.execAsync("BEGIN TRANSACTION;");
  try {
    const paymentResult = await db.runAsync(
      `INSERT INTO payments (customer_id, amount, date) VALUES (?, ?, ?);`,
      [customerId, amount, date],
    );
    const paymentId = paymentResult.lastInsertRowId;

    for (const { entryId, amount: allocAmount } of allocations) {
      if (allocAmount <= 0) continue;

      const entry = await db.getFirstAsync(
        `SELECT amount, paid_amount FROM entries WHERE id = ? AND customer_id = ?;`,
        [entryId, customerId],
      );
      if (!entry) throw new Error(`Entry ${entryId} not found`);

      const newPaid = entry.paid_amount + allocAmount;
      if (newPaid > entry.amount + 0.01) {
        throw new Error(`Allocation exceeds entry ${entryId}'s remaining due`);
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
        [paymentId, entryId, allocAmount],
      );
    }

    await db.execAsync("COMMIT;");
    return paymentId;
  } catch (e) {
    await db.execAsync("ROLLBACK;");
    throw e;
  }
}

export async function deleteEntry(entryId) {
  const db = await getDB();
  await db.runAsync(`DELETE FROM entries WHERE id = ?;`, [entryId]);
}

// ── Due date helpers ──────────────────────────────────────────────────────────

/**
 * Unsettled entries for a customer whose due_date has already passed.
 */
export async function getOverdueEntries(customerId) {
  const db = await getDB();
  return db.getAllAsync(
    `SELECT * FROM entries
     WHERE customer_id = ?
       AND settled = 0
       AND due_date IS NOT NULL
       AND due_date < date('now','localtime');`,
    [customerId],
  );
}

/**
 * Push the due_date forward on all currently-overdue entries for a customer.
 */
export async function updateOverdueDates(customerId, newDueDate) {
  const db = await getDB();
  await db.runAsync(
    `UPDATE entries
     SET due_date = ?
     WHERE customer_id = ?
       AND settled = 0
       AND due_date IS NOT NULL
       AND due_date < date('now','localtime');`,
    [newDueDate, customerId],
  );
}

/**
 * Customers with at least one unsettled entry whose due_date is today.
 * Drives the "Due Today" strip on the Home screen.
 */
export async function getCustomersDueToday() {
  const db = await getDB();
  return db.getAllAsync(`
    SELECT
      c.id, c.name, c.phone,
      COALESCE(SUM(CASE WHEN e.settled = 0 THEN (e.amount - e.paid_amount) ELSE 0 END), 0) AS pending
    FROM customers c
    INNER JOIN entries e ON e.customer_id = c.id
    WHERE e.settled = 0
      AND e.due_date = date('now','localtime')
    GROUP BY c.id
    ORDER BY pending DESC;
  `);
}

// ── Home stats ────────────────────────────────────────────────────────────────

export async function getHomeStats() {
  const db = await getDB();
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
}
