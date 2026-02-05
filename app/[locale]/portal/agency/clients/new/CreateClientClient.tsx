'use client';

import { CreateOrganizationForm } from '@/components/portal/forms/CreateOrganizationForm';
import { useRouter } from '@/i18n/navigation';
import { getPortalPath } from '@/lib/utils/portal-paths';

export default function CreateClientClient() {
  const router = useRouter();

  return (
    <div className="h-full w-full flex items-center justify-center p-6">
      <CreateOrganizationForm
        onSuccess={orgId => {
          // Redirect to the newly created client's detail page
          router.push(getPortalPath(`/agency/clients/${orgId}/`));
        }}
        onCancel={() => router.back()}
      />
    </div>
  );
}
