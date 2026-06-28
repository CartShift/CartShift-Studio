'use client';

import { useState } from 'react';
import { motion } from '@/lib/motion';
import { AlertCircle, Clock } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { Card, CardSectionTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton as PortalSkeleton } from '@/components/ui/Skeleton';
import { RequestDiscussion } from '@/components/portal/requests/RequestDiscussion';
import { ActivityTimeline } from '@/components/portal/ActivityTimeline';
import { RequestStatusWorkflow } from '@/components/portal/requests/RequestStatusWorkflow';
import { RequestRevisionModal } from '@/components/portal/requests/RequestRevisionModal';
import { RequestDetailHeader } from '@/components/portal/requests/RequestDetailHeader';
import {
  RequestDetailTabBar,
  type RequestDetailTab,
} from '@/components/portal/requests/RequestDetailTabBar';
import { RequestDetailOverviewTab } from '@/components/portal/requests/RequestDetailOverviewTab';
import { RequestDetailSidebar } from '@/components/portal/requests/RequestDetailSidebar';
import { useRequestDetail } from '@/lib/hooks/useRequestDetail';
import { useRequestActions } from '@/lib/hooks/useRequestActions';
import { usePricingForm } from '@/lib/hooks/usePricingForm';
import { useBillingProfile } from '@/lib/hooks/useBillingProfile';
import { useRequestPayments } from '@/lib/hooks/useRequestPayments';
import { PortalUser, CLIENT_STATUS_MAP } from '@/lib/types/portal';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
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

export interface RequestDetailClientProps {
  requestIdOverride?: string;
  variant?: 'page' | 'preview';
  onClosePreview?: () => void;
  onExpandPreview?: () => void;
}

