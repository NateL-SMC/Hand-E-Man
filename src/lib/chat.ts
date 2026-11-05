// ONE chat room per customer <-> worker pair, no matter how many jobs they share.
import { addDoc, collection, doc, getDoc, onSnapshot, orderBy, query, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { ROUTES } from "./routes";
import type { Booking, ChatRoom, Message } from "./types";

export const chatIdOf = (customerId: string, handymanUid: string) => `${customerId}_${handymanUid}`;

const clean = <T extends object>(o: T) => JSON.parse(JSON.stringify(o));

/** Create the room if it doesn't exist (or refresh names/phones), then open it. */
export async function openChat(router: { push: (p: any) => void }, b: Booking) {
  const handymanUid = b.handymanUid ?? b.handymanId;
  const id = chatIdOf(b.customerId, handymanUid);
  await setDoc(
    doc(db, "chats", id),
    clean({
      customerId: b.customerId, customerName: b.customerName, customerPhone: b.customerPhone,
      handymanUid, handymanId: b.handymanId, handymanName: b.handymanName, handymanPhone: b.handymanPhone,
    }),
    { merge: true }
  );
  router.push(ROUTES.chat(id));
}

export async function fetchChat(chatId: string): Promise<ChatRoom | null> {
  const s = await getDoc(doc(db, "chats", chatId));
  return s.exists() ? ({ id: s.id, ...s.data() } as ChatRoom) : null;
}

export function watchMessages(chatId: string, cb: (m: Message[]) => void) {
  return onSnapshot(query(collection(db, "chats", chatId, "messages"), orderBy("createdAt")), (snap) =>
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Message)))
  );
}

export async function sendMessage(chatId: string, senderId: string, text: string) {
  const createdAt = Date.now();
  await addDoc(collection(db, "chats", chatId, "messages"), { senderId, text, createdAt });
  await updateDoc(doc(db, "chats", chatId), { lastMessage: text, updatedAt: createdAt });
}
