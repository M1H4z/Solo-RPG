export default function TestStyles() {
  return (
    <div className="min-h-screen bg-red-500 p-8">
      <h1 className="text-4xl font-bold text-white mb-4">CSS Test</h1>
      <div className="bg-blue-600 p-4 rounded-lg shadow-lg">
        <p className="text-yellow-300 text-xl">
          If you can see colors and styling, Tailwind is working!
        </p>
      </div>
      <div className="mt-4 space-y-2">
        <div className="bg-green-500 h-4 w-full rounded"></div>
        <div className="bg-purple-500 h-4 w-3/4 rounded"></div>
        <div className="bg-orange-500 h-4 w-1/2 rounded"></div>
      </div>
    </div>
  );
} 