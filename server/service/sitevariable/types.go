package sitevariable

// CreateSiteVariableRequest 创建网站变量请求
type CreateSiteVariableRequest struct {
	Key         string `json:"key" binding:"required"`
	Value       string `json:"value"`
	Description string `json:"description"`
}

// UpdateSiteVariableRequest 更新网站变量请求
type UpdateSiteVariableRequest struct {
	Value       string `json:"value"`
	Description string `json:"description"`
}

// GetSiteVariableListRequest 获取网站变量列表请求
type GetSiteVariableListRequest struct {
	Page     int    `form:"page"`
	PageSize int    `form:"pageSize"`
	Key      string `form:"key"` // 模糊查询
}

// SiteVariableListResponse 网站变量列表响应
type SiteVariableListResponse struct {
	List       interface{} `json:"list"`
	Total      int64       `json:"total"`
	Page       int         `json:"page"`
	PageSize   int         `json:"pageSize"`
	TotalPages int         `json:"totalPages"`
}

// GetSiteVariableByKeyResponse 通过key获取网站变量响应
type GetSiteVariableByKeyResponse struct {
	Value       string `json:"value"`
	Description string `json:"description"`
}
