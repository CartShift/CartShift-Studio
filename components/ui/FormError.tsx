'use client';

import { motion, AnimatePresence } from "@/lib/motion";
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormErrorProps {
  message?: string | null;
  className?: string;
  id?: string;
}

export const FormError = ({ message, className, id }: FormErrorProps) => {
  return (
    <AnimatePresence mode="wait">
      {message && (
        <motion.div
          id={id}
          initial={{ opacity: 0, y: -10, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -10, height: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className={cn(
            "overflow-hidden",
            className
          )}
          role="alert"
        >
          <div className="flex items-center gap-2 p-3 text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 rounded-lg">
            <AlertCircle size={14} className="flex-shrink-0" />
            <span>{message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
