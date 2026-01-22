'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm, useFieldArray, FieldArrayWithId } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, Link } from '@/i18n/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  getPricingRequest,
  updatePricingRequest,
  sendPricingRequest,
} from '@/lib/services/pricing-requests';
import { getRequest } from '@/lib/services/portal-requests';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { useResolvedOrgId } from '@/lib/hooks/useResolvedOrgId';
import { useResolvedPricingId } from '@/lib/hooks/useResolvedPricingId';
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
  ArrowLeft,
} from 'lucide-react';
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
  PricingRequest,
  PRICING_STATUS,
  generateLineItemId,
} from '@/lib/types/pricing';
import { Request } from '@/lib/types/portal';
import { TAX_RATE, REDIRECT_DELAY } from '@/lib/constants/pricing';

interface LineItemInput {
  id: string;
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
  includeTax: boolean;
}

export default function EditPricingForm() {
  const orgId = useResolvedOrgId();
  const pricingId = useResolvedPricingId();
  const router = useRouter();
  const { userData, isAgency } = usePortalAuth();
  const t = useTranslations('portal');

  const [isLoading, setIsLoading] = useState(true);
  const [pricingRequest, setPricingRequest] = useState<PricingRequest | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Linked requests (read-only display)
  const [linkedRequests, setLinkedRequests] = useState<Request[]>([]);

  const pricingSchema = useMemo(
    () =>
      z.object({
        title: z
          .string()
          .min(3, 'Title must be at least 3 characters')
          .max(200, 'Title is too long'),
        description: z.string().optional(),
        lineItems: z
          .array(
            z.object({
              id: z.string(),
              description: z.string().min(1, t('common.descriptionRequired')),
              quantity: z.number().min(1, t('pricing.form.errors.quantityMustBeAtLeast1')),
              unitPrice: z.number().min(0, t('pricing.form.errors.priceMustBePositive')),
              notes: z.string().optional(),
            })
          )
          .min(1, 'Add at least one line item'),
        currency: z.enum(['USD', 'ILS', 'EUR']),
        validUntil: z.string().optional(),
        clientName: z.string().optional(),
        clientEmail: z.string().optional().or(z.literal('')),
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
      lineItems: [{ id: generateLineItemId(), description: '', quantity: 1, unitPrice: 0 }],
      currency: 'USD',
      clientName: '',
      clientEmail: '',
      agencyNotes: '',
      includeTax: true,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lineItems',
  });

  const watchedLineItems = watch('lineItems');
  const watchedCurrency = watch('currency');
  const watchedIncludeTax = watch('includeTax');

  // Fetch pricing request data
  useEffect(() => {
    if (!orgId || !pricingId || typeof orgId !== 'string' || typeof pricingId !== 'string') {
      setErrorMessage(t('common.error'));
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const request = await getPricingRequest(pricingId);
        if (!request) {
          setErrorMessage('Pricing offer not found');
          setIsLoading(false);
          return;
        }

        // Check if agency can edit this (only DRAFT or SENT status)
        if (request.status !== PRICING_STATUS.DRAFT && request.status !== PRICING_STATUS.SENT) {
          setErrorMessage('This pricing offer cannot be edited in its current status');
          setIsLoading(false);
          return;
        }

        setPricingRequest(request);

        // Fetch linked requests
        if (request.requestIds && request.requestIds.length > 0) {
          const requestPromises = request.requestIds.map(id => getRequest(id));
          const requests = await Promise.all(requestPromises);
          const validRequests = requests.filter((r): r is Request => r !== null);
          setLinkedRequests(validRequests);
        }

        // Convert prices from cents to dollars for form display
        const lineItems = request.lineItems.map(item => ({
          id: item.id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice / 100,
          notes: item.notes,
        }));

        // Format validUntil date for input
        let validUntilStr = '';
        if (request.validUntil) {
          const date = request.validUntil.toDate();
          validUntilStr = date.toISOString().split('T')[0];
        }

        // Reset form with loaded data
        reset({
          title: request.title,
          description: request.description || '',
          lineItems,
          currency: request.currency,
          validUntil: validUntilStr,
          clientName: request.clientName || '',
          clientEmail: request.clientEmail || '',
          agencyNotes: request.agencyNotes || '',
          includeTax: (request.taxRate || 0) > 0,
        });
      } catch (err) {
        console.error('Failed to fetch pricing request:', err);
        setErrorMessage(t('pricing.form.errors.failedToLoad'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [orgId, pricingId, t, reset]);

  // Note: Request selection is not available in edit mode
  // Linked requests are displayed read-only from the initial fetch

  const { totalAmount, subtotal, taxAmount } = useMemo(() => {
    const items: PricingLineItem[] = (watchedLineItems || []).map((item: LineItemInput) => ({
      id: item.id,
      description: item.description || '',
      quantity: item.quantity || 0,
      unitPrice: Math.round((item.unitPrice || 0) * 100), // Convert to cents
    }));
    const taxRate = watchedIncludeTax ? TAX_RATE : 0;
    const subtotal = calculateTotalAmount(items, 0);
    const taxAmount = Math.round(subtotal * taxRate);
    const totalAmount = subtotal + taxAmount;

    return { totalAmount, subtotal, taxAmount };
  }, [watchedLineItems, watchedIncludeTax]);

  const onSubmit = async (data: PricingFormData, shouldSend: boolean) => {
    if (
      !userData?.id ||
      !orgId ||
      typeof orgId !== 'string' ||
      !pricingId ||
      typeof pricingId !== 'string'
    ) {
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
      const lineItems: PricingLineItem[] = data.lineItems.map(item => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: Math.round(item.unitPrice * 100),
        notes: item.notes,
      }));

      await updatePricingRequest(pricingId, {
        title: data.title,
        description: data.description,
        lineItems,
        currency: data.currency,
        validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
        clientName: data.clientName,
        clientEmail: data.clientEmail,
        agencyNotes: data.agencyNotes,
        requestIds: linkedRequests.map(r => r.id),
        taxRate: data.includeTax ? TAX_RATE : 0,
      });

      // If sending, update status to SENT
      if (shouldSend && pricingRequest?.status === PRICING_STATUS.DRAFT) {
        await sendPricingRequest(pricingId);
      }

      setSubmitStatus('success');

      setTimeout(() => {
        router.push(`/portal/pricing/${pricingId}/`);
      }, REDIRECT_DELAY);
    } catch (error) {
      console.error('Failed to update pricing request:', error);
      setErrorMessage('Failed to update pricing offer. Please try again.');
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
      setIsSending(false);
    }
  };

  const isSent = pricingRequest?.status === PRICING_STATUS.SENT;

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-sm font-bold text-surface-400 font-outfit">{t('common.loading')}</p>
      </div>
    );
  }

  if (errorMessage && !pricingRequest) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500" />
        <h2 className="text-xl font-bold text-surface-900 dark:text-white">{t('common.error')}</h2>
        <p className="text-surface-500 dark:text-surface-400 max-w-sm">{errorMessage}</p>
        <Link href="/portal/pricing/">
          <Button>{t('common.back')}</Button>
        </Link>
      </div>
    );
  }

  if (!isAgency) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500" />
        <h2 className="text-xl font-bold text-surface-900 dark:text-white">Access Denied</h2>
        <p className="text-surface-500 dark:text-surface-400 max-w-sm">
          Only agency members can edit pricing offers.
        </p>
        <Link href="/portal/pricing/">
          <Button>{t('common.back')}</Button>
        </Link>
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
            {isSent ? 'Offer Sent!' : 'Changes Saved!'}
          </h2>
          <p className="text-surface-500 dark:text-surface-400 max-w-sm">
            {isSent
              ? 'Your pricing offer has been sent to the client.'
              : 'Your changes have been saved successfully.'}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center gap-4">
        <Link href={`/portal/pricing/${pricingId}/`}>
          <Button variant="ghost" className="flex items-center gap-2">
            <ArrowLeft size={18} />
            {t('common.back')}
          </Button>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-surface-900 dark:text-white font-outfit">
            {t('pricing.editOffer')}
          </h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1 font-medium">
            {t('pricing.editOfferDescription')}
          </p>
        </div>
        {pricingRequest && (
          <Badge variant={pricingRequest.status === PRICING_STATUS.DRAFT ? 'gray' : 'blue'}>
            {pricingRequest.status}
          </Badge>
        )}
      </div>

      <form className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-bold text-surface-900 dark:text-white font-outfit mb-4">
              {t('pricing.form.offerDetails')}
            </h3>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-bold text-surface-700 dark:text-surface-300 mb-2">
                  {t('pricing.form.titleLabel')} *
                </label>
                <input
                  {...register('title')}
                  type="text"
                  placeholder={t('pricing.form.titlePlaceholder')}
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
                  {t('pricing.form.descriptionLabel')}
                </label>
                <textarea
                  {...register('description')}
                  rows={3}
                  placeholder={t('pricing.form.descriptionPlaceholder')}
                  className="portal-input w-full resize-none"
                />
              </div>
            </div>
          </Card>

          {/* Linked Requests (Read-only display) */}
          {linkedRequests.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-surface-900 dark:text-white font-outfit">
                    <FileText className="inline w-5 h-5 me-2" />
                    {t('pricing.includedRequests')}
                  </h3>
                  <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                    {t('pricing.form.linkedRequestsLabel')}
                  </p>
                </div>
                <Badge variant="blue">
                  {linkedRequests.length}{' '}
                  {linkedRequests.length === 1
                    ? t('pricing.form.selected_singular')
                    : t('pricing.form.selected')}
                </Badge>
              </div>

              <div className="space-y-2">
                {linkedRequests.map(request => (
                  <div
                    key={request.id}
                    className="p-4 rounded-xl border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-surface-900 dark:text-white truncate">
                            {request.title}
                          </h4>
                          <Badge variant="gray" className="text-xs">
                            {request.type}
                          </Badge>
                        </div>
                        {request.description && (
                          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1 line-clamp-2">
                            {request.description}
                          </p>
                        )}
                      </div>
                      <div className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center bg-blue-500 text-white">
                        <Check size={14} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Embedded Calculator */}
          <EmbeddedCalculator
            onAddItem={item => {
              append({
                id: generateLineItemId(),
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
              });
            }}
            currency={watchedCurrency}
            defaultExpanded={false}
          />

          {/* Line Items */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-surface-900 dark:text-white font-outfit">
                {t('pricing.form.lineItems')}
              </h3>
              <button
                type="button"
                onClick={() =>
                  append({ id: generateLineItemId(), description: '', quantity: 1, unitPrice: 0 })
                }
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
              >
                <Plus size={16} />
                {t('pricing.form.addItem')}
              </button>
            </div>

            <div className="space-y-4">
              {/* Header */}
              <div className="grid grid-cols-12 gap-3 px-1 text-xs font-black text-surface-400 uppercase tracking-wider">
                <div className="col-span-5">{t('pricing.form.itemDescription')}</div>
                <div className="col-span-2 text-center">{t('pricing.form.quantity')}</div>
                <div className="col-span-3">{t('pricing.form.unitPrice')}</div>
                <div className="col-span-2"></div>
              </div>

              {fields.map(
                (field: FieldArrayWithId<PricingFormData, 'lineItems', 'id'>, index: number) => (
                  <div
                    key={field.id}
                    className="grid grid-cols-12 gap-3 items-start p-4 bg-surface-50 dark:bg-surface-900/50 rounded-xl"
                  >
                    <input type="hidden" {...register(`lineItems.${index}.id`)} />
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
                    : t('pricing.form.errors.checkLineItems')}
                </p>
              )}
            </div>

            {/* Total */}
            {/* Subtotal, Tax, Total */}
            <div className="mt-6 pt-6 border-t border-surface-200 dark:border-surface-800 space-y-3">
              <div className="flex items-center justify-between text-sm text-surface-500">
                <span>{t('pricing.form.subtotal')}</span>
                <span>{formatCurrency(subtotal, watchedCurrency)}</span>
              </div>

              <div className="flex items-center justify-between text-sm text-surface-500">
                <div className="flex items-center gap-2">
                  <span>{t('pricing.form.tax')}</span>
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
            <h3 className="text-lg font-bold text-surface-900 dark:text-white font-outfit mb-4">
              {t('pricing.form.settings')}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-surface-700 dark:text-surface-300 mb-2">
                  {t('pricing.form.currency')}
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
                  {t('pricing.form.validUntil')}
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
              {t('pricing.form.clientInfo')}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-surface-700 dark:text-surface-300 mb-2">
                  {t('pricing.form.clientName')}
                </label>
                <input
                  {...register('clientName')}
                  type="text"
                  placeholder={t('common.namePlaceholder')}
                  className="portal-input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-surface-700 dark:text-surface-300 mb-2">
                  {t('pricing.form.clientEmail')}
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
              {t('pricing.form.agencyNotes')}
            </h3>
            <textarea
              {...register('agencyNotes')}
              rows={4}
              placeholder={t('pricing.form.agencyNotesPlaceholder')}
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
            {pricingRequest?.status === PRICING_STATUS.DRAFT && (
              <Button
                type="button"
                onClick={handleSubmit((data: PricingFormData) => onSubmit(data, true))}
                disabled={isSubmitting}
                className="w-full h-12 flex items-center justify-center gap-2"
              >
                {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send size={18} />}
                {isSending ? t('pricing.form.sending') : t('pricing.form.sendToClient')}
              </Button>
            )}

            <Button
              type="button"
              variant={pricingRequest?.status === PRICING_STATUS.DRAFT ? 'outline' : 'primary'}
              onClick={handleSubmit((data: PricingFormData) => onSubmit(data, false))}
              disabled={isSubmitting}
              className="w-full h-12 flex items-center justify-center gap-2"
            >
              {isSubmitting && !isSending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save size={18} />
              )}
              {t('pricing.form.saveChanges')}
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
