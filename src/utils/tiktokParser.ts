import * as cheerio from 'cheerio';

export interface TikTokUser {
  username: string;
  displayName: string;
  userImage: string;
  followers: number;
  totalLikes?: number;
  description?: string;
}

export interface TikTokVideo {
  id: string;
  title: string;
  views: number;
  imageUrl: string;
  url: string;
}

export interface TikTokData {
  user: TikTokUser;
  videos: TikTokVideo[];
}

export interface FormattedTikTokDataUserStats {
  followers: number;
  totalLikes: number;
}

export interface FormattedTikTokDataUser {
  username: string;
  displayName: string;
  profileImageUrl: string;
  description: string;
  stats: FormattedTikTokDataUserStats;
}

export interface FormattedTikTokDataVideoStats {
  views: number;
}

export interface FormattedTikTokDataVideo {
  id: string;
  title: string;
  url: string;
  thumbnailUrl: string;
  stats: FormattedTikTokDataVideoStats;
}

export interface FormattedTikTokData {
  user: FormattedTikTokDataUser;
  videos: FormattedTikTokDataVideo[];
}

/**
 * Parses SSE (Server-Sent Events) response from Jina to extract HTML content
 */
export function extractHtmlFromSSE(sseContent: string): string {
  const lines = sseContent.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      try {
        const jsonData = JSON.parse(line.substring(6));
        if (jsonData.html) {
          return jsonData.html;
        }
      } catch (e) {
        // Skip invalid JSON lines
        continue;
      }
    }
  }
  
  throw new Error('No HTML content found in SSE response');
}

/**
 * Formats numbers from TikTok format (e.g., "1.2M", "523K") to numeric values
 */
