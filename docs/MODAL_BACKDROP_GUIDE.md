# ModalBackdrop Component Guide

## Overview

The `ModalBackdrop` component system provides a standardized, reusable approach to modal implementation across the CartShift Studio app. It ensures consistent behavior, styling, and accessibility for all modals.

## Key Features

### 1. Full Viewport Coverage

- Uses React's `createPortal` to render modals at `document.body` level
- Backdrop `fixed inset-0` covers entire viewport including sidebar, header, and all UI elements
- Solves the common issue where modals only blur the content area, not the full portal shell

### 2. Body Scroll Locking

- Automatically prevents body scrolling when modal is open
- Handles both desktop and mobile touch interactions
- Cleans up properly on unmount

### 3. Consistent Z-Index Management

- Uses semantic z-index tokens from `tailwind.config.ts`
- Proper layering: backdrop at `z-modal` (50), content at `z-modal + 1`
- Prevents z-index conflicts

### 4. Built-in Animations

- Smooth fade-in/out animations using Framer Motion
- Spring-based content animations
- Configurable transitions

### 5. Multiple Visual Variants

- **Blur levels**: none, sm, md, lg
- **Backdrop variants**: default (50% black), light (40%), dark (80%), surface (60%)

## Component API

### ModalBackdrop

Main container component that wraps modal content.

```tsx
import { ModalBackdrop } from '@/components/ui/ModalBackdrop';

<ModalBackdrop
  isOpen={isOpen}
  onClick={onClose}
  zIndex="50"
  preventScroll={true}
  variant="default"
  blur="sm"
  className="custom-class"
>
  {/* Modal content goes here */}
</ModalBackdrop>;
```

#### Props

| Prop            | Type                                          | Default      | Description                                      |
| --------------- | --------------------------------------------- | ------------ | ------------------------------------------------ |
| `isOpen`        | `boolean`                                     | **Required** | Whether modal is visible                         |
| `onClick`       | `() => void`                                  | Optional     | Callback when backdrop is clicked (closes modal) |
| `zIndex`        | `string \| number`                            | `"50"`       | Custom z-index value                             |
| `preventScroll` | `boolean`                                     | `true`       | Whether to prevent body scroll when open         |
| `variant`       | `"default" \| "light" \| "dark" \| "surface"` | `"default"`  | Backdrop color variant                           |
| `blur`          | `"none" \| "sm" \| "md" \| "lg"`              | `"sm"`       | Backdrop blur intensity                          |
| `className`     | `string`                                      | -            | Additional CSS classes                           |
| `children`      | `ReactNode`                                   | -            | Modal content to render                          |

### ModalContent

Container for modal content with consistent sizing and positioning.

```tsx
import { ModalContent } from '@/components/ui/ModalBackdrop';

<ModalContent
  maxWidth="lg"
  position="center"
  onClick={e => e.stopPropagation()}
  className="custom-class"
>
  {/* Modal content */}
</ModalContent>;
```

#### Props

| Prop        | Type                                              | Default    | Description                              |
| ----------- | ------------------------------------------------- | ---------- | ---------------------------------------- |
| `maxWidth`  | `"sm" \| "md" \| "lg" \| "xl" \| "2xl" \| "full"` | `"lg"`     | Maximum width of modal                   |
| `position`  | `"center" \| "top"`                               | `"center"` | Modal position                           |
| `onClick`   | `(e: MouseEvent) => void`                         | -          | Click handler (for stopping propagation) |
| `className` | `string`                                          | -          | Additional CSS classes                   |

### ModalHeader

Standardized modal header with optional close button.

```tsx
import { ModalHeader } from '@/components/ui/ModalBackdrop';

<ModalHeader
  title="Modal Title"
  description="Optional description"
  onClose={handleClose}
  className="custom-class"
/>;
```

#### Props

| Prop          | Type         | Default | Description                      |
| ------------- | ------------ | ------- | -------------------------------- |
| `title`       | `string`     | -       | Modal title (required)           |
| `description` | `string`     | -       | Optional subtitle/description    |
| `onClose`     | `() => void` | -       | Close button callback (optional) |
| `className`   | `string`     | -       | Additional CSS classes           |

### ModalBody

Container for modal body content with optional scrolling.

```tsx
import { ModalBody } from '@/components/ui/ModalBackdrop';

<ModalBody scrollable={true} className="custom-class">
  {/* Modal content */}
</ModalBody>;
```

