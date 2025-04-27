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
  toast
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
} from "@dnd-kit/core";

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
          return a.type.localeCompare(b.type);
        case "type_desc":
          return b.type.localeCompare(a.type);
        default:
          return 0;
      }
    });

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
      alert(`Added: ${result.addedItem?.name || "Unknown Item"}`);
      setInventory(result.inventory);
    } catch (err: any) {
      console.error("Error adding item:", err);
      alert(`Error: ${err.message}`);
    } finally {
      setItemActionLoading("add-item", false);
    }
  };

  const handleEquipItem = async (inventoryId: string) => {
    if (!hunterId || !selectedItem || selectedItem.inventoryId !== inventoryId)
      return;
    const item = selectedItem;
    setItemActionLoading(inventoryId, true);
    setError(null);
    try {
      const response = await fetch(`/api/hunters/${hunterId}/equip`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          inventoryId
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to equip item");
      setInventory(result.inventory);
      setEquipment(result.equipment);
      setSelectedItem(null);
      toast.success(`${item.name} equipped successfully.`);
    } catch (err: any) {
      console.error("Error equipping item:", err);
      setError(err.message);
    } finally {
      setItemActionLoading(inventoryId, false);
    }
  };

  const handleUnequipItem = async (slot: EquipmentSlotType) => {
    if (!hunterId || !equipment[slot]) return;
    const itemId = equipment[slot] ? .inventoryId;
    setItemActionLoading(itemId || "", true);
    setError(null);
    try {
      const response = await fetch(`/api/hunters/${hunterId}/unequip`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          slot
        }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Failed to unequip item");
      setEquipment(result.equipment);
      closeDetailsPanel();
      toast.success(`${equipment[slot]?.name} unequipped.`);
    } catch (err: any) {
      console.error("Error unequipping item:", err);
      toast.error(`Error: ${err.message}`);
    } finally {
      setItemActionLoading(itemId || "", false);
    }
  };

  const handleUseItem = async (inventoryId: string) => {
    if (!hunterId || !selectedItem || selectedItem.inventoryId !== inventoryId)
      return;
    const itemToUse = selectedItem;
    setItemActionLoading(inventoryId, true);
    setError(null);
    console.log(`Attempting to use item: ${itemToUse.name} (${inventoryId})`);
    await new Promise((res) => setTimeout(res, 500)); // Simulate API call
    alert(`Used ${itemToUse.name}! (Functionality not fully implemented)`);
    setItemActionLoading(inventoryId, false);
    setSelectedItem(null);
  };

  const handleDropItem = async (inventoryId: string, itemName: string) => {
    if (!hunterId) return;

    if (
      !confirm(
        `Are you sure you want to drop ${itemName}? This action cannot be undone.`,
      )
    ) {
      return;
    }

    setItemActionLoading(inventoryId, true);
    try {
      const response = await fetch(`/api/hunters/${hunterId}/drop-item`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          inventoryId: inventoryId
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to drop item");
      }

      setInventory(data.inventory);
      setSelectedItem(null);
      toast.success(`${itemName} dropped successfully.`);
    } catch (error: any) {
      console.error("Error dropping item:", error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setItemActionLoading(inventoryId, false);
    }
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
    if (event.active.data.current ? .item) {
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
      activeData ? .type === "inventory" &&
      overData ? .type === "equipment-slot"
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
        activeType: activeData ? .type,
        overType: overData ? .type,
      });
    }
  };

  const handleEquipItemViaDnD = async (
    inventoryId: string,
    itemName: string,
  ) => {
    if (!hunterId) return;
    setItemActionLoading(inventoryId, true);
    setError(null);
    try {
      const response = await fetch(`/api/hunters/${hunterId}/equip`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          inventoryId
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to equip item");
      setEquipment(result.equipment);
      toast.success(`${itemName} equipped successfully.`);
    } catch (err: any) {
      console.error("Error equipping item via DnD (default slot):", err);
      toast.error(`Error: ${err.message}`);
    } finally {
      setItemActionLoading(inventoryId, false);
    }
  };

  const handleEquipItemToSlotViaDnD = async (
    inventoryId: string,
    itemName: string,
    targetSlot: EquipmentSlotType,
  ) => {
    if (!hunterId) return;
    setItemActionLoading(inventoryId, true);
    setError(null);
    try {
      const response = await fetch(`/api/hunters/${hunterId}/equip-to-slot`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          inventoryId,
          targetSlot
        }), // Send targetSlot
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Failed to equip item to slot");
      setEquipment(result.equipment);
      toast.success(`${itemName} equipped successfully to ${targetSlot}.`);
    } catch (err: any) {
      console.error(
        `Error equipping item via DnD (specific slot ${targetSlot}):`,
        err,
      );
      toast.error(`Error: ${err.message}`);
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
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader className="mb-6 flex flex-row items-center justify-between border-b pb-4">
            <div>
              <CardTitle className="text-2xl sm:text-3xl">Inventory</CardTitle>
            </div>
            <Button variant="outline" asChild>
              <Link href={`/dashboard?hunterId=${hunterId}`}>
                &larr; Back to Dashboard
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {" "}
            {error && (
              <p className="my-4 rounded border border-danger bg-danger/10 p-2 text-center text-danger">
                Error: {error}
              </p>
            )}
            <div className="mb-6">
              <Button
                onClick={handleAddItem}
                disabled={actionLoading["add-item"]}
              >
                {actionLoading["add-item"]
                  ? "Adding..."
                  : "Add Random Item (Test)"}
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="lg:col-span-1">
                <EquipmentDisplay
                  equipment={equipment}
                  onUnequip={handleUnequipItem}
                  onSelect={handleEquipmentSelect} // Pass the new handler
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
                          setSortCriteria(value as SortCriteria);
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
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-6 gap-2 sm:grid-cols-8 md:grid-cols-10">
                      {displayedInventory.map((item) => (
                        <InventoryIconSlot
                          key={item.inventoryId}
                          item={item}
                          onClick={() => handleInventorySelect(item)}
                          isSelected={
                            selectedItem ? .inventoryId === item.inventoryId
                          }
                          isLoading={!!actionLoading[item.inventoryId]}
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
                            {selectedItem.icon ? .includes("sword") ?
                              "⚔️" :
                              selectedItem.icon ? .includes("head") ?
                              "👑" :
                              selectedItem.icon ? .includes("potion") ?
                              "🧪" :
                              selectedItem.icon ? .includes("ear") ?
                              "👂" :
                              "📦"}
                          </span>
                          {selectedItem.name}
                          <span className="text-text-muted text-sm font-normal">
                            ({selectedItem.rarity})
                          </span>
                          {selectedItem.quantity > 1 && (
                            <span className="text-text-muted text-sm font-normal">
                              (x{selectedItem.quantity})
                            </span>
                          )}
                        </CardTitle>
                        <CardDescription>
                          {selectedItem.type}
                          {selectedItem.slot ?
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
          </CardContent>
        </Card>

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
      </div>
    </DndContext>
  );
}

// Export the component wrapped in Suspense
export default function InventoryClientContent() {
  return (
    <Suspense fallback={<div>Loading inventory...</div>}>
      <InventoryContent />
    </Suspense>
  );
} 