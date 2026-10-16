import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import LoginClient from '@/app/[locale]/portal/(auth)/login/LoginClient';
import messages from '@/messages/en.json';

const mocks = vi.hoisted(() => ({
  login: vi.fn(), google: vi.fn(), sync: vi.fn(), success: vi.fn(), error: vi.fn(),
}));
vi.mock('@/lib/services/auth', () => ({ loginWithEmail: mocks.login, signInWithGoogle: mocks.google, syncSessionCookie: mocks.sync }));
vi.mock('next/navigation', () => ({ useSearchParams: () => ({ get: () => '/api/cartshift-mcp/oauth/authorize?client_id=test' }) }));
vi.mock('@/components/providers/BrandingProvider', () => ({ useBranding: () => ({ branding: null }) }));
vi.mock('@/lib/hooks/usePortalNavigation', () => ({ usePortalNavigation: () => ({ navigateToPortal: vi.fn(), getPortalHref: (p: string) => p }) }));
vi.mock('@/i18n/navigation', () => ({ Link: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a> }));
vi.mock('sonner', () => ({ toast: { success: mocks.success, error: mocks.error } }));

describe('MCP login continuation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.login.mockResolvedValue({ uid: 'test-user' });
    mocks.google.mockResolvedValue({ uid: 'test-user' });
    mocks.sync.mockRejectedValue(new Error('Unable to create a server session'));
  });

  it.each(['email', 'google'])('waits for a verified server session before completing %s OAuth login', async method => {
    const user = userEvent.setup();
    render(<NextIntlClientProvider locale="en" messages={messages}><LoginClient /></NextIntlClientProvider>);
    if (method === 'email') {
      await user.type(screen.getByPlaceholderText('yours@example.com'), 'test@example.com');
      await user.type(screen.getByPlaceholderText('••••••••'), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));
    } else {
      await user.click(screen.getByRole('button', { name: /google/i }));
    }
    await waitFor(() => expect(screen.getByText('Unable to create a server session')).toBeInTheDocument());
    expect(mocks.sync).toHaveBeenCalledWith({ uid: 'test-user' }, { required: true });
    expect(mocks.success).not.toHaveBeenCalled();
  });
});
