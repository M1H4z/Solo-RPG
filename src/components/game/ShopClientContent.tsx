"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Hunter } from "@/types/hunter.types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

// Placeholder components
// const ShopItemCard = ({ item }) => { ... };
// const CategoryFilter = ({ categories, onSelect }) => { ... };

// Inner component that uses the hook
function ShopContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hunterId = searchParams.get("hunterId");

  const [hunter, setHunter] = useState<Hunter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch basic hunter data for currency
  useEffect(() => {
    if (!hunterId) {
      setError("Hunter ID is missing.");
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
          throw new Error(errorData.error || "Failed to load hunter data");
        }
        const data = await response.json();
        setHunter(data.hunter);
      } catch (err: any) {
        console.error("Error loading hunter data for shop:", err);
        setError(err.message || "Failed to load hunter information.");
      } finally {
        setLoading(false);
      }
    }

    fetchHunterData();
  }, [hunterId]);

  // --- Loading State ---
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <p className="text-lg text-text-secondary">Loading Shop...</p>
      </div>
    );
  }

  // --- Error Display ---
  if (error || !hunter) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md border-danger">
          <CardHeader>
            <CardTitle className="text-center text-danger">
              Error Loading Shop
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-6 text-text-secondary">
              {error || "Could not load shop information for this hunter."}
            </p>
            <Button variant="outline" onClick={() => router.back()}> 
              &larr; Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- Main Shop Display ---
  return (
    <div className="container mx-auto px-4 py-8 sm:py-12">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl sm:text-3xl">Shop</CardTitle>
            <CardDescription>
              Purchase items and equipment using Gold or Diamonds.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard?hunterId=${hunterId}`)}
          >
            &larr; Back to Dashboard
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="border-b border-border-light pb-4">
            <p className="italic text-text-secondary">
              Category/Filter Placeholder
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            <div className="flex h-40 flex-col items-center justify-center rounded-md border border-border-dark bg-surface/50 p-4 text-center">
              <span className="italic text-text-secondary">
                Item Placeholder 1
              </span>
              <span className="mt-2 text-xs text-accent">Cost: ??? Gold</span>
            </div>
            <div className="flex h-40 flex-col items-center justify-center rounded-md border border-border-dark bg-surface/50 p-4 text-center">
              <span className="italic text-text-secondary">
                Item Placeholder 2
              </span>
              <span className="mt-2 text-xs text-primary">
                Cost: ??? Diamonds
              </span>
            </div>
          </div>
          <p className="mt-4 text-center text-xs italic text-text-secondary">
            Shop includes common/rare items, limited event gear, and potentially
            hybrid skills (future). Trading between users may be added later.
          </p>
        </CardContent>

        <CardFooter className="justify-end space-x-4 border-t border-border-dark pt-4">
          <span className="text-sm font-medium">
            Your Gold:{" "}
            <span className="font-semibold text-accent">
              {hunter.gold ?? 0}
            </span>
          </span>
          <span className="text-sm font-medium">
            Your Diamonds:{" "}
            <span className="font-semibold text-primary">
              {hunter.diamonds ?? 0}
            </span>
          </span>
        </CardFooter>
      </Card>
    </div>
  );
}

// Export the component wrapped in Suspense
export default function ShopClientContent() {
    return (
        <Suspense fallback={<div>Loading shop...</div>}>
            <ShopContent />
        </Suspense>
    );
} 