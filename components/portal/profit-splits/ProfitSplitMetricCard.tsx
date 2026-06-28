import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

export interface ProfitSplitMetricCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone: 'emerald' | 'blue' | 'amber' | 'rose' | 'purple';
}

export function ProfitSplitMetricCard({ label, value, icon, tone }: ProfitSplitMetricCardProps) {
  const toneClass = {
    emerald:
      'from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-800/10 text-emerald-700 dark:text-emerald-300',
    blue: 'from-primary-50 to-primary-100/50 dark:from-primary-900/20 dark:to-primary-800/10 text-primary-700 dark:text-primary-300',
    amber:
      'from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-800/10 text-amber-700 dark:text-amber-300',
    rose: 'from-rose-50 to-rose-100/50 dark:from-rose-900/20 dark:to-rose-800/10 text-rose-700 dark:text-rose-300',
    purple:
      'from-accent-50 to-accent-100/50 dark:from-accent-900/20 dark:to-accent-800/10 text-accent-700 dark:text-accent-300',
  }[tone];

  return (
    <Card
      className={cn(
        'min-h-[96px] p-3.5 bg-surface-50 dark:bg-surface-900/50 border-surface-200/70 dark:border-white/10',
        toneClass
      )}
    >
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-lg bg-white/70 dark:bg-white/10 flex items-center justify-center">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-wider opacity-70">{label}</p>
          <p className="text-lg font-black truncate">{value}</p>
        </div>
      </div>
    </Card>
  );
}
