'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Hunter } from '@/types/hunter.types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

// Placeholder components
// const ShopItemCard = ({ item }) => { ... };
// const CategoryFilter = ({ categories, onSelect }) => { ... };

export default function ShopPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hunterId = searchParams.get('hunterId');

  const [hunter, setHunter] = useState<Hunter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch basic hunter data for currency
  useEffect(() => {
    if (!hunterId) {
      setError('Hunter ID is missing.');
      setLoading(false);
      return;
    }

    async function fetchHunterData() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/hunters/${hunterId}`); 
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to load hunter data');
        }
        const data = await response.json();
        setHunter(data.hunter);
      } catch (err: any) {
        console.error('Error loading hunter data for shop:', err);
        setError(err.message || 'Failed to load hunter information.');
      } finally {
        setLoading(false);
      }
    }

    fetchHunterData();
  }, [hunterId]);

  // --- Loading State --- 
  if (loading) {
    return (
       <div className="flex flex-col items-center justify-center min-h-screen p-4">
         <p className="text-text-secondary text-lg">Loading Shop...</p>
         {/* TODO: Add a themed loading spinner */}
       </div>
    );
  }

  // --- Error Display --- 
  if (error || !hunter) {
     return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <Card className="w-full max-w-md border-danger">
              <CardHeader>
                <CardTitle className="text-danger text-center">Error Loading Shop</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-text-secondary mb-6">{error || 'Could not load shop information for this hunter.'}</p>
                <Button variant="outline" onClick={() => router.back()}>&larr; Go Back</Button>
              </CardContent>
            </Card>
        </div>
    );
  }

  // --- Main Shop Display --- 
  return (
    <div className="container mx-auto px-4 py-8 sm:py-12">
      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle className="text-2xl sm:text-3xl">Shop</CardTitle>
            <CardDescription>Purchase items and equipment using Gold or Diamonds.</CardDescription>
          </div>
          <Button variant="outline" onClick={() => router.push(`/dashboard?hunterId=${hunterId}`)}>
             &larr; Back to Dashboard
           </Button>
        </CardHeader>

        <CardContent className="space-y-6">
            {/* TODO: Add Category Filters (Common, Rare, Event, Skills?) */}
            <div className="border-b border-border-light pb-4">
               <p className="text-text-secondary italic">Category/Filter Placeholder</p>
            </div>

            {/* Item Listing Placeholder */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                 {/* Placeholder for ShopItemCard components mapping over fetched shop items */}
                 <div className="bg-surface/50 border border-border-dark rounded-md p-4 h-40 flex flex-col justify-center items-center text-center">
                    <span className="text-text-secondary italic">Item Placeholder 1</span>
                    <span className="text-xs text-accent mt-2">Cost: ??? Gold</span> 
                 </div>
                 <div className="bg-surface/50 border border-border-dark rounded-md p-4 h-40 flex flex-col justify-center items-center text-center">
                    <span className="text-text-secondary italic">Item Placeholder 2</span>
                     <span className="text-xs text-primary mt-2">Cost: ??? Diamonds</span> 
                 </div>
                 {/* Add more placeholders */} 
            </div>
            <p className="text-xs text-center text-text-secondary italic mt-4">Shop includes common/rare items, limited event gear, and potentially hybrid skills (future). Trading between users may be added later.</p>

        </CardContent>

        <CardFooter className="justify-end space-x-4 border-t border-border-dark pt-4">
            {/* Currency Display */}
            <span className="text-sm font-medium">Your Gold: <span className="text-accent font-semibold">{hunter.gold ?? 0}</span></span>
            <span className="text-sm font-medium">Your Diamonds: <span className="text-primary font-semibold">{hunter.diamonds ?? 0}</span></span>
        </CardFooter>
      </Card>
    </div>
  );
} 