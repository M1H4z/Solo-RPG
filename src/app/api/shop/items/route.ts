import { createSupabaseRouteHandlerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { Database } from '@/lib/supabase/database.types'; // Assuming your generated types

// Define the Item type based on your table schema (can be moved to a shared types file later)
// Using existing Item type which might be slightly different - adjust if needed
type Item = Database['public']['Tables']['items']['Row'];

export async function GET(request: Request) {
    const cookieStore = cookies();
    const supabase = createSupabaseRouteHandlerClient();

    // 1. Check Authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        console.error('Error getting user or no user:', userError);
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch Purchasable Items
    try {
        const { data: items, error: itemsError } = await supabase
            .from('items')
            .select('*') // Select all columns for now
            .eq('is_purchasable', true) // Only items marked as purchasable
            .order('rarity', { ascending: false }) // Example order: Rarest first
            .order('name', { ascending: true }); // Then alphabetical by name

        if (itemsError) {
            console.error('Error fetching shop items:', itemsError);
            throw itemsError; // Throw to be caught below
        }

        // 3. Return Items
        return NextResponse.json({ items: items || [] }, { status: 200 });

    } catch (error: any) {
        // Log the specific error received before returning a generic message
        console.error('API Error fetching shop items:', error); // Log full error
        // Generic server error - use a static message
        return NextResponse.json({ error: 'Internal Server Error: Failed to fetch shop items' }, { status: 500 });
    }
} 