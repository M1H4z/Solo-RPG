"use client"; // Mark as client component for potential future interactivity

import React, { useState } from "react";
import { useRouter } from "next/navigation"; // Import useRouter
import { Hunter } from "@/types/hunter.types";
import { HunterClass } from "@/constants/classes"; // Import HunterClass type
import { classIcons } from "@/constants/icons"; // Import icons
import { Button } from "@/components/ui/Button"; // Import themed Button
import { Card, CardContent } from "@/components/ui/Card"; // Import themed Card components
import { cn } from "@/lib/utils"; // Import cn
import { toast } from "sonner";

interface HunterCardProps {
  hunter: Hunter;
  onDelete: (hunterId: string) => void; // Callback to notify parent of deletion
}

export const HunterCard: React.FC<HunterCardProps> = ({ hunter, onDelete }) => {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSelect = () => {
    console.log("Selected hunter:", hunter.id);
    // Navigate to the dashboard, passing the hunter ID as a query parameter
    router.push(`/dashboard?hunterId=${hunter.id}`);
  };

  const handleDelete = async () => {
    toast.warning(
      `Are you sure you want to delete ${hunter.name}? This action cannot be undone.`,
      {
        action: {
          label: "Confirm Delete",
          onClick: async () => {
            setIsDeleting(true);
            try {
              const response = await fetch(`/api/hunters/${hunter.id}`, {
                method: "DELETE",
              });

              // Check for successful deletion (204 No Content or 200 OK)
              if (response.status === 204) {
                // Success (No Content)
                toast.success(`${hunter.name} deleted successfully.`);
                onDelete(hunter.id);
              } else if (response.ok) {
                 // Success (with JSON body - less common for DELETE but handle it)
                 const result = await response.json(); 
                 toast.success(result.message || `${hunter.name} deleted successfully.`);
                 onDelete(hunter.id);
              } else {
                  // Attempt to parse error JSON only if not OK
                  let errorData = { error: "Failed to delete hunter. Unknown error." };
                  try {
                      errorData = await response.json();
                  } catch (parseError) {
                      console.error("Could not parse error response:", parseError);
                  }
                  throw new Error(errorData.error || `Failed to delete hunter (Status: ${response.status})`);
              }
            } catch (err: any) {
              console.error("Error deleting hunter:", err);
              toast.error(`Error deleting hunter: ${err.message}`);
            } finally {
              setIsDeleting(false);
            }
          },
        },
        cancel: {
          label: "Cancel",
          onClick: () => { /* Do nothing */ }
        },
        duration: 10000,
      }
    );
  };

  return (
    <Card className="mb-0 border-border-light transition-colors hover:border-border-light/80">
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <span className="text-xl">
            {classIcons[hunter.class as HunterClass]}
          </span>
          <div>
            <h3 className="text-lg font-semibold text-text-primary sm:text-xl">
              {hunter.name}
            </h3>
            <p className="text-sm text-text-secondary">
              Level {hunter.level} {hunter.class} (Rank {hunter.rank})
            </p>
          </div>
        </div>
        <div className="flex flex-col space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0">
          <Button
            variant="default"
            size="sm"
            onClick={handleSelect}
            disabled={isDeleting}
            className="w-full sm:w-auto"
            aria-label={`Select hunter ${hunter.name}`}
          >
            Select
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="w-full sm:w-auto"
            aria-label={`Delete hunter ${hunter.name}`}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
