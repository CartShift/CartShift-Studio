'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import {
  PortalFormField,
  PortalFormGrid,
  PortalFormSection,
} from '@/components/portal/ui/PortalFormField';
import { BillingProfile } from '@/lib/types/portal';
import { useBillingProfile } from '@/lib/hooks/useBillingProfile';

const CURRENCIES = ['ILS', 'USD', 'EUR'] as const;

const billingProfileSchema = z.object({
  businessName: z.string().min(1),
  legalName: z.string().optional(),
  vatId: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  logoUrl: z.string().url().optional().or(z.literal('')),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  paypalEmail: z.string().email().optional().or(z.literal('')),
  defaultCurrency: z.enum(CURRENCIES),
  defaultTaxRatePercent: z.number().min(0).max(100),
  defaultPaymentTerms: z.string().optional(),
  paymentInstructions: z.string().optional(),
  bankDetails: z.object({
    bankName: z.string().optional(),
    branchNumber: z.string().optional(),
    accountNumber: z.string().optional(),
    iban: z.string().optional(),
    swift: z.string().optional(),
    beneficiaryName: z.string().optional(),
  }),
});

type BillingProfileFormData = z.infer<typeof billingProfileSchema>;

const defaultValues: BillingProfileFormData = {
  businessName: '',
  legalName: '',
  vatId: '',
  email: '',
  phone: '',
  website: '',
  logoUrl: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  country: '',
  postalCode: '',
  paypalEmail: '',
  defaultCurrency: 'ILS',
  defaultTaxRatePercent: 0,
  defaultPaymentTerms: '',
  paymentInstructions: '',
  bankDetails: {
    bankName: '',
    branchNumber: '',
    accountNumber: '',
    iban: '',
    swift: '',
    beneficiaryName: '',
  },
};

function toFormData(profile: BillingProfile): BillingProfileFormData {
  return {
    businessName: profile.businessName,
    legalName: profile.legalName ?? '',
    vatId: profile.vatId ?? '',
    email: profile.email ?? '',
    phone: profile.phone ?? '',
    website: profile.website ?? '',
    logoUrl: profile.logoUrl ?? '',
    addressLine1: profile.addressLine1 ?? '',
    addressLine2: profile.addressLine2 ?? '',
    city: profile.city ?? '',
    country: profile.country ?? '',
    postalCode: profile.postalCode ?? '',
    paypalEmail: profile.paypalEmail ?? '',
    defaultCurrency: profile.defaultCurrency,
    defaultTaxRatePercent: profile.defaultTaxRate * 100,
    defaultPaymentTerms: profile.defaultPaymentTerms ?? '',
    paymentInstructions: profile.paymentInstructions ?? '',
    bankDetails: {
      bankName: profile.bankDetails?.bankName ?? '',
      branchNumber: profile.bankDetails?.branchNumber ?? '',
      accountNumber: profile.bankDetails?.accountNumber ?? '',
      iban: profile.bankDetails?.iban ?? '',
      swift: profile.bankDetails?.swift ?? '',
      beneficiaryName: profile.bankDetails?.beneficiaryName ?? '',
    },
  };
}

function toBillingProfile(data: BillingProfileFormData, existing?: BillingProfile | null): BillingProfile {
  return {
    id: existing?.id,
    businessName: data.businessName,
    legalName: data.legalName || undefined,
    vatId: data.vatId || undefined,
    email: data.email || undefined,
    phone: data.phone || undefined,
    website: data.website || undefined,
    logoUrl: data.logoUrl || undefined,
    addressLine1: data.addressLine1 || undefined,
    addressLine2: data.addressLine2 || undefined,
    city: data.city || undefined,
    country: data.country || undefined,
    postalCode: data.postalCode || undefined,
    paypalEmail: data.paypalEmail || undefined,
    defaultCurrency: data.defaultCurrency,
    defaultTaxRate: data.defaultTaxRatePercent / 100,
    defaultPaymentTerms: data.defaultPaymentTerms || undefined,
    paymentInstructions: data.paymentInstructions || undefined,
    bankDetails: {
      bankName: data.bankDetails.bankName || undefined,
      branchNumber: data.bankDetails.branchNumber || undefined,
      accountNumber: data.bankDetails.accountNumber || undefined,
      iban: data.bankDetails.iban || undefined,
      swift: data.bankDetails.swift || undefined,
      beneficiaryName: data.bankDetails.beneficiaryName || undefined,
    },
    updatedAt: existing?.updatedAt,
  };
}

