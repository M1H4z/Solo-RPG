"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  Suspense,
} from "react";
import {
  useSearchParams,
  useRouter
} from "next/navigation";
import {
  EquipmentSlots,
  InventoryItem,
  EquipmentSlotType,
  ItemType,
  Rarity,
} from "@/types/item.types";
import {
  Hunter
} from "@/types/hunter.types";
import {
  EQUIPMENT_SLOTS_ORDER
} from "@/constants/inventory.constants";
import {
  EquipmentDisplay
} from "@/components/inventory/EquipmentDisplay";
import {
  InventoryIconSlot
} from "@/components/inventory/InventoryIconSlot";
import {
  Button
} from "@/components/ui/Button";
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
import {
  Separator
} from "@/components/ui/Separator";
import {
  cn
} from "@/lib/utils";
import {
  toast,
  Toaster
} from "sonner";
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
  DragStartEvent,
} from "@dnd-kit/core";
import RealTimeClock from "@/components/ui/RealTimeClock";

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
  |"name_asc"
  |"name_desc"
  |"rarity_asc"
  |"rarity_desc"
  |"type_asc"
  |"type_desc";

// Fetch function now gets full hunter data
async function fetchHunterWithInventoryData(
  hunterId: string,
): Promise < Hunter | null > {
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

// Inner component that uses the hook
function InventoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hunterId = searchParams.get("hunterId");

  const [inventory, setInventory] = useState < InventoryItem[] > ([]);
  const [equipment, setEquipment] = useState < EquipmentSlots > ({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState < string | null > (null);
  const [actionLoading, setActionLoading] = useState < Record < string, boolean >> (
    {},
  );

  const [filterType, setFilterType] = useState < "All" | ItemType > ("All");
  const [sortCriteria, setSortCriteria] = useState < SortCriteria > ("rarity_desc");

  const [selectedItem, setSelectedItem] = useState < InventoryItem | null > (null);
  const [isSelectedItemEquipped, setIsSelectedItemEquipped] =
  useState < boolean > (false);
  const [activeDragItem, setActiveDragItem] = useState < InventoryItem | null > (
    null,
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10
      },
    }),
    useSensor(KeyboardSensor, {
      // Add keyboard controls if needed
    }),
  );

  const loadData = useCallback(async () => {
    if (!hunterId) {
      setError("Hunter ID is missing.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const fetchedHunter = await fetchHunterWithInventoryData(hunterId);
      if (fetchedHunter) {
        setInventory(fetchedHunter.inventory || []); // Extract inventory
        setEquipment(fetchedHunter.equipment || {}); // Extract equipment
      } else {
        throw new Error("Failed to load hunter data.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load inventory.");
      setInventory([]);
      setEquipment({});
    } finally {
      setLoading(false);
      setSelectedItem(null);
    }
  }, [hunterId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const displayedInventory = useMemo(() => {
    const equippedItemIds = new Set(
      Object.values(equipment)
      .filter((item): item is InventoryItem => item !== null)
      .map((item) => item.inventoryId),
    );

    let items = [...inventory];

    if (filterType !== "All") {
      items = items.filter((item) => item.type === filterType);
    }
    items = items.filter((item) => !equippedItemIds.has(item.inventoryId));

    items.sort((a, b) => {
      switch (sortCriteria) {
        case "name_asc":
          return a.name.localeCompare(b.name);
        case "name_desc":
          return b.name.localeCompare(a.name);
        case "rarity_asc":
          return (
            RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity)
          );
        case "rarity_desc":
          return (
            RARITY_ORDER.indexOf(b.rarity) - RARITY_ORDER.indexOf(a.rarity)
          );
        case "type_asc":
          // Handle missing types: sort them to the end
          if (!a.type && !b.type) return 0; // Both missing, treat as equal
          if (!a.type) return 1; // a missing, comes after b
          if (!b.type) return -1; // b missing, comes after a
          return (a.type || "").localeCompare(b.type || ""); // Use correct property: type
        case "type_desc":
          // Handle missing types: sort them to the beginning
          if (!a.type && !b.type) return 0; // Both missing, treat as equal
          if (!a.type) return -1; // a missing, comes before b
          if (!b.type) return 1; // b missing, comes before a
          return (b.type || "").localeCompare(a.type || ""); // Use correct property: type
        default:
          return 0;
      }
    });

    // Log the items after sorting
    console.log(`Sorted Items (Criteria: ${sortCriteria}):`, [...items]);

    return items;
  }, [inventory, equipment, filterType, sortCriteria]);

  const setItemActionLoading = (inventoryId: string, isLoading: boolean) => {
    setActionLoading((prev) => ({
      ...prev,
      [inventoryId]: isLoading
    }));
  };

  const handleAddItem = async () => {
    if (!hunterId) return;
    setItemActionLoading("add-item", true);
    try {
      const response = await fetch(`/api/hunters/${hunterId}/add-item`, {
        method: "POST",
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to add item");
      toast.success(`Added: ${result.addedItem?.name || "Unknown Item"}`);
      if (Array.isArray(result.inventory)) {
          setInventory(result.inventory);
      } else {
           console.warn("/add-item API did not return a valid inventory array.");
      }
    } catch (err: any) {
      console.error("Error adding item:", err);
      toast.error(`Error adding item: ${err.message}`);
    } finally {
      setItemActionLoading("add-item", false);
    }
  };

  const handleEquipItem = async (inventoryId: string) => {
    if (!hunterId || !selectedItem || selectedItem.inventoryId !== inventoryId)
      return;

    const itemToEquip = selectedItem;
    const slot = itemToEquip.slot;
    if (!slot) return; // Cannot equip item without a designated slot

    // Store previous state for potential rollback
    const previousInventory = [...inventory];
    const previousEquipment = { ...equipment };

    // Optimistic UI Update
    setItemActionLoading(inventoryId, true);
    setError(null);
    setSelectedItem(null); // Close panel immediately

    // Determine the actual target slot(s)
    // TODO: Handle complex slot logic (e.g., MainHand/OffHand choice)
    const targetSlot = slot; // Basic case

    // Optimistically remove from inventory
    const newInventory = previousInventory.filter(i => i.inventoryId !== inventoryId);
    // Optimistically add to equipment
    const newEquipment = { ...previousEquipment, [targetSlot]: itemToEquip };

    setInventory(newInventory);
    setEquipment(newEquipment);
    // --- End Optimistic Update

    try {
      const response = await fetch(`/api/hunters/${hunterId}/equip`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ inventoryId }), // Backend decides final slot based on item
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to equip item");

      // On success, update state with potentially confirmed data from backend (optional)
      // For now, just ensure the loading state is off and show success toast
      if (Array.isArray(result.inventory)) {
        setInventory(result.inventory); // Use backend confirmed state
      } else {
        console.warn("/equip API did not return a valid inventory array. State might be inconsistent.");
        // Optionally revert or refetch here if inventory consistency is critical
      }
      setEquipment(result.equipment); // Use backend confirmed state
      toast.success(`${itemToEquip.name} equipped successfully.`);

    } catch (err: any) {
      console.error("Error equipping item:", err);
      setError(err.message);
      toast.error(`Error equipping ${itemToEquip.name}: ${err.message}`);
      // Rollback UI on error
      setInventory(previousInventory);
      setEquipment(previousEquipment);
      setSelectedItem(itemToEquip); // Re-select the item
    } finally {
      setItemActionLoading(inventoryId, false);
    }
  };

  const handleUnequipItem = async (slot: EquipmentSlotType) => {
    if (!hunterId || !equipment[slot]) return;

    const itemToUnequip = equipment[slot];
    if (!itemToUnequip) return;

    const inventoryId = itemToUnequip.inventoryId;

    // Store previous state
    const previousInventory = [...inventory];
    const previousEquipment = { ...equipment };

    // Optimistic UI Update
    setItemActionLoading(inventoryId || slot, true);
    setError(null);
    closeDetailsPanel(); // Close panel immediately

    const newEquipment = { ...previousEquipment, [slot]: null }; // Remove from slot optimistically

    setEquipment(newEquipment); // Only update equipment optimistically
    // --- End Optimistic Update

    try {
      const response = await fetch(`/api/hunters/${hunterId}/unequip`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ slot }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to unequip item");

      // Success: Confirm state with backend data (optional but good practice)
      setEquipment(result.equipment); // Use backend confirmed state
      // Inventory might also change if backend manages it differently
      if (Array.isArray(result.inventory)) {
         setInventory(result.inventory); // If backend returns updated inventory
      } else {
         console.warn("/unequip API did not return a valid inventory array. State might be inconsistent.");
      }
      toast.success(`${itemToUnequip.name} unequipped.`);

    } catch (err: any) {
      console.error("Error unequipping item:", err);
      toast.error(`Error unequipping ${itemToUnequip.name}: ${err.message}`);
      // Rollback UI - Restore previous equipment state
      setEquipment(previousEquipment);
      // No need to rollback inventory optimistically if it wasn't changed optimistically
      // setInventory(previousInventory); // This might be needed if sync fails badly
    } finally {
      setItemActionLoading(inventoryId || slot, false);
    }
  };

  const handleUseItem = async (inventoryId: string) => {
    if (!hunterId) return;
    if (actionLoading[inventoryId]) return; // Prevent double clicks

    console.log(`Attempting to use item: ${inventoryId}`);
    setItemActionLoading(inventoryId, true);

    try {
      const response = await fetch('/api/items/use', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hunterId, inventoryInstanceId: inventoryId }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        if (response.headers.get("content-type")?.includes("text/html")) {
          throw new Error(`Server returned an HTML error page (Status: ${response.status})`);
        } 
        throw new Error(result.message || `Failed to use item (status: ${response.status})`);
      }

      toast.success(result.message || 'Item used successfully!');
      await loadData();

    } catch (err: any) {
      console.error(`Use item error (${inventoryId}):`, err);
      if (err instanceof SyntaxError) {
           toast.error(`Failed to use item: Server returned an unexpected response.`);
      } else {
      toast.error(`Failed to use item: ${err.message}`);
      }
    } finally {
      setItemActionLoading(inventoryId, false);
    }
  };

  const handleDropItem = async (inventoryId: string, itemName: string) => {
    if (!hunterId) return;

    // Find the item to potentially re-select on error
    const itemToDrop = inventory.find(i => i.inventoryId === inventoryId);

    // --- Replace confirm() with toast with actions ---
    toast.warning(
        `Are you sure you want to drop ${itemName}? This cannot be undone.`,
        {
            action: {
                label: "Confirm Drop",
                onClick: async () => {
                    // --- Logic moved inside the confirm action ---
                    // Store previous state
                    const previousInventory = [...inventory];

                    // Optimistic Update
                    setItemActionLoading(inventoryId, true);
                    setSelectedItem(null); // Close panel
                    const newInventory = previousInventory.filter(item => item.inventoryId !== inventoryId);
                    setInventory(newInventory);
                    // --- End Optimistic Update

                    try {
                        const response = await fetch(`/api/hunters/${hunterId}/drop-item`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ inventoryId: inventoryId }),
                        });
                        const data = await response.json();
                        if (!response.ok) throw new Error(data.error || "Failed to drop item");

                        // Success: UI already updated, just show toast
                        if (Array.isArray(data.inventory)) {
                            setInventory(data.inventory);
                        } else {
                            console.warn("/drop-item API did not return a valid inventory array (or did not return one).");
                        }
                        toast.success(`${itemName} dropped successfully.`);

                    } catch (error: any) {
                        console.error("Error dropping item:", error);
                        toast.error(`Error dropping ${itemName}: ${error.message}`);
                        // Rollback UI
                        setInventory(previousInventory);
                        if (itemToDrop) setSelectedItem(itemToDrop); // Re-select if possible
                    } finally {
                        setItemActionLoading(inventoryId, false);
                    }
                    // --- End of logic moved inside confirm action ---
                },
            },
            cancel: {
                label: "Cancel",
                onClick: () => { /* Do nothing, just dismiss */ }
            },
            duration: 10000, // Keep toast longer for confirmation
        }
    );

    // --- REMOVED Original try...catch block that was outside confirm() ---
  };

  const handleEquipmentSelect = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsSelectedItemEquipped(true);
  };

  const handleInventorySelect = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsSelectedItemEquipped(false);
  };

  const closeDetailsPanel = () => {
    setSelectedItem(null);
    setIsSelectedItemEquipped(false);
  };

  const handleDragStart = (event: DragStartEvent) => {
    console.log("Drag Start:", event.active.id, event.active.data.current);
    if (event.active.data.current?.item) {
      setActiveDragItem(event.active.data.current.item);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragItem(null);
    const {
      active,
      over
    } = event;

    if (!over) {
      console.log("Drag ended outside droppable area.");
      return;
    }

    const activeId = active.id;
    const overId = over.id;
    const activeData = active.data.current;
    const overData = over.data.current;

    console.log("Drag Ended: ", {
      activeId,
      activeData,
      overId,
      overData
    });

    if (
      activeData?.type === "inventory" &&
      overData?.type === "equipment-slot"
    ) {
      const draggedItem = activeData.item as InventoryItem;
      const targetSlot = overData.slot as EquipmentSlotType;

      if (!draggedItem || !targetSlot) {
        console.error("Missing data for inventory -> equipment drop");
        return;
      }

      let isValidDrop = false;
      let specificSlotTargetAPI = false;

      if (draggedItem.slot === targetSlot) {
        isValidDrop = true;
      } else if (
        draggedItem.slot === "MainHand" &&
        (targetSlot === "MainHand" || targetSlot === "OffHand")
      ) {
        isValidDrop = true;
        specificSlotTargetAPI = true;
      }

      if (isValidDrop) {
        if (specificSlotTargetAPI) {
          handleEquipItemToSlotViaDnD(
            draggedItem.inventoryId,
            draggedItem.name,
            targetSlot,
          );
        } else {
          handleEquipItemViaDnD(draggedItem.inventoryId, draggedItem.name);
        }
      } else {
        toast.error(
          `Cannot equip ${draggedItem.name} (${draggedItem.slot}) in the ${targetSlot} slot.`,
        );
      }
    } else {
      console.log("Unhandled drag scenario:", {
        activeType: activeData?.type,
        overType: overData?.type,
      });
    }
  };

  const handleEquipItemViaDnD = async (
    inventoryId: string,
    itemName: string,
  ) => {
    if (!hunterId) return;

    const itemToEquip = inventory.find(i => i.inventoryId === inventoryId);
    if (!itemToEquip || !itemToEquip.slot) {
        toast.error("Cannot equip this item.");
        return;
    }
    const targetSlot = itemToEquip.slot; // Use item's default slot

    // Store previous state for rollback
    const previousInventory = [...inventory];
    const previousEquipment = { ...equipment };

    // Optimistic Update
    setItemActionLoading(inventoryId, true);
    setError(null);
    setSelectedItem(null); // Close details panel

    // Optimistically remove from inventory
    const newInventory = previousInventory.filter(i => i.inventoryId !== inventoryId);
    // Optimistically add to equipment
    const newEquipment = { ...previousEquipment, [targetSlot]: itemToEquip };

    setInventory(newInventory);
    setEquipment(newEquipment);
    // --- End Optimistic Update

    try {
      const response = await fetch(`/api/hunters/${hunterId}/equip`, { // Uses the standard equip endpoint
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inventoryId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to equip item");

      // Sync with backend state on success
      if (Array.isArray(result.inventory)) {
          setInventory(result.inventory);
      } else {
          console.warn("/equip API (DnD) did not return a valid inventory array.");
      }
      setEquipment(result.equipment);
      toast.success(`${itemName} equipped successfully.`);

    } catch (err: any) {
      console.error("Error equipping item via DnD (default slot):", err);
      toast.error(`Error equipping ${itemName}: ${err.message}`);
      // Rollback
      setInventory(previousInventory);
      setEquipment(previousEquipment);
    } finally {
      setItemActionLoading(inventoryId, false);
    }
  };

  const handleEquipItemToSlotViaDnD = async (
    inventoryId: string,
    itemName: string,
    targetSlot: EquipmentSlotType, // Specific slot from drop target
  ) => {
    if (!hunterId) return;

    const itemToEquip = inventory.find(i => i.inventoryId === inventoryId);
     if (!itemToEquip) {
        toast.error("Item not found.");
        return;
    }
    // Validation if needed (e.g., can item actually go in targetSlot?)
    // For now, assume backend handles validation primarily

    // Store previous state for rollback
    const previousInventory = [...inventory];
    const previousEquipment = { ...equipment };

    // Optimistic Update
    setItemActionLoading(inventoryId, true);
    setError(null);
    setSelectedItem(null); // Close details panel

    // Optimistically remove from inventory
    const newInventory = previousInventory.filter(i => i.inventoryId !== inventoryId);
    // Optimistically add to equipment
    const newEquipment = { ...previousEquipment, [targetSlot]: itemToEquip };

    setInventory(newInventory);
    setEquipment(newEquipment);
    // --- End Optimistic Update

    try {
      // Ensure this API endpoint exists and handles targetSlot correctly
      const response = await fetch(`/api/hunters/${hunterId}/equip-to-slot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inventoryId, targetSlot }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to equip item to slot");

      // Sync with backend state on success
      if (Array.isArray(result.inventory)) {
        setInventory(result.inventory);
      } else {
         console.warn("/equip-to-slot API did not return a valid inventory array.");
      }
      setEquipment(result.equipment);
      toast.success(`${itemName} equipped successfully to ${targetSlot}.`);

    } catch (err: any) {
      console.error(`Error equipping item via DnD (specific slot ${targetSlot}):`, err);
      toast.error(`Error equipping ${itemName}: ${err.message}`);
      // Rollback
      setInventory(previousInventory);
      setEquipment(previousEquipment);
    } finally {
      setItemActionLoading(inventoryId, false);
    }
  };

  if (!hunterId) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="mb-4 text-danger">Hunter ID not found in URL.</p>
        <Button variant="outline" asChild>
          <Link href="/hunters">Select Hunter</Link>
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        Loading Inventory...
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <TooltipProvider>
        <Toaster position="bottom-right" richColors />

        <div className="container mx-auto px-4 py-8 sm:py-12">
            <Card className="mb-6 sm:mb-8 sticky top-0 z-50">
              <CardHeader className="grid grid-cols-[1fr_auto_1fr] items-baseline gap-2 px-3 py-2 sm:gap-4 sm:px-6 sm:py-3">
                <h1 className="text-lg font-bold text-text-primary sm:text-xl">Inventory</h1>
                <div className="justify-self-center flex items-center">
                    <RealTimeClock />
                </div>
                <div className="justify-self-end flex items-center">
                    <Button variant="link" className="px-0 text-xs sm:text-sm" asChild>
                      <Link href={`/dashboard?hunterId=${hunterId}`}>&larr; Back to Dashboard</Link>
                    </Button>
                </div>
              </CardHeader>
            </Card>
    
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3"> 
                <div className="lg:col-span-1">
                    <EquipmentDisplay
                        equipment={equipment}
                        onUnequip={handleUnequipItem}
                        onSelect={handleEquipmentSelect}
                        isLoading={actionLoading}
                    />
                </div>
                <div className="space-y-6 lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Items ({displayedInventory.length})</CardTitle>
                            <div className="mt-4 flex flex-wrap gap-4">
                                <Select
                                    value={filterType}
                                    onValueChange={(value) => {
                                        setFilterType(value as "All" | ItemType);
                                        setSelectedItem(null);
                                    }}
                                >
                                    <SelectTrigger className="w-full sm:w-[180px]">
                                        <SelectValue placeholder="Filter by Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {itemTypesForFilter.map((type) => (
                                            <SelectItem key={type} value={type}>
                                                {type}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select
                                    value={sortCriteria}
                                    onValueChange={(value) => {
                                        const newSortCriteria = value as SortCriteria;
                                        console.log("Sort criteria changed to:", newSortCriteria);
                                        setSortCriteria(newSortCriteria);
                                        setSelectedItem(null);
                                    }}
                                >
                                    <SelectTrigger className="w-full sm:w-[180px]">
                                        <SelectValue placeholder="Sort By" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="rarity_desc">
                                            Rarity (Desc)
                                        </SelectItem>
                                        <SelectItem value="rarity_asc">
                                            Rarity (Asc)
                                        </SelectItem>
                                        <SelectItem value="name_asc">Name (A-Z)</SelectItem>
                                        <SelectItem value="name_desc">Name (Z-A)</SelectItem>
                                        <SelectItem value="type_asc">Type (A-Z)</SelectItem>
                                        <SelectItem value="type_desc">Type (Z-A)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="mt-4 border-t border-border-dark pt-4">
                                <Button
                                    onClick={handleAddItem}
                                    disabled={!!actionLoading["add-item"]}
                                    variant="secondary"
                                    size="sm"
                                >
                                    {actionLoading["add-item"]
                                    ? "Adding..."
                                    : "Add Random Item (Test)"}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-6 gap-2 sm:grid-cols-8 md:grid-cols-10">
                                {displayedInventory.map((item) => (
                                    <InventoryIconSlot
                                        key={item.inventoryId}
                                        item={item}
                                        onClick={() => handleInventorySelect(item)}
                                        isSelected={
                                            selectedItem?.inventoryId === item.inventoryId
                                        }
                                        isLoading={!!actionLoading[item.inventoryId]}
                                        isDragging={activeDragItem?.inventoryId === item.inventoryId}
                                    />
                                ))}
                            </div>
                            {displayedInventory.length === 0 && (
                                <p className="py-6 text-center italic text-text-disabled">
                                    {inventory.filter(
                                        (item) =>
                                        !new Set(
                                            Object.values(equipment)
                                            .filter((i) => i)
                                            .map((i) => i!.inventoryId),
                                        ).has(item.inventoryId),
                                    ).length === 0
                                        ? "Your inventory is empty."
                                        : `No items match the current filters.`}
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    <Card
                        className={cn(
                            "transition-opacity duration-300",
                            selectedItem ?
                            "opacity-100" :
                            "opacity-0 h-0 overflow-hidden pointer-events-none",
                        )}
                    >
                        {selectedItem && (
                            <>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <span className="text-2xl">
                                            {selectedItem?.icon?.includes("sword") ?
                                                "⚔️" :
                                                selectedItem?.icon?.includes("head") ?
                                                "👑" :
                                                selectedItem?.icon?.includes("potion") ?
                                                "🧪" :
                                                selectedItem?.icon?.includes("ear") ?
                                                "👂" :
                                                "📦"}
                                        </span>
                                        {selectedItem?.name}
                                        <span className="text-text-muted text-sm font-normal">
                                            ({selectedItem?.rarity})
                                        </span>
                                        {selectedItem?.quantity > 1 && (
                                            <span className="text-text-muted text-sm font-normal">
                                                (x{selectedItem.quantity})
                                            </span>
                                        )}
                                    </CardTitle>
                                    <CardDescription>
                                        {selectedItem?.type}
                                        {selectedItem?.slot ?
                                            ` - Slot: ${selectedItem.slot}` :
                                            ""}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm">
                                    <p>{selectedItem.description}</p>
                                    {selectedItem.stats && (
                                        <div>
                                            <h4 className="mb-1 font-semibold">Stats:</h4>
                                            <ul className="list-inside list-disc space-y-0.5 text-xs">
                                                {Object.entries(selectedItem.stats).map(
                                                    ([stat, value]) => (
                                                        <li key={stat}>
                                                            <span className="font-medium capitalize">
                                                                {stat}:
                                                            </span>{" "}
                                                            +{value}
                                                        </li>
                                                    ),
                                                )}
                                            </ul>
                                        </div>
                                    )}
                                </CardContent>
                                <Separator className="my-3" />
                                <CardContent className="flex flex-wrap gap-2">
                                    {!isSelectedItemEquipped && selectedItem.slot && (
                                        <Button
                                            variant="default"
                                            size="sm"
                                            onClick={() =>
                                                handleEquipItem(selectedItem.inventoryId)
                                            }
                                            disabled={!!actionLoading[selectedItem.inventoryId]}
                                            aria-label={`Equip ${selectedItem.name}`}
                                        >
                                            Equip
                                        </Button>
                                    )}

                                    {isSelectedItemEquipped && selectedItem.slot && (
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() =>
                                                handleUnequipItem(selectedItem.slot!)
                                            }
                                            disabled={
                                                !!actionLoading[selectedItem.inventoryId] ||
                                                !!actionLoading[selectedItem.slot!]
                                            }
                                            aria-label={`Unequip ${selectedItem.name}`}
                                        >
                                            Unequip
                                        </Button>
                                    )}

                                    {selectedItem.type === "Consumable" && (
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="bg-purple-600 text-white hover:bg-purple-700"
                                            disabled={!!actionLoading[selectedItem.inventoryId]}
                                            onClick={() =>
                                                handleUseItem(selectedItem.inventoryId)
                                            }
                                            aria-label={`Use ${selectedItem.name}`}
                                        >
                                            Use
                                        </Button>
                                    )}

                                    <TooltipProvider delayDuration={100}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <span tabIndex={isSelectedItemEquipped ? -1 : 0}>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() =>
                                                            !isSelectedItemEquipped &&
                                                            handleDropItem(
                                                                selectedItem.inventoryId,
                                                                selectedItem.name,
                                                            )
                                                        }
                                                        disabled={
                                                            !!actionLoading[selectedItem.inventoryId] ||
                                                            isSelectedItemEquipped
                                                        }
                                                        aria-disabled={isSelectedItemEquipped}
                                                        aria-label={
                                                            isSelectedItemEquipped ?
                                                            `Cannot drop equipped item: ${selectedItem.name}` :
                                                            `Drop ${selectedItem.name}`
                                                        }
                                                        className={cn(
                                                            isSelectedItemEquipped ?
                                                            "cursor-not-allowed pointer-events-none" :
                                                            "",
                                                        )}
                                                    >
                                                        Drop
                                                    </Button>
                                                </span>
                                            </TooltipTrigger>
                                            {isSelectedItemEquipped && (
                                                <TooltipContent side="bottom">
                                                    <p>Cannot drop an equipped item.</p>
                                                </TooltipContent>
                                            )}
                                        </Tooltip>
                                    </TooltipProvider>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={closeDetailsPanel}
                                    >
                                        Close
                                    </Button>
                                </CardContent>
                            </>
                        )}
                    </Card>
                </div>
            </div>
        </div>

        <DragOverlay dropAnimation={null}>
            {activeDragItem ? (
                <InventoryIconSlot
                    item={activeDragItem}
                    isSelected={false}
                    isLoading={false}
                    onClick={() => {}}
                />
            ) : null}
        </DragOverlay>
      </TooltipProvider>
    </DndContext>
  );
}

// Export the component wrapped in Suspense
export default function InventoryClientContent() {
  return (
    <Suspense fallback={<div>Loading Inventory...</div>}>
      <InventoryContent />
    </Suspense>
  );
} 