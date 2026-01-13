'use client';

import React from 'react';
import { motion } from '@/lib/motion';

export const HeroIllustration: React.FC = () => {
  return (
    <div className="relative w-full h-full min-h-[700px] flex items-center justify-center transform scale-105 lg:scale-[1.3] xl:scale-[1.4] origin-center perspective-[1200px]">
      {/* 1. Atmosphere - Adaptive Light/Dark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          className="absolute w-[800px] h-[800px] rounded-full bg-[conic-gradient(from_0deg,transparent_0deg,rgba(var(--color-primary-500),0.1)_100deg,transparent_180deg)] blur-[100px] opacity-40 dark:opacity-100"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute w-[600px] h-[600px] bg-gradient-to-br from-accent-200/20 to-primary-200/20 dark:from-accent-500/10 dark:to-primary-600/10 blur-[90px] rounded-full"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <svg
        viewBox="0 0 900 700"
        className="w-full h-auto max-w-[1000px] relative z-10"
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: 'visible' }}
      >
        <defs>
          {/* Advanced Gradients - Variable based for Light/Dark support */}
          <linearGradient id="neonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" className="[stop-color:var(--color-primary-400)]" />
            <stop offset="50%" className="[stop-color:var(--color-accent-400)]" />
            <stop offset="100%" className="[stop-color:var(--color-primary-500)]" />
          </linearGradient>

          <linearGradient id="glassSurface" x1="0%" y1="0%" x2="0%" y2="100%">
            {/* Light Mode: White/Gray glass; Dark Mode: Dark Blue/Gray */}
            <stop
              offset="0%"
              className="[stop-color:#ffffff] dark:[stop-color:rgb(var(--color-surface-800))]"
              stopOpacity="0.95"
            />
            <stop
              offset="100%"
              className="[stop-color:rgb(var(--color-surface-100))] dark:[stop-color:rgb(var(--color-surface-900))]"
              stopOpacity="0.98"
            />
          </linearGradient>

          <linearGradient id="hologramBeam" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" className="[stop-color:var(--color-primary-500)]" stopOpacity="0" />
            <stop
              offset="50%"
              className="[stop-color:var(--color-primary-400)]"
              stopOpacity="0.05"
            />
            <stop offset="100%" className="[stop-color:var(--color-primary-500)]" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="cardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop
              offset="0%"
              className="[stop-color:#ffffff] dark:[stop-color:rgb(var(--color-surface-800))]"
            />
            <stop
              offset="100%"
              className="[stop-color:rgb(var(--color-surface-200))] dark:[stop-color:rgb(var(--color-surface-900))]"
            />
          </linearGradient>

          {/* Filters */}
          <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <filter id="softShadow" x="-50%" y="-50%" width="200%" height="200%">
            {/* Adjusted shadow opacity for generic use, but stronger in dark mode via flood-opacity not easily controllable via CSS classes in filter prims, relying on alpha */}
            <feDropShadow dx="0" dy="15" stdDeviation="25" floodColor="#000" floodOpacity="0.15" />
          </filter>

          <filter id="strongShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="8" stdDeviation="15" floodColor="#000" floodOpacity="0.2" />
          </filter>

          <clipPath id="screenContent">
            <rect x="220" y="180" width="460" height="290" rx="8" />
          </clipPath>

          <mask id="scanMask">
            <motion.rect
              x="220"
              y="180"
              width="460"
              height="290"
              fill="url(#hologramBeam)"
              animate={{ y: [-300, 300] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            />
          </mask>
        </defs>

        {/* 2. Isometric Grid Floor - Grounding the scene */}
        <g transform="translate(450, 480) scale(1, 0.4) rotate(45)">
          <rect
            x="-300"
            y="-300"
            width="600"
            height="600"
            fill="none"
            stroke="url(#neonGradient)"
            strokeWidth="1"
            strokeOpacity="0.1"
          />
          {/* Grid lines - Adaptive stroke color */}
          {[...Array(11)].map((_, i) => (
            <React.Fragment key={i}>
              <line
                x1="-300"
                y1={-300 + i * 60}
                x2="300"
                y2={-300 + i * 60}
                className="stroke-surface-300/30 dark:stroke-primary-500/10"
                strokeWidth="1"
              />
              <line
                x1={-300 + i * 60}
                y1="-300"
                x2={-300 + i * 60}
                y2="300"
                className="stroke-surface-300/30 dark:stroke-primary-500/10"
                strokeWidth="1"
              />
            </React.Fragment>
          ))}
        </g>

        {/* 3. Main Dashboard - Dynamic Transformation */}
        <motion.g
          initial={{ rotateX: 10, rotateY: -10, rotateZ: -2 }}
          animate={{
            rotateX: [10, 5, 10],
            rotateY: [-10, -5, -10],
            y: [0, -10, 0], // Bobbing effect
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Floating Back Lights - Subtler in Light Mode */}
          <circle
            cx="200"
            cy="200"
            r="100"
            className="fill-accent-200/40 dark:fill-accent-500/20 blur-[60px]"
          />
          <circle
            cx="700"
            cy="400"
            r="120"
            className="fill-primary-200/40 dark:fill-primary-500/20 blur-[80px]"
          />

          {/* Dashboard Body */}
          <g filter="url(#softShadow)">
            <rect
              x="200"
              y="150"
              width="500"
              height="350"
              rx="24"
              fill="url(#glassSurface)"
              className="stroke-white/40 dark:stroke-white/10"
              strokeWidth="1"
            />
            {/* Highlight Bezel */}
            <rect
              x="201"
              y="151"
              width="498"
              height="348"
              rx="23"
              className="fill-none stroke-white/20 dark:stroke-white/5"
              strokeWidth="2"
            />
          </g>

          {/* Screen UI */}
          <g clipPath="url(#screenContent)">
            {/* SidebarBg */}
            <rect
              x="220"
              y="180"
              width="100"
              height="350"
              className="fill-surface-100 dark:fill-surface-800/50"
            />

            {/* Sidebar Items */}
            {[0, 1, 2, 3].map(i => (
              <rect
                key={i}
                x="240"
                y={220 + i * 35}
                width="60"
                height="10"
                rx="4"
                className={`fill-surface-300 dark:fill-surface-600 ${i === 1 ? 'fill-primary-200 dark:fill-primary-500/60' : ''}`}
              />
            ))}

            {/* Main Content Area Bg */}
            <rect x="340" y="200" width="320" height="240" className="fill-transparent" />

            {/* Header */}
            <rect
              x="340"
              y="200"
              width="120"
              height="15"
              rx="4"
              className="fill-surface-300 dark:fill-surface-600"
            />

            {/* Action Button */}
            <motion.rect
              x="580"
              y="195"
              width="80"
              height="24"
              rx="6"
              className="fill-primary-500 cursor-pointer"
              whileTap={{ scale: 0.95 }}
              animate={{
                fillOpacity: [1, 0.9, 1],
                boxShadow: '0 0 20px rgba(var(--color-primary-500), 0.5)',
              }}
            />

            {/* Animated Graph Area */}
            <g transform="translate(340, 260)">
              {/* Grid */}
              <path
                d="M0 0 H 320 M 0 50 H 320 M 0 100 H 320"
                className="stroke-surface-200 dark:stroke-surface-700/30"
                strokeWidth="1"
                strokeDasharray="4"
              />

              {/* Dynamic Data Line */}
              <motion.path
                d="M 0 80 C 40 80, 60 40, 100 50 S 140 90, 180 60 S 240 20, 320 40"
                fill="none"
                stroke="url(#neonGradient)"
                strokeWidth="3"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, ease: 'easeInOut' }}
                // Reduce glow filter in light mode to prevent washout
                className="dark:filter-neon"
              />
              {/* Area under curve */}
              <motion.path
                d="M 0 80 C 40 80, 60 40, 100 50 S 140 90, 180 60 S 240 20, 320 40 V 120 H 0 Z"
                className="fill-primary-500/5 dark:fill-primary-500/10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 1 }}
              />
            </g>

            {/* Holographic Scan Line Overlay - Subtler in light mode */}
            <motion.rect
              x="220"
              y="180"
              width="460"
              height="290"
              fill="url(#hologramBeam)"
              style={{ mixBlendMode: 'overlay' }}
              animate={{ y: [-150, 450] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear', repeatDelay: 1 }}
              className="opacity-50 dark:opacity-100"
            />
          </g>

          {/* 4. Floating Elements - Exploded View */}

          {/* Top Right Card: Live Users */}
          <motion.g
            initial={{ x: 50, y: -50, opacity: 0 }}
            animate={{ x: 60, y: -30, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <motion.g
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <rect
                x="620"
                y="120"
                width="140"
                height="80"
                rx="12"
                fill="url(#cardGradient)"
                filter="url(#strongShadow)"
                className="stroke-surface-200 dark:stroke-white/10"
                strokeWidth="1"
              />
              <text
                x="640"
                y="150"
                className="fill-surface-500 dark:fill-surface-400 text-[10px] font-sans"
              >
                Active Users
              </text>
              <text
                x="640"
                y="175"
                className="fill-surface-900 dark:fill-white text-[18px] font-bold font-sans"
              >
                12,402
              </text>
              <circle cx="740" cy="145" r="4" className="fill-green-500 animate-pulse" />
            </motion.g>
          </motion.g>

          {/* Bottom Left Card: Revenue */}
          <motion.g
            initial={{ x: -50, y: 50, opacity: 0 }}
            animate={{ x: -40, y: 80, opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
          >
            <motion.g
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <rect
                x="120"
                y="380"
                width="160"
                height="90"
                rx="12"
                fill="url(#cardGradient)"
                filter="url(#strongShadow)"
                className="stroke-surface-200 dark:stroke-white/10"
                strokeWidth="1"
              />
              {/* Mini Chart */}
              <path
                d="M 140 440 L 160 430 L 180 435 L 200 410 L 220 420 L 260 390"
                fill="none"
                className="stroke-accent-500 dark:stroke-accent-400"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <text
                x="140"
                y="410"
                className="fill-surface-900 dark:fill-white text-[16px] font-bold font-sans"
              >
                $842k
              </text>
              <path
                d="M 140 405 L 135 400 M 140 405 L 145 400"
                fill="none"
                className="stroke-green-500 dark:stroke-green-400"
                strokeWidth="2"
              />
            </motion.g>
          </motion.g>

          {/* 5. Simulated Mouse Cursor Interaction */}
          <motion.g
            initial={{ x: 800, y: 600, opacity: 0 }}
            animate={{
              x: [800, 620, 620, 800], // Move to button, stay, leave
              y: [600, 205, 205, 600],
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: 'easeInOut',
              repeatDelay: 2,
            }}
          >
            {/* Cursor Icon */}
            <path
              d="M0 0 L 0 18 L 4 14 L 8 22 L 10 21 L 6 13 L 12 13 Z"
              className="fill-surface-900 dark:fill-white stroke-white dark:stroke-black"
              strokeWidth="1"
              transform="rotate(-15)"
            />

            {/* Click Ripple Effect */}
            <motion.circle
              cx="0"
              cy="0"
              r="20"
              className="fill-none stroke-primary-500/50 dark:stroke-white/50"
              strokeWidth="2"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.5], opacity: [1, 0] }}
              transition={{ duration: 0.6, times: [0, 1], repeat: Infinity, repeatDelay: 5.4 }} // Syncs with cursor stay time roughly
            />
          </motion.g>

          {/* 6. Floating Code/Commerce Symbols */}
          {[
            {
              char: '</>',
              x: 80,
              y: 200,
              delay: 0,
              color: 'fill-primary-500 dark:fill-primary-400',
            },
            {
              char: '{ }',
              x: 780,
              y: 300,
              delay: 1,
              color: 'fill-accent-500 dark:fill-accent-400',
            },
            { char: '$', x: 650, y: 50, delay: 2, color: 'fill-green-600 dark:fill-green-400' },
            {
              char: '%',
              x: 150,
              y: 500,
              delay: 1.5,
              color: 'fill-purple-600 dark:fill-purple-400',
            },
          ].map((item, i) => (
            <motion.text
              key={i}
              x={item.x}
              y={item.y}
              className={`${item.color} text-[24px] font-mono font-bold opacity-60 dark:opacity-40`}
              initial={{ y: item.y }}
              animate={{
                y: [item.y, item.y - 20, item.y],
                opacity: [0.6, 0.9, 0.6],
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 4,
                delay: item.delay,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              // Filter only in dark mode to prevent muddiness in light mode
              className="dark:filter-neon"
            >
              {item.char}
            </motion.text>
          ))}
        </motion.g>
      </svg>
    </div>
  );
};
