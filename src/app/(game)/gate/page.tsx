import React, { Suspense } from "react";
import GateClientContent from "@/components/game/GateClientContent";

// Tell Next.js not to statically generate this page
export const dynamic = "force-dynamic";

export default function GatePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full w-full items-center justify-center">
          Loading Gate Status...
        </div>
      }
    >
      <GateClientContent />
    </Suspense>
  );
} 