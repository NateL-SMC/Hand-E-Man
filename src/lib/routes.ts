// One place for every route. If your Chat/Reviews files are lowercase (chat.tsx / reviews.tsx), change them here.
export const ROUTES = {
  search: "/Customer/SearchMenu",
  bookings: "/Customer/Bookings",
  profile: "/Customer/UserProfile",
  service: (id: string) => `/Customer/ServiceInfo?id=${id}`,
  request: (id: string, packageId: string, date: string) =>
    `/Customer/RequestInfo?id=${id}&packageId=${packageId}&date=${date}`,
  reviews: (id: string) => `/Reviews?id=${id}`,
  chat: (bookingId: string) => `/Chat?bookingId=${bookingId}`,
} as const;
