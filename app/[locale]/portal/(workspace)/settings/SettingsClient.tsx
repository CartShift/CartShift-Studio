'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Bell,
  Shield,
  CreditCard,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Building2,
  User as UserIcon,
} from 'lucide-react';
import { CreateOrganizationForm } from '@/components/portal/forms/CreateOrganizationForm';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { PortalPageHeader } from '@/components/portal/ui/PortalPageHeader';
import {
  ClientSettingsNav,
  isClientSettingsTab,
  type ClientSettingsTabId,
} from '@/components/portal/settings/ClientSettingsNav';
import { useOrg } from '@/lib/context/OrgContext';
import { useResolvedOrgId } from '@/lib/hooks/useResolvedOrgId';
import { useWorkspaceSettings } from '@/lib/hooks/useWorkspaceSettings';
import { getPortalPath } from '@/lib/utils/portal-paths';
import {
  GeneralSettingsTab,
  type OrganizationFormData,
} from '@/components/portal/settings/workspace/GeneralSettingsTab';
import { ProfileSettingsTab } from '@/components/portal/settings/workspace/ProfileSettingsTab';
import {
  NotificationSettingsTab,
  type NotificationPrefs,
} from '@/components/portal/settings/workspace/NotificationSettingsTab';
import { SecuritySettingsTab } from '@/components/portal/settings/workspace/SecuritySettingsTab';
import { BillingSettingsTab } from '@/components/portal/settings/workspace/BillingSettingsTab';

const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  emailOnRequestUpdate: true,
  emailOnNewComment: true,
  emailOnStatusChange: true,
  marketingEmails: false,
};

