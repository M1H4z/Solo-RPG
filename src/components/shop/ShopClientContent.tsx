"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/skeleton";
import { Database } from '@/lib/supabase/database.types';
import { toast, Toaster } from 'sonner';
import { Badge } from '@/components/ui/Badge'; // For Rarity - Corrected casing
import { Separator } from '@/components/ui/Separator';
import { Coins, Gem } from 'lucide-react'; // Import icons

// Assuming Item type matches the DB row + any client-side processing needs
type Item = Database['public']['Tables']['items']['Row'];

interface ShopClientContentProps {
    hunterId: string; // Required now, as page redirects if missing
    initialGold: number; // Add initial currency props
    initialDiamonds: number;
}

/**
 * Renders an individual item card in the shop.
 */
const ShopItemCard: React.FC<{
    item: Item;
    onPurchase: (itemId: string, quantity: number) => void;
    isPurchasing: boolean;
}> = ({ item, onPurchase, isPurchasing }) => {

    const handlePurchaseClick = () => {
        // For now, always purchase 1. Add quantity selector later if needed.
        onPurchase(item.id, 1);
    };

    // Helper to display cost
    const displayCost = () => {
        if (item.gold_cost !== null && item.gold_cost >= 0) {
            return <span className="font-semibold text-accent-gold">{item.gold_cost.toLocaleString()} G</span>;
        }
        if (item.diamond_cost !== null && item.diamond_cost >= 0) {
            return <span className="font-semibold text-accent-diamond">{item.diamond_cost.toLocaleString()} ♦</span>;
        }
        return <span className="text-text-secondary">Not for Sale</span>;
    };

     // Helper to display stats (basic example)
     const displayStats = () => {
        if (!item.stats || typeof item.stats !== 'object' || Object.keys(item.stats).length === 0) {
            return null;
        }
        return (
            <div className="mt-2 text-xs space-y-1">
                <p className="font-medium text-text-primary">Stats:</p>
                {Object.entries(item.stats).map(([key, value]) => (
                     <p key={key} className="text-text-secondary capitalize">{key}: +{String(value)}</p>
                ))}
            </div>
        );
    };

     // Helper to display effects (basic example)
     const displayEffects = () => {
         if (!item.effects || typeof item.effects !== 'object' || Object.keys(item.effects).length === 0) {
             return null;
         }
         return (
             <div className="mt-2 text-xs space-y-1">
                 <p className="font-medium text-text-primary">Effects:</p>
                 {Object.entries(item.effects).map(([key, value]) => (
                      <p key={key} className="text-text-secondary capitalize">{key.replace('_', ' ')}: {String(value)}</p>
                 ))}
             </div>
         );
     };

     // Helper for requirements
      const displayRequirements = () => {
          const reqs = [];
          if (item.level_requirement && item.level_requirement > 0) {
              reqs.push(`Lv. ${item.level_requirement}`);
          }
          if (item.class_requirement && item.class_requirement.length > 0) {
               reqs.push(item.class_requirement.join('/'));
          }
          if (reqs.length === 0) return null;

          return (
             <div className="mt-2 text-xs text-text-secondary">
                 Required: {reqs.join(', ')}
             </div>
          );
      };


    return (
        <Card className="flex flex-col h-full"> {/* Use flex-col and h-full */}
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-base">{item.name}</CardTitle>
                    <Badge variant={item.rarity?.toLowerCase() as any || 'default'} className="text-xs capitalize whitespace-nowrap">
                        {item.rarity}
                    </Badge>
                </div>
                {item.item_type === 'Equipment' && item.slot && (
                    <p className="text-xs text-text-secondary">{item.slot} ({item.item_type})</p>
                )}
                 {item.item_type !== 'Equipment' && (
                    <p className="text-xs text-text-secondary">{item.item_type}</p>
                )}
            </CardHeader>
            <CardContent className="flex-grow text-sm text-text-secondary pb-3"> {/* Use flex-grow */}
                {item.description || "No description available."}
                {displayStats()}
                {displayEffects()}
                {displayRequirements()}
            </CardContent>
            <Separator />
            <CardFooter className="pt-3 flex justify-between items-center">
                <div>{displayCost()}</div>
                <Button
                    size="sm"
                    onClick={handlePurchaseClick}
                    disabled={isPurchasing || (item.gold_cost === null && item.diamond_cost === null)} // Disable if no cost
                    aria-label={`Purchase ${item.name}`}
                >
                    {isPurchasing ? 'Purchasing...' : 'Purchase'}
                </Button>
            </CardFooter>
        </Card>
    );
};


