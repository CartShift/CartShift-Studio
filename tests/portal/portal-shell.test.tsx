import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../utils/test-utils';
import { setupFirebaseMocks, mockUserData } from '../utils/mock-firebase';
import { PortalShell } from '@/components/portal/PortalShell';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { announcePortal } from '@/components/portal/shell/portal-announcer';

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
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
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

vi.mock('@/components/portal/shell/hooks/useMobileNavBadges', () => ({
  useMobileNavBadges: () => ({}),
}));

vi.mock('@/components/portal/shell/PortalSidebar', () => ({
  PortalSidebar: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="portal-sidebar">{children}</div>
  ),
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
  PortalHeader: ({
    onMobileMenuToggle,
    onMobileSearchToggle,
    onOpenCommandPalette,
  }: {
    onMobileMenuToggle: () => void;
    onMobileSearchToggle: () => void;
    onOpenCommandPalette?: () => void;
  }) => (
    <div data-testid="portal-header">
      <button type="button" onClick={onMobileMenuToggle}>
        Open menu
      </button>
      <button type="button" onClick={onMobileSearchToggle}>
        Open search
      </button>
      <button type="button" onClick={onOpenCommandPalette}>
        Open commands
      </button>
    </div>
  ),
}));
vi.mock('@/components/portal/ui/NotificationDropdown', () => ({
  NotificationDropdown: () => null,
}));
vi.mock('@/components/portal/ui/ImpersonationBanner', () => ({
  ImpersonationBanner: () => null,
}));
vi.mock('@/components/ui/ModalBackdrop', () => ({
  ModalBackdrop: () => null,
}));
vi.mock('@/components/portal/ui/Breadcrumbs', () => ({
  Breadcrumbs: () => <div data-testid="breadcrumbs">Breadcrumbs</div>,
}));
vi.mock('@/components/portal/ui/MobileSearch', () => ({
  MobileSearch: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="mobile-search">Mobile Search</div> : null,
}));
vi.mock('@/components/portal/OnboardingTour', () => ({
  OnboardingTour: () => null,
}));
vi.mock('@/components/portal/CommandPalette', () => ({
  CommandPalette: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="command-palette">Command Palette</div> : null,
}));
vi.mock('@/components/portal/shell/MobileBottomNav', () => ({
  MobileBottomNav: () => null,
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
    mockUsePortalAuth.mockReturnValue({
      loading: false,
      isAuthenticated: true,
      isAgency: false,
    });

  });

  afterEach(() => {
    document.body.innerHTML = '';
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
    handleMarkAllAsRead: vi.fn().mockResolvedValue(undefined),
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
        <PortalShell>
          <div>Test Content</div>
        </PortalShell>
      </TestWrapper>
    );

    const skeletons = document.querySelectorAll('.skeleton-shimmer');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders content when authenticated and authorized', () => {
    mockUsePortalShellState.mockReturnValue({
      ...defaultState,
      loading: false,
      isAuthorized: true,
      initialLoadComplete: true,
    });

    render(
      <TestWrapper>
        <PortalShell>
          <div>Test Content</div>
        </PortalShell>
      </TestWrapper>
    );

    expect(mockUsePortalShellState).toHaveBeenCalled();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('shows access denied when unauthorized', () => {
    mockUsePortalShellState.mockReturnValue({
      ...defaultState,
      isAuthorized: false,
      hasEverBeenAuthorized: false,
      initialLoadComplete: true,
      loading: false,
    });

    render(
      <TestWrapper>
        <PortalShell>
          <div>Test Content</div>
        </PortalShell>
      </TestWrapper>
    );

    expect(screen.getByText(/access restricted/i)).toBeInTheDocument();
    expect(screen.queryByText('Test Content')).not.toBeInTheDocument();
  });

  it('displays navigation sidebar', () => {
    mockUsePortalShellState.mockReturnValue({
      ...defaultState,
      loading: false,
      isAuthorized: true,
      initialLoadComplete: true,
    });

    render(
      <TestWrapper>
        <PortalShell>
          <div>Test Content</div>
        </PortalShell>
      </TestWrapper>
    );

    expect(screen.getByTestId('portal-sidebar')).toBeInTheDocument();
  });

  it('shows breadcrumbs on nested routes', () => {
    mockUsePortalShellState.mockReturnValue({
      ...defaultState,
      pathname: '/portal/dashboard/reports',
    });

    render(
      <TestWrapper>
        <PortalShell>
          <div>Test Content</div>
        </PortalShell>
      </TestWrapper>
    );

    expect(screen.getByTestId('breadcrumbs')).toBeInTheDocument();
  });

  it('opens mobile search from header', () => {
    const setIsMobileSearchOpen = vi.fn();
    mockUsePortalShellState.mockReturnValue({
      ...defaultState,
      setIsMobileSearchOpen,
      isMobileSearchOpen: false,
    });

    render(
      <TestWrapper>
        <PortalShell>
          <div>Test Content</div>
        </PortalShell>
      </TestWrapper>
    );

    fireEvent.click(screen.getByText('Open search'));
    expect(setIsMobileSearchOpen).toHaveBeenCalledWith(true);
  });

  it('opens command palette from header control', async () => {
    mockUsePortalShellState.mockReturnValue({
      ...defaultState,
    });

    render(
      <TestWrapper>
        <PortalShell>
          <div>Test Content</div>
        </PortalShell>
      </TestWrapper>
    );

    expect(screen.queryByTestId('command-palette')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Open commands'));
    await waitFor(() => {
      expect(screen.getByTestId('command-palette')).toBeInTheDocument();
    });
  });
});

describe('announcePortal', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="portal-announcer" role="status" class="sr-only"></div>';
  });

  it('writes message to live region', () => {
    announcePortal('Hello');
    expect(document.getElementById('portal-announcer')?.textContent).toBe('Hello');
  });
});
