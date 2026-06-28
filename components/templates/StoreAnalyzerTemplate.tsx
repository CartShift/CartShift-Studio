'use client';

import React from 'react';
import { StoreAnalyzerContent } from '@/components/sections/StoreAnalyzerContent';
import type { AnalyzerIntent } from '@/lib/analyzer/funnel';

export const StoreAnalyzerTemplate: React.FC<{
  initialIntent?: AnalyzerIntent;
  relatedArticles?: Array<{ slug: string; title: string }>;
}> = ({ initialIntent, relatedArticles }) => {
  return (
    <div className="min-h-screen bg-background dark:bg-surface-950 transition-colors duration-300">
      <StoreAnalyzerContent initialIntent={initialIntent} relatedArticles={relatedArticles} />
    </div>
  );
};
