"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Hunter } from "@/types/hunter.types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import DungeonsClientContent from "@/components/game/DungeonsClientContent";

// Placeholder type for active dungeon state
interface ActiveDungeonInfo {
  id: string;
  type: string; // e.g., "Goblin Dungeon"
  rank: string; // e.g., "E"
  currentDepth: number;
  currentRoom: number;
  timeRemaining?: string; // Optional: Format as needed
}

// Tell Next.js not to statically generate this page
export default function DungeonsPage() {
  return (
    <Suspense fallback={<div>Loading Dungeon Status...</div>}>
      <DungeonsClientContent />
    </Suspense>
  );
}
