/**
 * lib/analyticsDb.js
 *
 * Read-only aggregate/report queries powering the Analytics screen.
 * Kept separate from db.js (which handles core CRUD) so neither file
 * balloons in size as more reports get added.
 *
 * All functions reuse the same connection as db.js via withDb(), which
 * also retries once if the native handle dies mid-query — never call
 * SQLite.openDatabaseAsync directly here; opening a second independent
 * connection to the same file on Android causes native-level crashes
 * ("NullPointerException" from execAsync/prepareAsync).
 */

import { withDb } from "./db";

// ── Snapshot ─────────────────────────────────────────────────────────────────

/**
 * Top-of-page totals: what's outstanding right now, what's overdue, and
 * how much has ever been collected.
 */
export async function getSnapshotTotals() {
  return withDb(async (db) => {
    const [outstandingRow, overdueRow, collectedRow] = await Promise.all([
      db.getFirstAsync(
        `SELECT COALESCE(SUM(amount - paid_amount), 0) AS total FROM entries WHERE settled = 0;`,
      ),
      db.getFirstAsync(`
        SELECT
          COALESCE(SUM(amount - paid_amount), 0) AS total,
          COUNT(DISTINCT customer_id) AS customerCount
        FROM entries
        WHERE settled = 0
          AND due_date IS NOT NULL
          AND due_date < date('now','localtime');
      `),
      db.getFirstAsync(`SELECT COALESCE(SUM(amount), 0) AS total FROM payments;`),
    ]);
    return {
      totalOutstanding: outstandingRow?.total ?? 0,
      totalOverdue: overdueRow?.total ?? 0,
      overdueCustomerCount: overdueRow?.customerCount ?? 0,
      totalCollectedAllTime: collectedRow?.total ?? 0,
    };
  });
}

// ── Period comparisons (this week/month vs last) ────────────────────────────

/**
 * "given" = all entries created in the period, regardless of settled status.
 * "collected" = sum of payments recorded in the period.
 * Returns current vs previous window for either "week" or "month".
 */
export async function getPeriodComparison(period = "month") {
  const unit = period === "week" ? "7 days" : "1 month";

  return withDb(async (db) => {
    const [curGiven, prevGiven, curCollected, prevCollected] = await Promise.all([
      db.getFirstAsync(
        `SELECT COALESCE(SUM(amount), 0) AS total FROM entries
         WHERE date >= date('now','localtime','-${unit}');`,
      ),
      db.getFirstAsync(
        `SELECT COALESCE(SUM(amount), 0) AS total FROM entries
         WHERE date >= date('now','localtime','-${unit}','-${unit}')
           AND date <  date('now','localtime','-${unit}');`,
      ),
      db.getFirstAsync(
        `SELECT COALESCE(SUM(amount), 0) AS total FROM payments
         WHERE date >= date('now','localtime','-${unit}');`,
      ),
      db.getFirstAsync(
        `SELECT COALESCE(SUM(amount), 0) AS total FROM payments
         WHERE date >= date('now','localtime','-${unit}','-${unit}')
           AND date <  date('now','localtime','-${unit}');`,
      ),
    ]);

    const currentGiven = curGiven?.total ?? 0;
    const previousGiven = prevGiven?.total ?? 0;
    const currentCollected = curCollected?.total ?? 0;
    const previousCollected = prevCollected?.total ?? 0;

    return {
      currentGiven,
      previousGiven,
      currentCollected,
      previousCollected,
      currentRate: currentGiven > 0 ? currentCollected / currentGiven : 0,
      previousRate: previousGiven > 0 ? previousCollected / previousGiven : 0,
    };
  });
}

// ── Monthly history ──────────────────────────────────────────────────────────

/**
 * One row per of the last `monthsBack` months: given, collected, and net
 * outstanding created within that specific month. Most recent month first.
 */
export async function getMonthlyHistory(monthsBack = 6) {
  const months = [];
  for (let i = 0; i < monthsBack; i++) {
    months.push(i);
  }

  return withDb((db) =>
    Promise.all(
      months.map(async (i) => {
        const [given, collected, label] = await Promise.all([
          db.getFirstAsync(
            `SELECT COALESCE(SUM(amount), 0) AS total FROM entries
             WHERE strftime('%Y-%m', date) = strftime('%Y-%m', date('now','localtime','-${i} months'));`,
          ),
          db.getFirstAsync(
            `SELECT COALESCE(SUM(amount), 0) AS total FROM payments
             WHERE strftime('%Y-%m', date) = strftime('%Y-%m', date('now','localtime','-${i} months'));`,
          ),
          db.getFirstAsync(
            `SELECT strftime('%Y-%m', date('now','localtime','-${i} months')) AS ym;`,
          ),
        ]);
        const givenTotal = given?.total ?? 0;
        const collectedTotal = collected?.total ?? 0;
        return {
          yearMonth: label?.ym ?? "",
          given: givenTotal,
          collected: collectedTotal,
          net: givenTotal - collectedTotal,
        };
      }),
    ),
  );
}

// ── Top debtors / overdue list ──────────────────────────────────────────────

export async function getTopDebtors(limit = 10) {
  return withDb((db) =>
    db.getAllAsync(
      `
      SELECT
        c.id, c.name, c.phone,
        COALESCE(SUM(CASE WHEN e.settled = 0 THEN (e.amount - e.paid_amount) ELSE 0 END), 0) AS pending
      FROM customers c
      LEFT JOIN entries e ON e.customer_id = c.id
      GROUP BY c.id
      HAVING pending > 0
      ORDER BY pending DESC
      LIMIT ?;
      `,
      [limit],
    ),
  );
}

export async function getOverdueCustomersList() {
  return withDb((db) =>
    db.getAllAsync(`
      SELECT
        c.id, c.name, c.phone,
        COALESCE(SUM(CASE WHEN e.settled = 0 THEN (e.amount - e.paid_amount) ELSE 0 END), 0) AS pending,
        MIN(CASE WHEN e.settled = 0 AND e.due_date < date('now','localtime') THEN e.due_date END) AS oldest_due_date,
        SUM(CASE WHEN e.settled = 0 AND e.due_date IS NOT NULL AND e.due_date < date('now','localtime') THEN 1 ELSE 0 END) AS overdue_count
      FROM customers c
      LEFT JOIN entries e ON e.customer_id = c.id
      GROUP BY c.id
      HAVING overdue_count > 0
      ORDER BY oldest_due_date ASC;
    `),
  );
}

// ── Weekly daily breakdown (for a 7-day bar chart) ──────────────────────────

/**
 * Amount collected (payments) each day for the last `daysBack` days,
 * oldest first. Used for a simple daily bar chart — e.g. Home's
 * "Weekly Flow" widget. Days with no payments come back as 0, not
 * missing, so the chart always has a full, evenly-spaced set of bars.
 */
export async function getWeeklyDailyBreakdown(daysBack = 7) {
  const offsets = Array.from({ length: daysBack }, (_, i) => daysBack - 1 - i); // oldest first

  return withDb((db) =>
    Promise.all(
      offsets.map(async (i) => {
        const [collected, dateRow] = await Promise.all([
          db.getFirstAsync(
            `SELECT COALESCE(SUM(amount), 0) AS total FROM payments
             WHERE date = date('now','localtime','-${i} days');`,
          ),
          db.getFirstAsync(
            `SELECT date('now','localtime','-${i} days') AS d;`,
          ),
        ]);
        return {
          date: dateRow?.d ?? "",
          collected: collected?.total ?? 0,
        };
      }),
    ),
  );
}
