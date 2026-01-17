import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../utils/test-utils';
import { setupFirebaseMocks, mockUserData } from '../utils/mock-firebase';
import PortalRootClient from '@/app/[locale]/portal/PortalRootClient';

const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  usePathname: () => '/portal/dashboard',
}));

const mockUsePortalAuth = vi.fn();

vi.mock('@/lib/hooks/usePortalAuth', () => ({
  usePortalAuth: () => mockUsePortalAuth(),
}));

vi.mock('@/components/portal/onboarding/OnboardingWizard', () => ({
  OnboardingWizard: () => <div>Onboarding Wizard</div>,
}));

describe('Portal Root', () => {
  beforeEach(() => {
    setupFirebaseMocks();
    vi.clearAllMocks();
    mockPush.mockClear();
    mockReplace.mockClear();
  });

  it('shows loading state initially', () => {
    mockUsePortalAuth.mockReturnValue({
      userData: null,
      loading: true,
      isAuthenticated: false,
    });

    render(<PortalRootClient />);
    const skeletons = document.querySelectorAll('[aria-hidden="true"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('redirects to login when not authenticated', async () => {
    mockUsePortalAuth.mockReturnValue({
      userData: null,
      loading: false,
      isAuthenticated: false,
    });

    render(<PortalRootClient />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/portal/login/');
    });
  });

  it('redirects agency users to requests', async () => {
    mockUsePortalAuth.mockReturnValue({
      userData: mockUserData({ isAgency: true, accountType: 'AGENCY' }),
      loading: false,
      isAuthenticated: true,
    });

    render(<PortalRootClient />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/portal/requests/');
    });
  });

  it('redirects users with organizations to dashboard', async () => {
    mockUsePortalAuth.mockReturnValue({
      userData: mockUserData({ organizations: ['org-1'] }),
      loading: false,
      isAuthenticated: true,
    });

    render(<PortalRootClient />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/portal/dashboard/');
    });
  });

  it('shows onboarding wizard for users without organizations', () => {
    mockUsePortalAuth.mockReturnValue({
      userData: mockUserData({ organizations: [] }),
      loading: false,
      isAuthenticated: true,
    });

    render(<PortalRootClient />);
    expect(screen.getByText('Onboarding Wizard')).toBeInTheDocument();
  });
});