/**
 * Fetches and displays shop items, handles purchase actions.
 */
export default function ShopClientContent({ 
    hunterId, 
    initialGold, 
    initialDiamonds 
}: ShopClientContentProps) {
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [purchaseLoading, setPurchaseLoading] = useState<Set<string>>(new Set()); // Tracks IDs of items being purchased
    // Add state for currency - initialized from props
    const [currentGold, setCurrentGold] = useState(initialGold);
    const [currentDiamonds, setCurrentDiamonds] = useState(initialDiamonds);

    // Fetch items on mount
    useEffect(() => {
        const fetchItems = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch('/api/shop/items');
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.error || 'Failed to fetch items');
                }
                setItems(data.items || []);
            } catch (err: any) {
                console.error("Error fetching shop items:", err);
                setError(err.message);
                setItems([]);
            } finally {
                setLoading(false);
            }
        };

        fetchItems();
    }, []); // Fetch only once on mount

    // Handle purchase action
    const handlePurchase = useCallback(async (itemId: string, quantity: number) => {
        if (purchaseLoading.has(itemId)) return; // Prevent double clicks

        setPurchaseLoading(prev => new Set(prev).add(itemId));

        try {
            const response = await fetch('/api/shop/purchase', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hunterId, itemId, quantity }),
            });

            const result = await response.json();

            if (!response.ok) {
                 // Use error message from API/DB function if available
                throw new Error(result.error || `Purchase failed (status: ${response.status})`);
            }

            // Success
            toast.success(result.message || 'Item purchased successfully!');
            
            // >> NEW: Update local currency state from API response <<
            if (typeof result.updatedGold === 'number') {
                setCurrentGold(result.updatedGold);
            }
            if (typeof result.updatedDiamonds === 'number') {
                setCurrentDiamonds(result.updatedDiamonds);
            }
            // >> END NEW <<

        } catch (err: any) {
            console.error("Purchase error:", err);
            toast.error(`Purchase failed: ${err.message}`);
        } finally {
            setPurchaseLoading(prev => {
                const next = new Set(prev);
                next.delete(itemId);
                return next;
            });
        }
    }, [hunterId, purchaseLoading]);

    // Render Logic for Currency Card (Moved from Server Component)
    const renderCurrencyCard = () => (
        <Card className="mb-6 sm:mb-8">
             <CardContent className="p-3 sm:p-4">
                 <div className="flex justify-center items-center gap-6 sm:gap-8">
                     <div className="flex items-center gap-2">
                         <Coins className="h-5 w-5 text-yellow-500" />
                         <span className="text-base font-medium text-text-primary">{currentGold.toLocaleString()}</span> 
                     </div>
                     <div className="flex items-center gap-2">
                         <Gem className="h-5 w-5 text-blue-400" />
                         <span className="text-base font-medium text-text-primary">{currentDiamonds.toLocaleString()}</span> 
                     </div>
                 </div>
             </CardContent>
        </Card>
    );

    // Main component rendering logic
    if (loading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => ( // Show skeleton loaders
                    <Skeleton key={i} className="h-64 w-full rounded-lg" />
                ))}
            </div>
        );
    }

    if (error) {
        return <p className="text-center text-danger">Error loading shop: {error}</p>;
    }

    if (items.length === 0) {
        return <p className="text-center text-text-secondary">The shop is currently empty.</p>;
    }

    return (
        <>
            <Toaster position="bottom-right" richColors />
            <div className="space-y-6">
                {/* Render the currency card */}
                {renderCurrencyCard()}

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {items.map((item) => (
                        <ShopItemCard
                            key={item.id}
                            item={item}
                            onPurchase={handlePurchase}
                            isPurchasing={purchaseLoading.has(item.id)}
                        />
                    ))}
                </div>
            </div>
        </>
    );
} 