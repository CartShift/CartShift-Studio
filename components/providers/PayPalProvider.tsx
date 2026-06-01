'use client';

import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import { getPayPalClientId, getPayPalLocale } from '@/lib/services/payment';
import { useLocale } from 'next-intl';

interface PayPalProviderProps {
  children: React.ReactNode;
  currency?: string;
}

export function PayPalProvider({ children, currency = 'USD' }: PayPalProviderProps) {
  const locale = useLocale();
  const clientId = getPayPalClientId();

  const initialOptions = {
    clientId,
    currency,
    intent: 'capture',
    locale: getPayPalLocale(locale),
  };

  return <PayPalScriptProvider options={initialOptions}>{children}</PayPalScriptProvider>;
}
