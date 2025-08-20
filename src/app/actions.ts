'use server';

// Server action for Jina API scraping
export async function scrapeWithJina(url: string) {
    const jina_api_key = process.env.JINA_API_KEY;
    if (!jina_api_key) {
        throw new Error('JINA_API_KEY is not set');
    }
  try {
    const response = await fetch(`https://r.jina.ai/${url}`, {
      headers: {
        'Authorization': `Bearer ${jina_api_key}`,
        //"X-Respond-With": "readerlm-v2"
        'Accept': 'text/event-stream',
        'X-Return-Format': 'html'
      }
    });

    if (!response.ok) {
      throw new Error(`Jina API error: ${response.status}`);
    }

    const html = await response.text();
    console.log('=== JINA RESPONSE ===');
    console.log('Response length:', html.length);
    console.log('First 500 chars:', html.substring(0, 500));
    console.log('Full response:', html);
    return { success: true, data: html };
  } catch (error) {
    console.error('Jina scraping error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Server action for TikTok API simulation
export async function fetchTikTokAPI(profileUrl: string) {
  try {
    // Extract username from URL
    const match = profileUrl.match(/tiktok\.com\/@([^/?]+)/);
    if (!match) {
      throw new Error('Invalid TikTok profile URL');
    }
    const username = match[1];

    // Build the API URL with all necessary parameters
    const apiUrl = new URL('https://www.tiktok.com/api/post/item_list/');
    
    // Add all the query parameters
    const params = {
      WebIdLastTime: '1755653297',
      aid: '1988',
      app_language: 'en',
      app_name: 'tiktok_web',
      browser_language: 'en-US',
      browser_name: 'Mozilla',
      browser_online: 'true',
      browser_platform: 'MacIntel',
      browser_version: '5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
      channel: 'tiktok_web',
      cookie_enabled: 'true',
      count: '35',
      coverFormat: '2',
      cursor: '0',
      data_collection_enabled: 'false',
      device_id: '7540473456769418765',
      device_platform: 'web_pc',
      focus_state: 'true',
      history_len: '5',
      is_fullscreen: 'false',
      is_page_visible: 'true',
      language: 'en',
      odinId: '7540474016768345143',
      os: 'mac',
      priority_region: '',
      referer: '',
      region: 'US',
      screen_height: '1080',
      screen_width: '2560',
      secUid: 'MS4wLjABAAAAYcKXG8BIb2oZWPT9chrvJGCsHbw5TOzWaBcSuVNMVggdFAQLCgmc2L7AT3Mr3fzI',
      tz_name: 'America/New_York',
      user_is_login: 'false',
      webcast_language: 'en',
      msToken: 'nVCDA1nkuAGRsQm2flgIqKjwegS8jN6pFas8X3m_SrUU8kklwgb0s-Cc5rVc1hV_NHXvrvIunZvizS_jjvXGKYEEKPJ8H-5U7pZc6sELPYLm-smGJ_QKcin7E-gaIBb_XBC-5YD7hmCfoYoSKrnIak4=',
      'X-Bogus': 'DFSzswVOnDJANGYLCJZi0XhGbwrR',
      'X-Gnarly': 'MF4l6hrcc6irJG8mNIQdtdKhCJlPDynU3z0u3Zv7eOlKEBy5Ftwc-1vDocmaKqDu1o7h2pX58kFxmPLz3mlS8IlCV1Lwdr4l9JfP7EQvuwkG29SHBPp-WsNlJoi1h6dI-UWtc/QSuKAXucLOVWhV6iJ7gNO1FGD-S7VoXu0TdmInCZAniAE5UDX6JXVEauzyfVQrLuPUrVuVlL-v0AJ7qDnnCXMk-k/Gz9ZdnkSV88-qM6wrbnjYkkaUYLlDjsRhA189qXo8jSlRURiyfj7NFwFW3hEZ5RUjwh4SIgvQPT9w'
    };

    Object.entries(params).forEach(([key, value]) => {
      apiUrl.searchParams.append(key, value);
    });

    // Note: You'll need to get the proper secUid for each user
    // This is a placeholder - in reality, you'd need to extract this from the profile page
    console.log('Fetching from:', apiUrl.toString());

    const response = await fetch(apiUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.tiktok.com/',
        'Origin': 'https://www.tiktok.com'
      }
    });

    if (!response.ok) {
      throw new Error(`TikTok API error: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('TikTok API error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}