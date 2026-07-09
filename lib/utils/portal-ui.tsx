import { format, formatDistanceToNow } from 'date-fns';
import { getDateLocale } from '@/lib/locale-config';
import { Timestamp } from 'firebase/firestore';
import type { PricingRequest, PricingStatus } from '@/lib/types/pricing';
import type { Request } from '@/lib/types/portal';
import { Badge } from '@/components/ui/Badge';

// ============================================
// ORGANIZATION DISPLAY
// ============================================

export interface OrgDisplayProps {
  orgId: string;
  orgName: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: { avatar: 'w-6 h-6 text-[10px]', label: 'text-xs' },
  md: { avatar: 'w-8 h-8 text-xs', label: 'text-sm' },
  lg: { avatar: 'w-10 h-10 text-sm', label: 'text-base' },
};

/**
 * Renders an organization display with avatar and name.
 * Uses the first character of the name for the avatar.
 */
export function OrgDisplay({ orgName, size = 'md' }: OrgDisplayProps) {
  const classes = sizeClasses[size];
  const initial = orgName.charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-2">
      <div
        className={`bg-primary-600 dark:bg-primary-500 rounded-lg flex items-center justify-center text-white ${classes.avatar}`}
      >
        {initial}
      </div>
      <span
        className={`font-bold text-surface-700 dark:text-surface-300 truncate max-w-[150px] ${classes.label}`}
      >
        {orgName}
      </span>
    </div>
  );
}

// ============================================
// DATE FORMATTING
// ============================================

export interface DateDisplayProps {
  timestamp: Timestamp | Date | undefined;
  formatStr?: string;
  locale?: string;
  showRelative?: boolean;
  fallback?: string;
  hideDateOnly?: boolean;
  showStatusDateOnly?: boolean;
  status?: PricingStatus;
}

const DEFAULT_FORMAT = 'MMM d, yyyy';
const DEFAULT_FALLBACK = 'Recently';

/**
 * Formats a Firestore Timestamp or Date with locale support.
 * Can display full date or status-specific date.
 */
export function DateDisplay({
  timestamp,
  formatStr = DEFAULT_FORMAT,
  locale = 'en',
  showRelative = false,
  fallback = DEFAULT_FALLBACK,
  showStatusDateOnly = false,
  status,
}: DateDisplayProps) {
  if (!timestamp)
    return (
      <span className="text-sm font-medium text-surface-500 dark:text-surface-400">{fallback}</span>
    );

  try {
    const date =
      timestamp instanceof Date
        ? timestamp
        : 'toDate' in timestamp
          ? timestamp.toDate()
          : (() => {
              throw new Error('Unsupported timestamp value');
            })();

    if (showStatusDateOnly && status === 'DRAFT') {
      return (
        <div className="flex flex-col items-center">
          <span className="text-sm font-bold text-surface-800 dark:text-surface-200">
            {format(date, DEFAULT_FORMAT, { locale: getDateLocale(locale) })}
          </span>
          <span className="text-[10px] font-black text-surface-400 uppercase tracking-tighter">
            {showRelative
              ? formatDistanceToNow(date, { addSuffix: true, locale: getDateLocale(locale) })
              : ''}
          </span>
        </div>
      );
    }

    if (showRelative) {
      return (
        <span className="text-sm font-bold text-surface-800 dark:text-surface-200">
          {formatDistanceToNow(date, { addSuffix: true, locale: getDateLocale(locale) })}
        </span>
      );
    }

    return (
      <span className="text-sm font-bold text-surface-800 dark:text-surface-200">
        {format(date, formatStr, { locale: getDateLocale(locale) })}
      </span>
    );
  } catch {
    return (
      <span className="text-sm font-medium text-surface-500 dark:text-surface-400">{fallback}</span>
    );
  }
}

// ============================================
// STATUS BADGE COMPONENT
// ============================================

export interface StatusBadgeProps {
  status: PricingStatus;
  locale?: string;
  compact?: boolean;
}

/**
 * Renders a status badge with proper styling.
 */
