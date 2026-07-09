'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { useTranslations } from 'next-intl';
import {
  ShoppingBag,
  Check,
  Loader2,
  ExternalLink,
  X,
  AlertCircle,
  Copy,
  Info,
  ArrowRight,
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { updateOrganization } from '@/lib/services/portal-organizations';
import { Organization } from '@/lib/types/portal';
import { toast } from 'sonner';
import { getShopifyAccessStatusKey } from '@/lib/i18n/portal-translation-keys';

interface ShopifyStoreIntegrationProps {
  organization: Organization;
  onUpdate?: () => void;
  isAgencyView?: boolean;
}

const ACCESS_STATUS_CONFIG = {
  pending: {
    icon: Clock,
    color: 'text-amber-600',
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    border: 'border-amber-200 dark:border-amber-800',
  },
  requested: {
    icon: Loader2,
    color: 'text-primary-600',
    bg: 'bg-primary-100 dark:bg-primary-900/30',
    border: 'border-primary-200 dark:border-primary-800',
  },
  connected: {
    icon: CheckCircle2,
    color: 'text-green-600',
    bg: 'bg-green-100 dark:bg-green-900/30',
    border: 'border-green-200 dark:border-green-800',
  },
  revoked: {
    icon: XCircle,
    color: 'text-red-600',
    bg: 'bg-red-100 dark:bg-red-900/30',
    border: 'border-red-200 dark:border-red-800',
  },
};

export default function ShopifyStoreIntegration({
  organization,
  onUpdate,
  isAgencyView = false,
}: ShopifyStoreIntegrationProps) {
  const t = useTranslations(
    isAgencyView
      ? 'portal.agency.settings.integrations.shopify'
      : 'portal.settings.general.integrations.shopify'
  );
  const toastT = useTranslations('portal.settings.general.integrations.shopify.toast');
  const [editing, setEditing] = useState(false);
  const [saving, set] = useState(false);
  const [shopifyDomain, setShopifyDomain] = useState(organization.shopifyDomain || '');
  const [collaboratorCode, setCollaboratorCode] = useState(
    organization.shopifyCollaboratorCode || ''
  );
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const hasConnection = !!organization.shopifyDomain;
  const accessStatus = organization.shopifyAccessStatus || 'pending';
  const StatusIcon = ACCESS_STATUS_CONFIG[accessStatus]?.icon || Clock;

  useEffect(() => {
    setShopifyDomain(organization.shopifyDomain || '');
    setCollaboratorCode(organization.shopifyCollaboratorCode || '');
  }, [organization]);

  const validateDomain = (domain: string): boolean => {
    // Allow formats: store.myshopify.com, mystore.myshopify.com, etc.
    const pattern = /^[a-zA-Z0-9][-a-zA-Z0-9]*\.myshopify\.com$/;
    return pattern.test(domain.toLowerCase().trim());
  };

  const validateCode = (code: string): boolean => {
    // Collaborator code is 4 digits
    return /^\d{4}$/.test(code);
  };

  const handleSave = async () => {
    // Validate
    const cleanDomain = shopifyDomain
      .toLowerCase()
      .trim()
      .replace(/^https?:\/\//, '')
      .replace(/\/$/, '');

    if (cleanDomain && !validateDomain(cleanDomain)) {
      toast.error(t('errors.invalidDomain'));
      return;
    }

    if (collaboratorCode && !validateCode(collaboratorCode)) {
      toast.error(t('errors.invalidCode'));
      return;
    }

    set(true);
    try {
      await updateOrganization(organization.id, {
        shopifyDomain: cleanDomain || undefined,
        shopifyCollaboratorCode: collaboratorCode || undefined,
        shopifyAccessStatus: cleanDomain ? 'pending' : undefined,
      } as Partial<Organization>);

      toast.success(toastT('settingsSaved'));
      setEditing(false);
      onUpdate?.();
    } catch (err) {
      console.error('Failed to save Shopify settings:', err);
      toast.error(t('errors.saveFailed'));
    } finally {
      set(false);
    }
  };

  const handleCopyCode = () => {
    if (organization.shopifyCollaboratorCode) {
      navigator.clipboard.writeText(organization.shopifyCollaboratorCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const generatePartnerLink = () => {
    if (!organization.shopifyDomain) return null;
    // This is a deep link format to the Partner Dashboard store request
    return `https://partners.shopify.com/stores/add?store_url=${encodeURIComponent(organization.shopifyDomain)}`;
  };

  const handleMarkAsRequested = async () => {
    set(true);
    try {
      await updateOrganization(organization.id, {
        shopifyAccessStatus: 'requested',
        shopifyAccessRequestedAt: new Date() as unknown as import('firebase/firestore').Timestamp,
      } as Partial<Organization>);
      toast.success(toastT('accessRequestSubmitted'));
      onUpdate?.();
    } catch (err) {
      console.error('Failed to update status:', err);
      toast.error(toastT('accessRequestFailed'));
    } finally {
      set(false);
    }
  };

  const handleMarkAsConnected = async () => {
    set(true);
    try {
      await updateOrganization(organization.id, {
        shopifyAccessStatus: 'connected',
        shopifyConnectedAt: new Date() as unknown as import('firebase/firestore').Timestamp,
      } as Partial<Organization>);
      toast.success(toastT('storeConnected'));
      onUpdate?.();
    } catch (err) {
      console.error('Failed to update status:', err);
      toast.error(toastT('connectFailed'));
    } finally {
      set(false);
    }
  };

  // ============================================
  // AGENCY VIEW
  // ============================================
  if (isAgencyView) {
    if (!hasConnection) {
      return (
        <div className="p-6 rounded-2xl border-2 border-dashed border-surface-200 dark:border-surface-700 bg-surface-50/50 dark:bg-surface-900/30">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
              <ShoppingBag size={24} className="text-surface-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-surface-600 dark:text-surface-400">
                {t('agency.notConnected')}
              </h3>
              <p className="text-xs text-surface-400">{t('agency.notConnectedDesc')}</p>
            </div>
          </div>
        </div>
      );
    }

    const partnerLink = generatePartnerLink();
    const statusConfig = ACCESS_STATUS_CONFIG[accessStatus];

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'relative p-6 rounded-2xl border-2 transition-all',
          statusConfig.border,
          statusConfig.bg
        )}
      >
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-accent-600 dark:bg-accent-500 flex items-center justify-center shadow-lg">
            <ShoppingBag className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-surface-900 dark:text-white font-outfit">
                {t('title')}
              </h3>
              <span
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider',
                  statusConfig.bg,
                  statusConfig.color,
                  statusConfig.border,
                  'border'
                )}
              >
                <StatusIcon
                  size={10}
                  className={accessStatus === 'requested' ? 'animate-spin' : ''}
                />
                {t(getShopifyAccessStatusKey(accessStatus))}
              </span>
            </div>
            <p className="text-sm text-surface-500 dark:text-surface-400 leading-relaxed">
              {organization.shopifyDomain}
            </p>
          </div>
        </div>

        {/* Store Details */}
        <div className="p-4 rounded-xl bg-white/80 dark:bg-surface-800/50 border border-surface-100 dark:border-surface-700 space-y-3 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-surface-500 uppercase tracking-wider">
              {t('storeUrl')}
            </span>
            <a
              href={`https://${organization.shopifyDomain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
            >
              {organization.shopifyDomain}
              <ExternalLink size={12} />
            </a>
          </div>
          {organization.shopifyCollaboratorCode && (
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-surface-500 uppercase tracking-wider">
                {t('collaboratorCode')}
              </span>
              <div className="flex items-center gap-2">
                <code className="px-2 py-1 bg-surface-100 dark:bg-surface-900 rounded text-sm font-mono font-bold text-surface-700 dark:text-surface-300">
                  {organization.shopifyCollaboratorCode}
                </code>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="portal-focus-ring min-w-[44px] min-h-[44px] flex items-center justify-center p-1.5 rounded-md hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
                >
                  {copied ? (
                    <Check size={14} className="text-green-500" />
                  ) : (
                    <Copy size={14} className="text-surface-400" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Actions based on status */}
        <div className="flex flex-wrap items-center gap-3">
          {accessStatus === 'pending' && partnerLink && (
            <>
              <a href={partnerLink} target="_blank" rel="noopener noreferrer">
                <Button
                  variant="primary"
                  size="sm"
                  className="gap-2 shadow-lg shadow-accent-600/20"
                >
                  <ShoppingBag size={16} />
                  {t('agency.requestAccess')}
                  <ExternalLink size={12} className="opacity-60" />
                </Button>
              </a>
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAsRequested}
                disabled={saving}
                className="gap-2"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                {t('agency.markRequested')}
              </Button>
            </>
          )}

          {accessStatus === 'requested' && (
            <>
              <Button
                variant="primary"
                size="sm"
                onClick={handleMarkAsConnected}
                disabled={saving}
                className="gap-2 bg-green-600 hover:bg-green-700 shadow-lg shadow-green-500/20"
              >
                {saving ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={14} />
                )}
                {t('agency.markConnected')}
              </Button>
              <a href={partnerLink || '#'} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="sm" className="gap-2 text-surface-500">
                  <ExternalLink size={14} />
                  {t('agency.openPartnerDashboard')}
                </Button>
              </a>
            </>
          )}

          {accessStatus === 'connected' && (
            <a
              href={`https://${organization.shopifyDomain}/admin`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
              >
                <ShoppingBag size={16} />
                {t('agency.openAdmin')}
                <ExternalLink size={12} className="opacity-60" />
              </Button>
            </a>
          )}
        </div>
      </motion.div>
    );
  }

  // ============================================
  // CLIENT VIEW
  // ============================================
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative p-6 rounded-2xl border-2 transition-all',
        hasConnection
          ? 'bg-accent-50/80 dark:bg-accent-950/20 border-accent-600/30 dark:border-accent-600/20'
          : 'bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-800'
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div
          className={cn(
            'w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg',
            hasConnection
              ? 'bg-accent-600 dark:bg-accent-500'
              : 'bg-accent-600 dark:bg-accent-500 opacity-80'
          )}
        >
          <ShoppingBag className="w-7 h-7 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold text-surface-900 dark:text-white font-outfit">
              {t('title')}
            </h3>
            {hasConnection && (
              <span
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider',
                  ACCESS_STATUS_CONFIG[accessStatus].bg,
                  ACCESS_STATUS_CONFIG[accessStatus].color,
                  ACCESS_STATUS_CONFIG[accessStatus].border,
                  'border'
                )}
              >
                <StatusIcon
                  size={10}
                  className={accessStatus === 'requested' ? 'animate-spin' : ''}
                />
                {t(getShopifyAccessStatusKey(accessStatus))}
              </span>
            )}
          </div>
          <p className="text-sm text-surface-500 dark:text-surface-400 leading-relaxed">
            {t('description')}
          </p>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {editing ? (
          <motion.div
            key="editing"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6"
          >
            <div className="p-5 rounded-xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 space-y-4">
              {/* Store Domain Input */}
              <div>
                <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">
                  {t('form.storeUrl')} *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={shopifyDomain}
                    onChange={e => setShopifyDomain(e.target.value)}
                    placeholder="yourstore.myshopify.com"
                    className="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-accent-600/30 focus:border-accent-600 transition-all"
                  />
                </div>
                <p className="text-[10px] text-surface-400 mt-1.5">
                  {t('form.storeUrlHint')}
                </p>
              </div>

              {/* Collaborator Code Input */}
              <div>
                <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">
                  {t('form.collaboratorCode')}
                  <span className="text-surface-400 normal-case font-normal ms-1">
                    ({t('form.optional')})
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={collaboratorCode}
                    onChange={e =>
                      setCollaboratorCode(e.target.value.replace(/\D/g, '').slice(0, 4))
                    }
                    placeholder="1234"
                    maxLength={4}
                    className="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-accent-600/30 focus:border-accent-600 transition-all font-mono text-lg tracking-[0.5em]"
                  />
                </div>
                <p className="text-[10px] text-surface-400 mt-1.5">
                  {t('form.collaboratorCodeHint')}
                </p>
              </div>

              {/* Info Box */}
              <div className="p-3 rounded-lg bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800/50 flex items-start gap-3">
                <Info className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-primary-700 dark:text-primary-300">
                  <p className="font-bold mb-1">{t('form.infoTitle')}</p>
                  <p className="leading-relaxed">{t('form.infoDesc')}</p>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/50 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs font-medium text-rose-700 dark:text-rose-400">{error}</p>
                </div>
              )}
            </div>
          </motion.div>
        ) : hasConnection ? (
          <motion.div
            key="connected"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6"
          >
            <div className="p-4 rounded-xl bg-white/80 dark:bg-surface-800/50 border border-accent-600/20 dark:border-accent-600/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-surface-500 uppercase tracking-wider">
                  {t('storeUrl')}
                </span>
                <a
                  href={`https://${organization.shopifyDomain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-accent-700 dark:text-accent-600 hover:underline flex items-center gap-1"
                >
                  {organization.shopifyDomain}
                  <ExternalLink size={12} />
                </a>
              </div>
              {organization.shopifyCollaboratorCode && (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-surface-500 uppercase tracking-wider">
                    {t('collaboratorCode')}
                  </span>
                  <code className="px-2 py-1 bg-surface-100 dark:bg-surface-900 rounded text-sm font-mono font-bold text-surface-700 dark:text-surface-300">
                    {organization.shopifyCollaboratorCode}
                  </code>
                </div>
              )}

              {/* Status Message */}
              {accessStatus === 'pending' && (
                <div className="pt-2 border-t border-surface-100 dark:border-surface-700">
                  <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-2">
                    <Clock size={12} />
                    {t('statusMessages.pending')}
                  </p>
                </div>
              )}
              {accessStatus === 'requested' && (
                <div className="pt-2 border-t border-surface-100 dark:border-surface-700">
                  <p className="text-xs text-primary-600 dark:text-primary-400 flex items-center gap-2">
                    <Loader2 size={12} className="animate-spin" />
                    {t('statusMessages.requested')}
                  </p>
                </div>
              )}
              {accessStatus === 'connected' && (
                <div className="pt-2 border-t border-surface-100 dark:border-surface-700">
                  <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-2">
                    <Shield size={12} />
                    {t('statusMessages.connected')}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="features"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6"
          >
            <div className="p-4 rounded-xl bg-surface-50/80 dark:bg-surface-800/30 border border-dashed border-surface-200 dark:border-surface-700">
              <ul className="space-y-2 text-sm text-surface-600 dark:text-surface-400">
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-accent-600" />
                  {t('features.feature1')}
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-accent-600" />
                  {t('features.feature2')}
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-accent-600" />
                  {t('features.feature3')}
                </li>
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {editing ? (
          <>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              disabled={saving}
              className="gap-2 shadow-lg shadow-accent-600/20 bg-accent-600 hover:bg-accent-700"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              {saving ? t('form.saving') : t('form.save')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditing(false);
                setShopifyDomain(organization.shopifyDomain || '');
                setCollaboratorCode(organization.shopifyCollaboratorCode || '');
                setError(null);
              }}
              disabled={saving}
              className="gap-2 text-surface-500"
            >
              <X size={16} />
              {t('form.cancel')}
            </Button>
          </>
        ) : hasConnection ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditing(true)}
            className="gap-2 border-accent-600/30 text-accent-700 dark:text-accent-600 hover:bg-accent-600/10"
          >
            {t('actions.edit')}
          </Button>
        ) : (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setEditing(true)}
            className="gap-2 shadow-lg shadow-accent-600/20 bg-accent-600 hover:bg-accent-700"
          >
            <ShoppingBag size={16} />
            {t('actions.connect')}
            <ArrowRight size={14} className="opacity-60" />
          </Button>
        )}
      </div>
    </motion.div>
  );
}
