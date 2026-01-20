'use client';

import { PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import { Loader2 } from 'lucide-react';
import { PricingRequest } from '@/lib/types/pricing';
import {
  createPayPalOrderFromPricingRequest,
  extractPaymentResult,
  PaymentResult,
} from '@/lib/services/payment';
import { useTranslations } from 'next-intl';

interface PayPalCheckoutButtonProps {
  pricingRequest: PricingRequest;
  onSuccess: (result: PaymentResult) => void;
  onError: (error: string) => void;
  disabled?: boolean;
}

export function PayPalCheckoutButton({
  pricingRequest,
  onSuccess,
  onError,
  disabled = false,
}: PayPalCheckoutButtonProps) {
  const [{ isPending, isRejected }] = usePayPalScriptReducer();
  const t = useTranslations();

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ms-2 text-sm text-surface-500">{t('portal.common.loading')}</span>
      </div>
    );
  }

  if (isRejected) {
    return (
      <div className="text-center py-4">
        <p className="text-red-500 text-sm">{t('portal.pricing.payment.loadError')}</p>
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
        forceReRender={[pricingRequest.totalAmount, pricingRequest.currency]}
        createOrder={async (_data, actions) => {
          const orderData = createPayPalOrderFromPricingRequest(pricingRequest);
          return actions.order.create({
            intent: 'CAPTURE',
            purchase_units: orderData.purchase_units,
          });
        }}
        onApprove={async (_data, actions) => {
          if (!actions.order) {
            onError('Order capture failed: No order actions available');
            return;
          }

          try {
            const orderDetails = await actions.order.capture();
            const result = extractPaymentResult({
              orderId: orderDetails.id || '',
              status: orderDetails.status || t('portal.pricing.payment.statusUnknown'),
              payer: orderDetails.payer,
            });

            if (result.success) {
              onSuccess(result);
            } else {
              onError(result.error || t('portal.common.paymentFailed'));
            }
          } catch (error) {
            console.error('PayPal capture error:', error);
            onError(t('portal.common.paymentFailedRetry'));
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
