# Jam - TikTok CPM Analyzer

A professional creator analytics platform for calculating CPM (Cost Per Mille) and ROI of TikTok partnerships.

## Features

- **Minimal, Clean UI**: Professional design with light and dark mode support
- **CPM Calculator**: Calculate cost per thousand views for creator partnerships
- **Multi-Currency Support**: Support for 8 major currencies (USD, EUR, GBP, JPY, KRW, INR, CAD, AUD)
- **Performance Analytics**: 
  - Total and average views analysis
  - Virality rate calculation
  - Performance consistency metrics
  - Views distribution charts
- **Insights & Recommendations**: Data-driven insights for partnership decisions
- **Export Functionality**: Export analysis data as JSON or copy insights to clipboard

## Tech Stack

- **Next.js 15** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** with custom design tokens
- **Framer Motion** for smooth animations
- **Recharts** for data visualization
- **next-themes** for dark mode support

## Getting Started

### Prerequisites

1. **Jina API Key**: This app uses Jina AI's Reader API to scrape TikTok profiles. Get your free API key from [https://jina.ai/reader/](https://jina.ai/reader/)

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd creator-management
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Configure environment variables**
   ```bash
   cp env.example .env
   ```
   Then edit `.env` and add your Jina API key:
   ```
   JINA_API_KEY=your_jina_api_key_here
   ```

4. **Run the development server**

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
# Jam
