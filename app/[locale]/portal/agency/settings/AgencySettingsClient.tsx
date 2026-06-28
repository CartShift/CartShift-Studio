'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Shield,
  CreditCard,
  Loader2,
  User,
  Palette,
  Building2,
  Settings,
} from 'lucide-react';
import { applyTheme } from '@/lib/utils/theme-generator';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { updatePortalUser } from '@/lib/services/portal-users';
import { uploadUserProfilePicture } from '@/lib/services/portal-uploads';
import { Agency } from '@/lib/types/portal';
import { useAgencyProfile } from '@/lib/hooks/useAgencyProfile';
import { useAgencyTeam } from '@/lib/hooks/useAgencyTeam';
import { useAgencyInvites } from '@/lib/hooks/useAgencyInvites';
import { useAgencyServices } from '@/lib/hooks/useAgencyServices';
import { useAgencySettingsMutations } from '@/lib/hooks/useAgencySettingsMutations';
import { useTeamMutations } from '@/lib/hooks/useTeamMutations';
import { useConfirmDialog } from '@/lib/hooks/useConfirmDialog';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { InviteTeamMemberForm } from '@/components/portal/forms/InviteTeamMemberForm';
import { ManageServiceForm } from '@/components/portal/forms/ManageServiceForm';
import { Service } from '@/lib/types/portal';
import { Tag } from 'lucide-react';
import { CalendarConnection } from '@/components/portal/integrations';
import { getCalendarConnection } from '@/lib/services/portal-google-calendar';
import { useSystemSettings } from '@/lib/hooks/useSystemSettings';
import {
  AgencyBrandingSettings,
  type AgencyBrandingProfile,
} from '@/components/portal/settings/AgencyBrandingSettings';
import {
  AgencySettingsNav,
  isAgencySettingsTab,
  type AgencySettingsTabId,
} from '@/components/portal/settings/AgencySettingsNav';
import { ProfileSettingsTab } from '@/components/portal/settings/workspace/ProfileSettingsTab';
import { AgencyProfileSettingsTab } from '@/components/portal/settings/agency/AgencyProfileSettingsTab';
import { AgencySystemSettingsTab } from '@/components/portal/settings/agency/AgencySystemSettingsTab';
import { AgencyServicesSettingsTab } from '@/components/portal/settings/agency/AgencyServicesSettingsTab';
import { AgencyTeamSettingsTab } from '@/components/portal/settings/agency/AgencyTeamSettingsTab';
import { AgencyIntegrationsSettingsTab } from '@/components/portal/settings/agency/AgencyIntegrationsSettingsTab';
import { AgencyBillingSettingsTab } from '@/components/portal/settings/agency/AgencyBillingSettingsTab';
import { useRouter, usePathname } from '@/i18n/navigation';

type AgencyProfile = AgencyBrandingProfile;

