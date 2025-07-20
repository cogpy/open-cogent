export const LibraryDashboard = () => {
  const placeholders = Array.from({ length: 12 }, (_, i) => i);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Library</h1>
        </div>
      </header>

      <main className="flex-grow p-6">
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {placeholders.map(idx => (
            <div
              key={idx}
              className="break-inside-avoid border border-gray-200 rounded-lg shadow-sm bg-white p-4 flex items-center justify-center h-40"
            >
              <span className="text-gray-500">Artifact {idx + 1}</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};
