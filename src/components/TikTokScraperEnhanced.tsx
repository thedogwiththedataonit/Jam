'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { scrapeWithJina } from '@/app/actions';

type ResultType = 'raw' | 'parsed' | null;

interface TikTokData {
  user: {
    username: string;
    displayName: string;
    profileImageUrl: string;
    description: string;
    stats: {
      followers: number;
      totalLikes: number;
    };
  };
  videos: Array<{
    id: string;
    title: string;
    url: string;
    thumbnailUrl: string;
    stats: {
      views: number;
      likes: number;
      comments: number;
      shares: number;
    };
  }>;
}

export default function TikTokScraperEnhanced() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [jinaResult, setJinaResult] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<TikTokData | null>(null);
  const [activeResult, setActiveResult] = useState<ResultType>(null);
  const [error, setError] = useState<string | null>(null);

  const handleScrape = async () => {
    if (!url) {
      setError('Please enter a URL');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Step 1: Scrape with Jina
      console.log('Starting Jina scrape for:', url);
      const jinaResponse = await scrapeWithJina(url);
      
      if (!jinaResponse.success) {
        throw new Error(jinaResponse.error || 'Failed to scrape with Jina');
      }

      setJinaResult(jinaResponse.data || 'No data found');
      setActiveResult('raw');

      // Step 2: Parse the TikTok data
      const parseResponse = await fetch('/api/parse-tiktok', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jinaResponse: jinaResponse.data }),
      });

      const parseResult = await parseResponse.json();
      
      if (parseResult.success) {
        setParsedData(parseResult.data);
        setActiveResult('parsed');
      } else {
        console.error('Failed to parse TikTok data:', parseResult.error);
        // Still show raw data if parsing fails
      }
    } catch (error) {
      console.error('Error during scraping:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-center">Enhanced TikTok Profile Scraper</h1>
      
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

          <button
            onClick={handleScrape}
            disabled={loading || !url}
            className="w-full mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Scraping & Parsing...' : 'Scrape TikTok Profile'}
          </button>

          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
        </div>

        {/* Results Display */}
        {(jinaResult || parsedData) && (
          <div className="bg-white shadow-md rounded-lg p-6">
            <div className="flex gap-4 mb-4">
              {parsedData && (
                <button
                  onClick={() => setActiveResult('parsed')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    activeResult === 'parsed'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Parsed Data
                </button>
              )}
              {jinaResult && (
                <button
                  onClick={() => setActiveResult('raw')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    activeResult === 'raw'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Raw Markdown
                </button>
              )}
            </div>

            {/* Parsed TikTok Data Display */}
            {activeResult === 'parsed' && parsedData && (
              <div className="space-y-6">
                {/* User Profile Section */}
                <div className="border-b pb-6">
                  <div className="flex items-start gap-6">
                    {parsedData.user.profileImageUrl && (
                      <img 
                        src={parsedData.user.profileImageUrl} 
                        alt={parsedData.user.displayName}
                        className="w-24 h-24 rounded-full object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold">{parsedData.user.displayName}</h2>
                      <p className="text-gray-600">@{parsedData.user.username}</p>
                      {parsedData.user.description && (
                        <p className="mt-2 text-gray-700">{parsedData.user.description}</p>
                      )}
                      <div className="flex gap-6 mt-4">
                        <div>
                          <p className="text-sm text-gray-600">Followers</p>
                          <p className="text-xl font-bold">{formatNumber(parsedData.user.stats.followers)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total Likes</p>
                          <p className="text-xl font-bold">{formatNumber(parsedData.user.stats.totalLikes)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Videos</p>
                          <p className="text-xl font-bold">{parsedData.videos.length}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Videos Section */}
                <div>
                  <h3 className="text-xl font-bold mb-4">Videos ({parsedData.videos.length})</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {parsedData.videos.slice(0, 12).map((video) => (
                      <div key={video.id} className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                        <a href={video.url} target="_blank" rel="noopener noreferrer">
                          {video.thumbnailUrl && (
                            <img 
                              src={video.thumbnailUrl} 
                              alt={video.title}
                              className="w-full h-48 object-cover"
                            />
                          )}
                          <div className="p-3">
                            <p className="text-sm line-clamp-2 mb-2">{video.title || 'Untitled Video'}</p>
                            <div className="flex justify-between text-sm text-gray-600">
                              <span>{formatNumber(video.stats.views)} views</span>
                              {video.stats.likes > 0 && (
                                <span>{formatNumber(video.stats.likes)} likes</span>
                              )}
                            </div>
                          </div>
                        </a>
                      </div>
                    ))}
                  </div>
                  {parsedData.videos.length > 12 && (
                    <p className="text-center mt-4 text-gray-600">
                      Showing 12 of {parsedData.videos.length} videos
                    </p>
                  )}
                </div>

                {/* Export Button */}
                <div className="mt-6 pt-6 border-t">
                  <button
                    onClick={() => {
                      const dataStr = JSON.stringify(parsedData, null, 2);
                      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                      const exportFileDefaultName = `tiktok_${parsedData.user.username}_data.json`;
                      
                      const linkElement = document.createElement('a');
                      linkElement.setAttribute('href', dataUri);
                      linkElement.setAttribute('download', exportFileDefaultName);
                      linkElement.click();
                    }}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    Export as JSON
                  </button>
                </div>
              </div>
            )}

            {/* Raw Markdown Results */}
            {activeResult === 'raw' && jinaResult && (
              <div className="prose prose-lg max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({children}) => <h1 className="text-3xl font-bold mt-6 mb-4">{children}</h1>,
                    h2: ({children}) => <h2 className="text-2xl font-bold mt-5 mb-3">{children}</h2>,
                    h3: ({children}) => <h3 className="text-xl font-bold mt-4 mb-2">{children}</h3>,
                    p: ({children}) => <p className="mb-4 leading-relaxed">{children}</p>,
                    ul: ({children}) => <ul className="list-disc list-inside mb-4 space-y-2">{children}</ul>,
                    a: ({href, children}) => (
                      <a href={href} className="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">
                        {children}
                      </a>
                    ),
                    img: ({src, alt}) => (
                      <img src={src} alt={alt || ''} className="max-w-full h-auto rounded-lg shadow-md my-4" />
                    ),
                    code: ({className, children}) => {
                      return (
                        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                          <code className={className}>{children}</code>
                        </pre>
                      );
                    },
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