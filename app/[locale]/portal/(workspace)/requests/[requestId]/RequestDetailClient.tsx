'use client';

import { useState } from 'react';
import { motion } from '@/lib/motion';
import {
  ArrowLeft,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  User as UserIcon,
  Zap,
  DollarSign,
  Check,
  X,
  Plus,
  Trash2,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { useRouter } from '@/i18n/navigation';
import { Card, CardSectionTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

import { PinButton } from '@/components/portal/PinnedRequests';
import { Skeleton as PortalSkeleton } from '@/components/ui/Skeleton';
import { RequestMilestones } from '@/components/portal/requests/RequestMilestones';
import { RequestAttachments } from '@/components/portal/requests/RequestAttachments';
import { RequestDiscussion } from '@/components/portal/requests/RequestDiscussion';
import { PaymentSummaryCard } from '@/components/portal/billing/PaymentSummaryCard';
import { ActivityTimeline } from '@/components/portal/ActivityTimeline';
import { PayPalProvider } from '@/components/providers/PayPalProvider';
import { PayPalCheckoutButton } from '@/components/portal/PayPalCheckoutButton';
import { RequestStatusWorkflow } from '@/components/portal/requests/RequestStatusWorkflow';

// Consolidated hooks (no more inline state duplication!)
import { useRequestDetail } from '@/lib/hooks/useRequestDetail';
import { useRequestActions } from '@/lib/hooks/useRequestActions';
import { usePricingForm } from '@/lib/hooks/usePricingForm';
import { useBillingProfile } from '@/lib/hooks/useBillingProfile';
import { useRequestPayments } from '@/lib/hooks/useRequestPayments';

// Consolidated utilities (no more mapStatusColor duplication!)
import {
  getStatusBadgeVariant,
  getClientStatusBadgeVariant,
  formatPortalDate,
} from '@/lib/utils/portal-helpers';

import {
  PortalUser,
  CLIENT_STATUS_MAP,
  formatCurrency,
  CURRENCY_CONFIG,
  Currency,
} from '@/lib/types/portal';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { getPortalPath } from '@/lib/utils/portal-paths';

// ============================================
// SUBCOMPONENTS (Extracted for clarity)
// ============================================

function Skeleton({ requestId }: { requestId: string | null }) {
  return (
    <div className="space-y-6 animate-pulse" role="status" aria-live="polite">
      <span className="sr-only"> request details...</span>
      <div className="h-8 w-48 bg-surface-200 dark:bg-surface-800 rounded-lg" />
      <motion.div
        layoutId={requestId ? `request-container-${requestId}` : undefined}
        className="flex flex-col md:flex-row gap-6 p-4 rounded-xl"
      >
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-4">
            {requestId ? (
              <motion.div layoutId={`request-title-${requestId}`} className="w-3/4">
                <PortalSkeleton className="h-10 w-full" />
              </motion.div>
            ) : (
              <PortalSkeleton className="h-10 w-3/4" />
            )}
            {requestId ? (
              <motion.div layoutId={`request-status-${requestId}`}>
                <PortalSkeleton className="h-8 w-24 rounded-full" />
              </motion.div>
            ) : (
              <PortalSkeleton className="h-8 w-24 rounded-full" />
            )}
          </div>
          <PortalSkeleton className="h-6 w-1/3" />
        </div>
      </motion.div>
      <div className="flex items-center gap-2">
        <PortalSkeleton className="h-10 w-24 rounded-xl" />
        <PortalSkeleton className="h-10 w-28 rounded-xl" />
        <PortalSkeleton className="h-10 w-24 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <PortalSkeleton className="h-64 w-full rounded-2xl" />
          <PortalSkeleton className="h-40 w-full rounded-2xl" />
        </div>
        <div className="space-y-6">
          <PortalSkeleton className="h-48 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

function ErrorState({ error, t }: { error: string | null; t: ReturnType<typeof useTranslations> }) {
  return (
    <div className="text-center py-20 px-4">
      <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
        <AlertCircle size={40} className="text-rose-500" />
      </div>
      <h2 className="text-2xl font-bold text-surface-900 dark:text-white font-outfit">
        {error || t('requests.detail.not')}
      </h2>
      <p className="text-surface-500 mt-2 max-w-sm mx-auto font-medium">
        {t('requests.detail.notDesc')}
      </p>
      <Link href={getPortalPath('/requests/')} className="mt-8 inline-block">
        <Button variant="outline" className="font-outfit">
          {t('requests.detail.backToRequests')}
        </Button>
      </Link>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function RequestDetailClient() {
  const t = useTranslations('portal');
  const locale = useLocale();
  const router = useRouter();

  // ========== CONSOLIDATED DATA HOOKS ==========
  // All subscriptions, state, and derived permissions are now in useRequestDetail
  const {
    request,
    comments,
    activities,
    organization,
    agencyTeam,
    userData,
    isAgency,
    orgId,
    requestId,
    loading,
    error,
    showAgencyActions,
    showClientActions,
    setComments,
    clientOrganization,
  } = useRequestDetail();

  // ========== CONSOLIDATED ACTION HOOKS ==========
  // All request actions with toast notifications are now in useRequestActions
  const {
    handleAddPricing,
    isAddingPricing,
    handleMarkAsFree,
    isMarkingFree,
    handleAcceptQuote,
    handleDeclineQuote,
    isAccepting,
    isDeclining,
    handleStartWork,
    isWork,
    handleAssignSpecialist,
    isAssigning,
    handleRequestRevision,
    isSubmittingRevision,
    handleFileUpload,
    isUploading,
    handleStatusChange,
    handleSendComment,
    isSubmittingComment,
    handleDeleteRequest,
    isDeleting,
  } = useRequestActions({
    request,
    userData,
    orgId,
    requestId,
    isAgency,
    onCommentsUpdate: setComments,
  });

  const { profile: billingProfile } = useBillingProfile(Boolean(userData));

  // ========== CONSOLIDATED PRICING FORM ==========
  // All pricing form state is now in usePricingForm hook
  const {
    lineItems: pricingLineItems,
    currency: pricingCurrency,
    isFormVisible: showPricingForm,
    setCurrency: setPricingCurrency,
    setFormVisible: setShowPricingForm,
    addLineItem,
    removeLineItem,
    updateLineItem,
    resetForm: resetPricingForm,
    totalAmount: pricingTotal,
    isValid: isPricingValid,
    taxRate: pricingTaxRate,
    setTaxRate: setPricingTaxRate,
  } = usePricingForm(request?.currency || billingProfile?.defaultCurrency || 'USD', billingProfile?.defaultTaxRate ?? 0);
  const requestPayments = useRequestPayments(request?.id || '', Boolean(request?.isBillable));

  // ========== LOCAL UI STATE ==========
  const [activeTab, setActiveTab] = useState<'overview' | 'discussion' | 'history'>('overview');
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState('');
  const [paymentDueAt, setPaymentDueAt] = useState('');

  // ========== RENDER ==========

  if (loading) {
    return <Skeleton requestId={requestId} />;
  }

  if (error || !request) {
    return <ErrorState error={error} t={t} />;
  }

  const handlePricingSubmit = async () => {
    const success = await handleAddPricing(
      pricingLineItems,
      pricingCurrency,
      pricingTaxRate,
      paymentDueAt ? new Date(`${paymentDueAt}T12:00:00`) : undefined
    );
    if (success) {
      resetPricingForm();
      setPaymentDueAt('');
    }
  };

  const handleRevisionSubmit = async () => {
    const success = await handleRequestRevision(revisionNotes);
    if (success) {
      setShowRevisionModal(false);
      setRevisionNotes('');
    }
  };

  const onFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const onDeleteConfirm = async () => {
    console.log('[RequestDetail] Attempting to delete request...');
    const success = await handleDeleteRequest();
    console.log('[RequestDetail] Delete result:', success);
    if (success) {
      router.push(getPortalPath('/requests/'));
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        layoutId={`request-container-${request.id}`}
        className="flex flex-col md:flex-row md:items-center gap-6 p-4 rounded-xl"
      >
        <Link
          href={getPortalPath('/requests/')}
          className="p-2.5 border border-surface-200 dark:border-surface-800 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-900 transition-colors shadow-sm bg-white dark:bg-surface-950"
        >
          <ArrowLeft size={20} className="text-surface-500" />
        </Link>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <motion.h1
              layoutId={`request-title-${request.id}`}
              className="text-2xl font-bold text-surface-900 dark:text-white leading-tight font-outfit"
            >
              {request.title}
            </motion.h1>
            <motion.div layoutId={`request-status-${request.id}`}>
              <Badge
                variant={
                  isAgency
                    ? getStatusBadgeVariant(request.status)
                    : getClientStatusBadgeVariant(request.status)
                }
              >
                {isAgency
                  ? t(`requests.status.${request.status.toLowerCase()}` as any)
                  : t(
                      `requests.clientStatus.${CLIENT_STATUS_MAP[request.status].toLowerCase()}` as any
                    )}
              </Badge>
            </motion.div>
          </div>
          <div className="flex items-center gap-3 mt-1 underline-offset-4">
            <p className="portal-label-sm">
              {request.type
                ? t(`requests.type.${request.type.toLowerCase()}` as any)
                : t('requests.type.design')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start md:self-center">
          <PinButton
            requestId={request.id}
            orgId={orgId as string}
            size="md"
            className="w-10 h-10 border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-950 hover:border-surface-300 dark:hover:border-surface-700 shadow-sm"
          />
        </div>
      </motion.div>

      {/* Agency Status Workflow - Full Width */}
      {showAgencyActions && (
        <Card className="border-surface-200 dark:border-surface-800 shadow-sm bg-white dark:bg-surface-950 p-6">
          <CardSectionTitle as="h4" className="mb-4">
            {t('requests.detail.workflowActions')}
          </CardSectionTitle>
          <RequestStatusWorkflow
            currentStatus={request.status}
            onStatusChange={handleStatusChange}
            className="w-full"
          />
        </Card>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-surface-100 dark:bg-surface-900 rounded-2xl w-full overflow-x-auto scrollbar-hide">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          aria-pressed={activeTab === 'overview'}
          className={cn(
            'portal-focus-ring px-4 sm:px-6 py-3 min-h-[44px] rounded-xl text-sm font-bold transition-all font-outfit touch-manipulation whitespace-nowrap outline-none',
            activeTab === 'overview'
              ? 'bg-white dark:bg-surface-800 text-primary-600 shadow-sm'
              : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
          )}
        >
          {t('requests.detail.overview')}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('discussion')}
          aria-pressed={activeTab === 'discussion'}
          className={cn(
            'portal-focus-ring px-4 sm:px-6 py-3 min-h-[44px] rounded-xl text-sm font-bold transition-all font-outfit touch-manipulation flex items-center gap-2 whitespace-nowrap outline-none',
            activeTab === 'discussion'
              ? 'bg-white dark:bg-surface-800 text-primary-600 shadow-sm'
              : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
          )}
        >
          {t('requests.detail.discussion')}
          {comments.length > 0 && (
            <span className="bg-primary-100 dark:bg-primary-900 text-primary-600 px-1.5 py-0.5 rounded-md text-[10px]">
              {comments.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('history')}
          aria-pressed={activeTab === 'history'}
          className={cn(
            'portal-focus-ring px-4 sm:px-6 py-3 min-h-[44px] rounded-xl text-sm font-bold transition-all font-outfit touch-manipulation flex items-center gap-2 whitespace-nowrap outline-none',
            activeTab === 'history'
              ? 'bg-white dark:bg-surface-800 text-primary-600 shadow-sm'
              : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
          )}
        >
          <Clock size={16} />
          {t('requests.detail.history')}
        </button>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'overview' ? (
            <div className="space-y-6 animate-in slide-in-from-start-4 duration-500">
              {/* Details Card */}
              <Card className="border-surface-200 dark:border-surface-800 shadow-sm bg-white dark:bg-surface-950">
                <CardSectionTitle className="mb-4">{t('requests.detail.details')}</CardSectionTitle>
                <div className="text-surface-600 dark:text-surface-300 leading-relaxed whitespace-pre-wrap font-medium">
                  {request.description}
                </div>
                <div className="mt-10 pt-6 border-t border-surface-100 dark:border-surface-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Client Info - Agency Only */}
                  {isAgency && clientOrganization && (
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-surface-50 dark:bg-surface-900 border border-surface-100 dark:border-surface-800 shadow-sm shrink-0">
                        {clientOrganization.branding?.iconUrl ? (
                          <img
                            src={clientOrganization.branding.iconUrl}
                            alt={clientOrganization.name}
                            className="w-4 h-4 object-cover rounded-full"
                          />
                        ) : (
                          <UserIcon size={16} className="text-surface-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="portal-label-sm text-[10px] truncate">
                          {t('common.client')}
                        </p>
                        <Link
                          href={getPortalPath(`/agency/clients/${clientOrganization.id}`)}
                          className="portal-focus-ring text-sm font-bold text-surface-900 dark:text-white font-outfit hover:text-primary-600 dark:hover:text-primary-400 transition-colors truncate block rounded-md"
                        >
                          {clientOrganization.name}
                        </Link>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-surface-50 dark:bg-surface-900 border border-surface-100 dark:border-surface-800 shadow-sm">
                      <Calendar size={16} className="text-surface-400" />
                    </div>
                    <div>
                      <p className="portal-label-sm text-[10px]">
                        {t('requests.detail.submissionDate')}
                      </p>
                      <p className="text-sm font-bold text-surface-900 dark:text-white font-outfit">
                        {formatPortalDate(
                          request.createdAt,
                          'MMMM d, yyyy',
                          locale,
                          t('common.recently')
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-surface-50 dark:bg-surface-900 border border-surface-100 dark:border-surface-800 shadow-sm">
                      <Zap
                        size={16}
                        className={cn(
                          request.priority === 'HIGH' || request.priority === 'URGENT'
                            ? 'text-rose-500'
                            : 'text-amber-500'
                        )}
                      />
                    </div>
                    <div>
                      <p className="portal-label-sm text-[10px]">
                        {t('requests.detail.priorityStatus')}
                      </p>
                      <p className="text-sm font-bold text-surface-900 dark:text-white capitalize font-outfit">
                        {t(`requests.priority.${request.priority.toLowerCase()}` as any) ||
                          t('requests.priority.normal')}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Milestones Section */}
              <RequestMilestones request={request} isAgency={isAgency} />

              {/* Assets Section */}
              <RequestAttachments request={request} isAgency={isAgency} orgId={orgId as string} />
            </div>
          ) : activeTab === 'discussion' ? (
            <RequestDiscussion
              comments={comments}
              currentUser={userData as PortalUser | null}
              agencyTeam={agencyTeam}
              onSendMessage={handleSendComment}
              isSubmitting={isSubmittingComment}
            />
          ) : (
            <Card className="border-surface-200 dark:border-surface-800 shadow-sm bg-white dark:bg-surface-950 animate-in slide-in-from-bottom-4 duration-500">
              <CardSectionTitle icon={Clock} iconClassName="text-primary-500" className="mb-4">
                {t('requests.detail.historyTitle')}
              </CardSectionTitle>
              <ActivityTimeline activities={activities} orgId={orgId as string} />
            </Card>
          )}
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Agency Add Pricing Section - For NEW requests without pricing */}
          {showAgencyActions && request.status === 'NEW' && !request.isBillable && (
            <Card className="border-surface-200 dark:border-surface-800 shadow-sm bg-white dark:bg-surface-950">
              <CardSectionTitle
                as="h4"
                icon={DollarSign}
                iconClassName="text-green-500"
                className="mb-6"
              >
                {t('requests.detail.addPricing')}
              </CardSectionTitle>

              {!showPricingForm ? (
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full h-12 border-dashed border-2 border-green-300 dark:border-green-700 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                    onClick={() => setShowPricingForm(true)}
                  >
                    <Plus size={18} className="me-2" />
                    {t('requests.detail.addQuote')}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full h-12 border-dashed border-2 border-violet-300 dark:border-violet-700 text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20"
                    onClick={handleMarkAsFree}
                    disabled={isMarkingFree}
                  >
                    {isMarkingFree ? (
                      <Loader2 size={18} className="me-2 animate-spin" />
                    ) : (
                      <Check size={18} className="me-2" />
                    )}
                    {t('requests.detail.markAsFree')}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Currency Selector */}
                  <div>
                    <label className="block text-xs font-bold text-surface-500 mb-2">
                      {t('requests.detail.currency')}
                    </label>
                    <select
                      value={pricingCurrency}
                      onChange={e => setPricingCurrency(e.target.value as Currency)}
                      className="portal-input h-10 text-sm"
                    >
                      {Object.entries(CURRENCY_CONFIG).map(([key, config]) => (
                        <option key={key} value={key}>
                          {config.symbol} {config.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-surface-500 mb-2">
                      {t('requests.detail.taxRate')}
                    </label>
                    <input
                      className="portal-input h-10 text-sm"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={pricingTaxRate * 100}
                      onChange={e => setPricingTaxRate(Number(e.target.value || 0) / 100)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-surface-500 mb-2">
                      {t('requests.detail.paymentDueAt')}
                    </label>
                    <input className="portal-input h-10 text-sm" type="date" value={paymentDueAt} onChange={e => setPaymentDueAt(e.target.value)} />
                  </div>

                  {/* Line Items */}
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-surface-500">
                      {t('requests.detail.lineItems')}
                    </label>
                    {pricingLineItems.map(item => (
                      <div
                        key={item.id}
                        className="p-3 bg-surface-50 dark:bg-surface-900 rounded-lg space-y-2"
                      >
                        <input
                          type="text"
                          placeholder={t('requests.detail.descriptionPlaceholder')}
                          value={item.description}
                          onChange={e => updateLineItem(item.id, 'description', e.target.value)}
                          className="portal-input h-9 text-sm"
                        />
                        <div className="flex gap-2 items-center">
                          <div className="flex-1">
                            <input
                              type="number"
                              min="1"
                              placeholder={t('requests.detail.qty')}
                              value={item.quantity || ''}
                              onChange={e =>
                                updateLineItem(item.id, 'quantity', parseInt(e.target.value) || 0)
                              }
                              className="portal-input h-9 text-sm w-full"
                            />
                          </div>
                          <span className="text-surface-400 text-sm">×</span>
                          <div className="flex-1">
                            <div className="relative">
                              <span className="absolute start-3 top-1/2 -translate-y-1/2 text-surface-400 text-sm">
                                {CURRENCY_CONFIG[pricingCurrency].symbol}
                              </span>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder={t('requests.detail.price')}
                                value={item.unitPrice ? (item.unitPrice / 100).toFixed(2) : ''}
                                onChange={e =>
                                  updateLineItem(
                                    item.id,
                                    'unitPrice',
                                    Math.round(parseFloat(e.target.value || '0') * 100)
                                  )
                                }
                                className="portal-input h-9 text-sm ps-7 w-full"
                              />
                            </div>
                          </div>
                          {pricingLineItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeLineItem(item.id)}
                              aria-label={t('common.delete')}
                              className="portal-focus-ring p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                        {item.quantity > 0 &&
                          item.unitPrice >= 0 &&
                          item.unitPrice !== undefined && (
                            <div className="text-end text-xs font-bold text-surface-500">
                              = {formatCurrency(item.unitPrice * item.quantity, pricingCurrency)}
                            </div>
                          )}
                      </div>
                    ))}
                  </div>

                  {/* Add Line Item */}
                  <button
                    type="button"
                    onClick={addLineItem}
                    className="portal-focus-ring w-full py-2 min-h-[44px] text-sm font-bold text-primary-600 hover:text-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus size={16} />
                    {t('requests.detail.addLineItem')}
                  </button>

                  {/* Total */}
                  {pricingTotal > 0 && (
                    <div className="pt-3 border-t border-surface-200 dark:border-surface-800 flex items-center justify-between">
                      <span className="text-sm font-bold text-surface-600 dark:text-surface-400">
                        {t('requests.detail.total')}
                      </span>
                      <span className="text-lg font-black text-surface-900 dark:text-white font-outfit">
                        {formatCurrency(pricingTotal, pricingCurrency)}
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-3 flex gap-2">
                    <Button variant="outline" className="flex-1 h-10" onClick={resetPricingForm}>
                      {t('common.cancel')}
                    </Button>
                    <Button
                      variant="primary"
                      className="flex-1 h-10"
                      onClick={handlePricingSubmit}
                      disabled={isAddingPricing || !isPricingValid}
                    >
                      {isAddingPricing ? (
                        <Loader2 size={16} className="animate-spin me-2" />
                      ) : (
                        <Check size={16} className="me-2" />
                      )}
                      {t('requests.detail.sendQuote')}
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Pricing Section - Show if request has pricing or is free */}
          {(request.isBillable || request.isFree) && (
            <Card className="border-surface-200 dark:border-surface-800 shadow-sm bg-white dark:bg-surface-950">
              <CardSectionTitle
                as="h4"
                icon={DollarSign}
                iconClassName="text-green-500"
                className="mb-6"
              >
                {t('requests.detail.pricingTitle')}
              </CardSectionTitle>

              {request.isFree ? (
                <div className="p-4 bg-violet-50/50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-800/30 rounded-2xl">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg text-violet-600">
                      <Zap size={16} fill="currentColor" />
                    </div>
                    <span className="text-sm font-bold text-violet-900 dark:text-violet-100 font-outfit">
                      {t('common.free')}
                    </span>
                  </div>
                  <p className="text-xs text-violet-600/80 dark:text-violet-400/80 leading-relaxed font-medium">
                    {t('requests.detail.freeDesc')}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {request.lineItems?.map(item => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-900 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-surface-900 dark:text-white text-sm">
                          {item.description}
                        </p>
                        {item.notes && (
                          <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">
                            {item.notes}
                          </p>
                        )}
                      </div>
                      <div className="text-end ms-4">
                        <p className="font-bold text-surface-900 dark:text-white text-sm">
                          {formatCurrency(
                            item.unitPrice * item.quantity,
                            request.currency || 'USD'
                          )}
                        </p>
                        <p className="text-xs text-surface-500 dark:text-surface-400">
                          {item.quantity} ×{' '}
                          {formatCurrency(item.unitPrice, request.currency || 'USD')}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div className="pt-3 mt-3 border-t border-surface-200 dark:border-surface-800 flex items-center justify-between">
                    <span className="text-sm font-bold text-surface-600 dark:text-surface-400">
                      {t('requests.detail.total')}
                    </span>
                    <span className="text-xl font-black text-surface-900 dark:text-white font-outfit">
                      {formatCurrency(request.totalAmount || 0, request.currency || 'USD')}
                    </span>
                  </div>

                </div>
              )}

              {/* Client Accept/Decline Buttons - Only for QUOTED status */}
              {showClientActions && request.status === 'QUOTED' && (
                <div className="mt-6 pt-6 border-t border-surface-200 dark:border-surface-800 flex gap-3">
                  <Button
                    variant="primary"
                    className="flex-1 h-12"
                    onClick={handleAcceptQuote}
                    disabled={isAccepting || isDeclining}
                  >
                    {isAccepting ? (
                      <Loader2 size={18} className="animate-spin me-2" />
                    ) : (
                      <Check size={18} className="me-2" />
                    )}
                    {t('requests.detail.acceptQuote')}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 h-12 border-red-200 dark:border-red-900 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                    onClick={handleDeclineQuote}
                    disabled={isAccepting || isDeclining}
                  >
                    {isDeclining ? (
                      <Loader2 size={18} className="animate-spin me-2" />
                    ) : (
                      <X size={18} className="me-2" />
                    )}
                    {t('requests.detail.decline')}
                  </Button>
                </div>
              )}

              {/* Agency Start Work Button - Only for ACCEPTED status */}
              {showAgencyActions && request.status === 'ACCEPTED' && (
                <div className="mt-6 pt-6 border-t border-surface-200 dark:border-surface-800">
                  <Button
                    variant="primary"
                    className="w-full h-12"
                    onClick={handleStartWork}
                    disabled={isWork}
                  >
                    {isWork ? (
                      <Loader2 size={18} className="me-2 animate-spin" />
                    ) : (
                      <Zap size={18} className="me-2" />
                    )}
                    {t('requests.detail.startWork')}
                  </Button>
                </div>
              )}

              {/* PayPal Payment - For DELIVERED billable requests */}
              {showClientActions && request.status === 'DELIVERED' && request.isBillable && (
                <div className="mt-6 pt-6 border-t border-surface-200 dark:border-surface-800">
                  <PayPalProvider currency={request.currency || 'USD'}>
                    <PayPalCheckoutButton
                      pricingRequest={{
                        id: request.id,
                        orgId: request.orgId,
                        title: request.title,
                        totalAmount: request.balanceDue ?? request.totalAmount ?? 0,
                        currency: request.currency || 'USD',
                        lineItems:
                          (request.amountPaid ?? 0) > 0
                            ? [
                                {
                                  id: 'outstanding-balance',
                                  description: t('requests.detail.balanceDue'),
                                  quantity: 1,
                                  unitPrice: request.balanceDue ?? 0,
                                },
                              ]
                            : request.lineItems || [],
                        status: 'ACCEPTED',
                        createdBy: request.createdBy,
                        createdByName: request.createdByName || '',
                        createdAt: request.createdAt,
                        updatedAt: request.updatedAt,
                      }}
                      onSuccess={result => result.paymentId && requestPayments.paypal.mutate(result.paymentId)}
                      onError={err => console.error('Payment error:', err)}
                    />
                  </PayPalProvider>
                </div>
              )}
            </Card>
          )}

          {request.isBillable && (clientOrganization || organization) && (
            <Card className="border-surface-200 dark:border-surface-800 shadow-sm bg-white dark:bg-surface-950">
              <CardSectionTitle
                as="h4"
                icon={DollarSign}
                iconClassName="text-emerald-500"
                className="mb-6"
              >
                {t('requests.detail.paymentTracking')}
              </CardSectionTitle>
              <PaymentSummaryCard
                request={request}
                organization={(clientOrganization || organization)!}
                profile={billingProfile}
                payments={requestPayments.payments}
                isAgency={showAgencyActions}
                recordPayment={input => requestPayments.manual.mutateAsync(input)}
                recording={requestPayments.manual.isPending}
              />
            </Card>
          )}

          {/* Quick Actions Card - File upload, delete, etc. */}
          <Card className="border-surface-200 dark:border-surface-800 shadow-sm bg-white dark:bg-surface-950">
            <CardSectionTitle as="h4" className="mb-6">
              {t('common.actions')}
            </CardSectionTitle>
            <div className="space-y-2">
              {showAgencyActions &&
                request.status !== 'CLOSED' &&
                request.status !== 'CANCELED' && (
                  <Button
                    variant="outline"
                    className="w-full justify-start h-12 border-surface-200 dark:border-surface-800 text-sm font-bold font-outfit"
                    onClick={() => handleStatusChange('CLOSED')}
                  >
                    <CheckCircle2 size={16} className="me-3 text-emerald-500" />{' '}
                    {t('requests.detail.closeRequest')}
                  </Button>
                )}
              {showAgencyActions && (
                <div className="relative">
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    onChange={onFileUpload}
                    disabled={isUploading}
                  />
                  <Button
                    variant="outline"
                    className="w-full justify-start h-12 border-surface-200 dark:border-surface-800 text-sm font-bold font-outfit"
                    onClick={() => document.getElementById('file-upload')?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <Loader2 size={16} className="me-3 animate-spin text-primary-500" />
                    ) : (
                      <Paperclip size={16} className="me-3 text-primary-500" />
                    )}
                    {t('requests.detail.addAttachment')}
                  </Button>
                </div>
              )}
              {showClientActions &&
                request.status !== 'CLOSED' &&
                request.status !== 'CANCELED' && (
                  <Button
                    variant="outline"
                    className="w-full justify-start h-12 border-surface-200 dark:border-surface-800 text-sm font-bold font-outfit"
                    onClick={() => setShowRevisionModal(true)}
                  >
                    <RotateCcw size={16} className="me-3 text-amber-500" />{' '}
                    {t('requests.detail.requestRevision')}
                  </Button>
                )}
              {(showAgencyActions || userData?.id === request.createdBy) && (
                <Button
                  variant="outline"
                  className="w-full justify-start h-12 border-surface-200 dark:border-surface-800 text-sm font-bold font-outfit text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                  onClick={() => setShowDeleteModal(true)}
                >
                  <Trash2 size={16} className="me-3" />
                  {t('common.deleteRequest' as any) || 'Delete Request'}
                </Button>
              )}
            </div>
          </Card>

          <ConfirmationModal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            onConfirm={onDeleteConfirm}
            title={t('requests.detail.deleteTitle' as any) || 'Delete Request'}
            description={
              t('requests.detail.deleteConfirm' as any) ||
              'Are you sure you want to delete this request? This action cannot be undone.'
            }
            confirmText={t('common.delete' as any) || 'Delete'}
            variant="danger"
            isLoading={isDeleting}
          />

          {/* Assigned Specialist Card */}
          <Card className="border-surface-200 dark:border-surface-800 shadow-sm bg-white dark:bg-surface-950">
            <div className="flex items-center justify-between mb-6">
              <CardSectionTitle as="h4">{t('requests.detail.assignedSpecialist')}</CardSectionTitle>
              {showAgencyActions && (
                <div className="relative group/assign">
                  <select
                    className="absolute inset-0 opacity-0 cursor-pointer w-full z-10"
                    onChange={e => {
                      const selected = agencyTeam.find(m => m.id === e.target.value);
                      if (selected)
                        handleAssignSpecialist(selected.id, selected.name || selected.email);
                    }}
                    value={request.assignedTo || ''}
                    disabled={isAssigning}
                  >
                    <option value="" disabled>
                      {t('common.filter')}
                    </option>
                    {agencyTeam.map(member => (
                      <option key={member.id} value={member.id}>
                        {member.name || member.email}
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-[9px] font-black uppercase tracking-widest"
                    loading={isAssigning}
                  >
                    {t('common.edit')}
                  </Button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-surface-100 dark:bg-surface-800 rounded-full flex items-center justify-center">
                <UserIcon size={24} className="text-surface-400" />
              </div>
              <div>
                <p className="font-bold text-surface-900 dark:text-white font-outfit">
                  {request.assignedToName || t('requests.detail.unassigned')}
                </p>
                <p className="text-xs text-surface-500 dark:text-surface-400">
                  {request.assignedToName
                    ? t('requests.detail.specialist')
                    : t('requests.detail.waitingForAssignment')}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Revision Modal */}
      {showRevisionModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-surface-900 rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4"
          >
            <h3 className="text-xl font-bold text-surface-900 dark:text-white font-outfit">
              {t('requests.detail.requestRevision')}
            </h3>
            <p className="text-sm text-surface-500">{t('requests.detail.revisionDesc')}</p>
            <textarea
              className="portal-input w-full min-h-[120px] resize-none"
              placeholder={t('requests.detail.revisionPlaceholder')}
              value={revisionNotes}
              onChange={e => setRevisionNotes(e.target.value)}
            />
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowRevisionModal(false)}
                disabled={isSubmittingRevision}
              >
                {t('common.cancel')}
              </Button>
              <Button
                onClick={handleRevisionSubmit}
                loading={isSubmittingRevision}
                disabled={!revisionNotes.trim()}
              >
                {t('requests.detail.submitRevision')}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
