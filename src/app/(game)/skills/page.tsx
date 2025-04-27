'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { Hunter } from '@/types/hunter.types';
import { Skill, SkillRank } from '@/types/skill.types';
import { ALL_SKILLS, getSkillById } from '@/constants/skills';
import SkillCard from '@/components/skills/SkillCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Separator } from '@/components/ui/Separator';

// Define possible ranks for filtering
const skillRanks: SkillRank[] = ['E', 'D', 'C', 'B', 'A', 'S'];

// Placeholder component for individual skills later
// const SkillDisplay = ({ skill }) => { ... };

export default function SkillsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hunterId = searchParams.get('hunterId');

  const [hunter, setHunter] = useState<Hunter | null>(null);
  const [loading, setLoading] = useState(true); // General page loading
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null); // Skill ID being acted upon
  const [rankFilter, setRankFilter] = useState<SkillRank | 'All'>('All');

  const fetchHunterData = useCallback(async (isRefetch: boolean = false) => {
    if (!hunterId) return;
    // Use general loading state only for initial load, not refetches triggered by actions
    if (!isRefetch) {
        setLoading(true);
        setHunter(null); // Clear previous hunter data only on initial load/manual refresh
    }
    setError(null); 
    // Keep actionLoading during refetch to disable buttons
    // setActionLoading(null); // Don't clear actionLoading here
    try {
      const response = await fetch(`/api/hunters/${hunterId}`);
      if (!response.ok) {
        if (response.status === 404) {
          router.push('/hunters');
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load hunter data');
      }
      const data = await response.json();
      setHunter(data.hunter); 
    } catch (err: any) {
      console.error('Error loading hunter on skills page:', err);
      setError(err.message);
    } finally {
        // Clear loading states *after* data is processed or error occurred
        setLoading(false);
        setActionLoading(null); // Clear specific action loading *after* refetch completes
    }
  }, [hunterId, router]);

  useEffect(() => {
    if (!hunterId) {
      setError('Hunter ID is missing.');
      setLoading(false);
      return;
    }
    fetchHunterData(false); // Indicate initial fetch
  }, [hunterId, fetchHunterData]);

  // --- API Call Handlers --- 
  const handleApiCall = async (
    actionType: 'unlock' | 'equip' | 'unequip',
    skillId: string,
    currentHunter: Hunter // Pass current hunter to avoid race conditions
  ) => {
    if (!currentHunter?.id || actionLoading === skillId) return; // Prevent double clicks

    setActionLoading(skillId); // Set loading specifically for this skill button
    setError(null);

    const endpointMap = {
      unlock: `/api/hunters/${currentHunter.id}/unlock-skill`,
      equip: `/api/hunters/${currentHunter.id}/equip-skill`,
      unequip: `/api/hunters/${currentHunter.id}/unequip-skill`,
    };

    try {
      const response = await fetch(endpointMap[actionType], {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skillId }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error(`Error in API call ${endpointMap[actionType]}`, result);
        throw new Error(result.error || `Failed to ${actionType} skill.`);
      }

      console.log(`${actionType} successful:`, result);
      // TODO: Replace console log with a toast notification
      // toast.success(result.message || `Skill ${actionType}ed successfully!`);

      // Use the hunter data returned directly from the API response
      if (result.hunter) {
           setHunter(result.hunter);
           setActionLoading(null); // Clear loading *after* state is updated
      } else {
          // Fallback: Refetch if hunter data wasn't returned (shouldn't happen with current API)
          console.warn(`API call ${actionType} succeeded but didn't return hunter data. Refetching.`);
          await fetchHunterData(true); // true = isRefetch, finally block will clear actionLoading
      }

    } catch (err: any) {
      console.error(`Failed to ${actionType} skill (${skillId}):`, err);
      const errorMessage = err.message || `An error occurred while trying to ${actionType} the skill.`;
      setError(errorMessage);
      // TODO: Replace console log with a toast notification
      // toast.error(errorMessage);
       // Ensure loading is cleared on error
       setActionLoading(null); 
    }
  };

  const handleUnlockSkill = (skillId: string) => {
     if (hunter && actionLoading !== skillId) { // Check actionLoading here too
        handleApiCall('unlock', skillId, hunter);
     }
  };

  const handleEquipSkill = (skillId: string) => {
    if (hunter && actionLoading !== skillId) { // Check actionLoading here too
        handleApiCall('equip', skillId, hunter);
    }
  };

  const handleUnequipSkill = (skillId: string) => {
     if (hunter && actionLoading !== skillId) { // Check actionLoading here too
        handleApiCall('unequip', skillId, hunter);
     }
  };

  // --- Render Logic --- 

  if (loading) {
    return <div className="text-center p-10">Loading Skills...</div>;
  }

  if (error || !hunter) {
    return (
      <div className="text-center p-10">
        <p className="text-danger mb-4">Error: {error || 'Could not load hunter data.'}</p>
        <Button variant="outline" asChild>
          <Link href={hunterId ? `/dashboard?hunterId=${hunterId}` : '/hunters'}>Back to Dashboard</Link>
        </Button>
      </div>
    );
  }

  // Process skills data
  const unlockedSkillsSet = new Set(hunter.unlockedSkills || []);
  const equippedSkillsSet = new Set(hunter.equippedSkills || []);

  const equippedSkillDetails = hunter.equippedSkills
    ?.map(id => getSkillById(id))
    .filter((s): s is Skill => s !== undefined) ?? [];

  const unlockedPassiveSkills = ALL_SKILLS
    .filter(skill => skill.type === 'passive' && unlockedSkillsSet.has(skill.id));

  const availableSkillsToDisplay = ALL_SKILLS
    .filter(skill => rankFilter === 'All' || skill.rank === rankFilter)
    .sort((a, b) => { // Sort by Rank then Level Requirement
        const rankOrder = skillRanks.indexOf(a.rank) - skillRanks.indexOf(b.rank);
        if (rankOrder !== 0) return rankOrder;
        return a.levelRequirement - b.levelRequirement;
    });

  const MAX_EQUIPPED = 4;

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header Section */}
      <div className="flex justify-between items-start mb-6">
        <div>
           <h1 className="text-3xl font-bold text-text-primary">Manage Skills</h1>
           <p className="text-text-secondary">Hunter: {hunter.name} (Level {hunter.level})</p>
        </div>
        <div className="text-right space-y-1">
            <p className="text-lg">Skill Points: <span className="font-semibold text-primary text-xl">{hunter.skillPoints}</span></p>
             <Button variant="link" size="sm" asChild>
                <Link href={`/dashboard?hunterId=${hunterId}`}>&larr; Back to Dashboard</Link>
            </Button>
        </div>
      </div>

      {error && <p className="text-danger my-4 text-center p-2 bg-danger/10 rounded border border-danger">Error: {error}</p>} 

      {/* Equipped Active & Unlocked Passive Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Equipped Active Skills */}
        <Card className="border-secondary/80">
          <CardHeader>
            <CardTitle className="text-xl text-secondary">Equipped Active Skills ({equippedSkillDetails.length}/{MAX_EQUIPPED})</CardTitle>
            <CardDescription>These skills are usable in combat.</CardDescription>
          </CardHeader>
          <CardContent className="min-h-[150px]"> {/* Ensure minimum height */}
             {equippedSkillDetails.length === 0 ? (
                <p className="text-text-disabled text-sm italic text-center pt-4">No active skills equipped. Equip skills from the list below.</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {equippedSkillDetails.map(skill => (
                    <SkillCard 
                        key={`equipped-${skill.id}`} 
                        skill={skill} 
                        hunter={hunter}
                        onUnlock={handleUnlockSkill} 
                        onEquip={handleEquipSkill}
                        onUnequip={handleUnequipSkill}
                        isLoading={actionLoading === skill.id}
                        isEquipped={true}
                        isUnlocked={true}
                    />
                    ))}
                </div>
            )}
          </CardContent>
        </Card>

        {/* Unlocked Passive Skills */}
        <Card className="border-accent/80">
          <CardHeader>
            <CardTitle className="text-xl text-accent">Unlocked Passive Skills</CardTitle>
            <CardDescription>These skills provide permanent bonuses.</CardDescription>
          </CardHeader>
          <CardContent className="min-h-[150px]"> {/* Ensure minimum height */}
            {unlockedPassiveSkills.length === 0 ? (
                <p className="text-text-disabled text-sm italic text-center pt-4">No passive skills unlocked.</p>
            ) : (
                 <ul className="space-y-2">
                    {unlockedPassiveSkills.map(skill => (
                        <li key={`passive-${skill.id}`} className="text-sm p-2 rounded bg-background-alt border border-border-primary">
                            <span className="font-semibold text-accent-foreground">{skill.name} (Rank {skill.rank}):</span>
                            <span className="text-text-secondary ml-2">{skill.description}</span>
                        </li>
                    ))}
                </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator /> 

      {/* Available Skills Section */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Available Skills</h2>
        {/* Filter Controls */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Button 
             variant={rankFilter === 'All' ? 'primary' : 'outline'}
             size="sm"
             onClick={() => setRankFilter('All')}
             >All Ranks</Button>
          {skillRanks.map(rank => (
            <Button 
              key={rank} 
              variant={rankFilter === rank ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setRankFilter(rank)}
            >Rank {rank}</Button>
          ))}
        </div>

        {/* Skill Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {availableSkillsToDisplay.map(skill => {
              const isUnlocked = unlockedSkillsSet.has(skill.id);
              const isEquipped = equippedSkillsSet.has(skill.id);
              return (
                <SkillCard 
                  key={`available-${skill.id}`} 
                  skill={skill} 
                  hunter={hunter}
                  onUnlock={handleUnlockSkill}
                  onEquip={handleEquipSkill}
                  onUnequip={handleUnequipSkill}
                  isLoading={actionLoading === skill.id}
                  isEquipped={isEquipped}
                  isUnlocked={isUnlocked}
                />
              );
          })}
          {availableSkillsToDisplay.length === 0 && (
            <p className="text-text-disabled italic col-span-full text-center py-4">
              No skills match the current filter.
            </p>
          )}
        </div>
      </div>
    </div>
  );
} 