export type Coords = { latitude: number; longitude: number };
export type TrackStage = "accepted" | "on_the_way" | "arrived" | "finished";

export type Package = { id: string; title: string; price: number; description: string };

export type Handyman = {
  id: string;
  name: string;
  category: string;
  headline: string; // "Master Plumber"
  yearsExp: number;
  rating: number;
  reviewCount: number;
  active: boolean;
  tags: string[];
  distanceKm: number;
  photoUrl?: string;
  phone: string;
  packages: Package[];
  minPrice: number;
  availableWeekdays: number[]; // 0 = Sun ... 6 = Sat
  unavailableDates: string[]; // "YYYY-MM-DD"
  // worker-side additions
  ownerUid?: string; // auth uid of the worker who controls this profile
  status?: "available" | "on_job" | "unavailable";
  bio?: string;
  coords?: Coords;
  locationLabel?: string;
};

export type Review = { id: string; author: string; authorId?: string; rating: number; text: string; createdAt: number };

export type BookingStatus = "pending" | "upcoming" | "ongoing" | "completed" | "cancelled";

export type Booking = {
  id: string;
  customerId: string;
  customerName?: string;
  customerPhone?: string;
  handymanId: string;
  handymanUid?: string; // auth uid of the worker (used by rules + worker queries)
  handymanName: string;
  handymanPhone: string;
  handymanPhoto?: string;
  category: string;
  packageTitle: string;
  date: string; // "YYYY-MM-DD"
  time: string;
  status: BookingStatus;
  address: string;
  paymentMethod: "cash" | "paypal";
  paymentStatus: "unpaid" | "paid";
  paypalOrderId?: string;
  serviceCost: number;
  priorityFee: number;
  vat: number;
  total: number;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  cancelledBy?: "worker" | "customer";
  acceptedAt?: number;
  arrivedAt?: number;
  trackStage?: TrackStage;
  destination?: Coords; // where the worker is heading (geocoded from the job address)
  workerLocation?: Coords & { updatedAt: number }; // live position, written by the worker's phone
};

export type Message = { id: string; senderId: string; text: string; createdAt: number };

// One chat room per customer <-> worker pair (id = `${customerId}_${handymanUid}`)
export type ChatRoom = {
  id: string;
  customerId: string;
  customerName?: string;
  customerPhone?: string;
  handymanUid: string;
  handymanId?: string;
  handymanName: string;
  handymanPhone?: string;
  lastMessage?: string;
  updatedAt?: number;
};
