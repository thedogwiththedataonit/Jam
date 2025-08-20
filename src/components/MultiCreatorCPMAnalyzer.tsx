'use client';

import { useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChartContainer } from '@/components/ui/chart';
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { scrapeWithJina } from '@/app/actions';
import { DollarSign, BarChart3, AlertCircle, Plus, X, Trophy, Users as UsersIcon, ArrowLeft, Crown } from 'lucide-react';

interface TikTokVideo {
  id: string;
  title: string;
  url: string;
  thumbnailUrl: string;
  stats: {
    views: number;
  };
}

interface TikTokData {
  user: {
    username: string;
    displayName: string;
    profileImageUrl: string;
    description: string;
    stats: {
      followers: number;
    };
  };
  videos: TikTokVideo[];
}

interface AnalyticsData {
  totalViews: number;
  averageViews: number;
  cpm: number;
  viralityRate: number;
  viralVideos: number;
  totalVideos: number;
  viewsStandardDeviation: number;
  performanceConsistency: string;
}

interface CreatorAnalysis {
  url: string;
  tikTokData: TikTokData;
  analytics: AnalyticsData;
  error?: string;
}

// Currency conversion rates (to USD)
const CURRENCY_RATES: Record<string, { rate: number; symbol: string; label: string }> = {
  USD: { rate: 1, symbol: '$', label: 'USD' },
  EUR: { rate: 1.09, symbol: '€', label: 'EUR' },
  GBP: { rate: 1.27, symbol: '£', label: 'GBP' },
  JPY: { rate: 0.0066, symbol: '¥', label: 'JPY' },
  KRW: { rate: 0.00076, symbol: '₩', label: 'KRW' },
  INR: { rate: 0.012, symbol: '₹', label: 'INR' },
  CAD: { rate: 0.74, symbol: 'C$', label: 'CAD' },
  AUD: { rate: 0.65, symbol: 'A$', label: 'AUD' },
};

