import React, { Suspense } from "react";
import ProfileClientContent from "@/components/game/ProfileClientContent";

// Tell Next.js not to statically generate this page
export const dynamic = 'force-dynamic';

export default function ProfilePage() {
  return (
    <Suspense fallback={<div>Loading Profile...</div>}>
      <ProfileClientContent />
    </Suspense>
  );
} 