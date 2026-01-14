/**
 * Interview Review Types
 * Type definitions for interview review feature
 */

// Status constants
export const REVIEW_STATUS = {
  PENDING: 'pending',
  TRANSCRIBING: 'transcribing',
  ANALYZING: 'analyzing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  TIMEOUT: 'timeout',
} as const;

export type ReviewStatus = typeof REVIEW_STATUS[keyof typeof REVIEW_STATUS];

/**
 * Interview review metadata stored in JSONB field
 */
export interface InterviewReviewMetadata {
  main_audio_id?: string;
  workflow_id?: string;
  status: ReviewStatus;
  asr_result?: any;
  error_message?: string;
  current_step?: number;
  steps_completed?: string[];
  job_position?: string;
  target_company?: string;
  audio_filename?: string;
  [key: string]: any; // Allow additional fields
}

/**
 * Main interview review interface matching backend model
 */
export interface InterviewReview {
  id: number;
  user_id: number;
  main_audio_id: string;
  data: string;
  metadata: InterviewReviewMetadata;
  created_at: string;
  updated_at: string;
}

/**
 * Request payload for creating interview review
 */
export interface CreateReviewRequest {
  main_audio_id: string;
  metadata: Partial<InterviewReviewMetadata>;
}

/**
 * Request payload for updating interview review metadata
 */
export interface UpdateReviewMetadataRequest {
  metadata: Partial<InterviewReviewMetadata>;
}

/**
 * Paginated list response
 */
export interface InterviewReviewListResponse {
  list: InterviewReview[];
  total: number;
  page: number;
  page_size: number;
}

/**
 * List query parameters
 */
export interface ListReviewsParams {
  page?: number;
  page_size?: number;
  status?: ReviewStatus;
}

/**
 * Step definition for workflow
 */
export interface WorkflowStep {
  key: string;
  label: string;
  description?: string;
}
