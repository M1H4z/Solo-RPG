"use client";

import React, { useState, useEffect, Suspense, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Hunter } from "@/types/hunter.types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Database } from "@/lib/supabase/database.types";
import { toast, Toaster } from 'sonner';
import { AlertTriangle } from 'lucide-react';
import ChatPanel from "@/components/multiplayer/ChatPanel";

// Type for the active gate data from the DB
type ActiveGateInfo = Database['public']['Tables']['active_gates']['Row'];

// --- Helper for Rank Colors ---
const getRankColorClasses = (rank: string | null) => {
    switch (rank?.toUpperCase()) {
        case 'E': return { bg: 'bg-gray-500/30', border: 'border-gray-300', text: 'text-gray-900' };
        case 'D': return { bg: 'bg-blue-500/30', border: 'border-blue-300', text: 'text-blue-900' };
        case 'C': return { bg: 'bg-green-500/30', border: 'border-green-300', text: 'text-green-900' };
        case 'B': return { bg: 'bg-purple-500/30', border: 'border-purple-300', text: 'text-purple-900' };
        case 'A': return { bg: 'bg-yellow-500/30', border: 'border-yellow-300', text: 'text-yellow-900' };
        case 'S': return { bg: 'bg-red-600/40', border: 'border-red-400', text: 'text-red-900' };
        default: return { bg: 'bg-gray-500/30', border: 'border-gray-300', text: 'text-gray-900' }; // Default/Fallback
    }
};

// Added props interface
interface GateContentProps {
    hunterId: string;
}

