'use client';

import { Edit2, Loader2, Plus, Tag, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { cn } from '@/lib/utils';
import { Service, formatCurrency } from '@/lib/types/portal';

interface AgencyServicesSettingsTabProps {
  services: Service[];
  loading: boolean;
  onAdd: () => void;
  onEdit: (service: Service) => void;
  onDelete: (serviceId: string) => void;
}

export function AgencyServicesSettingsTab({
  services,
  loading,
  onAdd,
  onEdit,
  onDelete,
}: AgencyServicesSettingsTabProps) {
  const t = useTranslations('portal');

  return (
    <Card className="border-surface-200 dark:border-surface-800 shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-lg font-bold text-surface-900 dark:text-white font-outfit">
            {t('agency.settings.tabs.services')}
          </h3>
          <p className="text-sm text-surface-500 dark:text-surface-400">
            {t('agency.settings.services.subtitle')}
          </p>
        </div>
        <Button size="sm" className="h-10 font-outfit" onClick={onAdd}>
          <Plus size={18} className="me-2" />
          {t('agency.settings.services.add')}
        </Button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-8 h-8 text-primary-600 dark:text-primary-400 animate-spin" />
        </div>
      ) : services.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {services.map(service => (
            <div
              key={service.id}
              className={cn(
                'p-5 rounded-2xl border transition-all group',
                service.isActive
                  ? 'bg-white dark:bg-surface-950 border-surface-200 dark:border-surface-800'
                  : 'bg-surface-50/50 dark:bg-surface-900/30 border-surface-100 dark:border-surface-800/50 opacity-60'
              )}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-2.5 rounded-xl bg-primary-50 dark:bg-primary-900/30 text-primary-600 border border-primary-100 dark:border-primary-900/30">
                  <Tag size={18} />
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <IconButton
                    icon={Edit2}
                    label={t('common.edit')}
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(service)}
                  />
                  <IconButton
                    icon={Trash2}
                    label={t('common.delete')}
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(service.id)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-surface-900 dark:text-white font-outfit flex items-center gap-2">
                  {service.name}
                  {!service.isActive && (
                    <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-surface-200 dark:bg-surface-800 text-surface-500">
                      {t('agency.settings.services.inactive')}
                    </span>
                  )}
                </h4>
                <p className="text-xs text-surface-500 line-clamp-2 min-h-[2rem]">
                  {service.description || t('common.noDescription' as any)}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-surface-100 dark:border-surface-800 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-surface-400 uppercase tracking-widest">
                    {t('agency.settings.services.basePriceLabel')}
                  </span>
                  <span className="text-sm font-black text-surface-900 dark:text-white font-outfit">
                    {formatCurrency(service.basePrice, service.currency)}
                  </span>
                </div>
                {service.category && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-100 dark:bg-surface-800 text-surface-500 dark:text-surface-400 font-outfit">
                    {service.category}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center bg-surface-50/50 dark:bg-surface-900/30 rounded-3xl border-2 border-dashed border-surface-200 dark:border-surface-800">
          <Tag className="w-12 h-12 text-surface-300 dark:text-surface-700 mx-auto mb-4 opacity-20" />
          <h4 className="text-lg font-bold text-surface-900 dark:text-white font-outfit mb-1">
            {t('agency.settings.services.emptyTitle')}
          </h4>
          <p className="text-sm text-surface-500 dark:text-surface-400 max-w-sm mx-auto mb-8">
            {t('agency.settings.services.emptyDesc')}
          </p>
          <Button variant="outline" onClick={onAdd}>
            {t('agency.settings.services.createFirst')}
          </Button>
        </div>
      )}
    </Card>
  );
}
