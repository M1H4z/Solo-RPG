"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { CheckCircle, Award, Package, Coins } from 'lucide-react'; // Icons for rewards

interface VictoryRewardsPopupProps {
    expGained: number;
    // TODO: Add goldGained: number;
    // TODO: Add itemsDropped: { name: string; quantity: number }[];
    onContinue: () => void;
}

export default function VictoryRewardsPopup({ 
    expGained, 
    onContinue 
}: VictoryRewardsPopupProps) {
    // TODO: Replace placeholders with actual gold/item data
    const goldGained = 50; 
    const itemsDropped = [
        { name: 'Goblin Ear', quantity: 2 },
        { name: 'Tattered Cloth', quantity: 1 },
    ];

    return (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-40 backdrop-blur-sm">
            <Card className="w-full max-w-md bg-background-secondary border-border-accent shadow-xl">
                <CardHeader className="text-center">
                    <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-2" />
                    <CardTitle className="text-2xl font-bold text-text-primary">Victory!</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-2 bg-background rounded">
                        <div className="flex items-center gap-2">
                            <Award className="h-5 w-5 text-yellow-400" />
                            <span className="text-text-primary font-medium">EXP Gained:</span>
                        </div>
                        <span className="text-yellow-400 font-bold">+{expGained}</span>
                    </div>
                    {/* Placeholder Gold */}
                    <div className="flex items-center justify-between p-2 bg-background rounded">
                         <div className="flex items-center gap-2">
                            <Coins className="h-5 w-5 text-yellow-500" />
                            <span className="text-text-primary font-medium">Gold Gained:</span>
                        </div>
                        <span className="text-yellow-500 font-bold">+{goldGained} G</span>
                    </div>
                    {/* Placeholder Items */}
                    {itemsDropped.length > 0 && (
                        <div className="p-2 bg-background rounded space-y-1">
                            <div className="flex items-center gap-2 mb-1">
                                <Package className="h-5 w-5 text-blue-400" />
                                <span className="text-text-primary font-medium">Items Dropped:</span>
                            </div>
                            <ul className="list-disc list-inside pl-2 text-sm text-text-secondary">
                                {itemsDropped.map((item, index) => (
                                    <li key={index}>{item.name} x{item.quantity}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="mt-4">
                    <Button 
                        className="w-full text-lg py-3" 
                        variant="default" // Use primary button style
                        onClick={onContinue}
                    >
                        Continue
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
} 