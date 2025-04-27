import React from "react";

interface ExperienceBarProps {
  currentExp: number;
  nextLevelExp: number;
}

const ExperienceBar: React.FC<ExperienceBarProps> = ({
  currentExp,
  nextLevelExp,
}) => {
  const percentage =
    nextLevelExp > 0
      ? Math.min(100, Math.floor((currentExp / nextLevelExp) * 100))
      : 0;

  return (
    <div className="relative h-4 w-full overflow-hidden rounded-full border border-gray-600 bg-gray-700">
      <div
        className="h-full rounded-full bg-blue-500 transition-all duration-300 ease-out"
        style={{ width: `${percentage}%` }}
      ></div>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white mix-blend-difference">
        {currentExp} / {nextLevelExp} XP ({percentage}%)
      </span>
    </div>
  );
};

export default ExperienceBar;
