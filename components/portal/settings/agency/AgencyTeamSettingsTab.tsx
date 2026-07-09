'use client';

import { Edit2, Loader2, User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Card, CardSectionTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { IconButton } from '@/components/ui/IconButton';
import {
  PortalTable,
  PortalTableScroll,
  PortalTableElement,
  PortalTableHeader,
  PortalTableBody,
  PortalTableRow,
  PortalTableHead,
  PortalTableCell,
} from '@/components/portal/ui/PortalTable';
import { cn } from '@/lib/utils';
import { Invite, PortalUser } from '@/lib/types/portal';

interface AgencyTeamSettingsTabProps {
  team: PortalUser[];
  invites: Invite[];
  loading: boolean;
  cancellingInviteId: string | null;
  isCancellingInvite: boolean;
  onInvite: () => void;
  onCancelInvite: (inviteId: string) => void;
}

function memberStatusClass(status: PortalUser['status']) {
  if (status === 'inactive') {
    return 'bg-surface-50 dark:bg-surface-900/20 text-surface-600 dark:text-surface-400 border-surface-100 dark:border-surface-800';
  }
  if (status === 'suspended') {
    return 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/30';
  }
  return 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30';
}

function formatJoinedDate(createdAt: PortalUser['createdAt']) {
  return createdAt?.toDate ? createdAt.toDate().toLocaleDateString() : 'N/A';
}

export function AgencyTeamSettingsTab({
  team,
  invites,
  loading,
  cancellingInviteId,
  isCancellingInvite,
  onInvite,
  onCancelInvite,
}: AgencyTeamSettingsTabProps) {
  const t = useTranslations('portal');

  return (
    <Card className="border-surface-200 dark:border-surface-800 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-surface-900 dark:text-white font-outfit">
            {t('agency.settings.team.title')}
          </h3>
          <p className="text-sm text-surface-500 dark:text-surface-400">
            {t('agency.settings.team.subtitle')}
          </p>
        </div>
        <Button size="sm" variant="outline" className="h-10 font-outfit" onClick={onInvite}>
          {t('agency.settings.team.invite')}
        </Button>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center">
          <Loader2 className="w-8 h-8 text-primary-600 dark:text-primary-400 animate-spin" />
        </div>
      ) : team.length > 0 ? (
        <>
          <div className="md:hidden space-y-4">
            {team.map(member => (
              <div
                key={member.id}
                className="p-4 rounded-xl bg-surface-50/50 dark:bg-surface-900/30 border border-surface-200 dark:border-surface-800"
              >
                <div className="flex items-center gap-3 mb-3">
                  <Avatar
                    name={member.name || t('consultations.userFallback')}
                    size="md"
                    className="ring-2 ring-white dark:ring-surface-900 shadow-sm"
                  />
                  <div>
                    <p className="font-bold text-surface-900 dark:text-white font-outfit">
                      {member.name || t('common.unnamedUser')}
                    </p>
                    <p className="text-xs font-bold text-surface-400 uppercase tracking-tight">
                      {member.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-3 border-t border-surface-100 dark:border-surface-800 pt-3">
                  <span
                    className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border',
                      memberStatusClass(member.status)
                    )}
                  >
                    {t(`agency.settings.team.${member.status || 'active'}` as never)}
                  </span>
                  <span className="text-[10px] font-bold text-surface-500 uppercase tracking-tighter">
                    {formatJoinedDate(member.createdAt)}
                  </span>
                </div>

                <div className="flex justify-end">
                  <button className="text-xs font-bold text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors uppercase tracking-widest">
                    {t('agency.settings.team.edit')}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden md:block">
            <PortalTable className="border-0 shadow-none bg-transparent rounded-none overflow-hidden">
              <PortalTableScroll>
                <PortalTableElement>
                  <PortalTableHeader className="bg-surface-50 dark:bg-surface-900/50">
                    <PortalTableRow className="cursor-default">
                      <PortalTableHead headStyle="label">
                        {t('agency.settings.team.table.member')}
                      </PortalTableHead>
                      <PortalTableHead headStyle="label">
                        {t('agency.settings.team.table.status')}
                      </PortalTableHead>
                      <PortalTableHead headStyle="label">
                        {t('agency.settings.team.table.joined')}
                      </PortalTableHead>
                      <PortalTableHead headStyle="label" cellAlign="end">
                        {t('agency.settings.team.table.action')}
                      </PortalTableHead>
                    </PortalTableRow>
                  </PortalTableHeader>
                  <PortalTableBody>
                    {team.map(member => (
                      <PortalTableRow key={member.id} hover>
                        <PortalTableCell>
                          <div className="flex items-center gap-3">
                            <Avatar
                              name={member.name || t('consultations.userFallback')}
                              size="sm"
                              className="ring-2 ring-white dark:ring-surface-900 shadow-sm"
                            />
                            <div>
                              <p className="text-sm font-bold text-surface-900 dark:text-white font-outfit">
                                {member.name || t('common.unnamedUser')}
                              </p>
                              <p className="text-[10px] font-bold text-surface-400 uppercase tracking-tight">
                                {member.email}
                              </p>
                            </div>
                          </div>
                        </PortalTableCell>
                        <PortalTableCell>
                          <span
                            className={cn(
                              'inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border',
                              memberStatusClass(member.status)
                            )}
                          >
                            {t(`agency.settings.team.${member.status || 'active'}` as never)}
                          </span>
                        </PortalTableCell>
                        <PortalTableCell>
                          <span className="text-[10px] font-bold text-surface-500 uppercase tracking-tighter">
                            {formatJoinedDate(member.createdAt)}
                          </span>
                        </PortalTableCell>
                        <PortalTableCell cellAlign="end">
                          <IconButton
                            icon={Edit2}
                            label={t('agency.settings.team.edit')}
                            variant="ghost"
                            size="sm"
                            iconSize={16}
                            className="min-w-[44px] min-h-[44px] hover:text-primary-600 dark:hover:text-primary-400"
                          />
                        </PortalTableCell>
                      </PortalTableRow>
                    ))}
                  </PortalTableBody>
                </PortalTableElement>
              </PortalTableScroll>
            </PortalTable>
          </div>
        </>
      ) : (
        <div className="py-12 text-center opacity-30">
          <User className="w-12 h-12 text-surface-300 dark:text-surface-700 mx-auto mb-3" />
          <p className="text-[10px] font-black uppercase tracking-widest">
            {t('agency.settings.team.noMembers')}
          </p>
        </div>
      )}

      <div className="mt-10">
        <CardSectionTitle
          as="h4"
          icon={User}
          iconClassName="text-primary-500"
          className="mb-4 px-1"
        >
          {t('agency.settings.team.pendingInvites')}
        </CardSectionTitle>

        {invites.length > 0 ? (
          <div className="space-y-3">
            {invites.map(invite => (
              <div
                key={invite.id}
                className="p-4 rounded-xl bg-surface-50 dark:bg-surface-900 border border-surface-100 dark:border-surface-800 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-bold text-surface-900 dark:text-white font-outfit">
                    {invite.email}
                  </p>
                  <p className="text-[10px] font-bold text-surface-400 uppercase tracking-tight">
                    {invite.role}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-bold text-surface-400 uppercase tracking-tighter">
                    {invite.createdAt?.toDate
                      ? invite.createdAt.toDate().toLocaleDateString()
                      : t('common.sentRecently')}
                  </span>
                  <button
                    onClick={() => onCancelInvite(invite.id)}
                    disabled={cancellingInviteId === invite.id || isCancellingInvite}
                    className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:text-rose-600 disabled:opacity-50"
                  >
                    {cancellingInviteId === invite.id
                      ? '...'
                      : t('agency.settings.team.cancelInvite')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center bg-surface-50/50 dark:bg-surface-900/30 rounded-xl border border-dashed border-surface-200 dark:border-surface-800">
            <p className="portal-label-sm text-[10px]">No pending invitations</p>
          </div>
        )}
      </div>
    </Card>
  );
}
