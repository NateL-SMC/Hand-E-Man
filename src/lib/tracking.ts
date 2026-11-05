import type { Booking, TrackStage } from "./types";

export const STAGES: { key: TrackStage; label: string }[] = [
  { key: "accepted", label: "Accepted" },
  { key: "on_the_way", label: "On the Way" },
  { key: "arrived", label: "Arrived" },
  { key: "finished", label: "Finished" },
];

/** Current stage, with a sensible fallback for bookings made before trackStage existed. */
export function stageOf(b: Booking): TrackStage {
  if (b.status === "completed") return "finished";
  return b.trackStage ?? (b.status === "ongoing" ? "on_the_way" : "accepted");
}
