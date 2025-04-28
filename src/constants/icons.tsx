import React from "react";
import { HunterClass } from "./classes"; // Assuming HunterClass is exported from classes.ts

/**
 * Mapping of HunterClass to corresponding icon components (currently emojis).
 * Include accessibility attributes.
 */
export const classIcons: { [key in HunterClass]?: React.ReactNode } = {
  Fighter:  <span className="text-lg" role="img" aria-label="Fighter">⚔️</span>,
  Mage:     <span className="text-lg" role="img" aria-label="Mage">🪄</span>,
  Assassin: <span className="text-lg" role="img" aria-label="Assassin">🗡️</span>,
  Ranger:   <span className="text-lg" role="img" aria-label="Ranger">🏹</span>,
  Healer:   <span className="text-lg" role="img" aria-label="Healer">✨</span>,
  Tanker:   <span className="text-lg" role="img" aria-label="Tanker">🛡️</span>,
}; 