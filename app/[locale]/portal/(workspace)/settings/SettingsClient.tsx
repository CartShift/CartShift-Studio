'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { PortalCard } from '@/components/portal/ui/PortalCard';
import { PortalInput } from '@/components/portal/ui/PortalInput';
import { PortalButton } from '@/components/portal/ui/PortalButton';
import { PortalBadge } from '@/components/portal/ui/PortalBadge';
import {
  Bell,
  Shield,
  CreditCard,
  Save,
  Loader2,
  Trash2,
  Plus,
  CheckCircle2,
  ShieldCheck,
  Building2,
  AlertCircle,
  RefreshCw,
  User as UserIcon,
  Camera,
} from 'lucide-react';
import { PortalAvatar } from '@/components/portal/ui/PortalAvatar';
import { cn } from '@/lib/utils';
import { getOrganization, updateOrganization } from '@/lib/services/portal-organizations';
import { updatePortalUser } from '@/lib/services/portal-users';
import { Organization } from '@/lib/types/portal';
import {
  uploadUserProfilePicture,
  deleteUserProfilePicture,
  uploadOrganizationLogo,
  deleteOrganizationLogo,
  regenerateOrganizationLogoUrl,
  validateStorageRules,
} from '@/lib/services/portal-uploads';
import { resetPassword } from '@/lib/services/auth';
import { CreateOrganizationForm } from '@/components/portal/forms/CreateOrganizationForm';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { PortalSwitch } from '@/components/portal/ui/PortalSwitch';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useOrg } from '@/lib/context/OrgContext';
import { useResolvedOrgId } from '@/lib/hooks/useResolvedOrgId';
import { ShopifyStoreIntegration } from '@/components/portal/integrations';
import { getPortalPath } from '@/lib/utils/portal-paths';

