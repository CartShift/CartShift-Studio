import { PricingRequest, formatCurrency } from '@/lib/types/pricing';

// ============================================
// PAYPAL CONFIGURATION
// ============================================

export function getPayPalClientId(): string {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  if (!clientId) {
    console.warn('PayPal Client ID not configured. Set NEXT_PUBLIC_PAYPAL_CLIENT_ID in .env.local');
    // Return sandbox client ID for development
    return 'sb';
  }
  return clientId;
}

export interface PayPalOrderData {
  orderId: string;
  status: string;
  payer?: {
    email_address?: string;
    name?: {
      given_name?: string;
      surname?: string;
    };
  };
}

// ============================================
// ORDER CREATION
// ============================================

export function createPayPalOrderFromPricingRequest(pricingRequest: PricingRequest): {
  purchase_units: Array<{
    reference_id: string;
    description: string;
    amount: {
      currency_code: string;
      value: string;
      breakdown: {
        item_total: {
          currency_code: string;
          value: string;
        };
      };
    };
    items: Array<{
      name: string;
      quantity: string;
      unit_amount: {
        currency_code: string;
        value: string;
      };
    }>;
  }>;
} {
  const currencyCode = pricingRequest.currency;
  const totalValue = (pricingRequest.totalAmount / 100).toFixed(2);

  const items = pricingRequest.lineItems.map(item => ({
    name: item.description.substring(0, 127), // PayPal has a 127 char limit
    quantity: item.quantity.toString(),
    unit_amount: {
      currency_code: currencyCode,
      value: (item.unitPrice / 100).toFixed(2),
    },
  }));

  // Calculate item total for breakdown
  const itemTotal = pricingRequest.lineItems
    .reduce((sum, item) => sum + (item.quantity * item.unitPrice) / 100, 0)
    .toFixed(2);

  return {
    purchase_units: [
      {
        reference_id: pricingRequest.id,
        description: pricingRequest.title.substring(0, 127),
        amount: {
          currency_code: currencyCode,
          value: totalValue,
          breakdown: {
            item_total: {
              currency_code: currencyCode,
              value: itemTotal,
            },
          },
        },
        items,
      },
    ],
  };
}

// ============================================
// PAYMENT VERIFICATION
// ============================================

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  error?: string;
  payerEmail?: string;
  payerName?: string;
}

export function extractPaymentResult(orderData: PayPalOrderData): PaymentResult {
  if (orderData.status === 'COMPLETED') {
    return {
      success: true,
      paymentId: orderData.orderId,
      payerEmail: orderData.payer?.email_address,
      payerName: orderData.payer?.name
        ? `${orderData.payer.name.given_name || ''} ${orderData.payer.name.surname || ''}`.trim()
        : undefined,
    };
  }

  return {
    success: false,
    error: `Payment not completed. Status: ${orderData.status}`,
  };
}

// ============================================
// FORMATTING HELPERS
// ============================================

export function formatPaymentAmount(pricingRequest: PricingRequest): string {
  return formatCurrency(pricingRequest.totalAmount, pricingRequest.currency);
}

export function getPayPalLocale(locale: string): string {
  // Map our app locales to PayPal locale codes
  const localeMap: Record<string, string> = {
    en: 'en_US',
    he: 'he_IL',
  };
  return localeMap[locale] || 'en_US';
}
