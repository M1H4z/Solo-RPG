'use client'; // Mark as client component for potential future interactivity

import React, { useState } from 'react';
import { useRouter } from 'next/navigation'; // Import useRouter
import { Hunter } from '@/types/hunter.types';
import { Button } from '@/components/ui/Button'; // Import themed Button
import { Card, CardContent } from '@/components/ui/Card'; // Import themed Card components
import { cn } from '@/lib/utils'; // Import cn

interface HunterCardProps {
  hunter: Hunter;
  onDelete?: (hunterId: string) => void; // Callback to notify parent of deletion
}

export const HunterCard: React.FC<HunterCardProps> = ({ hunter, onDelete }) => {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelect = () => {
    console.log('Selected hunter:', hunter.id);
    // Navigate to the dashboard, passing the hunter ID as a query parameter
    router.push(`/dashboard?hunterId=${hunter.id}`);
  };

  const handleDelete = async () => {
    setError(null); // Clear previous errors
    // Confirmation dialog
    if (!window.confirm(`Are you sure you want to delete ${hunter.name}? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/hunters/${hunter.id}`, {
        method: 'DELETE',
      });

      if (!response.ok && response.status !== 204) {
        // Try to parse error message from response if possible
        let errorMsg = 'Failed to delete hunter.';
        try {
          const result = await response.json();
          errorMsg = result.error || errorMsg;
        } catch (_) {
          // Ignore if response is not JSON or empty (like for 204)
        }
           throw new Error(errorMsg);
      }
      else { // Handle 204 No Content specifically as success
        console.log('Hunter deleted successfully');
        if (onDelete) {
          onDelete(hunter.id); // Notify parent component
        }
        // Optionally trigger a refresh or update UI directly
      }

    } catch (err: any) {
      console.error('Delete hunter failed:', err);
      setError(err.message || 'An unexpected error occurred.');
      // Display error to user, maybe near the button
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="mb-0 border-border-light hover:border-border-light/80 transition-colors">
      <CardContent className="p-4 flex justify-between items-center">
      <div className="flex-grow mr-4">
          <h3 className="text-lg sm:text-xl font-semibold text-text-primary">{hunter.name}</h3>
          <p className="text-sm text-text-secondary">Level {hunter.level} {hunter.class} (Rank {hunter.rank})</p>
        {/* TODO: Maybe display a few key stats later */}
          {error && <p className="text-xs text-danger mt-1">Error: {error}</p>}
      </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <Button 
            variant="default"
            size="sm"
          onClick={handleSelect}
            disabled={isDeleting}
            className="w-full sm:w-auto"
        >
          Select
          </Button>
          <Button 
            variant="destructive"
            size="sm"
          onClick={handleDelete}
          disabled={isDeleting}
            className="w-full sm:w-auto"
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
      </div>
      </CardContent>
    </Card>
  );
}; 