'use client';

import {
  Check,
  CheckCircle2,
  DollarSign,
  Loader2,
  Paperclip,
  Plus,
  RotateCcw,
  Trash2,
  User as UserIcon,
  X,
  Zap,
} from 'lucide-react';
import { Card, CardSectionTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { PayPalProvider } from '@/components/providers/PayPalProvider';
import { PayPalCheckoutButton } from '@/components/portal/PayPalCheckoutButton';
import { PaymentSummaryCard } from '@/components/portal/billing/PaymentSummaryCard';
import { RequestPricingFormPanel } from '@/components/portal/requests/RequestPricingFormPanel';
import {
  formatCurrency,
  type BillingProfile,
  type Currency,
  type Organization,
  type PortalUser,
  type PricingLineItem,
  type Request,
  type RequestStatus,
} from '@/lib/types/portal';
import type { useRequestPayments } from '@/lib/hooks/useRequestPayments';

interface RequestDetailSidebarProps {
  request: Request;
  organization: Organization | null | undefined;
  clientOrganization: Organization | null | undefined;
  agencyTeam: PortalUser[];
  billingProfile: BillingProfile | null | undefined;
  userData: PortalUser | null | undefined;
  showAgencyActions: boolean;
  showClientActions: boolean;
  requestPayments: ReturnType<typeof useRequestPayments>;
  showPricingForm: boolean;
  pricingLineItems: PricingLineItem[];
  pricingCurrency: Currency;
  pricingTaxRate: number;
  paymentDueAt: string;
  pricingTotal: number;
  isPricingValid: boolean;
  isAddingPricing: boolean;
  isMarkingFree: boolean;
  isAccepting: boolean;
  isDeclining: boolean;
  isWork: boolean;
  isAssigning: boolean;
  isUploading: boolean;
  isDeleting: boolean;
  showDeleteModal: boolean;
  onShowPricingForm: () => void;
  onMarkAsFree: () => void;
  onPricingSubmit: () => void;
  onPricingCancel: () => void;
  onCurrencyChange: (currency: Currency) => void;
  onTaxRateChange: (rate: number) => void;
  onPaymentDueAtChange: (value: string) => void;
  onUpdateLineItem: (id: string, field: keyof PricingLineItem, value: string | number) => void;
  onRemoveLineItem: (id: string) => void;
  onAddLineItem: () => void;
  onAcceptQuote: () => void;
  onDeclineQuote: () => void;
  onStartWork: () => void;
  onAssignSpecialist: (id: string, name: string) => void;
  onStatusChange: (status: RequestStatus) => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRequestRevision: () => void;
  onDeleteClick: () => void;
  onDeleteClose: () => void;
  onDeleteConfirm: () => void;
  labels: {
    addPricing: string;
    addQuote: string;
    markAsFree: string;
    pricingTitle: string;
    free: string;
    freeDesc: string;
    total: string;
    acceptQuote: string;
    decline: string;
    startWork: string;
    balanceDue: string;
    paymentTracking: string;
    actions: string;
    closeRequest: string;
    addAttachment: string;
    requestRevision: string;
    deleteRequest: string;
    deleteTitle: string;
    deleteConfirm: string;
    delete: string;
    assignedSpecialist: string;
    unassigned: string;
    specialist: string;
    waitingForAssignment: string;
  };
}

export function RequestDetailSidebar({
  request,
  organization,
  clientOrganization,
  agencyTeam,
  billingProfile,
  userData,
  showAgencyActions,
  showClientActions,
  requestPayments,
  showPricingForm,
  pricingLineItems,
  pricingCurrency,
  pricingTaxRate,
  paymentDueAt,
  pricingTotal,
  isPricingValid,
  isAddingPricing,
  isMarkingFree,
  isAccepting,
  isDeclining,
  isWork,
  isAssigning,
  isUploading,
  isDeleting,
  showDeleteModal,
  onShowPricingForm,
  onMarkAsFree,
  onPricingSubmit,
  onPricingCancel,
  onCurrencyChange,
  onTaxRateChange,
  onPaymentDueAtChange,
  onUpdateLineItem,
  onRemoveLineItem,
  onAddLineItem,
  onAcceptQuote,
  onDeclineQuote,
  onStartWork,
  onAssignSpecialist,
  onStatusChange,
  onFileUpload,
  onRequestRevision,
  onDeleteClick,
  onDeleteClose,
  onDeleteConfirm,
  labels,
}: RequestDetailSidebarProps) {
  return (
    <div className="space-y-6">
      {showAgencyActions && request.status === 'NEW' && !request.isBillable && (
        <Card className="border-surface-200 dark:border-surface-800 shadow-sm bg-white dark:bg-surface-950">
          <CardSectionTitle
            as="h4"
            icon={DollarSign}
            iconClassName="text-green-500"
            className="mb-6"
          >
            {labels.addPricing}
          </CardSectionTitle>

          {!showPricingForm ? (
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full h-12 border-dashed border-2 border-green-300 dark:border-green-700 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                onClick={onShowPricingForm}
              >
                <Plus size={18} className="me-2" />
                {labels.addQuote}
              </Button>
              <Button
                variant="outline"
                className="w-full h-12 border-dashed border-2 border-violet-300 dark:border-violet-700 text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20"
                onClick={onMarkAsFree}
                disabled={isMarkingFree}
              >
                {isMarkingFree ? (
                  <Loader2 size={18} className="me-2 animate-spin" />
                ) : (
                  <Check size={18} className="me-2" />
                )}
                {labels.markAsFree}
              </Button>
            </div>
          ) : (
            <RequestPricingFormPanel
              lineItems={pricingLineItems}
              currency={pricingCurrency}
              taxRate={pricingTaxRate}
              paymentDueAt={paymentDueAt}
              totalAmount={pricingTotal}
              isValid={isPricingValid}
              isSubmitting={isAddingPricing}
              onCurrencyChange={onCurrencyChange}
              onTaxRateChange={onTaxRateChange}
              onPaymentDueAtChange={onPaymentDueAtChange}
              onUpdateLineItem={onUpdateLineItem}
              onRemoveLineItem={onRemoveLineItem}
              onAddLineItem={onAddLineItem}
              onSubmit={onPricingSubmit}
              onCancel={onPricingCancel}
            />
          )}
        </Card>
      )}

      {(request.isBillable || request.isFree) && (
        <Card className="border-surface-200 dark:border-surface-800 shadow-sm bg-white dark:bg-surface-950">
          <CardSectionTitle
            as="h4"
            icon={DollarSign}
            iconClassName="text-green-500"
            className="mb-6"
          >
            {labels.pricingTitle}
          </CardSectionTitle>

          {request.isFree ? (
            <div className="p-4 bg-violet-50/50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-800/30 rounded-2xl">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg text-violet-600">
                  <Zap size={16} fill="currentColor" />
                </div>
                <span className="text-sm font-bold text-violet-900 dark:text-violet-100 font-outfit">
                  {labels.free}
                </span>
              </div>
              <p className="text-xs text-violet-600/80 dark:text-violet-400/80 leading-relaxed font-medium">
                {labels.freeDesc}
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
                      {formatCurrency(item.unitPrice * item.quantity, request.currency || 'USD')}
                    </p>
                    <p className="text-xs text-surface-500 dark:text-surface-400">
                      {item.quantity} × {formatCurrency(item.unitPrice, request.currency || 'USD')}
                    </p>
                  </div>
                </div>
              ))}
              <div className="pt-3 mt-3 border-t border-surface-200 dark:border-surface-800 flex items-center justify-between">
                <span className="text-sm font-bold text-surface-600 dark:text-surface-400">
                  {labels.total}
                </span>
                <span className="text-xl font-black text-surface-900 dark:text-white font-outfit">
                  {formatCurrency(request.totalAmount || 0, request.currency || 'USD')}
                </span>
              </div>
            </div>
          )}

          {showClientActions && request.status === 'QUOTED' && (
            <div className="mt-6 pt-6 border-t border-surface-200 dark:border-surface-800 flex gap-3">
              <Button
                variant="primary"
                className="flex-1 h-12"
                onClick={onAcceptQuote}
                disabled={isAccepting || isDeclining}
              >
                {isAccepting ? (
                  <Loader2 size={18} className="animate-spin me-2" />
                ) : (
                  <Check size={18} className="me-2" />
                )}
                {labels.acceptQuote}
              </Button>
              <Button
                variant="outline"
                className="flex-1 h-12 border-red-200 dark:border-red-900 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                onClick={onDeclineQuote}
                disabled={isAccepting || isDeclining}
              >
                {isDeclining ? (
                  <Loader2 size={18} className="animate-spin me-2" />
                ) : (
                  <X size={18} className="me-2" />
                )}
                {labels.decline}
              </Button>
            </div>
          )}

          {showAgencyActions && request.status === 'ACCEPTED' && (
            <div className="mt-6 pt-6 border-t border-surface-200 dark:border-surface-800">
              <Button variant="primary" className="w-full h-12" onClick={onStartWork} disabled={isWork}>
                {isWork ? (
                  <Loader2 size={18} className="me-2 animate-spin" />
                ) : (
                  <Zap size={18} className="me-2" />
                )}
                {labels.startWork}
              </Button>
            </div>
          )}

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
                              description: labels.balanceDue,
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
                  onSuccess={result =>
                    result.paymentId && requestPayments.paypal.mutate(result.paymentId)
                  }
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
            {labels.paymentTracking}
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

      <Card className="border-surface-200 dark:border-surface-800 shadow-sm bg-white dark:bg-surface-950">
        <CardSectionTitle as="h4" className="mb-6">
          {labels.actions}
        </CardSectionTitle>
        <div className="space-y-2">
          {showAgencyActions && request.status !== 'CLOSED' && request.status !== 'CANCELED' && (
            <Button
              variant="outline"
              className="w-full justify-start h-12 border-surface-200 dark:border-surface-800 text-sm font-bold font-outfit"
              onClick={() => onStatusChange('CLOSED')}
            >
              <CheckCircle2 size={16} className="me-3 text-emerald-500" />
              {labels.closeRequest}
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
                {labels.addAttachment}
              </Button>
            </div>
          )}
          {showClientActions && request.status !== 'CLOSED' && request.status !== 'CANCELED' && (
            <Button
              variant="outline"
              className="w-full justify-start h-12 border-surface-200 dark:border-surface-800 text-sm font-bold font-outfit"
              onClick={onRequestRevision}
            >
              <RotateCcw size={16} className="me-3 text-amber-500" />
              {labels.requestRevision}
            </Button>
          )}
          {(showAgencyActions || userData?.id === request.createdBy) && (
            <Button
              variant="outline"
              className="w-full justify-start h-12 border-surface-200 dark:border-surface-800 text-sm font-bold font-outfit text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
              onClick={onDeleteClick}
            >
              <Trash2 size={16} className="me-3" />
              {labels.deleteRequest}
            </Button>
          )}
        </div>
      </Card>

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={onDeleteClose}
        onConfirm={onDeleteConfirm}
        title={labels.deleteTitle}
        description={labels.deleteConfirm}
        confirmText={labels.delete}
        variant="danger"
        isLoading={isDeleting}
      />

      <Card className="border-surface-200 dark:border-surface-800 shadow-sm bg-white dark:bg-surface-950">
        <div className="flex items-center justify-between mb-6">
          <CardSectionTitle as="h4">{labels.assignedSpecialist}</CardSectionTitle>
          {showAgencyActions && (
            <Select
              value={request.assignedTo || ''}
              onChange={e => {
                const selected = agencyTeam.find(m => m.id === e.target.value);
                if (selected) onAssignSpecialist(selected.id, selected.name || selected.email);
              }}
              disabled={isAssigning}
              placeholder={labels.unassigned}
              options={agencyTeam.map(member => ({
                value: member.id,
                label: member.name || member.email,
              }))}
              className="h-8 min-w-[140px] max-w-[200px] text-xs font-bold"
            />
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-surface-100 dark:bg-surface-800 rounded-full flex items-center justify-center">
            <UserIcon size={24} className="text-surface-400" />
          </div>
          <div>
            <p className="font-bold text-surface-900 dark:text-white font-outfit">
              {request.assignedToName || labels.unassigned}
            </p>
            <p className="text-xs text-surface-500 dark:text-surface-400">
              {request.assignedToName ? labels.specialist : labels.waitingForAssignment}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
