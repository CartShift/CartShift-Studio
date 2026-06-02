'use client';

import { useState, useEffect } from 'react';
import {
  Paperclip,
  File,
  Download,
  Trash2,
  History,
  Loader2,
  ChevronUp,
  Image as ImageIcon,
  Film,
  Music,
  FileText,
} from 'lucide-react';
import { FileAttachment, Request } from '@/lib/types/portal';
import {
  subscribeToRequestFiles,
  deleteFile,
  formatFileSize,
  getFileIcon,
} from '@/lib/services/portal-files';
import { Card } from '@/components/ui/Card';
import { FileImage } from '@/components/ui/FileImage';
import { format } from 'date-fns';
import { useTranslations } from 'next-intl';
import { ImagePreviewModal } from '@/components/ui/ImagePreviewModal';

interface RequestAttachmentsProps {
  request: Request;
  isAgency: boolean;
  orgId: string;
}

export function RequestAttachments({ request, isAgency, orgId }: RequestAttachmentsProps) {
  const t = useTranslations();
  const [files, setFiles] = useState<FileAttachment[]>([]);
  const [loading, set] = useState(true);
  const [expandedFileId, setExpandedFileId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<{
    url: string;
    name: string;
    storagePath?: string;
  } | null>(null);

  useEffect(() => {
    if (!orgId) return;
    const unsubscribe = subscribeToRequestFiles(
      request.id,
      data => {
        setFiles(data);
        set(false);
      },
      orgId
    );
    return () => unsubscribe();
  }, [request.id, orgId]);

  // Group files by originalName to show versions
  const groupedFiles = files.reduce(
    (acc, file) => {
      if (!acc[file.originalName]) {
        acc[file.originalName] = [];
      }
      acc[file.originalName].push(file);
      return acc;
    },
    {} as Record<string, FileAttachment[]>
  );

  // Sort versions within each group (highest version first)
  Object.keys(groupedFiles).forEach(key => {
    groupedFiles[key].sort((a, b) => (b.version || 0) - (a.version || 0));
  });

  const handleDelete = async (file: FileAttachment) => {
    if (!confirm(t('portal.files.actions.deleteConfirm'))) return;
    try {
      await deleteFile(file.id, file.storagePath);
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  const getIcon = (mime: string) => {
    const type = getFileIcon(mime);
    switch (type) {
      case 'Image':
        return <ImageIcon size={18} />;
      case 'Video':
        return <Film size={18} />;
      case 'Music':
        return <Music size={18} />;
      case 'FileText':
        return <FileText size={18} />;
      default:
        return <File size={18} />;
    }
  };

  return (
    <Card className="border-surface-200 dark:border-surface-800 shadow-sm bg-white dark:bg-surface-950">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-surface-900 dark:text-white font-outfit">
            {t('portal.requests.detail.assetsTitle')}
          </h3>
          <p className="portal-label-sm text-[10px] mt-1">
            {t('portal.requests.detail.assetsSubtitle')}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        </div>
      ) : Object.keys(groupedFiles).length > 0 ? (
        <div className="space-y-3">
          {Object.entries(groupedFiles).map(([fileName, versions]) => {
            const latest = versions[0];
            const hasHistory = versions.length > 1;
            const isExpanded = expandedFileId === fileName;

            return (
              <div
                key={fileName}
                className="group flex flex-col border border-surface-100 dark:border-surface-800 rounded-2xl overflow-hidden shadow-sm hover:border-surface-200 dark:hover:border-surface-700 transition-all"
              >
                <div className="p-4 bg-white dark:bg-surface-950 flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    {latest.mimeType.startsWith('image/') ? (
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewImage({
                            url: latest.url,
                            name: fileName,
                            storagePath: latest.storagePath,
                          })
                        }
                        aria-label={t('portal.accessibility.previewFile')}
                        className="portal-focus-ring w-12 h-12 rounded-xl overflow-hidden bg-surface-50 dark:bg-surface-900 border border-surface-100 dark:border-surface-800 flex-shrink-0 group-hover:border-primary-100 dark:group-hover:border-primary-900/30 transition-all hover:scale-105 cursor-pointer outline-none"
                      >
                        <FileImage
                          src={latest.url}
                          storagePath={latest.storagePath}
                          alt={fileName}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ) : (
                      <div className="p-2.5 rounded-xl bg-surface-50 dark:bg-surface-900 text-surface-400 border border-surface-100 dark:border-surface-800 group-hover:text-primary-500 group-hover:border-primary-100 dark:group-hover:border-primary-900/30 transition-all">
                        {getIcon(latest.mimeType)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-surface-900 dark:text-white font-outfit truncate">
                          {fileName}
                        </span>
                        {hasHistory && (
                          <span className="text-[9px] font-black text-primary-600 bg-primary-50 dark:bg-primary-900/20 px-1.5 py-0.5 rounded border border-primary-100 dark:border-primary-900/30">
                            v{latest.version}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] font-medium text-surface-400 flex items-center gap-2 mt-0.5 uppercase tracking-tighter">
                        {formatFileSize(latest.size)}
                        <span className="w-0.5 h-0.5 rounded-full bg-surface-300" />
                        {latest.uploadedAt?.toDate
                          ? format(latest.uploadedAt.toDate(), 'MMM d, h:mm a')
                          : t('portal.common.recently')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {hasHistory && (
                      <button
                        type="button"
                        onClick={() => setExpandedFileId(isExpanded ? null : fileName)}
                        aria-expanded={isExpanded}
                        aria-label={t('portal.accessibility.showVersionHistory')}
                        className="portal-focus-ring p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-surface-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all"
                      >
                        {isExpanded ? <ChevronUp size={16} /> : <History size={16} />}
                      </button>
                    )}
                    <a
                      href={latest.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={t('portal.accessibility.downloadFile')}
                      className="portal-focus-ring p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-surface-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all"
                    >
                      <Download size={16} />
                    </a>
                    {isAgency && (
                      <button
                        type="button"
                        onClick={() => handleDelete(latest)}
                        aria-label={t('portal.files.actions.delete')}
                        className="portal-focus-ring p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-surface-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="bg-surface-50/50 dark:bg-surface-900/30 border-t border-surface-100 dark:border-surface-800 p-2 space-y-1">
                    <p className="px-2 py-1 text-[9px] font-black text-surface-400 uppercase tracking-widest">
                      {t('portal.requests.detail.versionHistory')}
                    </p>
                    {versions.slice(1).map(v => (
                      <div
                        key={v.id}
                        className="p-2 flex items-center justify-between hover:bg-white dark:hover:bg-surface-900 rounded-xl transition-all group/v"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-[9px] font-black text-surface-400 uppercase">
                            v{v.version}
                          </span>
                          <span className="text-[10px] font-bold text-surface-500 uppercase tracking-tighter">
                            {v.uploadedAt?.toDate
                              ? format(v.uploadedAt.toDate(), 'MMM d, yyyy')
                              : t('portal.common.recently')}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover/v:opacity-100 transition-opacity">
                          <a
                            href={v.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={t('portal.accessibility.downloadFile')}
                            className="portal-focus-ring p-1.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-surface-400 hover:text-primary-500 rounded-lg transition-all"
                          >
                            <Download size={14} />
                          </a>
                          {isAgency && (
                            <button
                              type="button"
                              onClick={() => handleDelete(v)}
                              aria-label={t('portal.files.actions.delete')}
                              className="portal-focus-ring p-1.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-surface-400 hover:text-rose-500 rounded-lg transition-all"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-12 text-center bg-surface-50/50 dark:bg-surface-900/30 rounded-3xl border-2 border-dashed border-surface-200 dark:border-surface-800">
          <Paperclip className="w-12 h-12 text-surface-300 dark:text-surface-700 mx-auto mb-3 opacity-20" />
          <h4 className="text-sm font-bold text-surface-900 dark:text-white font-outfit">
            {t('portal.requests.detail.noAttachments')}
          </h4>
          <p className="text-xs text-surface-500 dark:text-surface-400">
            {t('portal.requests.detail.noAttachmentsDesc')}
          </p>
        </div>
      )}

      {/* Image Preview Modal */}
      <ImagePreviewModal
        imageUrl={previewImage?.url || ''}
        imageName={previewImage?.name || ''}
        storagePath={previewImage?.storagePath}
        isOpen={!!previewImage}
        onClose={() => setPreviewImage(null)}
      />
    </Card>
  );
}
