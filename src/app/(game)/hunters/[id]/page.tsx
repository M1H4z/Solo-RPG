import React from "react";
import { notFound, redirect } from "next/navigation";
import { getHunterById } from "@/services/hunterService";
import { getUserSession } from "@/services/authService";

export default async function HunterDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id: hunterId } = params;

  // Check user session
  const sessionData = await getUserSession();
  if (!sessionData) {
    redirect("/login");
  }

  // Fetch Hunter Data
  const hunter = await getHunterById(hunterId);
  if (!hunter) {
    notFound();
  }

  return (
    <div className="p-4">
      <h1>Hunter Details</h1>
      <p>Name: {hunter.name}</p>
      <p>Level: {hunter.level}</p>
      <p>Class: {hunter.class}</p>
    </div>
  );
}
