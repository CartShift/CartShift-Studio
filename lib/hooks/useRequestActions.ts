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
  PricingLineItem,
  Currency,
  Comment,
} from '@/lib/types/portal';
import { Timestamp } from 'firebase/firestore';
import { useQueryClient } from '@tanstack/react-query';

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
  is: boolean;
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
  const [is, setIs] = useState(false);

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

    setIsAccepting(true);
    try {
      await acceptRequest(requestId!, orgId!, userData!.id, userData!.name || userData!.email);
      toast.success(t('quoteAccepted'), t('quoteAcceptedDesc'));
    } catch (err) {
      console.error('Error accepting quote:', err);
      toast.error(t('quoteAcceptFailed'), t('quoteAcceptFailedDesc'));
    } finally {
      setIsAccepting(false);
    }
  }, [canPerformAction, requestId, orgId, userData, toast]);

  // Decline quote
  const handleDeclineQuote = useCallback(async () => {
    if (!canPerformAction()) return;

    setIsDeclining(true);
    try {
      await declineRequest(requestId!, orgId!, userData!.id, userData!.name || userData!.email);
      toast.info(t('quoteDeclined'), t('quoteDeclinedDesc'));
    } catch (err) {
      console.error('Error declining quote:', err);
      toast.error(t('quoteDeclineFailed'), t('quoteDeclineFailedDesc'));
    } finally {
      setIsDeclining(false);
    }
  }, [canPerformAction, requestId, orgId, userData, toast]);

  // Start work
  const handleStartWork = useCallback(async () => {
    if (!canPerformAction()) return;

    setIsWork(true);
    try {
      await startRequestWork(requestId!, orgId!, userData!.id, userData!.name || userData!.email);
      toast.success(t('workStarted'), t('workStartedDesc'));
    } catch (err) {
      console.error('Error starting work:', err);
      toast.error(t('workStartFailed'), t('workStartFailedDesc'));
    } finally {
      setIsWork(false);
    }
  }, [canPerformAction, requestId, orgId, userData, toast]);

  // Payment success
  const handlePaymentSuccess = useCallback(
    async (result: { paymentId?: string }) => {
      if (!canPerformAction() || !result.paymentId) return;

      try {
        await markRequestPaid(
          requestId!,
          orgId!,
          userData!.id,
          userData!.name || userData!.email,
          result.paymentId
        );
        toast.success(t('paymentSuccess'), t('paymentSuccessDesc'));
      } catch (err) {
        console.error('Error marking as paid:', err);
        toast.error(t('paymentRecorded'), t('paymentRecordedDesc'));
      }
    },
    [canPerformAction, requestId, orgId, userData, toast, t]
  );

  // Assign specialist
  const handleAssignSpecialist = useCallback(
    async (specialistId: string, specialistName: string) => {
      if (!canPerformAction()) return;

      setIsAssigning(true);
      try {
        await assignRequest(
          requestId!,
          orgId!,
          userData!.id,
          userData!.name || userData!.email,
          specialistId,
          specialistName
        );
        toast.success(
          t('specialistAssigned'),
          t('specialistAssignedDesc', { name: specialistName })
        );
      } catch (err) {
        console.error('Error assigning specialist:', err);
        toast.error(t('specialistAssignFailed'), t('specialistAssignFailedDesc'));
      } finally {
        setIsAssigning(false);
      }
    },
    [canPerformAction, requestId, orgId, userData, toast, t]
  );

  // Request revision
  const handleRequestRevision = useCallback(
    async (notes: string): Promise<boolean> => {
      if (!canPerformAction() || !notes.trim()) return false;

      setIsSubmittingRevision(true);
      try {
        await requestRevision(
          requestId!,
          orgId!,
          userData!.id,
          userData!.name || userData!.email,
          notes.trim()
        );
        toast.success(t('revisionRequested'), t('revisionRequestedDesc'));
        return true;
      } catch (err) {
        console.error('Failed to request revision:', err);
        toast.error(t('revisionFailed'), t('revisionFailedDesc'));
        return false;
      } finally {
        setIsSubmittingRevision(false);
      }
    },
    [canPerformAction, requestId, orgId, userData, toast, t]
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
      if (!canPerformAction() || !isAgency) return;

      try {
        await updateRequestStatus(requestId!, newStatus);

        // Invalidate request query to trigger refetch
        queryClient.invalidateQueries({ queryKey: ['request', requestId] });

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
        toast.error(t('statusUpdateFailed'), t('statusUpdateFailedDesc'));
      }
    },
    [canPerformAction, requestId, orgId, userData, isAgency, toast, queryClient]
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

    console.log('[handleDeleteRequest] Permission check:', {
      isAgency,
      isCreator,
      userId: userData?.id,
      requestCreator: _request?.createdBy,
    });

    if (!isAgency && !isCreator) {
      console.error('Delete attempt denied: User is neither agency nor creator');
      toast.error('Permission denied', 'You do not have permission to delete this request');
      return false;
    }

    setIs(true);
    try {
      await deleteRequest(requestId!);
      toast.success(t('requestDeleted'), t('requestDeletedDesc'));
      return true;
    } catch (err) {
      console.error('Error deleting request:', err);
      toast.error(t('deleteFailed'), t('deleteFailedDesc'));
      return false;
    } finally {
      setIs(false);
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
    is,
  };
}