export function StatusBadge({ status, compact = false }: StatusBadgeProps) {
  const color = status === 'DRAFT' ? 'gray' : status === 'QUOTED' ? 'blue' : 'gray';
  const sizeClass = compact ? 'h-6 px-2 text-[10px]' : 'h-7 px-3 text-xs';

  return (
    <Badge variant={color} className={`${sizeClass} font-bold`}>
      {status}
    </Badge>
  );
}

// ============================================
// REQUEST DISPLAY COMPONENT
// ============================================

export interface RequestDisplayProps {
  request: PricingRequest | Request;
  organizations?: Record<string, { name: string }>;
  locale?: string;
}

/**
 * Renders a compact display of a pricing request or request.
 */
export function RequestDisplay({ request, organizations }: RequestDisplayProps) {
  const orgName = organizations?.[request.id]?.name || request.title.slice(0, 8);
  const initial = orgName.charAt(0).toUpperCase();

  return (
    <div className="flex items-start justify-between">
      <div className="flex items-start gap-2">
        <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded flex items-center justify-center text-white text-[10px] font-bold shrink-0">
          {initial}
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-surface-900 dark:text-white truncate max-w-[200px]">
            {request.title}
          </span>
          <span className="text-xs font-bold text-surface-400 flex items-center gap-1.5 font-outfit">
            <span className="font-mono bg-surface-100 dark:bg-surface-800 px-1.5 py-0.5 rounded text-[10px] tracking-tight">
              {request.id?.slice(0, 8)}
            </span>
            {((request as PricingRequest).childRequestIds?.length ?? 0) > 0 && (
              <>
                <span className="w-1 h-1 rounded-full bg-surface-300" />
                <span>{(request as PricingRequest).childRequestIds?.length} requests</span>
              </>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================
// FILTERING HELPERS
// ============================================

export interface FilterResult {
  matchesFilter: boolean;
  orgName: string;
  orgNameLower: string;
  matchesSearch: boolean;
}

/**
 * Filters pricing requests with optimized performance.
 * Pre-calculates lowercase values to avoid repeated conversions.
 */
export function filterPricingRequests(
  requests: PricingRequest[],
  activeFilter: string,
  searchQuery: string,
  organizations: Record<string, { name: string }>
): FilterResult[] {
  const searchLower = searchQuery.toLowerCase();

  return requests.map(req => {
    const org = organizations[req.orgId];
    const orgName = org?.name || '';
    const orgNameLower = orgName.toLowerCase();

    const matchesFilter = activeFilter === 'All' || req.status === activeFilter;
    const matchesSearch =
      req.title.toLowerCase().includes(searchLower) ||
      (req.id?.toLowerCase() || '').includes(searchLower) ||
      orgNameLower.includes(searchLower);

    return { matchesFilter, orgName, orgNameLower, matchesSearch };
  });
}

/**
 * Filter and paginate pricing requests.
 * Combines filtering and pagination into one optimized operation.
 */
export function filterAndPaginatePricingRequests(
  requests: PricingRequest[],
  activeFilter: string,
  searchQuery: string,
  organizations: Record<string, { name: string }>,
  currentPage: number,
  itemsPerPage: number
) {
  const searchLower = searchQuery.toLowerCase();

  const filteredResults = requests.map(req => {
    const org = organizations[req.orgId];
    const orgName = org?.name || '';
    const orgNameLower = orgName.toLowerCase();

    const matchesFilter = activeFilter === 'All' || req.status === activeFilter;
    const matchesSearch =
      req.title.toLowerCase().includes(searchLower) ||
      (req.id?.toLowerCase() || '').includes(searchLower) ||
      orgNameLower.includes(searchLower);

    return { req, orgName, matchesFilter, matchesSearch };
  });

  const totalItems = filteredResults.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedResults = filteredResults
    .filter(({ matchesFilter, matchesSearch }) => matchesFilter && matchesSearch)
    .slice(startIndex, endIndex)
    .map(({ req }) => req);

  return {
    paginatedRequests: paginatedResults,
    totalPages,
    totalItems,
  };
}
