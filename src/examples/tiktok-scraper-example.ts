import fs from 'fs';
import { parseTikTokDataFromJina, formatTikTokData } from '../utils/tiktokParser';

/**
 * Example: Parse TikTok data from a Jina response file
 */
async function parseFromFile(filePath: string) {
  try {
    // Read the Jina SSE response
    const jinaResponse = fs.readFileSync(filePath, 'utf-8');
    
    // Parse the TikTok data
    const tikTokData = parseTikTokDataFromJina(jinaResponse);
    
    // Format the data
    const formattedData = formatTikTokData(tikTokData);
    
    // Display results
    console.log('TikTok User Profile:');
    console.log('===================');
    console.log(`Username: @${formattedData.user.username}`);
    console.log(`Display Name: ${formattedData.user.displayName}`);
    console.log(`Bio: ${formattedData.user.description}`);
    console.log(`Followers: ${formattedData.user.stats.followers.toLocaleString()}`);
    console.log(`Total Likes: ${formattedData.user.stats.totalLikes.toLocaleString()}`);
    console.log(`Total Videos: ${formattedData.videos.length}`);
    
    // Show top videos by views
    console.log('\nTop 10 Videos by Views:');
    console.log('=======================');
    
    const topVideos = [...formattedData.videos]
      .sort((a, b) => b.stats.views - a.stats.views)
      .slice(0, 10);
    
    topVideos.forEach((video, index) => {
      console.log(`\n${index + 1}. ${video.title}`);
      console.log(`   Views: ${video.stats.views.toLocaleString()}`);
      console.log(`   URL: ${video.url}`);
    });
    
    // Save to file
    const outputPath = 'tiktok-profile-data.json';
    fs.writeFileSync(outputPath, JSON.stringify(formattedData, null, 2));
    console.log(`\n✅ Full data saved to ${outputPath}`);
    
    return formattedData;
  } catch (error) {
    console.error('Error parsing TikTok data:', error);
    throw error;
  }
}

/**
 * Example: Parse TikTok data from a string response
 */
function parseFromString(jinaResponse: string) {
  try {
    const tikTokData = parseTikTokDataFromJina(jinaResponse);
    return formatTikTokData(tikTokData);
  } catch (error) {
    console.error('Error parsing TikTok data:', error);
    throw error;
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  const filePath = process.argv[2] || 'response.html';
  
  console.log(`Parsing TikTok data from: ${filePath}\n`);
  
  parseFromFile(filePath)
    .then(() => console.log('\n✨ Done!'))
    .catch(console.error);
}

export { parseFromFile, parseFromString };