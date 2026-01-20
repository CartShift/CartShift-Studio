import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';
import { useSearchParams as nextUseSearchParams } from 'next/navigation';

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);

export function useSearchParams() {
  return nextUseSearchParams();
}
