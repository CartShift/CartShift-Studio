'use client';

import { useEffect, useState } from 'react';

export function usePlatformModifierKey(): '⌘' | 'Ctrl' {
  const [modifier, setModifier] = useState<'⌘' | 'Ctrl'>('Ctrl');

  useEffect(() => {
    const isApple =
      /Mac|iPhone|iPad|iPod/.test(navigator.platform) ||
      (/Mac/.test(navigator.userAgent) && 'ontouchend' in document);
    setModifier(isApple ? '⌘' : 'Ctrl');
  }, []);

  return modifier;
}
