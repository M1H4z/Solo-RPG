import { createSupabaseRouteHandlerClient } from '@/lib/supabase/server';

export interface ExpiredGateCleanupResult {
  wasExpired: boolean;
  wasDeleted: boolean;
  error?: string;
}

/**
 * Checks if a gate is expired and deletes it if so
 * @param gateId - The ID of the gate to check
 * @param hunterId - Optional hunter ID for additional validation
 * @returns Promise with cleanup result
 */
export async function cleanupExpiredGate(
  gateId: string, 
  hunterId?: string
): Promise<ExpiredGateCleanupResult> {
  const supabase = createSupabaseRouteHandlerClient();
  
  try {
    // First, fetch the gate to check if it's expired
    let query = supabase
      .from('active_gates')
      .select('id, expires_at, hunter_id')
      .eq('id', gateId);
    
    if (hunterId) {
      query = query.eq('hunter_id', hunterId);
    }
    
    const { data: gate, error: fetchError } = await query.maybeSingle();
    
    if (fetchError) {
      return { 
        wasExpired: false, 
        wasDeleted: false, 
        error: `Failed to fetch gate: ${fetchError.message}` 
      };
    }
    
    if (!gate) {
      // Gate doesn't exist, might already be cleaned up
      return { wasExpired: false, wasDeleted: false };
    }
    
    // Check if expired
    const isExpired = new Date(gate.expires_at) < new Date();
    
    if (!isExpired) {
      return { wasExpired: false, wasDeleted: false };
    }
    
    // Gate is expired, delete it
    console.log(`Cleaning up expired gate ${gateId} for hunter ${gate.hunter_id}`);
    
    const { error: deleteError } = await supabase
      .from('active_gates')
      .delete()
      .eq('id', gateId);
    
    if (deleteError) {
      return { 
        wasExpired: true, 
        wasDeleted: false, 
        error: `Failed to delete expired gate: ${deleteError.message}` 
      };
    }
    
    console.log(`Successfully cleaned up expired gate ${gateId}`);
    return { wasExpired: true, wasDeleted: true };
    
  } catch (error) {
    return { 
      wasExpired: false, 
      wasDeleted: false, 
      error: `Unexpected error during cleanup: ${error}` 
    };
  }
}

/**
 * Checks for any expired gates for a specific hunter and cleans them up
 * @param hunterId - The hunter ID to check
 * @returns Promise with cleanup result
 */
export async function cleanupExpiredGatesForHunter(
  hunterId: string
): Promise<ExpiredGateCleanupResult> {
  const supabase = createSupabaseRouteHandlerClient();
  
  try {
    // Find any expired gates for this hunter
    const { data: expiredGates, error: fetchError } = await supabase
      .from('active_gates')
      .select('id, expires_at')
      .eq('hunter_id', hunterId)
      .lt('expires_at', new Date().toISOString());
    
    if (fetchError) {
      return { 
        wasExpired: false, 
        wasDeleted: false, 
        error: `Failed to fetch expired gates: ${fetchError.message}` 
      };
    }
    
    if (!expiredGates || expiredGates.length === 0) {
      return { wasExpired: false, wasDeleted: false };
    }
    
    // Delete all expired gates for this hunter
    console.log(`Cleaning up ${expiredGates.length} expired gates for hunter ${hunterId}`);
    
    const { error: deleteError } = await supabase
      .from('active_gates')
      .delete()
      .eq('hunter_id', hunterId)
      .lt('expires_at', new Date().toISOString());
    
    if (deleteError) {
      return { 
        wasExpired: true, 
        wasDeleted: false, 
        error: `Failed to delete expired gates: ${deleteError.message}` 
      };
    }
    
    console.log(`Successfully cleaned up ${expiredGates.length} expired gates for hunter ${hunterId}`);
    return { wasExpired: true, wasDeleted: true };
    
  } catch (error) {
    return { 
      wasExpired: false, 
      wasDeleted: false, 
      error: `Unexpected error during cleanup: ${error}` 
    };
  }
} 