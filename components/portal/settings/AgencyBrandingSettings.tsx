'use client';

import { Dispatch, SetStateAction } from 'react';
import { Camera, Plus, Save, User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PortalSettingsSection } from '@/components/portal/ui/PortalSettingsSection';
import { applyTheme } from '@/lib/utils/theme-generator';
import { cn } from '@/lib/utils';
import { uploadAgencyAsset } from '@/lib/services/portal-uploads';

export interface AgencyBrandingProfile {
  name: string;
  email: string;
  website: string;
  phone?: string;
  description?: string;
  branding?: {
    primaryColor?: string;
    accentColor?: string;
    logoUrl?: string;
    iconUrl?: string;
    fontFamily?: 'inter' | 'roboto' | 'outfit' | 'playfair';
    fontFamilyEn?: string;
    fontFamilyHe?: string;
    borderRadius?: '0px' | '0.5rem' | '1rem';
    invertLogoInDarkMode?: boolean;
  };
}

interface AgencyBrandingSettingsProps {
  profile: AgencyBrandingProfile;
  setProfile: Dispatch<SetStateAction<AgencyBrandingProfile>>;
  userUid?: string;
  saving: boolean;
  onSave: () => void;
}

export function AgencyBrandingSettings({
  profile,
  setProfile,
  userUid,
  saving,
  onSave,
}: AgencyBrandingSettingsProps) {
  const t = useTranslations('portal');

  return (            <Card className="border-surface-200 dark:border-surface-800 shadow-sm">
              <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-6 font-outfit">
                {t('settings.branding.title' as any)}
              </h3>
              <p className="text-sm text-surface-500 dark:text-surface-400 mb-8">
                {t('settings.branding.subtitle' as any)}
              </p>

              <div className="space-y-4">
                <PortalSettingsSection
                  title={t('agency.settings.brandingSections.assets')}
                  description={t('agency.settings.brandingSections.assetsDesc')}
                  defaultOpen
                >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-sm font-bold text-surface-900 dark:text-white mb-2">
                      {t('settings.branding.logo.title' as any)}
                    </h4>
                    <p className="text-xs text-surface-500 mb-4">
                      {t('settings.branding.logo.description' as any)}
                    </p>
                    <div className="p-6 border-2 border-dashed border-surface-200 dark:border-surface-800 rounded-xl flex flex-col items-center justify-center gap-4 bg-surface-50/50 dark:bg-surface-900/30">
                      {profile.branding?.logoUrl ? (
                        <div className="relative group w-full h-24 flex items-center justify-center">
                          <img
                            src={profile.branding.logoUrl}
                            alt="Logo"
                            className="max-h-full max-w-full object-contain"
                          />
                          <button
                            onClick={() =>
                              setProfile({
                                ...profile,
                                branding: { ...profile.branding, logoUrl: '' },
                              })
                            }
                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold rounded-lg"
                          >
                            {t('settings.branding.logo.remove' as any)}
                          </button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <input
                            type="file"
                            id="logo-upload"
                            className="hidden"
                            accept="image/*"
                            onChange={async e => {
                              const file = e.target.files?.[0];
                              if (!file || !userUid) return;
                              try {
                                const url = await uploadAgencyAsset(userUid, file, 'logo');
                                setProfile({
                                  ...profile,
                                  branding: { ...profile.branding, logoUrl: url },
                                });
                              } catch (err) {
                                console.error('Logo upload failed', err);
                                toast.error(t('agency.settings.profile.failedToUpload'));
                              }
                            }}
                          />
                          <label
                            htmlFor="logo-upload"
                            className="cursor-pointer flex flex-col items-center gap-2 text-surface-500 hover:text-primary-600 transition-colors"
                          >
                            <Camera size={24} />
                            <span className="text-xs font-bold uppercase tracking-widest">
                              {t('settings.branding.logo.upload' as any)}
                            </span>
                          </label>
                        </div>
                      )}
                    </div>
                    <div className="mt-4 flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="invert-logo"
                        checked={profile.branding?.invertLogoInDarkMode || false}
                        onChange={e =>
                          setProfile({
                            ...profile,
                            branding: {
                              ...profile.branding,
                              invertLogoInDarkMode: e.target.checked,
                            },
                          })
                        }
                        className="w-4 h-4 rounded border-surface-300 text-primary-600 focus-visible:ring-primary-500/40"
                      />
                      <label
                        htmlFor="invert-logo"
                        className="text-sm font-medium text-surface-700 dark:text-surface-300 cursor-pointer select-none"
                      >
                        {t('settings.branding.darkmode.invertLogo' as any)}
                      </label>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-surface-900 dark:text-white mb-2">
                      {t('settings.branding.icon.title' as any)}
                    </h4>
                    <p className="text-xs text-surface-500 mb-4">
                      {t('settings.branding.icon.description' as any)}
                    </p>
                    <div className="p-6 border-2 border-dashed border-surface-200 dark:border-surface-800 rounded-xl flex flex-col items-center justify-center gap-4 bg-surface-50/50 dark:bg-surface-900/30">
                      {profile.branding?.iconUrl ? (
                        <div className="relative group w-16 h-16 flex items-center justify-center">
                          <img
                            src={profile.branding.iconUrl}
                            alt="Icon"
                            className="max-h-full max-w-full object-contain"
                          />
                          <button
                            onClick={() =>
                              setProfile({
                                ...profile,
                                branding: { ...profile.branding, iconUrl: '' },
                              })
                            }
                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold rounded-lg"
                          >
                            {t('settings.branding.icon.remove' as any)}
                          </button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <input
                            type="file"
                            id="icon-upload"
                            className="hidden"
                            accept="image/*"
                            onChange={async e => {
                              const file = e.target.files?.[0];
                              if (!file || !userUid) return;
                              try {
                                const url = await uploadAgencyAsset(userUid, file, 'icon');
                                setProfile({
                                  ...profile,
                                  branding: { ...profile.branding, iconUrl: url },
                                });
                              } catch (err) {
                                console.error('Icon upload failed', err);
                                toast.error(t('agency.settings.profile.failedToUpload'));
                              }
                            }}
                          />
                          <label
                            htmlFor="icon-upload"
                            className="cursor-pointer flex flex-col items-center gap-2 text-surface-500 hover:text-primary-600 transition-colors"
                          >
                            <div className="w-12 h-12 rounded-lg bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
                              <Plus size={20} />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-widest">
                              {t('settings.branding.icon.upload' as any)}
                            </span>
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                </PortalSettingsSection>

                <PortalSettingsSection
                  title={t('agency.settings.brandingSections.appearance')}
                  description={t('agency.settings.brandingSections.appearanceDesc')}
                >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {/* Colors */}
                  <div className="space-y-6">
                    <h4 className="text-sm font-bold text-surface-900 dark:text-white">
                      {t('settings.branding.colors.title' as any)}
                    </h4>

                    {/* Primary */}
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

                    {/* Accent */}
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

                  {/* Typography & Shape */}
                  <div className="space-y-6">
                    <h4 className="text-sm font-bold text-surface-900 dark:text-white">
                      {t('settings.branding.typography.title' as any)} /{' '}
                      {t('settings.branding.borderRadius.title' as any)}
                    </h4>

                    {/* Font Families & Preview */}
                    {/* Font Families & Preview */}
                    <div className="grid grid-cols-1 gap-6">
                      {/* English Font Family */}
                      <div>
                        <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">
                          {t('settings.branding.typography.english' as any)}
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {[
                            {
                              id: 'outfit',
                              label: 'Outfit (Modern)',
                              fontVar: 'var(--font-outfit)',
                            },
                            { id: 'inter', label: 'Inter (Clean)', fontVar: 'var(--font-inter)' },
                            { id: 'roboto', label: 'Roboto (Tech)', fontVar: 'var(--font-roboto)' },
                            {
                              id: 'playfair',
                              label: 'Playfair (Elegant)',
                              fontVar: 'var(--font-playfair)',
                            },
                            {
                              id: 'plus-jakarta',
                              label: 'Plus Jakarta',
                              fontVar: 'var(--font-plus-jakarta)',
                            },
                            {
                              id: 'montserrat',
                              label: 'Montserrat',
                              fontVar: 'var(--font-montserrat)',
                            },
                            { id: 'lato', label: 'Lato', fontVar: 'var(--font-lato)' },
                            {
                              id: 'open-sans',
                              label: 'Open Sans',
                              fontVar: 'var(--font-open-sans)',
                            },
                            { id: 'raleway', label: 'Raleway', fontVar: 'var(--font-raleway)' },
                            { id: 'nunito', label: 'Nunito', fontVar: 'var(--font-nunito)' },
                            {
                              id: 'merriweather',
                              label: 'Merriweather',
                              fontVar: 'var(--font-merriweather)',
                            },
                            { id: 'oswald', label: 'Oswald', fontVar: 'var(--font-oswald)' },
                            {
                              id: 'quicksand',
                              label: 'Quicksand',
                              fontVar: 'var(--font-quicksand)',
                            },
                            {
                              id: 'work-sans',
                              label: 'Work Sans',
                              fontVar: 'var(--font-work-sans)',
                            },
                            { id: 'dm-sans', label: 'DM Sans', fontVar: 'var(--font-dm-sans)' },
                            {
                              id: 'crimson-text',
                              label: 'Crimson Text',
                              fontVar: 'var(--font-crimson-text)',
                            },
                          ].map(font => (
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

                      {/* Hebrew Font Family */}
                      <div>
                        <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">
                          {t('settings.branding.typography.hebrew' as any)}
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {[
                            {
                              id: 'assistant',
                              label: 'Assistant (Modern)',
                              fontVar: 'var(--font-assistant)',
                            },
                            { id: 'heebo', label: 'Heebo (Clean)', fontVar: 'var(--font-heebo)' },
                            { id: 'rubik', label: 'Rubik (Tech)', fontVar: 'var(--font-rubik)' },
                            {
                              id: 'varela',
                              label: 'Varela (Rounded)',
                              fontVar: 'var(--font-varela)',
                            },
                            {
                              id: 'secular',
                              label: 'Secular (Bold)',
                              fontVar: 'var(--font-secular)',
                            },
                            { id: 'amatic', label: 'Amatic (Hand)', fontVar: 'var(--font-amatic)' },
                            {
                              id: 'frank-ruhl',
                              label: 'Frank Ruhl',
                              fontVar: 'var(--font-frank-ruhl)',
                            },
                            { id: 'miriam', label: 'Miriam', fontVar: 'var(--font-miriam)' },
                            { id: 'alef', label: 'Alef', fontVar: 'var(--font-alef)' },
                            { id: 'tinos', label: 'Tinos', fontVar: 'var(--font-tinos)' },
                            { id: 'arimo', label: 'Arimo', fontVar: 'var(--font-arimo)' },
                            { id: 'suez-one', label: 'Suez One', fontVar: 'var(--font-suez-one)' },
                          ].map(font => (
                            <button
                              key={font.id}
                              onClick={() => {
                                const val = font.id as any;
                                setProfile({
                                  ...profile,
                                  branding: { ...profile.branding, fontFamilyHe: val },
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

                      {/* Live Preview */}
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

                    {/* Border Radius */}
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
                              const val = radius.id as any;
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

                <PortalSettingsSection
                  title={t('agency.settings.brandingSections.preview')}
                  description={t('agency.settings.brandingSections.previewDesc')}
                >
                <div className="p-6 rounded-2xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800">
                  <h4 className="portal-label-sm mb-6">
                    {t('agency.settings.brandingSections.preview')}
                  </h4>
                  <div className="flex flex-col md:flex-row gap-8 items-start">
                    {/* Fake Card */}
                    <div className="w-full max-w-sm p-6 rounded-xl bg-white dark:bg-surface-950 border border-surface-200 dark:border-surface-800 shadow-sm">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                          <User size={20} />
                        </div>
                        <div>
                          <div className="h-4 w-24 bg-surface-100 dark:bg-surface-800 rounded mb-1.5" />
                          <div className="h-3 w-16 bg-surface-50 dark:bg-surface-900 rounded" />
                        </div>
                      </div>
                      <div className="space-y-3 mb-6">
                        <div className="h-2 w-full bg-surface-50 dark:bg-surface-900 rounded" />
                        <div className="h-2 w-5/6 bg-surface-50 dark:bg-surface-900 rounded" />
                        <div className="h-2 w-4/6 bg-surface-50 dark:bg-surface-900 rounded" />
                      </div>
                      <div className="flex gap-3">
                        <Button variant="primary" className="flex-1">
                          Primary
                        </Button>
                        <Button variant="outline" className="flex-1">
                          Outline
                        </Button>
                      </div>
                    </div>

                    {/* Fake Elements */}
                    <div className="space-y-4 flex-1">
                      <div className="flex gap-3 flex-wrap">
                        <span className="px-3 py-1 rounded bg-primary-100 text-primary-700 text-xs font-bold">
                          Primary Badge
                        </span>
                        <span className="px-3 py-1 rounded bg-accent-100 text-accent-700 text-xs font-bold">
                          Accent Badge
                        </span>
                        <span className="px-3 py-1 rounded bg-surface-100 text-surface-700 text-xs font-bold">
                          Neutral Badge
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-primary-500 shadow-lg shadow-primary-500/30" />
                        <div className="w-12 h-12 rounded-lg bg-accent-500 shadow-lg shadow-accent-500/30" />
                        <div className="w-12 h-12 rounded-lg bg-surface-900 dark:bg-white shadow-lg shadow-surface-900/10" />
                      </div>
                    </div>
                  </div>
                </div>
                </PortalSettingsSection>
              </div>

              <div className="mt-8 pt-6 border-t border-surface-200 dark:border-surface-800 flex justify-end">
                <Button
                  onClick={onSave}
                  loading={saving}
                  className="flex items-center gap-2 shadow-lg shadow-primary-500/20 font-outfit"
                >
                  <Save size={18} />
                  {saving ? t('agency.settings.profile.saving') : t('agency.settings.profile.save')}
                </Button>
              </div>
            </Card>
  );
}