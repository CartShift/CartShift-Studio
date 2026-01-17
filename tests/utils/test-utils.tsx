import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

const messages = {
  portal: {
    loading: {
      workspace: 'Loading workspace...',
      init: 'Initializing Studio Environment',
      auth: { login: 'Loading sign in...' },
    },
    dashboard: {
      title: 'Dashboard',
      subtitle: 'Welcome to your dashboard',
      loading: 'Loading dashboard...',
      actions: { newRequest: 'New Request' },
      error: {
        title: 'Error',
        retry: 'Retry',
      },
      pinned: {
        title: 'Pinned Requests',
        pin: 'Pin',
        unpin: 'Unpin',
      },
      serviceStatus: {
        title: 'Service Status',
        design: 'Design',
        dev: 'Development',
        active: 'Active',
        peak: 'Peak',
        etaLabel: 'ETA',
        days: 'days',
        avgResponse: 'Avg Response',
        responseTime: '< 24h',
      },
    },
    activity: { title: 'Recent Activity' },
    access: {
      restrictedTitle: 'Access Restricted',
      restrictedMessage: 'Access restricted',
    },
    sidebar: {
      title: 'CartShift',
      subtitle: 'Studio Portal',
      collapse: 'Collapse',
      close: 'Close',
      signOut: 'Sign Out',
      nav: {
        dashboard: 'Dashboard',
        requests: 'Requests',
        team: 'Team',
        files: 'Files',
        consultations: 'Consultations',
        pricing: 'Pricing',
        settings: 'Settings',
        workboard: 'Workboard',
        clients: 'Clients',
        review: 'Review',
      },
    },
    header: {
      search: 'Search...',
      searchPlaceholder: 'Search global resources...',
      notifications: 'Notifications',
      noNotifications: 'No notifications',
    },
    accountType: {
      client: 'Client',
      agency: 'Agency',
      badge: {
        client: 'Client Account',
        agency: 'Agency Partner',
      },
    },
    accessibility: {
      skipToContent: 'Skip to main content',
      openMenu: 'Open menu',
      closeMenu: 'Close menu',
      helpCenter: 'Help center',
      notifications: 'View notifications',
      userProfile: 'User profile',
      search: 'Search',
      searchPlaceholder: 'Search...',
    },
    auth: {
      login: {
        title: 'Sign In',
        subtitle: 'Welcome back',
        email: 'Email',
        password: 'Password',
        forgotPassword: 'Forgot password?',
        rememberMe: 'Remember me',
        signIn: 'Sign In',
        sso: 'Or continue with',
        google: 'Continue with Google',
        noAccount: "Don't have an account?",
        createOne: 'Create one',
        secure: 'Secure login',
      },
      hidePassword: 'Hide password',
      showPassword: 'Show password',
      errors: {
        userNotFound: 'User not found',
        wrongPassword: 'Wrong password',
        invalidEmail: 'Invalid email',
        weakPassword: 'Password must be at least 6 characters',
        'too-many-requests': 'Too many requests',
        generic: 'An error occurred',
      },
    },
    breadcrumbs: {
      home: 'Home',
      portal: 'Portal',
      organization: 'Organization',
      dashboard: 'Dashboard',
      requests: 'Requests',
      settings: 'Settings',
      team: 'Team',
      files: 'Files',
      pricing: 'Pricing',
      consultations: 'Consultations',
      agency: 'Agency',
      workboard: 'Workboard',
      clients: 'Clients',
      new: 'New',
    },
    emptyState: {
      generic: {
        title: 'No items',
        description: 'Get started by creating your first item',
      },
      requests: {
        title: 'No requests',
        description: 'Create your first request to get started',
      },
      team: {
        title: 'No team members',
        description: 'Invite team members to collaborate',
      },
      files: {
        title: 'No files',
        description: 'Upload your first file',
      },
      pricing: {
        title: 'No pricing',
        description: 'Create your first pricing',
      },
    },
    requests: {
      title: 'Requests',
      newRequest: 'New Request',
      createPricingOffer: 'Create Pricing Offer',
      selected: 'Selected',
      hasPricing: 'Pricing',
      status: {
        new: 'New',
        pending: 'Pending',
        in_progress: 'In Progress',
        in_review: 'In Review',
        completed: 'Completed',
        delivered: 'Delivered',
        closed: 'Closed',
      },
      clientStatus: {
        submitted: 'Submitted',
        in_progress: 'In Progress',
        in_review: 'In Review',
        completed: 'Completed',
      },
      type: {
        design: 'Design',
        development: 'Development',
      },
      priority: {
        normal: 'Normal',
        high: 'High',
        urgent: 'Urgent',
      },
      table: {
        title: 'Title',
        status: 'Status',
        priority: 'Priority',
        created: 'Created',
        id: 'ID',
      },
    },
    agency: {
      errors: {
        sameOrgRequired: 'All selected requests must belong to the same organization.',
      },
    },
    common: {
      error: 'An error occurred',
      filter: 'Filter',
      all: 'All',
      unknown: 'Unknown',
      delete: 'Delete',
      cancel: 'Cancel',
      edit: 'Edit',
      archive: 'Archive',
      recently: 'Recently',
      deleteConfirmTitle: 'Delete Request?',
      deleteConfirm: 'Are you sure?',
      deleteSuccess: 'Request deleted successfully',
      deleteError: 'Failed to delete request',
      retry: 'Retry',
      actions: 'Actions',
      showing: 'Showing {start} to {end} of {total}',
      prev: 'Previous',
      next: 'Next',
    },
  },
};

export function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & { locale?: 'en' | 'he' }
) {
  const { locale = 'en', ...renderOptions } = options || {};

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <NextIntlClientProvider messages={messages} locale={locale}>
        {children}
      </NextIntlClientProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

export * from '@testing-library/react';
export { renderWithProviders as render };
