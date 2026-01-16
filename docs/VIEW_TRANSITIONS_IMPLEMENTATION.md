# View Transitions API Implementation

## Overview

This implementation provides smooth, browser-native view transitions for the CartShift Studio application. The system uses the native [View Transitions API](https://developer.chrome.com/docs/web-platform/view-transitions/) where available, with graceful fallbacks for unsupported browsers.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Navigation Flow                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  User Click → ViewTransitionLink                    │
│                          ↓                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Check: View Transitions API supported?           │   │
│  │                                                      │   │
│  │  YES → Use native view transition              │   │
│  │  NO  → Use Next.js router directly              │   │
│  └─────────────────────────────────────────────────────┘   │
│                          ↓                                  │
│                Smooth page navigation                     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Core Components

### 1. useViewTransition Hook

**Location:** `lib/hooks/useViewTransition.ts`

Provides a React hook for triggering view transitions with:

- **Feature Detection:** Checks `document.startViewTransition` availability
- **Reduced Motion Support:** Respects user's motion preferences
- **Transition Presets:** Built-in presets for different animation styles
- **Type Safety:** Full TypeScript support

```typescript
const { startViewTransition, isSupported, prefersReducedMotion } = useViewTransition();

// Trigger a transition with custom options
await startViewTransition(
  () => {
    updateDOM();
  },
  {
    preset: 'slide', // 'default' | 'fade' | 'slide' | 'zoom' | 'flip'
    duration: 400, // Custom duration in ms
    easing: 'ease-out', // Custom easing function
    disableForReducedMotion: false, // Still animate even with reduced motion
  }
);
```

### 2. ViewTransitionLink Component

**Location:** `components/ui/ViewTransitionLink.tsx`

A drop-in replacement for Next.js Link component that automatically wraps navigation in view transitions:

- **Automatic Router Integration:** Uses Next.js router for SPA navigation
- **Smart Fallback:** Handles external links, hash links, and protocol links
- **Transition Presets:** Supports different animation styles per link
- **Accessibility:** Respects reduced motion preferences

```tsx
import { ViewTransitionLink } from '@/components/ui/ViewTransitionLink';

// Default transition
<ViewTransitionLink href="/dashboard">
  Go to Dashboard
</ViewTransitionLink>

// Custom preset
<ViewTransitionLink href="/settings" preset="fade" duration={300}>
  Settings
</ViewTransitionLink>

// Disable transition for specific links
<ViewTransitionLink href="/external" viewTransition={false}>
  External Site
</ViewTransitionLink>
```

### 3. useTransitionRouter Hook

**Location:** `lib/hooks/useTransitionRouter.ts`

Enhanced router hook that wraps all Next.js router methods with view transition support:

- **Push:** Navigate to new route with transition
- **Replace:** Replace current route with transition
- **Back:** Navigate back with transition
- **Refresh:** Refresh current route with transition

```typescript
import { useTransitionRouter } from '@/lib/hooks/useTransitionRouter';

const router = useTransitionRouter();

await router.push('/dashboard', { preset: 'slide' });
await router.back({ duration: 300 });
```

### 4. ViewTransitionWrapper Component

**Location:** `components/ui/ViewTransitionWrapper.tsx`

Wraps any component or section in a view transition:

```tsx
import { ViewTransitionWrapper } from '@/components/ui/ViewTransitionWrapper';

<ViewTransitionWrapper preset="zoom" duration={500}>
  <YourComponent />
</ViewTransitionWrapper>;
```

## Transition Presets

### Default (Slide)

- **Duration:** 350ms
- **Easing:** `cubic-bezier(0.25, 0.46, 0.45, 0.94)`
- **Effect:** Content slides up 12px with slight scale (0.98 → 1.0)
- **Use Case:** General navigation between pages

### Fade

- **Duration:** 300ms
- **Easing:** `ease-out`
- **Effect:** Simple opacity crossfade with scale (0.99 → 1.0)
- **Use Case:** Subtle transitions, settings pages, modals

### Slide

- **Duration:** 350ms
- **Easing:** `cubic-bezier(0.25, 0.46, 0.45, 0.94)`
- **Effect:** Content slides up 12px with scale
- **Use Case:** Similar to default but can be customized differently

### Zoom

- **Duration:** 400ms
- **Easing:** `cubic-bezier(0.4, 0, 0.2, 1)`
- **Effect:** Content slides up 6px with scale (0.95 → 1.0)
- **Use Case:** Hero sections, important content, image galleries

### Flip

- **Duration:** 300ms
- **Easing:** `cubic-bezier(0.68, -0.55, 0.265, 1.55)`
- **Effect:** 3D-like flip transition
- **Use Case:** Cards, list items, interactive elements

## CSS Architecture

### Cross-Document Opt-In

```css
@view-transition {
  navigation: auto;
}
```

Enables cross-document transitions (MPA navigation) for Chrome 126+, Safari 18.2+, Edge 126+.

### Persistent Elements

```css
[view-transition-name] {
  view-transition-name: none !important;
}
```

Elements with `view-transition-name` attribute are excluded from page transitions. Used for sidebar, header, and other persistent UI.

### Performance Optimizations

```css
::view-transition-group(root) {
  animation-duration: var(--view-transition-duration);
}

::view-transition-old(root),
::view-transition-new(root) {
  animation-timing-function: var(--view-transition-easing);
  animation-duration: var(--view-transition-duration);
}
```

Uses CSS custom properties for dynamic duration/easing control without JavaScript repaints.

### Reduced Motion Support

```css
@media (prefers-reduced-motion: reduce) {
  @view-transition {
    navigation: none;
  }

  ::view-transition-group(root),
  ::view-transition-old(root),
  ::view-transition-new(root) {
    animation-duration: 0.001s !important;
  }
}
```

Completely disables view transitions when user prefers reduced motion.

## Browser Support

| Browser  | Version | Same-Document | Cross-Document |
| -------- | ------- | ------------- | -------------- |
| Chrome   | 111+    | ✅            | ✅ (126+)      |
| Edge     | 111+    | ✅            | ✅ (126+)      |
| Firefox  | 144+    | ✅            | ❌             |
| Safari   | 18+     | ✅            | ✅ (18.2+)     |
| Fallback | Any     | ✅            | ❌             |

## Portal Integration

### Sidebar Navigation

All sidebar navigation items use `ViewTransitionLink` with `preset="slide"`:

```tsx
<ViewTransitionLink
  href={item.href}
  preset="slide"
  className={navItemVariants({ isActive, isCollapsed: !isExpanded })}
>
```

### Breadcrumbs

Breadcrumb links use `ViewTransitionLink` with `preset="fade"` for subtler transitions:

```tsx
<ViewTransitionLink
  href={item.href}
  preset="fade"
  className="font-medium truncate..."
>
```

### Persistent Elements

The following elements are excluded from page transitions:

1. **Sidebar:** `view-transition-name="sidebar"`
2. **Header:** `view-transition-name="header"`
3. **Page Content:** `view-transition-name="page-content"` (participates in transition)

This ensures smooth navigation while keeping navigation elements stable.

## Best Practices

### 1. Keep Transitions Quick

- Target duration: **300-400ms**
- Longer than 500ms can feel sluggish
- Shorter than 200ms may be too subtle

### 2. Use Meaningful Motion

- Highlight what **changed** between views
- Avoid cosmetic effects that don't communicate purpose
- Motion should guide user attention to relevant content

### 3. Respect Layout Shifts

- Maintain consistent layout metrics
- Prepare layout before triggering transition
- Use stable element positioning

### 4. Synchronous DOM Updates

- Keep DOM manipulations inside transition callback
- Avoid async operations in callback
- Ensure all updates happen in single frame

### 5. Optimize Assets

- Preload images and fonts
- Ensure resources available before transition
- Consider lower-res assets for animation frames

### 6. Test Across Browsers

- Verify fallback behavior in unsupported browsers
- Test with reduced motion preferences
- Validate RTL layouts (Hebrew in our case)

### 7. Accessibility First

- Always respect `prefers-reduced-motion`
- Ensure keyboard navigation still works smoothly
- Announce view changes to screen readers

## Performance Monitoring

View transitions are GPU-accelerated by the browser, providing:

- **Zero JavaScript animation overhead**
- **No layout thrashing** during transitions
- **Smooth 60fps** on modern hardware
- **Automatic optimization** by browser compositor

## Migration Guide

### From Standard Link

```tsx
// Before
<Link href="/dashboard">Dashboard</Link>

// After (opt-in)
<ViewTransitionLink href="/dashboard">Dashboard</ViewTransitionLink>
```

### From useRouter

```tsx
// Before
const router = useRouter();
router.push('/dashboard');

// After
const router = useTransitionRouter();
await router.push('/dashboard');
```

### From Custom Navigation

```tsx
// Before
<button onClick={() => navigate('/page')}>Go</button>

// After
<button onClick={async () => {
  await startViewTransition(() => navigate('/page'), { preset: 'slide' });
}}>Go</button>
```

## Common Issues and Solutions

### Issue: Flickering on Navigation

**Cause:** Multiple animation systems running simultaneously

**Solution:** Ensure only one system is active using `@supports` CSS rules:

```css
@supports (startViewTransition: auto) {
  .portal-reveal {
    animation: none !important;
  }
}
```

### Issue: External Links Not Working

**Cause:** ViewTransitionLink trying to transition external URLs

**Solution:** External links are automatically detected and excluded:

```tsx
<ViewTransitionLink href="https://external.com" target="_blank">
  External Link
</ViewTransitionLink>
```

### Issue: Reduced Motion Not Respected

**Cause:** Not checking user preferences

**Solution:** Hook automatically detects and respects `prefers-reduced-motion`:

```typescript
const { prefersReducedMotion } = useViewTransition();
// Transition is skipped when prefersReducedMotion is true
```

## Future Enhancements

1. **Shared Element Transitions:** Animate specific elements (e.g., thumbnails to full images)
2. **Duration Controls:** Allow users to customize transition duration in settings
3. **Performance Analytics:** Track transition timing and user engagement
4. **Advanced Presets:** Add more animation styles (morph, swipe, etc.)
5. **Gesture Support:** Add touch gestures for mobile navigation

## Resources

- [View Transitions API MDN](https://developer.mozilla.org/docs/Web/API/View_Transitions_API)
- [View Transitions Chrome Docs](https://developer.chrome.com/docs/web-platform/view-transitions/)
- [next-view-transitions Library](https://github.com/shuding/next-view-transitions)
- [Web.dev Transition Patterns](https://web.dev/articles/content-visibility-transition-guide/)

## Summary

This implementation provides:

- ✅ Smooth, browser-native transitions
- ✅ Graceful degradation for older browsers
- ✅ Accessibility-first design
- ✅ Performance-optimized CSS
- ✅ Easy-to-use React hooks
- ✅ Multiple animation presets
- ✅ RTL support
- ✅ Reduced motion support

The system is production-ready and follows web development best practices.
