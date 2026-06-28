'use client';

import { Dispatch, SetStateAction } from 'react';
import { CreditCard, MessageSquare, Zap } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Card } from '@/components/ui/Card';
import {
  GoogleCalendarIntegration,
  IntegrationCard,
  CalendarConnection,
} from '@/components/portal/integrations';
import {
  initiateGoogleOAuth,
  getCalendarConnection,
  disconnectCalendar,
  isGoogleCalendarConfigured,
} from '@/lib/services/portal-google-calendar';

interface AgencyIntegrationsSettingsTabProps {
  calendarConnection: CalendarConnection | null;
  setCalendarConnection: Dispatch<SetStateAction<CalendarConnection | null>>;
}

export function AgencyIntegrationsSettingsTab({
  calendarConnection,
  setCalendarConnection,
}: AgencyIntegrationsSettingsTabProps) {
  const t = useTranslations('portal');

  return (
    <div className="space-y-6">
      <Card className="border-surface-200 dark:border-surface-800 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 border border-purple-100 dark:border-purple-900/30">
            <Zap size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-surface-900 dark:text-white font-outfit">
              {t('agency.settings.tabs.integrations')}
            </h3>
            <p className="portal-label-sm text-[10px] mt-0.5">
              {t('agency.settings.integrations.subtitle')}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <GoogleCalendarIntegration
            connection={calendarConnection}
            onConnect={async () => {
              if (!isGoogleCalendarConfigured()) {
                toast.error(
                  'Google Calendar integration requires configuration. Please add NEXT_PUBLIC_GOOGLE_CLIENT_ID to your environment variables.'
                );
                return;
              }
              try {
                initiateGoogleOAuth();
              } catch (err) {
                toast.error(err instanceof Error ? err.message : t('common.error'));
              }
            }}
            onDisconnect={async () => {
              await disconnectCalendar();
              setCalendarConnection(null);
            }}
            onSync={async () => {
              setCalendarConnection(await getCalendarConnection());
            }}
          />

          <IntegrationCard
            title={t('agency.settings.integrations.slack.title')}
            description={
              t('agency.settings.integrations.slack.description') ||
              'Get notifications in your Slack workspace'
            }
            icon={MessageSquare}
            iconGradient="bg-accent-600 dark:bg-accent-500"
            comingSoon
          />

          <IntegrationCard
            title={t('agency.settings.integrations.stripe.title')}
            description={t('agency.settings.integrations.stripe.description')}
            icon={CreditCard}
            iconGradient="bg-primary-600 dark:bg-primary-500"
            comingSoon
          />
        </div>
      </Card>
    </div>
  );
}
