'use client';

import React from 'react';
import { motion } from '@/lib/motion';
import { geometricShape } from '@/lib/animation-variants';

interface Shape {
  type: 'circle' | 'square' | 'rect' | 'dot';
  size: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  position: { top?: string; bottom?: string; left?: string; right?: string };
  animation: keyof typeof geometricShape;
  className?: string;
  delay?: number;
}

const shapes: Shape[] = [
  { type: 'dot', size: 'xs', position: { top: '8%', left: '5%' }, animation: 'pulse' },
  {
    type: 'square',
    size: 'lg',
    position: { top: '12%', left: '15%' },
    animation: 'scaleAndRotate',
  },
  { type: 'dot', size: 'sm', position: { top: '5%', left: '28%' }, animation: 'complexFloat' },
  { type: 'square', size: 'md', position: { top: '15%', left: '42%' }, animation: 'rotate' },
  {
    type: 'dot',
    size: 'xs',
    position: { top: '8%', right: '35%' },
    animation: 'pulse',
    delay: 0.5,
  },
  { type: 'circle', size: 'sm', position: { top: '18%', right: '22%' }, animation: 'pulse' },
  { type: 'square', size: 'md', position: { top: '6%', right: '12%' }, animation: 'float' },
  {
    type: 'dot',
    size: 'sm',
    position: { top: '14%', right: '4%' },
    animation: 'complexFloat',
    delay: 1,
  },

  { type: 'rect', size: 'xl', position: { top: '28%', left: '3%' }, animation: 'float' },
  {
    type: 'circle',
    size: 'xs',
    position: { top: '32%', left: '18%' },
    animation: 'scaleAndRotate',
  },
  { type: 'circle', size: 'sm', position: { top: '25%', left: '35%' }, animation: 'float' },
  { type: 'dot', size: 'xs', position: { top: '30%', right: '30%' }, animation: 'pulse' },
  { type: 'square', size: 'md', position: { top: '22%', right: '15%' }, animation: 'floatX' },
  { type: 'rect', size: 'lg', position: { top: '35%', right: '6%' }, animation: 'rotate' },

  { type: 'circle', size: 'sm', position: { top: '45%', left: '6%' }, animation: 'rotateReverse' },
  {
    type: 'dot',
    size: 'xs',
    position: { top: '50%', left: '22%' },
    animation: 'complexFloat',
    delay: 0.3,
  },
  { type: 'circle', size: 'md', position: { top: '42%', left: '38%' }, animation: 'pulse' },
  { type: 'dot', size: 'sm', position: { top: '48%', right: '38%' }, animation: 'complexFloat' },
  { type: 'square', size: 'sm', position: { top: '52%', right: '25%' }, animation: 'float' },
  {
    type: 'dot',
    size: 'xs',
    position: { top: '44%', right: '8%' },
    animation: 'pulse',
    delay: 0.8,
  },

  { type: 'dot', size: 'sm', position: { top: '62%', left: '4%' }, animation: 'float' },
  { type: 'square', size: 'md', position: { top: '58%', left: '15%' }, animation: 'rotate' },
  {
    type: 'circle',
    size: 'sm',
    position: { top: '65%', left: '30%' },
    animation: 'scaleAndRotate',
  },
  { type: 'rect', size: 'lg', position: { top: '60%', right: '32%' }, animation: 'float' },
  {
    type: 'dot',
    size: 'xs',
    position: { top: '68%', right: '18%' },
    animation: 'pulse',
    delay: 0.6,
  },
  { type: 'circle', size: 'sm', position: { top: '55%', right: '5%' }, animation: 'floatX' },

  {
    type: 'square',
    size: 'md',
    position: { bottom: '22%', left: '8%' },
    animation: 'scaleAndRotate',
  },
  {
    type: 'dot',
    size: 'xs',
    position: { bottom: '28%', left: '25%' },
    animation: 'pulse',
    delay: 0.2,
  },
  { type: 'rect', size: 'lg', position: { bottom: '18%', left: '40%' }, animation: 'rotate' },
  { type: 'circle', size: 'xs', position: { bottom: '25%', right: '35%' }, animation: 'float' },
  { type: 'dot', size: 'sm', position: { bottom: '30%', right: '20%' }, animation: 'complexFloat' },
  { type: 'rect', size: 'md', position: { bottom: '20%', right: '8%' }, animation: 'float' },
  { type: 'dot', size: 'xs', position: { bottom: '35%', right: '3%' }, animation: 'pulse' },
];

const sizeClasses = {
  xs: 'w-2 h-2',
  sm: 'w-10 h-10',
  md: 'w-14 h-14',
  lg: 'w-20 h-20',
  xl: 'w-24 h-24',
};

const typeClasses = {
  dot: 'rounded-full',
  circle: 'rounded-full border-2 border-accent-500/25',
  square: 'rounded-xl border-2 border-primary-500/20',
  rect: 'rounded-3xl border border-accent-400/10',
};

export const BackgroundShapes: React.FC = React.memo(() => {
  return (
    <div aria-hidden="true">
      {shapes.map((shape, i) => {
        const bgColor =
          shape.type === 'dot' ? (i % 2 === 0 ? 'bg-primary-500/20' : 'bg-accent-400/15') : '';

        return (
          <motion.div
            key={i}
            className={`absolute ${sizeClasses[shape.size]} ${typeClasses[shape.type]} ${bgColor} ${shape.className || ''}`}
            style={{
              top: shape.position.top,
              bottom: shape.position.bottom,
              left: shape.position.left,
              right: shape.position.right,
            }}
            animate={shape.animation}
            variants={geometricShape}
            transition={{
              ...geometricShape[shape.animation].transition,
              delay: shape.delay || 0,
            }}
          />
        );
      })}
    </div>
  );
});

BackgroundShapes.displayName = 'BackgroundShapes';
