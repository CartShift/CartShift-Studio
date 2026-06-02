'use client';

import { useState } from 'react';
import {
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@/components/ui/ModalBackdrop';

import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Service, Currency, CURRENCY_CONFIG } from '@/lib/types/portal';
import { createService, updateService } from '@/lib/services/portal-services';
import { Save, AlertCircle } from 'lucide-react';

interface ManageServiceFormProps {
  service?: Service; // If provided, we are editing
  onSuccess: () => void;
  onCancel: () => void;
}

export function ManageServiceForm({ service, onSuccess, onCancel }: ManageServiceFormProps) {
  const [loading, set] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations('portal.agency.settings.services.form');

  const [formData, setFormData] = useState({
    name: service?.name || '',
    description: service?.description || '',
    basePrice: service?.basePrice ? (service.basePrice / 100).toString() : '',
    currency: service?.currency || ('USD' as Currency),
    category: service?.category || '',
    isActive: service?.isActive ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name || !formData.basePrice) {
      setError(t('errors.required'));
      return;
    }

    set(true);
    try {
      const serviceData = {
        name: formData.name,
        description: formData.description,
        basePrice: Math.round(parseFloat(formData.basePrice) * 100),
        currency: formData.currency,
        category: formData.category,
        isActive: formData.isActive,
      };

      if (service?.id) {
        await updateService(service.id, serviceData);
      } else {
        await createService(serviceData);
      }
      onSuccess();
    } catch (error: unknown) {
      console.error('Error saving service:', error);
      setError(error instanceof Error ? error.message : t('errors.failed'));
    } finally {
      set(false);
    }
  };

  // Don't render if document.body is not available
  if (typeof document === 'undefined' || !document.body) {
    return null;
  }

  return (
    <ModalBackdrop isOpen={true} onClick={onCancel}>
      <ModalContent maxWidth="lg" onClick={e => e.stopPropagation()}>
        <ModalHeader
          title={service ? t('editTitle') : t('addTitle')}
          description={service ? t('editSubtitle') : t('addSubtitle')}
          onClose={onCancel}
        />

        <form onSubmit={handleSubmit}>
          <ModalBody className="space-y-6">
            {error && (
              <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 text-sm font-bold font-outfit">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            <Input
              label={t('fields.name')}
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder={t('fields.namePlaceholder')}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label={t('fields.basePrice')}
                type="number"
                step="0.01"
                value={formData.basePrice}
                onChange={e => setFormData({ ...formData, basePrice: e.target.value })}
                placeholder="0.00"
                required
              />
              <div>
                <label className="block portal-label-sm mb-2.5 font-outfit">
                  {t('fields.currency')}
                </label>
                <select
                  value={formData.currency}
                  onChange={e => setFormData({ ...formData, currency: e.target.value as Currency })}
                  className="portal-input h-11 rounded-xl text-sm font-bold font-outfit"
                >
                  {Object.entries(CURRENCY_CONFIG).map(([code, config]) => (
                    <option key={code} value={code}>
                      {code} ({config.symbol})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Input
              label={t('fields.category')}
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value })}
              placeholder={t('fields.categoryPlaceholder')}
            />

            <div>
              <label className="block portal-label-sm mb-2.5 font-outfit">
                {t('fields.description')}
              </label>
              <textarea
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="portal-input rounded-2xl py-3 resize-none text-sm font-medium leading-relaxed font-outfit"
                placeholder={t('fields.descriptionPlaceholder')}
              />
            </div>

            <div className="flex items-center gap-3 py-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                className="portal-focus-ring w-5 h-5 rounded-lg border-surface-300 text-primary-600 focus-visible:ring-primary-500/40 cursor-pointer"
              />
              <label
                htmlFor="isActive"
                className="text-sm font-bold text-surface-700 dark:text-surface-300 font-outfit cursor-pointer"
              >
                {t('fields.active')}
              </label>
            </div>
          </ModalBody>

          <ModalFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1 font-outfit"
            >
              {t('actions.cancel')}
            </Button>
            <Button
              type="submit"
              loading={loading}
              className="flex-1 font-outfit shadow-xl shadow-primary-500/20"
            >
              <Save size={18} className="me-2" />
              {service ? t('actions.update') : t('actions.create')}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </ModalBackdrop>
  );
}
