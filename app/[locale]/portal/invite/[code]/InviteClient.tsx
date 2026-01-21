'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getInvite, acceptInvite, cancelInvite } from '@/lib/services/portal-organizations';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Invite } from '@/lib/types/portal';
import { CheckCircle2, XCircle, Clock, Loader2, Mail, Shield, User } from 'lucide-react';
import { format } from 'date-fns';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useRouter } from '@/i18n/navigation';
import { useOrg } from '@/lib/context/OrgContext';
import { getPortalPath } from '@/lib/utils/portal-paths';

export default function InviteClient() {
  const { code } = useParams();
  const router = useRouter();
  const { user, userData, loading: auth, isAuthenticated } = usePortalAuth();
  const { switchOrg } = useOrg();
  const [invite, setInvite] = useState<Invite | null>(null);
  const [loading, set] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const t = useTranslations('portal');

  useEffect(() => {
    async function fetchInvite() {
      // Only run on client side
      if (typeof window === 'undefined') return;

      if (!code || typeof code !== 'string') {
        setError(t('auth.errors.invalidCode'));
        set(false);
        return;
      }

      try {
        const inviteData = await getInvite(code);

        if (!inviteData) {
          setError(t('auth.errors.inviteNotFound'));
          set(false);
          return;
        }

        setInvite(inviteData);

        if (inviteData.status !== 'pending') {
          setError(
            inviteData.status === 'accepted'
              ? t('auth.errors.alreadyAccepted')
              : t('auth.errors.expired')
          );
        } else if (inviteData.expiresAt?.toDate && inviteData.expiresAt.toDate() < new Date()) {
          // Update expired status if user is authenticated, otherwise just show error
          if (isAuthenticated) {
            try {
              await cancelInvite(code);
            } catch (err) {
              console.error('Error updating invite status:', err);
            }
          }
          setError(t('auth.errors.expired'));
        }
      } catch (error: unknown) {
        console.error('Error fetching invite:', error);
        setError(t('auth.errors.genericInvite'));
      } finally {
        set(false);
      }
    }

    if (!auth && isAuthenticated) {
      fetchInvite();
    } else if (!auth && !isAuthenticated) {
      set(false);
    }
  }, [code, auth, t, isAuthenticated]);

  const handleAcceptInvite = async () => {
    if (!invite || !user || !userData) return;

    setAccepting(true);
    setError(null);

    try {
      await acceptInvite(invite.id, user.uid, userData.name || undefined);

      setSuccess(true);
      setTimeout(() => {
        if (invite.orgId) {
          switchOrg(invite.orgId);
        }
        router.push(getPortalPath('/dashboard/'));
      }, 2000);
    } catch (error: unknown) {
      console.error('Error accepting invite:', error);
      setError(error instanceof Error ? error.message : t('auth.errors.generic'));
    } finally {
      setAccepting(false);
    }
  };

  if (auth || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-surface-50 dark:bg-surface-950">
        <Card className="max-w-md w-full">
          <div className="text-center space-y-4">
            <Mail className="w-12 h-12 text-primary mx-auto" />
            <h1 className="text-2xl font-bold">{t('invite.title')}</h1>
            <p className="text-muted-foreground">{t('invite.guestIntro')}</p>
            <div className="space-y-2">
              <Link href={getPortalPath(`/signup?redirect=/invite/${code}/`)} className="block">
                <Button className="w-full shadow-lg shadow-blue-500/20">
                  {t('invite.createAccount')}
                </Button>
              </Link>
              <Link href={getPortalPath(`/login?redirect=/invite/${code}/`)} className="block">
                <Button variant="outline" className="w-full">
                  {t('invite.signIn')}
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (error && !invite) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <div className="text-center space-y-4">
            <XCircle className="w-12 h-12 text-destructive mx-auto" />
            <h1 className="text-2xl font-bold">{t('invite.error')}</h1>
            <p className="text-muted-foreground">{error}</p>
            <Link href={getPortalPath('/login/')}>
              <Button>{t('invite.signIn')}</Button>
            </Link>
          </div>
        </Card>
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
      <Card className="max-w-md w-full">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            {success ? (
              <>
                <CheckCircle2 className="w-12 h-12 text-success mx-auto" />
                <h1 className="text-2xl font-bold">{t('invite.success')}</h1>
                <p className="text-muted-foreground">{t('invite.redirecting')}</p>
              </>
            ) : isAccepted ? (
              <>
                <CheckCircle2 className="w-12 h-12 text-success mx-auto" />
                <h1 className="text-2xl font-bold">{t('invite.alreadyAccepted')}</h1>
                <p className="text-muted-foreground">{t('invite.alreadyAcceptedDesc')}</p>
              </>
            ) : isExpired ? (
              <>
                <XCircle className="w-12 h-12 text-destructive mx-auto" />
                <h1 className="text-2xl font-bold">{t('invite.expired')}</h1>
                <p className="text-muted-foreground">{t('invite.expiredDesc')}</p>
              </>
            ) : (
              <>
                <Mail className="w-12 h-12 text-primary mx-auto" />
                <h1 className="text-2xl font-bold">{t('invite.title')}</h1>
                <p className="text-muted-foreground">{t('invite.subtitle')}</p>
              </>
            )}
          </div>

          {!success && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{t('invite.invitedEmail')}</span>
                  <span className="font-medium">{invite.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{t('invite.role')}</span>
                  <Badge variant="gray">{invite.role}</Badge>
                </div>
                {invite.invitedByName && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{t('invite.invitedBy')}</span>
                    <span className="font-medium">{invite.invitedByName}</span>
                  </div>
                )}
                {invite.expiresAt?.toDate && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{t('invite.expires')}</span>
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
                    {t('invite.guestIntro')}
                  </p>
                  <div className="space-y-2">
                    <Link
                      href={getPortalPath(
                        `/signup?email=${encodeURIComponent(invite.email)}&redirect=/invite/${invite.id}/`
                      )}
                      className="block"
                    >
                      <Button className="w-full shadow-lg shadow-blue-500/20">
                        {t('invite.createAccount')}
                      </Button>
                    </Link>
                    <Link
                      href={getPortalPath(`/login?redirect=/invite/${invite.id}/`)}
                      className="block"
                    >
                      <Button variant="outline" className="w-full">
                        {t('invite.signIn')}
                      </Button>
                    </Link>
                  </div>
                  <p className="text-xs text-surface-500 dark:text-surface-400 text-center">
                    {t('invite.alreadyHasAccount')}
                  </p>
                </div>
              ) : !emailMatch ? (
                <div className="p-3 bg-warning/10 border border-warning/20 rounded-md">
                  <p className="text-sm text-warning">
                    {t('invite.emailMismatch', {
                      email: invite.email,
                      userEmail: user?.email || '',
                    })}
                  </p>
                </div>
              ) : !isExpired && !isAccepted ? (
                <Button onClick={handleAcceptInvite} disabled={accepting} className="w-full">
                  {accepting ? (
                    <>
                      <Loader2 className="w-4 h-4 me-2 animate-spin" />
                      {t('invite.accepting')}
                    </>
                  ) : (
                    t('invite.accept')
                  )}
                </Button>
              ) : null}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
