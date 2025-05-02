import React, { Suspense } from "react";
import { redirect } from "next/navigation";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import RealTimeClock from "@/components/ui/RealTimeClock";
// Import the actual client component
import DungeonViewClientContent from '@/components/dungeons/DungeonViewClientContent';

interface DungeonPageProps {
  params: { gateId: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

// Tell Next.js not to cache this dynamic page
export const dynamic = "force-dynamic";

export default function DungeonInstancePage({ params, searchParams }: DungeonPageProps) {
  const { gateId } = params;
  const hunterId = searchParams?.hunterId;

  // Validate IDs
  if (!gateId || typeof gateId !== 'string') {
    console.warn("DungeonInstancePage: gateId missing or invalid, redirecting.");
    redirect('/hunters'); 
  }
  if (!hunterId || typeof hunterId !== 'string') {
    console.warn("DungeonInstancePage: hunterId missing or invalid, redirecting.");
    redirect('/hunters');
  }

  return (
    <div className="container mx-auto space-y-8 px-4 py-8">
      {/* Sticky Header Card - Adjusted link to point back to /gate */}
      <Card className="sticky top-0 z-50 mb-6 sm:mb-8">
        <CardHeader className="grid grid-cols-[1fr_auto_1fr] items-baseline gap-2 px-3 py-2 sm:gap-4 sm:px-6 sm:py-3">
          <CardTitle className="truncate text-lg font-bold text-text-primary sm:text-xl">
            Dungeon: {gateId.substring(0, 8)}...
          </CardTitle>
          <div className="justify-self-center flex items-center">
            <RealTimeClock />
          </div>
          <div className="justify-self-end flex items-center">
            {/* Corrected link to point back to /gate */}
            <Button variant="link" className="px-0 text-xs sm:text-sm" asChild>
              <Link href={`/gate?hunterId=${hunterId}`}>&larr; Exit Dungeon</Link>
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Client Content with Suspense */}
      <Suspense
        fallback={
          <div className="flex h-[50vh] w-full items-center justify-center">
            Loading Dungeon View...
          </div>
        }
      >
        {/* Render the actual Dungeon View Component */}
        <DungeonViewClientContent gateId={gateId} hunterId={hunterId} />
      </Suspense>
    </div>
  );
} 