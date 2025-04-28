"use client";

import React, { useState, useEffect } from 'react';

/**
 * A simple real-time clock component that updates every second.
 */
export const RealTimeClock: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Set up the interval to update the time every second (1000ms)
    const timerId = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Clean up the interval when the component unmounts
    return () => {
      clearInterval(timerId);
    };
  }, []); // Empty dependency array ensures this effect runs only once on mount

  // Format the time for display (e.g., HH:MM:SS AM/PM)
  const formattedTime = currentTime.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true, // Use true for AM/PM, false for 24-hour
  });

  return (
    <span className="text-sm font-mono text-text-secondary">
      {formattedTime}
    </span>
  );
};

export default RealTimeClock; 