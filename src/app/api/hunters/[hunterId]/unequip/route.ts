import { NextResponse } from "next/server";
import { unequipItem, getHunterInventory } from "@/services/inventoryService";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { EquipmentSlotType } from "@/types/item.types"; // Need this type for validation
import { isEquipmentSlotType } from "@/services/inventoryService"; // Import the type guard

// Remove mock state imports
// import { ... } from '@/lib/mockHunterState';

export async function POST(
  request: Request,
  { params }: { params: { hunterId: string } },
) {
  const hunterId = params.hunterId;
  const supabase = createSupabaseServerClient();

  // 1. Check Authentication
  const { data: { user }, error: userError } = await supabase.auth.getUser(); // Use getUser
  if (userError || !user) { // Check user and error
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // TODO: Add check if hunter belongs to the authenticated user (user.id)

  if (!hunterId) {
    return NextResponse.json(
      { error: "Hunter ID is required" },
      { status: 400 },
    );
  }

  try {
    const body = await request.json();
    const { slot } = body;

    // Validate the slot parameter
    if (!slot || typeof slot !== "string" || !isEquipmentSlotType(slot)) {
      return NextResponse.json(
        {
          error: "Valid equipment slot (string) is required to unequip an item",
        },
        { status: 400 },
      );
    }

    const targetSlot = slot as EquipmentSlotType;

    // Call the service function to unequip the item
    const unequipResult = await unequipItem(hunterId, targetSlot);

    if (!unequipResult.success) {
      // Distinguish between failed update and other errors if needed
      const statusCode = 500; // Default to server error
      return NextResponse.json(
        { error: unequipResult.error || "Failed to unequip item." },
        { status: statusCode },
      );
    }

    // Unequip was successful, fetch the current inventory state
    const currentInventory = await getHunterInventory(hunterId);

    return NextResponse.json({
      message: `Successfully unequipped item from ${targetSlot}`,
      equipment: unequipResult.updatedEquipment,
      inventory: currentInventory, // Return current inventory state
    });
  } catch (error: any) {
    console.error(
      `API Error unequipping item from slot ${params.hunterId} for hunter ${hunterId}:`,
      error,
    );
    return NextResponse.json(
      { error: error.message || "Failed to unequip item" },
      { status: 500 },
    );
  }
}
