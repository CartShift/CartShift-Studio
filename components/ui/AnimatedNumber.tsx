'use client';

import React, { useEffect, useState } from 'react';
import { useSpring, useMotionValueEvent } from '@/lib/motion';

interface AnimatedNumberProps {
  value: number | string;
  duration?: number;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ value, duration = 1000 }) => {
  const numericValue =
    typeof value === 'string' ? parseFloat(value.replace(/[^0-9.]/g, '')) || 0 : value;
  const [displayValue, setDisplayValue] = useState(0);

  const motionValue = useSpring(0, {
    stiffness: 80,
    damping: 20,
    duration,
  });

  useMotionValueEvent(motionValue, 'change', latest => {
    setDisplayValue(Math.round(latest));
  });

  useEffect(() => {
    motionValue.set(numericValue);
  }, [numericValue, motionValue]);

  if (typeof value === 'string' && value.includes('$')) {
    return <>{value}</>;
  }

  return <>{displayValue}</>;
};
