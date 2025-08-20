# TikTok Data Parser Guide

This guide explains how to parse TikTok user and video data from Jina's HTML response.

## Overview

The TikTok parser extracts the following information from Jina's parsed HTML:
- User profile information (username, display name, bio, profile image)
- User statistics (followers, total likes)
- Video information (title, views, thumbnail, URL)

## Installation

First, ensure you have the required dependencies:

```bash
npm install cheerio
```

## Usage

### Basic Usage

```typescript
import { parseTikTokDataFromJina, formatTikTokData } from './utils/tiktokParser';
import fs from 'fs';

// Read the Jina response
const jinaResponse = fs.readFileSync('response.html', 'utf-8');

// Parse and format the data
const tikTokData = parseTikTokDataFromJina(jinaResponse);
const formattedData = formatTikTokData(tikTokData);

console.log(formattedData);
```

### Working with the Parsed Data

The formatted data has the following structure:

```typescript
{
  user: {
    username: string,
    displayName: string,
    profileImageUrl: string,
    description: string,
    stats: {
      followers: number,
      totalLikes: number
    }
  },
  videos: Array<{
    id: string,
    title: string,
    url: string,
    thumbnailUrl: string,
    stats: {
      views: number,
      likes: number,
      comments: number,
      shares: number
    }
  }>
}
```

### Example: Analyzing Video Performance

```typescript
// Get top performing videos
const topVideos = formattedData.videos
  .sort((a, b) => b.stats.views - a.stats.views)
  .slice(0, 10);

// Calculate average views
const avgViews = formattedData.videos.reduce(
  (sum, video) => sum + video.stats.views, 0
) / formattedData.videos.length;

// Find viral videos (>1M views)
const viralVideos = formattedData.videos.filter(
  video => video.stats.views > 1000000
);
```

## API Reference

### `parseTikTokDataFromJina(jinaResponse: string): TikTokData`

Parses TikTok data from a Jina SSE response string.

**Parameters:**
- `jinaResponse`: The raw SSE response from Jina containing HTML data

**Returns:** Raw TikTok data object

### `extractHtmlFromSSE(sseContent: string): string`

Extracts HTML content from Server-Sent Events (SSE) response.

**Parameters:**
- `sseContent`: Raw SSE response string

**Returns:** Extracted HTML string

### `extractTikTokData(html: string): TikTokData`

Extracts TikTok user and video data from HTML content.

**Parameters:**
- `html`: HTML content to parse

**Returns:** Raw TikTok data object

### `formatTikTokData(data: TikTokData): any`

Formats the extracted data into a clean JSON structure.

**Parameters:**
- `data`: Raw TikTok data object

**Returns:** Formatted data object with user and videos

## How It Works

1. **SSE Parsing**: The parser first extracts HTML from Jina's Server-Sent Events response
2. **HTML Parsing**: Uses Cheerio to parse the HTML and extract data from:
   - Meta tags
   - Data attributes (data-e2e)
   - Embedded JSON scripts
   - DOM elements with specific classes
3. **Deduplication**: Automatically removes duplicate videos by ID (TikTok's HTML often contains duplicates for different viewport sizes)
4. **Data Formatting**: Converts raw data into a clean, structured format

## Handling Different Response Formats

The parser is designed to be resilient and tries multiple strategies to extract data:

1. Looks for specific data-e2e attributes (most reliable)
2. Searches for class names containing keywords
3. Extracts data from embedded JSON scripts
4. Falls back to meta tags and page title

## Error Handling

```typescript
try {
  const data = parseTikTokDataFromJina(jinaResponse);
  // Process data
} catch (error) {
  if (error.message === 'No HTML content found in SSE response') {
    console.error('Invalid Jina response format');
  } else {
    console.error('Parsing error:', error);
  }
}
```

## Tips for Best Results

1. **Fresh Data**: TikTok's HTML structure may change, so ensure you're using recent Jina responses
2. **Complete Response**: Make sure the Jina response is complete and not truncated
3. **Rate Limiting**: Be mindful of rate limits when scraping multiple profiles
4. **Data Validation**: Always validate the extracted data before using it

## Example Script

Run the example script to see the parser in action:

```bash
npx tsx src/examples/tiktok-scraper-example.ts response.html
```

This will parse the data and save it to `tiktok-profile-data.json`.