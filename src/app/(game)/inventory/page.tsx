'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { EquipmentSlots, InventoryItem, EquipmentSlotType, ItemType, Rarity } from '@/types/item.types';
import { Hunter } from '@/types/hunter.types';
import { EQUIPMENT_SLOTS_ORDER } from '@/constants/inventory.constants';
import { EquipmentDisplay } from '@/components/inventory/EquipmentDisplay';
import { InventoryIconSlot } from '@/components/inventory/InventoryIconSlot';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import Link from 'next/link';
import { Separator } from '@/components/ui/Separator';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/Tooltip";
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragEndEvent, 
  DragOverlay 
} from '@dnd-kit/core';

// Define possible item types for filtering (including 'All')
const itemTypesForFilter: ('All' | ItemType)[] = ['All', 'Weapon', 'Armor', 'Accessory', 'Consumable', 'Material'];

// Define rarity order for sorting
const RARITY_ORDER: Rarity[] = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythical', 'Sovereign'];

// Define sort options
type SortCriteria = 'name_asc' | 'name_desc' | 'rarity_asc' | 'rarity_desc' | 'type_asc' | 'type_desc';

// Fetch function now gets full hunter data
async function fetchHunterWithInventoryData(hunterId: string): Promise<Hunter | null> {
  console.log(`Fetching full hunter data for ${hunterId}...`);
  try {
    const response = await fetch(`/api/hunters/${hunterId}`); // Fetch all hunter data
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch hunter data');
    }
    const data = await response.json();
    console.log('Fetched hunter data:', data);
    return data.hunter as Hunter; // Assuming response structure is { hunter: Hunter }
  } catch (error) {
    console.error("Error fetching hunter data:", error);
    return null; // Return null on error
  }
}

