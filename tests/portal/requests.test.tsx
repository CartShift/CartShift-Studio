import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../utils/test-utils';
import { setupFirebaseMocks, mockUserData } from '../utils/mock-firebase';
import RequestsClient from '@/app/[locale]/portal/(workspace)/requests/RequestsClient';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

vi.mock('@/lib/hooks/useResolvedOrgId', () => ({
  useResolvedOrgId: () => 'org-1',
}));

vi.mock('@/lib/services/portal-requests', () => ({
  getRequestsByOrg: vi.fn().mockResolvedValue([
    {
      id: 'req-1',
      orgId: 'org-1',
      title: 'Test Request',
      status: 'NEW',
      createdAt: { toDate: () => new Date() },
      priority: 'NORMAL',
    },
  ]),
  getAllRequests: vi.fn().mockResolvedValue([]),
  subscribeToOrgRequests: vi.fn(),
  deleteRequest: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/services/portal-organizations', () => ({
  getMemberByUserId: vi.fn().mockResolvedValue({
    id: 'member-1',
    userId: 'test-user-id',
    role: 'OWNER',
  }),
  ensureMembership: vi.fn().mockResolvedValue({
    id: 'member-1',
    userId: 'test-user-id',
    role: 'OWNER',
  }),
  getOrganizationsWithStats: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/lib/services/portal-sales', () => ({
  getClientRevenueData: vi.fn().mockResolvedValue([]),
}));

const mockUsePortalAuth = vi.fn();
const mockUseRequests = vi.fn();
const mockUseAgencyClients = vi.fn();
const mockUsePinnedRequests = vi.fn();

vi.mock('@/lib/hooks/usePortalAuth', () => ({
  usePortalAuth: () => mockUsePortalAuth(),
}));

vi.mock('@/lib/hooks/useRequests', () => ({
  useRequests: () => mockUseRequests(),
}));

vi.mock('@/lib/hooks/useAgencyClients', () => ({
  useAgencyClients: () => mockUseAgencyClients(),
}));

vi.mock('@/lib/hooks/usePinnedRequests', () => ({
  usePinnedRequests: () => mockUsePinnedRequests(),
}));

vi.mock('@/lib/hooks/useOpenRequest', () => ({
  useOpenRequest: () => ({ openRequest: vi.fn(), openRequestPreview: vi.fn() }),
}));

vi.mock('@/lib/hooks/useRequestListMutations', () => ({
  useRequestListMutations: () => ({
    deleteRequest: vi.fn().mockResolvedValue(undefined),
    isDeleting: false,
    updateStatus: vi.fn().mockResolvedValue(undefined),
    isUpdatingStatus: false,
  }),
}));

vi.mock('@/lib/context/OrgContext', () => ({
  useOrg: () => ({
    orgId: 'org-1',
    hasMultipleOrgs: false,
    fullOrganizations: [{ id: 'org-1', name: 'Test Org' }],
    switchOrg: vi.fn(),
  }),
}));

describe('Requests Page', () => {
  beforeEach(() => {
    setupFirebaseMocks();
    vi.clearAllMocks();

    // Default mock implementation
    mockUsePortalAuth.mockReturnValue({
      userData: mockUserData(),
      loading: false,
      isAuthenticated: true,
      isAgency: false,
    });

    mockUseRequests.mockReturnValue({
      requests: [
        {
          id: 'req-1',
          orgId: 'org-1',
          title: 'Test Request',
          status: 'NEW',
          createdAt: { toDate: () => new Date() },
          priority: 'NORMAL',
        },
      ],
      loading: false,
      error: null,
    });

    mockUseAgencyClients.mockReturnValue({
      organizations: [],
      loading: false,
      error: null,
    });

    mockUsePinnedRequests.mockReturnValue({
      pinnedIds: [],
      isPinned: () => false,
      isPinning: () => false,
      togglePin: vi.fn(),
    });
  });

  it('shows loading state initially', () => {
    mockUsePortalAuth.mockReturnValue({
      userData: mockUserData(),
      loading: true,
      isAuthenticated: true,
      isAgency: false,
    });
    mockUseRequests.mockReturnValue({
      requests: [],
      loading: true,
      error: null,
    });

    render(
      <TestWrapper>
        <RequestsClient />
      </TestWrapper>
    );
    // Check for any element with animate-pulse class
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders requests list when loaded', async () => {
    render(
      <TestWrapper>
        <RequestsClient />
      </TestWrapper>
    );

    await waitFor(() => {
      // Use getAllByText and check that at least one is present (handling mobile/desktop views)
      const elements = screen.getAllByText(/test request/i);
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  it('displays new request button', async () => {
    render(
      <TestWrapper>
        <RequestsClient />
      </TestWrapper>
    );

    expect(screen.getByText(/new request/i)).toBeInTheDocument();
  });
});
