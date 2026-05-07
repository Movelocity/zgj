import apiClient from './client';
import type { ApiResponse } from '@/types/global';
import type {
  JobOpportunity,
  OpportunityBatchCreateRequest,
  OpportunityListParams,
  OpportunityListResponse,
  OpportunityUpsertRequest,
  OpportunityVectorMatchRequest,
  OpportunityVectorMatchResponse,
} from '@/types/opportunity';

export const opportunityAPI = {
  getPublicOpportunities: (params?: OpportunityListParams): Promise<ApiResponse<OpportunityListResponse>> => {
    return apiClient.get('/api/opportunities', { params });
  },

  matchOpportunities: (data: OpportunityVectorMatchRequest): Promise<ApiResponse<OpportunityVectorMatchResponse>> => {
    return apiClient.post('/api/opportunities/match', data);
  },

  getAdminOpportunities: (params?: OpportunityListParams): Promise<ApiResponse<OpportunityListResponse>> => {
    return apiClient.get('/api/admin/opportunities', { params });
  },

  createOpportunity: (data: OpportunityUpsertRequest): Promise<ApiResponse<JobOpportunity>> => {
    return apiClient.post('/api/admin/opportunities', data);
  },

  batchCreateOpportunities: (data: OpportunityBatchCreateRequest): Promise<ApiResponse<JobOpportunity[]>> => {
    return apiClient.post('/api/admin/opportunities/batch', data);
  },

  updateOpportunity: (id: number, data: OpportunityUpsertRequest): Promise<ApiResponse<JobOpportunity>> => {
    return apiClient.put(`/api/admin/opportunities/${id}`, data);
  },

  archiveOpportunity: (id: number): Promise<ApiResponse<null>> => {
    return apiClient.delete(`/api/admin/opportunities/${id}`);
  },
};
