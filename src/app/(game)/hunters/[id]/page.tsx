import React from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getHunterById } from "@/services/hunterService"; // Assuming this service function exists and works server-side
import { getUserSession } from "@/services/authService"; // To ensure user owns the hunter
import ExperienceBar from "@/components/ui/ExperienceBar";
import StatsDisplay from "@/components/game/StatsDisplay";
// import { Database } from "@/types/supabase"; // Assuming supabase types are set up - REMOVED
// import { createSupabaseServerClient } from "@/lib/supabase/server"; // Removed: Unused import
// import { cookies } from "next/headers"; // Removed: Unused import

type HunterDetailPageProps = {
  params: {
    id: string;
  };
};

// Revalidate data periodically or on demand if needed
// export const revalidate = 60; // Example: revalidate every 60 seconds

export default async function HunterDetailPage({
  params,
}: HunterDetailPageProps) {
  // const cookieStore = cookies(); // Removed: Unused variable
  // const supabase = createSupabaseServerClient(); // Removed: Unused variable
  const { id: hunterId } = params;

  // 1. Check user session
  const sessionData = await getUserSession(); // Call without arguments

  // Check if session exists
  if (!sessionData) {
    console.error("Authentication error: No session found or error fetching session.");
    redirect("/login"); // Redirect to login if not authenticated
  }

  // Session exists, get userId
  const userId = sessionData.user.id;

  // 2. Fetch Hunter Data using the service function
  // getHunterById now returns Hunter | null directly, not { data, error }
  const hunter = await getHunterById(hunterId);

  // 3. Handle Hunter Not Found (or fetch error within getHunterById)
  // getHunterById should ideally throw on DB errors, and returns null if not found/unauthorized
  if (!hunter) {
    // Could differentiate between not found and error if getHunterById threw specific errors
    // or if we added error handling around the await call.
    // For now, treat null return as "not found or unauthorized".
    console.warn(`Hunter ${hunterId} not found or access denied for user ${userId}.`);
    notFound(); // Show 404
  }

  // No need for explicit error handling here if getHunterById throws on DB errors
  // The error boundary or Next.js default error page would catch it.

  // Authorization check is implicitly handled by getHunterById which checks user_id

  // Calculate required EXP for the current level for the ExperienceBar
  // hunter.expNeededForNextLevel is the total needed for the *next* level up.
  // hunter.currentLevelStartExp is the EXP needed to *reach* the current level.
  const expForCurrentLevel = hunter.expNeededForNextLevel - hunter.currentLevelStartExp;
  const expProgressInCurrentLevel = hunter.experience - hunter.currentLevelStartExp;

  return (
    <div className="container mx-auto min-h-screen bg-gray-900 px-4 py-8 text-white">
      {/* Header Section */}
      <div className="mb-6 rounded-lg border border-gray-700 bg-gray-800 p-4 shadow-md">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-3xl font-bold">{hunter.name}</h1>
          <Link
            href="/hunters"
            className="text-sm text-blue-400 hover:underline"
          >
            &larr; Change Hunter
          </Link>
        </div>
        <p className="mb-2 text-lg text-gray-300">
          Level {hunter.level} {hunter.class} - Rank {hunter.rank}
        </p>
        {/* Experience Bar - Use calculated values relative to current level */}
        <div className="mb-4 mt-2">
          <ExperienceBar
            currentExp={expProgressInCurrentLevel} // Exp earned within the current level
            nextLevelExp={expForCurrentLevel}      // Total exp needed for this level
          />
        </div>
        {/* Stat/Skill Points - Use direct properties from Hunter type */}
        <div className="flex space-x-4 text-sm text-gray-400">
          <span>
            Stat Points:{" "}
            <span className="font-semibold text-yellow-400">
              {hunter.statPoints} {/* Use camelCase */}
            </span>
          </span>
          <span>
            Skill Points:{" "}
            <span className="font-semibold text-purple-400">
              {hunter.skillPoints} {/* Use camelCase */}
            </span>
          </span>
        </div>
      </div>

      {/* Stats Display Section - Pass hunter directly */}
      <div className="mb-6">
        <StatsDisplay hunter={hunter} />
      </div>

      {/* Action Links Section */}
      <div className="rounded-lg border border-gray-700 bg-gray-800 p-4 shadow-md">
        <h2 className="mb-4 text-center text-xl font-semibold">Actions</h2>
        <nav className="grid grid-cols-2 gap-4 text-center md:grid-cols-4">
          <Link
            href={`/dungeons?hunter=${hunter.id}`}
            className="rounded-md bg-blue-600 p-3 font-medium transition-colors hover:bg-blue-700"
          >
            Enter Gate
          </Link>
          <Link
            href={`/skills?hunter=${hunter.id}`}
            className="rounded-md bg-purple-600 p-3 font-medium transition-colors hover:bg-purple-700"
          >
            Skills
          </Link>
          <Link
            href={`/inventory?hunter=${hunter.id}`}
            className="rounded-md bg-yellow-600 p-3 font-medium transition-colors hover:bg-yellow-700"
          >
            Inventory
          </Link>
          <Link
            href={`/shop?hunter=${hunter.id}`}
            className="rounded-md bg-green-600 p-3 font-medium transition-colors hover:bg-green-700"
          >
            Shop
          </Link>
        </nav>
      </div>

      {/* 
              Placeholder for future sections like Equipment, Active Effects etc.
              <div className="mt-6 p-4 bg-gray-800 rounded-lg border border-gray-700 shadow-md">
                  <h2 className="text-xl font-semibold mb-4">Equipment</h2>
                  Equipment display component goes here
              </div> 
            */}
    </div>
  );
}