export default function SettingsClient() {
  const orgId = useResolvedOrgId();
  const { switchOrg } = useOrg();
  const router = useRouter();
  const { user, userData } = usePortalAuth();
  const t = useTranslations();
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [showCreateOrgModal, setShowCreateOrgModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    website: '',
    industry: '',
    bio: '',
  });

  const [notificationPrefs, setNotificationPrefs] = useState({
    emailOnRequestUpdate: true,
    emailOnNewComment: true,
    emailOnStatusChange: true,
    marketingEmails: false,
  });

  const [notifSaving, setNotifSaving] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [restartingOnboarding, setRestartingOnboarding] = useState(false);
  const [profileFormData, setProfileFormData] = useState({
    name: '',
    photoUrl: '',
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingOrgLogo, setUploadingOrgLogo] = useState(false);

  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showFeedback = useCallback((type: 'success' | 'error', message: string) => {
    if (type === 'success') {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
      setSuccessMessage(message);
      successTimeoutRef.current = setTimeout(() => setSuccessMessage(null), 5000);
    } else {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
      setErrorMessage(message);
      errorTimeoutRef.current = setTimeout(() => setErrorMessage(null), 5000);
    }
  }, []);

  useEffect(() => {
    let redirectTimeout: NodeJS.Timeout | undefined;
    let mounted = true;

    async function fetchOrganization(): Promise<void> {
      if (!orgId || typeof orgId !== 'string') return;

      setLoading(true);

      const rulesValid = await validateStorageRules();
      if (!rulesValid) {
        console.warn(
          '🔥 [DEBUG] Storage rules validation failed - this may cause permission errors'
        );
      }

      try {
        const org = await getOrganization(orgId);
        if (!mounted) return;

        if (org) {
          if (org.logoUrl) {
            try {
              const urlObj = new URL(org.logoUrl);
              const isPublicUrl =
                urlObj.searchParams.has('alt') && !urlObj.searchParams.has('token');
              const isBrokenUrl =
                urlObj.hostname === 'firebasestorage.googleapis.com' && isPublicUrl;

              if (isBrokenUrl) {
                const regeneratedUrl = await regenerateOrganizationLogoUrl(
                  orgId,
                  org.logoUrl,
                  true
                );
                if (regeneratedUrl) {
                  org.logoUrl = regeneratedUrl;
                }
              }
            } catch (error) {
              console.warn('Failed to regenerate logo URL:', error);
            }
          }
          setOrganization(org);
          setFormData({
            name: org.name || '',
            website: org.website || '',
            industry: org.industry || '',
            bio: org.bio || '',
          });
        } else {
          const errorMsg = t('portal.settings.general.orgNotFound');
          showFeedback(
            'error',
            typeof errorMsg === 'string' && errorMsg !== 'portal.settings.general.orgNotFound'
              ? errorMsg
              : t('portal.common.organizationNotFound')
          );
        }
      } catch (error: unknown) {
        if (!mounted) return;

        const firestoreError = error as { code?: string; message?: string };
        if (firestoreError.code === 'permission-denied') {
          const errorMsg = t('portal.settings.general.permissionDenied');
          const message =
            typeof errorMsg === 'string' && errorMsg !== 'portal.settings.general.permissionDenied'
              ? errorMsg
              : 'You do not have permission to access this organization';
          showFeedback('error', message);
          redirectTimeout = setTimeout(() => {
            router.push(getPortalPath('/'));
          }, 2000);
        } else {
          const errorMsg = t('portal.settings.general.error');
          const message =
            firestoreError.message ||
            (typeof errorMsg === 'string' && errorMsg !== 'portal.settings.general.error'
              ? errorMsg
              : t('portal.requests.form.failedToSave'));
          showFeedback('error', message);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchOrganization();

    if (userData && mounted) {
      setProfileFormData({
        name: userData.name || '',
        photoUrl: userData.photoUrl || '',
      });
    }

    return () => {
      mounted = false;
      if (redirectTimeout) clearTimeout(redirectTimeout);
    };
  }, [orgId, userData, t, router, showFeedback]);

  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    };
  }, []);

  const handleSave = async () => {
    if (!orgId || typeof orgId !== 'string') return;

    if (orgId === 'default-org') {
      showFeedback('error', t('portal.settings.general.error'));
      return;
    }

    setSaving(true);
    try {
      await updateOrganization(orgId, {
        name: formData.name,
        website: formData.website,
        industry: formData.industry,
        bio: formData.bio,
      });
      showFeedback('success', t('portal.settings.general.success'));
    } catch (error: unknown) {
      console.error('Error saving settings:', error);
      showFeedback(
        'error',
        error instanceof Error ? error.message : t('portal.settings.general.error')
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotificationPrefs = async (newPrefs: typeof notificationPrefs) => {
    if (!user) return;
    setNotifSaving(true);
    try {
      await updatePortalUser(user.uid, { notificationPreferences: newPrefs });
      setNotificationPrefs(newPrefs);
    } catch (error) {
      console.error('Error saving notification preferences:', error);
    } finally {
      setNotifSaving(false);
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
      showFeedback('error', t('portal.settings.security.changePassword.error'));
    }
  };

  const handleRestartOnboarding = async () => {
    if (!user) return;
    setRestartingOnboarding(true);
    try {
      await updatePortalUser(user.uid, {
        onboardingComplete: false,
        onboardingSkipped: false,
      });
      showFeedback('success', t('portal.settings.general.onboarding.success'));
      // Reload to trigger onboarding
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Error restarting onboarding:', error);
      showFeedback('error', t('portal.settings.general.onboarding.error'));
    } finally {
      setRestartingOnboarding(false);
    }
  };

  const tabs = [
    { id: 'general', label: t('portal.settings.tabs.general'), icon: Building2 },
    { id: 'profile', label: t('portal.settings.tabs.profile'), icon: UserIcon },
    { id: 'notifications', label: t('portal.settings.tabs.notifications'), icon: Bell },
    { id: 'security', label: t('portal.settings.tabs.security'), icon: Shield },
    { id: 'billing', label: t('portal.settings.tabs.billing'), icon: CreditCard },
  ];

  const handleProfileSave = async () => {
    if (!user) return;
    setProfileSaving(true);
    try {
      await updatePortalUser(user.uid, {
        name: profileFormData.name,
        photoUrl: profileFormData.photoUrl,
      });
      showFeedback('success', t('portal.settings.profile.success'));
    } catch (error) {
      console.error('Error saving profile:', error);
      showFeedback('error', t('portal.settings.profile.error'));
    } finally {
      setProfileSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      showFeedback('error', t('portal.settings.profile.avatar.sizeError'));
      return;
    }

    setUploadingAvatar(true);
    try {
      const url = await uploadUserProfilePicture(user.uid, file);
      setProfileFormData(prev => ({ ...prev, photoUrl: url }));
      showFeedback('success', t('portal.settings.profile.avatar.uploadSuccess'));
    } catch (error) {
      console.error('Error uploading avatar:', error);
      showFeedback('error', t('portal.settings.profile.avatar.uploadError'));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const removeAvatar = async () => {
    if (!user || !profileFormData.photoUrl) return;
    try {
      await deleteUserProfilePicture(user.uid, profileFormData.photoUrl);
      setProfileFormData(prev => ({ ...prev, photoUrl: '' }));
      showFeedback('success', t('portal.settings.profile.avatar.removeSuccess'));
    } catch (error) {
      console.error('Error removing avatar:', error);
      showFeedback('error', t('portal.settings.profile.avatar.removeError'));
    }
  };

  const handleLogoError = async () => {
    if (!organization?.logoUrl || !orgId || typeof orgId !== 'string') {
      return;
    }

    try {
      const newUrl = await regenerateOrganizationLogoUrl(orgId, organization.logoUrl);
      if (newUrl && newUrl !== organization.logoUrl) {
        setOrganization(prev => (prev ? { ...prev, logoUrl: newUrl } : null));
      }
    } catch (error) {
      console.warn('Failed to regenerate logo URL:', error);
    }
  };

  const handleOrgLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !orgId || typeof orgId !== 'string') return;

    if (file.size > 2 * 1024 * 1024) {
      showFeedback('error', t('portal.settings.general.logo.sizeError'));
      return;
    }

    setUploadingOrgLogo(true);
    try {
      const url = await uploadOrganizationLogo(orgId, file);
      setOrganization(prev => (prev ? { ...prev, logoUrl: url } : null));
      showFeedback('success', t('portal.settings.general.logo.uploadSuccess'));
    } catch (error) {
      console.error('Error uploading org logo:', error);
      showFeedback('error', t('portal.settings.general.logo.uploadError'));
    } finally {
      setUploadingOrgLogo(false);
    }
  };

  const removeOrgLogo = async () => {
    if (!orgId || typeof orgId !== 'string' || !organization?.logoUrl) return;
    try {
      await deleteOrganizationLogo(orgId, organization.logoUrl);
      setOrganization(prev => (prev ? { ...prev, logoUrl: undefined } : null));
      showFeedback('success', t('portal.settings.general.logo.removeSuccess'));
    } catch (error) {
      console.error('Error removing org logo:', error);
      showFeedback('error', t('portal.settings.general.logo.removeError'));
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 space-y-4">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-surface-500 font-bold font-outfit uppercase tracking-widest text-xs">
          {t('portal.common.loading')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-surface-900 dark:text-white font-outfit">
            {t('portal.settings.title')}
          </h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1 font-medium">
            {t('portal.settings.subtitle')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <aside className="lg:col-span-1">
          <nav className="flex lg:flex-col gap-2 lg:gap-1.5 lg:sticky lg:top-24 overflow-x-auto scrollbar-hide pb-2 lg:pb-0 -mx-2 px-2 lg:mx-0 lg:px-0">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 min-h-[48px] text-sm font-bold rounded-2xl transition-all font-outfit whitespace-nowrap touch-manipulation shrink-0 lg:w-full',
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 lg:translate-x-1'
                    : 'text-surface-500 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800'
                )}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        <div className="lg:col-span-3 space-y-6">
          {/* Notifications */}
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
            <div className="space-y-6">
              <PortalCard className="border-surface-200 dark:border-surface-800 shadow-sm bg-white dark:bg-surface-950">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2.5 rounded-xl bg-surface-50 dark:bg-surface-900 border border-surface-100 dark:border-surface-800 text-surface-400">
                    <Building2 size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-surface-900 dark:text-white font-outfit">
                      {t('portal.settings.general.title')}
                    </h3>
                    <p className="text-xs font-bold text-surface-400 uppercase tracking-widest mt-0.5">
                      {t('portal.settings.general.subtitle')}
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Organization Logo Upload */}
                  <div className="pb-6 border-b border-surface-100 dark:border-surface-800">
                    <label className="block text-xs font-black uppercase tracking-widest text-surface-500 dark:text-surface-400 mb-4">
                      {t('portal.settings.general.logoLabel')}
                    </label>
                    <div className="flex items-center gap-6">
                      <div className="relative group">
                        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-surface-800 dark:to-surface-900 border-2 border-dashed border-surface-200 dark:border-surface-700 flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:border-blue-400 dark:group-hover:border-blue-500">
                          {organization?.logoUrl ? (
                            <img
                              src={organization.logoUrl}
                              alt={organization.name || t('portal.common.organizationLogo')}
                              className="w-full h-full object-cover"
                              onError={handleLogoError}
                            />
                          ) : (
                            <Building2 size={32} className="text-surface-300 dark:text-surface-600" />
                          )}
                        </div>
                        {uploadingOrgLogo && (
                          <div className="absolute inset-0 bg-white/80 dark:bg-surface-900/80 rounded-2xl flex items-center justify-center z-10">
                            <Loader2 size={24} className="animate-spin text-blue-500" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="portal-btn portal-btn-secondary text-xs cursor-pointer">
                          <Camera size={14} />
                          {t('portal.settings.general.logoUpload')}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleOrgLogoUpload}
                            disabled={uploadingOrgLogo}
                          />
                        </label>
                        {organization?.logoUrl && (
                          <button
                            onClick={removeOrgLogo}
                            disabled={uploadingOrgLogo}
                            className="text-xs font-bold text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 transition-colors disabled:opacity-50"
                          >
                            {t('portal.settings.general.logoRemove')}
                          </button>
                        )}
                        <p className="text-[10px] text-surface-400 dark:text-surface-500 mt-1">
                          {t('portal.settings.general.logoHint')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <PortalInput
                      label={t('portal.settings.general.orgName')}
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder={t('portal.settings.general.orgNamePlaceholder')}
                    />
                    <PortalInput
                      label={t('portal.settings.general.industry')}
                      value={formData.industry}
                      onChange={e => setFormData({ ...formData, industry: e.target.value })}
                      placeholder={t('portal.settings.general.industryPlaceholder')}
                    />
                  </div>
                  <PortalInput
                    label={t('portal.settings.general.website')}
                    type="url"
                    value={formData.website}
                    onChange={e => setFormData({ ...formData, website: e.target.value })}
                    placeholder={t('portal.settings.general.websitePlaceholder')}
                  />
                  <div>
                    <label className="block text-xs font-black text-surface-400 uppercase tracking-widest mb-2.5">
                      {t('portal.settings.general.bio')}
                    </label>
                    <textarea
                      value={formData.bio}
                      onChange={e => setFormData({ ...formData, bio: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 rounded-2xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 focus:bg-white dark:focus:bg-surface-950 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none text-surface-900 dark:text-white text-sm font-medium leading-relaxed"
                      placeholder={t('portal.settings.general.bioPlaceholder')}
                    />
                  </div>
                </div>
                <div className="mt-10 pt-6 border-t border-surface-100 dark:border-surface-800 flex justify-end">
                  <PortalButton
                    onClick={handleSave}
                    isLoading={saving}
                    className="flex items-center gap-2 shadow-xl shadow-blue-500/20 font-outfit px-8"
                  >
                    <Save size={18} />
                    {saving
                      ? t('portal.settings.general.saving')
                      : t('portal.settings.general.save')}
                  </PortalButton>
                </div>
              </PortalCard>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <PortalCard className="border-emerald-200 dark:border-emerald-900/20 bg-emerald-50/20 dark:bg-emerald-900/5 shadow-sm">
                  <h3 className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-2 font-outfit">
                    <Plus size={20} />
                    {t('portal.settings.general.newWorkspace.title')}
                  </h3>
                  <p className="text-xs text-surface-500 dark:text-surface-400 mb-6 font-medium leading-relaxed">
                    {t('portal.settings.general.newWorkspace.description')}
                  </p>
                  <PortalButton
                    onClick={() => setShowCreateOrgModal(true)}
                    className="w-full shadow-lg shadow-emerald-500/10 bg-emerald-600 hover:bg-emerald-700 font-outfit"
                  >
                    <Plus size={18} className="me-2" />
                    {t('portal.settings.general.newWorkspace.button')}
                  </PortalButton>
                </PortalCard>

                <PortalCard className="border-blue-200 dark:border-blue-900/20 bg-blue-50/20 dark:bg-blue-900/5 shadow-sm">
                  <h3 className="text-lg font-bold text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-2 font-outfit">
                    <RefreshCw size={20} />
                    {t('portal.settings.general.onboarding.title')}
                  </h3>
                  <p className="text-xs text-surface-500 dark:text-surface-400 mb-6 font-medium leading-relaxed">
                    {t('portal.settings.general.onboarding.description')}
                  </p>
                  <PortalButton
                    onClick={handleRestartOnboarding}
                    isLoading={restartingOnboarding}
                    variant="outline"
                    className="w-full shadow-lg shadow-blue-500/10 border-blue-300 dark:border-blue-800 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-outfit"
                  >
                    <RefreshCw size={18} className="me-2" />
                    {t('portal.settings.general.onboarding.button')}
                  </PortalButton>
                </PortalCard>
              </div>

              {/* Shopify Store Integration */}
              {organization && (
                <div className="mt-8">
                  <h3 className="text-sm font-black text-surface-500 uppercase tracking-widest mb-4 px-1">
                    {t('portal.settings.general.storeIntegrations')}
                  </h3>
                  <ShopifyStoreIntegration
                    organization={organization}
                    onUpdate={async () => {
                      // Refetch organization data
                      if (orgId && typeof orgId === 'string') {
                        const org = await getOrganization(orgId);
                        if (org) setOrganization(org);
                      }
                    }}
                  />
                </div>
              )}

              <PortalCard className="border-rose-200 dark:border-rose-900/20 bg-rose-50/20 dark:bg-rose-900/5 shadow-sm">
                <h3 className="text-lg font-bold text-rose-600 dark:text-rose-400 mb-2 flex items-center gap-2 font-outfit">
                  <Trash2 size={20} />
                  {t('portal.settings.general.dangerZone.title')}
                </h3>
                <p className="text-xs text-surface-500 dark:text-surface-400 mb-6 font-medium leading-relaxed">
                  {t('portal.settings.general.dangerZone.description')}
                </p>
                <PortalButton
                  variant="danger"
                  size="sm"
                  className="shadow-lg shadow-rose-500/10 font-outfit"
                >
                  {t('portal.settings.general.dangerZone.button')}
                </PortalButton>
              </PortalCard>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-6">
              <PortalCard className="border-surface-200 dark:border-surface-800 shadow-sm bg-white dark:bg-surface-950">
                <div className="flex items-center gap-3 mb-10">
                  <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 border border-blue-100 dark:border-blue-900/30">
                    <UserIcon size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-surface-900 dark:text-white font-outfit">
                      {t('portal.settings.profile.title')}
                    </h3>
                    <p className="text-[10px] font-black text-surface-400 uppercase tracking-widest mt-0.5">
                      {t('portal.settings.profile.subtitle')}
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Avatar Section */}
                  <div className="flex flex-col md:flex-row items-center gap-6 p-6 rounded-3xl bg-surface-50/50 dark:bg-surface-900/30 border border-surface-100 dark:border-surface-800/50">
                    <div className="relative group">
                      <PortalAvatar
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
                        {t('portal.settings.profile.avatar.title')}
                      </h4>
                      <p className="text-xs text-surface-500 dark:text-surface-400 mb-4 font-medium max-w-xs">
                        {t('portal.settings.profile.avatar.desc')}
                      </p>
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                        <PortalButton
                          variant="outline"
                          size="sm"
                          className="h-9 px-4 text-xs font-bold border-surface-200 dark:border-surface-800"
                          onClick={() =>
                            document.querySelector<HTMLInputElement>('input[type="file"]')?.click()
                          }
                        >
                          {profileFormData.photoUrl
                            ? t('portal.settings.profile.avatar.change')
                            : t('portal.settings.profile.avatar.upload')}
                        </PortalButton>
                        {profileFormData.photoUrl && (
                          <button
                            onClick={removeAvatar}
                            className="text-xs font-bold text-rose-500 hover:text-rose-600 px-3 py-2 transition-colors"
                          >
                            {t('portal.settings.profile.avatar.remove')}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <PortalInput
                        label={t('portal.settings.profile.name')}
                        value={profileFormData.name}
                        onChange={e =>
                          setProfileFormData({ ...profileFormData, name: e.target.value })
                        }
                        placeholder={t('portal.settings.profile.namePlaceholder')}
                      />
                      <div className="opacity-60 grayscale pointer-events-none">
                        <PortalInput
                          label={t('portal.settings.profile.email')}
                          value={user?.email || ''}
                          readOnly
                          placeholder="email@example.com"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-10 pt-6 border-t border-surface-100 dark:border-surface-800 flex justify-end">
                  <PortalButton
                    onClick={handleProfileSave}
                    isLoading={profileSaving}
                    className="flex items-center gap-2 shadow-xl shadow-blue-500/20 font-outfit px-8"
                  >
                    <Save size={18} />
                    {profileSaving
                      ? t('portal.settings.general.saving')
                      : t('portal.settings.profile.save')}
                  </PortalButton>
                </div>
              </PortalCard>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <PortalCard className="border-surface-200 dark:border-surface-800 shadow-sm bg-white dark:bg-surface-950">
                <div className="flex items-center gap-3 mb-10">
                  <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 border border-blue-100 dark:border-blue-900/30">
                    <Bell size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-surface-900 dark:text-white font-outfit">
                      {t('portal.settings.notifications.title')}
                    </h3>
                    <p className="text-[10px] font-black text-surface-400 uppercase tracking-widest mt-0.5">
                      {t('portal.settings.notifications.subtitle')}
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <PortalSwitch
                    label={t('portal.settings.notifications.requestUpdate.label')}
                    description={t('portal.settings.notifications.requestUpdate.desc')}
                    checked={notificationPrefs.emailOnRequestUpdate}
                    onChange={checked =>
                      handleSaveNotificationPrefs({
                        ...notificationPrefs,
                        emailOnRequestUpdate: checked,
                      })
                    }
                  />
                  <div className="h-px bg-surface-50 dark:bg-surface-900" />
                  <PortalSwitch
                    label={t('portal.settings.notifications.commentAlerts.label')}
                    description={t('portal.settings.notifications.commentAlerts.desc')}
                    checked={notificationPrefs.emailOnNewComment}
                    onChange={checked =>
                      handleSaveNotificationPrefs({
                        ...notificationPrefs,
                        emailOnNewComment: checked,
                      })
                    }
                  />
                  <div className="h-px bg-surface-50 dark:bg-surface-900" />
                  <PortalSwitch
                    label={t('portal.settings.notifications.statusChange.label')}
                    description={t('portal.settings.notifications.statusChange.desc')}
                    checked={notificationPrefs.emailOnStatusChange}
                    onChange={checked =>
                      handleSaveNotificationPrefs({
                        ...notificationPrefs,
                        emailOnStatusChange: checked,
                      })
                    }
                  />
                  <div className="h-px bg-surface-50 dark:bg-surface-900" />
                  <PortalSwitch
                    label={t('portal.settings.notifications.marketing.label')}
                    description={t('portal.settings.notifications.marketing.desc')}
                    checked={notificationPrefs.marketingEmails}
                    onChange={checked =>
                      handleSaveNotificationPrefs({
                        ...notificationPrefs,
                        marketingEmails: checked,
                      })
                    }
                  />
                </div>

                <div className="mt-10 pt-6 border-t border-surface-100 dark:border-surface-800">
                  {notifSaving ? (
                    <div className="flex items-center gap-2 text-[10px] font-black text-blue-600 animate-pulse tracking-widest uppercase">
                      <Loader2 size={12} className="animate-spin" />
                      {t('portal.settings.notifications.syncing')}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-[10px] font-black text-surface-400 tracking-widest uppercase">
                      <CheckCircle2 size={12} className="text-emerald-500" />
                      {t('portal.settings.notifications.saved')}
                    </div>
                  )}
                </div>
              </PortalCard>

              <PortalCard className="bg-surface-50/50 dark:bg-surface-900/30 border-surface-200 dark:border-surface-800 text-center py-10 rounded-3xl">
                <p className="text-[11px] font-bold text-surface-500 dark:text-surface-400 max-w-sm mx-auto uppercase tracking-widest leading-relaxed">
                  {t('portal.settings.notifications.pushBeta')} <br />
                  <span className="text-blue-500 mt-2 block">
                    {t('portal.settings.notifications.pushBetaSub')}
                  </span>
                </p>
              </PortalCard>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <PortalCard className="border-surface-200 dark:border-surface-800 shadow-sm bg-white dark:bg-surface-950">
                <div className="flex items-center gap-3 mb-10">
                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 border border-amber-100 dark:border-amber-900/30">
                    <Shield size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-surface-900 dark:text-white font-outfit">
                      {t('portal.settings.security.title')}
                    </h3>
                    <p className="text-[10px] font-black text-surface-400 uppercase tracking-widest mt-0.5">
                      {t('portal.settings.security.subtitle')}
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-3xl bg-surface-50 dark:bg-surface-900/50 border border-surface-100 dark:border-surface-800 group hover:border-blue-200 dark:hover:border-blue-900/30 transition-colors">
                    <div className="space-y-1">
                      <h4 className="font-bold text-surface-900 dark:text-white text-base font-outfit">
                        {t('portal.settings.security.changePassword.title')}
                      </h4>
                      <p className="text-xs font-medium text-surface-500 leading-relaxed">
                        {t('portal.settings.security.changePassword.desc')}
                      </p>
                    </div>
                    <PortalButton
                      variant="outline"
                      size="sm"
                      onClick={handlePasswordReset}
                      disabled={resetSent}
                      className={cn(
                        'font-outfit whitespace-nowrap px-6',
                        resetSent &&
                          'text-emerald-500 border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                      )}
                    >
                      {resetSent ? (
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={16} />{' '}
                          {t('portal.settings.security.changePassword.sent')}
                        </div>
                      ) : (
                        t('portal.settings.security.changePassword.button')
                      )}
                    </PortalButton>
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-3xl bg-surface-50/50 dark:bg-surface-900/20 border border-surface-100/50 dark:border-surface-800/50 opacity-60">
                    <div className="space-y-1">
                      <h4 className="font-bold text-surface-900 dark:text-white text-base font-outfit">
                        {t('portal.settings.security.mfa.title')}
                      </h4>
                      <p className="text-xs font-medium text-surface-500 leading-relaxed">
                        {t('portal.settings.security.mfa.desc')}
                      </p>
                    </div>
                    <PortalBadge
                      variant="gray"
                      className="font-black uppercase tracking-widest text-[9px]"
                    >
                      {t('portal.settings.security.mfa.badge')}
                    </PortalBadge>
                  </div>
                </div>
              </PortalCard>

              <PortalCard className="border-surface-200 dark:border-surface-800 shadow-sm bg-white dark:bg-surface-950">
                <h4 className="text-[10px] font-black text-surface-400 uppercase tracking-widest mb-6 px-1">
                  {t('portal.settings.security.session.title')}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-1">
                  <div>
                    <p className="text-[10px] font-black text-surface-400 dark:text-surface-500 uppercase tracking-widest mb-2.5">
                      {t('portal.settings.security.session.email')}
                    </p>
                    <p className="text-sm font-bold text-surface-900 dark:text-white font-outfit">
                      {user?.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-surface-400 dark:text-surface-500 uppercase tracking-widest mb-2.5">
                      {t('portal.settings.security.session.provider')}
                    </p>
                    <p className="text-sm font-bold text-surface-900 dark:text-white capitalize font-outfit flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                      {user?.providerData[0]?.providerId.split('.')[0] ||
                        t('portal.settings.security.session.mailService')}
                    </p>
                  </div>
                </div>
              </PortalCard>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-6">
              <PortalCard
                noPadding
                className="border-surface-200 dark:border-surface-800 shadow-xl overflow-hidden bg-white dark:bg-surface-950"
              >
                <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-8 text-white relative">
                  <div className="absolute end-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                      <PortalBadge className="bg-white/20 text-white border-white/20 uppercase font-black tracking-widest text-[9px] px-3">
                        {formData.name}
                      </PortalBadge>
                      <span className="text-[10px] font-black text-blue-100 uppercase tracking-widest bg-blue-500/30 px-3 py-1 rounded-full">
                        {organization?.plan?.toUpperCase() || t('portal.common.free')}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold mb-1 font-outfit uppercase tracking-tight">
                      {organization?.plan
                        ? t(
                            `portal.settings.billing.plans.${organization.plan}` as Parameters<
                              typeof t
                            >[0]
                          )
                        : t('portal.settings.billing.plans.free' as Parameters<typeof t>[0])}
                    </h3>
                    <p className="text-sm text-blue-100/70 font-medium font-outfit uppercase tracking-wider">
                      {organization?.plan === 'enterprise'
                        ? t('portal.settings.billing.enterpriseStatus')
                        : t('portal.settings.billing.activeSubscription')}
                    </p>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-black text-surface-400 uppercase tracking-widest">
                        {t('portal.settings.billing.investment')}
                      </p>
                      <p className="text-2xl font-bold text-surface-900 dark:text-white font-outfit tracking-tight">
                        {organization?.plan === 'pro'
                          ? '$2,499'
                          : organization?.plan === 'enterprise'
                            ? 'Custom'
                            : '$0'}
                        <span className="text-sm font-medium opacity-40 ms-1">
                          {organization?.plan === 'enterprise'
                            ? ''
                            : t('portal.settings.billing.perMonth')}
                        </span>
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-black text-surface-400 uppercase tracking-widest">
                        {t('portal.settings.billing.workflowLimit')}
                      </p>
                      <p className="text-2xl font-bold text-emerald-500 font-outfit flex items-center gap-2">
                        {organization?.plan === 'pro' || organization?.plan === 'enterprise'
                          ? t('portal.settings.billing.unlimited')
                          : '1 Request'}
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-black text-surface-400 uppercase tracking-widest">
                        {t('portal.settings.billing.teamAvailability')}
                      </p>
                      <p className="text-2xl font-bold text-surface-900 dark:text-white font-outfit tracking-tight">
                        {organization?.plan === 'free'
                          ? '2 Seats'
                          : organization?.plan === 'pro'
                            ? '10 Seats'
                            : t('portal.settings.billing.unlimited')}
                      </p>
                    </div>
                  </div>

                  <div className="pt-8 border-t border-surface-100 dark:border-surface-800 flex flex-wrap gap-4">
                    <PortalButton className="flex items-center gap-2 font-outfit px-8 shadow-xl shadow-blue-500/10 h-11">
                      <CreditCard size={18} /> {t('portal.settings.billing.stripeDashboard')}
                    </PortalButton>
                    <PortalButton
                      variant="outline"
                      className="flex items-center gap-2 font-outfit px-8 border-surface-200 dark:border-surface-800 h-11"
                    >
                      {t('portal.settings.billing.invoicingHistory')}
                    </PortalButton>
                  </div>
                </div>
              </PortalCard>

              <PortalCard className="border-blue-100 dark:border-blue-900/20 bg-blue-50/20 dark:bg-blue-900/5 shadow-sm rounded-3xl">
                <div className="flex items-start gap-4">
                  <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 border border-blue-200/50 dark:border-blue-900/30">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-surface-900 dark:text-white mb-1.5 font-outfit">
                      {t('portal.settings.billing.encrypted.title')}
                    </h4>
                    <p className="text-xs text-surface-500 dark:text-surface-400 leading-relaxed font-medium">
                      {t('portal.settings.billing.encrypted.desc')}
                    </p>
                  </div>
                </div>
              </PortalCard>
            </div>
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
