'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardSectionTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Shield, CreditCard, Save, Loader2, Camera, User, Palette, Building2 } from 'lucide-react';
import { applyTheme } from '@/lib/utils/theme-generator';
import { cn } from '@/lib/utils';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { getAgencyTeam, getAgency, updateAgency } from '@/lib/services/portal-agency';
import { updatePortalUser } from '@/lib/services/portal-users';
import { uploadAgencyAsset, uploadUserProfilePicture } from '@/lib/services/portal-uploads';
import { updateGlobalBranding } from '@/lib/services/portal-branding';
import { getFirebaseAuth } from '@/lib/firebase';
import { PortalUser, Invite, Agency } from '@/lib/types/portal';
import { subscribeToAgencyInvites, cancelInvite } from '@/lib/services/portal-organizations';
import { useTranslations } from 'next-intl';
import { Avatar } from '@/components/ui/Avatar';
import { InviteTeamMemberForm } from '@/components/portal/forms/InviteTeamMemberForm';
import { ManageServiceForm } from '@/components/portal/forms/ManageServiceForm';
import { subscribeToServices, deleteService } from '@/lib/services/portal-services';
import { Service, formatCurrency } from '@/lib/types/portal';
import { Plus, Edit2, Trash2, Tag, MessageSquare, Zap } from 'lucide-react';
import {
  GoogleCalendarIntegration,
  IntegrationCard,
  CalendarConnection,
} from '@/components/portal/integrations';
import {
  initiateGoogleOAuth,
  getCalendarConnection,
  disconnectCalendar,
  isGoogleCalendarConfigured,
} from '@/lib/services/portal-google-calendar';