// Inner component now accepts hunterId as prop
function GateContent({ hunterId }: GateContentProps) {
  const router = useRouter();

  const [hunter, setHunter] = useState<Hunter | null>(null);
  const [activeGate, setActiveGate] = useState<ActiveGateInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isChatMinimized, setIsChatMinimized] = useState(false);

  // Fetch hunter data and active gate status
  const loadGateStatus = useCallback(async () => {
    if (!hunterId) {
      setError("Hunter ID is missing.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setActiveGate(null);
    setHunter(null);

    try {
      // Fetch Hunter Data (optional here, could be passed as prop if fetched higher up)
      const hunterResponse = await fetch(`/api/hunters/${hunterId}`);
      if (!hunterResponse.ok) {
        const hunterError = await hunterResponse.json();
        throw new Error(hunterError.error || "Failed to load hunter data");
      }
      const hunterData = await hunterResponse.json();
      setHunter(hunterData.hunter);

      // Fetch Active Gate Status
      const gateResponse = await fetch(`/api/gate/status?hunterId=${hunterId}`);
      if (!gateResponse.ok) {
        const gateError = await gateResponse.json();
        throw new Error(gateError.error || "Failed to load gate status");
      }
      const gateData = await gateResponse.json();
      setActiveGate(gateData.activeGate); // API returns { activeGate: data | null }

    } catch (err: any) {
      console.error("Error loading gate status:", err);
      setError(err.message || "Failed to load gate information.");
    } finally {
      setLoading(false);
    }
  }, [hunterId]);

  useEffect(() => {
    loadGateStatus();
  }, [loadGateStatus]);

  const handleLocateNewGate = async () => {
    if (!hunterId) {
        toast.error("Cannot locate gate: Hunter ID is missing.");
        return;
    }
    setActionLoading(true);
    console.log("Attempting to locate new gate...");

    try {
        const response = await fetch('/api/gate/locate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ hunterId }),
        });

        const result = await response.json();

        if (!response.ok) {
            // Use error message from API if available
            throw new Error(result.error || `Failed to locate gate (status: ${response.status})`);
        }

        // Success!
        toast.success('New gate located!');
        setActiveGate(result.activeGate); // Update state with the new gate data

    } catch (err: any) {
        console.error("Error locating gate:", err);
        toast.error(`Failed to locate gate: ${err.message}`);
        // Optionally clear activeGate state again if needed
        // setActiveGate(null);
    } finally {
        setActionLoading(false);
    }
  };

  const handleEnterGate = (gateId: string) => {
    if (!hunterId) {
      toast.error("Cannot enter gate: Hunter ID missing.");
      return;
    }
    console.log("Entering gate:", gateId);
    router.push(`/gate/${gateId}?hunterId=${hunterId}`);
  };

  const handleAbandonGate = (gateId: string) => {
    if (!hunterId || !activeGate) {
        toast.error("Cannot abandon gate: Missing required information.");
        return;
    }

    // Show confirmation toast with warning icon
    toast("Abandon Active Gate?", {
        icon: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
        description: "Are you sure? You won't be able to re-enter.",
        id: 'abandon-gate-confirm', 
        action: {
            label: "Abandon",
            onClick: async () => {
                setActionLoading(true);
                toast.dismiss('abandon-gate-confirm');
                console.log("Abandoning gate via toast confirmation:", gateId);
                try {
                    const response = await fetch('/api/gate/abandon', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ hunterId }),
                    });
                    const result = await response.json();
                    if (!response.ok) {
                        throw new Error(result.error || `Failed to abandon gate (status: ${response.status})`);
                    }
                    toast.success("Gate abandoned.");
                    setActiveGate(null);
                } catch (err: any) {
                    console.error("Error abandoning gate:", err);
                    toast.error(`Failed to abandon gate: ${err.message}`);
                } finally {
                    setActionLoading(false);
                }
            },
        },
        cancel: {
            label: "Cancel",
            onClick: () => { 
                toast.dismiss('abandon-gate-confirm'); 
                console.log('Abandon gate cancelled');
            },
        },
        duration: Infinity, 
    });
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <p className="text-lg text-text-secondary">Checking Gate Status...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center p-4">
        <Card className="w-full max-w-md border-danger">
          <CardHeader>
            <CardTitle className="text-center text-danger">
              Error Loading Gate Information
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-6 text-text-secondary">
              {error}
            </p>
            <Button variant="secondary" onClick={loadGateStatus}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Toaster position="bottom-right" richColors />
      <div className="flex h-full w-full flex-col items-center justify-center text-center">
          {activeGate ? (
              <div className="flex h-full w-full flex-col items-center justify-around">
                   {(() => {
                      const colors = getRankColorClasses(activeGate.gate_rank);
                      return (
                          <div className="relative flex h-48 w-48 items-center justify-center sm:h-64 sm:w-64">
                              <div className={`absolute h-full w-full animate-pulse rounded-full ${colors.bg} blur-xl`}></div>
                              <div className={`absolute h-3/4 w-3/4 animate-spin rounded-full border-t-4 border-l-4 ${colors.border} opacity-75 [animation-duration:3s]`}></div>
                              <div className={`absolute h-1/2 w-1/2 rounded-full bg-white/80 ${colors.bg} opacity-50 blur-lg`}></div>
                              <div className="absolute h-1/4 w-1/4 rounded-full bg-blue-100 blur-sm"></div>
                               <p className={`z-10 text-xs font-semibold ${colors.text}`}>Rank {activeGate.gate_rank} Gate</p>
                          </div>
                        );
                     })()}

                     <Card className="border-primary/60 bg-surface/80 backdrop-blur-sm">
                           <CardHeader className="pb-2 pt-3">
                               <CardTitle className="text-base sm:text-lg">
                                   {activeGate.gate_type}
                                </CardTitle>
                                <CardDescription className="text-xs sm:text-sm">
                                   Depth {activeGate.current_depth}/{activeGate.total_depth} | Room {activeGate.current_room}/{activeGate.rooms_per_depth[activeGate.current_depth - 1]}
                               </CardDescription>
                           </CardHeader>
                            <CardContent className="pb-3">
                                <p className="text-xs text-accent sm:text-sm">
                                    Expires: {new Date(activeGate.expires_at).toLocaleString()}
                                </p>
                           </CardContent>
                         </Card>
                         <div className="flex flex-col justify-center gap-4 pt-2 sm:flex-row">
                           <Button onClick={() => handleEnterGate(activeGate.id)} disabled={actionLoading}>
                             Enter Gate
                           </Button>
                           <Button size="lg" variant="destructive" onClick={() => handleAbandonGate(activeGate.id)} disabled={actionLoading}>
                             Abandon Gate
                           </Button>
                         </div>
                     </div>
            ) : (
                <div className="w-full max-w-lg space-y-6">
                    <h3 className="text-2xl font-semibold text-text-secondary sm:text-3xl">
                        No Active Gate
                    </h3>
                    <p className="text-base text-text-secondary">
                        {hunter ? `Ready to locate a Rank ${hunter.rank} gate?` : "Loading hunter details..."}
                    </p>
                    <Button size="lg" onClick={handleLocateNewGate} disabled={actionLoading}>
                        {actionLoading ? 'Locating...' : 'Locate New Gate'}
                    </Button>
                    <p className="pt-2 text-xs text-text-secondary">
                        Locating a gate might consume resources and entering has a time limit.
                    </p>
                </div>
            )}
      </div>

      {/* Fixed positioned Chat Panel - positioned in bottom-left (same as dashboard) */}
      {hunter && (
        <div className="fixed bottom-4 left-4 z-40">
          <ChatPanel
            currentHunter={{
              id: hunter.id,
              userId: hunter.userId,
              name: hunter.name,
              level: hunter.level,
              class: hunter.class,
              rank: hunter.rank,
            }}
            location="gate"
            defaultChannel="location"
            isMinimized={isChatMinimized}
            onMinimize={() => setIsChatMinimized(!isChatMinimized)}
            className={isChatMinimized ? '' : 'w-96 h-64'}
          />
        </div>
      )}
    </>
  );
}



export default function GateClientContent({ hunterId }: GateContentProps) {
    return (
        <Suspense fallback={
          <div className="flex h-[50vh] w-full items-center justify-center">
             Loading gate content...
          </div>
        }>
            <GateContent hunterId={hunterId} />
        </Suspense>
    );
} 