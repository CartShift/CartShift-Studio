'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  acceptRequest,
  declineRequest,
  markRequestPaid,
  startRequestWork,
  addPricingToRequest,
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

  // Quote actions
  handleAcceptQuote: () => Promise<void>;
  handleDeclineQuote: () => Promise<void>;
  isAccepting: boolean;
  isDeclining: boolean;

  // Work actions
  handleStartWork: () => Promise<void>;
  isStartingWork: boolean;
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

  // Loading states
  const [isAddingPricing, setIsAddingPricing] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const [isStartingWork, setIsStartingWork] = useState(false);
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
        item => item.description.trim() && item.quantity > 0 && item.unitPrice > 0
      );
      if (validItems.length === 0) {
        toast.warning('Invalid pricing', 'Please add at least one valid line item');
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
        toast.success('Quote sent', 'The pricing quote has been sent to the client');
        return true;
      } catch (err) {
        console.error('Error adding pricing:', err);
        toast.error('Failed to send quote', 'Please try again');
        return false;
      } finally {
        setIsAddingPricing(false);
      }
    },
    [canPerformAction, requestId, orgId, userData, toast]
  );

  // Accept quote
  const handleAcceptQuote = useCallback(async () => {
    if (!canPerformAction()) return;

    setIsAccepting(true);
    try {
      await acceptRequest(requestId!, orgId!, userData!.id, userData!.name || userData!.email);
      toast.success('Quote accepted', 'The quote has been accepted');
    } catch (err) {
      console.error('Error accepting quote:', err);
      toast.error('Failed to accept quote', 'Please try again');
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
      toast.info('Quote declined', 'The quote has been declined');
    } catch (err) {
      console.error('Error declining quote:', err);
      toast.error('Failed to decline quote', 'Please try again');
    } finally {
      setIsDeclining(false);
    }
  }, [canPerformAction, requestId, orgId, userData, toast]);

  // Start work
  const handleStartWork = useCallback(async () => {
    if (!canPerformAction()) return;

    setIsStartingWork(true);
    try {
      await startRequestWork(requestId!, orgId!, userData!.id, userData!.name || userData!.email);
      toast.success('Work started', 'The request is now in progress');
    } catch (err) {
      console.error('Error starting work:', err);
      toast.error('Failed to start work', 'Please try again');
    } finally {
      setIsStartingWork(false);
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
        toast.success('Payment successful', 'Thank you for your payment');
      } catch (err) {
        console.error('Error marking as paid:', err);
        toast.error('Payment recorded, but status update failed', 'Please contact support');
      }
    },
    [canPerformAction, requestId, orgId, userData, toast]
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
        toast.success('Specialist assigned', `${specialistName} has been assigned to this request`);
      } catch (err) {
        console.error('Error assigning specialist:', err);
        toast.error('Failed to assign specialist', 'Please try again');
      } finally {
        setIsAssigning(false);
      }
    },
    [canPerformAction, requestId, orgId, userData, toast]
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
        toast.success('Revision requested', 'Your revision request has been submitted');
        return true;
      } catch (err) {
        console.error('Failed to request revision:', err);
        toast.error('Failed to submit revision', 'Please try again');
        return false;
      } finally {
        setIsSubmittingRevision(false);
      }
    },
    [canPerformAction, requestId, orgId, userData, toast]
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
        toast.success('File uploaded', `${file.name} has been attached`);
      } catch (err) {
        console.error('Failed to upload file:', err);
        toast.error('Upload failed', 'Please try again');
      } finally {
        setIsUploading(false);
      }
    },
    [canPerformAction, requestId, orgId, userData, toast]
  );

  // Status change
  const handleStatusChange = useCallback(
    async (newStatus: RequestStatus) => {
      if (!canPerformAction() || !isAgency) return;

      try {
        await updateRequestStatus(requestId!, newStatus);
        await logActivity({
          orgId: orgId!,
          requestId: requestId!,
          userId: userData!.id,
          userName: userData!.name || userData!.email,
          action: 'STATUS_CHANGED',
          details: { status: newStatus },
        });
        toast.success('Status updated', `Request status changed to ${newStatus.toLowerCase()}`);
      } catch (error) {
        console.error('Error updating status:', error);
        toast.error('Failed to update status', 'Please try again');
      }
    },
    [canPerformAction, requestId, orgId, userData, isAgency, toast]
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
        toast.error('Failed to send message', 'Please try again');
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

    setIsDeleting(true);
    try {
      await deleteRequest(requestId!);
      toast.success('Request deleted', 'The request has been permanently removed');
      return true;
    } catch (err) {
      console.error('Error deleting request:', err);
      toast.error('Failed to delete request', 'Please try again');
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, [canPerformAction, requestId, isAgency, toast]);

  return {
    handleAddPricing,
    isAddingPricing,
    handleAcceptQuote,
    handleDeclineQuote,
    isAccepting,
    isDeclining,
    handleStartWork,
    isStartingWork,
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
