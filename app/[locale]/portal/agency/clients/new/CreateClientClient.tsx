'use client';

import { CreateOrganizationForm } from '@/components/portal/forms/CreateOrganizationForm';
import { useRouter } from '@/i18n/navigation';
import { useOrg } from '@/lib/context/OrgContext';
import { getPortalPath } from '@/lib/utils/portal-paths';

export default function CreateClientClient() {
  const router = useRouter();
  const { switchOrg } = useOrg();

  return (
    <div className="h-full w-full flex items-center justify-center p-6">
      <CreateOrganizationForm
        onSuccess={orgId => {
          switchOrg(orgId);
          router.push(getPortalPath('/dashboard/'));
        }}
        onCancel={() => router.back()}
      />
    </div>
  );
}
