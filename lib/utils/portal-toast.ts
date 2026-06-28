import { toast } from 'sonner';

/** Portal toast helpers — title + optional description, matching legacy useToast API. */
export const portalToast = {
  success: (title: string, description?: string) =>
    toast.success(title, description ? { description } : undefined),
  error: (title: string, description?: string) =>
    toast.error(title, description ? { description } : undefined),
  warning: (title: string, description?: string) =>
    toast.warning(title, description ? { description } : undefined),
  info: (title: string, description?: string) =>
    toast.info(title, description ? { description } : undefined),
};