export default function SettingsClient() {
  const orgId = useResolvedOrgId();
  const { switchOrg } = useOrg();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const initialTab: ClientSettingsTabId = isClientSettingsTab(tabFromUrl) ? tabFromUrl : 'general';
  const { user, userData } = usePortalAuth();
  const t = useTranslations('portal');
  const [activeTab, setActiveTab] = useState<ClientSettingsTabId>(initialTab);
  const [showCreateOrgModal, setShowCreateOrgModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    organization,
    loading,
    error: orgError,
    orgToFormData,
    updateOrganization,
    isSavingOrg,
    updateUser,
    isUpdatingUser,
    uploadAvatar,
    isUploadingAvatar,
    deleteAvatar,
    uploadLogo,
    isUploadingLogo,
    deleteLogo,
    regenerateLogo,
    resetPassword,
    isResettingPassword,
    refetchOrganization,
  } = useWorkspaceSettings(typeof orgId === 'string' ? orgId : undefined);

  const [formData, setFormData] = useState<OrganizationFormData>({
    name: '',
    website: '',
    industry: '',
    bio: '',
    billingName: '',
    billingEmail: '',
    billingTaxId: '',
    billingAddressLine1: '',
    billingAddressLine2: '',
    billingCity: '',
    billingCountry: '',
    billingPostalCode: '',
  });

  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPrefs>(DEFAULT_NOTIFICATION_PREFS);

  const [resetSent, setResetSent] = useState(false);
  const [restartingOnboarding, setRestartingOnboarding] = useState(false);
  const [profileFormData, setProfileFormData] = useState({ name: '', photoUrl: '' });

  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const orgSyncedRef = useRef<string | null>(null);

  const selectTab = (tabId: ClientSettingsTabId) => {
    setActiveTab(tabId);
    router.replace(`${pathname}?tab=${tabId}`, { scroll: false });
  };

  useEffect(() => {
    const urlTab = searchParams.get('tab');
    if (isClientSettingsTab(urlTab) && urlTab !== activeTab) {
      setActiveTab(urlTab);
    }
  }, [searchParams, activeTab]);

  const userName = useMemo(() => userData?.name || '', [userData?.name]);
  const userPhotoUrl = useMemo(() => userData?.photoUrl || '', [userData?.photoUrl]);

  const showFeedback = useCallback((type: 'success' | 'error', message: string) => {
    if (type === 'success') {
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
      setSuccessMessage(message);
      successTimeoutRef.current = setTimeout(() => setSuccessMessage(null), 5000);
    } else {
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
      setErrorMessage(message);
      errorTimeoutRef.current = setTimeout(() => setErrorMessage(null), 5000);
    }
  }, []);

  useEffect(() => {
    if (!organization) {
      if (!loading && orgId && orgSyncedRef.current !== orgId) {
        orgSyncedRef.current = orgId as string;
        if (orgError?.includes('permission') || orgError?.includes('denied')) {
          showFeedback('error', t('settings.general.permissionDenied'));
          setTimeout(() => router.push(getPortalPath('/')), 2000);
        } else if (!loading) {
          showFeedback('error', t('settings.general.orgNotFound'));
        }
      }
      return;
    }

    if (orgSyncedRef.current !== organization.id) {
      orgSyncedRef.current = organization.id;
      setFormData(orgToFormData(organization));
    }
  }, [organization, loading, orgId, orgError, orgToFormData, router, showFeedback, t]);

  useEffect(() => {
    if (!userData) return;
    setProfileFormData(prev => {
      if (prev.name === userName && prev.photoUrl === userPhotoUrl) return prev;
      return { name: userName, photoUrl: userPhotoUrl };
    });
    if (userData.notificationPreferences) {
      setNotificationPrefs(prev => {
        const next = { ...DEFAULT_NOTIFICATION_PREFS, ...userData.notificationPreferences };
        if (
          prev.emailOnRequestUpdate === next.emailOnRequestUpdate &&
          prev.emailOnNewComment === next.emailOnNewComment &&
          prev.emailOnStatusChange === next.emailOnStatusChange &&
          prev.marketingEmails === next.marketingEmails
        ) {
          return prev;
        }
        return next;
      });
    }
  }, [userName, userPhotoUrl, userData]);

  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    };
  }, []);

  const handleSave = async () => {
    if (!orgId || typeof orgId !== 'string') return;
    if (orgId === 'default-org') {
      showFeedback('error', t('settings.general.error'));
      return;
    }

    try {
      await updateOrganization({ data: formData, silent: true });
      showFeedback('success', t('settings.general.success'));
    } catch (error: unknown) {
      console.error('Error saving settings:', error);
      showFeedback('error', error instanceof Error ? error.message : t('settings.general.error'));
    }
  };

  const handleSaveNotificationPrefs = async (newPrefs: NotificationPrefs) => {
    if (!user) return;
    try {
      await updateUser({ userId: user.uid, data: { notificationPreferences: newPrefs }, silent: true });
      setNotificationPrefs(newPrefs);
    } catch (error) {
      console.error('Error saving notification preferences:', error);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    try {
      await resetPassword(user.email);
      setResetSent(true);
      setTimeout(() => setResetSent(false), 5000);
    } catch (error) {
      console.error('Error sending reset email:', error);
      showFeedback('error', t('settings.security.changePassword.error'));
    }
  };

  const handleRestartOnboarding = async () => {
    if (!user) return;
    setRestartingOnboarding(true);
    try {
      await updateUser({
        userId: user.uid,
        data: { onboardingComplete: false, onboardingSkipped: false },
        silent: true,
      });
      showFeedback('success', t('settings.general.onboarding.success'));
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      console.error('Error restarting onboarding:', error);
      showFeedback('error', t('settings.general.onboarding.error'));
    } finally {
      setRestartingOnboarding(false);
    }
  };

  const tabs = [
    { id: 'general' as const, label: t('settings.tabs.general'), icon: Building2 },
    { id: 'profile' as const, label: t('settings.tabs.profile'), icon: UserIcon },
    { id: 'notifications' as const, label: t('settings.tabs.notifications'), icon: Bell },
    { id: 'security' as const, label: t('settings.tabs.security'), icon: Shield },
    { id: 'billing' as const, label: t('settings.tabs.billing'), icon: CreditCard },
  ];

  const handleProfileSave = async () => {
    if (!user) return;
    try {
      await updateUser({
        userId: user.uid,
        data: { name: profileFormData.name, photoUrl: profileFormData.photoUrl },
        silent: true,
      });
      showFeedback('success', t('settings.profile.success'));
    } catch (error) {
      console.error('Error saving profile:', error);
      showFeedback('error', t('settings.profile.error'));
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      showFeedback('error', t('settings.profile.avatar.sizeError'));
      return;
    }

    try {
      const url = await uploadAvatar({ userId: user.uid, file });
      setProfileFormData(prev => ({ ...prev, photoUrl: url }));
      showFeedback('success', t('settings.profile.avatar.uploadSuccess'));
    } catch (error) {
      console.error('Error uploading avatar:', error);
      showFeedback('error', t('settings.profile.avatar.uploadError'));
    }
  };

  const removeAvatar = async () => {
    if (!user || !profileFormData.photoUrl) return;
    try {
      await deleteAvatar({ userId: user.uid, photoUrl: profileFormData.photoUrl });
      setProfileFormData(prev => ({ ...prev, photoUrl: '' }));
      showFeedback('success', t('settings.profile.avatar.removeSuccess'));
    } catch (error) {
      console.error('Error removing avatar:', error);
      showFeedback('error', t('settings.profile.avatar.removeError'));
    }
  };

  const handleLogoError = async () => {
    if (!organization?.logoUrl || !orgId || typeof orgId !== 'string') return;
    try {
      await regenerateLogo({ orgId, logoUrl: organization.logoUrl });
    } catch (error) {
      console.warn('Failed to regenerate logo URL:', error);
    }
  };

  const handleOrgLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !orgId || typeof orgId !== 'string') return;

    if (file.size > 2 * 1024 * 1024) {
      showFeedback('error', t('settings.general.logo.sizeError'));
      return;
    }

    try {
      await uploadLogo({ orgId, file });
      showFeedback('success', t('settings.general.logo.uploadSuccess'));
    } catch (error) {
      console.error('Error uploading org logo:', error);
      showFeedback('error', t('settings.general.logo.uploadError'));
    }
  };

  const removeOrgLogo = async () => {
    if (!orgId || typeof orgId !== 'string' || !organization?.logoUrl) return;
    try {
      await deleteLogo({ orgId, logoUrl: organization.logoUrl });
      showFeedback('success', t('settings.general.logo.removeSuccess'));
    } catch (error) {
      console.error('Error removing org logo:', error);
      showFeedback('error', t('settings.general.logo.removeError'));
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 space-y-4">
        <Loader2 className="w-8 h-8 text-primary-600 dark:text-primary-400 animate-spin" />
        <p className="portal-label-sm">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PortalPageHeader
        title={t('settings.title')}
        description={t('settings.subtitle')}
        className="mb-0"
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <aside className="lg:col-span-1">
          <ClientSettingsNav tabs={tabs} activeTab={activeTab} onSelect={selectTab} />
        </aside>

        <div className="lg:col-span-3 space-y-6">
          {successMessage && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl flex items-center gap-3 text-emerald-600 dark:text-emerald-400 text-sm font-bold animate-in slide-in-from-top-2 duration-300">
              <CheckCircle2 size={18} />
              {successMessage}
            </div>
          )}
          {errorMessage && (
            <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 text-sm font-bold animate-in slide-in-from-top-2 duration-300">
              <AlertCircle size={18} />
              {errorMessage}
            </div>
          )}

          {activeTab === 'general' && (
            <GeneralSettingsTab
              formData={formData}
              setFormData={setFormData}
              organization={organization}
              orgId={orgId}
              saving={isSavingOrg}
              uploadingOrgLogo={isUploadingLogo}
              restartingOnboarding={restartingOnboarding}
              onSave={handleSave}
              onOrgLogoUpload={handleOrgLogoUpload}
              onRemoveOrgLogo={removeOrgLogo}
              onLogoError={handleLogoError}
              onCreateOrg={() => setShowCreateOrgModal(true)}
              onRestartOnboarding={handleRestartOnboarding}
              onOrganizationRefresh={refetchOrganization}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileSettingsTab
              profileFormData={profileFormData}
              setProfileFormData={setProfileFormData}
              userEmail={user?.email ?? undefined}
              saving={isUpdatingUser}
              uploadingAvatar={isUploadingAvatar}
              onSave={handleProfileSave}
              onAvatarUpload={handleAvatarUpload}
              onRemoveAvatar={removeAvatar}
            />
          )}

          {activeTab === 'notifications' && (
            <NotificationSettingsTab
              notificationPrefs={notificationPrefs}
              syncing={isUpdatingUser}
              onSave={handleSaveNotificationPrefs}
            />
          )}

          {activeTab === 'security' && (
            <SecuritySettingsTab
              userEmail={user?.email ?? undefined}
              providerId={user?.providerData[0]?.providerId}
              resetSent={resetSent}
              resettingPassword={isResettingPassword}
              onPasswordReset={handlePasswordReset}
            />
          )}

          {activeTab === 'billing' && (
            <BillingSettingsTab organization={organization} orgName={formData.name} />
          )}
        </div>
      </div>

      {showCreateOrgModal && (
        <CreateOrganizationForm
          onSuccess={newOrgId => {
            setShowCreateOrgModal(false);
            switchOrg(newOrgId);
            router.push(getPortalPath('/dashboard/'));
          }}
          onCancel={() => setShowCreateOrgModal(false)}
        />
      )}
    </div>
  );
}
