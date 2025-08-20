# Pinned Videos Exclusion

## Overview

The TikTok parser has been updated to automatically exclude pinned videos from the scraped results. Pinned videos are posts that creators have pinned to the top of their profile and are not representative of their recent performance metrics.

## Why Exclude Pinned Videos?

1. **Temporal Relevance**: Pinned videos can be very old and may not reflect current performance
2. **Metric Accuracy**: Including old pinned videos would skew average views and CPM calculations
3. **Performance Consistency**: Pinned videos are often the creator's best performers, artificially inflating metrics

## How Pinned Videos are Detected

The parser checks for multiple indicators of pinned videos:

1. **Class names**: Elements with class names containing "pinned"
2. **Data attributes**: Elements with data-e2e attributes containing "pinned"
3. **Pin icon**: SVG elements with data-e2e="pin-icon"
4. **Text content**: Elements containing the word "pinned" (case-insensitive)
5. **ARIA labels**: Elements with aria-label containing "Pinned"

## Implementation Details

### Detection Logic
```javascript
const isPinned = $elem.find('[class*="pinned"], [data-e2e*="pinned"], svg[data-e2e="pin-icon"]').length > 0 ||
                 $elem.text().toLowerCase().includes('pinned') ||
                 $elem.find('[aria-label*="Pinned"]').length > 0;
```

### Filtering Process
1. Each video element is checked for pinned indicators
2. If detected as pinned, the video is skipped and a counter is incremented
3. The parser logs how many pinned videos were skipped
4. Only non-pinned videos are included in the final results

## Console Output

When parsing TikTok data, you'll see:
- `Skipping pinned video` - Each time a pinned video is detected
- `Found X non-pinned videos after deduplication (Y pinned videos skipped)` - Summary at the end
- Extracted data will show `note: 'Pinned videos excluded'`

## Impact on Metrics

With pinned videos excluded:
- **Average views** reflect only recent, non-pinned content
- **CPM calculations** are based on organic recent performance
- **Virality detection** is more accurate without artificially high-performing pinned content
- **Performance consistency** better represents typical content performance

## Testing

To verify pinned video exclusion:
1. Analyze a TikTok profile with pinned videos
2. Check console logs for "Skipping pinned video" messages
3. Verify the video count matches non-pinned videos only
4. Compare with the TikTok profile to ensure pinned videos are excluded