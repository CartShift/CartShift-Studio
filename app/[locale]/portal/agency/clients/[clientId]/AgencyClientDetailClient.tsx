'use client';

import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Briefcase,
  ExternalLink,
  Globe,
  TrendingUp,
  Users,
  Clock,
  Calendar,
  ShieldCheck,
  Activity,
  FileText,
  Loader2,
  BarChart3,
} from 'lucide-react';
import { PortalCard } from '@/components/portal/ui/PortalCard';
import { PortalBadge } from '@/components/portal/ui/PortalBadge';
import { PortalButton } from '@/components/portal/ui/PortalButton';
import { PortalAvatar } from '@/components/portal/ui/PortalAvatar';
import {
  subscribeToOrganization,
  getOrganizationMembers,
} from '@/lib/services/portal-organizations';
import { subscribeToOrgRequests } from '@/lib/services/portal-requests';
import { subscribeToOrgActivities } from '@/lib/services/portal-activities';
import { Organization, Request, ActivityLog, OrganizationMember } from '@/lib/types/portal';
import { Link, useRouter } from '@/i18n/navigation';
import { useOrg } from '@/lib/context/OrgContext';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { useResolvedClientId } from '@/lib/hooks/useResolvedClientId';
import { useTranslations, useLocale } from 'next-intl';
import { formatDistanceToNow } from 'date-fns';
import { getDateLocale, getDateLocaleString } from '@/lib/locale-config';
import { cn } from '@/lib/utils';
import { ShopifyStoreIntegration } from '@/components/portal/integrations';
import { getPortalPath } from '@/lib/utils/portal-paths';

