'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useForm, useFieldArray, FieldArrayWithId } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import {
  PortalFormField,
  PortalFormGrid,
  PortalFormSection,
} from '@/components/portal/ui/PortalFormField';
import { getRequestsByOrg } from '@/lib/services/portal-requests';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { useRequestCommercialMutations } from '@/lib/hooks/useRequestCommercial';
import { useAgencyTeam } from '@/lib/hooks/useAgencyTeam';
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
import { usePortalTranslations } from '@/lib/i18n/translations';
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
import { TAX_RATE } from '@/lib/constants/pricing';

interface LineItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
  requestId?: string; // Link to a request if generated from calculator
  pricingType?: 'fixed' | 'hourly' | 'estimate';
}

interface PricingFormData {
  title: string;
  description?: string;
  lineItems: LineItemInput[];
  currency: Currency;
  validUntil?: string;
  timeframe: string;
  workDeadline?: string;
  assignedTo: string;
  clientName?: string;
  clientEmail?: string;
  agencyNotes?: string;
  includeTax: boolean;
  terms: string;
  paymentRequired: boolean;
  depositAmount: number;
}

export default function CreatePricingForm() {
  const { orgId, loading: org } = useOrg();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userData } = usePortalAuth();
  const { createPricingRequest, sendPricingRequest } = useRequestCommercialMutations();
  const agencyTeam = useAgencyTeam();
  const t = usePortalTranslations();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSending, setIsSending] = useState(false);
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
          r =>
            eligibleStatuses.includes(r.status) &&
            r.requestRole !== 'bundle' &&
            !r.parentRequestId
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
          .max(200, t('pricing.form.errors.titleTooLong')),
        description: z.string().optional(),
        lineItems: z
          .array(
            z.object({
              description: z.string().min(1, t('common.descriptionRequired')),
              quantity: z.number().min(1, t('pricing.form.errors.quantityMustBeAtLeast1')),
              unitPrice: z.number().min(0, 'Price must be positive'),
              notes: z.string().optional(),
              requestId: z.string().optional(),
              pricingType: z.enum(['fixed', 'hourly', 'estimate']).optional(),
            })
          )
          .min(1, 'Add at least one line item'),
        currency: z.enum(['USD', 'ILS', 'EUR']),
        validUntil: z.string().optional(),
        timeframe: z.string().trim().min(1),
        workDeadline: z.string().optional(),
        assignedTo: z.string().trim().min(1),
        clientName: z.string().optional(),
        clientEmail: z.string().email().optional().or(z.literal('')),
        agencyNotes: z.string().optional(),
        includeTax: z.boolean(),
        terms: z.string().min(1),
        paymentRequired: z.boolean(),
        depositAmount: z.number().min(0),
      }),
    [t]
  );

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<PricingFormData>({
    resolver: zodResolver(pricingSchema),
    defaultValues: {
      title: '',
      description: '',
      lineItems: [{ description: '', quantity: 1, unitPrice: 0 }],
      currency: 'ILS',
      timeframe: '',
      workDeadline: '',
      assignedTo: '',
      clientName: '',
      clientEmail: '',
      agencyNotes: '',
      includeTax: true, // Default to true for VAT in Israel typically
      terms: t('pricing.form.defaultTerms'),
      paymentRequired: false,
      depositAmount: 0,
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
            pricingType: 'fixed' as const,
          }));

          const firstItem = formItems[0];

          // Use reset to update the whole form
          const currentValues = watch();
          // Title can be more descriptive if multiple items
          const suggestedTitle =
            formItems.length === 1 ? firstItem.description : t('pricing.calculatorTitle');

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

  const currencyOptions = useMemo(
    () =>
      Object.entries(CURRENCY).map(([, value]) => ({
        value,
        label: `${CURRENCY_CONFIG[value].symbol} ${CURRENCY_CONFIG[value].name}`,
      })),
    []
  );

  const developerOptions = useMemo(
    () =>
      (agencyTeam.data || []).map(member => ({
        value: member.id,
        label: member.name || member.email || '',
      })),
    [agencyTeam.data]
  );

  const pricingTypeOptions = useMemo(
    () => [
      { value: 'fixed', label: t('pricing.form.pricingType.fixed') },
      { value: 'hourly', label: t('pricing.form.pricingType.hourly') },
      { value: 'estimate', label: t('pricing.form.pricingType.estimate') },
    ],
    [t]
  );

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
          pricingType: 'fixed' as const,
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
              : t('pricing.calculatorTitle')),
        });
        setLineItemsFromCalculator(true);
      } else if (lineItemsFromCalculator) {
        // If no items from calculator and we were tracking, reset to empty
        const currentValues = watch();
        reset({
          ...currentValues,
          lineItems: [{ description: '', quantity: 1, unitPrice: 0, pricingType: 'fixed' }],
        });
        setLineItemsFromCalculator(false);
      }
    },
    [watch, reset, t, lineItemsFromCalculator]
  );

  const watchedIncludeTax = watch('includeTax');

  const { totalAmount, subtotal, taxAmount } = useMemo(() => {
    const items: PricingLineItem[] = (watchedLineItems || []).map(
      (item: LineItemInput, index: number) => ({
        id: `temp_${index}`,
        description: item.description || '',
        quantity: item.quantity || 0,
        unitPrice: Math.round((item.unitPrice || 0) * 100), // Convert to cents
        pricingType: item.pricingType,
      })
    );
    const taxRate = watchedIncludeTax ? TAX_RATE : 0;
    const subtotal = calculateTotalAmount(items, 0); // items sum
    const taxAmount = Math.round(subtotal * taxRate);
    const totalAmount = subtotal + taxAmount;

    return { totalAmount, subtotal, taxAmount };
  }, [watchedLineItems, watchedIncludeTax]);

  const watchedPaymentRequired = watch('paymentRequired');
  const watchedDepositAmount = watch('depositAmount');

  useEffect(() => {
    if (watchedPaymentRequired && !watchedDepositAmount && totalAmount > 0) {
      setValue('depositAmount', totalAmount / 100);
    }
  }, [watchedPaymentRequired, watchedDepositAmount, totalAmount, setValue]);

  const onSubmit = async (data: PricingFormData, shouldSend: boolean) => {
    if (!userData?.id || !orgId || typeof orgId !== 'string') {
      setErrorMessage(t('common.authRequired'));
      setSubmitStatus('error');
      return;
    }

    setIsSubmitting(true);
    if (shouldSend) setIsSending(true);
    setSubmitStatus('idle');
    setErrorMessage(null);

    try {
      // Convert prices from dollars to cents
      const lineItems = data.lineItems.map((item, index) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: Math.round(item.unitPrice * 100),
        notes: item.notes,
        pricingType: item.pricingType || 'fixed',
        sortOrder: index,
        requestId: item.requestId,
      }));
      const assignedDeveloper = agencyTeam.data?.find(member => member.id === data.assignedTo);

      const request = await createPricingRequest({
        orgId,
        userId: userData.id,
        userName: userData.name || t('common.unknown'),
        data: {
          title: data.title,
          description: data.description,
          lineItems,
          currency: data.currency,
          validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
          timeframe: data.timeframe,
          workDeadline: data.workDeadline ? new Date(data.workDeadline) : undefined,
          assignedTo: data.assignedTo,
          assignedToName: assignedDeveloper?.name || assignedDeveloper?.email || '',
          clientName: data.clientName,
          clientEmail: data.clientEmail,
          agencyNotes: data.agencyNotes,
          requestIds: selectedRequestIds.length > 0 ? selectedRequestIds : undefined,
          proposalType: 'work_proposal',
          terms: data.terms,
          publicAccessEnabled: true,
          taxRate: data.includeTax ? TAX_RATE : 0,
          paymentRequired: data.paymentRequired,
          depositAmount: data.paymentRequired ? Math.round(data.depositAmount * 100) : 0,
          billingMode: 'manual_installments',
        },
      });

      // If sending, update status to SENT
      if (shouldSend) {
        await sendPricingRequest(request.id);
      }

      setSubmitStatus('success');

      setTimeout(() => {
        router.push(getPortalPath(`/requests/${request.id}/`));
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

  if (org) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
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
            {isSending ? 'Offer Sent!' : 'Draft Saved!'}
          </h2>
          <p className="text-surface-500 dark:text-surface-400 max-w-sm">
            {isSending
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
          <h1 className="portal-page-title">{t('pricing.newOffer')}</h1>
          <p className="portal-page-subtitle">
            {t('pricing.form.createNewDescription' as never) ||
              'Create a new pricing proposal for your client.'}
          </p>
        </div>
      </div>

      <form className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <PortalFormSection
              title={t('pricing.form.offerDetails' as never) || 'Offer Details'}
            >
              <Input
                label={t('pricing.form.titleLabel')}
                required
                placeholder={t('pricing.form.titlePlaceholder')}
                error={errors.title?.message}
                {...register('title')}
              />

              <PortalFormField label={t('pricing.form.descriptionLabel')}>
                <Textarea
                  {...register('description')}
                  rows={3}
                  placeholder={t('pricing.form.descriptionPlaceholder')}
                  className="resize-none"
                />
              </PortalFormField>

              <PortalFormField label={t('pricing.form.terms')}>
                <Textarea
                  {...register('terms')}
                  rows={10}
                  className="resize-y text-sm leading-6"
                />
              </PortalFormField>
            </PortalFormSection>
          </Card>

          {/* Request Selection & Pricing Calculator */}
          <RequestPricingCalculator
            availableRequests={availableRequests}
            selectedRequestIds={selectedRequestIds}
            onSelectionChange={setSelectedRequestIds}
            onLineItemsChange={handleCalculatorLineItems}
            currency={watchedCurrency}
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
                    {t('pricing.form.lineItems')}
                  </h3>
                  {lineItemsFromCalculator && selectedRequestIds.length > 0 && (
                    <p className="text-xs text-surface-500 mt-1">
                      {t('pricing.form.lineItemsFromCalculator' as never) ||
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
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-bold text-primary-600 hover:text-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all"
                >
                  <Plus size={16} />
                  {t('pricing.form.addItem')}
                </button>
              </div>
            </div>

            <div className="px-6 space-y-3">
              {/* Header - Hidden on mobile, visible on larger screens */}
              <div className="hidden sm:grid grid-cols-12 gap-3 px-1 text-xs font-black text-surface-400 uppercase tracking-wider">
                <div className="col-span-5 md:col-span-6">
                  {t('pricing.form.itemDescription')}
                </div>
                <div className="col-span-2 text-center">{t('pricing.form.quantity')}</div>
                <div className="col-span-3 md:col-span-2">{t('pricing.form.unitPrice')}</div>
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
                        {t('pricing.form.itemDescription')}
                      </label>
                      <Input
                        {...register(`lineItems.${index}.description`)}
                        type="text"
                        placeholder={
                          t('pricing.form.itemDescriptionPlaceholder' as never) ||
                          'Service or product...'
                        }
                        error={errors.lineItems?.[index]?.description?.message}
                        className="text-sm"
                      />
                      <Select
                        {...register(`lineItems.${index}.pricingType`)}
                        options={pricingTypeOptions}
                        className="mt-2 text-xs"
                      />
                    </div>
                    {/* Quantity and Price row on mobile */}
                    <div className="flex gap-3 w-full sm:contents">
                      <div className="flex-1 sm:col-span-2">
                        <label className="block text-xs font-semibold text-surface-500 mb-1 sm:hidden">
                          {t('pricing.form.quantity')}
                        </label>
                        <Input
                          {...register(`lineItems.${index}.quantity`, {
                            valueAsNumber: true,
                          })}
                          type="number"
                          min={1}
                          className="text-sm text-center"
                        />
                      </div>
                      <div className="flex-1 sm:col-span-3 md:col-span-2">
                        <label className="block text-xs font-semibold text-surface-500 mb-1 sm:hidden">
                          {t('pricing.form.unitPrice')}
                        </label>
                        <Input
                          {...register(`lineItems.${index}.unitPrice`, {
                            valueAsNumber: true,
                          })}
                          type="number"
                          min={0}
                          step={0.01}
                          placeholder="0.00"
                          leftIcon={
                            <span className="text-sm">
                              {CURRENCY_CONFIG[watchedCurrency]?.symbol || '$'}
                            </span>
                          }
                          className="text-sm"
                        />
                      </div>
                      {/* Delete button */}
                      <div className="sm:col-span-2 flex items-end sm:items-start justify-end">
                        {fields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            aria-label={t('common.delete')}
                            className="portal-focus-ring min-w-[44px] min-h-[44px] flex items-center justify-center  p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
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
                    : t('pricing.form.errors.checkLineItems')}
                </p>
              )}
            </div>

            {/* Total */}
            {/* Subtotal, Tax, Total */}
            <div className="mx-6 mt-6 pt-6 border-t border-surface-200 dark:border-surface-800 space-y-3">
              <div className="flex items-center justify-between text-sm text-surface-500">
                <span>{t('pricing.form.subtotal') || 'Subtotal'}</span>
                <span>{formatCurrency(subtotal, watchedCurrency)}</span>
              </div>

              <div className="flex items-center justify-between text-sm text-surface-500">
                <div className="flex items-center gap-2">
                  <span>{t('pricing.form.tax') || 'VAT (17%)'}</span>
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="form-checkbox h-4 w-4 text-primary-600 rounded border-gray-300 focus-visible:ring-primary-500/40"
                      {...register('includeTax')}
                    />
                  </label>
                </div>
                <span>{formatCurrency(taxAmount, watchedCurrency)}</span>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-surface-100 dark:border-surface-800/50">
                <span className="text-lg font-bold text-surface-700 dark:text-surface-300">
                  {t('pricing.form.total')}
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
            <PortalFormSection title={t('pricing.form.settings' as never) || 'Settings'}>
              <Select
                label={t('pricing.form.currency')}
                options={currencyOptions}
                {...register('currency')}
              />

              <Input
                label={t('pricing.form.validUntil')}
                type="date"
                leftIcon={<CalendarIcon size={16} />}
                {...register('validUntil')}
              />

              <Input
                label={t('pricing.form.timeframe')}
                required
                placeholder={t('pricing.form.timeframePlaceholder')}
                error={errors.timeframe?.message}
                {...register('timeframe')}
              />

              <Input
                label={t('pricing.form.workDeadline')}
                type="date"
                leftIcon={<CalendarIcon size={16} />}
                {...register('workDeadline')}
              />

              <Select
                label={t('pricing.form.assignedDeveloper')}
                placeholder={t('pricing.form.selectDeveloper')}
                options={developerOptions}
                error={errors.assignedTo?.message}
                {...register('assignedTo')}
              />
            </PortalFormSection>
          </Card>

          {/* Client Info */}
          <Card className="p-6">
            <PortalFormSection
              title={t('pricing.form.clientInfo' as never) || 'Client Info'}
            >
              <PortalFormGrid className="md:grid-cols-1">
                <Input
                  label={t('pricing.form.clientName')}
                  type="text"
                  placeholder={t('common.namePlaceholder')}
                  {...register('clientName')}
                />
                <Input
                  label={t('pricing.form.clientEmail')}
                  type="email"
                  placeholder="client@company.com"
                  error={errors.clientEmail?.message}
                  {...register('clientEmail')}
                />
              </PortalFormGrid>
            </PortalFormSection>
          </Card>

          {/* Agency Notes */}
          <Card className="p-6">
            <PortalFormSection title={t('pricing.form.payment')}>
              <label className="flex items-start gap-3 text-sm text-surface-600 dark:text-surface-300">
                <input type="checkbox" className="mt-1" {...register('paymentRequired')} />
                <span>{t('pricing.form.requireDeposit')}</span>
              </label>
              {watchedPaymentRequired && (
                <Input
                  label={t('pricing.form.depositAmount')}
                  type="number"
                  min={0.01}
                  step={0.01}
                  {...register('depositAmount', { valueAsNumber: true })}
                />
              )}
            </PortalFormSection>
          </Card>

          <Card className="p-6">
            <PortalFormSection title={t('pricing.form.agencyNotes')}>
              <Textarea
                {...register('agencyNotes')}
                rows={4}
                placeholder={t('pricing.form.agencyNotesPlaceholder')}
                className="resize-none text-sm"
              />
            </PortalFormSection>
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
              {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send size={18} />}
              {isSending ? t('pricing.form.sending') : t('pricing.form.sendToClient')}
            </Button>

            <Button
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
              {t('pricing.form.saveDraft')}
            </Button>

            <button
              type="button"
              onClick={() => router.back()}
              className="w-full h-10 text-sm font-bold text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 transition-colors"
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