interface AgencyProfile {
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

export default function AgencysClient() {
  const t = useTranslations('portal');
  const { user } = usePortalAuth();
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const validTabs = ['profile', 'team', 'services', 'integrations', 'billing'];
  const initialTab = tabFromUrl && validTabs.includes(tabFromUrl) ? tabFromUrl : 'profile';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<AgencyProfile>({
    name: '',
    email: '',
    website: '',
    phone: '',
    description: '',
    branding: {
      primaryColor: '',
      accentColor: '',
    },
  });
  const [team, setTeam] = useState<PortalUser[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loadingTeam, setIsTeamLoading] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | undefined>(undefined);
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setIsServicesLoading] = useState(false);
  const [calendarConnection, setCalendarConnection] = useState<CalendarConnection | null>(null);
  const [cancellingInvite, setCancellingInvite] = useState<string | null>(null);
  const [profileFormData, setProfileFormData] = useState({
    name: '',
    photoUrl: '',
  });
  const [savingProfile, setIsProfileSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Sync activeTab with URL parameter when it changes
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && validTabs.includes(tabFromUrl) && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    async function fetchAgencyProfile() {
      if (!user?.uid) return;

      setLoading(true);
      try {
        const data = await getAgency(user.uid);
        if (data) {
          setProfile({
            name: data.name || '',
            email: data.email || '',
            website: data.website || '',
            phone: data.contactInfo?.phone || '',
            description: '',
            branding: {
              primaryColor: data.branding?.primaryColor || '',
              accentColor: data.branding?.accentColor || '',
              logoUrl: data.logoUrl,
              iconUrl: data.iconUrl,
            },
          });

          // Apply theme if exists
          if (data.branding) {
            const { primaryColor, accentColor } = data.branding;
            applyTheme(primaryColor, accentColor, undefined, undefined, undefined);
          }
        }
      } catch (error) {
        console.error('Error fetching agency profile:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAgencyProfile();

    if (user) {
      setProfileFormData({
        name: user.displayName || '',
        photoUrl: user.photoURL || '',
      });
    }
  }, [user]);

  useEffect(() => {
    let mounted = true;
    let unsubscribeInvites: (() => void) | undefined;
    let unsubscribeServices: (() => void) | undefined;

    if (activeTab === 'team') {
      const fetchTeam = async () => {
        if (mounted) {
          setIsTeamLoading(true);
        }
        try {
          const members = await getAgencyTeam();
          if (mounted) {
            setTeam(members as any);
          }
        } catch (error) {
          console.error('Error fetching agency team:', error);
        } finally {
          if (mounted) {
            setIsTeamLoading(false);
          }
        }
      };

      fetchTeam();

      unsubscribeInvites = subscribeToAgencyInvites(data => {
        if (mounted) {
          setInvites(data);
        }
      });
    }

    if (activeTab === 'services') {
      if (mounted) {
        setIsServicesLoading(true);
      }
      unsubscribeServices = subscribeToServices(data => {
        if (mounted) {
          setServices(data);
          setIsServicesLoading(false);
        }
      });
    }

    if (activeTab === 'integrations') {
      getCalendarConnection().then(connection => {
        if (mounted) {
          setCalendarConnection(connection);
        }
      });
    }

    return () => {
      mounted = false;
      if (unsubscribeInvites) unsubscribeInvites();
      if (unsubscribeServices) unsubscribeServices();
    };
  }, [activeTab]);

  const handleCancelInvite = async (inviteId: string) => {
    if (!confirm(t('common.confirm' as any))) return;
    setCancellingInvite(inviteId);
    try {
      await cancelInvite(inviteId);
    } catch (error) {
      console.error('Error cancelling invite:', error);
    } finally {
      setCancellingInvite(null);
    }
  };

  const handleSave = async () => {
    if (!user?.uid) return;

    setSaving(true);
    try {
      const auth = getFirebaseAuth();
      const currentUser = auth.currentUser;

      if (!currentUser || !currentUser.uid) {
        throw new Error(t('common.userNotAuthenticated' as any));
      }

      const userId = currentUser.uid;

      const data: Partial<Exclude<Agency, 'id'>> = {
        name: profile.name,
        email: profile.email,
        website: profile.website,
        contactInfo: {
          phone: profile.phone,
        },
        logoUrl: profile.branding?.logoUrl,
        iconUrl: profile.branding?.iconUrl,
        branding: {
          primaryColor: profile.branding?.primaryColor,
          accentColor: profile.branding?.accentColor,
        },
      };

      await updateAgency(userId, data);

      // Also save to global system settings for public branding
      if (profile.branding) {
        try {
          await updateGlobalBranding(profile.branding, userId);
        } catch (globalError) {
          console.warn('Failed to update global branding:', globalError);
          // Don't fail the main save if this optional step fails
        }
      }

      alert(t('agency.settings.profile.success'));

      // Cache branding locally
      if (profile.branding) {
        localStorage.setItem('agency_branding_primary', profile.branding.primaryColor || '');
        localStorage.setItem('agency_branding_accent', profile.branding.accentColor || '');
        const fontEn = profile.branding.fontFamilyEn || profile.branding.fontFamily;
        if (fontEn) localStorage.setItem('agency_branding_font_en', fontEn);
        if (profile.branding.fontFamilyHe)
          localStorage.setItem('agency_branding_font_he', profile.branding.fontFamilyHe);
        if (profile.branding.borderRadius)
          localStorage.setItem('agency_branding_radius', profile.branding.borderRadius);
      }

      // Apply theme immediately
      applyTheme(
        profile.branding?.primaryColor,
        profile.branding?.accentColor,
        profile.branding?.fontFamilyEn || profile.branding?.fontFamily,
        profile.branding?.borderRadius,
        profile.branding?.fontFamilyHe
      );
    } catch (error) {
      console.error('Error saving agency profile:', error);
      const errorMessage = error instanceof Error ? error.message : t('common.unknownError' as any);
      alert(`Failed to save settings: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const handleServiceSuccess = () => {
    setIsServiceModalOpen(false);
    setEditingService(undefined);
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm(t('common.confirm' as any))) return;
    try {
      await deleteService(serviceId);
    } catch (error) {
      console.error('Error deleting service:', error);
    }
  };

  const handleInviteSuccess = () => {
    setIsInviteModalOpen(false);
    // Refresh team if we are on team tab
    if (activeTab === 'team') {
      const fetchTeam = async () => {
        setIsTeamLoading(true);
        try {
          const members = await getAgencyTeam();
          setTeam(members as any);
        } catch (error) {
          console.error('Error refreshing agency team:', error);
        } finally {
          setIsTeamLoading(false);
        }
      };
      fetchTeam();
    }
  };

  const tabs = [
    { id: 'profile', label: t('agency.settings.tabs.profile'), icon: Building2 },
    { id: 'branding', label: t('settings.tabs.branding' as any), icon: Palette },
    { id: 'user-profile', label: t('settings.tabs.profile'), icon: User },
    { id: 'services', label: t('agency.settings.tabs.services'), icon: Building2 },
    { id: 'team', label: t('agency.settings.tabs.team'), icon: User },
    { id: 'integrations', label: t('agency.settings.tabs.integrations'), icon: Shield },
    { id: 'billing', label: t('agency.settings.tabs.billing'), icon: CreditCard },
  ];

  const handleProfileSave = async () => {
    if (!user) return;
    setIsProfileSaving(true);
    try {
      await updatePortalUser(user.uid, {
        name: profileFormData.name,
        photoUrl: profileFormData.photoUrl,
      });
      alert(t('settings.profile.success'));
    } catch (error) {
      console.error('Error saving profile:', error);
      alert(t('settings.profile.error'));
    } finally {
      setIsProfileSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingAvatar(true);
    try {
      const url = await uploadUserProfilePicture(user.uid, file);
      setProfileFormData(prev => ({ ...prev, photoUrl: url }));
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      alert(error.message || t('agency.settings.profile.failedToUpload'));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const removeAvatar = async () => {
    if (!user) return;
    try {
      setProfileFormData(prev => ({ ...prev, photoUrl: '' }));
      await updatePortalUser(user.uid, { photoUrl: '' });
    } catch (error) {
      console.error('Error removing avatar:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-surface-900 dark:text-white font-outfit">
          {t('agency.settings.title')}
        </h1>
        <p className="text-surface-500 dark:text-surface-400 mt-1">
          {t('agency.settings.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <aside className="lg:col-span-1">
          <nav className="space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl transition-colors font-outfit',
                  activeTab === tab.id
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800'
                )}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        <div className="lg:col-span-3 space-y-6">
          {activeTab === 'user-profile' && (
            <Card className="border-surface-200 dark:border-surface-800 shadow-sm">
              <div className="flex items-center gap-3 mb-10">
                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 border border-blue-100 dark:border-blue-900/30">
                  <User size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-surface-900 dark:text-white font-outfit">
                    {t('settings.profile.title')}
                  </h3>
                  <p className="text-[10px] font-black text-surface-400 uppercase tracking-widest mt-0.5">
                    {t('settings.profile.subtitle')}
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Avatar Section */}
                <div className="flex flex-col md:flex-row items-center gap-6 p-6 rounded-3xl bg-surface-50/50 dark:bg-surface-900/30 border border-surface-100 dark:border-surface-800/50">
                  <div className="relative group">
                    <Avatar
                      src={profileFormData.photoUrl}
                      name={profileFormData.name}
                      size="lg"
                      className="w-24 h-24 ring-4 ring-white dark:ring-surface-900 shadow-2xl"
                    />
                    {uploadingAvatar && (
                      <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                      </div>
                    )}
                    <label className="absolute -bottom-1 -end-1 p-2 bg-blue-600 text-white rounded-xl shadow-lg cursor-pointer hover:bg-blue-700 transition-all hover:scale-110 active:scale-95">
                      <Camera size={16} />
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        disabled={uploadingAvatar}
                      />
                    </label>
                  </div>

                  <div className="flex-1 text-center md:text-start">
                    <h4 className="font-bold text-surface-900 dark:text-white mb-1 font-outfit">
                      {t('settings.profile.avatar.title')}
                    </h4>
                    <p className="text-xs text-surface-500 dark:text-surface-400 mb-4 font-medium max-w-xs">
                      {t('settings.profile.avatar.desc')}
                    </p>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 px-4 text-xs font-bold border-surface-200 dark:border-surface-800"
                        onClick={() =>
                          document.querySelector<HTMLInputElement>('input[type="file"]')?.click()
                        }
                      >
                        {profileFormData.photoUrl
                          ? t('settings.profile.avatar.change')
                          : t('settings.profile.avatar.upload')}
                      </Button>
                      {profileFormData.photoUrl && (
                        <button
                          onClick={removeAvatar}
                          className="text-xs font-bold text-rose-500 hover:text-rose-600 px-3 py-2 transition-colors"
                        >
                          {t('settings.profile.avatar.remove')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label={t('settings.profile.name')}
                      value={profileFormData.name}
                      onChange={e =>
                        setProfileFormData({ ...profileFormData, name: e.target.value })
                      }
                      placeholder={t('settings.profile.namePlaceholder')}
                    />
                    <div className="opacity-60 grayscale pointer-events-none">
                      <Input
                        label={t('settings.profile.email')}
                        value={user?.email || ''}
                        readOnly
                        placeholder="email@example.com"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-10 pt-6 border-t border-surface-200 dark:border-surface-800 flex justify-end">
                <Button
                  onClick={handleProfileSave}
                  loading={savingProfile}
                  className="flex items-center gap-2 shadow-xl shadow-blue-500/20 font-outfit px-8"
                >
                  <Save size={18} />
                  {savingProfile ? t('settings.general.saving') : t('settings.profile.save')}
                </Button>
              </div>
            </Card>
          )}

          {activeTab === 'profile' && (
            <Card className="border-surface-200 dark:border-surface-800 shadow-sm">
              <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-6 font-outfit">
                {t('agency.settings.profile.title')}
              </h3>
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Input
                    label={t('agency.settings.profile.nameLabel')}
                    value={profile.name}
                    onChange={e => setProfile({ ...profile, name: e.target.value })}
                    placeholder={t('agency.settings.profile.namePlaceholder')}
                    className="font-outfit"
                  />
                  <Input
                    label={t('agency.settings.profile.emailLabel')}
                    type="email"
                    value={profile.email}
                    onChange={e => setProfile({ ...profile, email: e.target.value })}
                    placeholder={t('agency.settings.profile.emailPlaceholder')}
                    className="font-outfit"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Input
                    label={t('agency.settings.profile.websiteLabel')}
                    type="url"
                    value={profile.website}
                    onChange={e => setProfile({ ...profile, website: e.target.value })}
                    placeholder={t('agency.settings.profile.websitePlaceholder')}
                    className="font-outfit"
                  />
                  <Input
                    label={t('agency.settings.profile.phoneLabel')}
                    type="tel"
                    value={profile.phone}
                    onChange={e => setProfile({ ...profile, phone: e.target.value })}
                    placeholder={t('agency.settings.profile.phonePlaceholder')}
                    className="font-outfit"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-2 font-outfit">
                    {t('agency.settings.profile.descLabel')}
                  </label>
                  <textarea
                    value={profile.description}
                    onChange={e => setProfile({ ...profile, description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-white/10 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none text-surface-900 dark:text-white font-medium"
                    placeholder={t('agency.settings.profile.descPlaceholder')}
                  />
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-surface-200 dark:border-surface-800 flex justify-end">
                <Button
                  onClick={handleSave}
                  loading={saving}
                  className="flex items-center gap-2 shadow-lg shadow-blue-500/20 font-outfit"
                >
                  <Save size={18} />
                  {saving ? t('agency.settings.profile.saving') : t('agency.settings.profile.save')}
                </Button>
              </div>
            </Card>
          )}

          {activeTab === 'branding' && (
            <Card className="border-surface-200 dark:border-surface-800 shadow-sm">
              <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-6 font-outfit">
                {t('settings.branding.title' as any)}
              </h3>
              <p className="text-sm text-surface-500 dark:text-surface-400 mb-8">
                {t('settings.branding.subtitle' as any)}
              </p>

              <div className="space-y-10">
                {/* LOGO SECTION */}
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
                              if (!file || !user) return;
                              try {
                                const url = await uploadAgencyAsset(user.uid, file, 'logo');
                                setProfile({
                                  ...profile,
                                  branding: { ...profile.branding, logoUrl: url },
                                });
                              } catch (err) {
                                console.error('Logo upload failed', err);
                                alert('Upload failed');
                              }
                            }}
                          />
                          <label
                            htmlFor="logo-upload"
                            className="cursor-pointer flex flex-col items-center gap-2 text-surface-500 hover:text-blue-600 transition-colors"
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
                        className="w-4 h-4 rounded border-surface-300 text-blue-600 focus:ring-blue-500"
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
                              if (!file || !user) return;
                              try {
                                const url = await uploadAgencyAsset(user.uid, file, 'icon');
                                setProfile({
                                  ...profile,
                                  branding: { ...profile.branding, iconUrl: url },
                                });
                              } catch (err) {
                                console.error('Icon upload failed', err);
                                alert('Upload failed');
                              }
                            }}
                          />
                          <label
                            htmlFor="icon-upload"
                            className="cursor-pointer flex flex-col items-center gap-2 text-surface-500 hover:text-blue-600 transition-colors"
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

                <div className="h-px bg-surface-100 dark:bg-surface-800" />

                {/* COLOR & STYLE SECTION */}
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
                                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500'
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
                                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500'
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

                <div className="p-6 rounded-2xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800">
                  <h4 className="text-xs font-bold text-surface-400 uppercase tracking-widest mb-6">
                    Live Preview
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
              </div>

              <div className="mt-8 pt-6 border-t border-surface-200 dark:border-surface-800 flex justify-end">
                <Button
                  onClick={handleSave}
                  loading={saving}
                  className="flex items-center gap-2 shadow-lg shadow-blue-500/20 font-outfit"
                >
                  <Save size={18} />
                  {saving ? t('agency.settings.profile.saving') : t('agency.settings.profile.save')}
                </Button>
              </div>
            </Card>
          )}

          {activeTab === 'services' && (
            <Card className="border-surface-200 dark:border-surface-800 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-lg font-bold text-surface-900 dark:text-white font-outfit">
                    {t('agency.settings.tabs.services')}
                  </h3>
                  <p className="text-sm text-surface-500 dark:text-surface-400">
                    {t('agency.settings.services.subtitle')}
                  </p>
                </div>
                <Button
                  size="sm"
                  className="h-10 font-outfit"
                  onClick={() => {
                    setEditingService(undefined);
                    setIsServiceModalOpen(true);
                  }}
                >
                  <Plus size={18} className="me-2" />
                  {t('agency.settings.services.add')}
                </Button>
              </div>

              {loadingServices ? (
                <div className="py-20 flex justify-center">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
              ) : services.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {services.map(service => (
                    <div
                      key={service.id}
                      className={cn(
                        'p-5 rounded-2xl border transition-all hover:shadow-md group',
                        service.isActive
                          ? 'bg-white dark:bg-surface-950 border-surface-200 dark:border-surface-800'
                          : 'bg-surface-50/50 dark:bg-surface-900/30 border-surface-100 dark:border-surface-800/50 opacity-60'
                      )}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 border border-blue-100 dark:border-blue-900/30">
                          <Tag size={18} />
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setEditingService(service);
                              setIsServiceModalOpen(true);
                            }}
                            className="p-2 rounded-lg text-surface-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteService(service.id)}
                            className="p-2 rounded-lg text-surface-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <h4 className="font-bold text-surface-900 dark:text-white font-outfit flex items-center gap-2">
                          {service.name}
                          {!service.isActive && (
                            <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-surface-200 dark:bg-surface-800 text-surface-500">
                              {t('agency.settings.services.inactive')}
                            </span>
                          )}
                        </h4>
                        <p className="text-xs text-surface-500 line-clamp-2 min-h-[2rem]">
                          {service.description || t('common.noDescription' as any)}
                        </p>
                      </div>

                      <div className="mt-6 pt-4 border-t border-surface-100 dark:border-surface-800 flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-surface-400 uppercase tracking-widest">
                            {t('agency.settings.services.basePriceLabel')}
                          </span>
                          <span className="text-sm font-black text-surface-900 dark:text-white font-outfit">
                            {formatCurrency(service.basePrice, service.currency)}
                          </span>
                        </div>
                        {service.category && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-100 dark:bg-surface-800 text-surface-500 dark:text-surface-400 font-outfit">
                            {service.category}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center bg-surface-50/50 dark:bg-surface-900/30 rounded-3xl border-2 border-dashed border-surface-200 dark:border-surface-800">
                  <Tag className="w-12 h-12 text-surface-300 dark:text-surface-700 mx-auto mb-4 opacity-20" />
                  <h4 className="text-lg font-bold text-surface-900 dark:text-white font-outfit mb-1">
                    {t('agency.settings.services.emptyTitle')}
                  </h4>
                  <p className="text-sm text-surface-500 dark:text-surface-400 max-w-sm mx-auto mb-8">
                    {t('agency.settings.services.emptyDesc')}
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingService(undefined);
                      setIsServiceModalOpen(true);
                    }}
                  >
                    {t('agency.settings.services.createFirst')}
                  </Button>
                </div>
              )}
            </Card>
          )}

          {activeTab === 'team' && (
            <Card className="border-surface-200 dark:border-surface-800 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-surface-900 dark:text-white font-outfit">
                    {t('agency.settings.team.title')}
                  </h3>
                  <p className="text-sm text-surface-500 dark:text-surface-400">
                    {t('agency.settings.team.subtitle')}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-10 font-outfit"
                  onClick={() => setIsInviteModalOpen(true)}
                >
                  {t('agency.settings.team.invite')}
                </Button>
              </div>

              {loadingTeam ? (
                <div className="py-12 flex justify-center">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
              ) : team.length > 0 ? (
                <>
                  {/* Mobile View: Cards */}
                  <div className="md:hidden space-y-4">
                    {team.map((member: PortalUser) => (
                      <div
                        key={member.id}
                        className="p-4 rounded-xl bg-surface-50/50 dark:bg-surface-900/30 border border-surface-200 dark:border-surface-800"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <Avatar
                            name={member.name || t('consultations.userFallback' as any)}
                            size="md"
                            className="ring-2 ring-white dark:ring-surface-900 shadow-sm"
                          />
                          <div>
                            <p className="font-bold text-surface-900 dark:text-white font-outfit">
                              {member.name || t('common.unnamedUser' as any)}
                            </p>
                            <p className="text-xs font-bold text-surface-400 uppercase tracking-tight">
                              {member.email}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mb-3 border-t border-surface-100 dark:border-surface-800 pt-3">
                          <span
                            className={cn(
                              'inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border',
                              member.status === 'inactive'
                                ? 'bg-surface-50 dark:bg-surface-900/20 text-surface-600 dark:text-surface-400 border-surface-100 dark:border-surface-800'
                                : member.status === 'suspended'
                                  ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/30'
                                  : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30'
                            )}
                          >
                            {t(`agency.settings.team.${member.status || 'active'}` as never)}
                          </span>
                          <span className="text-[10px] font-bold text-surface-500 uppercase tracking-tighter">
                            {member.createdAt?.toDate
                              ? member.createdAt.toDate().toLocaleDateString()
                              : 'N/A'}
                          </span>
                        </div>

                        <div className="flex justify-end">
                          <button className="text-xs font-bold text-surface-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors uppercase tracking-widest">
                            {t('agency.settings.team.edit')}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop View: Table */}
                  <div className="hidden md:block overflow-hidden rounded-xl border border-surface-100 dark:border-surface-800">
                    <table className="w-full text-start">
                      <thead className="bg-surface-50 dark:bg-surface-900/50 text-[10px] font-black text-surface-400 uppercase tracking-widest">
                        <tr>
                          <th className="px-6 py-4">{t('agency.settings.team.table.member')}</th>
                          <th className="px-6 py-4">{t('agency.settings.team.table.status')}</th>
                          <th className="px-6 py-4">{t('agency.settings.team.table.joined')}</th>
                          <th className="px-6 py-4 text-end">
                            {t('agency.settings.team.table.action')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                        {team.map((member: PortalUser) => (
                          <tr
                            key={member.id}
                            className="hover:bg-surface-50/50 dark:hover:bg-surface-800/20 transition-all group"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <Avatar
                                  name={member.name || t('consultations.userFallback' as any)}
                                  size="sm"
                                  className="ring-2 ring-white dark:ring-surface-900 shadow-sm"
                                />
                                <div>
                                  <p className="text-sm font-bold text-surface-900 dark:text-white font-outfit">
                                    {member.name || t('common.unnamedUser' as any)}
                                  </p>
                                  <p className="text-[10px] font-bold text-surface-400 uppercase tracking-tight">
                                    {member.email}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={cn(
                                  'inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border',
                                  member.status === 'inactive'
                                    ? 'bg-surface-50 dark:bg-surface-900/20 text-surface-600 dark:text-surface-400 border-surface-100 dark:border-surface-800'
                                    : member.status === 'suspended'
                                      ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/30'
                                      : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30'
                                )}
                              >
                                {t(`agency.settings.team.${member.status || 'active'}` as never)}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-[10px] font-bold text-surface-500 uppercase tracking-tighter">
                                {member.createdAt?.toDate
                                  ? member.createdAt.toDate().toLocaleDateString()
                                  : 'N/A'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-end">
                              <button className="text-xs font-bold text-surface-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors uppercase tracking-widest">
                                {t('agency.settings.team.edit')}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="py-12 text-center opacity-30">
                  <User className="w-12 h-12 text-surface-300 dark:text-surface-700 mx-auto mb-3" />
                  <p className="text-[10px] font-black uppercase tracking-widest">
                    {t('agency.settings.team.noMembers')}
                  </p>
                </div>
              )}

              {/* Pending Invites Section */}
              <div className="mt-10">
                <CardSectionTitle
                  as="h4"
                  icon={User}
                  iconClassName="text-blue-500"
                  className="mb-4 px-1"
                >
                  {t('agency.settings.team.pendingInvites')}
                </CardSectionTitle>

                {invites.length > 0 ? (
                  <div className="space-y-3">
                    {invites.map(invite => (
                      <div
                        key={invite.id}
                        className="p-4 rounded-xl bg-surface-50 dark:bg-surface-900 border border-surface-100 dark:border-surface-800 flex items-center justify-between"
                      >
                        <div>
                          <p className="text-sm font-bold text-surface-900 dark:text-white font-outfit">
                            {invite.email}
                          </p>
                          <p className="text-[10px] font-bold text-surface-400 uppercase tracking-tight">
                            {invite.role}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-[10px] font-bold text-surface-400 uppercase tracking-tighter">
                            {invite.createdAt?.toDate
                              ? invite.createdAt.toDate().toLocaleDateString()
                              : t('common.sentRecently' as any)}
                          </span>
                          <button
                            onClick={() => handleCancelInvite(invite.id)}
                            disabled={cancellingInvite === invite.id}
                            className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:text-rose-600 disabled:opacity-50"
                          >
                            {cancellingInvite === invite.id
                              ? '...'
                              : t('agency.settings.team.cancelInvite')}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center bg-surface-50/50 dark:bg-surface-900/30 rounded-xl border border-dashed border-surface-200 dark:border-surface-800">
                    <p className="text-[10px] font-black text-surface-400 uppercase tracking-widest">
                      No pending invitations
                    </p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {activeTab === 'integrations' && (
            <div className="space-y-6">
              <Card className="border-surface-200 dark:border-surface-800 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 border border-purple-100 dark:border-purple-900/30">
                    <Zap size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-surface-900 dark:text-white font-outfit">
                      {t('agency.settings.tabs.integrations')}
                    </h3>
                    <p className="text-[10px] font-black text-surface-400 uppercase tracking-widest mt-0.5">
                      {t('agency.settings.integrations.subtitle')}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Google Calendar Integration */}
                  <GoogleCalendarIntegration
                    connection={calendarConnection}
                    onConnect={async () => {
                      if (!isGoogleCalendarConfigured()) {
                        alert(
                          'Google Calendar integration requires configuration. Please add NEXT_PUBLIC_GOOGLE_CLIENT_ID to your environment variables.'
                        );
                        return;
                      }
                      initiateGoogleOAuth();
                    }}
                    onDisconnect={async () => {
                      await disconnectCalendar();
                      setCalendarConnection(null);
                    }}
                    onSync={async () => {
                      // Refresh connection status
                      const connection = await getCalendarConnection();
                      setCalendarConnection(connection);
                    }}
                  />

                  {/* Coming Soon - Slack */}
                  <IntegrationCard
                    title={t('agency.settings.integrations.slack.title')}
                    description={
                      t('agency.settings.integrations.slack.description') ||
                      'Get notifications in your Slack workspace'
                    }
                    icon={MessageSquare}
                    iconGradient="from-purple-500 to-pink-500"
                    comingSoon
                  />

                  {/* Coming Soon - Stripe */}
                  <IntegrationCard
                    title={t('agency.settings.integrations.stripe.title')}
                    description={t('agency.settings.integrations.stripe.description')}
                    icon={CreditCard}
                    iconGradient="from-indigo-500 to-purple-600"
                    comingSoon
                  />
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'billing' && (
            <Card className="border-surface-200 dark:border-surface-800 shadow-sm">
              <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-4 font-outfit">
                {t('agency.settings.tabs.billing')}
              </h3>
              <p className="text-sm text-surface-500 dark:text-surface-400 mb-6 underline-offset-4">
                Configure payment methods and billing information.
              </p>
              <div className="py-12 text-center opacity-40">
                <CreditCard className="w-12 h-12 text-surface-300 dark:text-surface-700 mx-auto mb-3" />
                <p className="text-[10px] font-black uppercase tracking-widest text-surface-500 dark:text-surface-400">
                  Billing configuration coming soon
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {isInviteModalOpen && (
        <InviteTeamMemberForm
          isAgency={true}
          onSuccess={handleInviteSuccess}
          onCancel={() => setIsInviteModalOpen(false)}
        />
      )}

      {isServiceModalOpen && (
        <ManageServiceForm
          service={editingService}
          onSuccess={handleServiceSuccess}
          onCancel={() => {
            setIsServiceModalOpen(false);
            setEditingService(undefined);
          }}
        />
      )}
    </div>
  );
}
