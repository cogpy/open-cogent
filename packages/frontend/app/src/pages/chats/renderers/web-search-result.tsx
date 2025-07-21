import { useState } from 'react';

interface WebSearchResultProps {
  /** The search results from web_search_exa tool */
  results: any[];
  /** Query that was searched */
  query?: string;
}

interface SearchResult {
  title: string;
  url: string;
  snippet?: string;
  favicon?: string;
}

/**
 * Specialized UI component for displaying web_search_exa tool results.
 * Shows a collapsible card with search completion status and expandable results list.
 */
export function WebSearchResult({ results, query }: WebSearchResultProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // Parse results to extract relevant information
  const searchResults: SearchResult[] = Array.isArray(results)
    ? results.map(result => ({
        title: result.title || result.name || 'Untitled',
        url: result.url || result.link || '#',
        snippet: result.snippet || result.description || result.text || '',
        favicon:
          result.favicon ||
          `https://www.google.com/s2/favicons?domain=${new URL(result.url || 'https://example.com').hostname}&sz=16`,
      }))
    : [];

  const resultCount = searchResults.length;

  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      {/* Collapsed header */}
      <div
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={toggleExpanded}
      >
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            <path d="M2 12h20" />
          </svg>
          <span className="text-sm text-gray-600">
            The search is complete, and these webpages have been searched
          </span>
        </div>
        <div className="flex items-center gap-2">
          {resultCount > 0 && (
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
              {resultCount}
            </span>
          )}
          {isExpanded ? (
            <svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          ) : (
            <svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          )}
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-gray-100">
          {searchResults.length > 0 ? (
            <div className="p-3 space-y-3">
              {searchResults.map((result, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded"
                >
                  {/* Favicon */}
                  <div className="flex-shrink-0 mt-1">
                    {result.favicon ? (
                      <img
                        src={result.favicon}
                        alt=""
                        className="w-4 h-4"
                        onError={e => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <svg
                        className="w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                        <path d="M2 12h20" />
                      </svg>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      <a
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-blue-600 transition-colors"
                      >
                        {result.title}
                      </a>
                    </h3>
                    {result.snippet && (
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {result.snippet}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1 truncate">
                      {result.url}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 text-sm text-gray-500 text-center">
              No search results found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
