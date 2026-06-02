import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getBillingProfile, updateBillingProfile } from '@/lib/services/request-billing-server';
import { mapRequestBillingError } from '@/lib/services/request-billing-api-utils';

const schema = z.object({
  businessName: z.string().trim().min(1).max(160),
  legalName: z.string().trim().max(160).optional(),
  taxId: z.string().trim().max(80).optional(),
  vatId: z.string().trim().max(80).optional(),
  email: z.string().trim().email().optional().or(z.literal('')),
  phone: z.string().trim().max(80).optional(),
  website: z.string().trim().url().optional().or(z.literal('')),
  addressLine1: z.string().trim().max(160).optional(),
  addressLine2: z.string().trim().max(160).optional(),
  city: z.string().trim().max(100).optional(),
  country: z.string().trim().max(100).optional(),
  postalCode: z.string().trim().max(40).optional(),
  defaultCurrency: z.enum(['USD', 'ILS', 'EUR']),
  defaultTaxRate: z.number().min(0).max(1),
  defaultPaymentTerms: z.string().trim().max(500).optional(),
  paymentInstructions: z.string().trim().max(1000).optional(),
  bankDetails: z.object({
    bankName: z.string().trim().max(120).optional(),
    branchNumber: z.string().trim().max(40).optional(),
    accountNumber: z.string().trim().max(80).optional(),
    iban: z.string().trim().max(80).optional(),
    swift: z.string().trim().max(40).optional(),
    beneficiaryName: z.string().trim().max(160).optional(),
  }).optional(),
  paypalEmail: z.string().trim().email().optional().or(z.literal('')),
  logoUrl: z.string().trim().url().optional().or(z.literal('')),
});

export async function GET() {
  try {
    return NextResponse.json({ profile: await getBillingProfile() });
  } catch (error) {
    return mapRequestBillingError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'INVALID_PROFILE' }, { status: 400 });
    return NextResponse.json({ profile: await updateBillingProfile(parsed.data) });
  } catch (error) {
    return mapRequestBillingError(error);
  }
}
