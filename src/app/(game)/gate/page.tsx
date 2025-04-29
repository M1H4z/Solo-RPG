import React, { Suspense } from "react";
import GateClientContent from "@/components/game/GateClientContent";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import RealTimeClock from "@/components/ui/RealTimeClock";
import { redirect } from "next/navigation";

interface GatePageProps {
  searchParams?: { [key: string]: string | string[] | undefined };
}

// Tell Next.js not to statically generate this page
export const dynamic = "force-dynamic";

export default function GatePage({ searchParams }: GatePageProps) {
  const hunterId = searchParams?.hunterId;

  // Require hunterId
  if (!hunterId || typeof hunterId !== 'string') {
    console.warn("GatePage: hunterId missing or invalid, redirecting to hunters selection.");
    redirect('/hunters');
  }

  return (
    <div className="container mx-auto space-y-8 px-4 py-8">
      {/* Sticky Header Card */}
      <Card className="sticky top-0 z-50 mb-6 sm:mb-8">
        <CardHeader className="grid grid-cols-[1fr_auto_1fr] items-baseline gap-2 px-3 py-2 sm:gap-4 sm:px-6 sm:py-3">
          <CardTitle className="text-lg font-bold text-text-primary sm:text-xl">
            The Gate
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

      {/* Client Content with Suspense */}
      <Suspense
        fallback={
          <div className="flex h-[50vh] w-full items-center justify-center">
            Loading Gate Status...
          </div>
        }
      >
        <GateClientContent hunterId={hunterId} />
      </Suspense>
    </div>
  );
} 