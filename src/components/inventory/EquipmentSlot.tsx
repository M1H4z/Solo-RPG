"use client";

import React from "react";
import Image from "next/image";
import { InventoryItem, EquipmentSlotType } from "@/types/item.types";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { RarityColors, RarityGradientColors } from "../../constants/colors";

interface EquipmentSlotProps {
  slotType: EquipmentSlotType;
  item: InventoryItem | null | undefined;
  onUnequip: (slot: EquipmentSlotType) => void;
  isLoading?: boolean;
}

export const EquipmentSlot: React.FC<EquipmentSlotProps> = ({
  slotType,
  item,
  onUnequip,
  isLoading = false,
}) => {
  const handleUnequipClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item && !isLoading) {
      onUnequip(slotType);
    }
  };

  const rarityBorderColor = item
    ? RarityColors[item.rarity]
    : "border-border/50";
  const rarityGradientColor = item
    ? RarityGradientColors[item.rarity]
    : "gray-500";
  const backgroundClass = item
    ? `bg-gradient-to-br from-background/50 to-${rarityGradientColor}/10`
    : "bg-background-secondary/30";

  let slotContent = null;
  if (isLoading) {
    slotContent = (
      <div className="flex size-full flex-col items-center justify-center p-1">
        <div className="text-text-muted text-xs">...</div>
      </div>
    );
  } else if (item) {
    slotContent = (
      <div className="flex size-full flex-col items-center justify-center gap-0 p-1">
        <div className="relative mb-0.5 flex w-full grow items-center justify-center">
          <span className="text-2xl sm:text-3xl">
            {item.icon?.includes("sword")
              ? "⚔️"
              : item.icon?.includes("head")
                ? "👑"
                : "🛡️"}
          </span>
        </div>
        <span className="w-full truncate text-center text-[11px] font-medium leading-tight text-text-primary">
          {item.name}
        </span>
        <Button
          variant="destructive"
          size="sm"
          className="absolute right-0.5 top-0.5 flex size-4 items-center justify-center p-0 opacity-60 transition-opacity group-hover:opacity-100"
          onClick={handleUnequipClick}
          aria-label={`Unequip ${item.name}`}
          disabled={isLoading}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </Button>
      </div>
    );
  } else {
    slotContent = (
      <div className="flex size-full flex-col items-center justify-center p-1">
        <span className="text-xs italic text-text-disabled transition-colors group-hover:text-text-secondary">
          Empty
        </span>
      </div>
    );
  }

  return (
    <Card
      className={cn(
        "relative w-full h-full flex flex-col items-center justify-center text-center p-1 transition-colors group",
        item
          ? `border-2 ${rarityBorderColor}`
          : "border-2 border-dashed border-border/50",
        backgroundClass,
        isLoading ? "opacity-50 cursor-not-allowed" : "hover:bg-primary/5",
      )}
    >
      <CardContent className="relative flex size-full flex-col items-center justify-center p-0">
        {!item && !isLoading && (
          <span className="absolute left-1 top-1 text-[10px] font-semibold text-text-secondary opacity-50 transition-opacity group-hover:opacity-75">
            {slotType}
          </span>
        )}
        {slotContent}
      </CardContent>
    </Card>
  );
};