export default function InventoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hunterId = searchParams.get('hunterId');

  // We can optionally store the full hunter if needed elsewhere on the page
  // const [hunter, setHunter] = useState<Hunter | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [equipment, setEquipment] = useState<EquipmentSlots>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  
  // State for sorting and filtering
  const [filterType, setFilterType] = useState<'All' | ItemType>('All');
  const [sortCriteria, setSortCriteria] = useState<SortCriteria>('rarity_desc'); // Default sort
  
  // State for the currently selected inventory item icon
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  // NEW state to track if the selected item is currently equipped
  const [isSelectedItemEquipped, setIsSelectedItemEquipped] = useState<boolean>(false);
  const [activeDragItem, setActiveDragItem] = useState<InventoryItem | null>(null); // Store item being dragged

  // Dnd-kit Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { 
      // Require the mouse to move by 10 pixels before activating
      activationConstraint: { distance: 10 },
    }),
    useSensor(KeyboardSensor, {
      // Add keyboard controls if needed
    })
  );

  const loadData = useCallback(async () => {
    if (!hunterId) {
      setError('Hunter ID is missing.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const fetchedHunter = await fetchHunterWithInventoryData(hunterId);
      if (fetchedHunter) {
        // setHunter(fetchedHunter); // Optional: store full hunter
        setInventory(fetchedHunter.inventory || []); // Extract inventory
        setEquipment(fetchedHunter.equipment || {}); // Extract equipment
      } else {
        throw new Error('Failed to load hunter data.'); // Handle null return from fetch
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load inventory.');
      setInventory([]);
      setEquipment({});
    } finally {
      setLoading(false);
      setSelectedItem(null); // Reset selection on data reload
    }
  }, [hunterId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered and Sorted Inventory Logic
  const displayedInventory = useMemo(() => {
    // Get a set of inventory IDs for items currently equipped
    const equippedItemIds = new Set(
        Object.values(equipment)
              .filter((item): item is InventoryItem => item !== null)
              .map(item => item.inventoryId)
    );

    let items = [...inventory];

    // --- Apply Filtering --- 
    // 1. Filter by selected item type (Weapon, Armor, etc.)
    if (filterType !== 'All') {
      items = items.filter(item => item.type === filterType);
    }
    // 2. Filter out items that are currently equipped
    items = items.filter(item => !equippedItemIds.has(item.inventoryId));

    // --- Apply Sorting --- 
    items.sort((a, b) => {
      switch (sortCriteria) {
        case 'name_asc': return a.name.localeCompare(b.name);
        case 'name_desc': return b.name.localeCompare(a.name);
        case 'rarity_asc': return RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity);
        case 'rarity_desc': return RARITY_ORDER.indexOf(b.rarity) - RARITY_ORDER.indexOf(a.rarity);
        case 'type_asc': return a.type.localeCompare(b.type);
        case 'type_desc': return b.type.localeCompare(a.type);
        default: return 0;
      }
    });

    return items;
  }, [inventory, equipment, filterType, sortCriteria]); // Add equipment to dependency array

  // Function to set loading state for a specific item action
  const setItemActionLoading = (inventoryId: string, isLoading: boolean) => {
    setActionLoading(prev => ({ ...prev, [inventoryId]: isLoading }));
  };

  // --- Action Handlers --- 
  // (Keep existing handlers: handleAddItem, handleEquipItem, handleUnequipItem)
  // They should still work correctly as they update state based on *their* API responses

  const handleAddItem = async () => {
    // ... (no changes needed here) ...
     if (!hunterId) return;
    setItemActionLoading('add-item', true);
    try {
      const response = await fetch(`/api/hunters/${hunterId}/add-item`, { method: 'POST' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to add item');
      alert(`Added: ${result.addedItem?.name || 'Unknown Item'}`); 
      // Update state directly from response
      setInventory(result.inventory);
      // No need to update equipment here
    } catch (err: any) {
      console.error('Error adding item:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setItemActionLoading('add-item', false);
    }
  };

  const handleEquipItem = async (inventoryId: string) => {
    if (!hunterId || !selectedItem || selectedItem.inventoryId !== inventoryId) return;
    const item = selectedItem; // Use selected item
    setItemActionLoading(inventoryId, true);
    setError(null);
    try {
      const response = await fetch(`/api/hunters/${hunterId}/equip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inventoryId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to equip item');
      console.log('Equip successful:', result);
      setInventory(result.inventory);
      setEquipment(result.equipment);
      setSelectedItem(null); // Deselect item after equipping
      toast.success(`${item.name} equipped successfully.`);
    } catch (err: any) {
      console.error('Error equipping item:', err);
      setError(err.message);
    } finally {
      setItemActionLoading(inventoryId, false);
    }
  };

  const handleUnequipItem = async (slot: EquipmentSlotType) => {
    if (!hunterId || !equipment[slot]) return;
    const itemId = equipment[slot]?.inventoryId;
    setItemActionLoading(itemId || '', true);
    setError(null);
    try {
      const response = await fetch(`/api/hunters/${hunterId}/unequip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to unequip item');
      console.log('Unequip successful:', result);
      setEquipment(result.equipment);
      closeDetailsPanel();
      toast.success(`${equipment[slot]?.name} unequipped.`);
    } catch (err: any) {
      console.error('Error unequipping item:', err);
       toast.error(`Error: ${err.message}`);
    } finally {
       setItemActionLoading(itemId || '', false);
    }
  };

  // Add handleUseItem (placeholder for now)
  const handleUseItem = async (inventoryId: string) => {
    if (!hunterId || !selectedItem || selectedItem.inventoryId !== inventoryId) return;
    const itemToUse = selectedItem; // Use selected item directly
    setItemActionLoading(inventoryId, true);
    setError(null);
    console.log(`Attempting to use item: ${itemToUse.name} (${inventoryId})`);
    // TODO: Implement API call to /api/hunters/[hunterId]/use-item
    await new Promise(res => setTimeout(res, 500)); // Simulate API call
    alert(`Used ${itemToUse.name}! (Functionality not fully implemented)`);
    // If item is consumed, refetch data or update state manually
    // await loadData(); // Example: refetch after use
     setItemActionLoading(inventoryId, false);
     setSelectedItem(null); // Deselect item after use
  };

  // NEW: Handler for dropping items
  const handleDropItem = async (inventoryId: string, itemName: string) => {
    if (!hunterId) return;
    
    // Confirmation dialog
    if (!confirm(`Are you sure you want to drop ${itemName}? This action cannot be undone.`)) {
        return;
    }

    setItemActionLoading(inventoryId, true);
    try {
        const response = await fetch(`/api/hunters/${hunterId}/drop-item`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // For now, we drop the whole stack/instance. 
            // Future: Add quantity input if needed.
            body: JSON.stringify({ inventoryId: inventoryId }), 
        });
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to drop item');
        }

        setInventory(data.inventory); // Update the main inventory state
        setSelectedItem(null); // Close details panel
        toast.success(`${itemName} dropped successfully.`);

    } catch (error: any) {
        console.error('Error dropping item:', error);
        toast.error(`Error: ${error.message}`);
    } finally {
        setItemActionLoading(inventoryId, false);
    }
  };

  // NEW: Handler for selecting an item from the equipment display
  const handleEquipmentSelect = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsSelectedItemEquipped(true); // Mark that this came from equipment
  };

  // Handler for selecting an item from the inventory grid
  const handleInventorySelect = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsSelectedItemEquipped(false); // Mark that this came from inventory
  };

   // Function to close the details panel
  const closeDetailsPanel = () => {
    setSelectedItem(null);
    setIsSelectedItemEquipped(false);
  };

  // --- Drag and Drop Handlers ---
  const handleDragStart = (event: DragStartEvent) => {
    console.log("Drag Start:", event.active.id, event.active.data.current);
    // Store the item being dragged for the overlay
    if (event.active.data.current?.item) {
        setActiveDragItem(event.active.data.current.item);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragItem(null); // Clear dragged item on end/cancel
    const { active, over } = event;

    if (!over) {
        console.log('Drag ended outside droppable area.');
        return;
    }

    const activeId = active.id;
    const overId = over.id;
    const activeData = active.data.current;
    const overData = over.data.current;

    console.log('Drag Ended: ', { activeId, activeData, overId, overData });

    // --- Logic for Inventory Item -> Equipment Slot Drop ---
    if (activeData?.type === 'inventory' && overData?.type === 'equipment-slot') {
        const draggedItem = activeData.item as InventoryItem;
        const targetSlot = overData.slot as EquipmentSlotType;

        if (!draggedItem || !targetSlot) {
            console.error('Missing data for inventory -> equipment drop');
            return;
        }

        // --- Slot Validation Logic ---
        let isValidDrop = false;
        let specificSlotTargetAPI = false; // Flag to call the new API

        if (draggedItem.slot === targetSlot) {
            // Direct match (e.g., Head item to Head slot)
            isValidDrop = true;
        } else if (draggedItem.slot === 'MainHand' && (targetSlot === 'MainHand' || targetSlot === 'OffHand')) {
            // Allow MainHand weapon in MainHand or OffHand slot
            isValidDrop = true;
            specificSlotTargetAPI = true; // Indicate we need to tell the API *which* slot
        }
        // Add more rules here if needed (e.g., maybe shields in OffHand?)

        // --- Perform Action --- 
        if (isValidDrop) {
            if (specificSlotTargetAPI) {
                console.log(`Attempting to equip ${draggedItem.name} (ID: ${draggedItem.inventoryId}) into specific slot ${targetSlot} via drag & drop.`);
                 // Call NEW handler that passes targetSlot to API
                handleEquipItemToSlotViaDnD(draggedItem.inventoryId, draggedItem.name, targetSlot);
            } else {
                 console.log(`Attempting to equip ${draggedItem.name} (ID: ${draggedItem.inventoryId}) into default slot ${targetSlot} via drag & drop.`);
                // Call the existing equip handler (implicitly uses item's defined slot)
                handleEquipItemViaDnD(draggedItem.inventoryId, draggedItem.name);
            }
        } else {
             toast.error(`Cannot equip ${draggedItem.name} (${draggedItem.slot}) in the ${targetSlot} slot.`);
        }
    } 
    // --- TODO: Add other drag scenarios ---
    // else if (activeData?.type === 'equipment-slot' && overData?.type === 'inventory-area') {
    //     // Handle unequip: Drag equipment item to general inventory area
    //     const sourceSlot = activeData.slot as EquipmentSlotType;
    //     if (sourceSlot) {
    //         handleUnequipItem(sourceSlot);
    //     }
    // }
    // else if (activeData?.type === 'equipment-slot' && overData?.type === 'equipment-slot') {
    //    // Handle equipment swap (more complex)
    // } 
    else {
        console.log('Unhandled drag scenario:', { activeType: activeData?.type, overType: overData?.type });
    }
  };

  // Existing helper function for default equip via DnD
  const handleEquipItemViaDnD = async (inventoryId: string, itemName: string) => { 
       // ... (implementation remains the same) ...
      if (!hunterId) return;
      setItemActionLoading(inventoryId, true);
      setError(null);
      try {
          // Uses the default /equip endpoint
          const response = await fetch(`/api/hunters/${hunterId}/equip`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ inventoryId }),
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error || 'Failed to equip item');
          console.log('Equip successful via DnD (default slot):', result);
          setEquipment(result.equipment); 
          toast.success(`${itemName} equipped successfully.`);
      } catch (err: any) {
          console.error('Error equipping item via DnD (default slot):', err);
          toast.error(`Error: ${err.message}`);
      } finally {
          setItemActionLoading(inventoryId, false);
      }
  };

  // NEW helper function to handle equip to a SPECIFIC slot via DnD
  const handleEquipItemToSlotViaDnD = async (inventoryId: string, itemName: string, targetSlot: EquipmentSlotType) => {
      if (!hunterId) return;
      setItemActionLoading(inventoryId, true);
      setError(null);
      try {
           // Uses the NEW /equip-to-slot endpoint
          const response = await fetch(`/api/hunters/${hunterId}/equip-to-slot`, { 
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ inventoryId, targetSlot }), // Send targetSlot
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error || 'Failed to equip item to slot');
          console.log(`Equip successful via DnD (specific slot ${targetSlot}):`, result);
          setEquipment(result.equipment); 
          toast.success(`${itemName} equipped successfully to ${targetSlot}.`);
      } catch (err: any) {
          console.error(`Error equipping item via DnD (specific slot ${targetSlot}):`, err);
          toast.error(`Error: ${err.message}`);
      } finally {
          setItemActionLoading(inventoryId, false);
      }
  };

  // --- Render Logic --- 
  // (No changes needed in the JSX return part)
  // ... (rest of the component) ...
   if (!hunterId) {
     return (
        <div className="container mx-auto px-4 py-8 text-center">
            <p className="text-danger mb-4">Hunter ID not found in URL.</p>
             <Button variant="outline" asChild>
                 <Link href="/hunters">Select Hunter</Link>
             </Button>
        </div>
     );
  }
  
  if (loading) {
    return <div className="container mx-auto px-4 py-8 text-center">Loading Inventory...</div>;
  }

  // --- Main Inventory Display with wrapping Card and Header --- 
  return (
    <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter} 
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
    >
      <div className="container mx-auto px-4 py-8">
         {/* Add top-level Card back */}
        <Card>
           {/* Add CardHeader back */}
          <CardHeader className="flex flex-row justify-between items-center border-b pb-4 mb-6">
            <div>
              <CardTitle className="text-2xl sm:text-3xl">Inventory</CardTitle>
              {/* Optional: Add description if needed */}
              {/* <CardDescription>Manage your items and equipment.</CardDescription> */}
            </div>
            <Button variant="outline" asChild>
               <Link href={`/dashboard?hunterId=${hunterId}`}>
                  &larr; Back to Dashboard
               </Link>
             </Button>
          </CardHeader>

          <CardContent> { /* Wrap the rest of the content */}
              {error && <p className="text-danger my-4 text-center p-2 bg-danger/10 rounded border border-danger">Error: {error}</p>}
              
              {/* Add Item Button (for testing) - Uncommented */}
              <div className="mb-6">
                <Button 
                  onClick={handleAddItem} 
                  disabled={actionLoading['add-item']}
                >
                  {actionLoading['add-item'] ? 'Adding...' : 'Add Random Item (Test)'}
                </Button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Equipment Section (Nested Card) */}
                <div className="lg:col-span-1">
                  <EquipmentDisplay 
                    equipment={equipment}
                    onUnequip={handleUnequipItem}
                    onSelect={handleEquipmentSelect} // Pass the new handler
                    isLoading={actionLoading}
                  />
                </div>
        
                {/* Inventory Section (Nested Card) */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Filter/Sort Controls + Grid */}
                  <Card>
                     <CardHeader>
                          <CardTitle>Items ({displayedInventory.length})</CardTitle>
                          <div className="flex flex-wrap gap-4 mt-4">
                              {/* Filter Dropdown */}
                               <Select value={filterType} onValueChange={(value) => {setFilterType(value as 'All' | ItemType); setSelectedItem(null); /* Deselect on filter change */ }}>
                                  <SelectTrigger className="w-full sm:w-[180px]">
                                      <SelectValue placeholder="Filter by Type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                      {itemTypesForFilter.map(type => (
                                          <SelectItem key={type} value={type}>{type}</SelectItem>
                                      ))}
                                  </SelectContent>
                              </Select>
                              {/* Sort Dropdown */}
                               <Select value={sortCriteria} onValueChange={(value) => {setSortCriteria(value as SortCriteria); setSelectedItem(null); /* Deselect on sort change */}}>
                                  <SelectTrigger className="w-full sm:w-[180px]">
                                      <SelectValue placeholder="Sort By" />
                                  </SelectTrigger>
                                  <SelectContent>
                                      <SelectItem value="rarity_desc">Rarity (Desc)</SelectItem>
                                      <SelectItem value="rarity_asc">Rarity (Asc)</SelectItem>
                                      <SelectItem value="name_asc">Name (A-Z)</SelectItem>
                                      <SelectItem value="name_desc">Name (Z-A)</SelectItem>
                                      <SelectItem value="type_asc">Type (A-Z)</SelectItem>
                                      <SelectItem value="type_desc">Type (Z-A)</SelectItem>
                                  </SelectContent>
                              </Select>
                          </div>
                    </CardHeader>
                    <CardContent>
                      {/* Inventory Icon Grid */}
                      <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
                        {displayedInventory.map((item) => (
                          <InventoryIconSlot
                            key={item.inventoryId}
                            item={item}
                            onClick={() => handleInventorySelect(item)} // Use specific inventory select handler
                            isSelected={selectedItem?.inventoryId === item.inventoryId}
                            isLoading={!!actionLoading[item.inventoryId]}
                          />
                        ))}
                      </div>
                      {displayedInventory.length === 0 && (
                        <p className="text-text-disabled italic text-center py-6">
                          {inventory.filter(item => !new Set(Object.values(equipment).filter(i=>i).map(i=>i!.inventoryId)).has(item.inventoryId)).length === 0 
                              ? 'Your inventory is empty.' 
                              : `No items match the current filters.`
                          }
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Selected Item Details and Actions Section */}
                  <Card className={cn("transition-opacity duration-300", selectedItem ? "opacity-100" : "opacity-0 h-0 overflow-hidden pointer-events-none")}>
                   {selectedItem && (
                      <>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                             {/* Icon? */}
                             <span className="text-2xl">{selectedItem.icon?.includes('sword') ? '⚔️' : selectedItem.icon?.includes('head') ? '👑' : selectedItem.icon?.includes('potion') ? '🧪' : selectedItem.icon?.includes('ear') ? '👂' : '📦'}</span>
                            {selectedItem.name} 
                            <span className="text-sm font-normal text-text-muted">({selectedItem.rarity})</span>
                            {selectedItem.quantity > 1 && <span className="text-sm font-normal text-text-muted">(x{selectedItem.quantity})</span>}
                           </CardTitle>
                           <CardDescription>{selectedItem.type}{selectedItem.slot ? ` - Slot: ${selectedItem.slot}` : ''}</CardDescription>
                        </CardHeader>
                        <CardContent className="text-sm space-y-3">
                            <p>{selectedItem.description}</p>
                            {selectedItem.stats && (
                              <div>
                                <h4 className="font-semibold mb-1">Stats:</h4>
                                <ul className="list-disc list-inside space-y-0.5 text-xs">
                                  {Object.entries(selectedItem.stats).map(([stat, value]) => (
                                    <li key={stat}><span className="capitalize font-medium">{stat}:</span> +{value}</li>
                                  ))}
                                </ul>
                               </div>
                            )}
                        </CardContent>
                        <Separator className="my-3" />
                        <CardContent className="flex flex-wrap gap-2">
                           {/* Equip Button - Show only if selected from inventory AND is equippable */}
                          {!isSelectedItemEquipped && selectedItem.slot && (
                               <Button 
                                  variant="default" 
                                  size="sm" 
                                  onClick={() => handleEquipItem(selectedItem.inventoryId)}
                                  disabled={!!actionLoading[selectedItem.inventoryId]}
                                  aria-label={`Equip ${selectedItem.name}`}
                              >
                                  Equip
                              </Button>
                          )}

                           {/* Unequip Button - Show only if selected from equipment */}
                           {isSelectedItemEquipped && selectedItem.slot && (
                              <Button 
                                  variant="secondary" // Or another appropriate variant
                                  size="sm" 
                                  onClick={() => handleUnequipItem(selectedItem.slot!)} // Use the slot from the selected item
                                  disabled={!!actionLoading[selectedItem.inventoryId] || !!actionLoading[selectedItem.slot!]}
                                  aria-label={`Unequip ${selectedItem.name}`}
                              >
                                  Unequip
                              </Button>
                           )}

                           {/* Use Button Logic (No change needed) */}
                           {selectedItem.type === 'Consumable' && (
                              <Button 
                                  variant="secondary" 
                                  size="sm" 
                                  className="bg-purple-600 hover:bg-purple-700 text-white"
                                  disabled={!!actionLoading[selectedItem.inventoryId]} 
                                  onClick={() => handleUseItem(selectedItem.inventoryId)}
                                  aria-label={`Use ${selectedItem.name}`}
                              >
                                  Use
                              </Button>
                          )} 

                          {/* Drop Button - Disable if equipped */}
                          <TooltipProvider delayDuration={100}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                {/* Wrap button in span because TooltipTrigger needs a single child */}
                                <span tabIndex={isSelectedItemEquipped ? -1 : 0}> 
                                  <Button 
                                      variant="destructive" 
                                      size="sm"
                                      onClick={() => !isSelectedItemEquipped && handleDropItem(selectedItem.inventoryId, selectedItem.name)}
                                      disabled={!!actionLoading[selectedItem.inventoryId] || isSelectedItemEquipped}
                                      aria-disabled={isSelectedItemEquipped}
                                      aria-label={isSelectedItemEquipped ? `Cannot drop equipped item: ${selectedItem.name}` : `Drop ${selectedItem.name}`}
                                      // Add pointer-events-none if disabled to ensure tooltip shows
                                      className={cn(isSelectedItemEquipped ? 'cursor-not-allowed pointer-events-none' : '')}
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
                          
                          {/* Close Button */}
                           <Button variant="outline" size="sm" onClick={closeDetailsPanel}>Close</Button>
                        </CardContent>
                      </>
                   )}
                  </Card>
                </div>
              </div>
          </CardContent> { /* End of main CardContent */}
           {/* Optional: Add CardFooter back if needed, e.g., for currency */}
           {/* <CardFooter className="border-t pt-4 mt-6 justify-end">
                Currency Display...
              </CardFooter> */}
      </Card>

      {/* Drag Overlay: Renders the item being dragged */}
      <DragOverlay dropAnimation={null}> 
        {activeDragItem ? (
            // Render a copy of the InventoryIconSlot for visual feedback
            <InventoryIconSlot 
                item={activeDragItem} 
                isSelected={false} // Not selected state in overlay
                isLoading={false} // Not loading state in overlay
                onClick={() => {}} // No click action in overlay
            />
        ) : null}
      </DragOverlay>
    </div>
  </DndContext>
  );
}