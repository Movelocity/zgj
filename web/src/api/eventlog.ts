import apiClient from './client';
import type { ApiResponse } from '@/types/global';
import type { EventLogQueryParams, EventLogQueryResponse } from '@/types/eventlog';

/**
 * Event Log API Client
 * Admin-only API for querying system event logs
 */
export const eventLogAPI = {
  /**
   * Query event logs with filters and pagination
   * @param params Query parameters including pagination, filters, and time range
   * @returns Event log query response with list and pagination info
   */
  queryEventLogs: (params: EventLogQueryParams): Promise<ApiResponse<EventLogQueryResponse>> => {
    // Convert datetime-local format to ISO 8601 if needed
    const formattedParams = { ...params };
    
    // Ensure start_time and end_time are in correct format (add seconds if missing)
    if (formattedParams.start_time && !formattedParams.start_time.includes(':00', formattedParams.start_time.length - 3)) {
      formattedParams.start_time = formattedParams.start_time + ':00';
    }
    if (formattedParams.end_time && !formattedParams.end_time.includes(':00', formattedParams.end_time.length - 3)) {
      formattedParams.end_time = formattedParams.end_time + ':00';
    }
    
    return apiClient.get('/api/admin/event-logs', { params: formattedParams });
  },
};

