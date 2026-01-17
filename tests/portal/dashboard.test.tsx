import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../utils/test-utils';
import { setupFirebaseMocks, mockUserData } from '../utils/mock-firebase';
import DashboardClient from '@/app/[locale]/portal/(workspace)/dashboard/DashboardClient';

vi.mock('@/lib/hooks/useResolvedOrgId', () => ({
  useResolvedOrgId: () => 'org-1',
}));

vi.mock('@/lib/services/portal-requests', () => ({
  subscribeToOrgRequests: vi.fn((_orgId, callback) => {
    callback([]);
    return vi.fn();
  }),
}));

vi.mock('@/lib/services/portal-activities', () => ({
  subscribeToOrgActivities: vi.fn((_orgId, callback) => {
    callback([]);
    return vi.fn();
  }),
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
}));

const mockUsePortalAuth = vi.fn();

vi.mock('@/lib/hooks/usePortalAuth', () => ({
  usePortalAuth: () => mockUsePortalAuth(),
}));

vi.mock('@/lib/context/OrgContext', () => ({
  useOrg: () => ({
    orgId: 'org-1',
    hasMultipleOrgs: false,
    fullOrganizations: [{ id: 'org-1', name: 'Test Org' }],
    switchOrg: vi.fn(),
  }),
}));

const mockUseDashboardData = vi.fn();
vi.mock('@/lib/hooks/useDashboardData', () => ({
  useDashboardData: () => mockUseDashboardData(),
}));

// Mock child components to isolate DashboardClient test
vi.mock('@/components/portal/ClientAnalytics', () => ({
  ClientAnalytics: () => <div data-testid="client-analytics">Client Analytics</div>,
}));
vi.mock('@/components/portal/QuickActions', () => ({
  QuickActions: () => <div data-testid="quick-actions">Quick Actions</div>,
}));
vi.mock('@/components/portal/TipsCard', () => ({
  TipsCard: () => <div data-testid="tips-card">Tips Card</div>,
}));
vi.mock('@/components/portal/skeletons', () => ({
  DashboardSkeleton: () => <div data-testid="dashboard-skeleton" className="animate-pulse">Loading Skeleton</div>,
}));
vi.mock('@/components/portal/PinnedRequests', () => ({
  PinnedRequests: () => <div data-testid="pinned-requests">Pinned Requests</div>,
}));
// Mock ActivityTimeline module so lazy import works
vi.mock('@/components/portal/ActivityTimeline', () => ({
  ActivityTimeline: () => <div data-testid="activity-timeline">Activity Timeline</div>,
}));

describe('Dashboard Page', () => {
  beforeEach(() => {
    setupFirebaseMocks();
    vi.clearAllMocks();
  });

  it('shows loading state initially', () => {
    mockUseDashboardData.mockReturnValue({
      loading: true,
      requests: [],
      activities: [],
      orgId: 'org-1',
      userData: mockUserData(),
    });

    render(<DashboardClient messages={{}} locale="en" />);

    // Check for skeleton elements which usually have animate-pulse class
    // Since DashboardClient renders DashboardSkeleton which contains elements with animate-pulse
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders dashboard content when loaded', async () => {
    mockUseDashboardData.mockReturnValue({
      loading: false,
      requests: [],
      activities: [],
      orgId: 'org-1',
      userData: mockUserData(),
      error: null,
    });

    render(<DashboardClient messages={{}} locale="en" />);

    await waitFor(() => {
      // Multiple elements might contain "dashboard" (keys or text), so checking if any exist is enough
      // or check for specific key
      const elements = screen.getAllByText(/dashboard/i);
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  it('shows error message when access is denied', async () => {
    mockUseDashboardData.mockReturnValue({
      loading: false,
      requests: [],
      activities: [],
      orgId: 'org-1',
      userData: mockUserData(),
      error: 'access_denied',
    });

    render(<DashboardClient messages={{}} locale="en" />);

    await waitFor(() => {
      // access.restrictedMessage
      expect(screen.getByText('portal.access.restrictedMessage')).toBeInTheDocument();
    });
  });

  it('displays new request button', async () => {
    mockUseDashboardData.mockReturnValue({
      loading: false,
      requests: [],
      activities: [],
      orgId: 'org-1',
      userData: mockUserData(),
      error: null,
    });

    render(<DashboardClient messages={{}} locale="en" />);

    await waitFor(() => {
      // QuickActions is mocked, so we check if it is rendered
      expect(screen.getByTestId('quick-actions')).toBeInTheDocument();
    });
  });
});
