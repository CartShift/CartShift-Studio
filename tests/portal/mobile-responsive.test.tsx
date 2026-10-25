import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { LayoutDashboard, Settings, Users } from 'lucide-react';
import messages from '@/messages/en.json';
import { AgencySettingsNav } from '@/components/portal/settings/AgencySettingsNav';
import { PortalMetricCard } from '@/components/portal/ui/PortalMetricCard';
import { PortalPageHeader } from '@/components/portal/ui/PortalPageHeader';
import { MobileBottomNav } from '@/components/portal/shell/MobileBottomNav';

vi.mock('@/i18n/navigation', () => ({
  usePathname: () => '/portal/agency/dashboard/',
  Link: ({ children, href, ...props }: React.PropsWithChildren<{ href: string; [key: string]: unknown }>) =>
    <a href={href} {...props}>{children}</a>,
}));

describe('Portal responsive components', () => {
  it('exposes agency settings as a mobile-native selector with working navigation', () => {
    const select = vi.fn();
    render(<AgencySettingsNav
      activeTab="profile" onSelect={select}
      tabs={[{ id: 'profile', label: 'Profile', icon: Users }, { id: 'system', label: 'System', icon: Settings }]}
      groups={[{ label: 'General', tabIds: ['profile', 'system'] }]}
    />);
    const input = screen.getByRole('combobox', { name: 'Agency settings' });
    expect(input).toHaveClass('lg:hidden');
    expect(screen.getByRole('option', { name: 'System' })).toBeInTheDocument();
    fireEvent.change(input, { target: { value: 'system' } });
    expect(select).toHaveBeenCalledWith('system');
  });
  it('keeps long metric values wrap-safe and header actions responsive', () => {
    const { container } = render(<>
      <PortalMetricCard icon={Users} label="Revenue" value="₪123,456,789.00" />
      <PortalPageHeader title="Dashboard" action={<button>Export</button>} />
    </>);
    expect(screen.getByText('₪123,456,789.00')).toHaveClass('break-words');
    expect(container.querySelector('.sm\\:shrink-0')).toBeInTheDocument();
  });

  it('shows only approved quick links and keeps remaining destinations in More', () => {
    render(<NextIntlClientProvider locale="en" messages={messages}>
      <MobileBottomNav isAgency navGroups={[{
        id: 'agency',
        items: [
          { label: 'Dashboard', href: '/portal/agency/dashboard/', icon: LayoutDashboard },
          { label: 'Clients', href: '/portal/agency/clients/', icon: Users },
          { label: 'Settings', href: '/portal/agency/settings/', icon: Settings },
        ],
      }]} />
    </NextIntlClientProvider>);
    expect(screen.getByRole('link', { name: /Dashboard/i })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: /Clients/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Workboard/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: messages.portal.accessibility.moreMenu }));
    expect(screen.getByRole('link', { name: /Settings/i })).toBeInTheDocument();
  });
});
