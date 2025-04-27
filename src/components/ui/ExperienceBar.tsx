import React from 'react';

interface ExperienceBarProps {
    currentExp: number;
    nextLevelExp: number;
}

const ExperienceBar: React.FC<ExperienceBarProps> = ({ currentExp, nextLevelExp }) => {
    const percentage = nextLevelExp > 0 ? Math.min(100, Math.floor((currentExp / nextLevelExp) * 100)) : 0;

    return (
        <div className="w-full bg-gray-700 rounded-full h-4 relative overflow-hidden border border-gray-600">
            <div
                className="bg-blue-500 h-full rounded-full transition-all duration-300 ease-out"
                style={{ width: `${percentage}%` }}
            >
            </div>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white mix-blend-difference">
                {currentExp} / {nextLevelExp} XP ({percentage}%)
            </span>
        </div>
    );
};

export default ExperienceBar; 