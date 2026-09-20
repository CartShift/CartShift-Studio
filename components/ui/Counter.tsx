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
  // Render the real value in the server HTML so crawlers and no-JS clients
  // receive meaningful content. Once the section enters view, the spring
  // takes over and animates from zero to the target value.
  const [displayValue, setDisplayValue] = useState(value);

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
