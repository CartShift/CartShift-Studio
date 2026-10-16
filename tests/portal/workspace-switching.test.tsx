import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { OrgProvider, useOrg } from '@/lib/context/OrgContext';

const mocks = vi.hoisted(() => ({
  auth: { userData: null as null | Record<string, unknown>, loading: false },
}));

vi.mock('@/lib/hooks/usePortalAuth', () => ({
  usePortalAuth: () => mocks.auth,
}));
vi.mock('@/lib/hooks/useUserOrganizations', () => ({
  useUserOrganizations: () => ({
    data: [
      { id: 'org-a', name: 'CartShift' },
      { id: 'org-b', name: 'CartShift' },
    ],
    isLoading: false,
  }),
}));

function Probe() {
  const state = useOrg();
  return (
    <div>
      <output data-testid="org">{state.orgId ?? 'agency'}</output>
      <output data-testid="count">{String(state.hasMultipleOrgs)}</output>
      <button onClick={() => state.switchOrg('org-b')}>Switch</button>
    </div>
  );
}

const renderContext = () => render(<OrgProvider><Probe /></OrgProvider>);

describe('workspace identity isolation', () => {
  beforeEach(() => {
    sessionStorage.clear();
    mocks.auth.userData = null;
    mocks.auth.loading = false;
  });

  it('never restores a client organization as the agency workspace', async () => {
    sessionStorage.setItem('cartshift_current_org_id', 'org-b');
    mocks.auth.userData = {
      id: 'agency-1', accountType: 'AGENCY', isAgency: true,
      organizations: ['org-a', 'org-b'],
    };
    renderContext();
    await waitFor(() => expect(screen.getByTestId('org')).toHaveTextContent('agency'));
    expect(screen.getByTestId('count')).toHaveTextContent('false');
    fireEvent.click(screen.getByText('Switch'));
    expect(screen.getByTestId('org')).toHaveTextContent('agency');
  });

  it('keeps selected organizations isolated when a different user signs in', async () => {
    mocks.auth.userData = {
      id: 'client-a', accountType: 'CLIENT', isAgency: false,
      organizations: ['org-a', 'org-b'],
    };
    const view = renderContext();
    await waitFor(() => expect(screen.getByTestId('org')).toHaveTextContent('org-a'));
    fireEvent.click(screen.getByText('Switch'));
    expect(screen.getByTestId('org')).toHaveTextContent('org-b');
    expect(sessionStorage.getItem('cartshift_current_org_id:client-a')).toBe('org-b');

    mocks.auth.userData = {
      id: 'client-b', accountType: 'CLIENT', isAgency: false,
      organizations: ['org-a', 'org-b'],
    };
    view.rerender(<OrgProvider><Probe /></OrgProvider>);
    await waitFor(() => expect(screen.getByTestId('org')).toHaveTextContent('org-a'));
    expect(sessionStorage.getItem('cartshift_current_org_id:client-b')).toBe('org-a');
  });

  it('uses the explicit client-view target, not a stale agency selection', async () => {
    sessionStorage.setItem('cartshift_current_org_id', 'org-b');
    mocks.auth.userData = {
      id: 'agency-1', accountType: 'CLIENT', isAgency: false,
      organizations: ['org-a'],
    };
    renderContext();
    await waitFor(() => expect(screen.getByTestId('org')).toHaveTextContent('org-a'));
    expect(screen.getByTestId('count')).toHaveTextContent('false');
  });
});
