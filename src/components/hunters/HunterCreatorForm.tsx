'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { HUNTER_CLASSES } from '@/constants/classes';
import type { HunterClass, ClassDefinition } from '@/constants/classes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

// Placeholder Icons (Replace with actual SVGs/components later)
const PlaceholderIcon = ({ className }: { className?: string }) => (
  <svg className={cn("w-8 h-8 mb-2 text-secondary", className)} fill="currentColor" viewBox="0 0 20 20">
    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12zm-1-7h2v4h-2v-4zm0-2h2V5h-2v2z"/>
  </svg>
);

// Simple mapping for demo - ideally import real icons
const classIcons: { [key in HunterClass]?: React.ReactNode } = {
  Fighter: <PlaceholderIcon />, // Replace with Fighter icon
  Mage: <PlaceholderIcon />,    // Replace with Mage icon
  Assassin: <PlaceholderIcon />, // Replace with Assassin icon
  Ranger: <PlaceholderIcon />,  // Replace with Ranger icon
  Healer: <PlaceholderIcon />,  // Replace with Healer icon
  Tanker: <PlaceholderIcon />,  // Replace with Tanker icon
};

export function HunterCreatorForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [selectedClass, setSelectedClass] = useState<HunterClass | ''>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const classDefinition = useMemo<ClassDefinition | null>(() => {
    return selectedClass ? HUNTER_CLASSES[selectedClass] : null;
  }, [selectedClass]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (!name || !selectedClass) {
      setError('Please enter a name and select a class.');
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append('name', name);
    formData.append('class', selectedClass);
    try {
      const response = await fetch('/api/hunters/create', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || 'Failed to create hunter.');
      } else {
        router.push('/hunters');
        router.refresh();
      }
    } catch (err) { 
      setError('An unexpected network error occurred.');
      console.error('Hunter creation fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={cn(
      "relative w-full max-w-2xl shadow-lg",
      "border border-secondary shadow-glow-secondary"
    )}>
      <CardHeader className="text-center pb-4"> 
        <CardTitle className="text-3xl uppercase tracking-wide">Create Your Hunter</CardTitle>
        <CardDescription className="text-sm mt-1">Choose your path in the world of monsters</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
             <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /> </svg>
             </span>
             <Input
               id="hunter-name"
               type="text"
               placeholder="Enter your hunter name"
               value={name}
               onChange={(e) => setName(e.target.value)}
               required
               maxLength={50} 
               disabled={loading}
               className="pl-10"
             />
          </div>

          <div className="space-y-3 pt-4">
            <h3 className="text-center text-xl font-semibold text-text-primary uppercase tracking-wide">Choose Your Class</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(HUNTER_CLASSES).map(([key, classInfo]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedClass(key as HunterClass)}
                  disabled={loading}
                  className={cn(
                    "p-4 border rounded-lg text-center transition-all duration-200 ease-in-out",
                    "bg-surface hover:bg-surface/80",
                    selectedClass === key 
                      ? 'border-secondary ring-2 ring-secondary shadow-glow-secondary'
                      : 'border-border-dark hover:border-border-light'
                  )}
                >
                  <div className="flex justify-center">
                    {classIcons[key as HunterClass] || <PlaceholderIcon />} 
                  </div>
                  <h4 className="font-semibold text-lg mb-1 text-text-primary">{classInfo.name}</h4>
                  <p className="text-xs text-text-secondary">{classInfo.description}</p>
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-danger text-sm text-center py-1">{error}</p>}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4"> 
             <Button 
               type="submit" 
               variant="secondary"
               glow="secondary"
               size="lg"
               disabled={loading || !name || !selectedClass}
               className="w-full sm:flex-1"
             >
               {loading ? 'Creating...' : 'CREATE HUNTER'}
             </Button>
             <Button 
               type="button" 
               variant="outline" 
               size="lg"
               onClick={() => router.push('/hunters')}
               disabled={loading}
               className="w-full sm:flex-1 border-border-light text-text-secondary hover:bg-surface hover:text-text-primary"
             >
               BACK TO HUNTERS
             </Button>
           </div>
        </form>
      </CardContent>
    </Card>
  );
} 