'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  acceptRequest,
  declineRequest,
  markRequestPaid,
  startRequestWork,
  addPricingToRequest,
  markRequestAsFree,
  assignRequest,
  requestRevision,
  updateRequestStatus,
  deleteRequest,
} from '@/lib/services/portal-requests';
import { logActivity } from '@/lib/services/portal-activities';
import { uploadFile } from '@/lib/services/portal-files';
import { createComment } from '@/lib/services/portal-comments';
import { useToast } from '@/components/portal/ui';
import {
  Request,
  PortalUser,
  RequestStatus,
  REQUEST_STATUS,
  PricingLineItem,
  Currency,
  Comment,
} from '@/lib/types/portal';
import { Timestamp } from 'firebase/firestore';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/utils/query-keys';

interface UseRequestActionsParams {
  request: Request | null;
  userData: PortalUser | null;
  orgId: string | null;
  requestId: string | null;
  isAgency: boolean;
  onCommentsUpdate?: (fn: (prev: Comment[]) => Comment[]) => void;
}

interface UseRequestActionsResult {
  // Pricing actions
  handleAddPricing: (lineItems: PricingLineItem[], currency: Currency) => Promise<boolean>;
  isAddingPricing: boolean;
  handleMarkAsFree: () => Promise<boolean>;
  isMarkingFree: boolean;

  // Quote actions
  handleAcceptQuote: () => Promise<void>;
  handleDeclineQuote: () => Promise<void>;
  isAccepting: boolean;
  isDeclining: boolean;

  // Work actions
  handleStartWork: () => Promise<void>;
  isWork: boolean;
  handlePaymentSuccess: (result: { paymentId?: string }) => Promise<void>;

  // Assignment
  handleAssignSpecialist: (specialistId: string, specialistName: string) => Promise<void>;
  isAssigning: boolean;

  // Revision
  handleRequestRevision: (notes: string) => Promise<boolean>;
  isSubmittingRevision: boolean;

  // File upload
  handleFileUpload: (file: File) => Promise<void>;
  isUploading: boolean;

  // Status
  handleStatusChange: (newStatus: RequestStatus) => Promise<void>;

  // Comments
  handleSendComment: (content: string, parentId?: string) => Promise<void>;
  isSubmittingComment: boolean;
  handleDeleteRequest: () => Promise<boolean>;
  isDeleting: boolean;
}

/**
 * Hook for managing all request-related actions with integrated toast notifications.
 * Provides consistent error handling and loading states for all mutations.
 *
 * @example
 * ```tsx
 * const {
 *   handleAcceptQuote,
 *   isAccepting,
 *   handleStartWork,
 * } = useRequestActions({
 *   request,
 *   userData,
 *   orgId,
 *   requestId,
 *   isAgency,
 * });
 * ```
 */
