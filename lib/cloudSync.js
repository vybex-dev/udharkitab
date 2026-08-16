/**
 * lib/cloudSync.js
 * Cloud-side half of the customer-data sync feature opted into during
 * onboarding (app/onboarding/sync.jsx) or later from Settings.
 *
 * This module only talks to Firestore — it never touches SQLite directly,
 * so it has no dependency on lib/db.js. lib/db.js is the caller: it reads
 * the local data and hands it to the functions here right after every
 * local write. That keeps the dependency direction one-way
 * (db.js → cloudSync.js) and avoids a circular import.
 *
 * Everything here is best-effort: sync failures are logged and swallowed,
 * never thrown back at the caller. A failed cloud write must never break
 * a local one — local SQLite is always the source of truth on-device.
 *
 * Data shape in Firestore: users/{uid}/customers/{customerId}, one document
 * per customer with that customer's entries and payments embedded. This
 * keeps a customer's whole state consistent in a single write instead of
 * juggling partial updates across subcollections.
 */

import { auth, db } from "./firebase";
import {
  doc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  writeBatch,
} from "firebase/firestore";

// Fields that live on the Firestore doc but aren't part of the bundle shape
// lib/db.js expects back (they're sync bookkeeping, not customer data).
const CLOUD_ONLY_FIELDS = ["synced_at"];

const BATCH_CHUNK_SIZE = 400; // Firestore batches cap at 500 writes

function customerDocRef(uid, customerId) {
  return doc(db, "users", uid, "customers", String(customerId));
}

/**
 * Upserts one customer's full bundle (customer row + entries + payments)
 * to Firestore. Called by lib/db.js after any write that touches a
 * customer, an entry, or a payment — only when cloud sync is turned on.
 */
export async function pushCustomerBundle(customerId, bundle) {
  try {
    const uid = auth.currentUser?.uid;
    if (!uid) return { success: false, reason: "no-session" };

    await setDoc(customerDocRef(uid, customerId), {
      ...bundle,
      synced_at: new Date().toISOString(),
    });
    return { success: true };
  } catch (e) {
    console.warn("pushCustomerBundle: sync failed (non-fatal):", e?.message || e);
    return { success: false, reason: "error", error: e };
  }
}

/**
 * Removes one customer's document from the cloud — mirrors a local delete.
 */
export async function deleteCustomerCloud(customerId) {
  try {
    const uid = auth.currentUser?.uid;
    if (!uid) return { success: false, reason: "no-session" };

    await deleteDoc(customerDocRef(uid, customerId));
    return { success: true };
  } catch (e) {
    console.warn("deleteCustomerCloud: delete failed (non-fatal):", e?.message || e);
    return { success: false, reason: "error", error: e };
  }
}

/**
 * Full-snapshot push of every local customer's bundle — used the moment
 * sync is switched on (onboarding or Settings), so existing data (e.g.
 * after a reinstall, or turning sync on later) lands in the cloud too,
 * not just data created after the toggle flips.
 */
export async function pushAllCustomersToCloud(bundles) {
  try {
    const uid = auth.currentUser?.uid;
    if (!uid) return { success: false, reason: "no-session" };
    if (!bundles || bundles.length === 0) return { success: true, count: 0 };

    for (let i = 0; i < bundles.length; i += BATCH_CHUNK_SIZE) {
      const chunk = bundles.slice(i, i + BATCH_CHUNK_SIZE);
      const batch = writeBatch(db);
      for (const bundle of chunk) {
        batch.set(customerDocRef(uid, bundle.id), {
          ...bundle,
          synced_at: new Date().toISOString(),
        });
      }
      await batch.commit();
    }
    return { success: true, count: bundles.length };
  } catch (e) {
    console.warn("pushAllCustomersToCloud: bulk sync failed (non-fatal):", e?.message || e);
    return { success: false, reason: "error", error: e };
  }
}

/**
 * Downloads every customer bundle stored for the current user — the pull
 * counterpart to pushAllCustomersToCloud/pushCustomerBundle. This is what
 * lib/db.js calls on a returning-user login when local SQLite has no
 * customers yet (fresh install, reinstall, or a new device), so their
 * khatas actually come back instead of only their shop name/theme
 * (see lib/profile.js's pullProfileFromCloud, which this mirrors).
 */
export async function pullAllCustomersFromCloud() {
  try {
    const uid = auth.currentUser?.uid;
    if (!uid) return { success: false, reason: "no-session" };

    const colRef = collection(db, "users", uid, "customers");
    const snap = await getDocs(colRef);
    if (snap.empty) return { success: true, bundles: [] };

    const bundles = snap.docs.map((d) => {
      const data = { ...d.data() };
      for (const field of CLOUD_ONLY_FIELDS) delete data[field];
      // The doc ID is the authoritative customer id (see customerDocRef) —
      // trust it over whatever numeric `id` field happens to be embedded.
      return { ...data, id: Number(d.id) };
    });

    return { success: true, bundles };
  } catch (e) {
    console.warn("pullAllCustomersFromCloud: fetch failed (non-fatal):", e?.message || e);
    return { success: false, reason: "error", error: e };
  }
}

/**
 * Deletes every synced customer document for the current user — used when
 * sync is switched off (the person withdrew consent to store their
 * customers' data in the cloud) and during full account deletion.
 */
export async function deleteAllCloudCustomerData() {
  try {
    const uid = auth.currentUser?.uid;
    if (!uid) return { success: false, reason: "no-session" };

    const colRef = collection(db, "users", uid, "customers");
    const snap = await getDocs(colRef);
    if (snap.empty) return { success: true, count: 0 };

    const docs = snap.docs;
    for (let i = 0; i < docs.length; i += BATCH_CHUNK_SIZE) {
      const batch = writeBatch(db);
      docs.slice(i, i + BATCH_CHUNK_SIZE).forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
    return { success: true, count: docs.length };
  } catch (e) {
    console.warn("deleteAllCloudCustomerData: cleanup failed (non-fatal):", e?.message || e);
    return { success: false, reason: "error", error: e };
  }
}
