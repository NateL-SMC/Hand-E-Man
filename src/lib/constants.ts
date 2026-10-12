import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ComponentProps } from "react";

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

export const CATEGORIES: { label: string; icon: IconName }[] = [
  { label: "Plumbing", icon: "pipe-wrench" },
  { label: "Electrical", icon: "power-plug" },
  { label: "Cleaning", icon: "broom" },
  { label: "Mechanical", icon: "cog" },
  { label: "Aircon", icon: "air-conditioner" },
  { label: "Pest Control", icon: "bug" },
  { label: "Carpentry", icon: "hammer-wrench" },
];

export const FILTERS = ["Urgent", "Price: Low-High", "Rating: 4.5+", "Nearby"];
export const DEFAULT_LOCATION = "Tibanga, Iligan City"; // dummy until GPS is added
export const DEFAULT_ADDRESS = "Add your home address";
export const DEFAULT_TIME = "10:00 AM";
