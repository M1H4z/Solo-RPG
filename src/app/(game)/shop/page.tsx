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
  CardFooter,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import ShopClientContent from "@/components/game/ShopClientContent";

// Placeholder components
// const ShopItemCard = ({ item }) => { ... };
// const CategoryFilter = ({ categories, onSelect }) => { ... };

// Tell Next.js not to statically generate this page
// export const dynamic = 'force-dynamic';

export default function ShopPage() {
  return (
    <Suspense fallback={<div>Loading Shop...</div>}>
      <ShopClientContent />
    </Suspense>
  );
}
