"use client";

import React, { useState, useEffect, useRef, CSSProperties } from 'react';
import SpriteAnimator from './SpriteAnimator';

export type EnemyAnimationState = 'idle' | 'attack' | 'hurt' | 'defeat';

interface EnemySpriteProps {
  animationState: EnemyAnimationState;
  flip?: boolean;
  isHit?: boolean;
}

const SPRITESHEET_SRC = '/images/monsters/goblin_scout.png';
const FRAME_WIDTH = 128;
const FRAME_HEIGHT = 128;
const COLS = 2;
const ROWS = 2;
// Match container size to frame size for correct display
const CONTAINER_WIDTH = 128;
const CONTAINER_HEIGHT = 128;

// Define positions
const startPositionStyle: CSSProperties = {
  position: 'absolute',
  top: '4rem',    // Equivalent to top-16 (Raised from 7rem)
  right: '21%',
  zIndex: 10,
};

const attackPositionStyle: CSSProperties = {
  position: 'absolute',
  // Position near player start (bottom-9 left-[23%])
  bottom: '8rem', // Align bottom with player start
  left: '27%',   // Position closer to player (Moved left from 30%)
  zIndex: 10,
};

// Frame coordinates based on TL -> TR -> BR -> BL flow
const frameMap: Record<string, { x: number; y: number }> = {
  idle: { x: 0, y: 0 },    // Top-Left
  attack1: { x: 0, y: 0 },   // Top-Left
  attack2: { x: 1, y: 0 },   // Top-Right
  attack3: { x: 1, y: 1 },   // Bottom-Right
  attack4: { x: 0, y: 1 },   // Bottom-Left
  hurt: { x: 0, y: 1 },    // Bottom-Left
  defeat: { x: 0, y: 1 }  // Placeholder: use hurt frame for defeat
};

const IDLE_FRAME = frameMap.idle;
const ATTACK_FRAMES = [frameMap.attack1, frameMap.attack2, frameMap.attack3, frameMap.attack4];
const HURT_FRAME = frameMap.hurt;
const DEFEAT_FRAME = frameMap.defeat;
const totalAttackFrames = ATTACK_FRAMES.length;

const ATTACK_FRAME_DURATION_MS = 300; // Match player speed (Increased from 150ms)
const HURT_DURATION_MS = 300;
const totalAttackAnimationDuration = totalAttackFrames * ATTACK_FRAME_DURATION_MS;

const EnemySprite: React.FC<EnemySpriteProps> = ({ animationState, flip = false, isHit = false }) => {
  const [currentFrameCoords, setCurrentFrameCoords] = useState(IDLE_FRAME);
  const [positionStyle, setPositionStyle] = useState<CSSProperties>(startPositionStyle); // Add position state

  const requestRef = useRef<number>();
  const startTimeRef = useRef<number>();
  // Use 'any' type for timeout ref to avoid NodeJS type issues in browser
  const hurtTimeoutRef = useRef<any | null>(null);
  const currentFrameIndexRef = useRef<number>(0);

  const animateAttack = (timestamp: number) => {
    if (startTimeRef.current === undefined) {
      startTimeRef.current = timestamp;
    }
    const elapsed = timestamp - startTimeRef.current;
    let frameIndex = Math.floor(elapsed / ATTACK_FRAME_DURATION_MS);

    if (elapsed >= totalAttackAnimationDuration) {
      setCurrentFrameCoords(IDLE_FRAME); // Return to idle frame
      setPositionStyle(startPositionStyle); // Ensure return to start pos
      startTimeRef.current = undefined;
      currentFrameIndexRef.current = 0;
      return; // Stop animation
    }

    // Teleport after frame 1 (i.e., when frameIndex becomes 2)
    if (frameIndex >= 2) {
        setPositionStyle(attackPositionStyle);
    } else {
        setPositionStyle(startPositionStyle); // Ensure starting position for frames 0, 1
    }

    // Update frame if changed
    if (frameIndex !== currentFrameIndexRef.current) {
        currentFrameIndexRef.current = frameIndex;
        setCurrentFrameCoords(ATTACK_FRAMES[frameIndex % totalAttackFrames]);
    }

    requestRef.current = requestAnimationFrame(animateAttack);
  };

  useEffect(() => {
    // Clear previous timers/animations
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    if (hurtTimeoutRef.current) clearTimeout(hurtTimeoutRef.current);
    startTimeRef.current = undefined;
    currentFrameIndexRef.current = 0;
    // Reset position on state change unless it's attack (which handles its own pos)
    if (animationState !== 'attack') {
        setPositionStyle(startPositionStyle);
    }

    if (animationState === 'idle') {
      setCurrentFrameCoords(IDLE_FRAME);
    } else if (animationState === 'attack') {
      currentFrameIndexRef.current = -1; // Ensure first frame update
      startTimeRef.current = undefined;
      setPositionStyle(startPositionStyle); // Ensure starting pos
      requestRef.current = requestAnimationFrame(animateAttack);
    } else if (animationState === 'hurt') {
      setCurrentFrameCoords(HURT_FRAME);
      hurtTimeoutRef.current = setTimeout(() => {
         setCurrentFrameCoords(IDLE_FRAME);
         // Parent should reset state after this duration
      }, HURT_DURATION_MS);
    } else if (animationState === 'defeat') {
      setCurrentFrameCoords(DEFEAT_FRAME);
      // Stay on defeat frame, cancel any animation request
       if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }

    // Cleanup on unmount
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (hurtTimeoutRef.current) clearTimeout(hurtTimeoutRef.current);
    };
  }, [animationState]);

  const transformStyle = flip ? 'scaleX(-1)' : 'none';
  
  // Define filter style for hit flash
  const hitFilterStyle = isHit 
    ? 'brightness(1.2) sepia(1) hue-rotate(-50deg) saturate(8)' 
    : 'none';
  
  // Define transition for the filter effect
  const filterTransition = isHit ? 'filter 0.05s ease-in' : 'filter 0.15s ease-out';

  return (
    <div 
      style={{ 
          transform: transformStyle, 
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
          containerWidth={CONTAINER_WIDTH} // Now matches frame size
          containerHeight={CONTAINER_HEIGHT} // Now matches frame size
          alt="Enemy Character"
        />
    </div>
  );
};

export default EnemySprite; 