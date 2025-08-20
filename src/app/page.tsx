'use client';

import { motion } from 'framer-motion';
import { Suspense } from 'react';
import CPMAnalyzer from "@/components/CPMAnalyzer";
import ThemeToggle from "@/components/ThemeToggle";
import { Activity } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-3"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-primary blur-lg opacity-20"></div>
                <div className="relative p-2.5 rounded-lg bg-primary text-primary-foreground">
                  <Activity className="w-5 h-5" strokeWidth={2.5} />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground tracking-tight">
                  Jam
                </h1>
                <p className="text-xs text-muted-foreground -mt-0.5">Creator Vibe Check Central</p>
              </div>
            </motion.div>
            <div className="flex items-center gap-4">
              <span className="text-xs font-medium text-muted-foreground hidden sm:block">
                TikTok CPM Calculator
              </span>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Suspense fallback={<div className="text-sm text-muted-foreground">Loading…</div>}>
            <CPMAnalyzer />
          </Suspense>
        </motion.div>
      </main>
    </div>
  );
}