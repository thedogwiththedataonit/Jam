# TikTok CPM Analyzer Guide

## Overview

The TikTok CPM Analyzer is a tool designed to help evaluate the cost efficiency of TikTok creator partnerships by calculating key metrics and providing insights based on their recent video performance.

## Features

### 1. Core Metrics Calculation

- **Average Views**: Calculates the average number of views across the selected number of recent videos
- **Cost Per Mille (CPM)**: Determines the cost per thousand views based on your input cost per video
- **Virality Rate**: Identifies the percentage of videos that achieve viral status (views > mean + 2 standard deviations)
- **Engagement Rate**: Calculates the total engagement (likes + comments + shares) as a percentage of views

### 2. Visual Analytics

- **Views Chart**: Bar chart showing view counts for each analyzed video
- **Likes Chart**: Line chart displaying likes trend across videos
- Both charts help identify performance patterns and consistency

### 3. Performance Insights

The analyzer provides intelligent insights including:
- **Performance Consistency**: Evaluates how consistent the creator's video performance is
- **Cost Efficiency Analysis**: Compares CPM against industry standards
- **Viral Potential Assessment**: Evaluates the creator's ability to produce viral content
- **Actionable Recommendations**: Provides specific suggestions based on the analysis

## How to Use

1. **Enter TikTok Profile URL**: Paste the full URL of the TikTok creator's profile (e.g., https://www.tiktok.com/@username)

2. **Input Cost Per Video**: Enter how much you pay (or plan to pay) for each sponsored video

3. **Select Number of Videos**: Choose how many recent videos to analyze (default is 10, maximum is 50)

4. **Click "Analyze TikTok Profile"**: The tool will scrape the profile and calculate all metrics

## Understanding the Results

### Key Metrics Cards

- **Average Views**: Higher is better, indicates reach potential
- **CPM**: Lower is better, indicates cost efficiency
  - < $5: Highly cost-effective
  - $5-$15: Industry standard
  - > $15: Above average cost
- **Virality Rate**: Percentage of videos that go viral
  - > 20%: High viral potential
  - 10-20%: Moderate viral potential
  - < 10%: Low viral potential
- **Engagement Rate**: Higher indicates better audience connection
  - > 5%: Excellent engagement
  - 3-5%: Good engagement
  - < 3%: Below average engagement

### Performance Insights

The tool analyzes multiple factors to provide:
1. **Consistency Assessment**: How predictable the creator's performance is
2. **Cost Efficiency Evaluation**: Whether the creator provides good ROI
3. **Viral Potential Analysis**: Likelihood of content going viral
4. **Custom Recommendations**: Specific advice based on the metrics

## Technical Implementation

The analyzer uses:
- **Web Scraping**: Jina API for reliable TikTok data extraction
- **Statistical Analysis**: Standard deviation calculations for virality detection
- **Data Visualization**: Recharts for interactive charts
- **Real-time Calculations**: All metrics computed client-side for instant results

## Best Practices

1. **Analyze Recent Performance**: Use at least 10 videos for accurate analysis
2. **Consider Seasonality**: Some creators perform better during certain periods
3. **Compare Multiple Creators**: Use the same parameters to compare different creators
4. **Track Over Time**: Re-analyze periodically to track performance changes
5. **Negotiate Based on Data**: Use CPM and consistency metrics for pricing discussions