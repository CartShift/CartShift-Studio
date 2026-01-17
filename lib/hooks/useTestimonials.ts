import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  createTestimonial,
  getTestimonialByOrg,
  updateTestimonial,
  hasSubmittedTestimonial,
  CreateTestimonialData,
} from '@/lib/services/portal-testimonials';

// ============================================
// Query Keys
// ============================================

export const testimonialKeys = {
  all: ['testimonials'] as const,
  byOrg: (orgId: string) => [...testimonialKeys.all, 'org', orgId] as const,
  hasSubmitted: (orgId: string) => [...testimonialKeys.all, 'hasSubmitted', orgId] as const,
};

// ============================================
// Queries
// ============================================

export function useOrgTestimonial(orgId: string | null | undefined) {
  return useQuery({
    queryKey: testimonialKeys.byOrg(orgId ?? ''),
    queryFn: () => getTestimonialByOrg(orgId!),
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useHasSubmittedTestimonial(orgId: string | null | undefined) {
  return useQuery({
    queryKey: testimonialKeys.hasSubmitted(orgId ?? ''),
    queryFn: () => hasSubmittedTestimonial(orgId!),
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000,
  });
}

// ============================================
// Mutations
// ============================================

interface CreateTestimonialVars {
  orgId: string;
  userId: string;
  userName: string;
  userEmail: string;
  companyName: string;
  data: CreateTestimonialData;
}

interface UpdateTestimonialVars {
  testimonialId: string;
  data: Partial<CreateTestimonialData>;
}

export function useTestimonialMutations() {
  const queryClient = useQueryClient();
  const t = useTranslations('portal');

  const createMutation = useMutation({
    mutationFn: (vars: CreateTestimonialVars) =>
      createTestimonial(
        vars.orgId,
        vars.userId,
        vars.userName,
        vars.userEmail,
        vars.companyName,
        vars.data
      ),
    onSuccess: (_, vars) => {
      toast.success(t('testimonial.submitSuccess'));
      queryClient.invalidateQueries({ queryKey: testimonialKeys.byOrg(vars.orgId) });
      queryClient.invalidateQueries({ queryKey: testimonialKeys.hasSubmitted(vars.orgId) });
    },
    onError: error => {
      console.error('Failed to create testimonial:', error);
      toast.error(t('testimonial.submitError'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (vars: UpdateTestimonialVars) => updateTestimonial(vars.testimonialId, vars.data),
    onSuccess: () => {
      toast.success(t('testimonial.updateSuccess'));
      queryClient.invalidateQueries({ queryKey: testimonialKeys.all });
    },
    onError: error => {
      console.error('Failed to update testimonial:', error);
      toast.error(t('testimonial.updateError'));
    },
  });

  return {
    // Create
    createMutation,
    createTestimonial: createMutation.mutate,
    createTestimonialAsync: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    createError: createMutation.error,

    // Update
    updateMutation,
    updateTestimonial: updateMutation.mutate,
    updateTestimonialAsync: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,
  };
}

// ============================================
// Combined Hook
// ============================================

export function useTestimonials(orgId: string | null | undefined) {
  const testimonialQuery = useOrgTestimonial(orgId);
  const hasSubmittedQuery = useHasSubmittedTestimonial(orgId);
  const mutations = useTestimonialMutations();

  return {
    // Query data
    testimonial: testimonialQuery.data,
    hasSubmitted: hasSubmittedQuery.data ?? false,
    isLoading: testimonialQuery.isLoading || hasSubmittedQuery.isLoading,
    isError: testimonialQuery.isError || hasSubmittedQuery.isError,
    error: testimonialQuery.error || hasSubmittedQuery.error,

    // Mutations
    ...mutations,
  };
}
