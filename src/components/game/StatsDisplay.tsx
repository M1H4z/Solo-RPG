import React from 'react';
import { Hunter } from '@/types/hunter.types';
import { calculateDerivedStats, DerivedStats } from '@/lib/game/stats';

interface StatsDisplayProps {
    hunter: Hunter;
}

const StatItem: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
    <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-400">{label}:</span>
        <span className="font-medium text-white">{value}</span>
    </div>
);

const StatsDisplay: React.FC<StatsDisplayProps> = ({ hunter }) => {
    const derivedStats = calculateDerivedStats(hunter);

    // Map base stats from hunter object if stats property exists
    const baseStats = hunter.stats ? {
        strength: hunter.stats.strength,
        agility: hunter.stats.agility,
        perception: hunter.stats.perception,
        intelligence: hunter.stats.intelligence,
        vitality: hunter.stats.vitality,
    } : {
        strength: hunter.strength, // Fallback if stats is not nested
        agility: hunter.agility,
        perception: hunter.perception,
        intelligence: hunter.intelligence,
        vitality: hunter.vitality,
    };

    return (
        <div className="p-4 bg-gray-800 rounded-lg border border-gray-700 shadow-md">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Base Stats Column */}
                <div>
                    <h3 className="text-lg font-semibold text-white mb-3 border-b border-gray-600 pb-1">Base Stats</h3>
                    <StatItem label="Strength" value={baseStats.strength} />
                    <StatItem label="Agility" value={baseStats.agility} />
                    <StatItem label="Perception" value={baseStats.perception} />
                    <StatItem label="Intelligence" value={baseStats.intelligence} />
                    <StatItem label="Vitality" value={baseStats.vitality} />
                </div>

                {/* Derived Stats Column */}
                <div>
                    <h3 className="text-lg font-semibold text-white mb-3 border-b border-gray-600 pb-1">Derived Stats</h3>
                    <StatItem label="Max HP" value={derivedStats.maxHP} />
                    <StatItem label="Max MP" value={derivedStats.maxMP} />
                    <StatItem label="Attack Power" value={derivedStats.attackPower} />
                    <StatItem label="Defense" value={derivedStats.defense} />
                    <StatItem label="Crit Rate" value={`${derivedStats.critRate}%`} />
                    <StatItem label="Crit Damage" value={`${(derivedStats.critDamage * 100).toFixed(0)}%`} />
                    <StatItem label="Speed" value={derivedStats.speed} />
                    <StatItem label="Evasion" value={`${derivedStats.evasion}%`} />
                    <StatItem label="Precision" value={`${derivedStats.precision}%`} />
                </div>
            </div>
        </div>
    );
};

export default StatsDisplay; 