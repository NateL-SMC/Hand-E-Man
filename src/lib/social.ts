// Favorites, reviews (with the "must have a real booking" gate) and a single-booking listener.
import { arrayRemove, arrayUnion, doc, getDoc, onSnapshot, runTransaction, updateDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import type { Booking } from "./types";

export const toggleFavorite = (uid: string, handymanId: string, on: boolean) =>
  updateDoc(doc(db, "users", uid), { favorites: on ? arrayUnion(handymanId) : arrayRemove(handymanId) });

export function watchBooking(id: string, cb: (b: Booking | null) => void) {
  return onSnapshot(doc(db, "bookings", id), (s) => cb(s.exists() ? ({ id: s.id, ...s.data() } as Booking) : null));
}

/**
 * A customer may review a handyman once that handyman has ACCEPTED one of their bookings (accepted, upcoming,
 * running, cancelled later or finished all count; a still-pending or declined request does not).
 * The worker's accept action writes canReview/{customerId}_{handymanId}; the Firestore rules check the same doc.
 */
export async function canReview(uid: string, handymanId: string) {
  try {
    return (await getDoc(doc(db, "canReview", `${uid}_${handymanId}`))).exists();
  } catch {
    return false;
  }
}

/** One review per customer per handyman (re-submitting edits it). Keeps the handyman's average + count in sync. */
export function submitReview(handymanId: string, uid: string, author: string, rating: number, text: string) {
  return runTransaction(db, async (tx) => {
    const hRef = doc(db, "handymen", handymanId);
    const rRef = doc(db, "handymen", handymanId, "reviews", uid);
    const [h, r] = await Promise.all([tx.get(hRef), tx.get(rRef)]);
    const count: number = h.get("reviewCount") ?? 0;
    const avg: number = h.get("rating") ?? 0;
    let newCount = count;
    let sum = avg * count;
    if (r.exists()) sum += rating - (r.get("rating") as number);
    else { newCount = count + 1; sum += rating; }

    tx.set(rRef, {
      author, authorId: uid, rating, text: text.trim(),
      createdAt: r.exists() ? r.get("createdAt") : Date.now(), updatedAt: Date.now(),
    });
    tx.update(hRef, { rating: Math.round((sum / newCount) * 100) / 100, reviewCount: newCount });
  });
}
