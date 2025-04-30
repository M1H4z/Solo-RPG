"use client";

import React from 'react';

interface SpriteAnimatorProps {
  src: string;
  frameWidth: number;
  frameHeight: number;
  cols: number;
  rows: number;
  frameCoords: { x: number; y: number }; // 0-indexed coordinates of the frame to show
  containerWidth: number;  // Display width (e.g., 128)
  containerHeight: number; // Display height (e.g., 128)
  alt: string;
  className?: string;
}

const SpriteAnimator: React.FC<SpriteAnimatorProps> = ({
  src,
  frameWidth,
  frameHeight,
  cols,
  rows,
  frameCoords,
  containerWidth,
  containerHeight,
  alt,
  className = '',
}) => {
  // Calculate the total dimensions of the spritesheet
  const sheetWidth = frameWidth * cols; 
  const sheetHeight = frameHeight * rows; // Calculate full sheet height

  // Calculate background position offsets
  const backgroundPositionX = -(frameCoords.x * frameWidth);
  const backgroundPositionY = -(frameCoords.y * frameHeight);

  return (
    <div
      className={`overflow-hidden relative ${className}`}
      style={{ width: containerWidth, height: containerHeight }}
      aria-label={alt}
      role="img"
    >
      <div
        className="absolute top-0 left-0 w-full h-full" // Let inner div fill container
        style={{
          // Removed width/height style - let className handle it
          backgroundImage: `url(${src})`,
          backgroundPosition: `${backgroundPositionX}px ${backgroundPositionY}px`,
          backgroundSize: `${sheetWidth}px ${sheetHeight}px`, // Explicitly set background size
          backgroundRepeat: 'no-repeat',
          // Use nearest-neighbor scaling for pixel art
          imageRendering: 'pixelated', 
          // Removed transform and transformOrigin
        }}
      />
    </div>
  );
};

export default SpriteAnimator; 