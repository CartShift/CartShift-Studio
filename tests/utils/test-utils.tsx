import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

const messages = {
  portal: {
    loading: {
      workspace: 'Accessing Secure Workspace',
      init: 'Initializing Studio Environment',
      auth: {
        login: 'Loading sign in...',
        signup: 'Loading signup...',
        invite: 'Loading invitation...',
      },
    },
    dashboard: {
      title: 'Dashboard',
      subtitle: 'Overview of your active projects and recent activity.',
      loading: 'Crunching your data...',
      greeting: {
        morning: 'Good morning, {name}!',
        afternoon: 'Good afternoon, {name}!',
        evening: 'Good evening, {name}!',
        default: 'Hello, {name}!',
      },
      actions: {
        newRequest: 'New Request',
        viewAll: 'View all',
        createFirst: 'Create First Request',
      },
      error: {
        title: 'Dashboard Error',
        retry: 'Retry',
      },
      pinned: {
        title: 'Pinned Requests',
        pin: 'Pin request',
        unpin: 'Unpin request',
      },
      serviceStatus: {
        title: 'Service Status',
        design: 'Design Pipeline',
        active: 'Active',
        dev: 'Dev Capacity',
        peak: 'Peak Load',
        etaLabel: 'ETA for new requests',
        days: 'days',
        avgResponse: 'Avg. Response',
        responseTime: '< 2 hours',
      },
    },
    activity: {
      title: 'Recent Activity',
      noActivity: 'No recent activity',
    },
    access: {
      restrictedTitle: 'Access Restricted',
      restrictedMessage:
        "Your account current profile doesn't have the necessary permissions to access this specific organization workspace.",
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
        pricing: 'Pricing Offers',
        settings: 'Settings',
        workboard: 'Workboard',
        clients: 'Clients',
        review: 'Leave a Review',
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
        title: 'Welcome back',
        subtitle: 'Sign in to your CartShift portal',
        email: 'Email',
        password: 'Password',
        forgotPassword: 'Forgot password?',
        rememberMe: 'Keep me signed in',
        signIn: 'Sign in',
        sso: 'Or continue with',
        google: 'Google SSO',
        noAccount: "Don't have an account yet?",
        createOne: 'Create one here',
        secure: 'Secure Enterprise Access',
      },
      hidePassword: 'Hide password',
      showPassword: 'Show password',
      errors: {
        userNotFound: 'No account found with this email address.',
        wrongPassword: 'Invalid email or password.',
        invalidEmail: 'Please enter a valid email address.',
        weakPassword: 'Password is too weak. Please choose a stronger password.',
        tooManyRequests: 'Too many failed attempts. Please try again later.',
        generic: 'An unexpected error occurred. Please try again.',
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
    },
    requests: {
      title: 'Project Requests',
      newRequest: 'New Request',
      createPricingOffer: 'Create Pricing Offer',
      selected: 'requests selected',
      hasPricing: 'Priced',
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
    common: {
      loading: 'Loading...',
      error: 'Something went wrong',
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
      deleteSuccess: 'Deleted successfully',
      deleteError: 'Failed to delete',
      retry: 'Retry',
      actions: 'Actions',
      showing: 'Showing {count} of {total} results',
      prev: 'Prev',
      next: 'Next',
    },
    settings: {
      tabs: {
        general: 'General',
        profile: 'My Profile',
        notifications: 'Notifications',
        security: 'Security',
        billing: 'Billing',
        branding: 'Branding',
      },
      general: {
        integrations: {
          shopify: {
            title: 'Shopify Store Access',
            description: 'Enable fast, secure collaborator access to your Shopify store.',
            storeUrl: 'Store URL',
            collaboratorCode: 'Collaborator Code',
            status: {
              pending: 'Pending',
              requested: 'Access Requested',
              connected: 'Connected',
              revoked: 'Revoked',
            },
            statusMessages: {
              pending: 'Waiting for your agency to request access to your store.',
              requested: 'Access has been requested. Please approve in your Shopify admin.',
              connected: 'Your agency has full collaborator access to your store.',
            },
            features: {
              feature1: 'Enable fast theme customizations and updates',
              feature2: 'Allow your agency to manage apps and integrations',
              feature3: 'Secure collaborator access with no staff seat used',
            },
            form: {
              storeUrl: 'Your Shopify Store URL',
              storeUrlHint: "Enter your store's .myshopify.com URL (e.g., yourstore.myshopify.com)",
              collaboratorCode: 'Collaborator Request Code',
              collaboratorCodeHint:
                'Found in Shopify Admin > Settings > Users > Security. Leave empty if not enabled.',
              optional: 'optional',
              infoTitle: 'Where to find the collaborator code?',
              infoDesc:
                "In your Shopify admin, go to Settings > Users and permissions > Security. If enabled, you'll see a 4-digit code.",
              save: 'Save Store Details',
              saving: 'Saving...',
              cancel: 'Cancel',
            },
            actions: {
              connect: 'Connect Store',
              edit: 'Edit Store Details',
            },
            agency: {
              notConnected: 'Shopify Store Not Connected',
              notConnectedDesc: "The client hasn't connected their Shopify store yet.",
              requestAccess: 'Request Collaborator Access',
              markRequested: 'Mark as Requested',
              markConnected: 'Mark as Connected',
              openPartnerDashboard: 'Open Partner Dashboard',
              openAdmin: 'Open Store Admin',
            },
          },
        },
      },
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
