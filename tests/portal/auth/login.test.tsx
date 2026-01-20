import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../utils/test-utils';
import { setupFirebaseMocks } from '../../utils/mock-firebase';
import userEvent from '@testing-library/user-event';
import LoginClient from '@/app/[locale]/portal/(auth)/login/LoginClient';

const mockPush = vi.fn();
const mockGet = vi.fn(() => null);

vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => ({
    get: mockGet,
  }),
  usePathname: () => '/portal/login',
  Link: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

vi.mock('@/lib/services/auth', () => ({
  loginWithEmail: vi.fn().mockResolvedValue({ uid: 'test-user-id' }),
}));

describe('Login Page', () => {
  beforeEach(() => {
    setupFirebaseMocks();
    vi.clearAllMocks();
    mockGet.mockReturnValue(null);
  });

  it('renders login form', async () => {
    render(<LoginClient />);
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/yours@example.com/i)).toBeInTheDocument();
    });
  });

  it('shows validation errors for invalid email', async () => {
    render(<LoginClient />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/yours@example.com/i)).toBeInTheDocument();
    });

    const emailInput = screen.getByPlaceholderText(/yours@example.com/i);
    const passwordInput = screen.getByPlaceholderText(/••••••••/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await userEvent.type(emailInput, 'invalid-email');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.click(submitButton);

    await waitFor(() => {
      const error = screen.queryByText(/valid email/i);
      expect(error).toBeInTheDocument();
    });
  });
});