export default function AgencySettingsClient() {
  const t = useTranslations('portal');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const initialTab: AgencySettingsTabId = isAgencySettingsTab(tabFromUrl) ? tabFromUrl : 'profile';
  const [activeTab, setActiveTab] = useState<AgencySettingsTabId>(initialTab);
  const { user } = usePortalAuth();
  const { agency, loading: agencyLoading } = useAgencyProfile();
  const { data: team = [], isLoading: loadingTeam, refetch: refetchTeam } = useAgencyTeam();
  const { invites } = useAgencyInvites({ enabled: activeTab === 'team' });
  const { services, loading: loadingServices } = useAgencyServices({
    enabled: activeTab === 'services',
  });
  const {
    updateProfile,
    updateBranding,
    deleteService: deleteServiceMutation,
    isSavingProfile: saving,
    isDeletingService,
  } = useAgencySettingsMutations(user?.uid);
  const { cancelInvite, isCancellingInvite } = useTeamMutations();
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [profile, setProfile] = useState<AgencyProfile>({
    name: '',
    email: '',
    website: '',
    phone: '',
    description: '',
    branding: { primaryColor: '', accentColor: '' },
  });
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | undefined>(undefined);
  const [calendarConnection, setCalendarConnection] = useState<CalendarConnection | null>(null);
  const [cancellingInviteId, setCancellingInviteId] = useState<string | null>(null);
  const [profileFormData, setProfileFormData] = useState({ name: '', photoUrl: '' });
  const [savingProfile, setIsProfileSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const { settings: systemSettings, updateSettings: updateSystemSettings } = useSystemSettings();

  const selectTab = (tabId: AgencySettingsTabId) => {
    setActiveTab(tabId);
    router.replace(`${pathname}?tab=${tabId}`, { scroll: false });
  };

  useEffect(() => {
    const urlTab = searchParams.get('tab');
    if (isAgencySettingsTab(urlTab) && urlTab !== activeTab) {
      setActiveTab(urlTab);
    }
  }, [searchParams, activeTab]);

  useEffect(() => {
    if (!agency) return;

    setProfile({
      name: agency.name || '',
      email: agency.email || '',
      website: agency.website || '',
      phone: agency.contactInfo?.phone || '',
      description: '',
      branding: {
        primaryColor: agency.branding?.primaryColor || '',
        accentColor: agency.branding?.accentColor || '',
        logoUrl: agency.logoUrl,
        iconUrl: agency.iconUrl,
      },
    });

    if (agency.branding) {
      const { primaryColor, accentColor } = agency.branding;
      applyTheme(primaryColor, accentColor, undefined, undefined, undefined);
    }
  }, [agency]);

  useEffect(() => {
    if (user) {
      setProfileFormData({
        name: user.displayName || '',
        photoUrl: user.photoURL || '',
      });
    }
  }, [user]);

  useEffect(() => {
    if (activeTab !== 'integrations') return;

    let mounted = true;
    getCalendarConnection().then(connection => {
      if (mounted) setCalendarConnection(connection);
    });

    return () => {
      mounted = false;
    };
  }, [activeTab]);

  const handleCancelInvite = async (inviteId: string) => {
    const confirmed = await confirm({
      title: t('common.confirm'),
      description: t('common.deleteConfirm'),
      confirmText: t('agency.settings.team.cancelInvite'),
      cancelText: t('common.cancel'),
      variant: 'danger',
    });
    if (!confirmed) return;

    setCancellingInviteId(inviteId);
    cancelInvite(inviteId, { onSettled: () => setCancellingInviteId(null) });
  };

  const handleSave = async () => {
    if (!user?.uid) return;

    try {
      const data: Partial<Exclude<Agency, 'id'>> = {
        name: profile.name,
        email: profile.email,
        website: profile.website,
        contactInfo: { phone: profile.phone },
        logoUrl: profile.branding?.logoUrl,
        iconUrl: profile.branding?.iconUrl,
        branding: {
          primaryColor: profile.branding?.primaryColor,
          accentColor: profile.branding?.accentColor,
        },
      };

      await updateProfile(data);

      if (profile.branding) {
        try {
          await updateBranding({ branding: profile.branding, userId: user.uid });
        } catch (globalError) {
          console.warn('Failed to update global branding:', globalError);
        }

        localStorage.setItem('agency_branding_primary', profile.branding.primaryColor || '');
        localStorage.setItem('agency_branding_accent', profile.branding.accentColor || '');
        const fontEn = profile.branding.fontFamilyEn || profile.branding.fontFamily;
        if (fontEn) localStorage.setItem('agency_branding_font_en', fontEn);
        if (profile.branding.fontFamilyHe)
          localStorage.setItem('agency_branding_font_he', profile.branding.fontFamilyHe);
        if (profile.branding.borderRadius)
          localStorage.setItem('agency_branding_radius', profile.branding.borderRadius);
      }

      applyTheme(
        profile.branding?.primaryColor,
        profile.branding?.accentColor,
        profile.branding?.fontFamilyEn || profile.branding?.fontFamily,
        profile.branding?.borderRadius,
        profile.branding?.fontFamilyHe
      );
    } catch (error) {
      console.error('Error saving agency profile:', error);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    const confirmed = await confirm({
      title: t('common.confirm'),
      description: t('common.deleteConfirm'),
      confirmText: t('common.delete'),
      cancelText: t('common.cancel'),
      variant: 'danger',
      isLoading: isDeletingService,
    });
    if (!confirmed) return;

    try {
      await deleteServiceMutation(serviceId);
    } catch (error) {
      console.error('Error deleting service:', error);
    }
  };

  const handleProfileSave = async () => {
    if (!user) return;
    setIsProfileSaving(true);
    try {
      await updatePortalUser(user.uid, {
        name: profileFormData.name,
        photoUrl: profileFormData.photoUrl,
      });
      toast.success(t('settings.profile.success'));
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error(t('settings.profile.error'));
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
    } catch (error: unknown) {
      console.error('Error uploading avatar:', error);
      toast.error(
        error instanceof Error ? error.message : t('agency.settings.profile.failedToUpload')
      );
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

  const tabs = [
    { id: 'profile' as const, label: t('agency.settings.tabs.profile'), icon: Building2 },
    { id: 'branding' as const, label: t('settings.tabs.branding' as any), icon: Palette },
    { id: 'user-profile' as const, label: t('settings.tabs.profile'), icon: User },
    { id: 'services' as const, label: t('agency.settings.tabs.services'), icon: Tag },
    { id: 'team' as const, label: t('agency.settings.tabs.team'), icon: User },
    { id: 'integrations' as const, label: t('agency.settings.tabs.integrations'), icon: Shield },
    { id: 'billing' as const, label: t('agency.settings.tabs.billing'), icon: CreditCard },
    { id: 'system' as const, label: t('agency.settings.tabs.system'), icon: Settings },
  ];

  const settingsNavGroups = [
    {
      label: t('agency.settings.navGroups.organization'),
      tabIds: ['profile', 'branding', 'system'] as const,
    },
    {
      label: t('agency.settings.navGroups.account'),
      tabIds: ['user-profile'] as const,
    },
    {
      label: t('agency.settings.navGroups.operations'),
      tabIds: ['services', 'team', 'integrations', 'billing'] as const,
    },
  ];

  if (agencyLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary-600 dark:text-primary-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {ConfirmDialog}
      <div>
        <h1 className="portal-page-title">{t('agency.settings.title')}</h1>
        <p className="portal-page-subtitle">{t('agency.settings.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <aside className="lg:col-span-1">
          <AgencySettingsNav
            tabs={tabs}
            groups={settingsNavGroups.map(group => ({
              label: group.label,
              tabIds: [...group.tabIds],
            }))}
            activeTab={activeTab}
            onSelect={selectTab}
          />
        </aside>

        <div className="lg:col-span-3 space-y-6">
          {activeTab === 'user-profile' && (
            <ProfileSettingsTab
              profileFormData={profileFormData}
              setProfileFormData={setProfileFormData}
              userEmail={user?.email ?? undefined}
              saving={savingProfile}
              uploadingAvatar={uploadingAvatar}
              onSave={handleProfileSave}
              onAvatarUpload={handleAvatarUpload}
              onRemoveAvatar={removeAvatar}
            />
          )}

          {activeTab === 'system' && (
            <AgencySystemSettingsTab
              settings={systemSettings}
              onUpdate={updateSystemSettings}
            />
          )}

          {activeTab === 'profile' && (
            <AgencyProfileSettingsTab
              profile={profile}
              setProfile={setProfile}
              saving={saving}
              onSave={handleSave}
            />
          )}

          {activeTab === 'branding' && (
            <AgencyBrandingSettings
              profile={profile}
              setProfile={setProfile}
              userUid={user?.uid}
              saving={saving}
              onSave={handleSave}
            />
          )}

          {activeTab === 'services' && (
            <AgencyServicesSettingsTab
              services={services}
              loading={loadingServices}
              onAdd={() => {
                setEditingService(undefined);
                setIsServiceModalOpen(true);
              }}
              onEdit={service => {
                setEditingService(service);
                setIsServiceModalOpen(true);
              }}
              onDelete={handleDeleteService}
            />
          )}

          {activeTab === 'team' && (
            <AgencyTeamSettingsTab
              team={team}
              invites={invites}
              loading={loadingTeam}
              cancellingInviteId={cancellingInviteId}
              isCancellingInvite={isCancellingInvite}
              onInvite={() => setIsInviteModalOpen(true)}
              onCancelInvite={handleCancelInvite}
            />
          )}

          {activeTab === 'integrations' && (
            <AgencyIntegrationsSettingsTab
              calendarConnection={calendarConnection}
              setCalendarConnection={setCalendarConnection}
            />
          )}

          {activeTab === 'billing' && <AgencyBillingSettingsTab />}
        </div>
      </div>

      {isInviteModalOpen && (
        <InviteTeamMemberForm
          isAgency
          onSuccess={() => {
            setIsInviteModalOpen(false);
            if (activeTab === 'team') void refetchTeam();
          }}
          onCancel={() => setIsInviteModalOpen(false)}
        />
      )}

      {isServiceModalOpen && (
        <ManageServiceForm
          service={editingService}
          onSuccess={() => {
            setIsServiceModalOpen(false);
            setEditingService(undefined);
          }}
          onCancel={() => {
            setIsServiceModalOpen(false);
            setEditingService(undefined);
          }}
        />
      )}
    </div>
  );
}
