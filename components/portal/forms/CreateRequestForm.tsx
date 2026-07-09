'use client';

import { useState, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { RequestFormCoreFields } from '@/components/portal/forms/RequestFormCoreFields';
import { CreateRequestData } from '@/lib/types/portal';
import { updateRequest } from '@/lib/services/portal-requests';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { useRequestMutations } from '@/lib/hooks/useRequestMutations';
import { trackPortalRequestCreate } from '@/lib/analytics';
import { useAgencyClients } from '@/lib/hooks/useAgencyClients';
import {
  AlertCircle,
  CheckCircle2,
  Layout,
  Zap,
  Bug,
  Sparkles,
  FileText,
  Send,
  Loader2,
  Paperclip,
  X,
  File,
  Plus,
} from 'lucide-react';
import { usePortalTranslations } from '@/lib/i18n/translations';
import { uploadMultipleFiles, formatFileSize } from '@/lib/services/portal-files';
import { getPortalPath } from '@/lib/utils/portal-paths';
import { CardSectionTitle } from '@/components/ui/Card';

type RequestFormData = {
  title: string;
  description: string;
  type: 'feature' | 'bug' | 'optimization' | 'content' | 'design' | 'other';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
};

interface CreateRequestFormProps {
  orgId: string;
}

export const CreateRequestForm = ({ orgId }: CreateRequestFormProps) => {
  const [loading, set] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { user, userData, isAgency } = usePortalAuth();
  const { createRequest } = useRequestMutations(orgId);
  const { organizations: clients } = useAgencyClients();
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const t = usePortalTranslations();

  const requestSchema = useMemo(
    () =>
      z.object({
        title: z
          .string()
          .min(5, t('requests.form.errors.titleShort'))
          .max(200, t('requests.form.errors.titleLong')),
        description: z.string().min(20, t('requests.form.errors.descShort')),
        type: z.enum(['feature', 'bug', 'optimization', 'content', 'design', 'other'], {
          message: t('requests.form.errors.typeRequired'),
        }),
        priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']),
      }),
    [t]
  );

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      priority: 'NORMAL',
    },
  });

  const onSubmit = async (data: RequestFormData) => {
    if (!user) {
      setError(t('requests.form.errors.auth'));
      return;
    }

    set(true);
    setError(null);

    try {
      const userName =
        userData?.name ||
        user.displayName ||
        user.email?.split('@')[0] ||
        t('common.unknown');

      // 1. Create the request
      const targetOrgId = isAgency && selectedClientId ? selectedClientId : orgId;
      if (!targetOrgId) {
        setError(t('requests.form.errors.clientRequired'));
        set(false);
        return;
      }
      const request = await createRequest({
        targetOrgId,
        userId: user.uid,
        userName,
        data: {
          title: data.title,
          description: data.description,
          type: data.type as CreateRequestData['type'],
          priority: data.priority as CreateRequestData['priority'],
        },
      });

      // 2. Upload files if any
      if (selectedFiles.length > 0) {
        setUploadProgress(10); // Start progress
        const uploadedFiles = await uploadMultipleFiles(
          targetOrgId,
          user.uid,
          userName,
          selectedFiles,
          {
            requestId: request.id,
          }
        );

        const fileIds = uploadedFiles.map(f => f.id);

        // 3. Link files to request
        await updateRequest(request.id, { attachmentIds: fileIds });
        setUploadProgress(100);
      }

      // Track analytics
      trackPortalRequestCreate(data.type);

      setSuccess(true);

      // Short delay before redirecting for better UX
      setTimeout(() => {
        router.push(getPortalPath(`/requests/${request.id}/`));
      }, 1500);
    } catch (error: unknown) {
      console.error('Create request error:', error);
      setError(error instanceof Error ? error.message : t('requests.form.errors.generic'));
    } finally {
      set(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const typeOptions = [
    { value: 'design', label: t('requests.type.design'), icon: <Layout size={14} /> },
    { value: 'feature', label: t('requests.type.feature'), icon: <Sparkles size={14} /> },
    { value: 'bug', label: t('requests.type.bug'), icon: <Bug size={14} /> },
    {
      value: 'optimization',
      label: t('requests.type.optimization'),
      icon: <Zap size={14} />,
    },
    { value: 'content', label: t('requests.type.content'), icon: <FileText size={14} /> },
    { value: 'other', label: t('requests.type.other'), icon: <Send size={14} /> },
  ];

  if (success) {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 animate-in zoom-in duration-300">
        <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-100 dark:border-emerald-500/20 shadow-lg shadow-emerald-500/10">
          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold text-surface-900 dark:text-white font-outfit">
          {t('requests.form.successTitle')}
        </h2>
        <p className="text-surface-500 dark:text-surface-400 font-medium max-w-xs">
          {t('requests.form.successDesc')}
        </p>
        <div className="pt-4 flex items-center gap-2 portal-label-sm text-[10px] animate-pulse">
          <Loader2 size={12} className="animate-spin" />
          {t('requests.form.redirecting')}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-6">
        {isAgency && clients.length > 0 && (
          <Select
            label={t('requests.form.clientLabel')}
            value={selectedClientId}
            onChange={e => setSelectedClientId(e.target.value)}
            options={[
              { value: '', label: t('requests.form.clientSelect') },
              ...clients.map(client => ({ value: client.id, label: client.name })),
            ]}
          />
        )}
        <RequestFormCoreFields
          register={register}
          errors={errors}
          typeOptions={typeOptions.map(opt => ({ value: opt.value, label: String(opt.label) }))}
          titleClassName="text-lg font-bold font-outfit"
        />

        {/* Attachments Section */}
        <div className="space-y-4 pt-4 border-t border-surface-100 dark:border-surface-800">
          <div className="flex items-center justify-between px-1">
            <CardSectionTitle icon={Paperclip} iconClassName="text-primary-500">
              {t('requests.new.attachments')}
            </CardSectionTitle>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Upload Trigger */}
            <button
              type="button"
              onClick={openFilePicker}
              className="portal-focus-ring w-full border-2 border-dashed border-surface-200 dark:border-surface-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:border-primary-500 dark:hover:border-primary-400 hover:bg-primary-50/50 dark:hover:bg-primary-900/10 transition-all cursor-pointer group outline-none"
            >
              <input
                type="file"
                multiple
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileSelect}
              />
              <div className="w-10 h-10 rounded-xl bg-surface-50 dark:bg-surface-900 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-white dark:group-hover:bg-surface-800 transition-all">
                <Plus className="text-surface-400 group-hover:text-primary-500" size={20} />
              </div>
              <p className="text-sm font-bold text-surface-900 dark:text-white font-outfit">
                {t('requests.new.uploadText')}
              </p>
              <p className="text-[10px] text-surface-500 uppercase tracking-tight font-medium mt-1">
                {t('requests.new.uploadSubtext')}
              </p>
            </button>

            {/* Selected Files List */}
            <div className="space-y-2 max-h-[160px] overflow-y-auto portal-scrollbar pe-2">
              {selectedFiles.length > 0 ? (
                selectedFiles.map((file, idx) => (
                  <div
                    key={`${file.name}-${idx}`}
                    className="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-900/50 rounded-xl border border-surface-100 dark:border-surface-800 animate-in slide-in-from-end-2 duration-300"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-white dark:bg-surface-800 text-surface-400 shadow-sm">
                        <File size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-surface-900 dark:text-white truncate max-w-[150px] font-outfit">
                          {file.name}
                        </p>
                        <p className="text-[10px] font-medium text-surface-400 uppercase italic">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        removeFile(idx);
                      }}
                      className="portal-focus-ring p-1.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-surface-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-30 text-center grayscale py-8">
                  <File size={24} className="mb-2" />
                  <p className="text-[10px] font-black uppercase tracking-widest">
                    {t('requests.detail.noAssets')}
                  </p>
                </div>
              )}
            </div>
          </div>

          {loading && uploadProgress > 0 && (
            <div className="space-y-1.5 animate-in fade-in duration-300">
              <div className="flex justify-between text-[10px] font-black text-primary-600 uppercase tracking-widest">
                <span>{t('files.uploadForm.uploading')}</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-1 w-full bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 transition-all duration-500"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 flex items-start gap-3">
          <AlertCircle size={18} className="text-rose-500 mt-0.5 shrink-0" />
          <p className="text-sm font-bold text-rose-600 dark:text-rose-400 font-outfit">{error}</p>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-surface-100 dark:border-surface-800 pt-6">
        <p className="hidden md:block text-[10px] font-bold text-surface-400 uppercase tracking-widest max-w-[200px]">
          {t('requests.form.footerNote')}
        </p>
        <div className="flex gap-3 w-full md:w-auto">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
            disabled={loading}
            className="flex-1 md:flex-none font-outfit"
          >
            {t('requests.form.cancel')}
          </Button>
          <Button
            type="submit"
            loading={loading}
            disabled={loading}
            className="flex-1 md:flex-none font-outfit px-10 shadow-xl shadow-primary-500/20"
          >
            {loading ? t('requests.form.submitting') : t('requests.form.submit')}
          </Button>
        </div>
      </div>
    </form>
  );
};
