import 'server-only';

const PAYPAL_API_BASE =
  process.env.PAYPAL_ENVIRONMENT === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

function getPayPalCredentials() {
  const clientId = process.env.PAYPAL_CLIENT_ID || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !secret) {
    throw new Error('PayPal server credentials are not configured');
  }
  return { clientId, secret };
}

export function isPayPalServerConfigured(): boolean {
  return Boolean(
    (process.env.PAYPAL_CLIENT_ID || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID) &&
      process.env.PAYPAL_CLIENT_SECRET
  );
}

async function getPayPalAccessToken(): Promise<string> {
  const { clientId, secret } = getPayPalCredentials();
  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Unable to authenticate with PayPal');
  }

  const payload = (await response.json()) as { access_token?: string };
  if (!payload.access_token) {
    throw new Error('PayPal access token is missing');
  }
  return payload.access_token;
}

async function paypalFetch<T>(path: string, init: RequestInit): Promise<T> {
  const accessToken = await getPayPalAccessToken();
  const response = await fetch(`${PAYPAL_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
    cache: 'no-store',
  });

  const payload = (await response.json().catch(() => ({}))) as T & {
    message?: string;
    details?: Array<{ description?: string }>;
  };
  if (!response.ok) {
    throw new Error(payload.details?.[0]?.description || payload.message || 'PayPal request failed');
  }
  return payload;
}

export async function createPayPalProposalOrder(input: {
  paymentId: string;
  amount: number;
  currency: string;
  label: string;
}): Promise<{ id: string }> {
  return paypalFetch('/v2/checkout/orders', {
    method: 'POST',
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: input.paymentId,
          description: input.label.slice(0, 127),
          amount: {
            currency_code: input.currency,
            value: (input.amount / 100).toFixed(2),
          },
        },
      ],
    }),
  });
}

export async function capturePayPalProposalOrder(orderId: string): Promise<{
  id: string;
  status?: string;
  purchase_units?: Array<{
    payments?: { captures?: Array<{ id?: string; status?: string }> };
  }>;
}> {
  return paypalFetch(`/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
    method: 'POST',
    body: '{}',
  });
}

export async function verifyPayPalWebhook(input: {
  transmissionId: string | null;
  transmissionTime: string | null;
  certUrl: string | null;
  authAlgo: string | null;
  transmissionSig: string | null;
  webhookEvent: unknown;
}): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) {
    throw new Error('PayPal webhook ID is not configured');
  }
  if (
    !input.transmissionId ||
    !input.transmissionTime ||
    !input.certUrl ||
    !input.authAlgo ||
    !input.transmissionSig
  ) {
    return false;
  }

  const result = await paypalFetch<{ verification_status?: string }>(
    '/v1/notifications/verify-webhook-signature',
    {
      method: 'POST',
      body: JSON.stringify({
        transmission_id: input.transmissionId,
        transmission_time: input.transmissionTime,
        cert_url: input.certUrl,
        auth_algo: input.authAlgo,
        transmission_sig: input.transmissionSig,
        webhook_id: webhookId,
        webhook_event: input.webhookEvent,
      }),
    }
  );
  return result.verification_status === 'SUCCESS';
}
