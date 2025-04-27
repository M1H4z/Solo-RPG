import { NextResponse } from "next/server";
import {
  addInventoryItem,
  getHunterInventory,
} from "@/services/inventoryService";
// Remove incorrect import
// import { MOCK_ITEMS_DB } from '@/lib/mockItems';
// Use the server client for Route Handlers
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Remove incorrect import path
// import { createSupabaseRouteHandlerClient } from '@/lib/supabase/route-handler';

// Remove shared mock state imports
// import { mockHunterInventory, updateMockInventory } from '@/lib/mockHunterState';

export async function POST(
  request: Request,
  { params }: { params: { hunterId: string } },
) {
  const hunterId = params.hunterId;
  // Use the server client instance
  const supabase = createSupabaseServerClient();

  // Simple validation: Ensure user owns this hunter (or is admin)
  // Fetching session might be needed here depending on auth rules defined in RLS
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // TODO: Add more robust check if hunter belongs to session.user.id

  if (!hunterId) {
    return NextResponse.json(
      { error: "Hunter ID is required" },
      { status: 400 },
    );
  }

  try {
    // Option 1: Get itemId from request body (preferred)
    // const { itemId, quantity } = await request.json();

    // Option 2: For testing, add a random item from the DB items table
    // This requires fetching available item IDs first
    const { data: items, error: itemsError } = await supabase
      .from("items")
      .select("id");
    if (itemsError) throw itemsError;
    if (!items || items.length === 0)
      throw new Error("No items found in database to add randomly.");

    const randomItemId = items[Math.floor(Math.random() * items.length)].id;
    const itemIdToAdd = randomItemId; // Using random for now
    const quantityToAdd = 1; // Default quantity
    // -----------------------------------------

    if (!itemIdToAdd) {
      return NextResponse.json(
        { error: "Item ID to add is required." },
        { status: 400 },
      );
    }

    // Call the service function to add the item
    const result = await addInventoryItem(hunterId, itemIdToAdd, quantityToAdd);

    if (!result.success) {
      // Use 400 for bad requests (e.g., item not found), 500 for others
      const statusCode = result.error?.includes("not found") ? 404 : 500;
      return NextResponse.json(
        { error: result.error || "Failed to add item." },
        { status: statusCode },
      );
    }

    // Return the updated inventory (as provided by the service)
    return NextResponse.json({
      message: `Successfully added ${itemIdToAdd}`, // TODO: Get item name for message?
      inventory: result.updatedInventory,
    });
  } catch (error: any) {
    console.error(`API Error adding item for hunter ${hunterId}:`, error);
    return NextResponse.json(
      { error: error.message || "Failed to add item to inventory" },
      { status: 500 },
    );
  }
}
