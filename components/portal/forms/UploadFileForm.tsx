'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { X, Upload as UploadIcon, File, Loader2 } from 'lucide-react';
import { uploadFile } from '@/lib/services/portal-files';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { useTranslations } from 'next-intl';
import {
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@/components/ui/ModalBackdrop';

interface UploadFileFormProps {
  orgId: string;
  requestId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const UploadFileForm = ({ orgId, requestId, onSuccess, onCancel }: UploadFileFormProps) => {
  const { user, userData } = usePortalAuth();
  const t = useTranslations();
  const [loading, set] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError(t('portal.files.uploadForm.errorSize'));
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;

    set(true);
    setError(null);
    setUploadProgress(0);

    try {
      const userName = userData?.name || user.displayName || t('portal.common.unknownUser');

      // Clear any existing interval
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }

      // Note: Progress tracking simulation since uploadFile doesn't support callbacks
      progressIntervalRef.current = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      await uploadFile(orgId, user.uid, userName, selectedFile, {
        requestId,
      });

      // Clear interval and set complete
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      setUploadProgress(100);
      onSuccess();
    } catch (error: unknown) {
      console.error('Upload error:', error);
      setError(error instanceof Error ? error.message : t('portal.files.uploadForm.errorGeneric'));
    } finally {
      set(false);
      // Clear interval on error as well
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <ModalBackdrop isOpen={true} onClick={onCancel} zIndex="50">
      <ModalContent maxWidth="lg" onClick={e => e.stopPropagation()}>
        <ModalHeader title={t('portal.files.uploadForm.title')} onClose={onCancel} />

        <ModalBody>
          <div className="space-y-5">
            {!selectedFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-surface-300 dark:border-surface-700 rounded-xl p-12 text-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all group"
              >
                <UploadIcon className="w-12 h-12 text-surface-300 dark:text-surface-700 mx-auto mb-4 group-hover:text-blue-500 transition-colors" />
                <p className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1">
                  {t('portal.files.uploadForm.browse')}
                </p>
                <p className="text-xs text-surface-500 dark:text-surface-400">
                  {t('portal.files.uploadForm.maxSize')}
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.zip,.rar"
                />
              </div>
            ) : (
              <div className="border border-surface-200 dark:border-surface-800 rounded-xl p-4 bg-surface-50 dark:bg-surface-900/50">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <File className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-surface-900 dark:text-white truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-surface-500 dark:text-surface-400">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                  {!loading && (
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="p-2 hover:bg-surface-200 dark:hover:bg-surface-800 rounded-lg transition-colors"
                    >
                      <X size={16} className="text-surface-500" />
                    </button>
                  )}
                </div>

                {loading && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-surface-600 dark:text-surface-400 mb-2">
                      <span>{t('portal.files.uploadForm.uploading')}</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="h-2 bg-surface-200 dark:bg-surface-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}
          </div>
        </ModalBody>

        <ModalFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="flex-1"
          >
            {t('portal.files.uploadForm.cancel')}
          </Button>
          <Button
            type="button"
            onClick={handleUpload}
            disabled={!selectedFile || loading}
            loading={loading}
            className="flex-1"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('portal.files.uploadForm.uploading')}
              </>
            ) : (
              t('portal.files.uploadForm.submit')
            )}
          </Button>
        </ModalFooter>
      </ModalContent>
    </ModalBackdrop>
  );
};
