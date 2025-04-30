"use client";

import React, { useState, useEffect, useRef, CSSProperties } from 'react';
import SpriteAnimator from './SpriteAnimator';

// Simplified animation states
export type PlayerAnimationState = 'idle' | 'attack';

interface PlayerSpriteProps {
  animationState: PlayerAnimationState;
  isHit?: boolean;
}

const SPRITESHEET_SRC = '/images/avatars/player_combat.png';
const FRAME_WIDTH = 128;
const FRAME_HEIGHT = 128;
const COLS = 2;
const ROWS = 2;
const CONTAINER_WIDTH = 128;
const CONTAINER_HEIGHT = 128;

// Define the frame sequence for the attack animation
const attackFrames = [
  { x: 0, y: 0 }, // Top-Left
  { x: 1, y: 0 }, // Top-Right
  { x: 0, y: 1 }, // Bottom-Left
  { x: 1, y: 1 }, // Bottom-Right
];
const totalFrames = attackFrames.length;

const IDLE_FRAME = attackFrames[0]; // Idle is the first frame
const FRAME_DURATION_MS = 300; // Duration for each frame
const totalAnimationDuration = totalFrames * FRAME_DURATION_MS;

// Define positions
const startPositionStyle: CSSProperties = {
  position: 'absolute',
  bottom: '9rem', // Equivalent to bottom-36
  left: '23%',
  zIndex: 10,
};

const attackPositionStyle: CSSProperties = {
  position: 'absolute',
  top: '5rem',    // Align top with enemy top
  right: '26.5%',   // Position near enemy's right edge
  zIndex: 10,
};

const PlayerSprite: React.FC<PlayerSpriteProps> = ({ animationState, isHit = false }) => {
  const [currentFrameCoords, setCurrentFrameCoords] = useState(IDLE_FRAME);
  const [positionStyle, setPositionStyle] = useState<CSSProperties>(startPositionStyle);
  
  // Refs for animation loop
  const requestRef = useRef<number>();
  const startTimeRef = useRef<number>();
  const currentFrameIndexRef = useRef<number>(0);

  const animate = (timestamp: number) => {
    if (startTimeRef.current === undefined) {
      startTimeRef.current = timestamp;
    }
    const elapsed = timestamp - startTimeRef.current;
    
    // Calculate current frame index
    let frameIndex = Math.floor(elapsed / FRAME_DURATION_MS);
    
    // Check if animation duration exceeded
    if (elapsed >= totalAnimationDuration) {
      setPositionStyle(startPositionStyle); // Ensure return to start position
      setCurrentFrameCoords(IDLE_FRAME);    // Ensure idle frame
      startTimeRef.current = undefined;     // Reset start time for next animation
      currentFrameIndexRef.current = 0;     // Reset frame index
      return; // Stop the animation
    }

    // Update frame only if it changed
    if (frameIndex !== currentFrameIndexRef.current) {
        currentFrameIndexRef.current = frameIndex;
        setCurrentFrameCoords(attackFrames[frameIndex % totalFrames]); // Use modulo just in case
        
        // Handle teleport logic
        if (frameIndex >= 2) { // Teleport on frame 2 and stay there for frame 3
            setPositionStyle(attackPositionStyle);
        } else {
            setPositionStyle(startPositionStyle);
        }
    }

    // Continue the animation loop
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (animationState === 'attack') {
        // Start the animation
        currentFrameIndexRef.current = -1; // Ensure first frame update triggers
        startTimeRef.current = undefined; // Reset start time
        requestRef.current = requestAnimationFrame(animate);
    } else {
      // If not attacking, ensure idle state and stop any ongoing animation
      setCurrentFrameCoords(IDLE_FRAME);
      setPositionStyle(startPositionStyle);
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        startTimeRef.current = undefined;
        currentFrameIndexRef.current = 0;
      }
    }

    // Cleanup function to cancel animation frame on unmount
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [animationState]); // Rerun effect when animationState changes

  // Define filter style for hit flash
  const hitFilterStyle = isHit 
    ? 'brightness(1.2) sepia(1) hue-rotate(-50deg) saturate(8)' 
    : 'none';
  
  // Define transition for the filter effect
  const filterTransition = isHit ? 'filter 0.05s ease-in' : 'filter 0.15s ease-out';

  return (
    // Apply position style AND filter/transition style to this wrapper div
    <div 
      style={{
        ...positionStyle, 
        filter: hitFilterStyle, 
        transition: filterTransition 
      }}
    >
        <SpriteAnimator
          src={SPRITESHEET_SRC}
          frameWidth={FRAME_WIDTH}
          frameHeight={FRAME_HEIGHT}
          cols={COLS}
          rows={ROWS}
          frameCoords={currentFrameCoords}
          containerWidth={CONTAINER_WIDTH}
          containerHeight={CONTAINER_HEIGHT}
          alt="Player Character"
        />
    </div>
  );
};

export default PlayerSprite; 