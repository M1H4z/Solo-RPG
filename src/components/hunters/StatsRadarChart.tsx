"use client";

import React from "react";
import {
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer,
  Tooltip,
  Text
} from 'recharts';
import { Hunter, AllocatableStat } from "@/types/hunter.types";

interface StatsRadarChartProps {
  hunter: Hunter | null;
  statsToShow: AllocatableStat[]; // Explicitly pass which stats to show
}

const statNameMapping: Record<AllocatableStat, string> = {
    strength: "STR",
    vitality: "VIT",
    agility: "AGI",
    intelligence: "INT",
    perception: "PER",
};

// Define colors for each stat using HEX codes
const statColorMapping: Record<AllocatableStat, string> = {
  strength: "#ef4444", // red-500
  vitality: "#22c55e", // green-500
  agility: "#3b82f6", // blue-500
  intelligence: "#a855f7", // purple-500
  perception: "#eab308", // yellow-500
};
const fallbackColor = "#6b7280"; // gray-500

// Custom Tick component for PolarAngleAxis
const CustomizedAngleTick: React.FC<any> = (props) => {
  const { payload, x, y, cx, cy, ...rest } = props;

  const statKey = Object.keys(statNameMapping).find(
    (key) => statNameMapping[key as AllocatableStat] === payload.value
  ) as AllocatableStat | undefined;

  const color = statKey ? statColorMapping[statKey] : fallbackColor;

  return (
    <Text
      {...rest}
      verticalAnchor="middle"
      y={y + (y - cy) / 10}
      x={x + (x - cx) / 10}
      fill={color}
      fontSize={12}
      fontWeight={500}
    >
      {payload.value}
    </Text>
  );
};

// Define type for Tooltip payload for linting
interface TooltipPayload {
  subject: string;
  value: number;
  // Add other expected properties if needed
}

interface TooltipProps {
  payload?: TooltipPayload[];
  // Add other expected properties if needed
}

export const StatsRadarChart: React.FC<StatsRadarChartProps> = ({ hunter, statsToShow }) => {
  if (!hunter) {
    // Optional: Render a placeholder or nothing if no hunter data
    return <div className="aspect-square w-full animate-pulse rounded-md bg-muted"></div>;
  }

  const chartData = statsToShow.map(statKey => ({
    subject: statNameMapping[statKey] || statKey.toUpperCase(),
    value: hunter[statKey] ?? 0,
    // Optional: Add a 'fullMark' if you want to define the max scale, 
    // otherwise it scales dynamically based on max value
    // fullMark: 150, // Example max value
  }));

  // Find the maximum stat value to set the domain for the radius axis
  const maxStatValue = Math.max(...chartData.map(d => d.value), 10); // Ensure at least 10

  return (
    // Ensure chart is responsive within its container
    <ResponsiveContainer width="100%" height="100%" minHeight={200} maxHeight={250}> 
      <RadarChart 
        cx="50%" 
        cy="50%" 
        outerRadius="80%" 
        data={chartData}
        margin={{ top: 20, right: 30, left: 30, bottom: 20 }} // Increased margins for labels
      >
        <PolarGrid stroke="#a1a1aa" strokeOpacity={0.7} />
        <PolarAngleAxis 
          dataKey="subject" 
          tick={<CustomizedAngleTick />} // Use the custom tick component
          tickLine={false} // Hide tick lines
          axisLine={{ stroke: "hsl(var(--muted-foreground) / 0.2)" }} // Make axis line subtler
        />
        <PolarRadiusAxis 
           angle={90} // Position angle ticks (optional)
           domain={[0, Math.max(10, Math.ceil(maxStatValue / 10) * 10)]} // Domain from 0 to next multiple of 10 above max
           tick={false} // Hide radius ticks/labels
           axisLine={false} // Hide radius axis line
        />
        <Radar 
          name={hunter.name} 
          dataKey="value" 
          stroke="#a1a1aa"
          fill="#a1a1aa"
          fillOpacity={0.4}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: 'hsl(var(--background))',
            borderColor: 'hsl(var(--border))',
            fontSize: '12px',
            borderRadius: 'var(--radius)',
          }}
          itemStyle={{ color: 'hsl(var(--foreground))' }}
          labelStyle={{ color: 'hsl(var(--muted-foreground))', fontWeight: 'bold' }}
          // eslint-disable-next-line react/prop-types
          formatter={(value: number, name: string, props: TooltipProps) => {
            const subject = props.payload?.[0]?.subject ?? "Stat";
            return [`${value}`, subject];
          }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
};

export default StatsRadarChart; 