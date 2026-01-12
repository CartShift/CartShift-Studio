'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { useTranslations, useLocale } from 'next-intl';
import {
  Star,
  Search,
  Filter,
  Loader2,
  MessageSquareHeart,
  ThumbsUp,
  Clock,
  CheckCircle2,
  XCircle,
  Building2,
  User,
  Calendar,
  Quote,
  X,
  Sparkles,
  Download,
  FileJson,
  Code2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PortalCard } from '@/components/portal/ui/PortalCard';
import { PortalButton } from '@/components/portal/ui/PortalButton';
import { PortalBadge } from '@/components/portal/ui/PortalBadge';
import {
  getAllTestimonials,
  updateTestimonialStatus,
  Testimonial,
  TestimonialStatus,
} from '@/lib/services/portal-testimonials';
import { format } from 'date-fns';
import { getDateLocale } from '@/lib/locale-config';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { toast } from 'sonner';
import { useDirection } from '@/lib/i18n-utils';

// ============================================
// Types
// ============================================

type FilterStatus = 'all' | TestimonialStatus;

// ============================================
// Stats Card Component
// ============================================

function StatsCard({
  icon: Icon,
  label,
  value,
  variant = 'default',
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  variant?: 'default' | 'warning' | 'success' | 'primary';
}) {
  const variants = {
    default: 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400',
    warning: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400',
    success: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    primary: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400',
  };

  return (
    <div className={cn('rounded-xl p-4 flex items-center gap-3', variants[variant])}>
      <div className="p-2 rounded-lg bg-white/50 dark:bg-black/20">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm opacity-80">{label}</p>
      </div>
    </div>
  );
}

// ============================================
// Star Rating Display
// ============================================

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const sizeClasses = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <Star
          key={star}
          className={cn(
            sizeClasses,
            star <= rating
              ? 'text-amber-400 fill-amber-400'
              : 'text-surface-300 dark:text-surface-600'
          )}
        />
      ))}
    </div>
  );
}

// ============================================
// Testimonial Card Component
// ============================================

