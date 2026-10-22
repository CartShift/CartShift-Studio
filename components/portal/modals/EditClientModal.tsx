'use client';

import { useState, useEffect } from 'react';
import {
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@/components/ui/ModalBackdrop';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { updateOrganization } from '@/lib/services/portal-organizations';
import { getAgencyClientWorkMode, saveAgencyClientWorkMode } from '@/lib/services/agency-work-modes';
import type { WorkMode } from '@/lib/domain/work-engagement';
import { getAgencyTeam } from '@/lib/services/portal-agency';
import { PortalUser, Organization } from '@/lib/types/portal';
import { useTranslations, useLocale } from 'next-intl';
import { Select } from '@/components/ui/Select';
import { PortalFormField } from '@/components/portal/ui/PortalFormField';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';

type TranslationFunction = ReturnType<typeof useTranslations<'portal'>>;

const editOrgSchema = (t: TranslationFunction) =>
  z.object({
    name: z
      .string()
      .min(3, t('organization.createForm.errors.name'))
      .max(100, t('organization.createForm.errors.nameLong')),
    website: z
      .string()
      .url(t('organization.createForm.errors.website'))
      .optional()
      .or(z.literal('')),
    industry: z
      .string()
      .min(2, t('organization.createForm.errors.industry'))
      .optional()
      .or(z.literal('')),
    responsibleAgencyUserId: z.string().optional(),
    status: z.enum(['active', 'inactive', 'suspended']).optional(),
    primaryContactName: z.string().max(160).optional(),
    primaryContactRole: z.string().max(160).optional(),
    primaryContactEmail: z.string().email().optional().or(z.literal('')),
    primaryContactPhone: z.string().max(50).optional(),
    billingName: z.string().max(160).optional(),
    billingEmail: z.string().email().optional().or(z.literal('')),
    billingTaxId: z.string().max(80).optional(),
    billingAddressLine1: z.string().max(160).optional(),
    billingAddressLine2: z.string().max(160).optional(),
    billingCity: z.string().max(100).optional(),
    billingCountry: z.string().max(100).optional(),
    billingPostalCode: z.string().max(40).optional(),
    defaultCurrency: z.enum(['ILS', 'USD', 'EUR']).or(z.literal('')),
  });

type EditOrgFormData = z.infer<ReturnType<typeof editOrgSchema>>;

interface EditClientModalProps {
  organization: Organization;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditClientModal = ({
  organization,
  isOpen,
  onClose,
  onSuccess,
}: EditClientModalProps) => {
  const [loading, set] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agencyMembers, setAgencyMembers] = useState<PortalUser[]>([]);
  const [workMode, setWorkMode] = useState<WorkMode>('commercial');
  const [internalRelationshipNote, setInternalRelationshipNote] = useState('');
  const [modeLoading, setModeLoading] = useState(false);
  const t = useTranslations('portal');
  const locale = useLocale();
  const { userData } = usePortalAuth();
  const canManageWorkMode = ['owner', 'admin'].includes(userData?.agencyRole ?? 'owner');

  const schema = editOrgSchema(t);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EditOrgFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: organization.name,
      website: organization.website || '',
      industry: organization.industry || '',
      responsibleAgencyUserId: organization.responsibleAgencyUserId || '',
      status: organization.status || 'active',
      primaryContactName: organization.primaryContactName || '',
      primaryContactRole: organization.primaryContactRole || '',
      primaryContactEmail: organization.primaryContactEmail || '',
      primaryContactPhone: organization.primaryContactPhone || '',
      billingName: organization.billingName || '',
      billingEmail: organization.billingEmail || '',
      billingTaxId: organization.billingTaxId || '',
      billingAddressLine1: organization.billingAddressLine1 || '',
      billingAddressLine2: organization.billingAddressLine2 || '',
      billingCity: organization.billingCity || '',
      billingCountry: organization.billingCountry || '',
      defaultCurrency: organization.defaultCurrency || '',
      billingPostalCode: organization.billingPostalCode || '',
    },
  });

  // Reset form when organization changes
  useEffect(() => {
    reset({
      name: organization.name,
      website: organization.website || '',
      industry: organization.industry || '',
      responsibleAgencyUserId: organization.responsibleAgencyUserId || '',
      status: organization.status || 'active',
      primaryContactName: organization.primaryContactName || '',
      primaryContactRole: organization.primaryContactRole || '',
      primaryContactEmail: organization.primaryContactEmail || '',
      primaryContactPhone: organization.primaryContactPhone || '',
      billingName: organization.billingName || '',
      billingEmail: organization.billingEmail || '',
      billingTaxId: organization.billingTaxId || '',
      billingAddressLine1: organization.billingAddressLine1 || '',
      billingAddressLine2: organization.billingAddressLine2 || '',
      billingCity: organization.billingCity || '',
      billingCountry: organization.billingCountry || '',
      defaultCurrency: organization.defaultCurrency || '',
      billingPostalCode: organization.billingPostalCode || '',
    });
  }, [organization, reset]);

  // Classification and relationship notes are private to the agency.
  useEffect(() => {
    if (!isOpen || !canManageWorkMode) return;
    let active = true;
    setError(null);
    setModeLoading(true);
    getAgencyClientWorkMode(organization.id).then(data => {
      if (!active) return;
      setWorkMode(data.defaultWorkMode);
      setInternalRelationshipNote(data.internalRelationshipNote || '');
    }).catch(err => {
      if (active) setError(err instanceof Error ? err.message : String(err));
    }).finally(() => { if (active) setModeLoading(false); });
    return () => { active = false; };
  }, [isOpen, organization.id, canManageWorkMode]);

  // Fetch agency members on mount
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const members = await getAgencyTeam();
        setAgencyMembers(members);
      } catch (err) {
        console.error('Failed to fetch agency team:', err);
      }
    };
    if (isOpen) {
      fetchMembers();
    }
  }, [isOpen]);

  const onSubmit = async (data: EditOrgFormData) => {
    set(true);
    setError(null);

    try {
      if (canManageWorkMode) {
        if (modeLoading) throw new Error('Work mode is still loading');
        await saveAgencyClientWorkMode({
          orgId: organization.id,
          defaultWorkMode: workMode,
          internalRelationshipNote,
        });
      }
      await updateOrganization(organization.id, {
        name: data.name,
        website: data.website || undefined,
        industry: data.industry || undefined,
        responsibleAgencyUserId: data.responsibleAgencyUserId || null,
        primaryContactName: data.primaryContactName,
        primaryContactRole: data.primaryContactRole,
        primaryContactEmail: data.primaryContactEmail,
        primaryContactPhone: data.primaryContactPhone,
        billingName: data.billingName,
        billingEmail: data.billingEmail,
        billingTaxId: data.billingTaxId,
        billingAddressLine1: data.billingAddressLine1,
        billingAddressLine2: data.billingAddressLine2,
        billingCity: data.billingCity,
        billingCountry: data.billingCountry,
        billingPostalCode: data.billingPostalCode,
        ...(data.defaultCurrency ? { defaultCurrency: data.defaultCurrency } : {}),
      });

      onSuccess();
      onClose();
    } catch (error: unknown) {
      console.error('Update organization error:', error);
      setError(error instanceof Error ? error.message : t('common.error'));
    } finally {
      set(false);
    }
  };

  return (
    <ModalBackdrop isOpen={isOpen} onClick={onClose}>
      <ModalContent maxWidth="lg" onClick={e => e.stopPropagation()}>
        <ModalHeader title={t('agency.clients.detail.editClient')} onClose={onClose} />

        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody scrollable className="space-y-5">
            <Input
              label={t('organization.createForm.nameLabel')}
              placeholder={t('organization.createForm.namePlaceholder')}
              error={errors.name?.message}
              {...register('name')}
              className="font-outfit"
            />

            <Input
              label={t('organization.createForm.websiteLabel')}
              type="url"
              placeholder={t('organization.createForm.websitePlaceholder')}
              error={errors.website?.message}
              {...register('website')}
              className="font-outfit"
            />

            <Input
              label={t('organization.createForm.industryLabel')}
              placeholder={t('organization.createForm.industryPlaceholder')}
              error={errors.industry?.message}
              {...register('industry')}
              className="font-outfit"
            />

            {canManageWorkMode && <div className="border-t border-surface-200 pt-4 dark:border-surface-800">
              <p className="mb-3 text-xs font-black uppercase tracking-widest text-surface-400">
                {locale === 'he' ? 'סיווג פנימי בסוכנות' : 'Agency-only engagement'}
              </p>
              <div className="space-y-3">
                <PortalFormField label={locale === 'he' ? 'ברירת מחדל לעבודות חדשות' : 'Default for new work'}>
                  <Select value={workMode} disabled={modeLoading} onChange={e => setWorkMode(e.target.value as WorkMode)}
                    options={[
                      { value: 'commercial', label: locale === 'he' ? 'מסחרי' : 'Commercial' },
                      { value: 'pro_bono', label: 'Pro Bono' },
                    ]}/>
                </PortalFormField>
                <label className="grid gap-1.5 text-sm font-medium">
                  {locale === 'he' ? 'הערה פנימית (לא גלויה ללקוח)' : 'Private note (not visible to clients)'}
                  <textarea value={internalRelationshipNote} maxLength={1500}
                    onChange={e => setInternalRelationshipNote(e.target.value)}
                    className="portal-focus-ring min-h-20 w-full rounded-xl border border-surface-200 bg-white p-3 text-sm dark:border-surface-700 dark:bg-surface-900"
                    disabled={modeLoading}/>
                </label>
                <p className="text-xs text-surface-500">
                  {locale === 'he' ? 'הסיווג לא משנה תשלומים או פרויקטים קיימים.' :
                    'Changing this default does not alter existing projects or payments.'}
                </p>
              </div>
            </div>}
            <div className="border-t border-surface-200 pt-4 dark:border-surface-800">
              <p className="mb-3 text-xs font-black uppercase tracking-widest text-surface-400">{t('organization.primaryContact.title')}</p>
              <div className="space-y-3">
                <Input label={t('organization.primaryContact.name')} {...register('primaryContactName')} />
                <Input label={t('organization.primaryContact.role')} {...register('primaryContactRole')} />
                <Input label={t('organization.primaryContact.email')} type="email" error={errors.primaryContactEmail?.message} {...register('primaryContactEmail')} />
                <Input label={t('organization.primaryContact.phone')} type="tel" {...register('primaryContactPhone')} />
              </div>
            </div>

            <div className="border-t border-surface-200 pt-4 dark:border-surface-800">
              <p className="mb-3 text-xs font-black uppercase tracking-widest text-surface-400">
                {t('invoices.clientBilling')}
              </p>
              <div className="space-y-3">
                <Input label={t('invoices.settings.businessName')} {...register('billingName')} />
                <Input label={t('invoices.settings.email')} type="email" error={errors.billingEmail?.message} {...register('billingEmail')} />
                <Input label={t('invoices.settings.vatId')} {...register('billingTaxId')} />
                <Input label={t('invoices.settings.address1')} {...register('billingAddressLine1')} />
                <Input label={t('invoices.settings.address2')} {...register('billingAddressLine2')} />
                <div className="grid grid-cols-2 gap-3"><Input label={t('invoices.settings.city')} {...register('billingCity')} /><Input label={t('invoices.settings.country')} {...register('billingCountry')} /></div>
                <Input label={t('invoices.settings.postalCode')} {...register('billingPostalCode')} />
                <PortalFormField label={t('pricing.form.currency')}>
                  <Select
                    options={[
                      ...(!organization.defaultCurrency ? [{ value: '', label: locale === 'he' ? 'טרם נבחר מטבע' : 'Not configured' }] : []),
                      { value: 'ILS', label: '₪ ILS – שקל חדש' },
                      { value: 'USD', label: '$ USD – US Dollar' },
                      { value: 'EUR', label: '€ EUR – Euro' },
                    ]}
                    {...register('defaultCurrency')}
                  />
                </PortalFormField>
                <p className="mt-1 text-xs text-surface-500">
                  {locale === 'he'
                    ? (organization.defaultCurrency ? 'המטבע ישמש להצעות ולפרויקטים חדשים בלבד. מסמכים קיימים לא ישתנו.' : 'לא הוגדר עדיין מטבע ללקוח. יש לבחור מטבע במפורש כדי שהצעות ופרויקטים חדשים יירשו אותו.')
                    : (organization.defaultCurrency ? 'Used for new quotes and projects only; existing documents remain unchanged.' : 'No currency has been configured for this client. Choose one explicitly for new quotes and projects.')}
                </p>
              </div>
            </div>

            <PortalFormField label={t('agency.clients.detail.info.responsibleAgent')}>
              <Select
                options={[
                  { value: '', label: t('agency.clients.detail.info.unassigned') },
                  ...agencyMembers.map(member => ({
                    value: member.id,
                    label: member.name || member.email,
                  })),
                ]}
                {...register('responsibleAgencyUserId')}
              />
            </PortalFormField>

            <PortalFormField label={t('agency.clients.detail.info.status')}>
              <Select
                options={[
                  { value: 'active', label: t('agency.clients.badge.active') },
                  { value: 'inactive', label: t('agency.clients.badge.inactive') },
                  { value: 'suspended', label: t('agency.clients.badge.suspended') },
                ]}
                {...register('status')}
              />
            </PortalFormField>

            {error && (
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
              </div>
            )}
          </ModalBody>

          <ModalFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1 font-outfit"
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" loading={loading} disabled={(canManageWorkMode && modeLoading) || Boolean(error)} className="flex-1 font-outfit">
              {loading ? t('common.saving') : t('common.saveChanges')}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </ModalBackdrop>
  );
};
