// Everything the worker side reads/writes in Firestore.
import { collection, doc, onSnapshot, query, updateDoc, where } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import type { Booking, Handyman } from "./types";

export type WorkStatus = "available" | "on_job" | "unavailable";
export const DAY_MS = 86400000;

/** Monday 00:00 of the week containing `d`. */
export function startOfWeek(d = new Date()) {
  const x = new Date(d);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  x.setHours(0, 0, 0, 0);
  return x;
}

/** What the worker actually earns from a job (VAT is not income). */
export const earningsOf = (b: Booking) => b.serviceCost + b.priorityFee;

// ---------- reads ----------
export function watchWorkerBookings(workerUid: string, cb: (b: Booking[]) => void) {
  return onSnapshot(query(collection(db, "bookings"), where("handymanUid", "==", workerUid)), (snap) =>
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Booking)))
  );
}

export function watchHandyman(id: string, cb: (h: Handyman | null) => void) {
  return onSnapshot(doc(db, "handymen", id), (s) => cb(s.exists() ? ({ id: s.id, ...s.data() } as Handyman) : null));
}

// ---------- writes ----------
const update = (id: string, data: Record<string, unknown>) => updateDoc(doc(db, "bookings", id), data);

export const acceptBooking = (id: string) => update(id, { status: "upcoming" });
export const declineBooking = (id: string) => update(id, { status: "cancelled", cancelledBy: "worker" });
export const startBooking = (id: string) => update(id, { status: "ongoing", startedAt: Date.now() });
export const completeBooking = (id: string) =>
  update(id, { status: "completed", completedAt: Date.now(), paymentStatus: "paid" });
export const cancelBooking = (id: string) => update(id, { status: "cancelled", cancelledBy: "worker" });

export const setWorkStatus = (handymanId: string, status: WorkStatus) =>
  updateDoc(doc(db, "handymen", handymanId), { status, active: status === "available" });

/** Save profile edits. Strips `undefined` because Firestore rejects it. */
export const saveHandyman = (handymanId: string, data: Record<string, unknown>) =>
  updateDoc(doc(db, "handymen", handymanId), JSON.parse(JSON.stringify(data)));
