import { Rarity } from "@/types/item.types";

// Mapping of rarity to Tailwind CSS border color classes
export const RarityColors: Record<Rarity, string> = {
  Common: "border-gray-400", // Example: Default gray
  Uncommon: "border-green-500", // Example: Green
  Rare: "border-blue-500", // Example: Blue
  Epic: "border-purple-500", // Example: Purple
  Legendary: "border-orange-500", // Example: Orange
  Mythical: "border-red-500", // Example: Red
  Sovereign: "border-yellow-400", // Example: Gold/Yellow
};

// Mapping of rarity to Tailwind CSS background gradient *to* color
// Used like `bg-gradient-to-br from-background/50 to-${RarityGradientColors[rarity]}/10`
// Ensure these color stops are defined in tailwind.config.js if using arbitrary values
export const RarityGradientColors: Record<Rarity, string> = {
  Common: "gray-500", // Match border color name for consistency
  Uncommon: "green-500",
  Rare: "blue-500",
  Epic: "purple-500",
  Legendary: "orange-500",
  Mythical: "red-500",
  Sovereign: "yellow-400",
};
