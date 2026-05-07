export type OpportunityStatus = 'draft' | 'published' | 'archived';

export interface JobOpportunity {
  id: number;
  created_at: string;
  updated_at: string;
  company: string;
  title: string;
  category: string;
  location: string;
  cadence: string;
  summary: string;
  responsibilities: string[];
  requirements: string[];
  contact_email: string;
  note: string;
  status: OpportunityStatus;
  sort_order: number;
  created_by: string;
}

export interface OpportunityListParams {
  page?: number;
  page_size?: number;
  company?: string;
  category?: string;
  status?: OpportunityStatus | '';
  keyword?: string;
}

export interface OpportunityListResponse {
  list: JobOpportunity[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface OpportunityUpsertRequest {
  company: string;
  title: string;
  category: string;
  location?: string;
  cadence?: string;
  summary?: string;
  responsibilities: string[];
  requirements: string[];
  contact_email: string;
  note?: string;
  status?: OpportunityStatus;
  sort_order?: number;
}

export interface OpportunityBatchCreateRequest {
  items: OpportunityUpsertRequest[];
}