#### Props

| Prop         | Type        | Default | Description               |
| ------------ | ----------- | ------- | ------------------------- |
| `children`   | `ReactNode` | -       | Body content              |
| `scrollable` | `boolean`   | `false` | Enable vertical scrolling |
| `className`  | `string`    | -       | Additional CSS classes    |

### ModalFooter

Footer container for action buttons with alignment options.

```tsx
import { ModalFooter } from '@/components/ui/ModalBackdrop';

<ModalFooter align="end" className="custom-class">
  <Button variant="outline" onClick={onCancel}>
    Cancel
  </Button>
  <Button onClick={onConfirm}>Confirm</Button>
</ModalFooter>;
```

#### Props

| Prop        | Type                           | Default | Description            |
| ----------- | ------------------------------ | ------- | ---------------------- |
| `children`  | `ReactNode`                    | -       | Footer buttons/content |
| `align`     | `"start" \| "center" \| "end"` | `"end"` | Button alignment       |
| `className` | `string`                       | -       | Additional CSS classes |

## Usage Examples

### Basic Modal

```tsx
'use client';

import { useState } from 'react';
import {
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@/components/ui/ModalBackdrop';
import { Button } from '@/components/ui/Button';

export const MyModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <ModalBackdrop isOpen={isOpen} onClick={() => setIsOpen(false)}>
      <ModalContent maxWidth="lg" onClick={e => e.stopPropagation()}>
        <ModalHeader
          title="My Modal"
          description="This is a description"
          onClose={() => setIsOpen(false)}
        />

        <ModalBody>
          <p>Modal content goes here...</p>
        </ModalBody>

        <ModalFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => setIsOpen(false)}>Confirm</Button>
        </ModalFooter>
      </ModalContent>
    </ModalBackdrop>
  );
};
```

### Modal with Scrolling Body

```tsx
<ModalBackdrop isOpen={isOpen} onClick={onClose}>
  <ModalContent maxWidth="lg" onClick={e => e.stopPropagation()}>
    <ModalHeader title="Long Content Modal" onClose={onClose} />
    <ModalBody scrollable>
      {/* Long content that will scroll if needed */}
      {Array.from({ length: 50 }).map((_, i) => (
        <p key={i} className="mb-4">
          This is a long paragraph {i + 1}.
        </p>
      ))}
    </ModalBody>
    <ModalFooter>
      <Button variant="outline" onClick={onClose}>
        Close
      </Button>
    </ModalFooter>
  </ModalContent>
</ModalBackdrop>
```

### Different Backdrop Variants

```tsx
// Light backdrop (mobile menu style)
<ModalBackdrop isOpen={isOpen} variant="light" blur="md" onClick={onClose}>
  {/* Content */}
</ModalBackdrop>

// Dark backdrop (onboarding tour style)
<ModalBackdrop isOpen={isOpen} variant="dark" blur="sm" onClick={onClose}>
  {/* Content */}
</ModalBackdrop>

// Custom blur intensity
<ModalBackdrop isOpen={isOpen} blur="lg" onClick={onClose}>
  {/* Content */}
</ModalBackdrop>
```

## Migration Guide

### Before (Old Pattern)

```tsx
'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from '@/lib/motion';

export const OldModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-modal flex items-center justify-center p-4">
      <div className="bg-white dark:bg-surface-900 rounded-2xl shadow-2xl max-w-lg w-full border border-surface-200 dark:border-surface-800">
        <div className="flex items-center justify-between p-6 border-b border-surface-200 dark:border-surface-800">
          <h3 className="text-xl font-bold text-surface-900 dark:text-white">Title</h3>
          <button onClick={onClose}>Close</button>
        </div>
        <div className="p-6">Content...</div>
      </div>
    </div>,
    document.body
  );
};
```

### After (New Pattern)

```tsx
'use client';

import { useState } from 'react';
import { ModalBackdrop, ModalContent, ModalHeader, ModalBody } from '@/components/ui/ModalBackdrop';

export const NewModal = ({ isOpen, onClose }) => {
  return (
    <ModalBackdrop isOpen={isOpen} onClick={onClose}>
      <ModalContent maxWidth="lg" onClick={e => e.stopPropagation()}>
        <ModalHeader title="Title" onClose={onClose} />
        <ModalBody>Content...</ModalBody>
      </ModalContent>
    </ModalBackdrop>
  );
};
```

