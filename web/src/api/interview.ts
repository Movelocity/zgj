/**
 * Interview Review API Client
 * Handles all API calls related to interview review feature
 * 
 * 注意：client.ts 的响应拦截器已经解包了 axios response，
 * 返回的是 API 响应体 { code, data, msg }，所以这里只需要访问 .data 即可获取实际数据
 */

import apiClient from './client';
import type { ApiResponse } from '@/types/global';
import type {
  InterviewReview,
  InterviewReviewListResponse,
  CreateReviewRequest,
  UpdateReviewMetadataRequest,
  ListReviewsParams,
} from '@/types/interview';

/**
 * Create a new interview review record
 * @param data - Review data including main_audio_id and asr_result
 * @returns Created review record
 */
export const createReview = async (data: CreateReviewRequest): Promise<InterviewReview> => {
  const response = await apiClient.post<ApiResponse<InterviewReview>>('/api/interview/reviews', data);
  // response 是 { code, data, msg }，response.data 是 InterviewReview
  return (response as unknown as ApiResponse<InterviewReview>).data;
};

/**
 * Get a single interview review by ID
 * @param id - Review ID
 * @returns Interview review record
 */
export const getReview = async (id: number): Promise<InterviewReview> => {
  const response = await apiClient.get<ApiResponse<InterviewReview>>(`/api/interview/reviews/${id}`);
  return (response as unknown as ApiResponse<InterviewReview>).data;
};

/**
 * List interview reviews with pagination
 * @param params - Query parameters (page, page_size, status)
 * @returns Paginated list of reviews
 */
export const listReviews = async (params?: ListReviewsParams): Promise<InterviewReviewListResponse> => {
  const response = await apiClient.get<ApiResponse<InterviewReviewListResponse>>('/api/interview/reviews', {
    params: {
      page: params?.page || 1,
      page_size: params?.page_size || 10,
      ...(params?.status && { status: params.status }),
    },
  });
  return (response as unknown as ApiResponse<InterviewReviewListResponse>).data;
};

/**
 * Trigger AI analysis for a review
 * @param id - Review ID
 * @returns Updated review record with analyzing status
 */
export const triggerAnalysis = async (id: number): Promise<InterviewReview> => {
  const response = await apiClient.post<ApiResponse<InterviewReview>>(`/api/interview/reviews/${id}/analyze`);
  return (response as unknown as ApiResponse<InterviewReview>).data;
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
  const response = await apiClient.patch<ApiResponse<InterviewReview>>(`/api/interview/reviews/${id}`, data);
  return (response as unknown as ApiResponse<InterviewReview>).data;
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
