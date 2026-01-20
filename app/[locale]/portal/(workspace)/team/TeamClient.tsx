'use client';

import { useState } from 'react';
import {
  UserPlus,
  Shield,
  Mail,
  MoreHorizontal,
  Clock,
  Loader2,
  ShieldAlert,
  AlertCircle,
  Copy,
  CheckCircle2,
  UserMinus,
  Settings,
} from 'lucide-react';
import { Card, CardSectionTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Dropdown } from '@/components/ui/Dropdown';
import { SkeletonMemberCard, Skeleton as PortalSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { cancelInvite, removeMember, updateMemberRole } from '@/lib/services/portal-organizations';
import { format } from 'date-fns';
import { getDateLocale } from '@/lib/locale-config';
import { InviteTeamMemberForm } from '@/components/portal/forms/InviteTeamMemberForm';
import { cn } from '@/lib/utils';
import { useTranslations, useLocale } from 'next-intl';
import { useResolvedOrgId } from '@/lib/hooks/useResolvedOrgId';
import { useTeam } from '@/lib/hooks/useTeam';

export default function TeamClient() {
  const orgId = useResolvedOrgId();
  const { members, invites, loading, error } = useTeam();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [cancellingInvite, setCancellingInvite] = useState<string | null>(null);
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);
  const t = useTranslations();
  const locale = useLocale();

  const handleInviteSuccess = async () => {
    setShowInviteModal(false);
  };

  const handleCancelInvite = async (inviteId: string) => {
    if (!confirm(t('portal.team.confirmCancel'))) return;

    setCancellingInvite(inviteId);
    try {
      await cancelInvite(inviteId);
    } catch (error) {
      console.error('Error cancelling invite:', error);
      alert(t('portal.team.errors.cancelInvite'));
    } finally {
      setCancellingInvite(null);
    }
  };

  const handleRemoveMember = async (member: any) => {
    if (!confirm(t('portal.team.removeMemberConfirm', { name: member.name || member.email })))
      return;

    try {
      await removeMember(member.id, orgId as string, member.userId);
    } catch (error) {
      console.error('Error removing member:', error);
      alert(t('portal.common.error'));
    }
  };

  const handleChangeRole = async (memberId: string, newRole: any) => {
    try {
      await updateMemberRole(memberId, newRole);
    } catch (error) {
      console.error('Error changing role:', error);
      alert(t('portal.common.error'));
    }
  };

  const copyInviteLink = (inviteId: string) => {
    const inviteLink = `${window.location.origin}/portal/invite/${inviteId}`;
    navigator.clipboard.writeText(inviteLink);
    setCopiedInviteId(inviteId);
    setTimeout(() => setCopiedInviteId(null), 2000);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse" role="status" aria-live="polite">
        <span className="sr-only"> team members...</span>
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <PortalSkeleton className="h-8 w-48" />
            <PortalSkeleton className="h-4 w-64" />
          </div>
          <PortalSkeleton className="h-10 w-32 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <PortalSkeleton className="h-4 w-32" />
            <div className="space-y-0 border border-surface-200 dark:border-surface-800 rounded-2xl overflow-hidden">
              <SkeletonMemberCard />
              <SkeletonMemberCard />
              <SkeletonMemberCard />
            </div>
          </div>
          <div className="space-y-4">
            <PortalSkeleton className="h-4 w-32" />
            <div className="space-y-6 border border-surface-200 dark:border-surface-800 rounded-2xl p-6">
              <div className="space-y-4">
                <PortalSkeleton className="h-12 w-full" />
                <PortalSkeleton className="h-12 w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500" />
        <h2 className="text-xl font-bold text-surface-900 dark:text-white font-outfit">
          {t('portal.common.error')}
        </h2>
        <p className="text-surface-500 max-w-sm font-medium">
          {error instanceof Error ? error.message : error || 'Unknown error'}
        </p>
        <Button onClick={() => window.location.reload()}>{t('portal.common.retry')}</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-surface-900 dark:text-white font-outfit">
            {t('portal.team.title')}
          </h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1 font-medium">
            {t('portal.team.subtitle')}
          </p>
        </div>
        <Button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-2 shadow-lg shadow-blue-500/20 font-outfit"
        >
          <UserPlus size={18} />
          {t('portal.team.invite')}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card
            noPadding
            className="border-surface-200 dark:border-surface-800 shadow-sm !overflow-visible bg-white dark:bg-surface-950"
            style={{ overflow: 'visible' }}
          >
            <CardSectionTitle className="p-5 pb-0">
              {t('portal.team.activeMembers')}
            </CardSectionTitle>
            <div
              className="divide-y divide-surface-100 dark:divide-surface-800 !overflow-visible"
              style={{ overflow: 'visible' }}
            >
              {members.map(member => (
                <div
                  key={member.id}
                  className="p-5 flex items-center justify-between hover:bg-surface-50/50 dark:hover:bg-surface-900/30 transition-colors group !overflow-visible relative"
                  style={{ overflow: 'visible' }}
                >
                  <div className="flex items-center gap-4">
                    <Avatar
                      src={member.photoUrl}
                      name={member.name}
                      size="md"
                      className="rounded-2xl shadow-sm group-hover:scale-105 transition-transform"
                    />
                    <div>
                      <h4 className="font-bold text-surface-900 dark:text-white leading-none mb-1.5 font-outfit">
                        {member.name || t('portal.team.anonymous')}
                      </h4>
                      <p className="text-xs font-bold text-surface-400">{member.email}</p>
                    </div>
                  </div>
                  <div
                    className="flex items-center gap-8 !overflow-visible"
                    style={{ overflow: 'visible' }}
                  >
                    <div className="hidden lg:flex flex-col items-end">
                      <span className="text-[10px] font-black text-surface-900 dark:text-white uppercase tracking-widest">
                        {member.role}
                      </span>
                      <span className="text-[9px] text-surface-400 font-bold uppercase tracking-tighter">
                        {t('portal.team.workspaceAccess')}
                      </span>
                    </div>
                    <Badge variant={member.role === 'owner' ? 'blue' : 'green'}>
                      {member.role === 'owner'
                        ? t('portal.team.roles.owner')
                        : t('portal.team.roles.member')}
                    </Badge>
                    <div className="!overflow-visible relative" style={{ overflow: 'visible' }}>
                      <Dropdown
                        trigger={
                          <span className="text-surface-400 hover:text-surface-900 dark:hover:text-white p-2 transition-colors rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 inline-flex">
                            <MoreHorizontal size={18} />
                          </span>
                        }
                        items={[
                          {
                            label: t('portal.team.changeRole'),
                            onClick: () => {
                              const newRole = member.role === 'admin' ? 'member' : 'admin';
                              handleChangeRole(member.id, newRole);
                            },
                            icon: <Settings size={16} />,
                            disabled: member.role === 'owner',
                          },
                          {
                            label: t('portal.team.removeMember'),
                            onClick: () => handleRemoveMember(member),
                            icon: <UserMinus size={16} />,
                            variant: 'danger',
                            disabled: member.role === 'owner',
                          },
                        ]}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div>
          <Card className="space-y-6 border-surface-200 dark:border-surface-800 shadow-sm bg-white dark:bg-surface-950">
            <CardSectionTitle>{t('portal.team.pending')}</CardSectionTitle>
            {invites.length > 0 ? (
              invites.map(invite => (
                <div key={invite.id} className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-surface-900 dark:text-white font-outfit">
                        {invite.email}
                      </p>
                      <p className="text-[9px] font-black text-surface-400 flex items-center gap-1.5 uppercase tracking-widest">
                        <Shield size={12} className="text-blue-500" /> {invite.role}
                      </p>
                    </div>
                    <button
                      onClick={() => handleCancelInvite(invite.id)}
                      disabled={cancellingInvite === invite.id}
                      className="text-[9px] font-black text-rose-500 uppercase tracking-widest hover:bg-rose-50 dark:hover:bg-rose-950/50 px-2.5 py-1.5 border border-rose-100 dark:border-rose-900/30 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {cancellingInvite === invite.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        t('portal.team.cancel')
                      )}
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-bold text-surface-400">
                    <span className="flex items-center gap-1.5 uppercase tracking-tighter">
                      <Clock size={12} className="text-surface-300" />
                      {invite.createdAt?.toDate
                        ? `${t('portal.team.sent')} ${format(invite.createdAt.toDate(), 'MMM d', { locale: getDateLocale(locale) })}`
                        : t('portal.common.recently')}
                    </span>
                    <button
                      onClick={() => copyInviteLink(invite.id)}
                      className={cn(
                        'flex items-center gap-1.5 uppercase tracking-widest transition-colors',
                        copiedInviteId === invite.id
                          ? 'text-emerald-500'
                          : 'text-blue-600 dark:text-blue-400 hover:underline'
                      )}
                    >
                      {copiedInviteId === invite.id ? (
                        <>
                          <CheckCircle2 size={12} /> {t('portal.team.copied')}
                        </>
                      ) : (
                        <>
                          <Copy size={12} /> {t('portal.team.copyLink')}
                        </>
                      )}
                    </button>
                  </div>
                  <div className="h-px bg-surface-100 dark:bg-surface-800 last:hidden" />
                </div>
              ))
            ) : (
              <EmptyState
                icon={Mail}
                title={t('portal.team.noInvites')}
                description={t('portal.team.noInvitesSub')}
                variant="default"
                className="py-12"
              />
            )}

            <div className="pt-4 border-t border-surface-100 dark:border-surface-800">
              <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100/50 dark:border-blue-900/20 mb-6">
                <p className="text-[11px] text-blue-600 dark:text-blue-400 leading-relaxed font-bold uppercase tracking-tight">
                  {t('portal.team.guideNote')}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full h-11 text-xs font-bold uppercase tracking-widest border-surface-200 dark:border-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-900 font-outfit"
              >
                {t('portal.team.workspaceGuide')}
              </Button>
            </div>
          </Card>

          <Card className="bg-surface-900 border-none shadow-2xl relative overflow-hidden group">
            <div className="absolute -end-8 -bottom-8 w-32 h-32 bg-blue-600/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-sm text-white font-outfit">
                  {t('portal.team.capacity')}
                </h4>
                <ShieldAlert size={16} className="text-amber-500" />
              </div>
              <div className="w-full bg-surface-800 h-2.5 rounded-full overflow-hidden mb-4 p-0.5">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-1000"
                  style={{ width: `${(members.length / 10) * 100}%` }}
                />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-surface-400 font-black uppercase tracking-widest">
                  <span className="text-white">{members.length}</span> / 10{' '}
                  {t('portal.team.activeSeats')}
                </p>
                <button className="text-[10px] text-blue-400 font-black uppercase tracking-widest hover:text-blue-300 transition-colors">
                  {t('portal.team.upgrade')}
                </button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {showInviteModal && orgId && typeof orgId === 'string' && (
        <InviteTeamMemberForm
          orgId={orgId}
          onSuccess={handleInviteSuccess}
          onCancel={() => setShowInviteModal(false)}
        />
      )}
    </div>
  );
}
