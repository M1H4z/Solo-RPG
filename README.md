# Solo Leveling RPG

A web-based text RPG inspired by Solo Leveling with Pokémon-style turn-based combat mechanics and logic.

## Features

- **Account System**: Registration, login, and user management
- **Hunter System**: Create and manage hunters with different classes
- **Skills System**: Skill trees with active and passive abilities
- **Inventory System**: Equipment management and item collection
- **Shop System**: In-game economy with gold and premium currency
- **Dungeon System**: Procedurally generated dungeons with random events
- **Combat System**: Turn-based combat inspired by Pokémon

## Tech Stack

- **Frontend**: Next.js with App Router, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase
- **Database**: Supabase Postgres
- **Authentication**: Supabase Auth

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/solo-rpg.git
   cd solo-rpg
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy the `.env.example` file to `.env.local` and fill in your Supabase credentials:

   ```bash
   cp .env.example .env.local
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

## Project Structure

- `/src/app`: Next.js App Router pages and API routes
- `/src/components`: Reusable UI components
- `/src/hooks`: Custom React hooks
- `/src/lib`: Utilities and libraries
- `/src/types`: TypeScript type definitions
- `/src/constants`: Game constants and configurations
- `/src/providers`: Context providers
- `/src/services`: Service layer for data operations
- `/src/styles`: Global styles and themes

## License

This project is licensed under the MIT License - see the LICENSE file for details.
