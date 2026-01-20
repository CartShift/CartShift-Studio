'use client';

import { useState, useRef, useCallback } from 'react';
import { Camera, Trash2, Loader2, User, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { useTranslations } from 'next-intl';

interface ImageUploadProps {
  /** Current image URL */
  currentImageUrl?: string | null;
  /** Placeholder text when no image is set */
  placeholder?: string;
  /** Type of image - affects icon and styling */
  type?: 'avatar' | 'logo';
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Whether upload is in progress */
  isUploading?: boolean;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Called when a file is selected */
  onUpload: (file: File) => Promise<void>;
  /** Called when delete is requested */
  onDelete?: () => Promise<void>;
  /** Custom class name */
  className?: string;
  /** Labels for the UI */
  labels?: {
    upload?: string;
    change?: string;
    remove?: string;
    uploading?: string;
    dropHint?: string;
  };
}

export const ImageUpload = ({
  currentImageUrl,
  placeholder,
  type = 'avatar',
  size = 'lg',
  isUploading = false,
  disabled = false,
  onUpload,
  onDelete,
  className,
  labels = {},
}: ImageUploadProps) => {
  const t = useTranslations();
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  };

  const iconSizes = {
    sm: 20,
    md: 28,
    lg: 36,
  };

  const handleFileSelect = useCallback(
    async (file: File) => {
      setError(null);

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError(t('portal.common.selectImageFile'));
        return;
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError(t('portal.common.imageTooLarge'));
        return;
      }

      try {
        await onUpload(file);
      } catch (err) {
        setError(err instanceof Error ? err.message : t('portal.common.uploadFailed'));
      }
    },
    [onUpload]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    // Reset input so the same file can be selected again
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled || isUploading) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDelete = async () => {
    if (onDelete && !isUploading && !disabled) {
      setError(null);
      try {
        await onDelete();
      } catch (err) {
        setError(err instanceof Error ? err.message : t('portal.common.failedToRemove'));
      }
    }
  };

  const PlaceholderIcon = type === 'avatar' ? User : Building2;

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      {/* Image preview / upload area */}
      <div
        className={cn(
          'relative rounded-2xl overflow-hidden transition-all duration-200',
          sizeClasses[size],
          type === 'avatar' ? 'rounded-full' : 'rounded-2xl',
          isDragging && 'ring-4 ring-blue-500/30 scale-105',
          disabled && 'opacity-50 cursor-not-allowed',
          !disabled && !isUploading && 'cursor-pointer group'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
      >
        {currentImageUrl ? (
          <>
            <img
              src={currentImageUrl}
              alt={placeholder || t('portal.files.imageLabels.uploadedImage' as any)}
              className="w-full h-full object-cover"
            />
            {/* Hover overlay */}
            {!disabled && !isUploading && (
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="w-8 h-8 text-white" />
              </div>
            )}
          </>
        ) : (
          <div
            className={cn(
              'w-full h-full flex items-center justify-center',
              'bg-surface-100 dark:bg-surface-800 border-2 border-dashed',
              type === 'avatar' ? 'rounded-full' : 'rounded-2xl',
              isDragging
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-surface-300 dark:border-surface-700',
              !disabled &&
                !isUploading &&
                'group-hover:border-blue-500 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20'
            )}
          >
            {isUploading ? (
              <Loader2 className="animate-spin text-blue-600" size={iconSizes[size]} />
            ) : (
              <PlaceholderIcon
                className="text-surface-400 dark:text-surface-600 group-hover:text-blue-500 transition-colors"
                size={iconSizes[size]}
              />
            )}
          </div>
        )}

        {/* Upload loading overlay */}
        {isUploading && currentImageUrl && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <Loader2 className="animate-spin text-white" size={iconSizes[size]} />
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
          className="text-xs font-bold"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin me-1.5" />
              {labels.uploading || t('portal.files.imageLabels.uploading' as any)}
            </>
          ) : (
            <>
              <Camera className="w-3 h-3 me-1.5" />
              {currentImageUrl
                ? labels.change || t('portal.files.imageLabels.change' as any)
                : labels.upload || t('portal.files.imageLabels.upload' as any)}
            </>
          )}
        </Button>

        {currentImageUrl && onDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={disabled || isUploading}
            className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/20"
          >
            <Trash2 className="w-3 h-3 me-1.5" />
            {labels.remove || t('portal.files.imageLabels.remove' as any)}
          </Button>
        )}
      </div>

      {/* Hint text */}
      {!error && !currentImageUrl && (
        <p className="text-[10px] font-medium text-surface-400 text-center uppercase tracking-wider">
          {labels.dropHint || t('portal.files.imageLabels.dropHint' as any)}
        </p>
      )}

      {/* Error message */}
      {error && (
        <p className="text-xs font-medium text-rose-600 dark:text-rose-400 text-center">{error}</p>
      )}
    </div>
  );
};
