"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { CheckCircle, Award, Package, Coins } from 'lucide-react'; // Icons for rewards
import { supabase } from '@/lib/supabase/client'; // Import the exported client instance instead of the creation function
import { LootDrop } from '@/constants/lootTables.constants'; // Import correct type

interface VictoryRewardsPopupProps {
    expGained: number;
    goldGained: number; // Use the prop
    itemsDropped: LootDrop[]; // Use the prop with correct type { itemId, quantity }
    onContinue: () => void;
}

// Helper type for fetched item details
type FetchedItemDetails = { 
    [itemId: string]: { name: string } 
};

export default function VictoryRewardsPopup({ 
    expGained, 
    goldGained, // Destructure the props
    itemsDropped,
    onContinue 
}: VictoryRewardsPopupProps) {
    
    const [itemDetails, setItemDetails] = useState<FetchedItemDetails>({});
    const [isLoadingNames, setIsLoadingNames] = useState(false);

    // Fetch item names when itemsDropped changes
    useEffect(() => {
        if (!itemsDropped || itemsDropped.length === 0) {
            setItemDetails({}); // Clear details if no items
            return;
        }

        const fetchItemNames = async () => {
            setIsLoadingNames(true);
            const itemIds = itemsDropped.map(item => item.itemId).filter(id => id !== 'gold_pouch_small'); // Extract unique IDs, ignore gold placeholder
            
            if (itemIds.length === 0) {
                 setIsLoadingNames(false);
                 setItemDetails({});
                 return;
            }

            try {
                const { data, error } = await supabase
                    .from('items')
                    .select('id, name')
                    .in('id', itemIds);

                if (error) throw error;

                const details: FetchedItemDetails = {};
                data?.forEach(item => {
                    details[item.id] = { name: item.name || 'Unknown Item' }; // Use ID as fallback?
                });
                setItemDetails(details);

            } catch (error: any) {
                console.error("Error fetching item names:", error);
                // Set details to show IDs as fallback on error?
                const fallbackDetails: FetchedItemDetails = {};
                 itemIds.forEach(id => {
                     fallbackDetails[id] = { name: id }; // Show ID if fetch failed
                 });
                setItemDetails(fallbackDetails);
            } finally {
                setIsLoadingNames(false);
            }
        };

        fetchItemNames();
    }, [itemsDropped, supabase]); // supabase is now stable, but keep as dependency just in case

    return (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-40 backdrop-blur-sm">
            <Card className="w-full max-w-md bg-background-secondary border-border-accent shadow-xl">
                <CardHeader className="text-center">
                    <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-2" />
                    <CardTitle className="text-2xl font-bold text-text-primary">Victory!</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* EXP Gained */}
                    <div className="flex items-center justify-between p-2 bg-background rounded">
                        <div className="flex items-center gap-2">
                            <Award className="h-5 w-5 text-yellow-400" />
                            <span className="text-text-primary font-medium">EXP Gained:</span>
                        </div>
                        <span className="text-yellow-400 font-bold">+{expGained}</span>
                    </div>
                    {/* Use Gold Prop */}
                    {goldGained > 0 && (
                        <div className="flex items-center justify-between p-2 bg-background rounded">
                            <div className="flex items-center gap-2">
                                <Coins className="h-5 w-5 text-yellow-500" />
                                <span className="text-text-primary font-medium">Gold Gained:</span>
                            </div>
                            <span className="text-yellow-500 font-bold">+{goldGained} G</span>
                        </div>
                    )}
                    {/* Use Items Prop and Fetched Names */}
                    {itemsDropped.length > 0 && (
                        <div className="p-2 bg-background rounded space-y-1">
                            <div className="flex items-center gap-2 mb-1">
                                <Package className="h-5 w-5 text-blue-400" />
                                <span className="text-text-primary font-medium">Items Dropped:</span>
                            </div>
                            {isLoadingNames ? (
                                <div className="text-sm text-text-secondary pl-2">Loading item names...</div>
                            ) : (
                                <ul className="list-disc list-inside pl-2 text-sm text-text-secondary">
                                    {itemsDropped.map((item, index) => (
                                        <li key={`${item.itemId}-${index}`}>
                                            {itemDetails[item.itemId]?.name || item.itemId} x{item.quantity}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </CardContent>
                <CardFooter className="mt-4">
                    <Button 
                        className="w-full text-lg py-3" 
                        variant="default" 
                        onClick={onContinue}
                    >
                        Continue
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
} 