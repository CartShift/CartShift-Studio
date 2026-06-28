'use client';

import { Dispatch, SetStateAction } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/Input';
import { PortalSettingsSection } from '@/components/portal/ui/PortalSettingsSection';
import { applyTheme } from '@/lib/utils/theme-generator';
import { cn } from '@/lib/utils';
import type { AgencyBrandingProfile } from '@/components/portal/settings/AgencyBrandingSettings';

const ENGLISH_FONTS = [
  { id: 'outfit', label: 'Outfit (Modern)', fontVar: 'var(--font-outfit)' },
  { id: 'inter', label: 'Inter (Clean)', fontVar: 'var(--font-inter)' },
  { id: 'roboto', label: 'Roboto (Tech)', fontVar: 'var(--font-roboto)' },
  { id: 'playfair', label: 'Playfair (Elegant)', fontVar: 'var(--font-playfair)' },
  { id: 'plus-jakarta', label: 'Plus Jakarta', fontVar: 'var(--font-plus-jakarta)' },
  { id: 'montserrat', label: 'Montserrat', fontVar: 'var(--font-montserrat)' },
  { id: 'lato', label: 'Lato', fontVar: 'var(--font-lato)' },
  { id: 'open-sans', label: 'Open Sans', fontVar: 'var(--font-open-sans)' },
  { id: 'raleway', label: 'Raleway', fontVar: 'var(--font-raleway)' },
  { id: 'nunito', label: 'Nunito', fontVar: 'var(--font-nunito)' },
  { id: 'merriweather', label: 'Merriweather', fontVar: 'var(--font-merriweather)' },
  { id: 'oswald', label: 'Oswald', fontVar: 'var(--font-oswald)' },
  { id: 'quicksand', label: 'Quicksand', fontVar: 'var(--font-quicksand)' },
  { id: 'work-sans', label: 'Work Sans', fontVar: 'var(--font-work-sans)' },
  { id: 'dm-sans', label: 'DM Sans', fontVar: 'var(--font-dm-sans)' },
  { id: 'crimson-text', label: 'Crimson Text', fontVar: 'var(--font-crimson-text)' },
] as const;

const HEBREW_FONTS = [
  { id: 'assistant', label: 'Assistant (Modern)', fontVar: 'var(--font-assistant)' },
  { id: 'heebo', label: 'Heebo (Clean)', fontVar: 'var(--font-heebo)' },
  { id: 'rubik', label: 'Rubik (Tech)', fontVar: 'var(--font-rubik)' },
  { id: 'varela', label: 'Varela (Rounded)', fontVar: 'var(--font-varela)' },
  { id: 'secular', label: 'Secular (Bold)', fontVar: 'var(--font-secular)' },
  { id: 'amatic', label: 'Amatic (Hand)', fontVar: 'var(--font-amatic)' },
  { id: 'frank-ruhl', label: 'Frank Ruhl', fontVar: 'var(--font-frank-ruhl)' },
  { id: 'miriam', label: 'Miriam', fontVar: 'var(--font-miriam)' },
  { id: 'alef', label: 'Alef', fontVar: 'var(--font-alef)' },
  { id: 'tinos', label: 'Tinos', fontVar: 'var(--font-tinos)' },
  { id: 'arimo', label: 'Arimo', fontVar: 'var(--font-arimo)' },
  { id: 'suez-one', label: 'Suez One', fontVar: 'var(--font-suez-one)' },
] as const;

interface BrandingAppearanceSectionProps {
  profile: AgencyBrandingProfile;
  setProfile: Dispatch<SetStateAction<AgencyBrandingProfile>>;
}

