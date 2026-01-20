'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from '@/lib/motion';
import {
  ChevronDown,
  Check,
  Circle,
  Loader2,
  AlertCircle,
  Clock,
  FileText,
  DollarSign,
  Zap,
  Eye,
  PackageCheck,
  CreditCard,
  XCircle,
  Ban,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { RequestStatus, REQUEST_STATUS } from '@/lib/types/portal';
import { useTranslations } from 'next-intl';

// Define the workflow stages with their allowed transitions
const WORKFLOW_STAGES: {
  status: RequestStatus;
  icon: typeof Circle;
  color: string;
  bgColor: string;
  allowedFrom: RequestStatus[];
}[] = [
  {
    status: REQUEST_STATUS.NEW,
    icon: FileText,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    allowedFrom: [], // Initial status
  },
  {
    status: REQUEST_STATUS.NEEDS_INFO,
    icon: AlertCircle,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    allowedFrom: [REQUEST_STATUS.NEW, REQUEST_STATUS.QUOTED],
  },
  {
    status: REQUEST_STATUS.QUOTED,
    icon: DollarSign,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    allowedFrom: [REQUEST_STATUS.NEW, REQUEST_STATUS.NEEDS_INFO],
  },
  {
    status: REQUEST_STATUS.ACCEPTED,
    icon: Check,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    allowedFrom: [REQUEST_STATUS.QUOTED],
  },
  {
    status: REQUEST_STATUS.QUEUED,
    icon: Clock,
    color: 'text-surface-600 dark:text-surface-400',
    bgColor: 'bg-surface-100 dark:bg-surface-800',
    allowedFrom: [REQUEST_STATUS.ACCEPTED, REQUEST_STATUS.NEW],
  },
  {
    status: REQUEST_STATUS.IN_PROGRESS,
    icon: Zap,
    color: 'text-violet-600 dark:text-violet-400',
    bgColor: 'bg-violet-100 dark:bg-violet-900/30',
    allowedFrom: [REQUEST_STATUS.ACCEPTED, REQUEST_STATUS.QUEUED, REQUEST_STATUS.IN_REVIEW],
  },
  {
    status: REQUEST_STATUS.IN_REVIEW,
    icon: Eye,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    allowedFrom: [REQUEST_STATUS.IN_PROGRESS],
  },
  {
    status: REQUEST_STATUS.DELIVERED,
    icon: PackageCheck,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    allowedFrom: [REQUEST_STATUS.IN_REVIEW, REQUEST_STATUS.IN_PROGRESS],
  },
  {
    status: REQUEST_STATUS.PAID,
    icon: CreditCard,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    allowedFrom: [REQUEST_STATUS.DELIVERED],
  },
  {
    status: REQUEST_STATUS.CLOSED,
    icon: Check,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    allowedFrom: [
      REQUEST_STATUS.DELIVERED,
      REQUEST_STATUS.PAID,
      REQUEST_STATUS.IN_PROGRESS,
      REQUEST_STATUS.IN_REVIEW,
    ],
  },
  {
    status: REQUEST_STATUS.DECLINED,
    icon: XCircle,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    allowedFrom: [REQUEST_STATUS.QUOTED],
  },
  {
    status: REQUEST_STATUS.CANCELED,
    icon: Ban,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    allowedFrom: [REQUEST_STATUS.NEW, REQUEST_STATUS.NEEDS_INFO, REQUEST_STATUS.QUEUED],
  },
];

// Get available transitions from current status
function getAvailableTransitions(currentStatus: RequestStatus): RequestStatus[] {
  return WORKFLOW_STAGES.filter(stage => stage.allowedFrom.includes(currentStatus)).map(
    stage => stage.status
  );
}

// Get stage info for a status
function getStageInfo(status: RequestStatus) {
  return WORKFLOW_STAGES.find(s => s.status === status) || WORKFLOW_STAGES[0];
}

// Determine if a status is "completed" relative to current
function getStatusState(
  status: RequestStatus,
  currentStatus: RequestStatus
): 'completed' | 'current' | 'upcoming' {
  const statusOrder = WORKFLOW_STAGES.map(s => s.status);
  const currentIndex = statusOrder.indexOf(currentStatus);
  const statusIndex = statusOrder.indexOf(status);

  // Special cases for terminal states
  if (
    currentStatus === REQUEST_STATUS.CLOSED ||
    currentStatus === REQUEST_STATUS.CANCELED ||
    currentStatus === REQUEST_STATUS.DECLINED ||
    currentStatus === REQUEST_STATUS.PAID
  ) {
    if (status === currentStatus) return 'current';
    return 'completed';
  }

  if (status === currentStatus) return 'current';
  if (statusIndex < currentIndex) return 'completed';
  return 'upcoming';
}

interface RequestStatusWorkflowProps {
  currentStatus: RequestStatus;
  onStatusChange: (newStatus: RequestStatus) => Promise<void>;
  isUpdating?: boolean;
  className?: string;
}

export function RequestStatusWorkflow({
  currentStatus,
  onStatusChange,
  isUpdating = false,
  className,
}: RequestStatusWorkflowProps) {
  const t = useTranslations('portal');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<RequestStatus | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const [isMounted, setIsMounted] = useState(false);

  // Ensure we're on the client before rendering portal
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Update dropdown position when opened
  useEffect(() => {
    if (isDropdownOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8, // 8px gap
        left: rect.left,
        width: rect.width,
      });
    }
  }, [isDropdownOpen]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isDropdownOpen &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        const dropdown = document.getElementById('status-workflow-dropdown');
        if (dropdown && dropdown.contains(event.target as Node)) {
          return;
        }
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  // Update position on scroll/resize
  useEffect(() => {
    if (!isDropdownOpen) return;

    const updatePosition = () => {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + 8,
          left: rect.left,
          width: rect.width,
        });
      }
    };

    // Initial update
    updatePosition();

    // Add listeners
    window.addEventListener('scroll', updatePosition, true); // true for capture to detect scrolling in containers
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isDropdownOpen]);

  const availableTransitions = getAvailableTransitions(currentStatus);
  const currentStage = getStageInfo(currentStatus);
  const CurrentIcon = currentStage.icon;

  const handleStatusChange = async (newStatus: RequestStatus) => {
    setPendingStatus(newStatus);
    setIsDropdownOpen(false);
    try {
      await onStatusChange(newStatus);
    } finally {
      setPendingStatus(null);
    }
  };

  // Get main workflow stages (excluding declined/canceled for display)
  const mainWorkflowStages = WORKFLOW_STAGES.filter(
    s => s.status !== REQUEST_STATUS.DECLINED && s.status !== REQUEST_STATUS.CANCELED
  );

  return (
    <div className={cn('flex flex-col sm:flex-row items-center gap-6', className)}>
      {/* Compact Status Selector */}
      <div className="relative shrink-0">
        <button
          ref={buttonRef}
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          disabled={isUpdating || availableTransitions.length === 0}
          className={cn(
            'flex items-center gap-3 pr-4 pl-2 py-2 rounded-full border transition-all',
            'bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-700',
            availableTransitions.length > 0 && !isUpdating
              ? 'hover:border-blue-300 dark:hover:border-blue-700 cursor-pointer shadow-sm hover:shadow-md'
              : 'cursor-default opacity-80'
          )}
        >
          <div className={cn('p-1.5 rounded-full', currentStage.bgColor)}>
            {isUpdating || pendingStatus ? (
              <Loader2 size={16} className="animate-spin text-blue-500" />
            ) : (
              <CurrentIcon size={16} className={currentStage.color} />
            )}
          </div>

          <div className="flex flex-col items-start mr-1">
            <span className="text-[10px] uppercase font-black text-surface-400 tracking-wider leading-none mb-0.5">
              {t('requests.detail.currentStatus')}
            </span>
            <span className="text-sm font-bold text-surface-900 dark:text-white font-outfit leading-none">
              {pendingStatus
                ? t(`requests.status.${pendingStatus?.toLowerCase()}` as any)
                : t(`requests.status.${currentStatus.toLowerCase()}` as any)}
            </span>
          </div>

          {availableTransitions.length > 0 && !isUpdating && (
            <ChevronDown
              size={16}
              className={cn(
                'text-surface-400 transition-transform ml-1',
                isDropdownOpen && 'rotate-180'
              )}
            />
          )}
        </button>

        {/* Dropdown Portal */}
        {isMounted &&
          createPortal(
            <AnimatePresence>
              {isDropdownOpen && availableTransitions.length > 0 && (
                <motion.div
                  id="status-workflow-dropdown"
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    position: 'fixed',
                    top: dropdownPosition.top,
                    left: dropdownPosition.left,
                    minWidth: '220px', // Ensure it's not too narrow
                    zIndex: 9999,
                  }}
                  className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-700 shadow-xl overflow-hidden p-1"
                >
                  <p className="px-3 py-2 text-[10px] font-black text-surface-400 uppercase tracking-widest">
                    {t('requests.detail.moveTo')}
                  </p>
                  <div className="space-y-1">
                    {availableTransitions.map(status => {
                      const stage = getStageInfo(status);
                      const StageIcon = stage.icon;
                      return (
                        <button
                          key={status}
                          onClick={() => handleStatusChange(status)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors text-left"
                        >
                          <div className={cn('p-1.5 rounded-lg shrink-0', stage.bgColor)}>
                            <StageIcon size={14} className={stage.color} />
                          </div>
                          <span className="text-sm font-semibold text-surface-700 dark:text-surface-200">
                            {t(`requests.status.${status.toLowerCase()}` as any)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>,
            document.body
          )}
      </div>

      {/* Visual Workflow Timeline */}
      <div className="relative flex-1 w-full">
        <div className="flex items-center justify-between w-full relative z-10">
          {mainWorkflowStages.slice(0, 8).map((stage, index) => {
            const state = getStatusState(stage.status, currentStatus);
            const StageIcon = stage.icon;

            // Calculate progress line width based on active state
            // This is a bit tricky with flexbox, instead we draw lines between items

            return (
              <div key={stage.status} className="flex flex-col items-center relative group flex-1">
                {/* Connector Line (Left side - except first) */}
                {index > 0 && (
                  <div
                    className={cn(
                      'absolute top-4 w-full h-0.5 -z-10',
                      'ltr:right-[50%] rtl:left-[50%]',
                      getStatusState(stage.status, currentStatus) === 'completed' ||
                        getStatusState(stage.status, currentStatus) === 'current'
                        ? 'bg-emerald-500'
                        : 'bg-surface-200 dark:bg-surface-800'
                    )}
                  />
                )}

                {/* Connector Line (Right side - except last) - Not needed if we use left connector on next items?
                    Actually, simpler approach: Absolute line spanning full width behind,
                    and color segments. Hard to do perfectly dynamic.
                    Let's stick to the previous flex approach but make it spacing-between.
                */}

                {/* Icon Circle */}
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center transition-all border-2 bg-white dark:bg-surface-950 z-20',
                    state === 'completed' && 'bg-emerald-500 border-emerald-500',
                    state === 'current' &&
                      cn(stage.bgColor, 'border-current', stage.color, 'scale-110 shadow-sm'),
                    state === 'upcoming' &&
                      'bg-surface-50 dark:bg-surface-900 border-surface-200 dark:border-surface-800 text-surface-300'
                  )}
                >
                  {state === 'completed' ? (
                    <Check size={14} className="text-white" />
                  ) : (
                    <StageIcon
                      size={14}
                      className={cn(state === 'current' ? stage.color : 'text-inherit')}
                    />
                  )}
                </div>

                {/* Label */}
                <div
                  className={cn(
                    'mt-2 text-[9px] font-bold uppercase tracking-wider transition-all text-center absolute top-8 w-24',
                    state === 'current'
                      ? 'opacity-100 text-surface-900 dark:text-surface-100 translate-y-0'
                      : 'opacity-0 group-hover:opacity-100 group-hover:translate-y-0 -translate-y-1 text-surface-400'
                  )}
                >
                  {t(`requests.status.${stage.status.toLowerCase()}` as any)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Background Grey Line */}
        <div className="absolute top-4 ltr:left-0 rtl:right-0 w-full h-0.5 bg-surface-100 dark:bg-surface-800 -z-0" />

        {/* Progress Colored Line - width depends on current index */}
        <div
          className="absolute top-4 ltr:left-0 rtl:right-0 h-0.5 bg-emerald-500 transition-all duration-500 ease-out z-0"
          style={{
            width: `${(mainWorkflowStages.findIndex(s => s.status === currentStatus) / (Math.min(mainWorkflowStages.length, 8) - 1)) * 100}%`,
          }}
        />
      </div>
    </div>
  );
}