function TestimonialCard({
  testimonial,
  onViewDetails,
}: {
  testimonial: Testimonial;
  onViewDetails: (testimonial: Testimonial) => void;
}) {
  const t = useTranslations('portal');
  const locale = useLocale();

  const statusConfig: Record<
    TestimonialStatus,
    { variant: 'yellow' | 'green' | 'red'; icon: React.ElementType }
  > = {
    pending: { variant: 'yellow', icon: Clock },
    approved: { variant: 'green', icon: CheckCircle2 },
    rejected: { variant: 'red', icon: XCircle },
  };

  const config = statusConfig[testimonial.status];
  const StatusIcon = config.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <PortalCard className="p-5 hover:shadow-lg transition-shadow">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
              {testimonial.userName?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <h3 className="font-semibold text-surface-900 dark:text-white">
                {testimonial.userName}
              </h3>
              <div className="flex items-center gap-2 text-sm text-surface-500">
                <Building2 className="w-3.5 h-3.5" />
                <span>{testimonial.companyName}</span>
                {testimonial.role && (
                  <>
                    <span>•</span>
                    <span>{testimonial.role}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <PortalBadge variant={config.variant} className="shrink-0">
            <StatusIcon className="w-3.5 h-3.5 me-1" />
            {t(`agency.testimonials.status.${testimonial.status}` as any)}
          </PortalBadge>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-3 mb-3">
          <StarRating rating={testimonial.rating} />
          <span className="text-sm font-medium text-surface-600 dark:text-surface-400">
            {testimonial.rating}/5
          </span>
          {testimonial.wouldRecommend && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
              <ThumbsUp className="w-3 h-3" />
              {t('agency.testimonials.card.recommends')}
            </span>
          )}
        </div>

        {/* Headline */}
        <h4 className="font-medium text-surface-800 dark:text-surface-200 mb-2">
          &ldquo;{testimonial.headline}&rdquo;
        </h4>

        {/* Content Preview */}
        <p className="text-sm text-surface-600 dark:text-surface-400 line-clamp-3 mb-4">
          {testimonial.content}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-surface-200 dark:border-surface-700">
          <div className="flex items-center gap-1.5 text-xs text-surface-500">
            <Calendar className="w-3.5 h-3.5" />
            <span>
              {t('agency.testimonials.card.submitted')}{' '}
              {testimonial.createdAt?.toDate
                ? format(testimonial.createdAt.toDate(), 'MMM d, yyyy', {
                    locale: getDateLocale(locale),
                  })
                : 'N/A'}
            </span>
          </div>

          <PortalButton variant="ghost" size="sm" onClick={() => onViewDetails(testimonial)}>
            {t('agency.testimonials.card.viewDetails')}
          </PortalButton>
        </div>
      </PortalCard>
    </motion.div>
  );
}

// ============================================
// Detail Modal Component
// ============================================

function TestimonialDetailModal({
  testimonial,
  onClose,
  onStatusUpdate,
}: {
  testimonial: Testimonial;
  onClose: () => void;
  onStatusUpdate: (status: TestimonialStatus, notes?: string) => Promise<void>;
}) {
  const t = useTranslations('portal');
  const [adminNotes, setAdminNotes] = useState(testimonial.adminNotes || '');
  const [updating, setUpdating] = useState<'approve' | 'reject' | null>(null);
  const dir = useDirection();

  const handleStatusUpdate = async (status: 'approved' | 'rejected') => {
    setUpdating(status === 'approved' ? 'approve' : 'reject');
    try {
      await onStatusUpdate(status, adminNotes);
      onClose();
    } finally {
      setUpdating(null);
    }
  };

  const aspectLabels: Record<string, string> = {
    communication: t('agency.testimonials.card.communication'),
    quality: t('agency.testimonials.card.quality'),
    timeliness: t('agency.testimonials.card.timeliness'),
    value: t('agency.testimonials.card.value'),
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-surface-900 rounded-2xl shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900">
          <h2 className="text-xl font-bold text-surface-900 dark:text-white flex items-center gap-2">
            <MessageSquareHeart className="w-5 h-5 text-blue-500" />
            {t('agency.testimonials.modal.title')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-6">
          {/* Author Info */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xl font-semibold">
              {testimonial.userName?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-surface-900 dark:text-white">
                {testimonial.userName}
              </h3>
              <div className="flex items-center gap-2 text-sm text-surface-500">
                <Building2 className="w-4 h-4" />
                <span>{testimonial.companyName}</span>
                {testimonial.role && (
                  <>
                    <span>•</span>
                    <User className="w-4 h-4" />
                    <span>{testimonial.role}</span>
                  </>
                )}
              </div>
              <p className="text-xs text-surface-400 mt-1">{testimonial.userEmail}</p>
            </div>
          </div>

          {/* Rating Section */}
          <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <StarRating rating={testimonial.rating} size="md" />
                <span className="text-lg font-bold text-surface-900 dark:text-white">
                  {testimonial.rating}/5
                </span>
              </div>
              {testimonial.wouldRecommend && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-sm font-medium">
                  <ThumbsUp className="w-4 h-4" />
                  {t('agency.testimonials.card.recommends')}
                </span>
              )}
            </div>

            {/* Aspect Ratings */}
            {testimonial.aspects && Object.keys(testimonial.aspects).length > 0 && (
              <div className="pt-4 border-t border-surface-200 dark:border-surface-700">
                <h4 className="text-sm font-medium text-surface-600 dark:text-surface-400 mb-3">
                  {t('agency.testimonials.card.aspects')}
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(testimonial.aspects).map(
                    ([key, value]) =>
                      value && (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-sm text-surface-600 dark:text-surface-400">
                            {aspectLabels[key] || key}
                          </span>
                          <StarRating rating={value} size="sm" />
                        </div>
                      )
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Testimonial Content */}
          <div>
            <div className="flex items-start gap-2 mb-3">
              <Quote className="w-5 h-5 text-blue-500 shrink-0 mt-1" />
              <h4 className="text-lg font-semibold text-surface-900 dark:text-white">
                {testimonial.headline}
              </h4>
            </div>
            <p className="text-surface-600 dark:text-surface-300 whitespace-pre-wrap ps-7">
              {testimonial.content}
            </p>
            {testimonial.projectHighlight && (
              <div className="mt-3 ps-7">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-sm">
                  <Sparkles className="w-3.5 h-3.5" />
                  {testimonial.projectHighlight}
                </span>
              </div>
            )}
          </div>

          {/* Admin Notes */}
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              {t('agency.testimonials.modal.adminNotes')}
            </label>
            <textarea
              value={adminNotes}
              onChange={e => setAdminNotes(e.target.value)}
              placeholder={t('agency.testimonials.modal.adminNotesPlaceholder')}
              className="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
              rows={3}
              dir={dir}
            />
          </div>

          {/* Actions */}
          {testimonial.status === 'pending' && (
            <div className="flex items-center gap-3 pt-4 border-t border-surface-200 dark:border-surface-700">
              <PortalButton
                variant="outline"
                className="flex-1 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-500/10"
                onClick={() => handleStatusUpdate('rejected')}
                disabled={updating !== null}
              >
                {updating === 'reject' ? (
                  <>
                    <Loader2 className="w-4 h-4 me-2 animate-spin" />
                    {t('agency.testimonials.modal.rejecting')}
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 me-2" />
                    {t('agency.testimonials.modal.reject')}
                  </>
                )}
              </PortalButton>
              <PortalButton
                variant="primary"
                className="flex-1"
                onClick={() => handleStatusUpdate('approved')}
                disabled={updating !== null}
              >
                {updating === 'approve' ? (
                  <>
                    <Loader2 className="w-4 h-4 me-2 animate-spin" />
                    {t('agency.testimonials.modal.approving')}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 me-2" />
                    {t('agency.testimonials.modal.approve')}
                  </>
                )}
              </PortalButton>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============================================
// Main Component
// ============================================

export default function AgencyTestimonialsClient() {
  const t = useTranslations('portal');
  const { user } = usePortalAuth();
  const dir = useDirection();

  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTestimonial, setSelectedTestimonial] = useState<Testimonial | null>(null);

  const filters: { value: FilterStatus; label: string }[] = [
    { value: 'all', label: t('agency.testimonials.filters.all') },
    { value: 'pending', label: t('agency.testimonials.filters.pending') },
    { value: 'approved', label: t('agency.testimonials.filters.approved') },
    { value: 'rejected', label: t('agency.testimonials.filters.rejected') },
  ];

  // Fetch testimonials
  useEffect(() => {
    async function fetchTestimonials() {
      setLoading(true);
      try {
        const data = await getAllTestimonials();
        setTestimonials(data);
      } catch (error) {
        console.error('Failed to fetch testimonials:', error);
        toast.error('Failed to load testimonials');
      } finally {
        setLoading(false);
      }
    }
    fetchTestimonials();
  }, []);

  // Filter and search
  const filteredTestimonials = useMemo(() => {
    return testimonials.filter(t => {
      // Status filter
      if (activeFilter !== 'all' && t.status !== activeFilter) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          t.userName?.toLowerCase().includes(query) ||
          t.companyName?.toLowerCase().includes(query) ||
          t.headline?.toLowerCase().includes(query) ||
          t.content?.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [testimonials, activeFilter, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    const total = testimonials.length;
    const pending = testimonials.filter(t => t.status === 'pending').length;
    const approved = testimonials.filter(t => t.status === 'approved').length;
    const avgRating =
      testimonials.length > 0
        ? (testimonials.reduce((sum, t) => sum + t.rating, 0) / total).toFixed(1)
        : '0';
    return { total, pending, approved, avgRating };
  }, [testimonials]);

  // Handle status update
  const handleStatusUpdate = async (
    testimonialId: string,
    status: TestimonialStatus,
    notes?: string
  ) => {
    try {
      await updateTestimonialStatus(testimonialId, status, user?.uid, notes);
      setTestimonials(prev =>
        prev.map(t => (t.id === testimonialId ? { ...t, status, adminNotes: notes } : t))
      );
      toast.success(
        status === 'approved'
          ? t('agency.testimonials.toast.approved')
          : t('agency.testimonials.toast.rejected')
      );
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error(t('agency.testimonials.toast.error'));
      throw error;
    }
  };

  // Export dropdown state
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Close export menu when clicking outside
  useEffect(() => {
    if (!showExportMenu) return undefined;

    const handleClickOutside = () => setShowExportMenu(false);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showExportMenu]);

  // Get approved testimonials for export
  const approvedTestimonials = useMemo(
    () => testimonials.filter(t => t.status === 'approved'),
    [testimonials]
  );

  // Export as JSON (for developers)
  const handleExportJSON = () => {
    const exportData = approvedTestimonials.map(t => ({
      id: t.id,
      author: {
        name: t.userName,
        role: t.role || null,
        company: t.companyName,
      },
      rating: t.rating,
      headline: t.headline,
      content: t.content,
      projectHighlight: t.projectHighlight || null,
      wouldRecommend: t.wouldRecommend,
      aspects: t.aspects || null,
      createdAt: t.createdAt?.toDate?.()?.toISOString() || null,
    }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `testimonials-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
    toast.success(t('agency.testimonials.export.success'));
  };

  // Export as React component code
  const handleExportCode = () => {
    const code = `// Testimonials data exported from CartShift Portal
// Generated on ${new Date().toLocaleDateString()}

export const testimonials = [
${approvedTestimonials
  .map(
    t => `  {
    id: "${t.id}",
    author: {
      name: "${t.userName}",
      role: ${t.role ? `"${t.role}"` : 'null'},
      company: "${t.companyName}",
    },
    rating: ${t.rating},
    headline: "${t.headline.replace(/"/g, '\\"')}",
    content: \`${t.content.replace(/`/g, '\\`')}\`,
    wouldRecommend: ${t.wouldRecommend},
  }`
  )
  .join(',\n')}
] as const;

export type Testimonial = typeof testimonials[number];
`;

    const blob = new Blob([code], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `testimonials-${new Date().toISOString().split('T')[0]}.ts`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
    toast.success(t('agency.testimonials.export.success'));
  };

  return (
    <div className="space-y-6" dir={dir}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-3">
            <MessageSquareHeart className="w-7 h-7 text-blue-500" />
            {t('agency.testimonials.title')}
          </h1>
          <p className="text-surface-600 dark:text-surface-400 mt-1">
            {t('agency.testimonials.subtitle')}
          </p>
        </div>

        {/* Export Button */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            disabled={approvedTestimonials.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-300 font-medium transition-colors border border-surface-200 dark:border-surface-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            {t('agency.testimonials.export.button')}
            <span className="text-xs bg-green-500/20 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full">
              {approvedTestimonials.length}
            </span>
          </button>

          {/* Export Dropdown */}
          <AnimatePresence>
            {showExportMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute end-0 top-full mt-2 w-56 bg-white dark:bg-surface-800 rounded-xl shadow-lg border border-surface-200 dark:border-surface-700 overflow-hidden z-50"
              >
                <div className="p-2 space-y-1">
                  <button
                    onClick={handleExportJSON}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-300 transition-colors text-start"
                  >
                    <FileJson className="w-4 h-4 text-blue-500" />
                    <div>
                      <div className="font-medium">{t('agency.testimonials.export.json')}</div>
                      <div className="text-xs text-surface-500">
                        {t('agency.testimonials.export.jsonDesc')}
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={handleExportCode}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-300 transition-colors text-start"
                  >
                    <Code2 className="w-4 h-4 text-purple-500" />
                    <div>
                      <div className="font-medium">{t('agency.testimonials.export.code')}</div>
                      <div className="text-xs text-surface-500">
                        {t('agency.testimonials.export.codeDesc')}
                      </div>
                    </div>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          icon={MessageSquareHeart}
          label={t('agency.testimonials.stats.total')}
          value={stats.total}
        />
        <StatsCard
          icon={Clock}
          label={t('agency.testimonials.stats.pending')}
          value={stats.pending}
          variant="warning"
        />
        <StatsCard
          icon={CheckCircle2}
          label={t('agency.testimonials.stats.approved')}
          value={stats.approved}
          variant="success"
        />
        <StatsCard
          icon={Star}
          label={t('agency.testimonials.stats.avgRating')}
          value={stats.avgRating}
          variant="primary"
        />
      </div>

      {/* Filters & Search */}
      <PortalCard className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search testimonials..."
              className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              dir={dir}
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <Filter className="w-4 h-4 text-surface-400 shrink-0" />
            {filters.map(filter => (
              <button
                key={filter.value}
                onClick={() => setActiveFilter(filter.value)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                  activeFilter === filter.value
                    ? 'bg-blue-500 text-white'
                    : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700'
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </PortalCard>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-surface-500">{t('agency.testimonials.loading')}</p>
        </div>
      ) : filteredTestimonials.length === 0 ? (
        <PortalCard className="py-16">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-4">
              <MessageSquareHeart className="w-8 h-8 text-surface-400" />
            </div>
            <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-1">
              {t('agency.testimonials.empty')}
            </h3>
            <p className="text-surface-500 max-w-sm">{t('agency.testimonials.emptyDesc')}</p>
          </div>
        </PortalCard>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {filteredTestimonials.map(testimonial => (
              <TestimonialCard
                key={testimonial.id}
                testimonial={testimonial}
                onViewDetails={setSelectedTestimonial}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedTestimonial && (
          <TestimonialDetailModal
            testimonial={selectedTestimonial}
            onClose={() => setSelectedTestimonial(null)}
            onStatusUpdate={(status, notes) =>
              handleStatusUpdate(selectedTestimonial.id, status, notes)
            }
          />
        )}
      </AnimatePresence>
    </div>
  );
}
