'use client';

import { Dispatch, SetStateAction } from 'react';
import {
  Building2,
  Save,
  Camera,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import {
  PortalFormField,
  PortalFormGrid,
  PortalFormSection,
} from '@/components/portal/ui/PortalFormField';
import { ShopifyStoreIntegration } from '@/components/portal/integrations';
import { Organization } from '@/lib/types/portal';

export interface OrganizationFormData {
  name: string;
  website: string;
  industry: string;
  bio: string;
  billingName: string;
  billingEmail: string;
  billingTaxId: string;
  billingAddressLine1: string;
  billingAddressLine2: string;
  billingCity: string;
  billingCountry: string;
  billingPostalCode: string;
}

interface GeneralSettingsTabProps {
  formData: OrganizationFormData;
  setFormData: Dispatch<SetStateAction<OrganizationFormData>>;
  organization: Organization | null;
  orgId: string | null;
  saving: boolean;
  uploadingOrgLogo: boolean;
  restartingOnboarding: boolean;
  onSave: () => void;
  onOrgLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveOrgLogo: () => void;
  onLogoError: () => void;
  onCreateOrg: () => void;
  onRestartOnboarding: () => void;
  onOrganizationRefresh?: () => Promise<unknown>;
}

export function GeneralSettingsTab({
  formData,
  setFormData,
  organization,
  orgId: _orgId,
  saving,
  uploadingOrgLogo,
  restartingOnboarding,
  onSave,
  onOrgLogoUpload,
  onRemoveOrgLogo,
  onLogoError,
  onCreateOrg,
  onRestartOnboarding,
  onOrganizationRefresh,
}: GeneralSettingsTabProps) {
  const t = useTranslations('portal');

  return (
    <div className="space-y-6">
      <Card className="border-surface-200 dark:border-surface-800 shadow-sm bg-white dark:bg-surface-950">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 rounded-xl bg-surface-50 dark:bg-surface-900 border border-surface-100 dark:border-surface-800 text-surface-400">
            <Building2 size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-surface-900 dark:text-white font-outfit">
              {t('settings.general.title')}
            </h3>
            <p className="text-xs font-bold text-surface-400 uppercase tracking-widest mt-0.5">
              {t('settings.general.subtitle')}
            </p>
          </div>
        </div>

        <PortalFormSection title={t('invoices.clientBilling')} className="border-t border-surface-100 pt-6 dark:border-surface-800 mb-8">
          <PortalFormGrid>
            <Input
              label={t('invoices.settings.businessName')}
              value={formData.billingName}
              onChange={e => setFormData({ ...formData, billingName: e.target.value })}
            />
            <Input
              label={t('invoices.settings.email')}
              type="email"
              value={formData.billingEmail}
              onChange={e => setFormData({ ...formData, billingEmail: e.target.value })}
            />
            <Input
              label={t('invoices.settings.vatId')}
              value={formData.billingTaxId}
              onChange={e => setFormData({ ...formData, billingTaxId: e.target.value })}
            />
            <Input
              label={t('invoices.settings.address1')}
              value={formData.billingAddressLine1}
              onChange={e => setFormData({ ...formData, billingAddressLine1: e.target.value })}
            />
            <Input
              label={t('invoices.settings.address2')}
              value={formData.billingAddressLine2}
              onChange={e => setFormData({ ...formData, billingAddressLine2: e.target.value })}
            />
            <Input
              label={t('invoices.settings.city')}
              value={formData.billingCity}
              onChange={e => setFormData({ ...formData, billingCity: e.target.value })}
            />
            <Input
              label={t('invoices.settings.country')}
              value={formData.billingCountry}
              onChange={e => setFormData({ ...formData, billingCountry: e.target.value })}
            />
            <Input
              label={t('invoices.settings.postalCode')}
              value={formData.billingPostalCode}
              onChange={e => setFormData({ ...formData, billingPostalCode: e.target.value })}
            />
          </PortalFormGrid>
        </PortalFormSection>

        <div className="space-y-6">
          <div className="pb-6 border-b border-surface-100 dark:border-surface-800">
            <label className="block text-xs font-black uppercase tracking-widest text-surface-500 dark:text-surface-400 mb-4">
              {t('settings.general.logoLabel')}
            </label>
            <div className="flex items-center gap-6">
              <div className="relative group">
                <div className="w-24 h-24 rounded-2xl bg-primary-50 dark:bg-surface-800 border-2 border-dashed border-surface-200 dark:border-surface-700 flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:border-primary-400 dark:group-hover:border-primary-500">
                  {organization?.logoUrl ? (
                    <img
                      src={organization.logoUrl}
                      alt={organization.name || t('common.organizationLogo')}
                      className="w-full h-full object-cover"
                      onError={onLogoError}
                    />
                  ) : (
                    <Building2 size={32} className="text-surface-300 dark:text-surface-600" />
                  )}
                </div>
                {uploadingOrgLogo && (
                  <div className="absolute inset-0 bg-white/80 dark:bg-surface-900/80 rounded-2xl flex items-center justify-center z-10">
                    <Loader2 size={24} className="animate-spin text-primary-500" />
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label className="portal-btn portal-btn-secondary text-xs cursor-pointer">
                  <Camera size={14} />
                  {t('settings.general.logoUpload')}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onOrgLogoUpload}
                    disabled={uploadingOrgLogo}
                  />
                </label>
                {organization?.logoUrl && (
                  <button
                    onClick={onRemoveOrgLogo}
                    disabled={uploadingOrgLogo}
                    className="text-xs font-bold text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 transition-colors disabled:opacity-50"
                  >
                    {t('settings.general.logoRemove')}
                  </button>
                )}
                <p className="text-[10px] text-surface-400 dark:text-surface-500 mt-1">
                  {t('settings.general.logoHint')}
                </p>
              </div>
            </div>
          </div>

          <PortalFormGrid>
            <Input
              label={t('settings.general.orgName')}
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder={t('settings.general.orgNamePlaceholder')}
            />
            <Input
              label={t('settings.general.industry')}
              value={formData.industry}
              onChange={e => setFormData({ ...formData, industry: e.target.value })}
              placeholder={t('settings.general.industryPlaceholder')}
            />
          </PortalFormGrid>

          <Input
            label={t('settings.general.website')}
            type="url"
            value={formData.website}
            onChange={e => setFormData({ ...formData, website: e.target.value })}
            placeholder={t('settings.general.websitePlaceholder')}
          />

          <PortalFormField label={t('settings.general.bio')}>
            <Textarea
              value={formData.bio}
              onChange={e => setFormData({ ...formData, bio: e.target.value })}
              rows={4}
              className="rounded-2xl py-3 resize-none text-sm font-medium leading-relaxed"
              placeholder={t('settings.general.bioPlaceholder')}
            />
          </PortalFormField>
        </div>

        <div className="mt-10 pt-6 border-t border-surface-100 dark:border-surface-800 flex justify-end">
          <Button
            onClick={onSave}
            loading={saving}
            className="flex items-center gap-2 shadow-xl shadow-primary-500/20 font-outfit px-8"
          >
            <Save size={18} />
            {saving ? t('settings.general.saving') : t('settings.general.save')}
          </Button>
        </div>
      </Card>

      <PortalFormGrid>
        <Card className="border-emerald-200 dark:border-emerald-900/20 bg-emerald-50/20 dark:bg-emerald-900/5 shadow-sm">
          <h3 className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-2 font-outfit">
            <Plus size={20} />
            {t('settings.general.newWorkspace.title')}
          </h3>
          <p className="text-xs text-surface-500 dark:text-surface-400 mb-6 font-medium leading-relaxed">
            {t('settings.general.newWorkspace.description')}
          </p>
          <Button
            onClick={onCreateOrg}
            className="w-full shadow-lg shadow-emerald-500/10 bg-emerald-600 hover:bg-emerald-700 font-outfit"
          >
            <Plus size={18} className="me-2" />
            {t('settings.general.newWorkspace.button')}
          </Button>
        </Card>

        <Card className="border-primary-200 dark:border-primary-900/20 bg-primary-50/20 dark:bg-primary-900/5 shadow-sm">
          <h3 className="text-lg font-bold text-primary-600 dark:text-primary-400 mb-2 flex items-center gap-2 font-outfit">
            <RefreshCw size={20} />
            {t('settings.general.onboarding.title')}
          </h3>
          <p className="text-xs text-surface-500 dark:text-surface-400 mb-6 font-medium leading-relaxed">
            {t('settings.general.onboarding.description')}
          </p>
          <Button
            onClick={onRestartOnboarding}
            loading={restartingOnboarding}
            variant="outline"
            className="w-full shadow-lg shadow-primary-500/10 border-primary-300 dark:border-primary-800 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 font-outfit"
          >
            <RefreshCw size={18} className="me-2" />
            {t('settings.general.onboarding.button')}
          </Button>
        </Card>
      </PortalFormGrid>

      {organization && (
        <div className="mt-8">
          <h3 className="text-sm font-black text-surface-500 uppercase tracking-widest mb-4 px-1">
            {t('settings.general.storeIntegrations')}
          </h3>
          <ShopifyStoreIntegration
            organization={organization}
            onUpdate={async () => {
              await onOrganizationRefresh?.();
            }}
          />
        </div>
      )}

      <Card className="border-rose-200 dark:border-rose-900/20 bg-rose-50/20 dark:bg-rose-900/5 shadow-sm">
        <h3 className="text-lg font-bold text-rose-600 dark:text-rose-400 mb-2 flex items-center gap-2 font-outfit">
          <Trash2 size={20} />
          {t('settings.general.dangerZone.title')}
        </h3>
        <p className="text-xs text-surface-500 dark:text-surface-400 mb-6 font-medium leading-relaxed">
          {t('settings.general.dangerZone.description')}
        </p>
        <Button variant="danger" size="sm" className="shadow-lg shadow-rose-500/10 font-outfit">
          {t('settings.general.dangerZone.button')}
        </Button>
      </Card>
    </div>
  );
}