export default function AgencyClientDetailClient({
  clientId: initialClientId,
}: {
  clientId: string;
}) {
  const t = useTranslations('portal');
  const locale = useLocale();
  const clientId = useResolvedClientId() || initialClientId;
  const { userData, loading: authLoading } = usePortalAuth();
  const { switchOrg } = useOrg();
  const router = useRouter();

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [requests, setRequests] = useState<Request[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    if (!clientId) {
      setError(t('clients.noClientId' as any));
      setLoading(false);
      return undefined;
    }

    if (authLoading) {
      console.log('[AgencyClientDetail] Waiting for auth...');
      return undefined;
    }

    if (!userData) {
      console.log('[AgencyClientDetail] No user data - not logged in?');
      setError('You must be logged in to view this page');
      setLoading(false);
      return undefined;
    }

    console.log('[AgencyClientDetail] User data:', {
      id: userData.id,
      email: userData.email,
      accountType: userData.accountType,
      isAgency: userData.isAgency,
    });

    if (!userData.isAgency) {
      console.warn('[AgencyClientDetail] User is not an agency user!');
      setError('You do not have permission to view this page. Agency access required.');
      setLoading(false);
      return undefined;
    }

    let mounted = true;

    setLoading(true);
    setError(null);

    console.log('[AgencyClientDetail] Loading client:', clientId);

    try {
      // Subscribe to organization data
      const unsubOrg = subscribeToOrganization(clientId, org => {
        if (!mounted) return;
        console.log('[AgencyClientDetail] Organization loaded:', org);
        if (org === null) {
          setError('Client not found or you do not have permission to view it');
        } else {
          setOrganization(org);
        }
        setLoading(false);
      });

      // Subscribe to requests
      const unsubRequests = subscribeToOrgRequests(clientId, reqs => {
        if (!mounted) return;
        console.log('[AgencyClientDetail] Requests loaded:', reqs.length);
        setRequests(reqs);
      });

      // Subscribe to activities
      const unsubActivities = subscribeToOrgActivities(clientId, acts => {
        if (!mounted) return;
        console.log('[AgencyClientDetail] Activities loaded:', acts.length);
        setActivities(acts);
      });

      // Fetch members
      getOrganizationMembers(clientId)
        .then(membersList => {
          if (mounted) {
            console.log('[AgencyClientDetail] Members loaded:', membersList.length);
            setMembers(membersList);
          }
        })
        .catch(err => {
          console.error('[AgencyClientDetail] Error loading members:', err);
          // Don't set error state for members, just log it
        });

      return () => {
        mounted = false;
        unsubOrg();
        unsubRequests();
        unsubActivities();
      };
    } catch (err) {
      console.error('[AgencyClientDetail] Critical error in useEffect:', err);
      if (mounted) {
        setError(err instanceof Error ? err.message : t('clients.unexpectedError' as any));
        setLoading(false);
      }
      return () => {
        mounted = false;
      };
    }
  }, [clientId, authLoading, userData, t]);

  // Prevent hydration mismatch for time-sensitive content
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Calculate stats
  const activeRequests = requests.filter(r =>
    ['NEW', 'QUEUED', 'IN_PROGRESS', 'IN_REVIEW'].includes(r.status)
  ).length;
  const completedRequests = requests.filter(r => ['DELIVERED', 'CLOSED'].includes(r.status)).length;

  const completedRequestsWithDates = requests.filter(
    r => ['DELIVERED', 'CLOSED'].includes(r.status) && r.createdAt && r.updatedAt
  );

  const avgResolution =
    completedRequestsWithDates.length > 0
      ? Math.round(
          completedRequestsWithDates.reduce((sum, r) => {
            if (r.createdAt?.toDate && r.updatedAt?.toDate) {
              const diff = r.updatedAt.toDate().getTime() - r.createdAt.toDate().getTime();
              return sum + diff / (1000 * 60 * 60 * 24); // Convert to days
            }
            return sum;
          }, 0) / completedRequestsWithDates.length
        )
      : 0;

  const recentRequests = requests.slice(0, 5);
  const recentActivities = activities.slice(0, 8);

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-surface-500 font-bold uppercase tracking-widest text-xs">
          {t('agency.clients.detail.loading')}
        </p>
      </div>
    );
  }

  if (error || !organization) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Briefcase size={32} className="text-red-600" />
        </div>
        <h2 className="text-xl font-bold text-surface-900 dark:text-white">
          {error || t('common.error')}
        </h2>
        <p className="text-surface-500 max-w-md mx-auto text-sm">
          {error ||
            'Unable to load client information. The client may not exist or you may not have permission to view it.'}
        </p>
        <Link href={getPortalPath('/agency/clients/')}>
          <PortalButton variant="outline" className="mt-4">
            <ArrowLeft size={16} />
            {t('agency.clients.detail.backToClients')}
          </PortalButton>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col gap-6">
        {/* Back button */}
        <Link
          href={getPortalPath('/agency/clients/')}
          className="inline-flex items-center gap-2 text-surface-500 hover:text-blue-600 transition-colors w-fit group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-bold uppercase tracking-widest">
            {t('agency.clients.detail.backToClients')}
          </span>
        </Link>

        {/* Client header card */}
        <PortalCard className="border-surface-200 dark:border-surface-800 shadow-lg overflow-hidden">
          <div className="p-8">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div className="flex items-start gap-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-xl shadow-blue-500/30 transform hover:scale-105 transition-transform duration-300">
                  <Briefcase size={40} className="text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h1 className="text-2xl font-black tracking-tight text-surface-900 dark:text-white">
                      {organization.name}
                    </h1>
                    <PortalBadge
                      variant={
                        organization.status === 'inactive'
                          ? 'gray'
                          : organization.status === 'suspended'
                            ? 'red'
                            : 'green'
                      }
                      className="text-[9px] font-black uppercase tracking-widest"
                    >
                      {organization.status
                        ? t(`agency.clients.badge.${organization.status}` as any)
                        : t('agency.clients.badge.active')}
                    </PortalBadge>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 mb-4">
                    {organization.website && (
                      <a
                        href={organization.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-bold group"
                      >
                        <Globe size={14} />
                        <span>{organization.website.replace(/^https?:\/\//, '')}</span>
                        <ExternalLink
                          size={12}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        />
                      </a>
                    )}
                    {organization.industry && (
                      <div className="flex items-center gap-2 text-sm text-surface-500 dark:text-surface-400 font-bold">
                        <Briefcase size={14} />
                        <span>{organization.industry}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <ShieldCheck
                        size={14}
                        className={cn(
                          organization.plan === 'enterprise'
                            ? 'text-purple-500'
                            : 'text-emerald-500'
                        )}
                      />
                      <span className="text-sm font-bold text-surface-600 dark:text-surface-400 uppercase tracking-widest">
                        {organization.plan
                          ? t(`agency.clients.plans.${organization.plan}` as any)
                          : t('agency.clients.enterprise')}
                      </span>
                    </div>
                  </div>

                  {organization.createdAt?.toDate && (
                    <div className="flex items-center gap-2 text-xs text-surface-400 font-bold uppercase tracking-widest">
                      <Calendar size={12} />
                      <span>
                        {t('agency.clients.detail.stats.joinedDate')}:{' '}
                        {new Date(organization.createdAt.toDate()).toLocaleDateString(
                          getDateLocaleString(locale),
                          {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          }
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                <PortalButton
                  variant="outline"
                  className="border-blue-200 dark:border-blue-900 hover:bg-blue-50 dark:hover:bg-blue-950"
                  onClick={() => {
                    switchOrg(clientId);
                    router.push(getPortalPath('/dashboard/'));
                  }}
                >
                  <ExternalLink size={16} />
                  {t('agency.clients.detail.viewDashboard')}
                </PortalButton>
                <PortalButton
                  className="shadow-lg shadow-blue-500/20"
                  onClick={() => {
                    switchOrg(clientId);
                    router.push(getPortalPath('/requests/'));
                  }}
                >
                  <FileText size={16} />
                  {t('agency.clients.detail.actions.viewAllRequests')}
                </PortalButton>
              </div>
            </div>
          </div>
        </PortalCard>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <PortalCard className="border-surface-200 dark:border-surface-800 shadow-sm hover:shadow-xl hover:border-blue-200 dark:hover:border-blue-900 transition-all group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-black text-surface-400 uppercase tracking-widest mb-3">
                {t('agency.clients.detail.stats.totalRequests')}
              </p>
              <p className="text-2xl font-black text-surface-900 dark:text-white mb-1">
                {requests.length}
              </p>
              <p className="text-xs text-surface-500 font-bold">
                {t('agency.clients.detail.stats.totalRequests')}
              </p>
            </div>
            <div className="w-14 h-14 bg-blue-50 dark:bg-blue-950/30 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <FileText size={24} className="text-blue-600" />
            </div>
          </div>
        </PortalCard>

        <PortalCard className="border-surface-200 dark:border-surface-800 shadow-sm hover:shadow-xl hover:border-amber-200 dark:hover:border-amber-900 transition-all group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-black text-surface-400 uppercase tracking-widest mb-3">
                {t('agency.clients.detail.stats.activeRequests')}
              </p>
              <p className="text-2xl font-black text-surface-900 dark:text-white mb-1">
                {activeRequests}
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400 font-bold">
                {t('agency.clients.detail.stats.activeRequests')}
              </p>
            </div>
            <div className="w-14 h-14 bg-amber-50 dark:bg-amber-950/30 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <TrendingUp size={24} className="text-amber-600" />
            </div>
          </div>
        </PortalCard>

        <PortalCard className="border-surface-200 dark:border-surface-800 shadow-sm hover:shadow-xl hover:border-emerald-200 dark:hover:border-emerald-900 transition-all group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-black text-surface-400 uppercase tracking-widest mb-3">
                {t('agency.clients.detail.stats.completedRequests')}
              </p>
              <p className="text-2xl font-black text-surface-900 dark:text-white mb-1">
                {completedRequests}
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                {t('agency.clients.detail.stats.completedRequests')}
              </p>
            </div>
            <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <BarChart3 size={24} className="text-emerald-600" />
            </div>
          </div>
        </PortalCard>

        <PortalCard className="border-surface-200 dark:border-surface-800 shadow-sm hover:shadow-xl hover:border-purple-200 dark:hover:border-purple-900 transition-all group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-black text-surface-400 uppercase tracking-widest mb-3">
                {t('agency.clients.detail.stats.avgResolution')}
              </p>
              <p className="text-2xl font-black text-surface-900 dark:text-white mb-1">
                {avgResolution > 0 ? avgResolution : '—'}
              </p>
              <p className="text-xs text-surface-500 font-bold">
                {avgResolution > 0 ? t('agency.clients.detail.stats.days') : '—'}
              </p>
            </div>
            <div className="w-14 h-14 bg-purple-50 dark:bg-purple-950/30 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Clock size={24} className="text-purple-600" />
            </div>
          </div>
        </PortalCard>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Recent Requests & Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Requests */}
          <div>
            <div className="flex items-center justify-between mb-6 px-2">
              <h2 className="text-xl font-black text-surface-900 dark:text-white uppercase tracking-tight">
                {t('agency.clients.detail.sections.requests')}
              </h2>
              <button
                onClick={() => {
                  switchOrg(clientId);
                  router.push(getPortalPath('/requests/'));
                }}
                className="text-xs font-black text-blue-600 hover:text-blue-700 dark:text-blue-400 uppercase tracking-widest flex items-center gap-2 group"
              >
                <span>{t('agency.clients.detail.requests.viewAll')}</span>
                <ExternalLink
                  size={12}
                  className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                />
              </button>
            </div>

            <PortalCard
              noPadding
              className="border-surface-200 dark:border-surface-800 shadow-sm overflow-hidden"
            >
              {recentRequests.length > 0 ? (
                <div className="divide-y divide-surface-50 dark:divide-surface-800">
                  {recentRequests.map(request => (
                    <button
                      key={request.id}
                      onClick={() => {
                        switchOrg(clientId);
                        router.push(getPortalPath(`/requests/${request.id}/`));
                      }}
                      className="w-full text-start block p-6 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition-colors group"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <PortalBadge
                              variant={
                                request.status === 'DELIVERED' || request.status === 'CLOSED'
                                  ? 'green'
                                  : request.status === 'IN_PROGRESS' ||
                                      request.status === 'IN_REVIEW'
                                    ? 'blue'
                                    : request.status === 'QUEUED'
                                      ? 'yellow'
                                      : 'gray'
                              }
                              className="text-[9px] px-2 h-5 font-black uppercase tracking-tighter"
                            >
                              {request.status}
                            </PortalBadge>
                            <span className="text-[10px] font-bold text-surface-400 font-mono">
                              #ID-{request.id.slice(0, 6).toUpperCase()}
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-surface-900 dark:text-white mb-1 group-hover:text-blue-600 transition-colors">
                            {request.title}
                          </h3>
                          <p className="text-xs text-surface-500 line-clamp-1">
                            {request.description}
                          </p>
                        </div>
                        {request.createdAt?.toDate && (
                          <div className="flex items-center gap-1.5 text-surface-400">
                            <Clock size={12} />
                            <span className="text-[10px] font-bold uppercase tracking-tighter">
                              {isMounted
                                ? formatDistanceToNow(request.createdAt.toDate(), {
                                    addSuffix: true,
                                    locale: getDateLocale(locale),
                                  })
                                : '—'}
                            </span>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center">
                  <FileText className="w-12 h-12 text-surface-200 dark:text-surface-800 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-surface-900 dark:text-white mb-1">
                    {t('agency.clients.detail.requests.emptyTitle')}
                  </h3>
                  <p className="text-xs text-surface-500">
                    {t('agency.clients.detail.requests.emptyDesc')}
                  </p>
                </div>
              )}
            </PortalCard>
          </div>

          {/* Recent Activity */}
          <div>
            <div className="flex items-center justify-between mb-6 px-2">
              <h2 className="text-xl font-black text-surface-900 dark:text-white uppercase tracking-tight">
                {t('agency.clients.detail.sections.recentActivity')}
              </h2>
            </div>

            <PortalCard
              noPadding
              className="border-surface-200 dark:border-surface-800 shadow-sm overflow-hidden"
            >
              {recentActivities.length > 0 ? (
                <div className="divide-y divide-surface-50 dark:divide-surface-800">
                  {recentActivities.map((activity, index) => (
                    <div
                      key={index}
                      className="p-5 flex items-start gap-4 group hover:bg-surface-50/30 dark:hover:bg-surface-900/30 transition-colors"
                    >
                      <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950/30 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        <Activity size={18} className="text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-surface-900 dark:text-white mb-1">
                          {t(`activity.actions.${activity.action?.toLowerCase() || ''}` as any) ||
                            (activity.action ? activity.action.replace(/_/g, ' ') : 'Activity')}
                        </p>
                        {activity.details && typeof activity.details.requestTitle === 'string' && (
                          <p className="text-xs text-surface-500 truncate">
                            {activity.details.requestTitle}
                          </p>
                        )}
                      </div>
                      {activity.createdAt?.toDate && (
                        <div className="flex items-center gap-1.5 text-surface-400 flex-shrink-0">
                          <Clock size={12} />
                          <span className="text-[10px] font-bold uppercase tracking-tighter">
                            {isMounted
                              ? formatDistanceToNow(activity.createdAt.toDate(), {
                                  addSuffix: true,
                                  locale: getDateLocale(locale),
                                })
                              : '—'}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center">
                  <Activity className="w-12 h-12 text-surface-200 dark:text-surface-800 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-surface-900 dark:text-white mb-1">
                    {t('agency.clients.detail.activity.emptyTitle')}
                  </h3>
                  <p className="text-xs text-surface-500">
                    {t('agency.clients.detail.activity.emptyDesc')}
                  </p>
                </div>
              )}
            </PortalCard>
          </div>
        </div>

        {/* Right Column - Client Info & Team */}
        <div className="space-y-6">
          {/* Client Information */}
          <div>
            <div className="flex items-center justify-between mb-6 px-2">
              <h2 className="text-xl font-black text-surface-900 dark:text-white uppercase tracking-tight">
                {t('agency.clients.detail.sections.information')}
              </h2>
            </div>

            <PortalCard className="border-surface-200 dark:border-surface-800 shadow-sm">
              <div className="space-y-5">
                {organization.website && (
                  <div>
                    <p className="text-[10px] font-black text-surface-400 uppercase tracking-widest mb-2">
                      {t('agency.clients.detail.info.website')}
                    </p>
                    <a
                      href={organization.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-2 group"
                    >
                      <Globe size={14} />
                      <span className="truncate">
                        {organization.website.replace(/^https?:\/\//, '')}
                      </span>
                      <ExternalLink
                        size={12}
                        className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    </a>
                  </div>
                )}

                {organization.industry && (
                  <div>
                    <p className="text-[10px] font-black text-surface-400 uppercase tracking-widest mb-2">
                      {t('agency.clients.detail.info.industry')}
                    </p>
                    <p className="text-sm font-bold text-surface-900 dark:text-white">
                      {organization.industry}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-[10px] font-black text-surface-400 uppercase tracking-widest mb-2">
                    {t('agency.clients.detail.info.plan')}
                  </p>
                  <div className="flex items-center gap-2">
                    <ShieldCheck
                      size={14}
                      className={cn(
                        organization.plan === 'enterprise' ? 'text-purple-500' : 'text-emerald-500'
                      )}
                    />
                    <span className="text-sm font-bold text-surface-900 dark:text-white uppercase tracking-widest">
                      {organization.plan
                        ? t(`agency.clients.plans.${organization.plan}` as any)
                        : t('agency.clients.enterprise')}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-black text-surface-400 uppercase tracking-widest mb-2">
                    {t('agency.clients.detail.info.status')}
                  </p>
                  <PortalBadge
                    variant={
                      organization.status === 'inactive'
                        ? 'gray'
                        : organization.status === 'suspended'
                          ? 'red'
                          : 'green'
                    }
                    className="text-[9px] font-black uppercase tracking-widest"
                  >
                    {organization.status
                      ? t(`agency.clients.badge.${organization.status}` as any)
                      : t('agency.clients.badge.active')}
                  </PortalBadge>
                </div>
              </div>
            </PortalCard>
          </div>

          {/* Shopify Store Integration */}
          <div>
            <div className="flex items-center justify-between mb-6 px-2">
              <h2 className="text-xl font-black text-surface-900 dark:text-white uppercase tracking-tight">
                Shopify Store
              </h2>
            </div>

            <ShopifyStoreIntegration
              organization={organization}
              isAgencyView={true}
              onUpdate={() => {
                // Refresh organization data
              }}
            />
          </div>

          {/* Team Members */}
          <div>
            <div className="flex items-center justify-between mb-6 px-2">
              <h2 className="text-xl font-black text-surface-900 dark:text-white uppercase tracking-tight">
                {t('agency.clients.detail.sections.team')}
              </h2>
            </div>

            <PortalCard className="border-surface-200 dark:border-surface-800 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <Users size={16} className="text-blue-600" />
                <span className="text-sm font-black text-surface-900 dark:text-white">
                  {members.length} {members.length === 1 ? 'Member' : 'Members'}
                </span>
              </div>

              {members.length > 0 ? (
                <div className="space-y-4">
                  {members.slice(0, 5).map((member, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <PortalAvatar
                        name={member.name || member.email}
                        src={member.photoUrl}
                        size="sm"
                        className="ring-2 ring-white dark:ring-surface-900"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-surface-900 dark:text-white truncate">
                          {member.name || t('portal.common.anonymous' as any)}
                        </p>
                        <p className="text-xs text-surface-500 truncate">{member.email}</p>
                      </div>
                      <PortalBadge
                        variant="blue"
                        className="text-[9px] px-2 h-5 font-black uppercase tracking-tighter flex-shrink-0"
                      >
                        {member.role || 'member'}
                      </PortalBadge>
                    </div>
                  ))}
                  {members.length > 5 && (
                    <button
                      onClick={() => {
                        switchOrg(clientId);
                        router.push(getPortalPath('/team/'));
                      }}
                      className="w-full text-center block text-xs font-black text-blue-600 hover:text-blue-700 dark:text-blue-400 uppercase tracking-widest pt-2"
                    >
                      {t('agency.clients.detail.team.viewAll')}
                    </button>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <Users className="w-10 h-10 text-surface-200 dark:text-surface-800 mx-auto mb-2" />
                  <h3 className="text-xs font-bold text-surface-900 dark:text-white mb-1">
                    {t('agency.clients.detail.team.emptyTitle')}
                  </h3>
                  <p className="text-[10px] text-surface-500">
                    {t('agency.clients.detail.team.emptyDesc')}
                  </p>
                </div>
              )}
            </PortalCard>
          </div>
        </div>
      </div>
    </div>
  );
}
