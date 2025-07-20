export const ChatsDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Chats</h1>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-3xl h-96 border-4 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center bg-white">
          <h2 className="text-xl font-medium text-gray-700 mb-2">
            No conversations yet
          </h2>
          <p className="text-gray-500 mb-6 text-center max-w-xs">
            Once you start a new conversation, it will appear here.
          </p>
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
          >
            New Chat
          </button>
        </div>
      </main>
    </div>
  );
};
