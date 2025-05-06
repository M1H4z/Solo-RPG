import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';
import ShopClientContent from '@/components/shop/ShopClientContent';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import RealTimeClock from "@/components/ui/RealTimeClock";
// Import hunter service
import { getHunterById } from '@/services/hunterService'; 
import { getAuthenticatedUser } from '@/services/authService';
// Import Icons
import { Coins, Gem } from 'lucide-react';
// Import cookies and the server client creator
import { cookies } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabase/server';

interface ShopPageProps {
    searchParams?: { [key: string]: string | string[] | undefined };
}

// Wrap the main logic in a separate component for Suspense
// Make it async to fetch data, accept hunter props
async function ShopPageContent({ 
    hunterId,
    initialGold,
    initialDiamonds
}: { 
    hunterId: string,
    initialGold: number,
    initialDiamonds: number
}) {
    return (
        <div className="container mx-auto space-y-8 px-4 py-8">
             <Card className="mb-6 sm:mb-8 sticky top-0 z-50">
                <CardHeader className="grid grid-cols-[1fr_auto_1fr] items-baseline gap-2 px-3 py-2 sm:gap-4 sm:px-6 sm:py-3">
                     <CardTitle className="text-lg font-bold text-text-primary sm:text-xl">
                        Shop
                     </CardTitle>
                     <div className="justify-self-center flex items-center">
                        <RealTimeClock />
                     </div>
                     <div className="justify-self-end flex items-center">
                        <Button variant="link" className="px-0 text-xs sm:text-sm" asChild>
                           <Link href={`/dashboard?hunterId=${hunterId}`}>&larr; Back to Dashboard</Link>
                         </Button>
                    </div>
                 </CardHeader>
             </Card>

             {/* Pass initial currency down - Client component will manage its own state */}
             <ShopClientContent 
                hunterId={hunterId} 
                initialGold={initialGold} 
                initialDiamonds={initialDiamonds} 
            />
        </div>
    );
}

// Make the main export async
export default async function ShopPage({ searchParams }: ShopPageProps) { 
    const hunterId = searchParams?.hunterId;

    // Require hunterId to access the shop
    if (!hunterId || typeof hunterId !== 'string') {
        console.warn("ShopPage: hunterId missing or invalid, redirecting to hunters selection.");
        redirect('/hunters');
    }

    // --- Fetch Hunter Data ---
    // Create the Supabase client using cookies()
    const cookieStore = cookies();
    const supabase = createSupabaseServerClient(cookieStore);
    
    // Pass the created client to service functions
    const user = await getAuthenticatedUser(supabase);
    if (!user) {
        console.warn("ShopPage: User not authenticated, redirecting to login.");
        redirect('/login?message=Please login to access the shop');
    }

    // Fetch only required fields for efficiency, passing the client
    const hunterData = await getHunterById(hunterId, ['id', 'gold', 'diamonds'], supabase); 

    if (!hunterData) {
        console.error(`ShopPage: Hunter not found with ID: ${hunterId}`);
        // Redirect or show error if hunter isn't found
        redirect('/hunters?error=HunterNotFound'); 
    }
    
    // Check ownership if needed (assuming getHunterById doesn't do this already)
    // if (session?.user?.id !== hunterData.user_id) { 
    //     console.warn(`ShopPage: User ${session?.user?.id} attempted to access shop for hunter ${hunterId} owned by ${hunterData.user_id}`);
    //     redirect('/hunters?error=AccessDenied');
    // }
    // --- End Fetch ---


    // Pass fetched data to the content component
    return (
        <Suspense fallback={<div className="p-10 text-center">Loading Shop...</div>}>
            <ShopPageContent 
                hunterId={hunterId} 
                initialGold={hunterData.gold ?? 0} 
                initialDiamonds={hunterData.diamonds ?? 0}
            />
        </Suspense>
    );
}
