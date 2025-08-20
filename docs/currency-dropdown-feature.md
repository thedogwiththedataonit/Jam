# Currency Dropdown Feature

## Overview
A currency dropdown has been added to the TikTok CPM Analyzer that allows users to input costs in their preferred currency while maintaining CPM calculations in USD for consistency.

## Features

### 1. Currency Selection
- Dropdown menu located at the top-right of the analyzer
- Supports 8 currencies:
  - USD ($) - US Dollar
  - EUR (€) - Euro
  - GBP (£) - British Pound
  - JPY (¥) - Japanese Yen
  - KRW (₩) - Korean Won
  - INR (₹) - Indian Rupee
  - CAD (C$) - Canadian Dollar
  - AUD (A$) - Australian Dollar

### 2. URL Parameter Integration
- Selected currency is stored as a URL parameter (`?currency=EUR`)
- Currency preference persists across page reloads
- Shareable URLs maintain currency selection

### 3. Automatic Conversion
- User inputs cost in their selected currency
- System automatically converts to USD for CPM calculation
- Conversion rates are predefined in the component

### 4. Display Features
- Cost input label shows selected currency symbol
- CPM metric card shows "(USD)" label
- When non-USD currency is selected:
  - CPM card shows conversion note
  - Cost efficiency insight shows detailed conversion breakdown

### 5. CPM Calculation Formula
- Always calculated in USD regardless of input currency
- Formula: `CPM = (Cost in USD / Average Views) × 1,000`
- Conversion: `Cost in USD = Cost in Selected Currency × Exchange Rate`

## Technical Implementation

### Exchange Rates
The following exchange rates to USD are used:
```typescript
USD: 1.00
EUR: 1.09
GBP: 1.27
JPY: 0.0066
KRW: 0.00076
INR: 0.012
CAD: 0.74
AUD: 0.65
```

### URL Parameter Handling
- Uses Next.js `useSearchParams` and `useRouter`
- Updates URL without page reload
- Default currency is USD if not specified

## Usage Example

1. User selects EUR from dropdown
2. URL updates to include `?currency=EUR`
3. Cost input label changes to "Cost per Video (€)"
4. User enters €500
5. System converts: €500 × 1.09 = $545 USD
6. CPM calculated using $545 USD
7. Display shows CPM in USD with conversion note

## Benefits

- **International Accessibility**: Creators worldwide can use their local currency
- **Consistency**: CPM always in USD for easy comparison
- **Transparency**: Clear conversion information displayed
- **User Experience**: Intuitive currency selection with persistent preferences