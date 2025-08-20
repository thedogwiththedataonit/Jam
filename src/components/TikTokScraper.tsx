'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { scrapeWithJina } from '@/app/actions';

type ResultType = 'jina' | 'tiktok' | null;

export default function TikTokScraper() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [jinaResult, setJinaResult] = useState<string | null>(null);
  const [activeResult, setActiveResult] = useState<ResultType>(null);
  const [error, setError] = useState<string | null>(null);

  const handleJinaScrape = async () => {
    if (!url) {
      setError('Please enter a URL');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      console.log('Starting Jina scrape for:', url);
      const result = await scrapeWithJina(url);
      
      if (result.success) {
        console.log('Jina scrape successful:');
        console.log(result.data);
        setJinaResult(result.data || 'No data found');
        setActiveResult('jina');
      } else {
        console.error('Jina scrape failed:', result.error);
        setError(result.error || 'Failed to scrape with Jina');
      }
    } catch (error) {
      console.error('Error during Jina scrape:', error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-center">TikTok Profile Scraper</h1>
      
      <div className="space-y-6">
        <div className="bg-white shadow-md rounded-lg p-6">
          <label htmlFor="url" className="block text-sm font-medium mb-2">
            TikTok Profile URL
          </label>
          <input
            id="url"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.tiktok.com/@username"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />

          <div className="flex gap-4 mt-4">
            <button
              onClick={handleJinaScrape}
              disabled={loading || !url}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {loading && activeResult === 'jina' ? 'Scraping...' : 'Scrape with Jina API'}
            </button>

          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
        </div>

        {/* Results Display */}
        {(jinaResult) && (
          <div className="bg-white shadow-md rounded-lg p-6">
            <div className="flex gap-4 mb-4">
              {jinaResult && (
                <button
                  onClick={() => setActiveResult('jina')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    activeResult === 'jina'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Jina Results
                </button>
              )}

            </div>

            {/* Jina Markdown Results */}
            {activeResult === 'jina' && jinaResult && (
              <div className="prose prose-lg max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    // Custom styling for markdown elements
                    h1: ({children}) => <h1 className="text-3xl font-bold mt-6 mb-4">{children}</h1>,
                    h2: ({children}) => <h2 className="text-2xl font-bold mt-5 mb-3">{children}</h2>,
                    h3: ({children}) => <h3 className="text-xl font-bold mt-4 mb-2">{children}</h3>,
                    h4: ({children}) => <h4 className="text-lg font-semibold mt-3 mb-2">{children}</h4>,
                    p: ({children}) => <p className="mb-4 leading-relaxed">{children}</p>,
                    ul: ({children}) => <ul className="list-disc list-inside mb-4 space-y-2">{children}</ul>,
                    ol: ({children}) => <ol className="list-decimal list-inside mb-4 space-y-2">{children}</ol>,
                    li: ({children}) => <li className="ml-4">{children}</li>,
                    a: ({href, children}) => (
                      <a href={href} className="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">
                        {children}
                      </a>
                    ),
                    img: ({src, alt}) => (
                      <img src={src} alt={alt || ''} className="max-w-full h-auto rounded-lg shadow-md my-4" />
                    ),
                    code: ({className, children}) => {
                      if (className === 'inline') {
                        return <code className="bg-gray-100 px-1 py-0.5 rounded text-sm">{children}</code>;
                      }
                      return (
                        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                          <code className={className}>{children}</code>
                        </pre>
                      );
                    },
                    blockquote: ({children}) => (
                      <blockquote className="border-l-4 border-gray-300 pl-4 my-4 italic">
                        {children}
                      </blockquote>
                    ),
                    table: ({children}) => (
                      <div className="overflow-x-auto my-4">
                        <table className="min-w-full border-collapse border border-gray-300">
                          {children}
                        </table>
                      </div>
                    ),
                    thead: ({children}) => <thead className="bg-gray-100">{children}</thead>,
                    th: ({children}) => <th className="border border-gray-300 px-4 py-2 text-left font-semibold">{children}</th>,
                    td: ({children}) => <td className="border border-gray-300 px-4 py-2">{children}</td>,
                  }}
                >
                  {jinaResult}
                </ReactMarkdown>
              </div>
            )}


          </div>
        )}
      </div>
    </div>
  );
}