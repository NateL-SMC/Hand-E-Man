const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const peso = (n: number) => "₱" + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

export const toISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const parseISO = (iso: string) => new Date(iso + "T00:00:00");

export const prettyDate = (iso: string) => {
  const d = parseISO(iso);
  return `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
};

export const shortDate = (ms: number) => {
  const d = new Date(ms);
  const diff = Math.floor((Date.now() - ms) / 86400000);
  if (diff < 1) return "Today";
  if (diff < 2) return "Yesterday";
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${String(d.getFullYear()).slice(2)}`;
};

export const dayLabel = (d: Date) => DAYS[d.getDay()];

export const timeAgo = (ms: number) => {
  const m = Math.max(0, Math.floor((Date.now() - ms) / 60000));
  if (m < 1) return "just now";
  if (m < 60) return `${m} min${m === 1 ? "" : "s"} ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr${h === 1 ? "" : "s"} ago`;
  return `${Math.floor(h / 24)}d ago`;
};
