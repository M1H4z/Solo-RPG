"use client"; // Make this a Client Component to use hooks

import { useState, useEffect } from "react"; // Import hooks
import { redirect, useRouter } from "next/navigation"; // Import useRouter
import Link from "next/link";
// We cannot call server functions directly in client components
// import { getUserSession } from '@/services/authService';
// import { getMyHunters } from '@/services/hunterService';
import { Hunter } from "@/types/hunter.types";
import { HunterCard } from "@/components/hunters/HunterCard";
import { Button } from "@/components/ui/Button"; // Import Button
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"; // Import Card

export default function HunterSelectionPage() {
  const router = useRouter();
  const [hunters, setHunters] = useState<Hunter[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Fetch hunters client-side since we need hooks
  // Ideally, data fetching could be optimized (e.g., dedicated API route, passed as props)
  useEffect(() => {
    async function loadHunters() {
      setLoading(true);
      setFetchError(null);
      try {
        // Fetch from the newly created API route
        const response = await fetch("/api/hunters");
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || `HTTP error! status: ${response.status}`,
          );
        }
        const data = await response.json();
        console.log("Client fetched hunters:", data.hunters);
        setHunters(data.hunters || []);
      } catch (error: any) {
        console.error("Failed to load hunters on page:", error);
        setFetchError(error.message || "Could not load your hunters.");
        setHunters([]); // Clear hunters on error
      } finally {
        setLoading(false);
      }
    }
    loadHunters();
  }, []); // Run once on mount

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      const response = await fetch("/api/auth/signout", {
        method: "POST",
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Sign out failed");
      }
      // Sign out successful, redirect to login
      router.push("/login");
      router.refresh(); // Ensure page state is cleared
    } catch (error: any) {
      console.error("Sign out failed:", error);
      alert(`Sign out failed: ${error.message}`); // Simple error display
      setIsSigningOut(false);
    }
  };

  // Callback function to remove hunter from state after successful deletion
  const handleHunterDeleted = (deletedHunterId: string) => {
    setHunters((prevHunters) =>
      prevHunters.filter((hunter) => hunter.id !== deletedHunterId),
    );
    // Optionally show a success message
  };

  // Note: Checking session client-side is less secure than middleware,
  // rely on middleware primarily. This is just a fallback/indicator.
  // Consider adding a check here if needed, maybe via context or another API call.

  const canCreateHunter = hunters.length < 2;

  return (
    // Use main container styling
    <div className="container mx-auto flex justify-center px-4 py-8 sm:py-12">
      {/* Use themed Card for the main content */}
      <Card className="relative w-full max-w-2xl">
        {/* Use themed Button for Sign Out */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="absolute right-3 top-3 h-auto px-2 py-1 text-text-secondary hover:bg-danger/10 hover:text-danger"
        >
          {isSigningOut ? "Signing Out..." : "Sign Out"}
        </Button>

        <CardHeader>
          <CardTitle className="text-center text-2xl sm:text-3xl">
            Select Your Hunter
          </CardTitle>
        </CardHeader>

        <CardContent>
          {loading && (
            <p className="py-4 text-center text-text-secondary">
              Loading hunters...
            </p>
          )}

          {fetchError && (
            <p className="mb-4 rounded-md bg-danger/10 px-4 py-2 text-center text-danger">
              {fetchError}
            </p>
          )}

          {!loading && hunters.length > 0 ? (
            <div className="mb-6 space-y-4">
              {hunters.map((hunter) => (
                <HunterCard
                  key={hunter.id}
                  hunter={hunter}
                  onDelete={handleHunterDeleted}
                />
              ))}
            </div>
          ) : (
            !loading &&
            !fetchError && (
              <p className="py-4 text-center text-text-secondary">
                You haven&apos;t created any hunters yet.
              </p>
            )
          )}

          {canCreateHunter ? (
            <Button
              variant="secondary"
              glow="secondary"
              size="lg"
              className="mt-2 w-full"
              disabled={loading}
              onClick={() => router.push("/hunters/create")}
            >
              Create New Hunter
            </Button>
          ) : (
            !loading && (
              <p className="mt-4 text-center text-sm text-text-secondary">
                You have reached the maximum number of hunters (2).
              </p>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}