export default function RequestDetailClient({
  requestIdOverride,
  variant = 'page',
  onClosePreview,
  onExpandPreview,
}: RequestDetailClientProps) {
  const t = useTranslations('portal');
  const locale = useLocale();
  const router = useRouter();
  const isPreview = variant === 'preview';
  const animateLayout = !isPreview;

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
  } = useRequestDetail({ requestId: requestIdOverride });

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
  const [activeTab, setActiveTab] = useState<RequestDetailTab>('overview');
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
    const success = await handleDeleteRequest();
    if (success) {
      if (isPreview && onClosePreview) {
        onClosePreview();
      }
      router.push(getPortalPath('/requests/'));
    }
  };

  const sidebarLabels = {
    addPricing: t('requests.detail.addPricing'),
    addQuote: t('requests.detail.addQuote'),
    markAsFree: t('requests.detail.markAsFree'),
    pricingTitle: t('requests.detail.pricingTitle'),
    free: t('common.free'),
    freeDesc: t('requests.detail.freeDesc'),
    total: t('requests.detail.total'),
    acceptQuote: t('requests.detail.acceptQuote'),
    decline: t('requests.detail.decline'),
    startWork: t('requests.detail.startWork'),
    balanceDue: t('requests.detail.balanceDue'),
    paymentTracking: t('requests.detail.paymentTracking'),
    actions: t('common.actions'),
    closeRequest: t('requests.detail.closeRequest'),
    addAttachment: t('requests.detail.addAttachment'),
    requestRevision: t('requests.detail.requestRevision'),
    deleteRequest: t('common.deleteRequest' as any) || 'Delete Request',
    deleteTitle: t('requests.detail.deleteTitle' as any) || 'Delete Request',
    deleteConfirm:
      t('requests.detail.deleteConfirm' as any) ||
      'Are you sure you want to delete this request? This action cannot be undone.',
    delete: t('common.delete' as any) || 'Delete',
    assignedSpecialist: t('requests.detail.assignedSpecialist'),
    unassigned: t('requests.detail.unassigned'),
    specialist: t('requests.detail.specialist'),
    waitingForAssignment: t('requests.detail.waitingForAssignment'),
  };

  const statusLabel = isAgency
    ? t(`requests.status.${request.status.toLowerCase()}` as any)
    : t(`requests.clientStatus.${CLIENT_STATUS_MAP[request.status].toLowerCase()}` as any);

  const typeLabel = request.type
    ? t(`requests.type.${request.type.toLowerCase()}` as any)
    : t('requests.type.design');

  const priorityLabel =
    t(`requests.priority.${request.priority.toLowerCase()}` as any) || t('requests.priority.normal');

  return (
    <div className="space-y-6">
      <RequestDetailHeader
        request={request}
        orgId={orgId as string}
        isAgency={isAgency}
        isPreview={isPreview}
        animateLayout={animateLayout}
        onClosePreview={onClosePreview}
        onExpandPreview={onExpandPreview}
        typeLabel={typeLabel}
        statusLabel={statusLabel}
        closePreviewLabel={t('requests.preview.close' as any)}
        openFullPageLabel={t('requests.preview.openFullPage' as any)}
      />

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

      <RequestDetailTabBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        commentCount={comments.length}
        overviewLabel={t('requests.detail.overview')}
        discussionLabel={t('requests.detail.discussion')}
        historyLabel={t('requests.detail.history')}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'overview' ? (
            <RequestDetailOverviewTab
              request={request}
              isAgency={isAgency}
              orgId={orgId as string}
              clientOrganization={clientOrganization}
              locale={locale}
              detailsLabel={t('requests.detail.details')}
              clientLabel={t('common.client')}
              submissionDateLabel={t('requests.detail.submissionDate')}
              priorityStatusLabel={t('requests.detail.priorityStatus')}
              priorityLabel={priorityLabel}
              recentlyLabel={t('common.recently')}
            />
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

        <RequestDetailSidebar
          request={request}
          organization={organization}
          clientOrganization={clientOrganization}
          agencyTeam={agencyTeam}
          billingProfile={billingProfile}
          userData={userData as PortalUser | null}
          showAgencyActions={showAgencyActions}
          showClientActions={showClientActions}
          requestPayments={requestPayments}
          showPricingForm={showPricingForm}
          pricingLineItems={pricingLineItems}
          pricingCurrency={pricingCurrency}
          pricingTaxRate={pricingTaxRate}
          paymentDueAt={paymentDueAt}
          pricingTotal={pricingTotal}
          isPricingValid={isPricingValid}
          isAddingPricing={isAddingPricing}
          isMarkingFree={isMarkingFree}
          isAccepting={isAccepting}
          isDeclining={isDeclining}
          isWork={isWork}
          isAssigning={isAssigning}
          isUploading={isUploading}
          isDeleting={isDeleting}
          showDeleteModal={showDeleteModal}
          onShowPricingForm={() => setShowPricingForm(true)}
          onMarkAsFree={handleMarkAsFree}
          onPricingSubmit={handlePricingSubmit}
          onPricingCancel={resetPricingForm}
          onCurrencyChange={setPricingCurrency}
          onTaxRateChange={setPricingTaxRate}
          onPaymentDueAtChange={setPaymentDueAt}
          onUpdateLineItem={updateLineItem}
          onRemoveLineItem={removeLineItem}
          onAddLineItem={addLineItem}
          onAcceptQuote={handleAcceptQuote}
          onDeclineQuote={handleDeclineQuote}
          onStartWork={handleStartWork}
          onAssignSpecialist={handleAssignSpecialist}
          onStatusChange={handleStatusChange}
          onFileUpload={onFileUpload}
          onRequestRevision={() => setShowRevisionModal(true)}
          onDeleteClick={() => setShowDeleteModal(true)}
          onDeleteClose={() => setShowDeleteModal(false)}
          onDeleteConfirm={onDeleteConfirm}
          labels={sidebarLabels}
        />
      </div>

      <RequestRevisionModal
        isOpen={showRevisionModal}
        notes={revisionNotes}
        isSubmitting={isSubmittingRevision}
        onNotesChange={setRevisionNotes}
        onClose={() => setShowRevisionModal(false)}
        onSubmit={handleRevisionSubmit}
      />
    </div>
  );
}
