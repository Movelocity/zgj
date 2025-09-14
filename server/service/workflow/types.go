package workflow

import "time"

// WorkflowExecutionInfo 工作流执行信息
type WorkflowExecutionInfo struct {
	ID            string      `json:"id"`
	WorkflowID    string      `json:"workflow_id"`
	WorkflowName  string      `json:"workflow_name"`
	ResumeID      string      `json:"resume_id"`
	Inputs        interface{} `json:"inputs"`
	Outputs       interface{} `json:"outputs"`
	Status        string      `json:"status"`
	ErrorMessage  string      `json:"error_message"`
	ExecutionTime int         `json:"execution_time"`
	CreatedAt     time.Time   `json:"created_at"`
}

// WorkflowExecutionDetail 工作流执行详情
type WorkflowExecutionDetail struct {
	ID            string      `json:"id"`
	WorkflowID    string      `json:"workflow_id"`
	WorkflowName  string      `json:"workflow_name"`
	UserID        string      `json:"user_id"`
	UserName      string      `json:"user_name"`
	ResumeID      string      `json:"resume_id"`
	ResumeName    string      `json:"resume_name"`
	Inputs        interface{} `json:"inputs"`
	Outputs       interface{} `json:"outputs"`
	Status        string      `json:"status"`
	ErrorMessage  string      `json:"error_message"`
	ExecutionTime int         `json:"execution_time"`
	CreatedAt     time.Time   `json:"created_at"`
}

// WorkflowExecutionListResponse 工作流执行历史列表响应
type WorkflowExecutionListResponse struct {
	List     []WorkflowExecutionInfo `json:"list"`
	Total    int64                   `json:"total"`
	Page     int                     `json:"page"`
	PageSize int                     `json:"page_size"`
}

// WorkflowStatsResponse 工作流统计响应
type WorkflowStatsResponse struct {
	TotalExecutions   int64      `json:"total_executions"`   // 总执行次数
	SuccessExecutions int64      `json:"success_executions"` // 成功执行次数
	FailedExecutions  int64      `json:"failed_executions"`  // 失败执行次数
	SuccessRate       float64    `json:"success_rate"`       // 成功率（百分比）
	AvgExecutionTime  int        `json:"avg_execution_time"` // 平均执行时间（毫秒）
	LastExecutionAt   *time.Time `json:"last_execution_at"`  // 最近执行时间
}
