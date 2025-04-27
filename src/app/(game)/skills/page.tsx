"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { Hunter } from "@/types/hunter.types";
import { Skill, SkillRank } from "@/types/skill.types";
import { ALL_SKILLS, getSkillById } from "@/constants/skills";
import SkillCard from "@/components/skills/SkillCard";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Separator } from "@/components/ui/Separator";
import React, { Suspense } from "react";
import SkillsClientContent from "@/components/game/SkillsClientContent";

// Define possible ranks for filtering
const skillRanks: SkillRank[] = ["E", "D", "C", "B", "A", "S"];

// Placeholder component for individual skills later
// const SkillDisplay = ({ skill }) => { ... };

// Tell Next.js not to statically generate this page
export const dynamic = 'force-dynamic';

export default function SkillsPage() {
  return (
    <Suspense fallback={<div>Loading Skills...</div>}>
      <SkillsClientContent />
    </Suspense>
  );
}
