'use client';

import {
  PortalCard,
  PortalCardHeader,
  PortalCardTitle,
  PortalCardDescription,
  PortalCardContent,
  PortalCardFooter,
} from './PortalCard';
import { PortalButton } from './PortalButton';
import { PortalBadge } from './PortalBadge';
import { Skeleton, SkeletonCard, SkeletonStats, SkeletonList } from './Skeleton';
import { Zap, ArrowRight, Check, Star, Bell, Settings, Download, Plus, Trash2 } from 'lucide-react';

/**
 * Design System Showcase Component
 * Demonstrates all the premium visual features of the portal design system
 */
export function DesignSystemShowcase() {
  return (
    <div className="p-8 space-y-12 bg-surface-50 dark:bg-surface-950 min-h-screen">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-outfit font-bold text-gradient-brand">Portal Design System</h1>
        <p className="text-surface-500 dark:text-surface-400 max-w-2xl mx-auto">
          A premium, modern design system with glassmorphism, gradients, micro-animations, and
          beautiful visual effects.
        </p>
      </div>

      {/* Cards Section */}
      <section className="space-y-6">
        <h2 className="text-2xl font-outfit font-bold text-surface-900 dark:text-white">
          Card Variants
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Default Card */}
          <PortalCard variant="default" hoverEffect>
            <PortalCardHeader>
              <PortalCardTitle>Default Card</PortalCardTitle>
            </PortalCardHeader>
            <PortalCardContent>
              <PortalCardDescription>
                The standard card with subtle shadows and clean borders. Perfect for most content
                sections.
              </PortalCardDescription>
            </PortalCardContent>
            <PortalCardFooter>
              <PortalBadge variant="blue" size="sm">
                Default
              </PortalBadge>
            </PortalCardFooter>
          </PortalCard>

          {/* Glass Card */}
          <PortalCard variant="glass" hoverEffect="lift">
            <PortalCardHeader>
              <PortalCardTitle>Glass Card</PortalCardTitle>
            </PortalCardHeader>
            <PortalCardContent>
              <PortalCardDescription>
                Beautiful glassmorphism effect with blur and subtle transparency. Great for overlays
                and featured content.
              </PortalCardDescription>
            </PortalCardContent>
            <PortalCardFooter>
              <PortalBadge variant="purple" size="sm">
                Glass
              </PortalBadge>
            </PortalCardFooter>
          </PortalCard>

          {/* Elevated Card */}
          <PortalCard variant="elevated" hoverEffect="glow">
            <PortalCardHeader>
              <PortalCardTitle>Elevated Card</PortalCardTitle>
            </PortalCardHeader>
            <PortalCardContent>
              <PortalCardDescription>
                Deep shadows for a floating effect. Excellent for important or featured sections.
              </PortalCardDescription>
            </PortalCardContent>
            <PortalCardFooter>
              <PortalBadge variant="green" size="sm">
                Elevated
              </PortalBadge>
            </PortalCardFooter>
          </PortalCard>

          {/* Gradient Card */}
          <PortalCard variant="gradient" accent="gradient" hoverEffect="scale">
            <PortalCardHeader>
              <PortalCardTitle>Gradient Card</PortalCardTitle>
            </PortalCardHeader>
            <PortalCardContent>
              <PortalCardDescription>
                Premium gradient background with accent border. Perfect for CTAs and premium
                features.
              </PortalCardDescription>
            </PortalCardContent>
            <PortalCardFooter>
              <PortalBadge variant="gradient" size="sm" glow>
                Gradient
              </PortalBadge>
            </PortalCardFooter>
          </PortalCard>

          {/* Interactive Card */}
          <PortalCard variant="interactive" hoverEffect accent="primary">
            <PortalCardHeader>
              <PortalCardTitle>Interactive Card</PortalCardTitle>
            </PortalCardHeader>
            <PortalCardContent>
              <PortalCardDescription>
                Designed for clickable items like list entries. Has active press state and cursor
                pointer.
              </PortalCardDescription>
            </PortalCardContent>
            <PortalCardFooter>
              <PortalBadge variant="orange" size="sm">
                Interactive
              </PortalBadge>
            </PortalCardFooter>
          </PortalCard>

          {/* Accent Variants */}
          <PortalCard accent="success" hoverEffect="lift">
            <PortalCardHeader>
              <PortalCardTitle>Success Accent</PortalCardTitle>
            </PortalCardHeader>
            <PortalCardContent>
              <PortalCardDescription>
                Cards can have accent colors at the top. Available: primary, accent, gradient,
                success, warning.
              </PortalCardDescription>
            </PortalCardContent>
            <PortalCardFooter>
              <PortalBadge variant="emerald" size="sm" dot dotPulse>
                Active
              </PortalBadge>
            </PortalCardFooter>
          </PortalCard>
        </div>
      </section>

      {/* Buttons Section */}
      <section className="space-y-6">
        <h2 className="text-2xl font-outfit font-bold text-surface-900 dark:text-white">
          Button Variants
        </h2>

        <div className="flex flex-wrap gap-4">
          <PortalButton variant="primary" leftIcon={<Zap size={16} />}>
            Primary
          </PortalButton>
          <PortalButton variant="secondary">Secondary</PortalButton>
          <PortalButton variant="outline" rightIcon={<ArrowRight size={16} />}>
            Outline
          </PortalButton>
          <PortalButton variant="ghost">Ghost</PortalButton>
          <PortalButton variant="success" leftIcon={<Check size={16} />}>
            Success
          </PortalButton>
          <PortalButton variant="danger" leftIcon={<Trash2 size={16} />}>
            Danger
          </PortalButton>
          <PortalButton variant="gradient" rightIcon={<Star size={16} />}>
            Gradient
          </PortalButton>
          <PortalButton variant="glass">Glass</PortalButton>
        </div>

        {/* Button Sizes */}
        <div className="flex flex-wrap items-center gap-4">
          <PortalButton size="xs">Extra Small</PortalButton>
          <PortalButton size="xs">Extra Small</PortalButton>
          <PortalButton size="sm">Small</PortalButton>
          <PortalButton size="md">Medium</PortalButton>
          <PortalButton size="lg">Large</PortalButton>
        </div>

        {/* Icon Buttons */}
        <div className="flex flex-wrap items-center gap-4">
          <PortalButton size="icon-sm" variant="ghost">
            <Bell size={16} />
          </PortalButton>
          <PortalButton size="icon" variant="secondary">
            <Settings size={18} />
          </PortalButton>
          <PortalButton size="icon-lg" variant="primary">
            <Download size={20} />
          </PortalButton>
          <PortalButton size="icon" variant="gradient">
            <Plus size={18} />
          </PortalButton>
        </div>

        {/* Loading State */}
        <div className="flex flex-wrap gap-4">
          <PortalButton isLoading>Loading...</PortalButton>
          <PortalButton variant="secondary" isLoading>
            Processing
          </PortalButton>
        </div>
      </section>

      {/* Badges Section */}
      <section className="space-y-6">
        <h2 className="text-2xl font-outfit font-bold text-surface-900 dark:text-white">
          Badge Variants
        </h2>

        {/* Standard Badges */}
        <div className="flex flex-wrap gap-3">
          <PortalBadge variant="blue">Blue</PortalBadge>
          <PortalBadge variant="green">Green</PortalBadge>
          <PortalBadge variant="yellow">Yellow</PortalBadge>
          <PortalBadge variant="red">Red</PortalBadge>
          <PortalBadge variant="purple">Purple</PortalBadge>
          <PortalBadge variant="orange">Orange</PortalBadge>
          <PortalBadge variant="cyan">Cyan</PortalBadge>
          <PortalBadge variant="pink">Pink</PortalBadge>
          <PortalBadge variant="gray">Gray</PortalBadge>
        </div>

        {/* Solid Badges */}
        <div className="flex flex-wrap gap-3">
          <PortalBadge variant="solid-blue">Solid Blue</PortalBadge>
          <PortalBadge variant="solid-green">Solid Green</PortalBadge>
          <PortalBadge variant="solid-yellow">Solid Yellow</PortalBadge>
          <PortalBadge variant="solid-red">Solid Red</PortalBadge>
          <PortalBadge variant="solid-purple">Solid Purple</PortalBadge>
          <PortalBadge variant="gradient" glow>
            Gradient
          </PortalBadge>
        </div>

        {/* Sizes */}
        <div className="flex flex-wrap items-center gap-3">
          <PortalBadge variant="blue" size="xs">
            Extra Small
          </PortalBadge>
          <PortalBadge variant="blue" size="sm">
            Small
          </PortalBadge>
          <PortalBadge variant="blue" size="md">
            Medium
          </PortalBadge>
          <PortalBadge variant="blue" size="lg">
            Large
          </PortalBadge>
        </div>

        {/* With Dots */}
        <div className="flex flex-wrap gap-3">
          <PortalBadge variant="green" dot>
            Active
          </PortalBadge>
          <PortalBadge variant="yellow" dot dotPulse>
            Processing
          </PortalBadge>
          <PortalBadge variant="red" dot>
            Offline
          </PortalBadge>
          <PortalBadge variant="blue" dot dotPulse>
            Live
          </PortalBadge>
        </div>

        {/* Glow Effect */}
        <div className="flex flex-wrap gap-3 p-4 bg-surface-900 rounded-xl">
          <PortalBadge variant="blue" glow>
            Glow Blue
          </PortalBadge>
          <PortalBadge variant="green" glow>
            Glow Green
          </PortalBadge>
          <PortalBadge variant="purple" glow>
            Glow Purple
          </PortalBadge>
          <PortalBadge variant="gradient" glow>
            Glow Gradient
          </PortalBadge>
        </div>
      </section>

      {/* Skeletons Section */}
      <section className="space-y-6">
        <h2 className="text-2xl font-outfit font-bold text-surface-900 dark:text-white">
          Skeleton Loaders
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card Skeleton */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-surface-500">Card Skeleton</p>
            <SkeletonCard />
          </div>

          {/* Stats Skeleton */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-surface-500">Stats Grid</p>
            <SkeletonStats />
          </div>

          {/* List Skeleton */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-surface-500">List Items</p>
            <SkeletonList items={3} />
          </div>

          {/* Individual Elements */}
          <div className="space-y-4">
            <p className="text-sm font-medium text-surface-500">Individual Elements</p>
            <div className="space-y-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-10 w-32" variant="button" />
              <div className="flex gap-2">
                <Skeleton variant="circular" className="h-8 w-8" />
                <Skeleton variant="circular" className="h-8 w-8" />
                <Skeleton variant="circular" className="h-8 w-8" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Utility Classes Section */}
      <section className="space-y-6">
        <h2 className="text-2xl font-outfit font-bold text-surface-900 dark:text-white">
          Utility Classes
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Text Gradients */}
          <PortalCard>
            <PortalCardContent>
              <p className="text-xl font-bold text-gradient-primary mb-2">text-gradient-primary</p>
              <p className="text-xl font-bold text-gradient-accent mb-2">text-gradient-accent</p>
              <p className="text-xl font-bold text-gradient-brand">text-gradient-brand</p>
            </PortalCardContent>
          </PortalCard>

          {/* Animations */}
          <PortalCard>
            <PortalCardContent className="space-y-4">
              <div className="h-12 w-12 bg-primary-500 rounded-xl animate-subtle-float" />
              <p className="text-sm text-surface-500">animate-subtle-float</p>

              <div className="h-12 w-12 bg-accent-500 rounded-xl animate-glow-pulse" />
              <p className="text-sm text-surface-500">animate-glow-pulse</p>
            </PortalCardContent>
          </PortalCard>

          {/* Border Glow */}
          <PortalCard className="border-glow">
            <PortalCardContent>
              <p className="text-sm text-surface-500">
                Hover this card to see the gradient border glow effect. Apply with{' '}
                <code className="text-primary-500">border-glow</code> class.
              </p>
            </PortalCardContent>
          </PortalCard>
        </div>
      </section>
    </div>
  );
}

export default DesignSystemShowcase;
