import React from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getHunterById } from '@/services/hunterService'; // Assuming this service function exists and works server-side
import { getUserSession } from '@/services/authService'; // To ensure user owns the hunter
import ExperienceBar from '@/components/ui/ExperienceBar';
import StatsDisplay from '@/components/game/StatsDisplay';
import { Database } from '@/types/supabase'; // Assuming supabase types are set up
import { createServerClient } from '@/lib/supabase/server'; // Server client
import { cookies } from 'next/headers';

type HunterDetailPageProps = {
    params: {
        id: string;
    };
};

// Revalidate data periodically or on demand if needed
// export const revalidate = 60; // Example: revalidate every 60 seconds

export default async function HunterDetailPage({ params }: HunterDetailPageProps) {
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);
    const { id: hunterId } = params;

    // 1. Check user session
    const sessionData = await getUserSession(supabase);
    if (sessionData.error || !sessionData.session) {
        console.error('Authentication error:', sessionData.error?.message);
        redirect('/login'); // Redirect to login if not authenticated
    }
    const userId = sessionData.session.user.id;

    // 2. Fetch Hunter Data using the server client
    const { data: hunter, error } = await getHunterById(supabase, hunterId);

    // 3. Handle Errors and Not Found
    if (error) {
        console.error('Error fetching hunter:', error.message);
        // Handle specific errors, e.g., RLS violation or network error
        // For simplicity, redirecting to selection, but could show an error message
        redirect('/hunters?error=fetch_failed'); 
    }

    if (!hunter) {
        notFound(); // Show 404 if hunter doesn't exist
    }

    // 4. Authorization Check: Ensure the fetched hunter belongs to the logged-in user
    // This should ideally be enforced by RLS policies in Supabase, 
    // but an explicit check adds another layer of security.
    if (hunter.user_id !== userId) {
         console.warn(`User ${userId} attempted to access hunter ${hunterId} owned by ${hunter.user_id}`);
         notFound(); // Treat as not found if not owned by the user
    }
    
    // Map DB columns to Hunter type expected by components if necessary
    // The current getHunterById likely returns the DB structure. Let's adapt.
    // We might need to adjust StatsDisplay if it expects nested 'stats'
    const hunterForDisplay = {
        id: hunter.id,
        userId: hunter.user_id,
        name: hunter.name,
        class: hunter.class, // Assuming HunterClass type matches DB string
        level: hunter.level,
        rank: hunter.rank, // Assuming HunterRank type matches DB string
        experience: hunter.experience,
        nextLevelExperience: hunter.next_level_experience,
        // Base stats for StatsDisplay (adapt based on StatsDisplay's expectation)
        // If StatsDisplay expects flat structure:
        strength: hunter.strength,
        agility: hunter.agility,
        perception: hunter.perception,
        intelligence: hunter.intelligence,
        vitality: hunter.vitality,
        // If StatsDisplay expects nested hunter.stats:
        // stats: {
        //     strength: hunter.strength,
        //     agility: hunter.agility,
        //     perception: hunter.perception,
        //     intelligence: hunter.intelligence,
        //     vitality: hunter.vitality,
        // },
        equipment: { /* Fetch or handle equipment later */ }, 
        skillPoints: hunter.skill_points,
        statPoints: hunter.stat_points,
        activeSkills: [/* Fetch or handle skills later */],
        passiveSkills: [/* Fetch or handle skills later */],
        gold: 0, // Add if available in DB
        diamonds: 0 // Add if available in DB
    };

    return (
        <div className="container mx-auto px-4 py-8 min-h-screen bg-gray-900 text-white">
            {/* Header Section */}
            <div className="mb-6 p-4 bg-gray-800 rounded-lg border border-gray-700 shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-3xl font-bold">{hunter.name}</h1>
                    <Link href="/hunters" className="text-sm text-blue-400 hover:underline">
                        &larr; Change Hunter
                    </Link>
                </div>
                <p className="text-lg text-gray-300 mb-2">
                    Level {hunter.level} {hunter.class} - Rank {hunter.rank}
                </p>
                {/* Experience Bar */}
                 <div className="mt-2 mb-4">
                     <ExperienceBar 
                         currentExp={hunter.experience} 
                         nextLevelExp={hunter.next_level_experience} 
                     />
                 </div>
                 {/* Stat/Skill Points */}
                 <div className="flex space-x-4 text-sm text-gray-400">
                     <span>Stat Points: <span className="font-semibold text-yellow-400">{hunter.stat_points}</span></span>
                     <span>Skill Points: <span className="font-semibold text-purple-400">{hunter.skill_points}</span></span>
                 </div>
            </div>

            {/* Stats Display Section */}
            <div className="mb-6">
                 {/* Pass the mapped hunter object */}
                 {/* @ts-ignore - Adjust type mapping if TS complains */}
                <StatsDisplay hunter={hunterForDisplay} /> 
            </div>

            {/* Action Links Section */}
            <div className="p-4 bg-gray-800 rounded-lg border border-gray-700 shadow-md">
                <h2 className="text-xl font-semibold mb-4 text-center">Actions</h2>
                <nav className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <Link href={`/dungeons?hunter=${hunter.id}`} className="p-3 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors font-medium">
                        Enter Gate
                    </Link>
                    <Link href={`/skills?hunter=${hunter.id}`} className="p-3 bg-purple-600 hover:bg-purple-700 rounded-md transition-colors font-medium">
                        Skills
                    </Link>
                    <Link href={`/inventory?hunter=${hunter.id}`} className="p-3 bg-yellow-600 hover:bg-yellow-700 rounded-md transition-colors font-medium">
                        Inventory
                    </Link>
                    <Link href={`/shop?hunter=${hunter.id}`} className="p-3 bg-green-600 hover:bg-green-700 rounded-md transition-colors font-medium">
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