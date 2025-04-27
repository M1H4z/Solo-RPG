import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800 p-24 text-white">
      <h1 className="mb-8 text-6xl font-bold">Solo Leveling RPG</h1>
      <p className="mb-8 max-w-2xl text-center text-xl">
        A web-based text RPG inspired by Solo Leveling with Pokémon-style combat
        mechanics
      </p>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="rounded-lg bg-blue-600 px-6 py-3 font-medium transition-colors hover:bg-blue-700"
        >
          Login
        </Link>
        <Link
          href="/register"
          className="rounded-lg bg-gray-700 px-6 py-3 font-medium transition-colors hover:bg-gray-600"
        >
          Register
        </Link>
      </div>
    </main>
  );
}
