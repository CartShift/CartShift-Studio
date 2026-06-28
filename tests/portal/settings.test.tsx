import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../utils/test-utils';
import { setupFirebaseMocks, mockUserData } from '../utils/mock-firebase';
import SettingsClient from '@/app/[locale]/portal/(workspace)/settings/SettingsClient';

vi.mock('@/lib/hooks/useResolvedOrgId', () => ({
  useResolvedOrgId: () => 'org-1',
}));

const mockUsePortalAuth = vi.fn();
const mockUseWorkspaceSettings = vi.fn();

vi.mock('@/lib/hooks/usePortalAuth', () => ({
  usePortalAuth: () => mockUsePortalAuth(),
}));

vi.mock('@/lib/hooks/useWorkspaceSettings', () => ({
  useWorkspaceSettings: () => mockUseWorkspaceSettings(),
}));

vi.mock('@/lib/context/OrgContext', () => ({
  useOrg: () => ({
    orgId: 'org-1',
    hasMultipleOrgs: false,
    fullOrganizations: [{ id: 'org-1', name: 'Test Org' }],
    switchOrg: vi.fn(),
  }),
}));

const defaultWorkspaceSettings = {
  organization: { id: 'org-1', name: 'Test Org', slug: 'test-org' },
  loading: false,
  error: null,
  orgToFormData: (org: { name?: string }) => ({
    name: org.name || '',
    website: '',
    industry: '',
    bio: '',
    billingName: '',
    billingEmail: '',
    billingTaxId: '',
    billingAddressLine1: '',
    billingAddressLine2: '',
    billingCity: '',
    billingCountry: '',
    billingPostalCode: '',
  }),
  refetchOrganization: vi.fn(),
  updateOrganization: vi.fn(),
  isSavingOrg: false,
  updateUser: vi.fn(),
  uploadAvatar: vi.fn(),
  deleteAvatar: vi.fn(),
  uploadLogo: vi.fn(),
  deleteLogo: vi.fn(),
  regenerateLogo: vi.fn(),
  resetPassword: vi.fn(),
  isResettingPassword: false,
};

describe('Settings Page', () => {
  beforeEach(() => {
    setupFirebaseMocks();
    vi.clearAllMocks();
    mockUseWorkspaceSettings.mockReturnValue(defaultWorkspaceSettings);
  });

  it('shows loading state initially', () => {
    mockUseWorkspaceSettings.mockReturnValue({
      ...defaultWorkspaceSettings,
      organization: null,
      loading: true,
    });
    mockUsePortalAuth.mockReturnValue({
      userData: mockUserData(),
      user: { uid: 'test-user-id', email: 'test@example.com', providerData: [] },
      loading: false,
      isAuthenticated: true,
    });

    render(<SettingsClient />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders settings form when loaded', async () => {
    mockUsePortalAuth.mockReturnValue({
      userData: mockUserData(),
      user: { uid: 'test-user-id', email: 'test@example.com', providerData: [] },
      loading: false,
      isAuthenticated: true,
    });

    render(<SettingsClient />);

    await waitFor(() => {
      expect(screen.getByText('portal.settings.title')).toBeInTheDocument();
    });
  });
});
