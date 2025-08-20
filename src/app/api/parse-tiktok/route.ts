import { NextRequest, NextResponse } from 'next/server';
import { parseTikTokDataFromJina, formatTikTokData } from '@/utils/tiktokParser';

export async function POST(request: NextRequest) {
  try {
    const { jinaResponse } = await request.json();
    
    if (!jinaResponse) {
      return NextResponse.json(
        { error: 'No Jina response provided' },
        { status: 400 }
      );
    }
    
    // Parse the TikTok data
    const tikTokData = parseTikTokDataFromJina(jinaResponse);
    const formattedData = formatTikTokData(tikTokData);
    
    return NextResponse.json({
      success: true,
      data: formattedData
    });
  } catch (error) {
    console.error('Error parsing TikTok data:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to parse TikTok data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}