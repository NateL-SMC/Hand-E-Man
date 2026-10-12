import { deleteUser, sendPasswordResetEmail } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";
import type { Booking, Handyman, Message, Review } from "./types";

export async function fetchHandymen(): Promise<Handyman[]> {
  const snap = await getDocs(collection(db, "handymen"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Handyman);
}

export async function fetchHandyman(id: string): Promise<Handyman | null> {
  const s = await getDoc(doc(db, "handymen", id));
  return s.exists() ? ({ id: s.id, ...s.data() } as Handyman) : null;
}

export async function fetchReviews(handymanId: string): Promise<Review[]> {
  const snap = await getDocs(collection(db, "handymen", handymanId, "reviews"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Review);
}

export async function createBooking(data: Omit<Booking, "id">) {
  const ref = await addDoc(collection(db, "bookings"), data);
  return ref.id;
}

export function watchBookings(uid: string, cb: (b: Booking[]) => void) {
  // single where() = no composite index needed
  return onSnapshot(
    query(collection(db, "bookings"), where("customerId", "==", uid)),
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Booking)),
  );
}

export async function fetchBooking(id: string): Promise<Booking | null> {
  const s = await getDoc(doc(db, "bookings", id));
  return s.exists() ? ({ id: s.id, ...s.data() } as Booking) : null;
}

export function watchMessages(bookingId: string, cb: (m: Message[]) => void) {
  return onSnapshot(
    query(
      collection(db, "bookings", bookingId, "messages"),
      orderBy("createdAt"),
    ),
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Message)),
  );
}

export function sendMessage(bookingId: string, senderId: string, text: string) {
  return addDoc(collection(db, "bookings", bookingId, "messages"), {
    senderId,
    text,
    createdAt: Date.now(),
  });
}

export function submitReport(uid: string, message: string) {
  return addDoc(collection(db, "reports"), {
    uid,
    message,
    createdAt: Date.now(),
  });
}

// ---------- account helpers (profile screen) ----------
export const updateMyProfile = (uid: string, data: Record<string, unknown>) =>
  setDoc(doc(db, "users", uid), data, { merge: true });

export const resetPassword = (email: string) =>
  sendPasswordResetEmail(auth, email);

export async function deleteMyAccount() {
  const u = auth.currentUser;
  if (!u) return;
  const uid = u.uid;
  await deleteUser(u); // throws auth/requires-recent-login if the session is old
  deleteDoc(doc(db, "users", uid)).catch(() => {}); // best effort; do real cleanup in a Cloud Function later
}
