import { useLocale } from 'next-intl';
import { getLocaleDirection } from './locale-config';

export function useDirection(): 'ltr' | 'rtl' {
  const locale = useLocale();
  return getLocaleDirection(locale);
}
