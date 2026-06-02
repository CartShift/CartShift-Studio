import type { KeyboardEvent } from 'react';

/** Shared portal form control classes (SSOT with globals `.portal-input`). */
export const portalSelectClassName =
  'portal-input rounded-xl h-10 font-outfit text-sm font-medium';

export const portalTextareaClassName =
  'portal-input rounded-xl py-4 resize-none font-outfit text-sm font-medium';

/** Icon / compact action buttons (44px touch target + focus ring). */
export const portalIconButtonClassName =
  'portal-focus-ring min-w-[44px] min-h-[44px] flex items-center justify-center';

export function activateOnKeyboard(e: KeyboardEvent, action: () => void) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    action();
  }
}