export function useRequestActions({
  request: _request,
  userData,
  orgId,
  requestId,
  isAgency,
  onCommentsUpdate,
}: UseRequestActionsParams): UseRequestActionsResult {
  const toast = useToast();
  const t = useTranslations('portal.requests.toast');
  const queryClient = useQueryClient();

  //  states
  const [isAddingPricing, setIsAddingPricing] = useState(false);
  const [isMarkingFree, setIsMarkingFree] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const [isWork, setIsWork] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isSubmittingRevision, setIsSubmittingRevision] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Refs for cleanup
  const commentTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup effect for timeouts
  useEffect(() => {
    return () => {
      if (commentTimeoutRef.current) {
        clearTimeout(commentTimeoutRef.current);
      }
    };
  }, []);

  // Validation helper - silent validation, no toast for missing data during loading
  const canPerformAction = useCallback(() => {
    if (!requestId || !orgId || !userData) {
      return false;
    }
    return true;
  }, [requestId, orgId, userData]);

  // Add pricing to request
  const handleAddPricing = useCallback(
    async (lineItems: PricingLineItem[], currency: Currency): Promise<boolean> => {
      if (!canPerformAction()) return false;

      const validItems = lineItems.filter(
        item => item.description.trim() && item.quantity > 0 && item.unitPrice >= 0
      );
      if (validItems.length === 0) {
        toast.warning(t('invalidPricing'), t('invalidPricingDesc'));
        return false;
      }

      setIsAddingPricing(true);
      try {
        await addPricingToRequest(
          requestId!,
          orgId!,
          userData!.id,
          userData!.name || userData!.email,
          { lineItems: validItems, currency }
        );
        toast.success(t('quoteSent'), t('quoteSentDesc'));
        return true;
      } catch (err) {
        console.error('Error adding pricing:', err);
        toast.error(t('quoteFailed'), t('quoteFailedDesc'));
        return false;
      } finally {
        setIsAddingPricing(false);
      }
    },
    [canPerformAction, requestId, orgId, userData, toast, t]
  );

  // Mark as free (agency only)
  const handleMarkAsFree = useCallback(async (): Promise<boolean> => {
    if (!canPerformAction()) return false;

    setIsMarkingFree(true);
    try {
      await markRequestAsFree(requestId!, orgId!, userData!.id, userData!.name || userData!.email);
      toast.success(t('markedAsFree'), t('markedAsFreeDesc'));
      return true;
    } catch (err) {
      console.error('Error marking as free:', err);
      toast.error(t('markAsFreeFailed'), t('markAsFreeFailedDesc'));
      return false;
    } finally {
      setIsMarkingFree(false);
    }
  }, [canPerformAction, requestId, orgId, userData, toast, t]);

  // Accept quote
  const handleAcceptQuote = useCallback(async () => {
    if (!canPerformAction()) return;

    // Optimistic update
    const previousRequest = queryClient.getQueryData(queryKeys.requests.detail(requestId!));

    setIsAccepting(true);
    try {
      // Optimistically update UI
      queryClient.setQueryData<Request>(queryKeys.requests.detail(requestId!), old => {
        if (!old) return old;
        return {
          ...old,
          status: REQUEST_STATUS.ACCEPTED,
          acceptedAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };
      });

      await acceptRequest(requestId!, orgId!, userData!.id, userData!.name || userData!.email);
      await queryClient.invalidateQueries({ queryKey: queryKeys.requests.detail(requestId!) });
      toast.success(t('quoteAccepted'), t('quoteAcceptedDesc'));
    } catch (err) {
      console.error('Error accepting quote:', err);
      // Rollback on error
      if (previousRequest) {
        queryClient.setQueryData(queryKeys.requests.detail(requestId!), previousRequest);
      }
      toast.error(t('quoteAcceptFailed'), t('quoteAcceptFailedDesc'));
    } finally {
      setIsAccepting(false);
    }
  }, [canPerformAction, requestId, orgId, userData, toast, queryClient, t]);

  // Decline quote
  const handleDeclineQuote = useCallback(async () => {
    if (!canPerformAction()) return;

    // Optimistic update
    const previousRequest = queryClient.getQueryData(queryKeys.requests.detail(requestId!));

    setIsDeclining(true);
    try {
      // Optimistically update UI
      queryClient.setQueryData<Request>(queryKeys.requests.detail(requestId!), old => {
        if (!old) return old;
        return {
          ...old,
          status: REQUEST_STATUS.DECLINED,
          updatedAt: Timestamp.now(),
        };
      });

      await declineRequest(requestId!, orgId!, userData!.id, userData!.name || userData!.email);
      await queryClient.invalidateQueries({ queryKey: queryKeys.requests.detail(requestId!) });
      toast.info(t('quoteDeclined'), t('quoteDeclinedDesc'));
    } catch (err) {
      console.error('Error declining quote:', err);
      // Rollback on error
      if (previousRequest) {
        queryClient.setQueryData(queryKeys.requests.detail(requestId!), previousRequest);
      }
      toast.error(t('quoteDeclineFailed'), t('quoteDeclineFailedDesc'));
    } finally {
      setIsDeclining(false);
    }
  }, [canPerformAction, requestId, orgId, userData, toast, queryClient, t]);

  // Start work
  const handleStartWork = useCallback(async () => {
    if (!canPerformAction()) return;

    // Optimistic update
    const previousRequest = queryClient.getQueryData(queryKeys.requests.detail(requestId!));

    setIsWork(true);
    try {
      // Optimistically update UI
      queryClient.setQueryData<Request>(queryKeys.requests.detail(requestId!), old => {
        if (!old) return old;
        return {
          ...old,
          status: REQUEST_STATUS.IN_PROGRESS,
          updatedAt: Timestamp.now(),
        };
      });

      await startRequestWork(requestId!, orgId!, userData!.id, userData!.name || userData!.email);
      await queryClient.invalidateQueries({ queryKey: queryKeys.requests.detail(requestId!) });
      toast.success(t('workStarted'), t('workStartedDesc'));
    } catch (err) {
      console.error('Error starting work:', err);
      // Rollback on error
      if (previousRequest) {
        queryClient.setQueryData(queryKeys.requests.detail(requestId!), previousRequest);
      }
      toast.error(t('workStartFailed'), t('workStartFailedDesc'));
    } finally {
      setIsWork(false);
    }
  }, [canPerformAction, requestId, orgId, userData, toast, queryClient, t]);

  // Payment success
  const handlePaymentSuccess = useCallback(
    async (result: { paymentId?: string }) => {
      if (!canPerformAction() || !result.paymentId) return;

      // Optimistic update
      const previousRequest = queryClient.getQueryData(queryKeys.requests.detail(requestId!));

      try {
        // Optimistically update UI
        queryClient.setQueryData<Request>(queryKeys.requests.detail(requestId!), old => {
          if (!old) return old;
          return {
            ...old,
            status: REQUEST_STATUS.PAID,
            paymentId: result.paymentId,
            updatedAt: Timestamp.now(),
          };
        });

        await markRequestPaid(
          requestId!,
          orgId!,
          userData!.id,
          userData!.name || userData!.email,
          result.paymentId
        );
        await queryClient.invalidateQueries({ queryKey: queryKeys.requests.detail(requestId!) });
        toast.success(t('paymentSuccess'), t('paymentSuccessDesc'));
      } catch (err) {
        console.error('Error marking as paid:', err);
        // Rollback on error
        if (previousRequest) {
          queryClient.setQueryData(queryKeys.requests.detail(requestId!), previousRequest);
        }
        toast.error(t('paymentRecorded'), t('paymentRecordedDesc'));
      }
    },
    [canPerformAction, requestId, orgId, userData, toast, queryClient, t]
  );

  // Assign specialist
  const handleAssignSpecialist = useCallback(
    async (specialistId: string, specialistName: string) => {
      if (!canPerformAction()) return;

      // Optimistic update
      const previousRequest = queryClient.getQueryData(queryKeys.requests.detail(requestId!));

      setIsAssigning(true);
      try {
        // Optimistically update UI
        queryClient.setQueryData<Request>(queryKeys.requests.detail(requestId!), old => {
          if (!old) return old;
          return {
            ...old,
            assignedTo: specialistId,
            assignedToName: specialistName,
            updatedAt: Timestamp.now(),
          };
        });

        await assignRequest(
          requestId!,
          orgId!,
          userData!.id,
          userData!.name || userData!.email,
          specialistId,
          specialistName
        );
        await queryClient.invalidateQueries({ queryKey: queryKeys.requests.detail(requestId!) });
        toast.success(
          t('specialistAssigned'),
          t('specialistAssignedDesc', { name: specialistName })
        );
      } catch (err) {
        console.error('Error assigning specialist:', err);
        // Rollback on error
        if (previousRequest) {
          queryClient.setQueryData(queryKeys.requests.detail(requestId!), previousRequest);
        }
        toast.error(t('specialistAssignFailed'), t('specialistAssignFailedDesc'));
      } finally {
        setIsAssigning(false);
      }
    },
    [canPerformAction, requestId, orgId, userData, toast, queryClient, t]
  );

  // Request revision
  const handleRequestRevision = useCallback(
    async (notes: string): Promise<boolean> => {
      if (!canPerformAction() || !notes.trim()) return false;

      // Optimistic update
      const previousRequest = queryClient.getQueryData(queryKeys.requests.detail(requestId!));

      setIsSubmittingRevision(true);
      try {
        // Optimistically update UI - move back to IN_PROGRESS
        queryClient.setQueryData<Request>(queryKeys.requests.detail(requestId!), old => {
          if (!old) return old;
          return {
            ...old,
            status: REQUEST_STATUS.IN_PROGRESS,
            updatedAt: Timestamp.now(),
          };
        });

        await requestRevision(
          requestId!,
          orgId!,
          userData!.id,
          userData!.name || userData!.email,
          notes.trim()
        );
        await queryClient.invalidateQueries({ queryKey: queryKeys.requests.detail(requestId!) });
        toast.success(t('revisionRequested'), t('revisionRequestedDesc'));
        return true;
      } catch (err) {
        console.error('Failed to request revision:', err);
        // Rollback on error
        if (previousRequest) {
          queryClient.setQueryData(queryKeys.requests.detail(requestId!), previousRequest);
        }
        toast.error(t('revisionFailed'), t('revisionFailedDesc'));
        return false;
      } finally {
        setIsSubmittingRevision(false);
      }
    },
    [canPerformAction, requestId, orgId, userData, toast, queryClient, t]
  );

  // File upload
  const handleFileUpload = useCallback(
    async (file: File) => {
      if (!canPerformAction()) return;

      setIsUploading(true);
      try {
        await uploadFile(orgId!, userData!.id, userData!.name || userData!.email, file, {
          requestId: requestId!,
        });
        await logActivity({
          orgId: orgId!,
          requestId: requestId!,
          userId: userData!.id,
          userName: userData!.name || userData!.email,
          action: 'ADDED_ATTACHMENT',
          details: { fileName: file.name },
        });
        toast.success(t('fileAttached', { fileName: file.name }));
      } catch (err) {
        console.error('Failed to upload file:', err);
        toast.error(t('uploadFailed'), t('uploadFailedDesc'));
      } finally {
        setIsUploading(false);
      }
    },
    [canPerformAction, requestId, orgId, userData, toast, t]
  );

  // Status change
  const handleStatusChange = useCallback(
    async (newStatus: RequestStatus) => {
      if (!canPerformAction()) {
        toast.error(t('statusUpdateFailed'), 'Missing required information');
        return;
      }

      if (!isAgency) {
        toast.error(t('statusUpdateFailed'), 'Only agency users can change request status');
        return;
      }

      const previousRequest = queryClient.getQueryData(queryKeys.requests.detail(requestId!));

      try {
        queryClient.setQueryData<Request>(queryKeys.requests.detail(requestId!), old => {
          if (!old) return old;
          return {
            ...old,
            status: newStatus,
            updatedAt: Timestamp.now(),
          };
        });

        await updateRequestStatus(requestId!, newStatus);
        await queryClient.invalidateQueries({ queryKey: queryKeys.requests.detail(requestId!) });

        await logActivity({
          orgId: orgId!,
          requestId: requestId!,
          userId: userData!.id,
          userName: userData!.name || userData!.email,
          action: 'STATUS_CHANGED',
          details: { status: newStatus },
        });

        toast.success(
          t('statusUpdated'),
          t('statusUpdatedDesc', { status: newStatus.toLowerCase() })
        );
      } catch (error) {
        console.error('Error updating status:', error);
        if (previousRequest) {
          queryClient.setQueryData(queryKeys.requests.detail(requestId!), previousRequest);
        }

        toast.error(t('statusUpdateFailed'), t('statusUpdateFailedDesc'));
      }
    },
    [canPerformAction, requestId, orgId, userData, isAgency, toast, queryClient, t]
  );

  // Send comment with optimistic update
  const handleSendComment = useCallback(
    async (content: string, parentId?: string) => {
      if (!canPerformAction()) return;

      const tempId = `temp-${Date.now()}`;
      const optimisticComment: Comment = {
        id: tempId,
        requestId: requestId!,
        orgId: orgId!,
        userId: userData!.id,
        userName: userData!.name || userData!.email,
        userPhotoUrl: userData!.photoUrl,
        content,
        attachmentIds: [],
        isInternal: false,
        parentId,
        createdAt: Timestamp.now(),
        reactions: {},
        mentions: [],
      };

      // Optimistic update
      onCommentsUpdate?.(prev => [...prev, optimisticComment]);

      setIsSubmittingComment(true);
      try {
        await createComment(
          requestId!,
          orgId!,
          userData!.id,
          userData!.name || userData!.email,
          userData!.photoUrl,
          { content, parentId }
        );

        // Remove temp comment after real one arrives via subscription
        if (commentTimeoutRef.current) {
          clearTimeout(commentTimeoutRef.current);
        }
        commentTimeoutRef.current = setTimeout(() => {
          onCommentsUpdate?.(prev => prev.filter(c => c.id !== tempId));
        }, 1000);
      } catch (error) {
        console.error('Error sending comment:', error);
        onCommentsUpdate?.(prev => prev.filter(c => c.id !== tempId));
        toast.error(t('messageFailed'), t('messageFailedDesc'));
      } finally {
        setIsSubmittingComment(false);
      }
    },
    [canPerformAction, requestId, orgId, userData, onCommentsUpdate, toast]
  );

  // Delete request
  const handleDeleteRequest = useCallback(async (): Promise<boolean> => {
    if (!canPerformAction()) return false;

    // Updated validation to match Firestore rules
    const isCreator = _request?.createdBy === userData?.id;

    if (!isAgency && !isCreator) {
      toast.error('Permission denied', 'You do not have permission to delete this request');
      return false;
    }

    setIsDeleting(true);
    try {
      await deleteRequest(requestId!);
      toast.success(t('requestDeleted'), t('requestDeletedDesc'));
      return true;
    } catch (err) {
      console.error('Error deleting request:', err);
      toast.error(t('deleteFailed'), t('deleteFailedDesc'));
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, [canPerformAction, requestId, isAgency, toast]);

  return {
    handleAddPricing,
    isAddingPricing,
    handleMarkAsFree,
    isMarkingFree,
    handleAcceptQuote,
    handleDeclineQuote,
    isAccepting,
    isDeclining,
    handleStartWork,
    isWork,
    handlePaymentSuccess,
    handleAssignSpecialist,
    isAssigning,
    handleRequestRevision,
    isSubmittingRevision,
    handleFileUpload,
    isUploading,
    handleStatusChange,
    handleSendComment,
    isSubmittingComment,
    handleDeleteRequest,
    isDeleting,
  };
}
