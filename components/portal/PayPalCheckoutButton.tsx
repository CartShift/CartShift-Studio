'use client';

import { PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import { Loader2 } from 'lucide-react';
import { PricingRequest } from '@/lib/types/pricing';
import {
  createPayPalOrderFromPricingRequest,
  extractPaymentResult,
  PaymentResult,
} from '@/lib/services/payment';
import { usePortalTranslations } from '@/lib/i18n/translations';
import {
  capturePublicProposalPayPalOrder,
  createPublicProposalPayPalOrder,
} from '@/lib/services/proposal-api';

interface PayPalCheckoutButtonProps {
  pricingRequest: PricingRequest;
  onSuccess: (result: PaymentResult) => void;
  onError: (error: string) => void;
  disabled?: boolean;
  proposalPayment?: {
    proposalToken: string;
    paymentToken: string;
  };
}

export function PayPalCheckoutButton({
  pricingRequest,
  onSuccess,
  onError,
  disabled = false,
  proposalPayment,
}: PayPalCheckoutButtonProps) {
  const [{ isPending, isRejected }] = usePayPalScriptReducer();
  const t = usePortalTranslations();

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
        <span className="ms-2 text-sm text-surface-500">{t('common.loading')}</span>
      </div>
    );
  }

  if (isRejected) {
    return (
      <div className="text-center py-4">
        <p className="text-red-500 text-sm">{t('pricing.payment.loadError')}</p>
      </div>
    );
  }

  return (
    <div className={disabled ? 'opacity-50 pointer-events-none' : ''}>
      <PayPalButtons
        style={{
          layout: 'vertical',
          color: 'gold',
          shape: 'rect',
          label: 'pay',
          height: 48,
        }}
        disabled={disabled}
        forceReRender={[pricingRequest.totalAmount, pricingRequest.currency, proposalPayment]}
        createOrder={async (_data, actions) => {
          if (proposalPayment) {
            return createPublicProposalPayPalOrder(
              proposalPayment.proposalToken,
              proposalPayment.paymentToken
            );
          }
          const orderData = createPayPalOrderFromPricingRequest(pricingRequest);
          return actions.order.create({
            intent: 'CAPTURE',
            purchase_units: orderData.purchase_units,
          });
        }}
        onApprove={async (_data, actions) => {
          if (proposalPayment && _data.orderID) {
            try {
              const result = await capturePublicProposalPayPalOrder(
                proposalPayment.proposalToken,
                proposalPayment.paymentToken,
                _data.orderID
              );
              if (result.payment.status === 'paid') {
                onSuccess({ success: true, paymentId: _data.orderID });
              } else {
                onError(t('common.paymentFailed'));
              }
            } catch (error) {
              onError(error instanceof Error ? error.message : t('common.paymentFailed'));
            }
            return;
          }
          if (!actions.order) {
            onError('Order capture failed: No order actions available');
            return;
          }

          try {
            const orderDetails = await actions.order.capture();
            const result = extractPaymentResult({
              orderId: orderDetails.id || '',
              status: orderDetails.status || t('pricing.payment.statusUnknown'),
              payer: orderDetails.payer,
            });

            if (result.success) {
              onSuccess(result);
            } else {
              onError(result.error || t('common.paymentFailed'));
            }
          } catch (error) {
            console.error('PayPal capture error:', error);
            onError(t('common.paymentFailedRetry'));
          }
        }}
        onError={err => {
          console.error('PayPal error:', err);
          onError('Payment system error. Please try again.');
        }}
        onCancel={() => {
          // User cancelled - no action needed
        }}
      />
    </div>
  );
}
