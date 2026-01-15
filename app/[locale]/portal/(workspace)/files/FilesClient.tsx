'use client';

import { useState, useEffect } from 'react';
import {
  FileText,
  Image as ImageIcon,
  Search,
  Upload,
  Download,
  Share2,
  Trash2,
  Loader2,
  FileArchive,
  FileCode,
  File,
  AlertCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { getFilesByOrg, formatFileSize, deleteFile } from '@/lib/services/portal-files';
import { FileAttachment } from '@/lib/types/portal';
import { format } from 'date-fns';
import { getDateLocale } from '@/lib/locale-config';
import { UploadFileForm } from '@/components/portal/forms/UploadFileForm';
import { useTranslations, useLocale } from 'next-intl';
import { useResolvedOrgId } from '@/lib/hooks/useResolvedOrgId';
import { ImagePreviewModal } from '@/components/ui/ImagePreviewModal';
import { FileImage as PortalFileImage } from '@/components/ui/FileImage';

export default function FilesClient() {
  const orgId = useResolvedOrgId();
  const [files, setFiles] = useState<FileAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [deletingFile, setDeletingFile] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<{
    url: string;
    name: string;
    storagePath?: string;
  } | null>(null);
  const t = useTranslations();
  const locale = useLocale();

  useEffect(() => {
    async function fetchFiles() {
      if (!orgId || typeof orgId !== 'string') return;

      setLoading(true);
      setError(null);
      try {
        const data = await getFilesByOrg(orgId);
        setFiles(data);
      } catch (err) {
        console.error('Error fetching files:', err);
        setError(t('portal.common.error'));
      } finally {
        setLoading(false);
      }
    }

    fetchFiles();
  }, [orgId]);

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
    if (orgId && typeof orgId === 'string') {
      const data = await getFilesByOrg(orgId);
      setFiles(data);
    }
  };

  const handleDeleteFile = async (fileId: string, storagePath: string) => {
    if (!confirm(t('portal.files.actions.deleteConfirm'))) return;

    setDeletingFile(fileId);
    try {
      await deleteFile(fileId, storagePath);
      if (orgId && typeof orgId === 'string') {
        const data = await getFilesByOrg(orgId);
        setFiles(data);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      alert(t('portal.files.actions.deleteFailed'));
    } finally {
      setDeletingFile(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse" role="status" aria-live="polite">
        <span className="sr-only">Loading files...</span>
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
          {t('portal.files.error.title')}
        </h2>
        <p className="text-surface-500 max-w-sm font-medium">{error}</p>
        <Button onClick={() => window.location.reload()}>{t('portal.files.error.retry')}</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-surface-900 dark:text-white font-outfit">
            {t('portal.files.title')}
          </h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1 font-medium">
            {t('portal.files.subtitle')}
          </p>
        </div>
        <Button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 shadow-lg shadow-blue-500/20 font-outfit"
        >
          <Upload size={18} />
          {t('portal.files.upload')}
        </Button>
      </div>

      <Card
        noPadding
        className="border-surface-200 dark:border-surface-800 shadow-sm overflow-hidden bg-white dark:bg-surface-950"
      >
        <div className="p-5 border-b border-surface-100 dark:border-surface-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-50/30 dark:bg-surface-900/30">
          <div className="relative w-full md:w-96">
            <Search
              size={18}
              className="absolute start-4 top-1/2 -translate-y-1/2 text-surface-400"
            />
            <input
              type="text"
              placeholder={t('portal.files.searchPlaceholder')}
              className="w-full ps-11 pe-4 py-2.5 rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-surface-900 dark:text-white"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 text-[10px] font-black text-surface-500 uppercase tracking-widest">
              {files.length} {t('portal.files.totalFiles')}
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
                            {file.mimeType.split('/').pop()?.toUpperCase() ||
                              t('portal.common.file' as any)}
                          </Badge>
                          <span className="text-xs font-bold text-surface-500 font-outfit">
                            {formatFileSize(file.size)}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-surface-400 uppercase tracking-tighter block">
                          {t('portal.files.table.addedBy')}{' '}
                          {file.uploadedByName || t('portal.files.table.system')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-surface-100 dark:border-surface-800">
                      <span className="text-[10px] font-bold text-surface-500 dark:text-surface-400 uppercase tracking-tight">
                        {file.uploadedAt?.toDate
                          ? format(file.uploadedAt.toDate(), 'MMM d, yyyy', {
                              locale: getDateLocale(locale),
                            })
                          : t('portal.files.recentlyAdded')}
                      </span>

                      <div className="flex items-center gap-2">
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-8 h-8 flex items-center justify-center text-surface-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        >
                          <Download size={16} />
                        </a>
                        <button className="w-8 h-8 flex items-center justify-center text-surface-400 hover:text-emerald-500 transition-colors rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
                          <Share2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteFile(file.id, file.storagePath)}
                          disabled={deletingFile === file.id}
                          className="w-8 h-8 flex items-center justify-center text-surface-400 hover:text-rose-500 transition-colors rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 disabled:opacity-50"
                        >
                          {deletingFile === file.id ? (
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
              <table className="hidden md:table w-full text-start">
                <thead>
                  <tr className="bg-surface-50/50 dark:bg-surface-900/50">
                    <th className="px-6 py-4 text-[10px] font-black text-surface-400 uppercase tracking-widest font-outfit">
                      {t('portal.files.table.identity')}
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-surface-400 uppercase tracking-widest font-outfit">
                      {t('portal.files.table.metadata')}
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-surface-400 uppercase tracking-widest font-outfit">
                      {t('portal.files.table.format')}
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-surface-400 uppercase tracking-widest font-outfit">
                      {t('portal.files.table.transmission')}
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-surface-400 uppercase tracking-widest font-outfit text-end">
                      {t('portal.files.table.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                  {filteredFiles.map(file => (
                    <tr
                      key={file.id}
                      className="hover:bg-surface-50/50 dark:hover:bg-surface-900/30 transition-all group"
                    >
                      <td className="px-6 py-5">
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
                              title="Click to preview"
                            >
                              <PortalFileImage
                                src={file.url}
                                storagePath={file.storagePath}
                                alt={file.originalName}
                                className="w-full h-full object-cover"
                              />
                            </button>
                          ) : (
                            <div className="w-12 h-12 rounded-2xl bg-surface-100 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 flex items-center justify-center text-surface-400 group-hover:text-blue-500 transition-all shadow-sm">
                              {getIcon(file.mimeType)}
                            </div>
                          )}
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-surface-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate max-w-[200px] md:max-w-xs font-outfit leading-tight">
                              {file.originalName}
                            </span>
                            <span className="text-[10px] font-bold text-surface-400 uppercase tracking-tighter mt-1">
                              {t('portal.files.table.addedBy')}{' '}
                              {file.uploadedByName || t('portal.files.table.system')}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-sm font-bold text-surface-600 dark:text-surface-300 font-outfit">
                          {formatFileSize(file.size)}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <Badge
                          variant="gray"
                          className="text-[9px] font-black border-surface-200 dark:border-surface-800"
                        >
                          {file.mimeType.split('/').pop()?.toUpperCase() ||
                            t('portal.common.file' as any)}
                        </Badge>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-[11px] font-bold text-surface-500 dark:text-surface-400 uppercase tracking-tight">
                          {file.uploadedAt?.toDate
                            ? format(file.uploadedAt.toDate(), 'MMM d, yyyy', {
                                locale: getDateLocale(locale),
                              })
                            : t('portal.files.recentlyAdded')}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-end">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-9 h-9 flex items-center justify-center text-surface-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-transparent hover:border-blue-100 dark:hover:border-blue-900/30"
                            title="Download"
                          >
                            <Download size={16} />
                          </a>
                          <button
                            className="w-9 h-9 flex items-center justify-center text-surface-400 hover:text-emerald-500 transition-colors rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20 border border-transparent hover:border-emerald-100 dark:hover:border-emerald-900/30"
                            title="Share"
                          >
                            <Share2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteFile(file.id, file.storagePath)}
                            disabled={deletingFile === file.id}
                            className="w-9 h-9 flex items-center justify-center text-surface-400 hover:text-rose-500 transition-colors rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/20 border border-transparent hover:border-rose-100 dark:hover:border-rose-900/30 disabled:opacity-50"
                            title={t('portal.files.actions.delete')}
                          >
                            {deletingFile === file.id ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <EmptyState
              icon={FileText}
              title={t('portal.files.empty.title')}
              description={
                searchQuery ? t('portal.files.empty.search') : t('portal.files.empty.noFiles')
              }
              action={
                !searchQuery && (
                  <Button
                    onClick={() => setShowUploadModal(true)}
                    variant="outline"
                    size="sm"
                    className="mt-6 font-outfit border-surface-200 dark:border-surface-800"
                  >
                    {t('portal.files.empty.uploadFirst')}
                  </Button>
                )
              }
              className="py-24"
            />
          )}
        </div>
      </Card>

      {showUploadModal && orgId && typeof orgId === 'string' && (
        <UploadFileForm
          orgId={orgId}
          onSuccess={handleUploadSuccess}
          onCancel={() => setShowUploadModal(false)}
        />
      )}

      {/* Image Preview Modal */}
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
