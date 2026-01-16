'use client';

import React from 'react';
import { StoreAnalyzerContent } from '@/components/sections/StoreAnalyzerContent';

export const StoreAnalyzerTemplate: React.FC = () => {
  return (
    <div className="min-h-screen bg-background dark:bg-surface-950 transition-colors duration-300">
      <StoreAnalyzerContent />
    </div>
  );
};
