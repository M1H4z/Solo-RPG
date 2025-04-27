"use client";

import React from "react";
import { EquipmentSlot } from "./EquipmentSlot"; // Assuming EquipmentSlot is in the same directory
import {
  EquipmentSlots,
  InventoryItem,
  EquipmentSlotType,
} from "@/types/item.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"; // Import Tooltip
import { cn } from "@/lib/utils"; // Import cn utility
import { useDroppable } from "@dnd-kit/core"; // Import useDroppable

interface EquipmentSlotDisplayProps {
  slot: EquipmentSlotType;
  item: InventoryItem | null;
  onUnequip: (slot: EquipmentSlotType) => void;
  onSelect: (item: InventoryItem) => void; // New prop for selecting
  isLoading?: boolean; // Use optional chaining
}

const EquipmentSlotDisplay: React.FC<EquipmentSlotDisplayProps> = ({
  slot,
  item,
  onUnequip,
  onSelect,
  isLoading,
}) => {
  const rarityColor = item
    ? `border-${item.rarity.toLowerCase()}`
    : "border-border-secondary"; // Example rarity border

  // --- DnD Droppable Setup ---
  const { setNodeRef, isOver } = useDroppable({
    // Unique ID for the droppable area
    id: `equipment-${slot}`,
    data: {
      // Data for the onDragEnd handler
      type: "equipment-slot",
      slot: slot,
    },
    // Optionally disable dropping if loading or has item (adjust as needed)
    // disabled: isLoading || !!item,
  });

  const handleSelect = () => {
    if (item) {
      onSelect(item);
    }
  };

  return (
    <div className="relative" ref={setNodeRef}>
      {" "}
      {/* Assign droppable ref */}
      <div
        className={cn(
          "relative w-16 h-16 sm:w-20 sm:h-20 border-2 rounded-md flex flex-col items-center justify-center text-center bg-background-secondary/50 transition-all duration-150", // Added transition
          item ? rarityColor : "border-dashed border-border-muted", // Use dashed for empty
          isLoading ? "opacity-50 pointer-events-none" : "",
          item ? "hover:bg-background-tertiary cursor-pointer" : "", // Hover effect only if item exists
          // Style when an item is dragged over this slot
          isOver
            ? "ring-2 ring-primary ring-offset-2 ring-offset-background bg-primary/10"
            : "",
        )}
        onClick={handleSelect}
        onKeyDown={(e) => e.key === "Enter" && handleSelect()}
        tabIndex={item ? 0 : -1}
        aria-label={
          item
            ? `Equipped Item: ${item.name} in ${slot} slot. Click to view details.`
            : `Empty ${slot} slot. Drop equippable item here.`
        } // Updated label
        role={item ? "button" : "region"} // Role changes based on whether it's clickable
        aria-dropeffect={isOver ? "move" : "none"} // Indicate drop effect
      >
        {item ? (
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex size-full flex-col items-center justify-center">
                  <span className="text-2xl sm:text-3xl" aria-hidden="true">
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
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" align="center">
                <p className="font-semibold">
                  {item.name} ({item.rarity})
                </p>
                <p className="text-xs">{item.description}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <>
            <span className="text-text-muted text-xs">{slot}</span>
            <span className="text-xs text-text-disabled">Empty</span>
          </>
        )}
        {/* Visual cue for being droppable (optional, could use ::before/::after) */}
        {isOver && (
          <div className="absolute inset-0 rounded-md border-2 border-primary opacity-50" />
        )}
      </div>
      {/* Unequip Button - positioned absolutely */}
      {item && (
        <Button
          variant="destructive"
          size="icon"
          className="absolute -right-2 -top-2 z-10 size-5 rounded-full"
          onClick={(e) => {
            e.stopPropagation();
            onUnequip(slot);
          }}
          disabled={isLoading}
          aria-label={`Unequip ${item.name}`}
        >
          <span className="text-xs">✕</span>
        </Button>
      )}
    </div>
  );
};

// Define the layout order visually (can be adjusted with CSS grid)
const slotLayout: EquipmentSlotType[] = [
  "Head",
  "Chest",
  "Legs",
  "Feet",
  "MainHand",
  "OffHand",
  "Hands", // Assuming Hands are gloves, often below chest/weapons
  "Accessory1",
  "Accessory2",
];

// Helper to map slot names for display if needed (optional)
const slotDisplayName: Record<EquipmentSlotType, string> = {
  Head: "Head",
  Chest: "Chest",
  Legs: "Legs",
  Feet: "Feet",
  Hands: "Hands",
  MainHand: "Main Hand",
  OffHand: "Off Hand",
  Accessory1: "Accessory 1",
  Accessory2: "Accessory 2",
};

interface EquipmentDisplayProps {
  equipment: EquipmentSlots;
  onUnequip: (slot: EquipmentSlotType) => void;
  onSelect: (item: InventoryItem) => void; // Add onSelect prop here
  isLoading?: Record<string, boolean>; // Loading state per slot/item ID
}

export const EquipmentDisplay: React.FC<EquipmentDisplayProps> = ({
  equipment,
  onUnequip,
  onSelect,
  isLoading = {},
}) => {
  // Define the grid layout structure (adjust as needed for visuals)
  const gridLayout = [
    [null, "Head", null],
    ["MainHand", "Chest", "OffHand"],
    ["Accessory1", "Legs", "Accessory2"],
    ["Hands", "Feet", null], // Added Hands slot
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Equipment</CardTitle>
      </CardHeader>
      <CardContent className="flex justify-center">
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {gridLayout.flat().map((slotKey, index) => {
            if (!slotKey) {
              // Render an empty placeholder div for layout balancing
              return (
                <div
                  key={`placeholder-${index}`}
                  className="size-16 sm:size-20"
                ></div>
              );
            }

            const slot = slotKey as EquipmentSlotType;
            const item = equipment[slot] ?? null;
            // Check loading state: could be based on slot or the item's inventoryId if available
            const slotIsLoading =
              isLoading[slot] || (item && isLoading[item.inventoryId]);

            return (
              <EquipmentSlotDisplay
                key={slot}
                slot={slot}
                item={item}
                onUnequip={onUnequip}
                onSelect={onSelect} // Pass down the onSelect handler
                isLoading={!!slotIsLoading} // Pass down loading state
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
