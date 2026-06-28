'use client';

import { Card } from '@/components/ui/Card';
import { BillingProfileForm } from '@/components/portal/billing/BillingProfileForm';

export function AgencyBillingSettingsTab() {
  return (
    <Card className="border-surface-200 dark:border-surface-800 shadow-sm">
      <BillingProfileForm />
    </Card>
  );
}
