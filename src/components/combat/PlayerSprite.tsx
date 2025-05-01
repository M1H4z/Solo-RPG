"use client";

import React, { useState, useEffect, useRef, CSSProperties } from 'react';
import SpriteAnimator from './SpriteAnimator';

// Add 'flee' state
export type PlayerAnimationState = 'idle' | 'attack' | 'flee';

interface PlayerSpriteProps {
  animationState: PlayerAnimationState;
  isHit?: boolean;
}

const COMBAT_SPRITESHEET_SRC = '/images/avatars/player_combat.png';
const FLEE_SPRITESHEET_SRC = '/images/avatars/player_flee.png'; // Added flee sheet
const FRAME_WIDTH = 128;
const FRAME_HEIGHT = 128;
const COLS = 2;
const ROWS = 2;
const CONTAINER_WIDTH = 128;
const CONTAINER_HEIGHT = 128;

// Combat Animation Frames
const combatAttackFrames = [
  { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 },
];
const combatIdleFrame = combatAttackFrames[0];
const combatTotalAttackFrames = combatAttackFrames.length;
const combatAttackFrameDuration = 300;
const combatTotalAttackAnimationDuration = combatTotalAttackFrames * combatAttackFrameDuration;

// Flee Animation Frames (TL -> TR -> BL -> BR)
const fleeFrames = [
  { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 },
];
const totalFleeFrames = fleeFrames.length;
const fleeFrameDuration = 200; // Make flee a bit faster? Adjust if needed
const totalFleeAnimationDuration = totalFleeFrames * fleeFrameDuration;
const FLEE_MOVE_DURATION_MS = 250; // Duration for the backward dash

// Define positions
const startPositionStyle: CSSProperties = {
  position: 'absolute',
  bottom: '9rem', // Equivalent to bottom-36
  left: '23%',
  zIndex: 10, 
};

const attackPositionStyle: CSSProperties = {
  position: 'absolute',
  // Position near ENEMY start (top-16 right-[21%])
  top: '5rem',    // Align top with enemy start
  right: '26%',   // Adjusted slightly left (closer to enemy's right edge)
  zIndex: 10,
};

// New position for end of flee
const fleeEndPositionStyle: CSSProperties = {
    position: 'absolute',
    bottom: '9rem', // Keep same vertical level
    left: '5%', // Move further left (backward)
    zIndex: 10,
};

const PlayerSprite: React.FC<PlayerSpriteProps> = ({ animationState, isHit = false }) => {
  const [currentFrameCoords, setCurrentFrameCoords] = useState(combatIdleFrame);
  const [positionStyle, setPositionStyle] = useState<CSSProperties>(startPositionStyle);
  const [currentSpriteSheet, setCurrentSpriteSheet] = useState(COMBAT_SPRITESHEET_SRC); // State for sheet source
  const [isFleeing, setIsFleeing] = useState(false); // State to control flip
  const [opacity, setOpacity] = useState(1); // Add opacity state
  
  // Refs for animation loop
  const requestRef = useRef<number>();
  const startTimeRef = useRef<number>();
  const currentFrameIndexRef = useRef<number>(0);

  const animateAttack = (timestamp: number) => {
    if (startTimeRef.current === undefined) { startTimeRef.current = timestamp; }
    const elapsed = timestamp - startTimeRef.current;
    let frameIndex = Math.floor(elapsed / combatAttackFrameDuration);

    if (elapsed >= combatTotalAttackAnimationDuration) {
      setCurrentFrameCoords(combatIdleFrame); 
      setPositionStyle({ ...startPositionStyle, transition: 'none' }); // Ensure end state is correct
      startTimeRef.current = undefined; 
      currentFrameIndexRef.current = 0; 
      return;
    }

    // Set position directly based on frame index for instant change
    if (frameIndex >= 2) {
      setPositionStyle({ ...attackPositionStyle, transition: 'none' }); // Teleport to attack pos
    } else {
      setPositionStyle({ ...startPositionStyle, transition: 'none' }); // Stay/Return to start pos
    }

    // Update frame if changed
    if (frameIndex !== currentFrameIndexRef.current) {
        currentFrameIndexRef.current = frameIndex;
        setCurrentFrameCoords(combatAttackFrames[frameIndex % combatTotalAttackFrames]);
    }
    requestRef.current = requestAnimationFrame(animateAttack);
  };

  const animateFlee = (timestamp: number) => {
    if (startTimeRef.current === undefined) {
      startTimeRef.current = timestamp;
    }
    const elapsed = timestamp - startTimeRef.current;
    
    let frameIndex = Math.floor(elapsed / fleeFrameDuration);
    
    if (elapsed >= totalFleeAnimationDuration) {
      startTimeRef.current = undefined;
      currentFrameIndexRef.current = 0;
      setOpacity(0); // Make sprite invisible
      const lastFrameIndex = totalFleeFrames - 1;
      if (currentFrameIndexRef.current !== lastFrameIndex) {
        setCurrentFrameCoords(fleeFrames[lastFrameIndex]);
      }
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      return;
    }

    if (frameIndex >= 1) {
      setPositionStyle(prev => ({ 
        ...prev, 
        ...fleeEndPositionStyle, 
        transition: `all ${FLEE_MOVE_DURATION_MS}ms ease-out`
      }));
    } else {
      setPositionStyle(prev => ({ 
        ...prev, 
        ...startPositionStyle, 
        transition: 'none' 
      }));
    }

    if (frameIndex !== currentFrameIndexRef.current) {
      currentFrameIndexRef.current = frameIndex;
      const safeIndex = Math.min(frameIndex, totalFleeFrames - 1);
      setCurrentFrameCoords(fleeFrames[safeIndex]);
    }

    requestRef.current = requestAnimationFrame(animateFlee);
  };

  useEffect(() => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
    startTimeRef.current = undefined;
    currentFrameIndexRef.current = -1;

    if (animationState !== 'attack' && animationState !== 'flee') {
      setPositionStyle({ ...startPositionStyle, transition: 'none' });
    }

    if (animationState === 'idle') {
      setCurrentSpriteSheet(COMBAT_SPRITESHEET_SRC);
      setCurrentFrameCoords(combatIdleFrame);
      setPositionStyle({ ...startPositionStyle, transition: 'none' });
    } else if (animationState === 'attack') {
      setCurrentSpriteSheet(COMBAT_SPRITESHEET_SRC);
      setPositionStyle({ ...startPositionStyle, transition: 'none' });
      requestRef.current = requestAnimationFrame(animateAttack);
    } else if (animationState === 'flee') {
      setCurrentSpriteSheet(FLEE_SPRITESHEET_SRC);
      setPositionStyle({ ...startPositionStyle, transition: 'none' });
      requestRef.current = requestAnimationFrame(animateFlee);
    }

    // Update fleeing state
    setIsFleeing(animationState === 'flee');

    // Reset opacity when not fleeing
    setOpacity(1);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [animationState]);

  // Determine final transform (only flip if fleeing)
  const transformStyle = isFleeing ? 'scaleX(-1)' : 'none';

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
        transition: filterTransition,
        transform: transformStyle,
        opacity: opacity
      }}
    >
        <SpriteAnimator
          src={currentSpriteSheet}
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