function parseFormattedNumber(text: string): number {
  if (!text) return 0;
  
  const cleanText = text.trim().toUpperCase();
  
  // Handle millions
  if (cleanText.includes('M')) {
    return parseFloat(cleanText.replace('M', '')) * 1000000;
  }
  
  // Handle thousands
  if (cleanText.includes('K')) {
    return parseFloat(cleanText.replace('K', '')) * 1000;
  }
  
  // Handle billions
  if (cleanText.includes('B')) {
    return parseFloat(cleanText.replace('B', '')) * 1000000000;
  }
  
  // Try to parse as regular number
  const parsed = parseFloat(cleanText.replace(/,/g, ''));
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Extracts TikTok user and video data from HTML content
 */
export function extractTikTokData(html: string): TikTokData {
  console.log('=== EXTRACTING TIKTOK DATA FROM HTML ===');
  const $ = cheerio.load(html);
  
  // Extract user data
  const user: TikTokUser = {
    username: '',
    displayName: '',
    userImage: '',
    followers: 0,
    totalLikes: 0
  };
  
  // Try to find username from various possible locations
  // Check title first
  const title = $('title').text();
  const usernameMatch = title.match(/@(\w+)/);
  if (usernameMatch) {
    user.username = usernameMatch[1];
  }
  
  // Try to find user info in meta tags or specific divs
  $('meta').each((_, elem) => {
    const property = $(elem).attr('property');
    const content = $(elem).attr('content');
    
    if (property === 'og:image' && !user.userImage) {
      user.userImage = content || '';
    }
  });
  
  // Look for user stats - these are typically in specific data attributes
  // First try to find the specific elements with data-e2e attributes
  const followersElement = $('[data-e2e="followers-count"]');
  if (followersElement.length) {
    user.followers = parseFormattedNumber(followersElement.text());
  }
  const likesElement = $('[data-e2e="likes-count"]');
  if (likesElement.length) {
    user.totalLikes = parseFormattedNumber(likesElement.text());
  }
  

  
  // If not found, search more broadly
  if (!user.followers) {
    $('[data-e2e*="followers"], [class*="follower"], [aria-label*="Followers"]').each((_, elem) => {
      const text = $(elem).text();
      const match = text.match(/(\d+\.?\d*[KMB]?)\s*(Followers?|followers?)/i);
      if (match) {
        user.followers = parseFormattedNumber(match[1]);
      }
    });
  }
  if (!user.totalLikes) {
    $('[data-e2e*="likes"], [class*="like"], [aria-label*="Likes"]').each((_, elem) => {
      const text = $(elem).text();
      const match = text.match(/(\d+\.?\d*[KMB]?)\s*(Likes?|likes?)/i);
      if (match) {
        user.totalLikes = parseFormattedNumber(match[1]);
      }
    });
  }
  

  
  // Try to extract data from embedded JSON
  const scriptTags = $('script[type="application/json"], script:contains("followerCount"), script:contains("heartCount"), script:contains("likeCount")');
  scriptTags.each((_, elem) => {
    const scriptContent = $(elem).html();
    if (scriptContent && (scriptContent.includes('followerCount') || scriptContent.includes('heartCount') || scriptContent.includes('likeCount'))) {
      try {
        // Try to parse as JSON directly
        const jsonData = JSON.parse(scriptContent);
        if (jsonData.stats) {
          user.followers = jsonData.stats.followerCount || user.followers;
          user.totalLikes = jsonData.stats.heartCount || jsonData.stats.likeCount || user.totalLikes;
        }
      } catch (e) {
        // Try to extract JSON from within the script
        const jsonMatch = scriptContent.match(/"stats":\s*({[^}]+})/);
        if (jsonMatch) {
          try {
            const stats = JSON.parse(jsonMatch[1]);
            user.followers = stats.followerCount || user.followers;
            user.totalLikes = stats.heartCount || stats.likeCount || user.totalLikes;
          } catch (e2) {
            // Ignore parsing errors
          }
        }
      }
    }
  });
  
  // Extract videos
  const videos: TikTokVideo[] = [];
  let pinnedVideosSkipped = 0;
  
  // Look for video containers - TikTok often uses data attributes
  $('[data-e2e="user-post-item"], [class*="video-feed-item"], a[href*="/video/"]').each((_, elem) => {
    const $elem = $(elem);
    
    // Check if this is a pinned video
    const isPinned = $elem.find('[class*="pinned"], [data-e2e*="pinned"], svg[data-e2e="pin-icon"]').length > 0 ||
                     $elem.text().toLowerCase().includes('pinned') ||
                     $elem.find('[aria-label*="Pinned"]').length > 0;
    
    if (isPinned) {
      console.log('Skipping pinned video');
      pinnedVideosSkipped++;
      return; // Skip this video
    }
    
    // Extract video ID from href
    const href = $elem.attr('href') || $elem.find('a').attr('href');
    const videoIdMatch = href?.match(/\/video\/(\d+)/);
    
    if (videoIdMatch) {
      const video: TikTokVideo = {
        id: videoIdMatch[1],
        title: '',
        views: 0,
        imageUrl: '',
        url: href?.startsWith('http') ? href : `https://www.tiktok.com${href}`
      };
      
      // Find image within the video element
      const img = $elem.find('img').first();
      if (img.length) {
        video.imageUrl = img.attr('src') || '';
        video.title = img.attr('alt') || '';
      }
      
      // Look for view count
      $elem.find('[class*="view"], [data-e2e*="view"], strong').each((_, viewElem) => {
        const text = $(viewElem).text();
        const viewMatch = text.match(/(\d+\.?\d*[KMB]?)/);
        if (viewMatch) {
          const views = parseFormattedNumber(viewMatch[1]);
          if (views > video.views) {
            video.views = views;
          }
        }
      });
      
      videos.push(video);
    }
  });
  
  // If we didn't find videos with the first approach, try alternative selectors
  if (videos.length === 0) {
    // Look for divs that contain video thumbnails
    $('div[class*="DivWrapper"], div[class*="video"], div[class*="item"]').each((_, elem) => {
      const $elem = $(elem);
      
      // Check if this is a pinned video
      const isPinned = $elem.find('[class*="pinned"], [data-e2e*="pinned"], svg[data-e2e="pin-icon"]').length > 0 ||
                       $elem.text().toLowerCase().includes('pinned') ||
                       $elem.find('[aria-label*="Pinned"]').length > 0;
      
      if (isPinned) {
        console.log('Skipping pinned video (alternative selector)');
        pinnedVideosSkipped++;
        return; // Skip this video
      }
      
      const link = $elem.find('a[href*="/video/"]').first();
      
      if (link.length) {
        const href = link.attr('href');
        const videoIdMatch = href?.match(/\/video\/(\d+)/);
        
        if (videoIdMatch) {
          const video: TikTokVideo = {
            id: videoIdMatch[1],
            title: '',
            views: 0,
            imageUrl: '',
            url: href?.startsWith('http') ? href : `https://www.tiktok.com${href}`
          };
          
          // Find image
          const img = $elem.find('img').first();
          if (img.length) {
            video.imageUrl = img.attr('src') || '';
            video.title = img.attr('alt') || '';
          }
          
          // Find views - look for strong tags or specific classes
          $elem.find('strong').each((_, strong) => {
            const text = $(strong).text();
            if (text.match(/\d+\.?\d*[KMB]?/)) {
              video.views = parseFormattedNumber(text);
            }
          });
          
          videos.push(video);
        }
      }
    });
  }
  
  // Try to extract more user info from the page if we're missing data
  if (!user.displayName || !user.username) {
    // Look for h1, h2, or specific user name elements
    $('h1, h2, [data-e2e*="user-title"], [data-e2e*="user-subtitle"]').each((_, elem) => {
      const text = $(elem).text().trim();
      if (text) {
        if (!user.displayName && !text.startsWith('@')) {
          user.displayName = text;
        }
        if (!user.username && text.startsWith('@')) {
          user.username = text.substring(1);
        }
      }
    });
  }
  
  // Extract user avatar if not found in meta tags
  if (!user.userImage) {
    const avatar = $('img[class*="avatar"], img[data-e2e*="avatar"], span[class*="avatar"] img').first();
    if (avatar.length) {
      user.userImage = avatar.attr('src') || '';
    }
  }
  
  // Extract user description/bio
  const bioElement = $('[data-e2e="user-bio"], h2[data-e2e="user-subtitle"], [class*="user-desc"]').first();
  if (bioElement.length) {
    user.description = bioElement.text().trim();
  }
  
  // Also check meta description for bio
  if (!user.description) {
    const metaDesc = $('meta[name="description"]').attr('content');
    if (metaDesc) {
      // Extract bio from meta description (usually after "Followers. ")
      const bioMatch = metaDesc.match(/Followers\.\s*([^.]+)/);
      if (bioMatch) {
        user.description = bioMatch[1].trim();
      }
    }
  }
  
  // Deduplicate videos by ID
  // TikTok's HTML often contains duplicate video elements (e.g., for different viewport sizes or lazy loading)
  // We use a Map to keep only unique videos based on their ID
  const uniqueVideos = Array.from(
    new Map(videos.map(video => [video.id, video])).values()
  );
  
  console.log(`Found ${uniqueVideos.length} non-pinned videos after deduplication (${pinnedVideosSkipped} pinned videos skipped)`);
  
  return { user, videos: uniqueVideos };
}

