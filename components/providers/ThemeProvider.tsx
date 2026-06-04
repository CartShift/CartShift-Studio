'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ThemeProviderProps } from 'next-themes';

export function ThemeProvider({ children, scriptProps, ...props }: ThemeProviderProps) {
  // next-themes injects an inline <script> to prevent theme flash (FOUC). React 19 warns
  // when executable scripts render inside client components. SSR still emits a normal
  // script; on the client we mark it non-executable because the theme is already applied.
  const resolvedScriptProps =
    typeof window === 'undefined'
      ? scriptProps
      : { ...scriptProps, type: 'application/json' as const };

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={true}
      enableColorScheme={true}
      storageKey="theme"
      themes={['light', 'dark']}
      disableTransitionOnChange={false}
      {...props}
      scriptProps={resolvedScriptProps}
    >
      {children}
    </NextThemesProvider>
  );
}
