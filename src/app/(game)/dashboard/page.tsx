import React, { Suspense } from "react";
import DashboardClientContent from "@/components/game/DashboardClientContent";

// Remove export const dynamic = 'force-dynamic'; - not needed with Suspense approach

// No props needed for the page component itself anymore
// interface DashboardPageProps {}

// This is now a simple Server Component (or can remain async if needed for other reasons)
export default function DashboardPage() {
  return (
    // Wrap the client component in Suspense
    <Suspense fallback={<div>Loading Dashboard...</div>}>
      <DashboardClientContent />
    </Suspense>
  );
}