export function BrandingAppearanceSection({ profile, setProfile }: BrandingAppearanceSectionProps) {
  const t = useTranslations('portal');

  return (
    <PortalSettingsSection
      title={t('agency.settings.brandingSections.appearance')}
      description={t('agency.settings.brandingSections.appearanceDesc')}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="space-y-6">
          <h4 className="text-sm font-bold text-surface-900 dark:text-white">
            {t('settings.branding.colors.title' as any)}
          </h4>

          <div>
            <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">
              {t('settings.branding.colors.primary' as any)}
            </label>
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="color"
                  value={profile.branding?.primaryColor || '#21759b'}
                  onChange={e => {
                    const val = e.target.value;
                    setProfile({
                      ...profile,
                      branding: { ...profile.branding, primaryColor: val },
                    });
                    applyTheme(val, profile.branding?.accentColor, undefined, undefined);
                  }}
                  className="h-10 w-10 rounded-lg cursor-pointer border-0 p-0 overflow-hidden"
                />
                <div className="absolute inset-0 rounded-lg ring-1 ring-inset ring-black/10 pointer-events-none" />
              </div>
              <Input
                value={profile.branding?.primaryColor || ''}
                onChange={e => {
                  const val = e.target.value;
                  setProfile({
                    ...profile,
                    branding: { ...profile.branding, primaryColor: val },
                  });
                  applyTheme(val, profile.branding?.accentColor, undefined, undefined);
                }}
                placeholder="#21759b"
                className="font-mono uppercase text-sm h-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">
              {t('settings.branding.colors.accent' as any)}
            </label>
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="color"
                  value={profile.branding?.accentColor || '#96bf48'}
                  onChange={e => {
                    const val = e.target.value;
                    setProfile({
                      ...profile,
                      branding: { ...profile.branding, accentColor: val },
                    });
                    applyTheme(profile.branding?.primaryColor, val, undefined, undefined);
                  }}
                  className="h-10 w-10 rounded-lg cursor-pointer border-0 p-0 overflow-hidden"
                />
                <div className="absolute inset-0 rounded-lg ring-1 ring-inset ring-black/10 pointer-events-none" />
              </div>
              <Input
                value={profile.branding?.accentColor || ''}
                onChange={e => {
                  const val = e.target.value;
                  setProfile({
                    ...profile,
                    branding: { ...profile.branding, accentColor: val },
                  });
                  applyTheme(profile.branding?.primaryColor, val, undefined, undefined);
                }}
                placeholder="#96bf48"
                className="font-mono uppercase text-sm h-10"
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h4 className="text-sm font-bold text-surface-900 dark:text-white">
            {t('settings.branding.typography.title' as any)} /{' '}
            {t('settings.branding.borderRadius.title' as any)}
          </h4>

          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">
                {t('settings.branding.typography.english' as any)}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {ENGLISH_FONTS.map(font => (
                  <button
                    key={font.id}
                    onClick={() => {
                      const val = font.id as any;
                      setProfile({
                        ...profile,
                        branding: { ...profile.branding, fontFamilyEn: val },
                      });
                      applyTheme(undefined, undefined, val, undefined, undefined);
                    }}
                    className={cn(
                      'px-3 py-2 text-xs border rounded-lg transition-all text-start truncate',
                      (profile.branding?.fontFamilyEn ||
                        profile.branding?.fontFamily ||
                        'outfit') === font.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 ring-1 ring-primary-500'
                        : 'border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600 bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-300'
                    )}
                    title={font.label}
                  >
                    <span style={{ fontFamily: font.fontVar }} className="text-lg">
                      Aa
                    </span>{' '}
                    <span className="ms-1">{font.label.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">
                {t('settings.branding.typography.hebrew' as any)}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {HEBREW_FONTS.map(font => (
                  <button
                    key={font.id}
                    onClick={() => {
                      const val = font.id;
                      setProfile({
                        ...profile,
                        branding: { ...profile.branding, fontFamilyHe: val as any },
                      });
                      applyTheme(undefined, undefined, undefined, undefined, val);
                    }}
                    className={cn(
                      'px-3 py-2 text-xs border rounded-lg transition-all text-start truncate',
                      (profile.branding?.fontFamilyHe || 'assistant') === font.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 ring-1 ring-primary-500'
                        : 'border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600 bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-300'
                    )}
                    title={font.label}
                  >
                    <span style={{ fontFamily: font.fontVar }} className="text-lg">
                      אב
                    </span>{' '}
                    <span className="ms-1">{font.label.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900/50">
              <label className="block text-xs font-bold text-surface-400 uppercase tracking-wider mb-3">
                Preview / תצוגה מקדימה
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h5
                    className="text-sm font-semibold text-surface-900 dark:text-white"
                    style={{ fontFamily: 'var(--font-en)' }}
                  >
                    English Preview
                  </h5>
                  <p
                    className="text-xs text-surface-600 dark:text-surface-400 leading-relaxed"
                    style={{ fontFamily: 'var(--font-en)' }}
                  >
                    The quick brown fox jumps over the lazy dog.
                    <br />
                    <strong>Bold Text</strong> • <em>Italic Text</em> • 1234567890
                  </p>
                  <button
                    className="mt-2 text-xs font-medium px-3 py-1.5 rounded-lg bg-primary-600 text-white"
                    style={{ fontFamily: 'var(--font-en)' }}
                  >
                    Primary Button
                  </button>
                </div>
                <div className="space-y-2 text-right" dir="rtl">
                  <h5
                    className="text-sm font-semibold text-surface-900 dark:text-white"
                    style={{ fontFamily: 'var(--font-he)' }}
                  >
                    תצוגה מקדימה בעברית
                  </h5>
                  <p
                    className="text-xs text-surface-600 dark:text-surface-400 leading-relaxed"
                    style={{ fontFamily: 'var(--font-he)' }}
                  >
                    דג סקרן שט בים מאוכזב ולפתע מצא חברה.
                    <br />
                    <strong>טקסט מודגש</strong> • <em>טקסט נטוי</em> • 1234567890
                  </p>
                  <button
                    className="mt-2 text-xs font-medium px-3 py-1.5 rounded-lg bg-primary-600 text-white"
                    style={{ fontFamily: 'var(--font-he)' }}
                  >
                    כפתור ראשי
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">
              {t('settings.branding.borderRadius.title' as any)}
            </label>
            <div className="flex bg-surface-100 dark:bg-surface-800 p-1 rounded-xl">
              {[
                { id: '0px', label: t('settings.branding.borderRadius.sharp' as any) },
                { id: '0.5rem', label: t('settings.branding.borderRadius.soft' as any) },
                { id: '1rem', label: t('settings.branding.borderRadius.round' as any) },
              ].map(radius => (
                <button
                  key={radius.id}
                  onClick={() => {
                    const val = radius.id as '0px' | '0.5rem' | '1rem';
                    setProfile({
                      ...profile,
                      branding: { ...profile.branding, borderRadius: val },
                    });
                    applyTheme(undefined, undefined, undefined, val);
                  }}
                  className={cn(
                    'flex-1 py-1.5 text-xs font-bold rounded-lg transition-all',
                    profile.branding?.borderRadius === radius.id
                      ? 'bg-white dark:bg-surface-700 shadow-sm text-surface-900 dark:text-white'
                      : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
                  )}
                >
                  {radius.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PortalSettingsSection>
  );
}
