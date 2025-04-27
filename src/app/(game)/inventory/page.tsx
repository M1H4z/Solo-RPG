"use client";

import React, { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  EquipmentSlots,
  InventoryItem,
  EquipmentSlotType,
  ItemType,
  Rarity,
} from "@/types/item.types";
import { Hunter } from "@/types/hunter.types";
import { EQUIPMENT_SLOTS_ORDER } from "@/constants/inventory.constants";
import { EquipmentDisplay } from "@/components/inventory/EquipmentDisplay";
import { InventoryIconSlot } from "@/components/inventory/InventoryIconSlot";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import Link from "next/link";
import { Separator } from "@/components/ui/Separator";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
} from "@dnd-kit/core";
import InventoryClientContent from "@/components/game/InventoryClientContent";

// Define possible item types for filtering (including 'All')
const itemTypesForFilter: ("All" | ItemType)[] = [
  "All",
  "Weapon",
  "Armor",
  "Accessory",
  "Consumable",
  "Material",
];

// Define rarity order for sorting
const RARITY_ORDER: Rarity[] = [
  "Common",
  "Uncommon",
  "Rare",
  "Epic",
  "Legendary",
  "Mythical",
  "Sovereign",
];

// Define sort options
type SortCriteria =
  | "name_asc"
  | "name_desc"
  | "rarity_asc"
  | "rarity_desc"
  | "type_asc"
  | "type_desc";

// Fetch function now gets full hunter data
async function fetchHunterWithInventoryData(
  hunterId: string,
): Promise<Hunter | null> {
  console.log(`Fetching full hunter data for ${hunterId}...`);
  try {
    const response = await fetch(`/api/hunters/${hunterId}`); // Fetch all hunter data
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch hunter data");
    }
    const data = await response.json();
    console.log("Fetched hunter data:", data);
    return data.hunter as Hunter; // Assuming response structure is { hunter: Hunter }
  } catch (error) {
    console.error("Error fetching hunter data:", error);
    return null; // Return null on error
  }
}

// Tell Next.js not to statically generate this page
export const dynamic = 'force-dynamic';

export default function InventoryPage() {
  return (
    <Suspense fallback={<div>Loading Inventory...</div>}>
      <InventoryClientContent />
    </Suspense>
  );
}
