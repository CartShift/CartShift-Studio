'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { useTranslations } from 'next-intl';
import {
  Calendar,
  Check,
  Loader2,
  ExternalLink,
  X,
  RefreshCw,
  AlertCircle,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import {
  CalendarInfo,
  listCalendars,
  updateCalendarSettings,
} from '@/lib/services/portal-google-calendar';

export interface CalendarConnection {
  connected: boolean;
  email?: string;
  lastSynced?: Date;
  syncedCalendars?: string[];
  selectedCalendarId?: string;
  error?: string;
}

interface GoogleCalendarIntegrationProps {
  connection: CalendarConnection | null;
  onConnect: () => Promise<void>;
  onDisconnect: () => Promise<void>;
  onSync?: () => Promise<void>;
}

export default function GoogleCalendarIntegration({
  connection,
  onConnect,
  onDisconnect,
  onSync,
}: GoogleCalendarIntegrationProps) {
  const t = useTranslations('portal');
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Calendar selection state
  const [calendars, setCalendars] = useState<CalendarInfo[]>([]);
  const [loadingCalendars, setLoadingCalendars] = useState(false);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string | null>(null);
  const [updatingSettings, setUpdatingSettings] = useState(false);

  const isConnected = connection?.connected;

  useEffect(() => {
    if (isConnected) {
      fetchCalendars();
      if (connection?.selectedCalendarId) {
        setSelectedCalendarId(connection.selectedCalendarId);
      }
    } else {
      setCalendars([]);
      setSelectedCalendarId(null);
    }
  }, [isConnected, connection?.selectedCalendarId]);

  const fetchCalendars = async () => {
    setLoadingCalendars(true);
    try {
      const list = await listCalendars();
      setCalendars(list);
    } catch (error) {
      console.error('Failed to fetch calendars:', error);
    } finally {
      setLoadingCalendars(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      await onConnect();
      // After connect, fetch calendars
      await fetchCalendars();
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm(t('googleCalendar.disconnectConfirm'))) {
      return;
    }
    setDisconnecting(true);
    try {
      await onDisconnect();
    } finally {
      setDisconnecting(false);
    }
  };

  const handleSync = async () => {
    if (!onSync) return;
    setSyncing(true);
    try {
      await onSync();
    } finally {
      setSyncing(false);
    }
  };

  const handleCalendarChange = async (calendarId: string) => {
    setSelectedCalendarId(calendarId);
    setUpdatingSettings(true);
    try {
      await updateCalendarSettings(calendarId);
    } catch (error) {
      console.error('Failed to update calendar settings:', error);
    } finally {
      setUpdatingSettings(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative p-6 rounded-2xl border-2 transition-all',
        isConnected
          ? 'bg-gradient-to-br from-green-50 to-emerald-50/50 dark:from-green-900/20 dark:to-emerald-900/10 border-green-200 dark:border-green-800/50'
          : 'bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-800 hover:border-blue-300 dark:hover:border-blue-700'
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div
          className={cn(
            'w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg',
            isConnected
              ? 'bg-gradient-to-br from-green-500 to-emerald-600'
              : 'bg-gradient-to-br from-blue-500 to-indigo-600'
          )}
        >
          <Calendar className="w-7 h-7 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold text-surface-900 dark:text-white font-outfit">
              {t('googleCalendar.title')}
            </h3>
            {isConnected && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
                <Check size={10} />
                {t('googleCalendar.connected')}
              </span>
            )}
          </div>
          <p className="text-sm text-surface-500 dark:text-surface-400 leading-relaxed">
            {t('googleCalendar.description') ||
              'Sync consultations with your Google Calendar and get automatic Meet links.'}
          </p>
        </div>
      </div>

      {/* Connection Details */}
      <AnimatePresence mode="wait">
        {isConnected && connection ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6"
          >
            <div className="p-4 rounded-xl bg-white/80 dark:bg-surface-800/50 border border-green-100 dark:border-green-900/30 space-y-3">
              {connection.email && (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-surface-500 uppercase tracking-wider">
                    {t('googleCalendar.account')}
                  </span>
                  <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
                    {connection.email}
                  </span>
                </div>
              )}

              {/* Calendar Selection */}
              <div>
                <span className="text-xs font-bold text-surface-500 uppercase tracking-wider block mb-2">
                  {t('googleCalendar.targetCalendar')}
                </span>
                {loadingCalendars ? (
                  <div className="flex items-center gap-2 text-sm text-surface-500">
                    <Loader2 size={14} className="animate-spin" />
                    Loading calendars...
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      value={selectedCalendarId || 'primary'}
                      onChange={e => handleCalendarChange(e.target.value)}
                      disabled={updatingSettings}
                      className={cn(
                        'w-full appearance-none bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg py-2 ps-3 pe-8 text-sm text-surface-700 dark:text-surface-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20',
                        updatingSettings && 'opacity-50 cursor-wait'
                      )}
                    >
                      <option value="primary">Primary Calendar</option>
                      {calendars
                        .filter(cal => cal.id !== 'primary' && cal.id !== connection.email) // Avoid duplicates if primary is same as email
                        .map(cal => (
                          <option key={cal.id} value={cal.id}>
                            {cal.summary} {cal.primary ? '(Primary)' : ''}
                          </option>
                        ))}
                    </select>
                    <ChevronDown
                      size={14}
                      className="absolute end-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none"
                    />
                  </div>
                )}
                <p className="text-[10px] text-surface-400 mt-1">
                  {t('googleCalendar.targetCalendarDescription')}
                </p>
              </div>
              {connection.lastSynced && (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-surface-500 uppercase tracking-wider">
                    {t('googleCalendar.lastSync')}
                  </span>
                  <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
                    {connection.lastSynced.toLocaleString()}
                  </span>
                </div>
              )}
              {connection.syncedCalendars && connection.syncedCalendars.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-surface-500 uppercase tracking-wider">
                    {t('googleCalendar.calendars')}
                  </span>
                  <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
                    {connection.syncedCalendars.length} synced
                  </span>
                </div>
              )}
            </div>

            {connection.error && (
              <div className="mt-3 p-3 rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/50 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs font-medium text-rose-700 dark:text-rose-400">
                  {connection.error}
                </p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
            <div className="p-4 rounded-xl bg-surface-50/80 dark:bg-surface-800/30 border border-dashed border-surface-200 dark:border-surface-700">
              <ul className="space-y-2 text-sm text-surface-600 dark:text-surface-400">
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-blue-500" />
                  {t('googleCalendar.feature1')}
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-blue-500" />
                  {t('googleCalendar.feature2')}
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-blue-500" />
                  {t('googleCalendar.feature3')}
                </li>
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {isConnected ? (
          <>
            {onSync && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSync}
                disabled={syncing}
                className="gap-2 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
              >
                <RefreshCw size={16} className={cn(syncing && 'animate-spin')} />
                {syncing ? t('googleCalendar.syncing') : t('googleCalendar.syncNow')}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="gap-2 text-surface-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
            >
              {disconnecting ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />}
              {t('googleCalendar.disconnect')}
            </Button>
          </>
        ) : (
          <Button
            variant="primary"
            size="sm"
            onClick={handleConnect}
            disabled={connecting}
            className="gap-2 shadow-lg shadow-blue-500/20"
          >
            {connecting ? <Loader2 size={16} className="animate-spin" /> : <Calendar size={16} />}
            {connecting ? t('googleCalendar.connecting') : t('googleCalendar.connect')}
            {!connecting && <ExternalLink size={12} className="opacity-60" />}
          </Button>
        )}
      </div>
    </motion.div>
  );
}