### SSR-Safe Pattern (Recommended)

Always check for `document.body` availability before calling `createPortal`:

```tsx
// Good - SSR-safe
if (typeof document === 'undefined' || !document.body) {
  return null;
}

return createPortal(<ModalContent />, document.body);
```

This prevents the "Objects are not valid as a React child" error during server-side rendering.

### Benefits of Migration

1. **Consistency**: All modals look and behave the same
2. **Less Code**: Reusable components reduce boilerplate
3. **Accessibility**: Built-in accessibility features
4. **Maintainability**: Single source of truth for modal behavior
5. **Type Safety**: Full TypeScript support

## Z-Index Reference

Based on `tailwind.config.ts`:

| Token                  | Value | Usage                     |
| ---------------------- | ----- | ------------------------- |
| `z-modal`              | 50    | Modal backdrop            |
| `z-banner-fixed`       | 60    | Mobile sidebar backdrop   |
| `z-tooltip`            | 100   | Tooltips                  |
| `z-toast`              | 110   | Toast notifications       |
| `z-notification-badge` | 120   | Notification badges       |
| `z-always-on-top`      | 9999  | Highest priority elements |

## Best Practices

1. **Always use `createPortal`**: Ensure modals render at document.body level
2. **Stop propagation**: Add `onClick={(e) => e.stopPropagation()}` to content
3. **Handle ESC key**: Close modal on Escape key press
4. **Loading states**: Disable close button during loading
5. **Error handling**: Show errors in modal body with proper styling
6. **Accessibility**: Include proper ARIA labels and keyboard navigation
7. **Mobile responsive**: Use appropriate max-width for mobile screens
8. **Test scroll behavior**: Ensure long content scrolls properly

## Existing Components Using ModalBackdrop

- ✅ `UploadFileForm.tsx` - File upload modal (refactored to ModalBackdrop)
- ✅ `ModalBackdrop.tsx` - Core component system
- ✅ `MobileSearch.tsx` - Mobile search overlay (SSR-safe)
- ✅ `CreateOrganizationForm.tsx` - Create org modal (SSR-safe)
- ✅ `ManageServiceForm.tsx` - Service management modal (SSR-safe)
- ✅ `ScheduleConsultationForm.tsx` - Consultation modal (SSR-safe)
- ✅ `EditClientModal.tsx` - Client edit modal (SSR-safe)
- ✅ `OnboardingTour.tsx` - Onboarding tour (SSR-safe)
- 🔄 `ConfirmationModal.tsx` - Confirmation dialog (SSR-safe, pending refactor)
- 🔄 `ExitIntentModal.tsx` - Exit intent modal (SSR-safe, pending refactor)
- 🔄 `ImagePreviewModal.tsx` - Image preview modal (SSR-safe, pending refactor)
- 🔄 Mobile sidebar backdrop - Uses inline implementation (could use ModalBackdrop)

### Components with createPortal Guards (SSR-Safe)

All components using `createPortal` now include this guard:

```tsx
if (typeof document === 'undefined' || !document.body) {
  return null;
}
```

This prevents runtime errors during server-side rendering.

## Troubleshooting

### Modal backdrop not covering sidebar

**Problem**: Modal only blurs content area, not full portal

**Solution**: Ensure using `ModalBackdrop` component (which uses `createPortal`) instead of inline `fixed inset-0` divs.

### Body not locked on mobile

**Problem**: Can scroll background when modal is open

**Solution**: Ensure `preventScroll={true}` (default) is set on `ModalBackdrop`.

### Content not clickable

**Problem**: Clicks on modal content close the modal

**Solution**: Add `onClick={(e) => e.stopPropagation()}` to `ModalContent` to stop click propagation.

### Z-index conflicts

**Problem**: Modal appears behind other elements

**Solution**: Ensure using proper `zIndex` prop. Default is `"50"` (z-modal). Increase if needed: `zIndex="60"`.

## Future Enhancements

- [ ] Add focus trap for accessibility
- [ ] Support for multiple nested modals
- [ ] Add animation variants (slide-in, fade, zoom)
- [ ] Implement modal context for state management
- [ ] Add keyboard navigation support (Arrow keys, Tab)
- [ ] Add touch gesture support for mobile (swipe to close)