/**
 * Main function to parse TikTok data from Jina response
 */
export function parseTikTokDataFromJina(jinaResponse: string): TikTokData {
  console.log('=== PARSING TIKTOK DATA FROM JINA ===');
  console.log('Jina Response Length:', jinaResponse.length);
  
  // First extract HTML from SSE response
  const html = extractHtmlFromSSE(jinaResponse);
  console.log('Extracted HTML Length:', html.length);
  
  // Then extract TikTok data from HTML
  const data = extractTikTokData(html);
  console.log('Extracted Data:', {
    username: data.user.username,
    displayName: data.user.displayName,
    followers: data.user.followers,
    videosFound: data.videos.length,
    note: 'Pinned videos excluded'
  });
  
  return data;
}

/**
 * Formats the extracted data into a clean JSON structure
 */
export function formatTikTokData(data: TikTokData): FormattedTikTokData {
  return {
    user: {
      username: data.user.username,
      displayName: data.user.displayName || data.user.username,
      profileImageUrl: data.user.userImage,
      description: data.user.description || '',
      stats: {
        followers: data.user.followers,
        totalLikes: data.user.totalLikes || 0
      }
    },
    videos: data.videos.map(video => ({
      id: video.id,
      title: video.title || 'Untitled',
      url: video.url,
      thumbnailUrl: video.imageUrl,
      stats: {
        views: video.views
      }
    }))
  };
}