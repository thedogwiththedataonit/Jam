'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { scrapeWithJina } from '@/app/actions';
import CountUp from 'react-countup';
import { Calculator, DollarSign, TrendingUp, BarChart3, Target, Zap, Users, AlertCircle, Eye } from 'lucide-react';

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

export default function CPMAnalyzer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCurrency = searchParams.get('currency') || 'USD';
  
  const [url, setUrl] = useState('');
  const [costPerVideo, setCostPerVideo] = useState('');
  const [videosToAnalyze, setVideosToAnalyze] = useState('10');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tikTokData, setTikTokData] = useState<TikTokData | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  // Update URL when currency changes
  const updateCurrency = (newCurrency: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('currency', newCurrency);
    router.push(`?${params.toString()}`);
  };

  const calculateAnalytics = (data: TikTokData, cost: number, videoCount: number, currency: string): AnalyticsData => {
    const videosToAnalyze = data.videos.slice(0, videoCount);
    
    // Convert cost to USD for CPM calculation
    const costInUSD = cost * (CURRENCY_RATES[currency]?.rate || 1);
    
    // Calculate total and average views
    const totalViews = videosToAnalyze.reduce((sum, video) => sum + video.stats.views, 0);
    const averageViews = totalViews / videosToAnalyze.length;
    
    // Calculate CPM (Cost Per Mille - cost per thousand views) in USD
    // Formula: CPM = (Cost per video / Average views per video) * 1000
    const cpm = (costInUSD / averageViews) * 1000;
    
    // Log calculation details for verification
    console.log('=== CPM CALCULATION ===');
    console.log(`Videos analyzed: ${videosToAnalyze.length}`);
    console.log(`Total views: ${totalViews.toLocaleString()}`);
    console.log(`Average views per video: ${Math.round(averageViews).toLocaleString()}`);
    console.log(`Cost per video: ${CURRENCY_RATES[currency]?.symbol || '$'}${cost} (${currency})`);
    console.log(`Cost per video in USD: $${costInUSD.toFixed(2)}`);
    console.log(`CPM (Cost per 1,000 views in USD): $${cpm.toFixed(2)}`);
    
    // Calculate standard deviation for views
    const viewsArray = videosToAnalyze.map(v => v.stats.views);
    const viewsMean = viewsArray.reduce((a, b) => a + b, 0) / viewsArray.length;
    const viewsVariance = viewsArray.reduce((sum, view) => sum + Math.pow(view - viewsMean, 2), 0) / viewsArray.length;
    const viewsStandardDeviation = Math.sqrt(viewsVariance);
    
    // Define virality as videos with views > mean + 2 * standard deviation
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

  const handleAnalyze = async () => {
    if (!url || !costPerVideo) {
      setError('Please enter both TikTok URL and cost per video');
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
      
      // Log the parsed JSON data
      console.log('=== PARSED TIKTOK DATA ===');
      console.log(JSON.stringify(data, null, 2));
      console.log('User:', data.user);
      console.log('Total Videos Found:', data.videos.length);
      console.log('Videos:', data.videos);
      
      setTikTokData(data);

      // Calculate analytics
              const analyticsData = calculateAnalytics(data, cost, videoCount, currentCurrency);
      setAnalytics(analyticsData);

    } catch (err) {
      console.error('Error analyzing TikTok data:', err);
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

  const prepareChartData = () => {
    if (!tikTokData) return [];
    
    const videoCount = parseInt(videosToAnalyze);
    return tikTokData.videos.slice(0, videoCount).map((video, index) => ({
      index: index + 1,
      views: video.stats.views,
      videoTitle: video.title || `Video ${index + 1}`
    }));
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
          <h2 className="text-2xl font-bold text-foreground">Partnership Vibe Check 🔥</h2>
          <p className="text-muted-foreground mt-1">Find out if this creator got aura or if they're cooked</p>
        </div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
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
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-medium">
              Input Details
            </CardTitle>
            <CardDescription>
              Drop the deets and let's see if this creator is bussin' or cooked
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                    <Label htmlFor="url" className="text-sm font-medium">
                      TikTok Profile URL
                    </Label>
                    <Input
                      id="url"
                      type="text"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://www.tiktok.com/@username"
                      disabled={loading}
                      className="h-10"
                    />
                  </div>
              
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
                      className="h-10"
                    />
                  </div>
              
                                <div className="space-y-2">
                    <Label htmlFor="videos" className="text-sm font-medium">
                      Videos to Analyze
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
                      className="h-10"
                    />
                  </div>
            </div>

            <Button 
              onClick={handleAnalyze} 
              disabled={loading || !url || !costPerVideo}
              className="w-full font-medium"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Analyzing Profile...
                </div>
              ) : (
                <>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Check the Vibes 🔥
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
      </motion.div>

      <AnimatePresence>
        {analytics && tikTokData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-8"
          >
            {/* Key Metrics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  title: 'Total Views',
                  value: analytics.totalViews,
                  subtitle: `last ${analytics.totalVideos} videos`,
                  icon: BarChart3,
                  color: 'purple',
                  delay: 0.1
                },
                {
                  title: 'Average Views',
                  value: analytics.averageViews,
                  subtitle: 'per video',
                  icon: TrendingUp,
                  color: 'blue',
                  delay: 0.2
                },
                {
                  title: 'CPM (USD)',
                  value: analytics.cpm,
                  subtitle: 'per 1,000 views',
                  icon: DollarSign,
                  color: 'green',
                  prefix: '$',
                  decimals: 2,
                  delay: 0.3,
                  extra: currentCurrency !== 'USD' ? (
                    <p className="text-xs text-blue-600 mt-1">
                      Converted from {CURRENCY_RATES[currentCurrency]?.symbol}{costPerVideo}
                    </p>
                  ) : null
                },
                {
                  title: 'Virality Rate',
                  value: analytics.viralityRate,
                  subtitle: `${analytics.viralVideos} of ${analytics.totalVideos} videos`,
                  icon: Zap,
                  color: 'amber',
                  suffix: '%',
                  decimals: 1,
                  delay: 0.4
                }
              ].map((metric, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: metric.delay }}
                >
                  <Card className="shadow-sm hover:shadow-md transition-all duration-300 group">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          {metric.title}
                        </CardTitle>
                                                  <div className="p-2 rounded-md bg-primary/10 transition-colors duration-300 group-hover:bg-primary/20">
                          <metric.icon className="w-5 h-5 text-primary" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold tracking-tight">
                        {metric.prefix}
                        <CountUp 
                          end={metric.value} 
                          duration={2} 
                          separator="," 
                          decimals={metric.decimals || 0}
                        />
                        {metric.suffix}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">{metric.subtitle}</p>
                      {metric.extra}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
              </div>
            </motion.div>

            {/* Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="col-span-full"
            >
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-medium">
                    Video Performance Analysis
                  </CardTitle>
                  <CardDescription>Views distribution for the last {videosToAnalyze} videos</CardDescription>
                </CardHeader>
                <CardContent className="p-0 pb-6">
                  <ChartContainer className="h-[350px] w-full px-6" config={{}}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={prepareChartData()}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                        <XAxis 
                          dataKey="index" 
                          stroke="var(--muted-foreground)" 
                          fontSize={12}
                          tickLine={false}
                          axisLine={{ stroke: 'var(--border)' }}
                        />
                        <YAxis 
                          tickFormatter={(value) => formatNumber(value)} 
                          stroke="var(--muted-foreground)" 
                          fontSize={12}
                          tickLine={false}
                          axisLine={{ stroke: 'var(--border)' }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'var(--card)', 
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius)',
                            color: 'var(--card-foreground)',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                          }}
                          cursor={{ fill: 'var(--primary)', opacity: 0.1 }}
                        />
                        <Bar 
                          dataKey="views" 
                          fill="var(--primary)" 
                          name="Views" 
                          radius={[6, 6, 0, 0]}
                          animationDuration={1000}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </motion.div>

            {/* Insights */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-medium">
                    The Tea ☕
                  </CardTitle>
                  <CardDescription>No cap assessment of this creator's vibe</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-muted/30 border border-border">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Eye className="w-4 h-4 text-primary" />
                        Views Analysis
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Analyzed <span className="font-semibold text-foreground">{analytics.totalVideos}</span> videos with{' '}
                        <span className="font-semibold text-foreground">{formatNumber(analytics.totalViews)}</span> total views.
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Average: <span className="font-semibold text-foreground">{formatNumber(analytics.averageViews)}</span> views per video
                        {analytics.averageViews > 100000 && ' - Absolute gooner vibes 💪'}
                        {analytics.averageViews > 50000 && analytics.averageViews <= 100000 && ' - Jet 2 holiday energy ✈️'}
                        {analytics.averageViews <= 50000 && ' - Views looking kinda chopped ngl 🤔'}
                      </p>
                    </div>

                    <div className="p-4 rounded-lg bg-muted/30 border border-border">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        Performance Consistency
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-semibold text-foreground">{analytics.performanceConsistency}</span> consistency
                        {analytics.performanceConsistency === 'High' && ' - This creator got aura 🔥'}
                        {analytics.performanceConsistency === 'Medium' && ' - Kinda skibidi toilet tbh 🚽'}
                        {analytics.performanceConsistency === 'Low' && ' - Consistency is chopped fr 💀'}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Std Dev: {formatNumber(analytics.viewsStandardDeviation)} views
                      </p>
                    </div>
                  </div>

                  <div className="p-5 rounded-lg bg-primary/5 border border-primary/20">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-primary" />
                      Cost Efficiency Analysis
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">CPM Rating:</span>
                        <span className={`
                          px-3 py-1.5 rounded-md text-xs font-semibold
                          ${analytics.cpm < 5 ? 'bg-primary text-primary-foreground' : ''}
                          ${analytics.cpm >= 5 && analytics.cpm < 15 ? 'bg-secondary text-secondary-foreground' : ''}
                          ${analytics.cpm >= 15 ? 'bg-destructive text-destructive-foreground' : ''}
                        `}>
                          {analytics.cpm < 5 && '🔥 Absolutely got aura'}
                          {analytics.cpm >= 5 && analytics.cpm < 15 && '✈️ Jet 2 holiday vibes'}
                          {analytics.cpm >= 15 && '💀 CPM is cooked'}
                        </span>
                      </div>
                      <div className="bg-card p-3 rounded-md border border-border mt-3">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Calculation breakdown:</p>
                        <p className="text-xs font-mono text-muted-foreground leading-relaxed">
                          {currentCurrency !== 'USD' ? (
                            <>{CURRENCY_RATES[currentCurrency]?.symbol}{parseFloat(costPerVideo).toFixed(2)} → ${(parseFloat(costPerVideo) * (CURRENCY_RATES[currentCurrency]?.rate || 1)).toFixed(2)} ÷ {formatNumber(analytics.averageViews)} × 1,000 = <span className="font-semibold text-foreground">${analytics.cpm.toFixed(2)}</span></>
                          ) : (
                            <>${parseFloat(costPerVideo).toFixed(2)} ÷ {formatNumber(analytics.averageViews)} × 1,000 = <span className="font-semibold text-foreground">${analytics.cpm.toFixed(2)}</span></>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="p-4 rounded-lg bg-muted/30 border border-border">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-primary" />
                        Viral Potential
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {analytics.viralityRate > 20 && '🚀 Major aura energy - viral machine!'}
                        {analytics.viralityRate > 10 && analytics.viralityRate <= 20 && '✈️ Jet 2 holiday potential'}
                        {analytics.viralityRate <= 10 && '🚽 Skibidi toilet performance'}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {analytics.viralVideos}/{analytics.totalVideos} videos hit different
                      </p>
                    </div>

                    <div className="p-4 rounded-lg bg-muted/30 border border-border">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Target className="w-4 h-4 text-primary" />
                        Recommendations
                      </h4>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {analytics.cpm < 10 && (
                          <li className="flex items-start gap-1">
                            <span className="text-primary mt-0.5">•</span>
                            <span>ROI got mad aura - run it back!</span>
                          </li>
                        )}
                        {analytics.performanceConsistency === 'Low' && (
                          <li className="flex items-start gap-1">
                            <span className="text-primary mt-0.5">•</span>
                            <span>Performance is chopped - negotiate better</span>
                          </li>
                        )}
                        {analytics.viralityRate > 15 && (
                          <li className="flex items-start gap-1">
                            <span className="text-primary mt-0.5">•</span>
                            <span>Gooner vibes detected - maximize the grind</span>
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>

                  {/* Export Data Button */}
                  <div className="mt-6 pt-6 border-t border-border flex flex-wrap justify-center gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        const exportData = {
                          user: tikTokData.user,
                          videos: tikTokData.videos,
                          analytics: {
                            ...analytics,
                            cpmExplanation: `$${parseFloat(costPerVideo).toFixed(2)} / ${Math.round(analytics.averageViews).toLocaleString()} views * 1000 = $${analytics.cpm.toFixed(2)}`
                          },
                          parameters: {
                            costPerVideo: parseFloat(costPerVideo),
                            currency: currentCurrency,
                            videosAnalyzed: parseInt(videosToAnalyze),
                            analysisDate: new Date().toISOString()
                          }
                        };
                        const dataStr = JSON.stringify(exportData, null, 2);
                        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                        const exportFileDefaultName = `tiktok_cpm_analysis_${tikTokData.user.username}_${new Date().toISOString().split('T')[0]}.json`;
                        
                        const linkElement = document.createElement('a');
                        linkElement.setAttribute('href', dataUri);
                        linkElement.setAttribute('download', exportFileDefaultName);
                        linkElement.click();
                      }}
                      size="sm"
                      className="font-medium"
                    >
                      <DollarSign className="w-4 h-4 mr-2" />
                      Export Full Analysis
                    </Button>
                    <Button
                      size="sm"
                      className="font-medium"
                      onClick={() => {
                        // Copy insights to clipboard
                        const insights = `
TikTok CPM Analysis - @${tikTokData.user.username}
==========================================

📊 Vibe Check Results:
• Total Views: ${formatNumber(analytics.totalViews)}
• Average Views: ${formatNumber(analytics.averageViews)}
• CPM: $${analytics.cpm.toFixed(2)}
• Virality Rate: ${analytics.viralityRate.toFixed(1)}%

💰 Cost Efficiency: ${analytics.cpm < 5 ? 'This creator got aura fr fr 🔥' : analytics.cpm < 15 ? 'Jet 2 holiday vibes ✈️' : 'Absolutely cooked 💀'}
📈 Performance: ${analytics.performanceConsistency} ${analytics.performanceConsistency === 'High' ? '(got aura)' : analytics.performanceConsistency === 'Medium' ? '(skibidi toilet)' : '(chopped)'}
🚀 Viral Potential: ${analytics.viralityRate > 20 ? 'Major aura energy' : analytics.viralityRate > 10 ? 'Jet 2 holiday potential' : 'Skibidi toilet performance'}

Generated on ${new Date().toLocaleDateString()}
`;
                        navigator.clipboard.writeText(insights);
                        // Simple toast notification
                        const toast = document.createElement('div');
                        toast.className = 'fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-md shadow-lg z-50 text-sm font-medium';
                        toast.textContent = '✓ Tea has been spilled to clipboard';
                        document.body.appendChild(toast);
                        setTimeout(() => {
                          toast.style.transition = 'opacity 0.3s';
                          toast.style.opacity = '0';
                          setTimeout(() => toast.remove(), 300);
                        }, 2700);
                      }}
                    >
                      Copy the Tea 🍵
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}