export function BillingProfileForm() {
  const t = useTranslations('portal.invoices.settings');
  const { profile, loading, update } = useBillingProfile();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BillingProfileFormData>({
    resolver: zodResolver(billingProfileSchema),
    defaultValues,
  });

  useEffect(() => {
    if (!profile) return;
    reset(toFormData(profile));
  }, [profile, reset]);

  const onSubmit = async (data: BillingProfileFormData) => {
    try {
      await update.mutateAsync(toBillingProfile(data, profile));
      toast.success(t('saved'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('failed'));
    }
  };

  if (loading) {
    return <p className="text-sm text-surface-500">{t('loading')}</p>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <PortalFormSection title={t('title')} description={t('description')}>
        <PortalFormGrid>
          <Input
            label={t('businessName')}
            error={errors.businessName?.message}
            {...register('businessName')}
          />
          <Input label={t('legalName')} {...register('legalName')} />
          <Input label={t('vatId')} {...register('vatId')} />
          <Input
            label={t('email')}
            type="email"
            error={errors.email?.message}
            {...register('email')}
          />
          <Input label={t('phone')} {...register('phone')} />
          <Input
            label={t('website')}
            type="url"
            error={errors.website?.message}
            {...register('website')}
          />
          <Input
            label={t('logoUrl')}
            type="url"
            error={errors.logoUrl?.message}
            {...register('logoUrl')}
          />
          <Input label={t('address1')} {...register('addressLine1')} />
          <Input label={t('address2')} {...register('addressLine2')} />
          <Input label={t('city')} {...register('city')} />
          <Input label={t('country')} {...register('country')} />
          <Input label={t('postalCode')} {...register('postalCode')} />
          <Input
            label={t('paypal')}
            type="email"
            error={errors.paypalEmail?.message}
            {...register('paypalEmail')}
          />
          <Select
            label={t('currency')}
            options={CURRENCIES.map(value => ({ value, label: value }))}
            {...register('defaultCurrency')}
          />
          <Input
            label={t('taxRate')}
            type="number"
            min="0"
            max="100"
            step="0.01"
            error={errors.defaultTaxRatePercent?.message}
            {...register('defaultTaxRatePercent', { valueAsNumber: true })}
          />
        </PortalFormGrid>
      </PortalFormSection>

      <PortalFormGrid>
          <Input label={t('bankName')} {...register('bankDetails.bankName')} />
          <Input label={t('branch')} {...register('bankDetails.branchNumber')} />
          <Input label={t('account')} {...register('bankDetails.accountNumber')} />
          <Input label={t('beneficiary')} {...register('bankDetails.beneficiaryName')} />
          <Input label={t('iban')} {...register('bankDetails.iban')} />
          <Input label={t('swift')} {...register('bankDetails.swift')} />
      </PortalFormGrid>

      <div className="space-y-4">
        <PortalFormField label={t('terms')}>
          <Textarea
            placeholder={t('terms')}
            className="min-h-24"
            {...register('defaultPaymentTerms')}
          />
        </PortalFormField>
        <PortalFormField label={t('instructions')}>
          <Textarea
            placeholder={t('instructions')}
            className="min-h-24"
            {...register('paymentInstructions')}
          />
        </PortalFormField>
      </div>

      <Button type="submit" loading={update.isPending}>
        {t('save')}
      </Button>
    </form>
  );
}
