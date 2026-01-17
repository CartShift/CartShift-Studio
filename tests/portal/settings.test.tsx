import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../utils/test-utils';
import { setupFirebaseMocks, mockUserData } from '../utils/mock-firebase';
import SettingsClient from '@/app/[locale]/portal/(workspace)/settings/SettingsClient';

vi.mock('@/lib/hooks/useResolvedOrgId', () => ({
  useResolvedOrgId: () => 'org-1',
}));

vi.mock('@/lib/services/portal-organizations', () => ({
  getOrganization: vi.fn().mockResolvedValue({
    id: 'org-1',
    name: 'Test Org',
    slug: 'test-org',
  }),
  updateOrganization: vi.fn().mockResolvedValue(undefined),
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

vi.mock('@/lib/services/portal-uploads', () => ({
  uploadUserProfilePicture: vi.fn(),
  deleteUserProfilePicture: vi.fn(),
  uploadOrganizationLogo: vi.fn(),
  deleteOrganizationLogo: vi.fn(),
  regenerateOrganizationLogoUrl: vi.fn(),
  validateStorageRules: vi.fn().mockResolvedValue(true),
}));

describe('Settings Page', () => {
  beforeEach(() => {
    setupFirebaseMocks();
    vi.clearAllMocks();
  });

  it('shows loading state initially', () => {
    mockUsePortalAuth.mockReturnValue({
      userData: mockUserData(),
      loading: true,
      isAuthenticated: true,
    });

    render(<SettingsClient />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders settings form when loaded', async () => {
    mockUsePortalAuth.mockReturnValue({
      userData: mockUserData(),
      loading: false,
      isAuthenticated: true,
    });

    render(<SettingsClient />);

    await waitFor(() => {
      // Since translations are missing for settings, it renders the keys.
      // There are multiple keys containing "settings", so we check for the title key specifically
      expect(screen.getByText('portal.settings.title')).toBeInTheDocument();
    });
  });
});
