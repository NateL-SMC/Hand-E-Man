// Everything the worker side reads/writes in Firestore.
import { collection, deleteField, doc, getDoc, getDocs, onSnapshot, query, updateDoc, where, writeBatch } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { sendPush } from "./push";
import { ROUTES } from "./routes";
import type { Booking, Coords, Handyman } from "./types";

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

// ---------- booking lifecycle (every one of these updates the SAME booking doc the customer is listening to) ----------
const ref = (id: string) => doc(db, "bookings", id);

export async function acceptBooking(b: Booking, workerUid: string) {
  const batch = writeBatch(db);
  batch.update(ref(b.id), { status: "upcoming", trackStage: "accepted", acceptedAt: Date.now() });
  // unlocks "write a review" for this customer (also checked by the Firestore rules)
  batch.set(
    doc(db, "canReview", `${b.customerId}_${b.handymanId}`),
    { customerId: b.customerId, handymanId: b.handymanId, handymanUid: workerUid, createdAt: Date.now() },
    { merge: true }
  );
  await batch.commit();
  sendPush(b.customerId, "Booking accepted", `${b.handymanName} accepted your booking`, { route: ROUTES.bookings });
}

export async function declineBooking(b: Booking) {
  await updateDoc(ref(b.id), { status: "cancelled", cancelledBy: "worker" });
  sendPush(b.customerId, "Request declined", `${b.handymanName} can't take this booking`, { route: ROUTES.bookings });
}

export async function startBooking(b: Booking) {
  await updateDoc(ref(b.id), { status: "ongoing", trackStage: "on_the_way", startedAt: Date.now() });
  sendPush(b.customerId, "On the way", `${b.handymanName} is on the way`, { route: ROUTES.tracking(b.id) });
}

export async function arriveBooking(b: Booking) {
  await updateDoc(ref(b.id), { trackStage: "arrived", arrivedAt: Date.now() });
  sendPush(b.customerId, "Arrived", `${b.handymanName} has arrived`, { route: ROUTES.tracking(b.id) });
}

export async function completeBooking(b: Booking) {
  await updateDoc(ref(b.id), {
    status: "completed", trackStage: "finished", completedAt: Date.now(), paymentStatus: "paid",
    workerLocation: deleteField(),
  });
  sendPush(b.customerId, "Job complete", `Your job with ${b.handymanName} is complete`, { route: ROUTES.bookings });
}

export async function cancelBooking(b: Booking) {
  await updateDoc(ref(b.id), { status: "cancelled", cancelledBy: "worker", workerLocation: deleteField() });
  sendPush(b.customerId, "Booking cancelled", `${b.handymanName} cancelled your booking`, { route: ROUTES.bookings });
}

export const updateWorkerLocation = (bookingId: string, c: Coords) =>
  updateDoc(ref(bookingId), { workerLocation: { latitude: c.latitude, longitude: c.longitude, updatedAt: Date.now() } });

// ---------- work status ----------
export const setWorkStatus = (handymanId: string, status: WorkStatus) =>
  updateDoc(doc(db, "handymen", handymanId), { status, active: status === "available" });

/** After a job ends: if nothing else is running and the worker was "on the job", flip back to available. */
export async function releaseIfIdle(workerUid: string, handymanId: string) {
  const running = await getDocs(query(collection(db, "bookings"), where("handymanUid", "==", workerUid), where("status", "==", "ongoing")));
  if (!running.empty) return;
  const h = await getDoc(doc(db, "handymen", handymanId));
  if (h.get("status") === "on_job") await setWorkStatus(handymanId, "available");
}

/** Save profile edits. Strips `undefined` because Firestore rejects it. */
export const saveHandyman = (handymanId: string, data: Record<string, unknown>) =>
  updateDoc(doc(db, "handymen", handymanId), JSON.parse(JSON.stringify(data)));
