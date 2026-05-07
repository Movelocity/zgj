package opportunity

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"

	"server/global"
	"server/model"
)

type opportunityVectorPayload struct {
	ID               int64    `json:"id"`
	Company          string   `json:"company"`
	Title            string   `json:"title"`
	Category         string   `json:"category"`
	Location         string   `json:"location"`
	Cadence          string   `json:"cadence"`
	Summary          string   `json:"summary"`
	Responsibilities []string `json:"responsibilities"`
	Requirements     []string `json:"requirements"`
	ContactEmail     string   `json:"contact_email"`
	Note             string   `json:"note"`
	Status           string   `json:"status"`
	SortOrder        int      `json:"sort_order"`
}

type vectorErrorResponse struct {
	Error string `json:"error"`
}

type vectorMatchResponse struct {
	OK             bool                     `json:"ok"`
	Total          int                      `json:"total"`
	Matches        []OpportunityVectorMatch `json:"matches"`
	EmbeddingModel string                   `json:"embedding_model"`
	Collection     string                   `json:"collection"`
	Error          string                   `json:"error"`
}

func vectorServiceBaseURL() string {
	if global.CONFIG == nil {
		return ""
	}
	return strings.TrimRight(global.CONFIG.LangChainService.BaseURL, "/")
}

func vectorServiceTimeout() time.Duration {
	if global.CONFIG == nil || global.CONFIG.LangChainService.VectorSyncTimeout <= 0 {
		return 10 * time.Second
	}
	return time.Duration(global.CONFIG.LangChainService.VectorSyncTimeout) * time.Second
}

func decodeJSONLines(raw model.JSON) []string {
	if len(raw) == 0 {
		return []string{}
	}
	var lines []string
	if err := json.Unmarshal(raw, &lines); err != nil {
		return []string{}
	}
	result := make([]string, 0, len(lines))
	for _, line := range lines {
		trimmed := strings.TrimSpace(line)
		if trimmed != "" {
			result = append(result, trimmed)
		}
	}
	return result
}

func opportunityToVectorPayload(item model.JobOpportunity) opportunityVectorPayload {
	return opportunityVectorPayload{
		ID:               item.ID,
		Company:          item.Company,
		Title:            item.Title,
		Category:         item.Category,
		Location:         item.Location,
		Cadence:          item.Cadence,
		Summary:          item.Summary,
		Responsibilities: decodeJSONLines(item.Responsibilities),
		Requirements:     decodeJSONLines(item.Requirements),
		ContactEmail:     item.ContactEmail,
		Note:             item.Note,
		Status:           item.Status,
		SortOrder:        item.SortOrder,
	}
}

func postVectorService(path string, payload interface{}, target interface{}) error {
	baseURL := vectorServiceBaseURL()
	if baseURL == "" {
		return errors.New("LangChain 服务地址未配置")
	}

	bodyBytes, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	req, err := http.NewRequest(http.MethodPost, baseURL+path, bytes.NewReader(bodyBytes))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	if token := strings.TrimSpace(global.CONFIG.LangChainService.ServiceToken); token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}

	client := &http.Client{Timeout: vectorServiceTimeout()}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		var errorResponse vectorErrorResponse
		if err := json.Unmarshal(respBody, &errorResponse); err == nil && errorResponse.Error != "" {
			return errors.New(errorResponse.Error)
		}
		return fmt.Errorf("LangChain 服务返回 HTTP %d: %s", resp.StatusCode, string(respBody))
	}
	if target == nil {
		return nil
	}
	return json.Unmarshal(respBody, target)
}

func (s *opportunityService) syncOpportunityVectors(opportunities []model.JobOpportunity) {
	if len(opportunities) == 0 {
		return
	}

	items := make([]opportunityVectorPayload, 0, len(opportunities))
	for _, item := range opportunities {
		items = append(items, opportunityToVectorPayload(item))
	}

	if err := postVectorService("/v1/opportunities/vector/upsert", map[string]interface{}{"items": items}, nil); err != nil {
		log.Printf("岗位向量同步失败: %v", err)
	}
}

func (s *opportunityService) deleteOpportunityVectors(ids []int64) {
	if len(ids) == 0 {
		return
	}
	if err := postVectorService("/v1/opportunities/vector/delete", map[string]interface{}{"ids": ids}, nil); err != nil {
		log.Printf("岗位向量删除失败: %v", err)
	}
}

func (s *opportunityService) RebuildVectors() (map[string]interface{}, error) {
	var opportunities []model.JobOpportunity
	if err := global.DB.Where("status = ?", model.JobOpportunityStatusPublished).
		Order("sort_order ASC, created_at DESC").
		Find(&opportunities).Error; err != nil {
		return nil, errors.New("查询已发布岗位失败")
	}

	items := make([]opportunityVectorPayload, 0, len(opportunities))
	for _, item := range opportunities {
		items = append(items, opportunityToVectorPayload(item))
	}

	var response map[string]interface{}
	if err := postVectorService("/v1/opportunities/vector/upsert", map[string]interface{}{"items": items}, &response); err != nil {
		return nil, fmt.Errorf("重建岗位向量失败: %w", err)
	}
	response["source_total"] = len(items)
	return response, nil
}

func (s *opportunityService) MatchResume(req *OpportunityVectorMatchRequest) (*OpportunityVectorMatchResponse, error) {
	topK := req.TopK
	if topK <= 0 {
		topK = 5
	}
	if topK > 20 {
		topK = 20
	}

	var response vectorMatchResponse
	if err := postVectorService("/v1/opportunities/vector/match", map[string]interface{}{
		"resume": req.Resume,
		"top_k":  topK,
	}, &response); err != nil {
		return nil, fmt.Errorf("匹配岗位失败: %w", err)
	}
	if response.Error != "" {
		return nil, errors.New(response.Error)
	}

	return &OpportunityVectorMatchResponse{
		Total:          response.Total,
		Matches:        response.Matches,
		EmbeddingModel: response.EmbeddingModel,
		Collection:     response.Collection,
	}, nil
}
