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
  Trash2,
  Settings,
  Mail,
} from 'lucide-react';
import { Card, CardSectionTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { EditClientModal } from '@/components/portal/modals/EditClientModal';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { InviteClientForm } from '@/components/portal/forms/InviteClientForm';
import {
  subscribeToOrganization,
  getOrganizationMembers,
  removeMember,
  getInvitesByOrg,
  cancelInvite,
} from '@/lib/services/portal-organizations';
import { subscribeToOrgRequests } from '@/lib/services/portal-requests';
import { subscribeToOrgActivities } from '@/lib/services/portal-activities';
import {
  Organization,
  Request,
  ActivityLog,
  OrganizationMember,
  PortalUser,
  Invite,
} from '@/lib/types/portal';
import { getPortalUser } from '@/lib/services/portal-users';
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
import { toast } from 'sonner';

export default function AgencyClientDetailClient({
  clientId: initialClientId,
}: {
  clientId: string;
}) {
  const t = useTranslations('portal');
  const locale = useLocale();
  const clientId = useResolvedClientId() || initialClientId;
  const { userData, loading: auth } = usePortalAuth();
  const { switchOrg } = useOrg();
  const router = useRouter();

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [requests, setRequests] = useState<Request[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [pendingInvites, setPendingInvites] = useState<Invite[]>([]);
  const [responsibleAgent, setResponsibleAgent] = useState<PortalUser | null>(null);
  const [loading, set] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<OrganizationMember | null>(null);
  const [isRemoveMemberOpen, setIsRemoveMemberOpen] = useState(false);
  const [isRemovingMember, setIsRemovingMember] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [resendingInvite, setResendingInvite] = useState<string | null>(null);

  useEffect(() => {
    if (!clientId) {
      setError(t('clients.noClientId' as any));
      set(false);
      return undefined;
    }

    if (auth) {
      // Waiting for auth...
      return undefined;
    }

    if (!userData) {
      // No user data
      setError('You must be logged in to view this page');
      set(false);
      return undefined;
    }

    // Debug logging removed

    if (!userData.isAgency) {
      // User is not an agency user
      setError('You do not have permission to view this page. Agency access required.');
      set(false);
      return undefined;
    }

    let mounted = true;

    set(true);
    setError(null);

    // client loaded

    try {
      // Subscribe to organization data
      const unsubOrg = subscribeToOrganization(clientId, org => {
        if (!mounted) return;
        // Organization loaded
        if (org === null) {
          setError('Client not found or you do not have permission to view it');
        } else {
          setOrganization(org);

          // Fetch responsible agent if exists
          if (org.responsibleAgencyUserId) {
            getPortalUser(org.responsibleAgencyUserId)
              .then(user => {
                if (mounted && user) setResponsibleAgent(user);
              })
              .catch(err => console.error('Failed to fetch responsible agent:', err));
          } else {
            setResponsibleAgent(null);
          }
        }
        set(false);
      });

      // Subscribe to requests
      const unsubRequests = subscribeToOrgRequests(clientId, reqs => {
        if (!mounted) return;
        // Requests loaded
        setRequests(reqs);
      });

      // Subscribe to activities
      const unsubActivities = subscribeToOrgActivities(clientId, acts => {
        if (!mounted) return;
        // Activities loaded
        setActivities(acts);
      });

      // Fetch members
      getOrganizationMembers(clientId)
        .then(membersList => {
          if (mounted) {
            // Members loaded
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
        set(false);
      }
      return () => {
        mounted = false;
      };
    }
  }, [clientId, auth, userData, t]);

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

  const recentActivities = activities.slice(0, 8);
  const recentRequests = requests.slice(0, 5);

  const fetchMembers = async () => {
    if (!clientId) return;
    try {
      const membersList = await getOrganizationMembers(clientId);
      setMembers(membersList);

      // Also fetch pending invites
      const invites = await getInvitesByOrg(clientId);
      setPendingInvites(invites.filter(inv => inv.isClientInvite && inv.status === 'pending'));
    } catch (err) {
      console.error('[AgencyClientDetail] Error loading members:', err);
    }
  };

  const handleRemoveMember = (member: OrganizationMember) => {
    setMemberToRemove(member);
    setIsRemoveMemberOpen(true);
  };

  const confirmRemoveMember = async () => {
    if (!memberToRemove || !organization) return;

    setIsRemovingMember(true);
    try {
      await removeMember(memberToRemove.id, organization.id, memberToRemove.userId);
      await fetchMembers();
      setIsRemoveMemberOpen(false);
      setMemberToRemove(null);
    } catch (err) {
      console.error('Failed to remove member:', err);
      // Ideally show a toast here, but for now we'll just log it
      // setError('Failed to remove member'); // Don't block the whole page
    } finally {
      setIsRemovingMember(false);
    }
  };

  const handleResendInvite = async (inviteId: string, _email: string) => {
    setResendingInvite(inviteId);
    try {
      // Cancel the old invite
      await cancelInvite(inviteId);
      // Trigger the invite modal to open with pre-filled email
      setIsInviteModalOpen(true);
      toast.success('Previous invitation cancelled. Please send a new one.');
      await fetchMembers(); // Refresh the list
    } catch (err) {
      console.error('Failed to resend invite:', err);
      toast.error('Failed to resend invitation');
    } finally {
      setResendingInvite(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-surface-500 font-bold uppercase tracking-widest text-xs">
          {t('agency.clients.detail.loading' as any)}
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
          {error || t('common.error' as any)}
        </h2>
        <p className="text-surface-500 max-w-md mx-auto text-sm">
          {error ||
            'Unable to load client information. The client may not exist or you may not have permission to view it.'}
        </p>
        <Link href={getPortalPath('/agency/clients/')}>
          <Button variant="outline" className="mt-4">
            <ArrowLeft size={16} />
            {t('agency.clients.detail.backToClients' as any)}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <ConfirmationModal
        isOpen={isRemoveMemberOpen}
        onClose={() => setIsRemoveMemberOpen(false)}
        onConfirm={confirmRemoveMember}
        title={t('agency.clients.detail.team.removeMemberTitle' as any) || 'Remove Team Member'}
        description={
          t('agency.clients.detail.team.removeMemberDesc' as any) ||
          `Are you sure you want to remove ${memberToRemove?.name || memberToRemove?.email} from this client? They will lose access to the client portal.`
        }
        confirmText={t('common.removeLabel' as any) || 'Remove'}
        variant="danger"
        isLoading={isRemovingMember}
      />

      {/* Header */}
      <div className="flex flex-col gap-6">
        {/* Back button */}
        <Link
          href={getPortalPath('/agency/clients/')}
          className="inline-flex items-center gap-2 text-surface-500 hover:text-blue-600 transition-colors w-fit group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-bold uppercase tracking-widest">
            {t('agency.clients.detail.backToClients' as any)}
          </span>
        </Link>

        {/* Client header card */}
        <Card className="border-surface-200 dark:border-surface-800 shadow-lg overflow-hidden">
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
                    <Badge
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
                        : t('agency.clients.badge.active' as any)}
                    </Badge>
                    {members.length === 0 && (
                      <Badge
                        variant="yellow"
                        className="text-[9px] font-black uppercase tracking-widest"
                      >
                        {t('agency.clients.badge.pendingInvitation' as any) || 'Pending Invitation'}
                      </Badge>
                    )}
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
                          : t('agency.clients.enterprise' as any)}
                      </span>
                    </div>
                  </div>

                  {organization.createdAt?.toDate && (
                    <div className="flex items-center gap-2 text-xs text-surface-400 font-bold uppercase tracking-widest">
                      <Calendar size={12} />
                      <span>
                        {t('agency.clients.detail.stats.joinedDate' as any)}:{' '}
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
                <Button
                  variant="outline"
                  className="border-emerald-200 dark:border-emerald-900 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                  onClick={() => setIsInviteModalOpen(true)}
                >
                  <Mail size={16} />
                  {t('agency.clients.detail.actions.sendInvitation' as any) || 'Send Invitation'}
                </Button>
                <Button
                  variant="outline"
                  className="border-blue-200 dark:border-blue-900 hover:bg-blue-50 dark:hover:bg-blue-950"
                  onClick={() => {
                    switchOrg(clientId);
                    router.push(getPortalPath('/dashboard/'));
                  }}
                >
                  <ExternalLink size={16} />
                  {t('agency.clients.detail.viewDashboard' as any)}
                </Button>
                <Button
                  className="shadow-lg shadow-blue-500/20"
                  onClick={() => {
                    switchOrg(clientId);
                    router.push(getPortalPath('/requests/'));
                  }}
                >
                  <FileText size={16} />
                  {t('agency.clients.detail.actions.viewAllRequests' as any)}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-surface-200 dark:border-surface-800 shadow-sm hover:shadow-xl hover:border-blue-200 dark:hover:border-blue-900 transition-all group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-black text-surface-400 uppercase tracking-widest mb-3">
                {t('agency.clients.detail.stats.totalRequests' as any)}
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
        </Card>

        <Card className="border-surface-200 dark:border-surface-800 shadow-sm hover:shadow-xl hover:border-amber-200 dark:hover:border-amber-900 transition-all group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-black text-surface-400 uppercase tracking-widest mb-3">
                {t('agency.clients.detail.stats.activeRequests' as any)}
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
        </Card>

        <Card className="border-surface-200 dark:border-surface-800 shadow-sm hover:shadow-xl hover:border-emerald-200 dark:hover:border-emerald-900 transition-all group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-black text-surface-400 uppercase tracking-widest mb-3">
                {t('agency.clients.detail.stats.completedRequests' as any)}
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
        </Card>

        <Card className="border-surface-200 dark:border-surface-800 shadow-sm hover:shadow-xl hover:border-purple-200 dark:hover:border-purple-900 transition-all group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-black text-surface-400 uppercase tracking-widest mb-3">
                {t('agency.clients.detail.stats.avgResolution' as any)}
              </p>
              <p className="text-2xl font-black text-surface-900 dark:text-white mb-1">
                {avgResolution > 0 ? avgResolution : '—'}
              </p>
              <p className="text-xs text-surface-500 font-bold">
                {avgResolution > 0 ? t('agency.clients.detail.stats.days' as any) : '—'}
              </p>
            </div>
            <div className="w-14 h-14 bg-purple-50 dark:bg-purple-950/30 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Clock size={24} className="text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Recent Requests & Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Requests */}
          <div>
            <div className="flex items-center justify-between mb-6 px-2">
              <h2 className="text-xl font-black text-surface-900 dark:text-white uppercase tracking-tight">
                {t('agency.clients.detail.sections.requests' as any)}
              </h2>
              <button
                onClick={() => {
                  switchOrg(clientId);
                  router.push(getPortalPath('/requests/'));
                }}
                className="text-xs font-black text-blue-600 hover:text-blue-700 dark:text-blue-400 uppercase tracking-widest flex items-center gap-2 group"
              >
                <span>{t('agency.clients.detail.requests.viewAll' as any)}</span>
                <ExternalLink
                  size={12}
                  className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                />
              </button>
            </div>

            <Card
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
                            <Badge
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
                            </Badge>
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
                    {t('agency.clients.detail.requests.emptyTitle' as any)}
                  </h3>
                  <p className="text-xs text-surface-500">
                    {t('agency.clients.detail.requests.emptyDesc' as any)}
                  </p>
                </div>
              )}
            </Card>
          </div>

          {/* Recent Activity */}
          <Card
            noPadding
            className="border-surface-200 dark:border-surface-800 shadow-sm overflow-hidden"
          >
            <CardSectionTitle
              as="h2"
              className="mb-0 px-6 pt-6 pb-4 border-b border-surface-100 dark:border-surface-800 uppercase tracking-tight"
            >
              {t('agency.clients.detail.sections.recentActivity' as any)}
            </CardSectionTitle>
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
                  {t('agency.clients.detail.activity.emptyTitle' as any)}
                </h3>
                <p className="text-xs text-surface-500">
                  {t('agency.clients.detail.activity.emptyDesc' as any)}
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column - Client Info & Team */}
        <div className="space-y-6">
          {/* Client Information */}
          <div>
            <div className="flex items-center justify-between mb-6 px-2">
              <h2 className="text-xl font-black text-surface-900 dark:text-white uppercase tracking-tight">
                {t('agency.clients.detail.sections.information' as any)}
              </h2>
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="text-xs font-black text-blue-600 hover:text-blue-700 dark:text-blue-400 uppercase tracking-widest flex items-center gap-2 group"
              >
                <span>{t('agency.clients.detail.editClient' as any) || 'Edit'}</span>
                <Settings
                  size={14}
                  className="group-hover:rotate-90 transition-transform duration-500"
                />
              </button>
            </div>

            <Card className="border-surface-200 dark:border-surface-800 shadow-sm">
              <div className="space-y-5">
                {organization.website && (
                  <div>
                    <p className="text-[10px] font-black text-surface-400 uppercase tracking-widest mb-2">
                      {t('agency.clients.detail.info.website' as any)}
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
                      {t('agency.clients.detail.info.industry' as any)}
                    </p>
                    <p className="text-sm font-bold text-surface-900 dark:text-white">
                      {organization.industry}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-[10px] font-black text-surface-400 uppercase tracking-widest mb-2">
                    {t('agency.clients.detail.info.plan' as any)}
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
                    {t('agency.clients.detail.info.status' as any)}
                  </p>
                  <Badge
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
                      : t('agency.clients.badge.active' as any)}
                  </Badge>
                </div>

                <div>
                  <p className="text-[10px] font-black text-surface-400 uppercase tracking-widest mb-2">
                    {t('agency.clients.detail.info.responsibleAgent' as any)}
                  </p>
                  {responsibleAgent ? (
                    <div className="flex items-center gap-2">
                      <Avatar
                        name={responsibleAgent.name || responsibleAgent.email}
                        src={responsibleAgent.photoUrl}
                        size="xs"
                        className="w-5 h-5"
                      />
                      <span className="text-sm font-bold text-surface-900 dark:text-white">
                        {responsibleAgent.name || responsibleAgent.email}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm font-bold text-surface-400 italic">
                      {t('agency.clients.detail.info.unassigned' as any)}
                    </span>
                  )}
                </div>
              </div>
            </Card>
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
                {t('agency.clients.detail.sections.team' as any)}
              </h2>
            </div>

            <Card className="border-surface-200 dark:border-surface-800 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <Users size={16} className="text-blue-600" />
                <span className="text-sm font-black text-surface-900 dark:text-white">
                  {members.length + pendingInvites.length}{' '}
                  {members.length + pendingInvites.length === 1 ? 'Member' : 'Members'}
                  {pendingInvites.length > 0 && (
                    <span className="text-amber-600 dark:text-amber-400 ms-1">
                      ({pendingInvites.length} pending)
                    </span>
                  )}
                </span>
              </div>

              {members.length > 0 || pendingInvites.length > 0 ? (
                <div className="space-y-4">
                  {/* Active Members */}
                  {members.slice(0, 5).map((member, index) => (
                    <div key={index} className="flex items-center gap-3 group">
                      <Avatar
                        name={member.name || member.email}
                        src={member.photoUrl}
                        size="sm"
                        className="ring-2 ring-white dark:ring-surface-900"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-surface-900 dark:text-white truncate">
                          {member.name || t('common.anonymous' as any)}
                        </p>
                        <p className="text-xs text-surface-500 truncate">{member.email}</p>
                      </div>
                      <Badge
                        variant="blue"
                        className="text-[9px] px-2 h-5 font-black uppercase tracking-tighter flex-shrink-0"
                      >
                        {member.role || 'member'}
                      </Badge>
                      <button
                        onClick={() => handleRemoveMember(member)}
                        className="p-1.5 text-surface-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title={t('common.removeLabel' as any) || 'Remove'}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}

                  {/* Pending Invites */}
                  {pendingInvites.map(invite => (
                    <div
                      key={invite.id}
                      className="flex items-center gap-3 group border-s-2 border-amber-400 ps-2"
                    >
                      <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center flex-shrink-0">
                        <Mail size={14} className="text-amber-600 dark:text-amber-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-surface-900 dark:text-white truncate">
                          {invite.email}
                        </p>
                        <p className="text-xs text-amber-600 dark:text-amber-400">
                          Invitation pending
                        </p>
                      </div>
                      <Badge
                        variant="yellow"
                        className="text-[9px] px-2 h-5 font-black uppercase tracking-tighter flex-shrink-0"
                      >
                        Invited
                      </Badge>
                      <button
                        onClick={() => handleResendInvite(invite.id, invite.email)}
                        disabled={resendingInvite === invite.id}
                        className="p-1.5 text-surface-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:opacity-50"
                        title="Resend invitation"
                      >
                        {resendingInvite === invite.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Mail size={14} />
                        )}
                      </button>
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
                      {t('agency.clients.detail.team.viewAll' as any)}
                    </button>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <Users className="w-10 h-10 text-surface-200 dark:text-surface-800 mx-auto mb-2" />
                  <h3 className="text-xs font-bold text-surface-900 dark:text-white mb-1">
                    {t('agency.clients.detail.team.emptyTitle' as any)}
                  </h3>
                  <p className="text-[10px] text-surface-500">
                    {t('agency.clients.detail.team.emptyDesc' as any)}
                  </p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      <EditClientModal
        organization={organization}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={() => {
          // You might trigger a refresh if needed, but subscription handles live updates usually for document changes.
          // However, we might want to ensure local state is consistent if we relied on something not live.
          // Luckily, we use real-time listeners for 'organization' in this component.
        }}
      />

      {isInviteModalOpen && (
        <InviteClientForm
          orgId={clientId}
          onSuccess={() => {
            setIsInviteModalOpen(false);
            toast.success(
              t('portal.clientInvite.success' as any) || 'Invitation sent successfully'
            );
          }}
          onCancel={() => setIsInviteModalOpen(false)}
        />
      )}
    </div>
  );
}
