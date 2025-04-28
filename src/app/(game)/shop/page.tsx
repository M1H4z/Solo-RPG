"use client";

import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';
import ShopClientContent from '@/components/shop/ShopClientContent';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

interface ShopPageProps {
    searchParams?: { [key: string]: string | string[] | undefined };
}

// Wrap the main logic in a separate component for Suspense
function ShopPageContent({ hunterId }: { hunterId: string }) {
    return (
        <div className="container mx-auto space-y-8 px-4 py-8">
             <Card className="mb-6 sm:mb-8">
                <CardHeader className="grid grid-cols-[1fr_auto] items-center gap-4 px-4 py-3 sm:px-6">
                     <CardTitle className="text-xl font-bold text-text-primary sm:text-2xl">
                        Item Shop
                     </CardTitle>
                    <div className="justify-self-end">
                        <Button variant="link" className="px-0 text-sm" asChild>
                           <Link href={`/dashboard?hunterId=${hunterId}`}>&larr; Back to Dashboard</Link>
                         </Button>
                    </div>
                 </CardHeader>
             </Card>

            {/* Client component handles fetching and display */}
            <ShopClientContent hunterId={hunterId} />
        </div>
    );
}

export default function ShopPage({ searchParams }: ShopPageProps) {
    const hunterId = searchParams?.hunterId;

    // Require hunterId to access the shop
    if (!hunterId || typeof hunterId !== 'string') {
        console.warn("ShopPage: hunterId missing or invalid, redirecting to hunters selection.");
        // Redirect to hunter selection if no ID is provided
        redirect('/hunters');
    }

    // Use Suspense for cleaner handling of searchParams potentially being async in future Next.js versions
    return (
        <Suspense fallback={<div className="p-10 text-center">Loading Shop...</div>}>
            <ShopPageContent hunterId={hunterId} />
        </Suspense>
    );
}
