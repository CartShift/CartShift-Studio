'use client';

import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import { getPayPalClientId, getPayPalLocale } from '@/lib/services/payment';
import { useLocale } from 'next-intl';

interface PayPalProviderProps {
  children: React.ReactNode;
}

export function PayPalProvider({ children }: PayPalProviderProps) {
  const locale = useLocale();
  const clientId = getPayPalClientId();

  const initialOptions = {
    clientId,
    currency: 'USD', // Default currency, can be overridden per order
    intent: 'capture',
    locale: getPayPalLocale(locale),
  };

  return <PayPalScriptProvider options={initialOptions}>{children}</PayPalScriptProvider>;
}
