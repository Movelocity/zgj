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

type OpportunityVectorMatchRequest struct {
	Resume interface{} `json:"resume" binding:"required"`
	TopK   int         `json:"top_k"`
}

type OpportunityVectorMatch struct {
	ID            string   `json:"id"`
	OpportunityID int64    `json:"opportunity_id"`
	Company       string   `json:"company"`
	Title         string   `json:"title"`
	Category      string   `json:"category"`
	Location      string   `json:"location"`
	ContactEmail  string   `json:"contact_email"`
	Status        string   `json:"status"`
	Distance      *float64 `json:"distance"`
	Score         float64  `json:"score"`
	Document      string   `json:"document"`
	Reason        string   `json:"reason"`
}

type OpportunityVectorMatchResponse struct {
	Total   int                      `json:"total"`
	Matches []OpportunityVectorMatch `json:"matches"`
}
