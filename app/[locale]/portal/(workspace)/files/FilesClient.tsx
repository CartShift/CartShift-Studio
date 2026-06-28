'use client';

import { useState } from 'react';
import {
  FileText,
  Image as ImageIcon,
  Upload,
  Download,
  Share2,
  Trash2,
  Loader2,
  FileArchive,
  FileCode,
  File,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatFileSize } from '@/lib/services/portal-files';
import { format } from 'date-fns';
import { getDateLocale } from '@/lib/locale-config';
import { UploadFileForm } from '@/components/portal/forms/UploadFileForm';
import { useTranslations, useLocale } from 'next-intl';
import { useResolvedOrgId } from '@/lib/hooks/useResolvedOrgId';
import { useOrgFiles } from '@/lib/hooks/useOrgFiles';
import { useFileMutations } from '@/lib/hooks/useFileMutations';
import { useConfirmDialog } from '@/lib/hooks/useConfirmDialog';
import { ImagePreviewModal } from '@/components/ui/ImagePreviewModal';
import { FileImage as PortalFileImage } from '@/components/ui/FileImage';
import { PortalPageHeader } from '@/components/portal/ui/PortalPageHeader';
import { PortalSearchField } from '@/components/portal/ui/PortalSearchField';
import {
  PortalTable,
  PortalTableBody,
  PortalTableCell,
  PortalTableElement,
  PortalTableHead,
  PortalTableHeader,
  PortalTableRow,
  PortalTableScroll,
} from '@/components/portal/ui/PortalTable';
import { IconButton } from '@/components/ui/IconButton';

