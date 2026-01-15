'use client';

import { useEffect, useState } from 'react';
import { X, Download, ZoomIn, ZoomOut } from 'lucide-react';
import { motion } from '@/lib/motion';
import { getFreshDownloadUrl } from '@/lib/services/portal-files';
import { ModalBackdrop, ModalContent } from './ModalBackdrop';

interface ImagePreviewModalProps {
  imageUrl: string;
  imageName: string;
  storagePath?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ImagePreviewModal({
  imageUrl,
  imageName,
  storagePath,
  isOpen,
  onClose,
}: ImagePreviewModalProps) {
  const [mounted, setMounted] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [currentImageUrl, setCurrentImageUrl] = useState(imageUrl);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setCurrentImageUrl(imageUrl);
    setImageError(false);
  }, [imageUrl, isOpen]);

  const handleImageError = async () => {
    if (imageError || !storagePath) {
      setImageError(true);
      return;
    }

    setImageError(true);
    try {
      const freshUrl = await getFreshDownloadUrl(storagePath);
      if (freshUrl) {
        setCurrentImageUrl(freshUrl);
        setImageError(false);
      }
    } catch (error) {
      console.error('Error getting fresh download URL for preview:', error);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!mounted) return null;

  // Don't render if document.body is not available
  if (typeof document === 'undefined' || !document.body) {
    return null;
  }

  return (
    <ModalBackdrop isOpen={isOpen} onClick={onClose} variant="dark" blur="sm" zIndex="100">
      <ModalContent maxWidth="2xl" position="center">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 px-2">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <h3 className="text-white font-bold text-lg font-outfit truncate">{imageName}</h3>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Zoom Controls */}
            <button
              onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all border border-white/10"
              title="Zoom Out"
            >
              <ZoomOut size={18} />
            </button>
            <span className="text-white text-sm font-bold px-2">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom(Math.min(3, zoom + 0.25))}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all border border-white/10"
              title="Zoom In"
            >
              <ZoomIn size={18} />
            </button>

            {/* Download Button */}
            {currentImageUrl && (
              <a
                href={currentImageUrl}
                download={imageName}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all border border-white/10"
                title="Download"
              >
                <Download size={18} />
              </a>
            )}

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all border border-white/10"
              title="Close (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Image Container */}
        <div className="flex-1 flex items-center justify-center overflow-auto rounded-2xl bg-surface-950/50 border border-white/10">
          {imageError && !storagePath ? (
            <div className="text-white/60 text-center p-8">
              <p className="text-sm">Failed to load image</p>
            </div>
          ) : !currentImageUrl ? (
            <div className="text-white/60 text-center p-8">
              <p className="text-sm">No image URL provided</p>
            </div>
          ) : (
            <motion.img
              src={currentImageUrl}
              alt={imageName}
              className="max-w-full max-h-full object-contain rounded-xl"
              style={{
                transform: `scale(${zoom})`,
                transition: 'transform 0.2s ease-out',
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              onError={handleImageError}
            />
          )}
        </div>
      </ModalContent>
    </ModalBackdrop>
  );
}
