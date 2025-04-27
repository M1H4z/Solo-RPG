import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <h1 className="text-6xl font-bold mb-8">Solo Leveling RPG</h1>
      <p className="text-xl mb-8 max-w-2xl text-center">
        A web-based text RPG inspired by Solo Leveling with Pokémon-style combat mechanics
      </p>
      <div className="flex gap-4">
        <Link 
          href="/login" 
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
        >
          Login
        </Link>
        <Link 
          href="/register" 
          className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
        >
          Register
        </Link>
      </div>
    </main>
  );
} 