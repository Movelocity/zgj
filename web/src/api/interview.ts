/**
 * Interview Review API Client
 * Handles all API calls related to interview review feature
 */

import apiClient from './client';
import type {
  InterviewReview,
  InterviewReviewListResponse,
  CreateReviewRequest,
  UpdateReviewMetadataRequest,
  ListReviewsParams,
} from '@/types/interview';

/**
 * Create a new interview review record
 * @param data - Review data including main_audio_id and metadata
 * @returns Created review record
 */
export const createReview = async (data: CreateReviewRequest): Promise<InterviewReview> => {
  const response = await apiClient.post<{ data: InterviewReview }>('/api/interview/reviews', data);
  return response.data.data;
};

/**
 * Get a single interview review by ID
 * @param id - Review ID
 * @returns Interview review record
 */
export const getReview = async (id: number): Promise<InterviewReview> => {
  const response = await apiClient.get<{ data: InterviewReview }>(`/api/interview/reviews/${id}`);
  return response.data.data;
};

/**
 * List interview reviews with pagination
 * @param params - Query parameters (page, page_size, status)
 * @returns Paginated list of reviews
 */
export const listReviews = async (params?: ListReviewsParams): Promise<InterviewReviewListResponse> => {
  const response = await apiClient.get<InterviewReviewListResponse>('/api/interview/reviews', {
    params: {
      page: params?.page || 1,
      page_size: params?.page_size || 10,
      ...(params?.status && { status: params.status }),
    },
  });
  console.log('response', response.data);
  return response.data;
};

/**
 * Trigger AI analysis for a review
 * @param id - Review ID
 * @returns Updated review record with analyzing status
 */
export const triggerAnalysis = async (id: number): Promise<InterviewReview> => {
  const response = await apiClient.post<{ data: InterviewReview }>(`/api/interview/reviews/${id}/analyze`);
  return response.data.data;
};

/**
 * Update interview review metadata (job position, company, etc.)
 * @param id - Review ID
 * @param data - Metadata fields to update
 * @returns Updated review record
 */
export const updateReviewMetadata = async (
  id: number,
  data: UpdateReviewMetadataRequest
): Promise<InterviewReview> => {
  const response = await apiClient.patch<{ data: InterviewReview }>(`/api/interview/reviews/${id}`, data);
  return response.data.data;
};

/**
 * Export all interview API methods
 */
export const interviewAPI = {
  createReview,
  getReview,
  listReviews,
  triggerAnalysis,
  updateReviewMetadata,
};

export default interviewAPI;
