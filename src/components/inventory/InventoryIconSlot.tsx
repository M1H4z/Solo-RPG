"use client";

import React from "react";
import { InventoryItem } from "@/types/item.types";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card"; // Keep Card for consistent border/bg
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RarityColors, RarityGradientColors } from "../../constants/colors"; // Adjust path if needed
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

interface InventoryIconSlotProps {
  item: InventoryItem;
  onClick: () => void; // Callback when the slot is clicked
  isSelected: boolean; // Is this the currently selected item?
  isLoading: boolean; // Optional loading state (e.g., during equip/use)
  isDragging?: boolean; // Add the new prop
}

export const InventoryIconSlot: React.FC<InventoryIconSlotProps> = ({
  item,
  onClick,
  isSelected,
  isLoading,
  isDragging = false, // Default to false
}) => {
  const rarityBorderColor = RarityColors[item.rarity] || "border-border/50";
  const rarityGradientColor = RarityGradientColors[item.rarity] || "gray-500";
  const backgroundClass = `bg-gradient-to-br from-background/50 to-${rarityGradientColor}/10`;

  // --- DnD Setup ---
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: dndIsDragging } =
    useDraggable({
      id: item.inventoryId, // Use inventoryId as the unique draggable ID
      data: {
        type: "inventory",
        item: item, // Pass the full item data
      },
    });

  // Style for the dragging transform
  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        transition: transition ?? "", // Apply transition if provided by dnd-kit
        zIndex: 10, // Ensure dragged item is on top
      }
    : undefined;

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          {/* Use Card for consistent styling and interaction surface */}
          <Card
            className={cn(
              "relative aspect-square flex items-center justify-center text-center p-1 transition-all duration-150 ease-in-out group cursor-pointer",
              // Border based on rarity and selection state
              isSelected
                ? `border-2 border-ring ring-2 ring-ring ring-offset-2 ring-offset-background`
                : `border-2 ${rarityBorderColor} hover:border-primary/70`,
              backgroundClass,
              isLoading ? "opacity-50 cursor-not-allowed" : "",
              isDragging ? "opacity-0" : "opacity-100", // Apply opacity when dragging
            )}
            onClick={onClick} // Handle click on the card itself
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick()} // A11y
            role="button"
            tabIndex={isLoading ? -1 : 0}
            aria-label={`${item.name} (${item.rarity})${item.quantity > 1 ? ` x${item.quantity}` : ""}${isSelected ? ", Selected" : ""}`}
            aria-pressed={isSelected}
            aria-disabled={isLoading}
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
          >
            {/* Content: Icon or Quantity */}
            <div className="relative flex size-full items-center justify-center">
              {/* Basic icon display - TODO: Improve this */}
              <span className="text-2xl sm:text-3xl">
                {item.icon?.includes("sword")
                  ? "⚔️"
                  : item.icon?.includes("head")
                    ? "👑"
                    : item.icon?.includes("potion")
                      ? "🧪"
                      : item.icon?.includes("ear")
                        ? "👂"
                        : "📦"}
              </span>

              {/* Quantity Badge for stackable items */}
              {item.stackable && item.quantity > 1 && (
                <span className="text-primary-foreground absolute bottom-0 right-0 rounded-sm bg-primary px-1 py-0 text-[10px] font-semibold leading-none">
                  x{item.quantity}
                </span>
              )}
            </div>
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/70">
                <div className="text-text-muted text-xs">...</div>
              </div>
            )}
          </Card>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          align="center"
          className="z-50 max-w-xs p-3 text-sm"
        >
          {/* Tooltip Content: Item Details */}
          <div className="space-y-1.5">
            <p className="text-base font-semibold text-text-primary">
              {item.name}
            </p>
            <p className="text-text-muted text-xs">
              {item.type} - {item.rarity}
            </p>
            <p className="whitespace-normal text-xs">{item.description}</p>
            {item.stats && (
              <ul className="mt-2 list-inside list-disc space-y-0.5 text-xs">
                {Object.entries(item.stats).map(([stat, value]) => (
                  <li key={stat}>
                    <span className="font-medium capitalize text-text-primary/90">
                      {stat}:
                    </span>{" "}
                    +{value}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
