'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm, useFieldArray, FieldArrayWithId } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { PortalCard } from '@/components/portal/ui/PortalCard';
import { PortalButton } from '@/components/portal/ui/PortalButton';
import { PortalBadge } from '@/components/portal/ui/PortalBadge';
import { createPricingRequest, sendPricingRequest } from '@/lib/services/pricing-requests';
import { getRequestsByOrg } from '@/lib/services/portal-requests';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { useResolvedOrgId } from '@/lib/hooks/useResolvedOrgId';
import {
  AlertCircle,
  CheckCircle2,
  Plus,
  Trash2,
  Send,
  Save,
  Loader2,
  CalendarIcon,
  FileText,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import {
  CURRENCY,
  Currency,
  CURRENCY_CONFIG,
  formatCurrency,
  calculateTotalAmount,
  PricingLineItem,
} from '@/lib/types/pricing';
import { Request, RequestStatus } from '@/lib/types/portal';
import { getPortalPath } from '@/lib/utils/portal-paths';

interface LineItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

interface PricingFormData {
  title: string;
  description?: string;
  lineItems: LineItemInput[];
  currency: Currency;
  validUntil?: string;
  clientName?: string;
  clientEmail?: string;
  agencyNotes?: string;
}

export default function CreatePricingForm() {
  const orgId = useResolvedOrgId();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userData } = usePortalAuth();
  const t = useTranslations();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Request selection state
  const [availableRequests, setAvailableRequests] = useState<Request[]>([]);
  const [selectedRequestIds, setSelectedRequestIds] = useState<string[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  // Fetch requests that can be included in pricing offers
  useEffect(() => {
    async function fetchRequests() {
      if (!orgId || typeof orgId !== 'string') return;

      try {
        const requests = await getRequestsByOrg(orgId);
        // Filter to requests that are eligible for pricing (not already paid, not in active offer)
        const eligibleStatuses: RequestStatus[] = [
          'NEW',
          'NEEDS_INFO',
          'QUOTED',
          'ACCEPTED',
          'IN_PROGRESS',
          'IN_REVIEW',
          'DELIVERED',
        ];
        const eligible = requests.filter(
          r => eligibleStatuses.includes(r.status) && !r.pricingOfferId
        );
        setAvailableRequests(eligible);
      } catch (error) {
        console.error('Failed to fetch requests:', error);
      } finally {
        setLoadingRequests(false);
      }
    }

    fetchRequests();
    fetchRequests();
  }, [orgId]);

  // Pre-select requests from URL params
  useEffect(() => {
    if (!loadingRequests && availableRequests.length > 0) {
      const paramIds = searchParams.get('requestIds')?.split(',') || [];
      if (paramIds.length > 0) {
        // Only select valid IDs
        const validIds = paramIds.filter(id => availableRequests.some(r => r.id === id));
        if (validIds.length > 0) {
          setSelectedRequestIds(validIds);
        }
      }
    }
  }, [searchParams, loadingRequests, availableRequests]);

  const toggleRequestSelection = (requestId: string) => {
    setSelectedRequestIds(prev =>
      prev.includes(requestId) ? prev.filter(id => id !== requestId) : [...prev, requestId]
    );
  };

  const pricingSchema = useMemo(
    () =>
      z.object({
        title: z
          .string()
          .min(3, 'Title must be at least 3 characters')
          .max(200, t('portal.pricing.form.errors.titleTooLong')),
        description: z.string().optional(),
        lineItems: z
          .array(
            z.object({
              description: z.string().min(1, t('portal.common.descriptionRequired')),
              quantity: z.number().min(1, t('portal.pricing.form.errors.quantityMustBeAtLeast1')),
              unitPrice: z.number().min(0, 'Price must be positive'),
              notes: z.string().optional(),
            })
          )
          .min(1, 'Add at least one line item'),
        currency: z.enum(['USD', 'ILS', 'EUR']),
        validUntil: z.string().optional(),
        clientName: z.string().optional(),
        clientEmail: z.string().email().optional().or(z.literal('')),
        agencyNotes: z.string().optional(),
      }),
    []
  );

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<PricingFormData>({
    resolver: zodResolver(pricingSchema),
    defaultValues: {
      title: '',
      description: '',
      lineItems: [{ description: '', quantity: 1, unitPrice: 0 }],
      currency: 'USD',
      clientName: '',
      clientEmail: '',
      agencyNotes: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lineItems',
  });

  const watchedLineItems = watch('lineItems');
  const watchedCurrency = watch('currency');

  const totalAmount = useMemo(() => {
    const items: PricingLineItem[] = (watchedLineItems || []).map(
      (item: LineItemInput, index: number) => ({
        id: `temp_${index}`,
        description: item.description || '',
        quantity: item.quantity || 0,
        unitPrice: Math.round((item.unitPrice || 0) * 100), // Convert to cents
      })
    );
    return calculateTotalAmount(items);
  }, [watchedLineItems]);

  const onSubmit = async (data: PricingFormData, shouldSend: boolean) => {
    if (!userData?.id || !orgId || typeof orgId !== 'string') {
      setErrorMessage(t('portal.common.authRequired'));
      setSubmitStatus('error');
      return;
    }

    setIsSubmitting(true);
    if (shouldSend) setIsSending(true);
    setSubmitStatus('idle');
    setErrorMessage(null);

    try {
      // Convert prices from dollars to cents
      const lineItems = data.lineItems.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: Math.round(item.unitPrice * 100),
        notes: item.notes,
      }));

      const request = await createPricingRequest(orgId, userData.id, userData.name || t('portal.common.unknown'), {
        title: data.title,
        description: data.description,
        lineItems,
        currency: data.currency,
        validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
        clientName: data.clientName,
        clientEmail: data.clientEmail,
        agencyNotes: data.agencyNotes,
        requestIds: selectedRequestIds.length > 0 ? selectedRequestIds : undefined,
      });

      // If sending, update status to SENT
      if (shouldSend) {
        await sendPricingRequest(request.id);
      }

      setSubmitStatus('success');

      setTimeout(() => {
        router.push(getPortalPath('/pricing/'));
      }, 1500);
    } catch (error) {
      console.error('Failed to create pricing request:', error);
      setErrorMessage('Failed to create pricing offer. Please try again.');
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
      setIsSending(false);
    }
  };

  if (submitStatus === 'success') {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <PortalCard className="p-12 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 rounded-3xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-surface-900 dark:text-white font-outfit mb-2">
            {isSending ? 'Offer Sent!' : 'Draft Saved!'}
          </h2>
          <p className="text-surface-500 dark:text-surface-400 max-w-sm">
            {isSending
              ? 'Your pricing offer has been sent to the client.'
              : 'Your draft has been saved. You can send it when ready.'}
          </p>
        </PortalCard>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-surface-900 dark:text-white font-outfit">
            {t('portal.pricing.newOffer')}
          </h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1 font-medium">
            Create a new pricing proposal for your client.
          </p>
        </div>
      </div>

      <form className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main form */}
        <div className="lg:col-span-2 space-y-6">
          <PortalCard className="p-6">
            <h3 className="text-lg font-bold text-surface-900 dark:text-white font-outfit mb-4">
              Offer Details
            </h3>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-bold text-surface-700 dark:text-surface-300 mb-2">
                  {t('portal.pricing.form.titleLabel')} *
                </label>
                <input
                  {...register('title')}
                  type="text"
                  placeholder={t('portal.pricing.form.titlePlaceholder')}
                  className={cn(
                    'portal-input w-full',
                    errors.title && 'border-red-500 focus:ring-red-500'
                  )}
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.title.message}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-bold text-surface-700 dark:text-surface-300 mb-2">
                  {t('portal.pricing.form.descriptionLabel')}
                </label>
                <textarea
                  {...register('description')}
                  rows={3}
                  placeholder={t('portal.pricing.form.descriptionPlaceholder')}
                  className="portal-input w-full resize-none"
                />
              </div>
            </div>
          </PortalCard>

          {/* Request Selection */}
          <PortalCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-surface-900 dark:text-white font-outfit">
                  {t('portal.pricing.form.selectRequests')}
                </h3>
                <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                  {t('portal.pricing.form.selectRequestsDescription' as never) ||
                    'Choose requests to include in this pricing offer'}
                </p>
              </div>
              {selectedRequestIds.length > 0 && (
                <PortalBadge variant="blue">
                  {selectedRequestIds.length}{' '}
                  {t('portal.pricing.form.selected')}
                </PortalBadge>
              )}
            </div>

            {loadingRequests ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              </div>
            ) : availableRequests.length === 0 ? (
              <div className="text-center py-8 text-surface-500 dark:text-surface-400">
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p className="font-medium">
                  {t('portal.pricing.form.noRequestsAvailable')}
                </p>
                <p className="text-sm mt-1">
                  {t('portal.pricing.form.allRequestsInOffers' as never) ||
                    'All requests are already in pricing offers or paid'}
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {availableRequests.map(request => {
                  const isSelected = selectedRequestIds.includes(request.id);
                  return (
                    <button
                      key={request.id}
                      type="button"
                      onClick={() => toggleRequestSelection(request.id)}
                      className={cn(
                        'w-full text-start p-4 rounded-xl border-2 transition-all duration-200',
                        isSelected
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600'
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-surface-900 dark:text-white truncate">
                              {request.title}
                            </h4>
                            <PortalBadge variant="gray" className="text-xs">
                              {request.type}
                            </PortalBadge>
                          </div>
                          {request.description && (
                            <p className="text-sm text-surface-500 dark:text-surface-400 mt-1 line-clamp-2">
                              {request.description}
                            </p>
                          )}
                        </div>
                        <div
                          className={cn(
                            'flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center transition-all',
                            isSelected
                              ? 'bg-blue-500 text-white'
                              : 'border-2 border-surface-300 dark:border-surface-600'
                          )}
                        >
                          {isSelected && <Check size={14} />}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </PortalCard>

          {/* Line Items */}
          <PortalCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-surface-900 dark:text-white font-outfit">
                {t('portal.pricing.form.lineItems')}
              </h3>
              <button
                type="button"
                onClick={() => append({ description: '', quantity: 1, unitPrice: 0 })}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
              >
                <Plus size={16} />
                {t('portal.pricing.form.addItem')}
              </button>
            </div>

            <div className="space-y-4">
              {/* Header */}
              <div className="grid grid-cols-12 gap-3 px-1 text-xs font-black text-surface-400 uppercase tracking-wider">
                <div className="col-span-5">{t('portal.pricing.form.itemDescription')}</div>
                <div className="col-span-2 text-center">{t('portal.pricing.form.quantity')}</div>
                <div className="col-span-3">{t('portal.pricing.form.unitPrice')}</div>
                <div className="col-span-2"></div>
              </div>

              {fields.map(
                (field: FieldArrayWithId<PricingFormData, 'lineItems', 'id'>, index: number) => (
                  <div
                    key={field.id}
                    className="grid grid-cols-12 gap-3 items-start p-4 bg-surface-50 dark:bg-surface-900/50 rounded-xl"
                  >
                    <div className="col-span-5">
                      <input
                        {...register(`lineItems.${index}.description`)}
                        type="text"
                        placeholder="Service or product..."
                        className={cn(
                          'portal-input w-full text-sm',
                          errors.lineItems?.[index]?.description && 'border-red-500'
                        )}
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        {...register(`lineItems.${index}.quantity`, {
                          valueAsNumber: true,
                        })}
                        type="number"
                        min={1}
                        className="portal-input w-full text-sm text-center"
                      />
                    </div>
                    <div className="col-span-3">
                      <div className="relative">
                        <span className="absolute start-3 top-1/2 -translate-y-1/2 text-surface-400 text-sm">
                          {CURRENCY_CONFIG[watchedCurrency]?.symbol || '$'}
                        </span>
                        <input
                          {...register(`lineItems.${index}.unitPrice`, {
                            valueAsNumber: true,
                          })}
                          type="number"
                          min={0}
                          step={0.01}
                          className="portal-input w-full text-sm ps-7"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <div className="col-span-2 flex justify-end">
                      {fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                )
              )}

              {errors.lineItems && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {typeof errors.lineItems.message === 'string'
                    ? errors.lineItems.message
                    : t('portal.pricing.form.errors.checkLineItems')}
                </p>
              )}
            </div>

            {/* Total */}
            <div className="mt-6 pt-6 border-t border-surface-200 dark:border-surface-800 flex items-center justify-between">
              <span className="text-lg font-bold text-surface-700 dark:text-surface-300">
                {t('portal.pricing.form.total')}
              </span>
              <span className="text-2xl font-black text-surface-900 dark:text-white font-outfit">
                {formatCurrency(totalAmount, watchedCurrency)}
              </span>
            </div>
          </PortalCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Currency & Validity */}
          <PortalCard className="p-6">
            <h3 className="text-lg font-bold text-surface-900 dark:text-white font-outfit mb-4">
              Settings
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-surface-700 dark:text-surface-300 mb-2">
                  {t('portal.pricing.form.currency')}
                </label>
                <select {...register('currency')} className="portal-input w-full">
                  {Object.entries(CURRENCY).map(([key, value]) => (
                    <option key={key} value={value}>
                      {CURRENCY_CONFIG[value].symbol} {CURRENCY_CONFIG[value].name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-surface-700 dark:text-surface-300 mb-2">
                  {t('portal.pricing.form.validUntil')}
                </label>
                <div className="relative">
                  <CalendarIcon
                    size={16}
                    className="absolute start-3 top-1/2 -translate-y-1/2 text-surface-400"
                  />
                  <input
                    {...register('validUntil')}
                    type="date"
                    className="portal-input w-full ps-10"
                  />
                </div>
              </div>
            </div>
          </PortalCard>

          {/* Client Info */}
          <PortalCard className="p-6">
            <h3 className="text-lg font-bold text-surface-900 dark:text-white font-outfit mb-4">
              Client Info
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-surface-700 dark:text-surface-300 mb-2">
                  {t('portal.pricing.form.clientName')}
                </label>
                <input
                  {...register('clientName')}
                  type="text"
                  placeholder={t('portal.common.namePlaceholder')}
                  className="portal-input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-surface-700 dark:text-surface-300 mb-2">
                  {t('portal.pricing.form.clientEmail')}
                </label>
                <input
                  {...register('clientEmail')}
                  type="email"
                  placeholder="client@company.com"
                  className="portal-input w-full"
                />
              </div>
            </div>
          </PortalCard>

          {/* Agency Notes */}
          <PortalCard className="p-6">
            <h3 className="text-lg font-bold text-surface-900 dark:text-white font-outfit mb-4">
              {t('portal.pricing.form.agencyNotes')}
            </h3>
            <textarea
              {...register('agencyNotes')}
              rows={4}
              placeholder={t('portal.pricing.form.agencyNotesPlaceholder')}
              className="portal-input w-full resize-none text-sm"
            />
          </PortalCard>

          {/* Error */}
          {submitStatus === 'error' && errorMessage && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertCircle size={16} />
                {errorMessage}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <PortalButton
              type="button"
              onClick={handleSubmit((data: PricingFormData) => onSubmit(data, true))}
              disabled={isSubmitting}
              className="w-full h-12 flex items-center justify-center gap-2"
            >
              {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send size={18} />}
              {isSending ? t('portal.pricing.form.sending') : t('portal.pricing.form.sendToClient')}
            </PortalButton>

            <PortalButton
              type="button"
              variant="outline"
              onClick={handleSubmit((data: PricingFormData) => onSubmit(data, false))}
              disabled={isSubmitting}
              className="w-full h-12 flex items-center justify-center gap-2"
            >
              {isSubmitting && !isSending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save size={18} />
              )}
              {t('portal.pricing.form.saveDraft')}
            </PortalButton>

            <button
              type="button"
              onClick={() => router.back()}
              className="w-full h-10 text-sm font-bold text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 transition-colors"
            >
              {t('portal.common.cancel')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
