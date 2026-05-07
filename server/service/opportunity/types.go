package opportunity

import "server/model"

type OpportunityListRequest struct {
	Page     int    `form:"page"`
	PageSize int    `form:"page_size"`
	Company  string `form:"company"`
	Category string `form:"category"`
	Status   string `form:"status"`
	Keyword  string `form:"keyword"`
}

type OpportunityListResponse struct {
	List       []model.JobOpportunity `json:"list"`
	Total      int64                  `json:"total"`
	Page       int                    `json:"page"`
	PageSize   int                    `json:"page_size"`
	TotalPages int                    `json:"total_pages"`
}

type OpportunityUpsertRequest struct {
	Company          string   `json:"company" binding:"required"`
	Title            string   `json:"title" binding:"required"`
	Category         string   `json:"category" binding:"required"`
	Location         string   `json:"location"`
	Cadence          string   `json:"cadence"`
	Summary          string   `json:"summary"`
	Responsibilities []string `json:"responsibilities"`
	Requirements     []string `json:"requirements"`
	ContactEmail     string   `json:"contact_email" binding:"required"`
	Note             string   `json:"note"`
	Status           string   `json:"status"`
	SortOrder        int      `json:"sort_order"`
}

type OpportunityBatchCreateRequest struct {
	Items []OpportunityUpsertRequest `json:"items" binding:"required"`
}
