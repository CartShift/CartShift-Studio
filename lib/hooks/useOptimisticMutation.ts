import { useState, useCallback } from 'react';
import { useToast } from '@/components/portal/ui';
import { useTranslations } from 'next-intl';

interface OptimisticMutationOptions<T> {
  onMutate: (newData: T) => void;
  onError?: (error: unknown, originalData: T) => void;
  onSuccess?: () => void;
  rollbackData?: T;
}

export function useOptimisticMutation<T>() {
  const [isMutating, setIsMutating] = useState(false);
  const { addToast } = useToast();
  const t = useTranslations('portal.common');

  const mutate = useCallback(
    async (mutationFn: () => Promise<void>, options: OptimisticMutationOptions<T>) => {
      const { onError, onSuccess, rollbackData } = options;

      setIsMutating(true);

      // Apply optimistic update immediately
      // Note: The actual data partial is passed to onMutate by the caller before calling this if needed,
      // or passed as argument to this wrapper if we want to enforce it.
      // Here we assume the caller handles the local state update logic inside onMutate.
      // However, to make it truly generic, let's accept the newData as an argument to mutate.

      // Actually, following the pattern:
      // mutate(newData, mutationFn)

      try {
        await mutationFn();
        onSuccess?.();
      } catch (error) {
        console.error('Optimistic mutation failed:', error);

        // Rollback
        if (rollbackData && onError) {
          onError(error, rollbackData);
        }

        addToast({
          type: 'error',
          title: t('actionFailed' as any),
          message: t('changesReverted' as any),
        });
      } finally {
        setIsMutating(false);
      }
    },
    [addToast, t]
  );

  return { mutate, isMutating };
}

// Revised simpler interface
export function useOptimisticAction<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: {
    onMutate: (variables: TVariables) => void; // Optimistic update here
    onRollback: (error: unknown, variables: TVariables) => void; // Rollback logic here
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: unknown) => void;
  }
) {
  const [is, setIs] = useState(false);
  const { addToast } = useToast();
  const t = useTranslations('portal.common');

  const execute = async (variables: TVariables) => {
    setIs(true);
    options.onMutate(variables);

    try {
      const result = await mutationFn(variables);
      options.onSuccess?.(result, variables);
      return result;
    } catch (error) {
      console.error('Optimistic action failed:', error);
      options.onRollback(error, variables);

      const message = error instanceof Error ? error.message : t('operationFailed' as any);
      addToast({
        type: 'error',
        title: t('error' as any),
        message: options.onError ? message : t('errorReverted' as any),
      });
      options.onError?.(error);
      throw error;
    } finally {
      setIs(false);
    }
  };

  return { execute, is };
}
