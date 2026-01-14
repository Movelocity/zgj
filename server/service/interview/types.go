package interview

import "server/model"

// InterviewReviewListResponse 面试复盘记录列表响应
type InterviewReviewListResponse struct {
	List       []model.InterviewReview `json:"list"`
	Total      int64                   `json:"total"`
	Page       int                     `json:"page"`
	PageSize   int                     `json:"page_size"`
	TotalPages int                     `json:"total_pages"`
}
