'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useForm, useFieldArray, FieldArrayWithId } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { createPricingRequest, sendPricingRequest } from '@/lib/services/pricing-requests';
import { getRequestsByOrg } from '@/lib/services/portal-requests';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { useOrg } from '@/lib/context/OrgContext';
import {
  AlertCircle,
  CheckCircle2,
  Plus,
  Trash2,
  Send,
  Save,
  Loader2,
  CalendarIcon,
} from 'lucide-react';
import {
  RequestPricingCalculator,
  LineItemOutput,
} from '@/components/portal/pricing/RequestPricingCalculator';
import { EmbeddedCalculator } from '@/components/portal/pricing/EmbeddedCalculator';
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
  requestId?: string; // Link to a request if generated from calculator
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
  includeTax: boolean;
}

export default function CreatePricingForm() {
  const { orgId, loading: org } = useOrg();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userData } = usePortalAuth();
  const t = useTranslations();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [is, setIs] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Request selection state
  const [availableRequests, setAvailableRequests] = useState<Request[]>([]);
  const [selectedRequestIds, setSelectedRequestIds] = useState<string[]>([]);
  const [loadingRequests, setRequests] = useState(true);
  const [requestsError, setRequestsError] = useState<string | null>(null);

  // Track if line items are from calculator (to sync)
  const [lineItemsFromCalculator, setLineItemsFromCalculator] = useState(false);

  // Fetch requests that can be included in pricing offers
  useEffect(() => {
    async function fetchRequests() {
      if (!orgId || typeof orgId !== 'string') {
        setRequests(false);
        return;
      }

      setRequests(true);
      setRequestsError(null);

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
        const errorMessage = error instanceof Error ? error.message : 'Failed to load requests';
        setRequestsError(errorMessage);
        setAvailableRequests([]);
      } finally {
        setRequests(false);
      }
    }

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
        includeTax: z.boolean(),
      }),
    []
  );

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
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
      includeTax: true, // Default to true for VAT in Israel typically
    },
  });

  // Load calculator data from session storage
  useEffect(() => {
    const storedItems = sessionStorage.getItem('calculatorLineItems');
    if (storedItems) {
      try {
        const items = JSON.parse(storedItems);
        if (Array.isArray(items) && items.length > 0) {
          // Convert from cents to base unit for the form
          const formItems = items.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice / 100,
            notes: '',
          }));

          const firstItem = formItems[0];

          // Use reset to update the whole form
          const currentValues = watch();
          // Title can be more descriptive if multiple items
          const suggestedTitle =
            formItems.length === 1 ? firstItem.description : t('portal.pricing.calculatorTitle');

          // Preserve other values but update line items
          reset({
            ...currentValues,
            title: suggestedTitle,
            lineItems: formItems,
          });

          // Clear storage so it doesn't persist
          sessionStorage.removeItem('calculatorLineItems');
        }
      } catch (e) {
        console.error('Failed to parse calculator items:', e);
      }
    }
  }, [watch, reset, t]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lineItems',
  });

  const watchedLineItems = watch('lineItems');
  const watchedCurrency = watch('currency');

  // Handle line items generated from calculator
  const handleCalculatorLineItems = useCallback(
    (items: LineItemOutput[]) => {
      if (items.length > 0) {
        // Replace all line items with calculator-generated ones
        const newLineItems = items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          notes: item.notes,
          requestId: item.requestId,
        }));

        // Get current form values and update
        const currentValues = watch();
        reset({
          ...currentValues,
          lineItems: newLineItems,
          // Auto-generate title from first request if not set
          title:
            currentValues.title ||
            (items.length === 1
              ? items[0].description.split(' (')[0]
              : t('portal.pricing.calculatorTitle')),
        });
        setLineItemsFromCalculator(true);
      } else if (lineItemsFromCalculator) {
        // If no items from calculator and we were tracking, reset to empty
        const currentValues = watch();
        reset({
          ...currentValues,
          lineItems: [{ description: '', quantity: 1, unitPrice: 0 }],
        });
        setLineItemsFromCalculator(false);
      }
    },
    [watch, reset, t, lineItemsFromCalculator]
  );

  const { totalAmount, subtotal, taxAmount } = useMemo(() => {
    const items: PricingLineItem[] = (watchedLineItems || []).map(
      (item: LineItemInput, index: number) => ({
        id: `temp_${index}`,
        description: item.description || '',
        quantity: item.quantity || 0,
        unitPrice: Math.round((item.unitPrice || 0) * 100), // Convert to cents
      })
    );
    const taxRate = watch('includeTax') ? 0.17 : 0;
    const subtotal = calculateTotalAmount(items, 0); // items sum
    const taxAmount = Math.round(subtotal * taxRate);
    const totalAmount = subtotal + taxAmount;

    return { totalAmount, subtotal, taxAmount };
  }, [watchedLineItems, watch('includeTax')]);

  const onSubmit = async (data: PricingFormData, shouldSend: boolean) => {
    if (!userData?.id || !orgId || typeof orgId !== 'string') {
      setErrorMessage(t('portal.common.authRequired'));
      setSubmitStatus('error');
      return;
    }

    setIsSubmitting(true);
    if (shouldSend) setIs(true);
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

      const request = await createPricingRequest(
        orgId,
        userData.id,
        userData.name || t('portal.common.unknown'),
        {
          title: data.title,
          description: data.description,
          lineItems,
          currency: data.currency,
          validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
          clientName: data.clientName,
          clientEmail: data.clientEmail,
          agencyNotes: data.agencyNotes,
          requestIds: selectedRequestIds.length > 0 ? selectedRequestIds : undefined,
        }
      );

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
      setIs(false);
    }
  };

  if (org) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      </div>
    );
  }

  if (submitStatus === 'success') {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <Card className="p-12 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 rounded-3xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-surface-900 dark:text-white font-outfit mb-2">
            {is ? 'Offer Sent!' : 'Draft Saved!'}
          </h2>
          <p className="text-surface-500 dark:text-surface-400 max-w-sm">
            {is
              ? 'Your pricing offer has been sent to the client.'
              : 'Your draft has been saved. You can send it when ready.'}
          </p>
        </Card>
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
            {t('portal.pricing.form.createNewDescription' as never) ||
              'Create a new pricing proposal for your client.'}
          </p>
        </div>
      </div>

      <form className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-bold text-surface-900 dark:text-white font-outfit mb-4">
              {t('portal.pricing.form.offerDetails' as never) || 'Offer Details'}
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
          </Card>

          {/* Request Selection & Pricing Calculator */}
          <RequestPricingCalculator
            availableRequests={availableRequests}
            selectedRequestIds={selectedRequestIds}
            onSelectionChange={setSelectedRequestIds}
            onLineItemsChange={handleCalculatorLineItems}
            currency={watchedCurrency}
            is={loadingRequests}
            error={requestsError}
            onQuickAddRequest={() => router.push(getPortalPath('/requests/new'))}
            orgId={orgId!}
          />

          {/* Manual Line Items - For additional items or when no requests selected */}
          {(!lineItemsFromCalculator || selectedRequestIds.length === 0) && (
            <>
              {/* Embedded Calculator for manual items */}
              <EmbeddedCalculator
                onAddItem={item => {
                  append({
                    description: item.description,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                  });
                  setLineItemsFromCalculator(false);
                }}
                currency={watchedCurrency}
                defaultExpanded={
                  selectedRequestIds.length === 0 &&
                  fields.length <= 1 &&
                  !watchedLineItems?.[0]?.description
                }
              />
            </>
          )}

          {/* Line Items (Editable) */}
          <Card padding="none">
            <div className="p-6 pb-0">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-surface-900 dark:text-white font-outfit">
                    {t('portal.pricing.form.lineItems')}
                  </h3>
                  {lineItemsFromCalculator && selectedRequestIds.length > 0 && (
                    <p className="text-xs text-surface-500 mt-1">
                      {t('portal.pricing.form.lineItemsFromCalculator' as never) ||
                        ' from selected requests - edit as needed'}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    append({ description: '', quantity: 1, unitPrice: 0 });
                    setLineItemsFromCalculator(false);
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                >
                  <Plus size={16} />
                  {t('portal.pricing.form.addItem')}
                </button>
              </div>
            </div>

            <div className="px-6 space-y-3">
              {/* Header - Hidden on mobile, visible on larger screens */}
              <div className="hidden sm:grid grid-cols-12 gap-3 px-1 text-xs font-black text-surface-400 uppercase tracking-wider">
                <div className="col-span-5 md:col-span-6">
                  {t('portal.pricing.form.itemDescription')}
                </div>
                <div className="col-span-2 text-center">{t('portal.pricing.form.quantity')}</div>
                <div className="col-span-3 md:col-span-2">{t('portal.pricing.form.unitPrice')}</div>
                <div className="col-span-2"></div>
              </div>

              {fields.map(
                (field: FieldArrayWithId<PricingFormData, 'lineItems', 'id'>, index: number) => (
                  <div
                    key={field.id}
                    className="flex flex-col sm:grid sm:grid-cols-12 gap-3 items-start p-4 bg-surface-50 dark:bg-surface-900/50 rounded-xl"
                  >
                    {/* Description - Full width on mobile */}
                    <div className="w-full sm:col-span-5 md:col-span-6">
                      <label className="block text-xs font-semibold text-surface-500 mb-1 sm:hidden">
                        {t('portal.pricing.form.itemDescription')}
                      </label>
                      <input
                        {...register(`lineItems.${index}.description`)}
                        type="text"
                        placeholder={
                          t('portal.pricing.form.itemDescriptionPlaceholder' as never) ||
                          'Service or product...'
                        }
                        className={cn(
                          'portal-input w-full text-sm',
                          errors.lineItems?.[index]?.description && 'border-red-500'
                        )}
                      />
                    </div>
                    {/* Quantity and Price row on mobile */}
                    <div className="flex gap-3 w-full sm:contents">
                      <div className="flex-1 sm:col-span-2">
                        <label className="block text-xs font-semibold text-surface-500 mb-1 sm:hidden">
                          {t('portal.pricing.form.quantity')}
                        </label>
                        <input
                          {...register(`lineItems.${index}.quantity`, {
                            valueAsNumber: true,
                          })}
                          type="number"
                          min={1}
                          className="portal-input w-full text-sm text-center"
                        />
                      </div>
                      <div className="flex-1 sm:col-span-3 md:col-span-2">
                        <label className="block text-xs font-semibold text-surface-500 mb-1 sm:hidden">
                          {t('portal.pricing.form.unitPrice')}
                        </label>
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
                      {/* Delete button */}
                      <div className="sm:col-span-2 flex items-end sm:items-start justify-end">
                        {fields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            aria-label={t('portal.common.delete')}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
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
            {/* Subtotal, Tax, Total */}
            <div className="mx-6 mt-6 pt-6 border-t border-surface-200 dark:border-surface-800 space-y-3">
              <div className="flex items-center justify-between text-sm text-surface-500">
                <span>{t('portal.pricing.form.subtotal' as any) || 'Subtotal'}</span>
                <span>{formatCurrency(subtotal, watchedCurrency)}</span>
              </div>

              <div className="flex items-center justify-between text-sm text-surface-500">
                <div className="flex items-center gap-2">
                  <span>{t('portal.pricing.form.tax' as any) || 'VAT (17%)'}</span>
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="form-checkbox h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      {...register('includeTax')}
                    />
                  </label>
                </div>
                <span>{formatCurrency(taxAmount, watchedCurrency)}</span>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-surface-100 dark:border-surface-800/50">
                <span className="text-lg font-bold text-surface-700 dark:text-surface-300">
                  {t('portal.pricing.form.total')}
                </span>
                <span className="text-2xl font-black text-surface-900 dark:text-white font-outfit">
                  {formatCurrency(totalAmount, watchedCurrency)}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Currency & Validity */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-surface-900 dark:text-white font-outfit mb-4">
              {t('portal.pricing.form.settings' as never) || 's'}
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
          </Card>

          {/* Client Info */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-surface-900 dark:text-white font-outfit mb-4">
              {t('portal.pricing.form.clientInfo' as never) || 'Client Info'}
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
          </Card>

          {/* Agency Notes */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-surface-900 dark:text-white font-outfit mb-4">
              {t('portal.pricing.form.agencyNotes')}
            </h3>
            <textarea
              {...register('agencyNotes')}
              rows={4}
              placeholder={t('portal.pricing.form.agencyNotesPlaceholder')}
              className="portal-input w-full resize-none text-sm"
            />
          </Card>

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
            <Button
              type="button"
              onClick={handleSubmit((data: PricingFormData) => onSubmit(data, true))}
              disabled={isSubmitting}
              className="w-full h-12 flex items-center justify-center gap-2"
            >
              {is ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send size={18} />}
              {is ? t('portal.pricing.form.sending') : t('portal.pricing.form.sendToClient')}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleSubmit((data: PricingFormData) => onSubmit(data, false))}
              disabled={isSubmitting}
              className="w-full h-12 flex items-center justify-center gap-2"
            >
              {isSubmitting && !is ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save size={18} />
              )}
              {t('portal.pricing.form.saveDraft')}
            </Button>

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
