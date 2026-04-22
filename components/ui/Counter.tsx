'use client';

import React, { useEffect, useState } from 'react';
import { useSpring, useMotionValueEvent } from '@/lib/motion';

interface CounterProps {
  value: number;
  suffix?: string;
  prefix?: string;
  inView: boolean;
  className?: string;
}

export const Counter: React.FC<CounterProps> = ({
  value,
  suffix = '',
  prefix = '',
  inView,
  className,
}) => {
  const motionValue = useSpring(0, {
    stiffness: 50,
    damping: 20,
    mass: 1,
  });
  const [displayValue, setDisplayValue] = useState(0);

  useMotionValueEvent(motionValue, 'change', latest => {
    setDisplayValue(Math.round(latest));
  });

  useEffect(() => {
    if (inView) {
      motionValue.set(value);
    }
  }, [inView, value, motionValue]);

  return (
    <span className={className}>
      {prefix}
      {displayValue}
      {suffix}
    </span>
  );
};