export default function MultiCreatorCPMAnalyzer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCurrency = searchParams.get('currency') || 'USD';
  
  const [urls, setUrls] = useState<string[]>(['']);
  const [costPerVideo, setCostPerVideo] = useState('');
  const [videosToAnalyze, setVideosToAnalyze] = useState('10');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyses, setAnalyses] = useState<CreatorAnalysis[]>([]);
  const [selectedCreatorIndex, setSelectedCreatorIndex] = useState<number | null>(null);

  // Update URL when currency changes
  const updateCurrency = (newCurrency: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('currency', newCurrency);
    router.push(`?${params.toString()}`);
  };

  const addUrlField = () => {
    if (urls.length < 5) {
      setUrls([...urls, '']);
    }
  };

  const removeUrlField = (index: number) => {
    const newUrls = urls.filter((_, i) => i !== index);
    setUrls(newUrls.length === 0 ? [''] : newUrls);
  };

  const updateUrl = (index: number, value: string) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    setUrls(newUrls);
  };

  const calculateAnalytics = (data: TikTokData, cost: number, videoCount: number, currency: string): AnalyticsData => {
    const videosToAnalyze = data.videos.slice(0, videoCount);
    
    // Convert cost to USD for CPM calculation
    const costInUSD = cost * (CURRENCY_RATES[currency]?.rate || 1);
    
    // Calculate total and average views
    const totalViews = videosToAnalyze.reduce((sum, video) => sum + video.stats.views, 0);
    const averageViews = totalViews / videosToAnalyze.length;
    
    // Calculate CPM
    const cpm = (costInUSD / averageViews) * 1000;
    
    // Calculate standard deviation for views
    const viewsArray = videosToAnalyze.map(v => v.stats.views);
    const viewsMean = viewsArray.reduce((a, b) => a + b, 0) / viewsArray.length;
    const viewsVariance = viewsArray.reduce((sum, view) => sum + Math.pow(view - viewsMean, 2), 0) / viewsArray.length;
    const viewsStandardDeviation = Math.sqrt(viewsVariance);
    
    // Define virality
    const viralityThreshold = viewsMean + (2 * viewsStandardDeviation);
    const viralVideos = videosToAnalyze.filter(video => video.stats.views > viralityThreshold).length;
    const viralityRate = (viralVideos / videosToAnalyze.length) * 100;
    
    // Determine performance consistency
    const coefficientOfVariation = (viewsStandardDeviation / viewsMean) * 100;
    let performanceConsistency = 'High';
    if (coefficientOfVariation > 100) performanceConsistency = 'Low';
    else if (coefficientOfVariation > 50) performanceConsistency = 'Medium';
    
    return {
      totalViews,
      averageViews,
      cpm,
      viralityRate,
      viralVideos,
      totalVideos: videosToAnalyze.length,
      viewsStandardDeviation,
      performanceConsistency
    };
  };

  const analyzeCreator = async (url: string, cost: number, videoCount: number): Promise<CreatorAnalysis> => {
    try {
      // Scrape TikTok data
      const jinaResponse = await scrapeWithJina(url);
      
      if (!jinaResponse.success) {
        throw new Error(jinaResponse.error || 'Failed to scrape TikTok data');
      }

      // Parse the TikTok data
      const parseResponse = await fetch('/api/parse-tiktok', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jinaResponse: jinaResponse.data }),
      });

      const parseResult = await parseResponse.json();
      
      if (!parseResult.success) {
        throw new Error(parseResult.error || 'Failed to parse TikTok data');
      }

      const data = parseResult.data as TikTokData;
      const analyticsData = calculateAnalytics(data, cost, videoCount, currentCurrency);

      return {
        url,
        tikTokData: data,
        analytics: analyticsData
      };
    } catch (err) {
      return {
        url,
        tikTokData: {} as TikTokData,
        analytics: {} as AnalyticsData,
        error: err instanceof Error ? err.message : 'An unexpected error occurred'
      };
    }
  };

  const handleAnalyze = async () => {
    const validUrls = urls.filter(url => url.trim() !== '');
    
    if (validUrls.length === 0 || !costPerVideo) {
      setError('Please enter at least one TikTok URL and cost per video');
      return;
    }

    const cost = parseFloat(costPerVideo);
    if (isNaN(cost) || cost <= 0) {
      setError('Please enter a valid cost per video');
      return;
    }

    const videoCount = parseInt(videosToAnalyze);
    if (isNaN(videoCount) || videoCount <= 0) {
      setError('Please enter a valid number of videos to analyze');
      return;
    }

    setLoading(true);
    setError(null);
    setAnalyses([]);

    try {
      // Analyze all creators in parallel
      const analysisPromises = validUrls.map(url => analyzeCreator(url, cost, videoCount));
      const results = await Promise.all(analysisPromises);
      
      // Filter out failed analyses but keep them in the results
      setAnalyses(results);
      
      // If all analyses failed, show an error
      if (results.every(r => r.error)) {
        setError('Failed to analyze any creators. Please check the URLs and try again.');
      }
    } catch (err) {
      console.error('Error analyzing creators:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(2)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toFixed(0);
  };

  const getBestCreator = useCallback(() => {
    const validAnalyses = analyses.filter(a => !a.error);
    if (validAnalyses.length === 0) return null;
    
    return validAnalyses.reduce((best, current) => 
      current.analytics.cpm < best.analytics.cpm ? current : best
    );
  }, [analyses]);

  const getComparisonChartData = useCallback(() => {
    return analyses
      .filter(a => !a.error)
      .map(a => ({
        name: `@${a.tikTokData.user.username}`,
        cpm: a.analytics.cpm,
        avgViews: a.analytics.averageViews,
        viralityRate: a.analytics.viralityRate,
        followers: a.tikTokData.user.stats.followers
      }));
  }, [analyses]);

  const getRadarChartData = useCallback(() => {
    const validAnalyses = analyses.filter(a => !a.error);
    if (validAnalyses.length === 0) return [];

    // Normalize metrics to 0-100 scale
    const maxCPM = Math.max(...validAnalyses.map(a => a.analytics.cpm));
    const maxViews = Math.max(...validAnalyses.map(a => a.analytics.averageViews));
    const maxFollowers = Math.max(...validAnalyses.map(a => a.tikTokData.user.stats.followers));

    const metrics = ['CPM Efficiency', 'Avg Views', 'Virality', 'Consistency', 'Followers'];
    
    return metrics.map(metric => {
      const dataPoint: Record<string, string | number> = { metric };
      
      validAnalyses.forEach((analysis) => {
        let value = 0;
        switch (metric) {
          case 'CPM Efficiency':
            // Lower CPM is better, so invert the scale
            value = ((maxCPM - analysis.analytics.cpm) / maxCPM) * 100;
            break;
          case 'Avg Views':
            value = (analysis.analytics.averageViews / maxViews) * 100;
            break;
          case 'Virality':
            value = analysis.analytics.viralityRate;
            break;
          case 'Consistency':
            value = analysis.analytics.performanceConsistency === 'High' ? 100 :
                   analysis.analytics.performanceConsistency === 'Medium' ? 50 : 20;
            break;
          case 'Followers':
            value = (analysis.tikTokData.user.stats.followers / maxFollowers) * 100;
            break;
        }
        dataPoint[`@${analysis.tikTokData.user.username}`] = Math.round(value);
      });
      
      return dataPoint;
    });
  }, [analyses]);

  const renderComparisonView = () => {
    const validAnalyses = analyses.filter(a => !a.error);
    const bestCreator = getBestCreator();
    const comparisonData = getComparisonChartData();
    const radarData = getRadarChartData();

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="space-y-8"
      >
        {/* Best Creator Highlight */}
        {bestCreator && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="shadow-sm border-primary/20 bg-primary/5">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-full bg-primary/10">
                      <Trophy className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Best Value Creator</CardTitle>
                      <CardDescription>Lowest CPM with solid performance</CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedCreatorIndex(analyses.indexOf(bestCreator))}
                  >
                    View Details
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <img 
                    src={bestCreator.tikTokData.user.profileImageUrl} 
                    alt={bestCreator.tikTokData.user.displayName}
                    className="w-16 h-16 rounded-full border-2 border-primary"
                  />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">@{bestCreator.tikTokData.user.username}</h3>
                    <p className="text-muted-foreground">{bestCreator.tikTokData.user.displayName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">${bestCreator.analytics.cpm.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">CPM (USD)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Comparison Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-medium">CPM Comparison</CardTitle>
              <CardDescription>Cost efficiency across all creators</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer className="h-[300px] w-full" config={{}}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                    <XAxis 
                      dataKey="name" 
                      stroke="var(--muted-foreground)" 
                      fontSize={12}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis 
                      stroke="var(--muted-foreground)" 
                      fontSize={12}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--card)', 
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)',
                      }}
                    />
                    <Bar 
                      dataKey="cpm" 
                      fill="var(--primary)" 
                      name="CPM (USD)" 
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Performance Radar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Performance Overview</CardTitle>
              <CardDescription>Multi-dimensional creator comparison</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer className="h-[400px] w-full" config={{}}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="var(--border)" />
                    <PolarAngleAxis 
                      dataKey="metric" 
                      stroke="var(--muted-foreground)"
                      fontSize={12}
                    />
                    <PolarRadiusAxis 
                      stroke="var(--muted-foreground)"
                      fontSize={10}
                      domain={[0, 100]}
                    />
                    {validAnalyses.map((analysis, index) => (
                      <Radar
                        key={analysis.tikTokData.user.username}
                        name={`@${analysis.tikTokData.user.username}`}
                        dataKey={`@${analysis.tikTokData.user.username}`}
                        stroke={`hsl(var(--primary) / ${1 - (index * 0.2)})`}
                        fill={`hsl(var(--primary) / ${0.2 - (index * 0.05)})`}
                        strokeWidth={2}
                      />
                    ))}
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Creator Cards Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="text-lg font-semibold mb-4">Individual Creator Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {validAnalyses.map((analysis) => (
              <Card 
                key={analysis.tikTokData.user.username}
                className="shadow-sm hover:shadow-md transition-all cursor-pointer"
                onClick={() => setSelectedCreatorIndex(analyses.indexOf(analysis))}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <img 
                      src={analysis.tikTokData.user.profileImageUrl} 
                      alt={analysis.tikTokData.user.displayName}
                      className="w-12 h-12 rounded-full"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold truncate">@{analysis.tikTokData.user.username}</h4>
                      <p className="text-sm text-muted-foreground truncate">
                        {formatNumber(analysis.tikTokData.user.stats.followers)} followers
                      </p>
                    </div>
                    {analysis === bestCreator && (
                      <Crown className="w-5 h-5 text-yellow-500" />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">CPM</span>
                    <span className="font-semibold">${analysis.analytics.cpm.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Avg Views</span>
                    <span className="font-semibold">{formatNumber(analysis.analytics.averageViews)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Virality</span>
                    <span className="font-semibold">{analysis.analytics.viralityRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Consistency</span>
                    <span className={`font-semibold ${
                      analysis.analytics.performanceConsistency === 'High' ? 'text-green-600' :
                      analysis.analytics.performanceConsistency === 'Medium' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {analysis.analytics.performanceConsistency}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Group Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <UsersIcon className="w-5 h-5" />
                Group Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/30 border border-border">
                  <h4 className="font-medium mb-2">Average CPM</h4>
                  <p className="text-2xl font-bold">
                    ${(validAnalyses.reduce((sum, a) => sum + a.analytics.cpm, 0) / validAnalyses.length).toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Range: ${Math.min(...validAnalyses.map(a => a.analytics.cpm)).toFixed(2)} - 
                    ${Math.max(...validAnalyses.map(a => a.analytics.cpm)).toFixed(2)}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30 border border-border">
                  <h4 className="font-medium mb-2">Total Reach</h4>
                  <p className="text-2xl font-bold">
                    {formatNumber(validAnalyses.reduce((sum, a) => sum + a.tikTokData.user.stats.followers, 0))}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Combined follower count
                  </p>
                </div>
              </div>
              
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <h4 className="font-medium mb-2">Recommendations</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  {bestCreator && (
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>
                        Focus budget on @{bestCreator.tikTokData.user.username} for best ROI 
                        (${bestCreator.analytics.cpm.toFixed(2)} CPM)
                      </span>
                    </li>
                  )}
                  {validAnalyses.some(a => a.analytics.viralityRate > 20) && (
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>
                        {validAnalyses.filter(a => a.analytics.viralityRate > 20).map(a => `@${a.tikTokData.user.username}`).join(', ')} 
                        {validAnalyses.filter(a => a.analytics.viralityRate > 20).length > 1 ? ' have' : ' has'} high viral potential
                      </span>
                    </li>
                  )}
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>
                      Consider diversifying with {validAnalyses.length} creators for broader reach
                    </span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    );
  };

  const renderIndividualView = () => {
    if (selectedCreatorIndex === null || !analyses[selectedCreatorIndex] || analyses[selectedCreatorIndex].error) {
      return null;
    }

    const analysis = analyses[selectedCreatorIndex];
    
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="space-y-8"
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedCreatorIndex(null)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Comparison
        </Button>

        {/* Import the individual view component here or create a simplified version */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <img 
                  src={analysis.tikTokData.user.profileImageUrl} 
                  alt={analysis.tikTokData.user.displayName}
                  className="w-20 h-20 rounded-full"
                />
                <div>
                  <CardTitle>@{analysis.tikTokData.user.username}</CardTitle>
                  <CardDescription>{analysis.tikTokData.user.displayName}</CardDescription>
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatNumber(analysis.tikTokData.user.stats.followers)} followers
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-muted/30">
                  <p className="text-sm text-muted-foreground">CPM</p>
                  <p className="text-2xl font-bold">${analysis.analytics.cpm.toFixed(2)}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30">
                  <p className="text-sm text-muted-foreground">Avg Views</p>
                  <p className="text-2xl font-bold">{formatNumber(analysis.analytics.averageViews)}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30">
                  <p className="text-sm text-muted-foreground">Virality Rate</p>
                  <p className="text-2xl font-bold">{analysis.analytics.viralityRate.toFixed(1)}%</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30">
                  <p className="text-sm text-muted-foreground">Consistency</p>
                  <p className="text-2xl font-bold">{analysis.analytics.performanceConsistency}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      {/* Header with Currency Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Creator Comparison Tool 🔥</h2>
          <p className="text-muted-foreground mt-1">Compare multiple creators to find the best partnership deals</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <DollarSign className="w-4 h-4 mr-2" />
              {CURRENCY_RATES[currentCurrency]?.symbol} {currentCurrency}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {Object.entries(CURRENCY_RATES).map(([code, { symbol, label }]) => (
              <DropdownMenuItem
                key={code}
                onClick={() => updateCurrency(code)}
                className={currentCurrency === code ? 'bg-accent text-accent-foreground' : ''}
              >
                {symbol} {label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {!analyses.length && (
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-medium">Input Details</CardTitle>
            <CardDescription>Add up to 5 TikTok creators to compare</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {urls.map((url, index) => (
                <div key={index} className="flex gap-2">
                  <div className="flex-1">
                    <Label htmlFor={`url-${index}`} className="sr-only">
                      TikTok Profile URL {index + 1}
                    </Label>
                    <Input
                      id={`url-${index}`}
                      type="text"
                      value={url}
                      onChange={(e) => updateUrl(index, e.target.value)}
                      placeholder="https://www.tiktok.com/@username"
                      disabled={loading}
                    />
                  </div>
                  {urls.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeUrlField(index)}
                      disabled={loading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              
              {urls.length < 5 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addUrlField}
                  disabled={loading}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Another Creator
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cost" className="text-sm font-medium">
                  Cost per Video ({CURRENCY_RATES[currentCurrency]?.symbol})
                </Label>
                <Input
                  id="cost"
                  type="number"
                  value={costPerVideo}
                  onChange={(e) => setCostPerVideo(e.target.value)}
                  placeholder="e.g., 500"
                  disabled={loading}
                  step="0.01"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="videos" className="text-sm font-medium">
                  Videos to Analyze (per creator)
                </Label>
                <Input
                  id="videos"
                  type="number"
                  value={videosToAnalyze}
                  onChange={(e) => setVideosToAnalyze(e.target.value)}
                  placeholder="10"
                  disabled={loading}
                  min="1"
                  max="50"
                />
              </div>
            </div>

            <Button 
              onClick={handleAnalyze} 
              disabled={loading || urls.every(u => !u.trim()) || !costPerVideo}
              className="w-full font-medium"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Analyzing Creators...
                </div>
              ) : (
                <>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Compare Creators 🔥
                </>
              )}
            </Button>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg flex items-center gap-2"
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      <AnimatePresence mode="wait">
        {analyses.length > 0 && (
          selectedCreatorIndex === null ? renderComparisonView() : renderIndividualView()
        )}
      </AnimatePresence>
    </motion.div>
  );
}