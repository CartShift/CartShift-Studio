import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../utils/test-utils';
import { setupFirebaseMocks, mockUserData } from '../utils/mock-firebase';
import { PortalShell } from '@/components/portal/PortalShell';
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

const mockPush = vi.fn();
const mockPathname = '/portal/dashboard';

vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => mockPathname,
  Link: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

vi.mock('@/lib/services/portal-notifications', () => ({
  subscribeToNotifications: vi.fn(() => vi.fn()),
  subscribeToUnreadCount: vi.fn(() => vi.fn()),
  markNotificationAsRead: vi.fn(),
  markAllNotificationsAsRead: vi.fn(),
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

const mockUsePortalShellState = vi.fn();
vi.mock('@/components/portal/shell/hooks/usePortalShellState', () => ({
  usePortalShellState: () => mockUsePortalShellState(),
}));

// Mock child components
vi.mock('@/components/portal/shell/PortalSidebar', () => ({
  PortalSidebar: ({ children }: any) => <div data-testid="portal-sidebar">{children}</div>,
}));
vi.mock('@/components/portal/shell/SidebarBrand', () => ({
  SidebarBrand: () => <div>Sidebar Brand</div>,
}));
vi.mock('@/components/portal/shell/SidebarNavigation', () => ({
  SidebarNavigation: () => <div>Sidebar Navigation</div>,
}));
vi.mock('@/components/portal/shell/OrganizationSwitcher', () => ({
  OrganizationSwitcher: () => <div>Organization Switcher</div>,
}));
vi.mock('@/components/portal/shell/SidebarFooter', () => ({
  SidebarFooter: () => <div>Sidebar Footer</div>,
}));
vi.mock('@/components/portal/ui/PortalHeader', () => ({
  PortalHeader: () => <div data-testid="portal-header">Portal Header</div>,
}));
vi.mock('@/components/portal/ui/NotificationDropdown', () => ({
  NotificationDropdown: () => null,
}));
vi.mock('@/components/portal/shell/ImpersonationBanner', () => ({
  ImpersonationBanner: () => null,
}));
vi.mock('@/components/ui/ModalBackdrop', () => ({
  ModalBackdrop: () => null,
}));
vi.mock('@/components/portal/ui/Breadcrumbs', () => ({
  Breadcrumbs: () => <div>Breadcrumbs</div>,
}));
vi.mock('@/components/portal/ui/MobileSearch', () => ({
  MobileSearch: () => null,
}));
vi.mock('@/components/portal/OnboardingTour', () => ({
  OnboardingTour: () => null,
}));

vi.mock('@/lib/context/ImpersonationContext', () => ({
  useImpersonation: () => ({
    isImpersonating: false,
    impersonatedOrg: null,
    startImpersonation: vi.fn(),
    stopImpersonation: vi.fn(),
  }),
}));

describe('Portal Shell', () => {
  beforeEach(() => {
    setupFirebaseMocks();
    vi.clearAllMocks();
    mockPush.mockClear();
  });

  const defaultState = {
    isAgency: false,
    pathname: '/portal/dashboard',
    initialLoadComplete: true,
    loading: false,
    isAuthorized: true,
    hasEverBeenAuthorized: true,
    isMobileMenuOpen: false,
    setIsMobileMenuOpen: vi.fn(),
    isExpanded: true,
    handleTouchStart: vi.fn(),
    handleTouchEnd: vi.fn(),
    fullOrganizations: [],
    effectiveOrgId: 'org-1',
    handleOrgSwitch: vi.fn(),
    isMobile: false,
    isSidebarOpen: true,
    setIsSidebarOpen: vi.fn(),
    handleSignOut: vi.fn(),
    userData: mockUserData(),
    accountType: 'CLIENT',
    memberRole: 'OWNER',
    notifications: [],
    unreadCount: 0,
    isNotificationOpen: false,
    setIsNotificationOpen: vi.fn(),
    notificationRef: { current: null },
    notificationButtonRef: { current: null },
    handleNotificationClick: vi.fn(),
    handleMarkAllAsRead: vi.fn(),
    mounted: true,
    showOnboarding: false,
    setShowOnboarding: vi.fn(),
    isMobileSearchOpen: false,
    setIsMobileSearchOpen: vi.fn(),
    notificationPosition: {},
    notificationDropdownRef: { current: null },
  };

  it('shows loading state initially', () => {
    mockUsePortalShellState.mockReturnValue({
      ...defaultState,
      loading: true,
      initialLoadComplete: false,
      isAuthorized: null,
    });

    render(
      <TestWrapper>
        <PortalShell orgId="org-1">
          <div>Test Content</div>
        </PortalShell>
      </TestWrapper>
    );
    // PortalState renders loading skeletons which have skeleton-shimmer class by default
    const skeletons = document.querySelectorAll('.skeleton-shimmer');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders content when authenticated and authorized', async () => {
    mockUsePortalShellState.mockReturnValue({
      ...defaultState,
      loading: false,
      isAuthorized: true,
      initialLoadComplete: true,
    });

    render(
      <TestWrapper>
        <PortalShell orgId="org-1">
          <div>Test Content</div>
        </PortalShell>
      </TestWrapper>
    );

    // Check if mock was called
    expect(mockUsePortalShellState).toHaveBeenCalled();

    // Should render children immediately if state allows
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('displays navigation sidebar', async () => {
    mockUsePortalShellState.mockReturnValue({
      ...defaultState,
      loading: false,
      isAuthorized: true,
      initialLoadComplete: true,
    });

    render(
      <TestWrapper>
        <PortalShell orgId="org-1">
          <div>Test Content</div>
        </PortalShell>
      </TestWrapper>
    );

    expect(screen.getByTestId('portal-sidebar')).toBeInTheDocument();
  });
});
