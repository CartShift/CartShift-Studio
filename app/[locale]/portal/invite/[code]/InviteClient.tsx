'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { getFirestoreDb } from '@/lib/firebase';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { PortalCard } from '@/components/portal/ui/PortalCard';
import { PortalButton } from '@/components/portal/ui/PortalButton';
import { PortalBadge } from '@/components/portal/ui/PortalBadge';
import { Invite } from '@/lib/types/portal';
import { CheckCircle2, XCircle, Clock, Loader2, Mail, Shield, User } from 'lucide-react';
import { format } from 'date-fns';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useRouter } from '@/i18n/navigation';
import { useOrg } from '@/lib/context/OrgContext';
import { getPortalPath } from '@/lib/utils/portal-paths';

const INVITES_COLLECTION = 'portal_invites';
const MEMBERS_COLLECTION = 'portal_members';
const USERS_COLLECTION = 'portal_users';

export default function InviteClient() {
  const { code } = useParams();
  const router = useRouter();
  const { user, userData, loading: authLoading, isAuthenticated } = usePortalAuth();
  const { switchOrg } = useOrg();
  const [invite, setInvite] = useState<Invite | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const t = useTranslations();

  useEffect(() => {
    async function fetchInvite() {
      // Only run on client side
      if (typeof window === 'undefined') return;

      if (!code || typeof code !== 'string') {
        setError(t('portal.auth.errors.invalidCode'));
        setLoading(false);
        return;
      }

      try {
        const db = getFirestoreDb();
        const inviteRef = doc(db, INVITES_COLLECTION, code);
        const inviteSnap = await getDoc(inviteRef);

        if (!inviteSnap.exists()) {
          setError(t('portal.auth.errors.inviteNotFound'));
          setLoading(false);
          return;
        }

        const inviteData = {
          id: inviteSnap.id,
          ...inviteSnap.data(),
        } as Invite;

        setInvite(inviteData);

        if (inviteData.status !== 'pending') {
          setError(
            inviteData.status === 'accepted'
              ? t('portal.auth.errors.alreadyAccepted')
              : t('portal.auth.errors.expired')
          );
        } else if (inviteData.expiresAt?.toDate && inviteData.expiresAt.toDate() < new Date()) {
          // Update expired status if user is authenticated, otherwise just show error
          if (isAuthenticated) {
            try {
              await updateDoc(inviteRef, { status: 'expired' });
            } catch (err) {
              console.error('Error updating invite status:', err);
            }
          }
          setError(t('portal.auth.errors.expired'));
        }
      } catch (error: unknown) {
        console.error('Error fetching invite:', error);
        setError(t('portal.auth.errors.genericInvite'));
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading && isAuthenticated) {
      fetchInvite();
    } else if (!authLoading && !isAuthenticated) {
      setLoading(false);
    }
  }, [code, authLoading, t, isAuthenticated]);

  const handleAcceptInvite = async () => {
    if (!invite || !user || !userData) return;

    setAccepting(true);
    setError(null);

    try {
      const db = getFirestoreDb();
      const inviteRef = doc(db, INVITES_COLLECTION, invite.id);
      const inviteSnap = await getDoc(inviteRef);

      if (!inviteSnap.exists()) {
        throw new Error(t('portal.auth.errors.inviteNotFound'));
      }

      const currentInvite = inviteSnap.data() as Invite;

      if (currentInvite.status !== 'pending') {
        throw new Error(t('portal.auth.errors.alreadyAccepted'));
      }

      if (currentInvite.expiresAt?.toDate && currentInvite.expiresAt.toDate() < new Date()) {
        await updateDoc(inviteRef, { status: 'expired' });
        throw new Error(t('portal.auth.errors.expired'));
      }

      if (
        !currentInvite.email ||
        !user.email ||
        currentInvite.email.toLowerCase() !== user.email.toLowerCase()
      ) {
        throw new Error(t('portal.auth.errors.mismatch'));
      }

      const memberData = {
        orgId: invite.orgId,
        userId: user.uid,
        email: invite.email,
        role: invite.role,
        name: userData.name || null,
        invitedBy: invite.invitedBy,
        inviteId: invite.id,
        joinedAt: serverTimestamp(),
      };

      await setDoc(doc(db, MEMBERS_COLLECTION, `${invite.orgId}_${user.uid}`), memberData);

      const userRef = doc(db, USERS_COLLECTION, user.uid);
      await updateDoc(userRef, {
        email: invite.email,
        name: userData.name || null,
        organizations: arrayUnion(invite.orgId),
        updatedAt: serverTimestamp(),
      });

      await updateDoc(inviteRef, {
        status: 'accepted',
        acceptedAt: serverTimestamp(),
      });

      setSuccess(true);
      setTimeout(() => {
        if (invite.orgId) {
          switchOrg(invite.orgId);
        }
        router.push(getPortalPath('/dashboard/'));
      }, 2000);
    } catch (error: unknown) {
      console.error('Error accepting invite:', error);
      setError(error instanceof Error ? error.message : t('portal.auth.errors.generic'));
    } finally {
      setAccepting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-surface-50 dark:bg-surface-950">
        <PortalCard className="max-w-md w-full">
          <div className="text-center space-y-4">
            <Mail className="w-12 h-12 text-primary mx-auto" />
            <h1 className="text-2xl font-bold">{t('portal.invite.title')}</h1>
            <p className="text-muted-foreground">{t('portal.invite.guestIntro')}</p>
            <div className="space-y-2">
              <Link
                href={getPortalPath(`/signup?redirect=/invite/${code}/`)}
                className="block"
              >
                <PortalButton className="w-full shadow-lg shadow-blue-500/20">
                  {t('portal.invite.createAccount')}
                </PortalButton>
              </Link>
              <Link
                href={getPortalPath(`/login?redirect=/invite/${code}/`)}
                className="block"
              >
                <PortalButton variant="outline" className="w-full">
                  {t('portal.invite.signIn')}
                </PortalButton>
              </Link>
            </div>
          </div>
        </PortalCard>
      </div>
    );
  }

  if (error && !invite) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <PortalCard className="max-w-md w-full">
          <div className="text-center space-y-4">
            <XCircle className="w-12 h-12 text-destructive mx-auto" />
            <h1 className="text-2xl font-bold">{t('portal.invite.error')}</h1>
            <p className="text-muted-foreground">{error}</p>
            <Link href={getPortalPath('/login/')}>
              <PortalButton>{t('portal.invite.signIn')}</PortalButton>
            </Link>
          </div>
        </PortalCard>
      </div>
    );
  }

  if (!invite) {
    return null;
  }

  const isExpired = invite.expiresAt?.toDate ? invite.expiresAt.toDate() < new Date() : false;
  const isAccepted = invite.status === 'accepted';
  const emailMatch = user?.email?.toLowerCase() === invite.email?.toLowerCase();

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-surface-50 dark:bg-surface-950">
      <PortalCard className="max-w-md w-full">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            {success ? (
              <>
                <CheckCircle2 className="w-12 h-12 text-success mx-auto" />
                <h1 className="text-2xl font-bold">{t('portal.invite.success')}</h1>
                <p className="text-muted-foreground">{t('portal.invite.redirecting')}</p>
              </>
            ) : isAccepted ? (
              <>
                <CheckCircle2 className="w-12 h-12 text-success mx-auto" />
                <h1 className="text-2xl font-bold">{t('portal.invite.alreadyAccepted')}</h1>
                <p className="text-muted-foreground">{t('portal.invite.alreadyAcceptedDesc')}</p>
              </>
            ) : isExpired ? (
              <>
                <XCircle className="w-12 h-12 text-destructive mx-auto" />
                <h1 className="text-2xl font-bold">{t('portal.invite.expired')}</h1>
                <p className="text-muted-foreground">{t('portal.invite.expiredDesc')}</p>
              </>
            ) : (
              <>
                <Mail className="w-12 h-12 text-primary mx-auto" />
                <h1 className="text-2xl font-bold">{t('portal.invite.title')}</h1>
                <p className="text-muted-foreground">{t('portal.invite.subtitle')}</p>
              </>
            )}
          </div>

          {!success && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{t('portal.invite.invitedEmail')}</span>
                  <span className="font-medium">{invite.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{t('portal.invite.role')}</span>
                  <PortalBadge variant="gray">{invite.role}</PortalBadge>
                </div>
                {invite.invitedByName && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{t('portal.invite.invitedBy')}</span>
                    <span className="font-medium">{invite.invitedByName}</span>
                  </div>
                )}
                {invite.expiresAt?.toDate && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{t('portal.invite.expires')}</span>
                    <span className="font-medium">{format(invite.expiresAt.toDate(), 'PPp')}</span>
                  </div>
                )}
              </div>

              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {!isAuthenticated ? (
                <div className="space-y-3">
                  <p className="text-sm text-surface-600 dark:text-surface-400 text-center font-medium">
                    {t('portal.invite.guestIntro')}
                  </p>
                  <div className="space-y-2">
                    <Link
                      href={getPortalPath(`/signup?email=${encodeURIComponent(invite.email)}&redirect=/invite/${invite.id}/`)}
                      className="block"
                    >
                      <PortalButton className="w-full shadow-lg shadow-blue-500/20">
                        {t('portal.invite.createAccount')}
                      </PortalButton>
                    </Link>
                    <Link
                      href={getPortalPath(`/login?redirect=/invite/${invite.id}/`)}
                      className="block"
                    >
                      <PortalButton variant="outline" className="w-full">
                        {t('portal.invite.signIn')}
                      </PortalButton>
                    </Link>
                  </div>
                  <p className="text-xs text-surface-500 dark:text-surface-400 text-center">
                    {t('portal.invite.alreadyHasAccount')}
                  </p>
                </div>
              ) : !emailMatch ? (
                <div className="p-3 bg-warning/10 border border-warning/20 rounded-md">
                  <p className="text-sm text-warning">
                    {t('portal.invite.emailMismatch', {
                      email: invite.email,
                      userEmail: user?.email || '',
                    })}
                  </p>
                </div>
              ) : !isExpired && !isAccepted ? (
                <PortalButton onClick={handleAcceptInvite} disabled={accepting} className="w-full">
                  {accepting ? (
                    <>
                      <Loader2 className="w-4 h-4 me-2 animate-spin" />
                      {t('portal.invite.accepting')}
                    </>
                  ) : (
                    t('portal.invite.accept')
                  )}
                </PortalButton>
              ) : null}
            </div>
          )}
        </div>
      </PortalCard>
    </div>
  );
}
