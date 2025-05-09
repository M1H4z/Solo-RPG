"use client";

import React from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the Phaser game component with SSR turned off
const PhaserGameComponent = dynamic(() => import('@/components/game/PhaserGameInstance'), {
  ssr: false,
  loading: () => <p className="text-center text-xl p-8">Loading Game...</p>,
});

const PhaserTownTestPage = () => {
  return (
    <div className="flex flex-col items-center p-6 bg-gray-800 min-h-screen text-white">
      <div className="w-full max-w-4xl bg-gray-700 p-6 rounded-lg shadow-xl">
        <h1 className="text-3xl font-bold mb-4 text-center text-yellow-400">Phaser Town Map - Tilemap PoC</h1>
        <p className="mb-2 text-center">
          This page now demonstrates a basic procedural tilemap.
        </p>
        <p className="mb-1 text-center">
          Move the player rectangle using the <strong>arrow keys</strong>.
        </p>
        <p className="mb-4 text-center">
          Player will collide with grey (Wall) and blue (Water) tiles. Building interaction zones are still present.
        </p>
        <div className="text-center my-4 p-3 bg-yellow-500 text-black rounded-md">
          <strong>Important:</strong> If you haven't already, ensure Phaser is installed:
          <code className="block bg-gray-800 p-2 rounded mt-1">npm install phaser</code>
          or
          <code className="block bg-gray-800 p-2 rounded mt-1">yarn add phaser</code>
          Then, restart your development server.
        </div>
        {/* Render the dynamically imported Phaser component */}
        <PhaserGameComponent />
      </div>
    </div>
  );
};

export default PhaserTownTestPage; 