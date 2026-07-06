'use client';

import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { DropdownMenu } from 'radix-ui';
import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { ChevronDown } from 'lucide-react';
import { trackLanguageSwitch } from '@/lib/analytics';
import { setUserLocalePreference } from '@/components/providers/GeoLocaleRedirect';
import { useLanguageSync } from '@/lib/hooks/useLanguageSync';

const USFlag = () => (
  <svg
    viewBox="0 0 640 480"
    className="w-5 h-5 rounded-full object-cover border border-surface-100 dark:border-surface-700"
  >
    <path fill="#bd3d44" d="M0 0h640v480H0" />
    <path
      stroke="#fff"
      strokeWidth="37"
      d="M0 55.3h640M0 129h640M0 202.6h640M0 276.3h640M0 350h640M0 423.7h640"
    />
    <path fill="#192f5d" d="M0 0h296v258H0" />
    <marker id="us-a" markerHeight="30" markerWidth="30">
      <path fill="#fff" d="m14 0 9 27L0 10h28L5 27z" />
    </marker>
    <path fill="#fff" d="m14 0 9 27L0 10h28L5 27z" transform="scale(.65)" />
    <use href="#us-a" x="38" />
    <use href="#us-a" x="76" />
    <use href="#us-a" x="114" />
    <use href="#us-a" x="152" />
    <use href="#us-a" x="190" />
    <use href="#us-a" x="228" />
    <use href="#us-a" y="42" />
    <use href="#us-a" x="38" y="42" />
    <use href="#us-a" x="76" y="42" />
    <use href="#us-a" x="114" y="42" />
    <use href="#us-a" x="152" y="42" />
    <use href="#us-a" x="190" y="42" />
    <use href="#us-a" x="228" y="42" />
    <use href="#us-a" y="84" />
    <use href="#us-a" x="38" y="84" />
    <use href="#us-a" x="76" y="84" />
    <use href="#us-a" x="114" y="84" />
    <use href="#us-a" x="152" y="84" />
    <use href="#us-a" x="190" y="84" />
    <use href="#us-a" x="228" y="84" />
    <use href="#us-a" y="126" />
    <use href="#us-a" x="38" y="126" />
    <use href="#us-a" x="76" y="126" />
    <use href="#us-a" x="114" y="126" />
    <use href="#us-a" x="152" y="126" />
    <use href="#us-a" x="190" y="126" />
    <use href="#us-a" x="228" y="126" />
  </svg>
);

const ILFlag = () => (
  <svg
    viewBox="0 0 640 480"
    className="w-5 h-5 rounded-full object-cover border border-surface-100 dark:border-surface-700"
  >
    <g fillRule="evenodd">
      <path fill="#fff" d="M0 0h640v480H0z" />
      <path fill="#0038b8" d="M0 55h640v80H0zM0 345h640v80H0z" />
      <path fill="none" stroke="#0038b8" strokeWidth="35" d="m320 148 95 165H225z" />
      <path fill="none" stroke="#0038b8" strokeWidth="35" d="m320 443 95-165H225z" />
    </g>
  </svg>
);

const triggerVariants = cva(
  'flex items-center gap-1.5 px-2.5 py-2 rounded-xl transition-all duration-200',
  {
    variants: {
      isOpen: {
        true: 'bg-surface-200/80 dark:bg-surface-600/50 text-surface-900 dark:text-white',
        false:
          'hover:bg-surface-200/60 dark:hover:bg-surface-700/50 text-surface-700 dark:text-surface-300',
      },
    },
    defaultVariants: {
      isOpen: false,
    },
  }
);

const langItemVariants = cva(
  'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
  {
    variants: {
      active: {
        true: 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400',
        false: 'text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-white/5',
      },
    },
    defaultVariants: {
      active: false,
    },
  }
);

export const LanguageSwitcher = ({ compact = false }: { compact?: boolean }) => {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Sync language preference to Firestore for authenticated portal users
  useLanguageSync();

  const handleLanguageChange = (lang: 'en' | 'he') => {
    setUserLocalePreference(lang);
    trackLanguageSwitch(lang);
    router.replace(pathname, { locale: lang });
    setIsOpen(false);
  };

  const currentLanguage = locale as 'en' | 'he';

  return (
    <DropdownMenu.Root open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenu.Trigger asChild>
        <button
          className={cn(triggerVariants({ isOpen }), compact && 'px-2 py-2')}
          aria-label="Select Language"
        >
          {currentLanguage === 'en' ? <USFlag /> : <ILFlag />}
          {!compact ? (
            <>
              <span className="text-sm font-medium text-surface-700 dark:text-surface-200">
                {currentLanguage === 'en' ? 'EN' : 'עב'}
              </span>
              <ChevronDown
                className={cn(
                  'h-3 w-3 text-surface-500 transition-transform duration-200',
                  isOpen && 'rotate-180'
                )}
              />
            </>
          ) : null}
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          collisionPadding={12}
          className="z-always-on-top w-36 overflow-hidden rounded-xl border border-surface-200 bg-white p-1 shadow-lg outline-none dark:border-white/10 dark:bg-surface-800 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 motion-reduce:animate-none"
        >
          <DropdownMenu.Item
            onSelect={() => handleLanguageChange('en')}
            className={cn(langItemVariants({ active: currentLanguage === 'en' }), 'cursor-default outline-none data-[highlighted]:bg-surface-50 dark:data-[highlighted]:bg-white/5')}
          >
            <USFlag />
            English
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onSelect={() => handleLanguageChange('he')}
            className={cn(langItemVariants({ active: currentLanguage === 'he' }), 'cursor-default outline-none data-[highlighted]:bg-surface-50 dark:data-[highlighted]:bg-white/5')}
          >
            <ILFlag />
            עברית
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};