export default function FilesClient() {
  const orgId = useResolvedOrgId();
  const safeOrgId = typeof orgId === 'string' ? orgId : undefined;
  const { files, loading, error, refetch } = useOrgFiles(safeOrgId);
  const { deleteFile, isDeleting: isDeletingFile } = useFileMutations(safeOrgId);
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<{
    url: string;
    name: string;
    storagePath?: string;
  } | null>(null);
  const t = useTranslations('portal');
  const locale = useLocale();

  const filteredFiles = files.filter(file =>
    file.originalName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon size={20} />;
    if (mimeType.includes('pdf')) return <FileText size={20} />;
    if (mimeType.includes('zip') || mimeType.includes('archive')) return <FileArchive size={20} />;
    if (mimeType.includes('javascript') || mimeType.includes('html') || mimeType.includes('css'))
      return <FileCode size={20} />;
    return <File size={20} />;
  };

  const handleUploadSuccess = async () => {
    setShowUploadModal(false);
    await refetch();
  };

  const handleDeleteFile = async (fileId: string, storagePath: string) => {
    const confirmed = await confirm({
      title: t('common.deleteConfirmTitle'),
      description: t('files.actions.deleteConfirm'),
      confirmText: t('common.delete'),
      cancelText: t('common.cancel'),
      variant: 'danger',
    });
    if (!confirmed) return;

    setDeletingFileId(fileId);
    try {
      await deleteFile({ fileId, storagePath });
    } catch (error) {
      console.error('Error deleting file:', error);
    } finally {
      setDeletingFileId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse" role="status" aria-live="polite">
        <span className="sr-only"> files...</span>
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-surface-200 dark:bg-surface-800 rounded-lg" />
            <div className="h-4 w-64 bg-surface-100 dark:bg-surface-800 rounded-lg" />
          </div>
          <div className="h-10 w-32 bg-surface-200 dark:bg-surface-800 rounded-xl" />
        </div>
        <div className="rounded-2xl border border-surface-200 dark:border-surface-800 overflow-hidden bg-white dark:bg-surface-950">
          <div className="p-5 border-b border-surface-100 dark:border-surface-800 flex justify-between">
            <div className="h-10 w-full md:w-96 bg-surface-100 dark:bg-surface-800 rounded-2xl" />
            <div className="h-8 w-24 bg-surface-100 dark:bg-surface-800 rounded-xl" />
          </div>
          <div className="p-0">
            <SkeletonTable rows={5} columns={5} />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500" />
        <h2 className="text-xl font-bold text-surface-900 dark:text-white font-outfit">
          {t('files.error.title')}
        </h2>
        <p className="text-surface-500 max-w-sm font-medium">{error}</p>
        <Button onClick={() => window.location.reload()}>{t('files.error.retry')}</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {ConfirmDialog}

      <PortalPageHeader
        title={t('files.title')}
        description={t('files.subtitle')}
        className="mb-0"
        action={
          <Button onClick={() => setShowUploadModal(true)} leftIcon={<Upload size={18} />}>
            {t('files.upload')}
          </Button>
        }
      />

      <Card
        noPadding
        className="border-surface-200 dark:border-surface-800 shadow-sm overflow-hidden bg-white dark:bg-surface-950"
      >
        <div className="p-5 border-b border-surface-100 dark:border-surface-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-50/30 dark:bg-surface-900/30">
          <PortalSearchField
            className="w-full md:w-96"
            placeholder={t('files.searchPlaceholder')}
            value={searchQuery}
            onChange={setSearchQuery}
            inputClassName="rounded-2xl py-2.5"
          />
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 text-[10px] font-black text-surface-500 uppercase tracking-widest">
              {files.length}{' '}
              {files.length === 1 ? t('files.totalFiles_singular') : t('files.totalFiles')}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {filteredFiles.length > 0 ? (
            <>
              {/* Mobile View: Cards */}
              <div className="md:hidden space-y-4 p-4">
                {filteredFiles.map(file => (
                  <div
                    key={file.id}
                    className="p-4 rounded-xl bg-surface-50/50 dark:bg-surface-900/30 border border-surface-200 dark:border-surface-800"
                  >
                    <div className="flex items-start gap-4 mb-3">
                      {file.mimeType.startsWith('image/') ? (
                        <button
                          onClick={() =>
                            setPreviewImage({
                              url: file.url,
                              name: file.originalName,
                              storagePath: file.storagePath,
                            })
                          }
                          className="w-16 h-16 rounded-2xl overflow-hidden bg-surface-100 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 flex-shrink-0 shadow-sm cursor-pointer"
                        >
                          <PortalFileImage
                            src={file.url}
                            storagePath={file.storagePath}
                            alt={file.originalName}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ) : (
                        <div className="w-16 h-16 rounded-2xl bg-surface-100 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 flex items-center justify-center text-surface-400 flex-shrink-0 shadow-sm">
                          {getIcon(file.mimeType)}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-surface-900 dark:text-white block truncate mb-1 font-outfit leading-tight">
                          {file.originalName}
                        </span>
                        <div className="flex flex-wrap gap-2 mb-1">
                          <Badge
                            variant="gray"
                            className="text-[9px] font-black border-surface-200 dark:border-surface-800"
                          >
                            {file.mimeType.split('/').pop()?.toUpperCase() || t('common.file')}
                          </Badge>
                          <span className="text-xs font-bold text-surface-500 font-outfit">
                            {formatFileSize(file.size)}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-surface-400 uppercase tracking-tighter block">
                          {t('files.table.addedBy')}{' '}
                          {file.uploadedByName || t('files.table.system')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-surface-100 dark:border-surface-800">
                      <span className="text-[10px] font-bold text-surface-500 dark:text-surface-400 uppercase tracking-tight">
                        {file.uploadedAt?.toDate
                          ? format(file.uploadedAt.toDate(), 'MMM d, yyyy', {
                              locale: getDateLocale(locale),
                            })
                          : t('common.recently')}
                      </span>

                      <div className="flex items-center gap-2">
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="portal-focus-ring w-11 h-11 flex items-center justify-center text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20"
                        >
                          <Download size={16} />
                        </a>
                        <button className="w-8 h-8 flex items-center justify-center text-surface-400 hover:text-emerald-500 transition-colors rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
                          <Share2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteFile(file.id, file.storagePath)}
                          disabled={deletingFileId === file.id || isDeletingFile}
                          className="w-8 h-8 flex items-center justify-center text-surface-400 hover:text-rose-500 transition-colors rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 disabled:opacity-50"
                        >
                          {deletingFileId === file.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop View: Table */}
              <PortalTable className="hidden md:block border-0 shadow-none bg-transparent rounded-none">
                <PortalTableScroll>
                  <PortalTableElement>
                    <PortalTableHeader>
                      <PortalTableRow>
                        <PortalTableHead headStyle="label">
                          {t('files.table.identity')}
                        </PortalTableHead>
                        <PortalTableHead headStyle="label">
                          {t('files.table.metadata')}
                        </PortalTableHead>
                        <PortalTableHead headStyle="label">
                          {t('files.table.format')}
                        </PortalTableHead>
                        <PortalTableHead headStyle="label">
                          {t('files.table.transmission')}
                        </PortalTableHead>
                        <PortalTableHead headStyle="label" cellAlign="end">
                          {t('files.table.actions')}
                        </PortalTableHead>
                      </PortalTableRow>
                    </PortalTableHeader>
                    <PortalTableBody>
                      {filteredFiles.map(file => (
                        <PortalTableRow key={file.id} hover={true}>
                          <PortalTableCell className="py-5">
                            <div className="flex items-center gap-4">
                              {file.mimeType.startsWith('image/') ? (
                                <button
                                  onClick={() =>
                                    setPreviewImage({
                                      url: file.url,
                                      name: file.originalName,
                                      storagePath: file.storagePath,
                                    })
                                  }
                                  className="w-12 h-12 rounded-2xl overflow-hidden bg-surface-100 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 flex-shrink-0 shadow-sm hover:scale-105 transition-all cursor-pointer"
                                  title={t('common.view')}
                                >
                                  <PortalFileImage
                                    src={file.url}
                                    storagePath={file.storagePath}
                                    alt={file.originalName}
                                    className="w-full h-full object-cover"
                                  />
                                </button>
                              ) : (
                                <div className="w-12 h-12 rounded-2xl bg-surface-100 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 flex items-center justify-center text-surface-400 transition-all shadow-sm">
                                  {getIcon(file.mimeType)}
                                </div>
                              )}
                              <div className="flex flex-col min-w-0">
                                <span className="font-bold text-surface-900 dark:text-white transition-colors truncate max-w-[200px] md:max-w-xs font-outfit leading-tight">
                                  {file.originalName}
                                </span>
                                <span className="text-[10px] font-bold text-surface-400 uppercase tracking-tighter mt-1">
                                  {t('files.table.addedBy')}{' '}
                                  {file.uploadedByName || t('files.table.system')}
                                </span>
                              </div>
                            </div>
                          </PortalTableCell>
                          <PortalTableCell className="py-5">
                            <span className="text-sm font-bold text-surface-600 dark:text-surface-300 font-outfit">
                              {formatFileSize(file.size)}
                            </span>
                          </PortalTableCell>
                          <PortalTableCell className="py-5">
                            <Badge
                              variant="gray"
                              className="text-[9px] font-black border-surface-200 dark:border-surface-800"
                            >
                              {file.mimeType.split('/').pop()?.toUpperCase() || t('common.file')}
                            </Badge>
                          </PortalTableCell>
                          <PortalTableCell className="py-5">
                            <span className="text-[11px] font-bold text-surface-500 dark:text-surface-400 uppercase tracking-tight">
                              {file.uploadedAt?.toDate
                                ? format(file.uploadedAt.toDate(), 'MMM d, yyyy', {
                                    locale: getDateLocale(locale),
                                  })
                                : t('common.recently')}
                            </span>
                          </PortalTableCell>
                          <PortalTableCell cellAlign="end" className="py-5">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                              {file.mimeType.startsWith('image/') ? (
                                <IconButton
                                  icon={Eye}
                                  label={t('common.view')}
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    setPreviewImage({
                                      url: file.url,
                                      name: file.originalName,
                                      storagePath: file.storagePath,
                                    })
                                  }
                                />
                              ) : null}
                              <a
                                href={file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="portal-focus-ring w-8 h-8 flex items-center justify-center text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/20"
                                title={t('files.actions.download')}
                              >
                                <Download size={16} />
                              </a>
                              <IconButton
                                icon={Share2}
                                label={t('files.actions.share')}
                                variant="success"
                                size="sm"
                              />
                              <IconButton
                                icon={Trash2}
                                label={t('files.actions.delete')}
                                variant="danger"
                                size="sm"
                                loading={deletingFileId === file.id}
                                onClick={() => handleDeleteFile(file.id, file.storagePath)}
                              />
                            </div>
                          </PortalTableCell>
                        </PortalTableRow>
                      ))}
                    </PortalTableBody>
                  </PortalTableElement>
                </PortalTableScroll>
              </PortalTable>
            </>
          ) : (
            <EmptyState
              icon={FileText}
              title={t('files.empty.title')}
              description={searchQuery ? t('files.empty.search') : t('files.empty.noFiles')}
              action={
                !searchQuery && (
                  <Button
                    onClick={() => setShowUploadModal(true)}
                    variant="outline"
                    size="sm"
                    className="mt-6 font-outfit border-surface-200 dark:border-surface-800"
                  >
                    {t('files.empty.uploadFirst')}
                  </Button>
                )
              }
              className="py-24"
            />
          )}
        </div>
      </Card>

      {showUploadModal && safeOrgId && (
        <UploadFileForm
          orgId={safeOrgId}
          onSuccess={handleUploadSuccess}
          onCancel={() => setShowUploadModal(false)}
        />
      )}

      <ImagePreviewModal
        imageUrl={previewImage?.url || ''}
        imageName={previewImage?.name || ''}
        storagePath={previewImage?.storagePath}
        isOpen={!!previewImage}
        onClose={() => setPreviewImage(null)}
      />
    </div>
  );
}
