package chatmessage

import (
	"encoding/json"
	"errors"
	"server/global"
	"server/model"
	"server/utils"
	"time"

	"gorm.io/gorm"
)

type chatMessageService struct{}

var ChatMessageService = &chatMessageService{}

// CreateChatMessage 创建聊天消息
func (s *chatMessageService) CreateChatMessage(userID string, req CreateChatMessageRequest) (*ChatMessageResponse, error) {
	// 验证简历是否存在且属于当前用户
	var resume model.ResumeRecord
	if err := global.DB.Where("id = ? AND user_id = ?", req.ResumeID, userID).First(&resume).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("简历不存在")
		}
		return nil, errors.New("查询简历失败")
	}

	// 将消息内容序列化为JSON
	messageJSON, err := json.Marshal(req.Message)
	if err != nil {
		return nil, errors.New("消息格式错误")
	}

	// 创建聊天消息
	chatMessage := model.ChatMessage{
		ID:         utils.GenerateTLID(),
		ResumeID:   req.ResumeID,
		UserID:     userID,
		SenderName: req.SenderName,
		Message:    model.JSON(messageJSON),
		CreatedAt:  time.Now(),
	}

	if err := global.DB.Create(&chatMessage).Error; err != nil {
		return nil, errors.New("创建聊天消息失败")
	}

	// 构建响应
	var message interface{}
	if len(chatMessage.Message) > 0 {
		json.Unmarshal(chatMessage.Message, &message)
	}

	response := &ChatMessageResponse{
		ID:         chatMessage.ID,
		ResumeID:   chatMessage.ResumeID,
		UserID:     chatMessage.UserID,
		SenderName: chatMessage.SenderName,
		Message:    message,
		CreatedAt:  chatMessage.CreatedAt,
	}

	return response, nil
}

// GetChatMessages 获取聊天消息列表（支持分页和上滑加载）
func (s *chatMessageService) GetChatMessages(userID string, req GetChatMessagesRequest) (*ChatMessagesListResponse, error) {
	// 验证简历是否存在且属于当前用户
	var resume model.ResumeRecord
	if err := global.DB.Where("id = ? AND user_id = ?", req.ResumeID, userID).First(&resume).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("简历不存在")
		}
		return nil, errors.New("查询简历失败")
	}

	// 设置默认分页参数
	page := req.Page
	if page < 1 {
		page = 1
	}
	pageSize := req.PageSize
	if pageSize < 1 {
		pageSize = 20
	}
	if pageSize > 100 {
		pageSize = 100
	}

	// 构建查询
	query := global.DB.Model(&model.ChatMessage{}).Where("resume_id = ?", req.ResumeID)

	// 如果指定了before_time，则获取该时间之前的消息（用于上滑加载）
	if req.BeforeTime != "" {
		beforeTime, err := time.Parse(time.RFC3339, req.BeforeTime)
		if err != nil {
			return nil, errors.New("时间格式错误")
		}
		query = query.Where("created_at < ?", beforeTime)
	}

	// 获取总数
	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, errors.New("查询消息总数失败")
	}

	// 查询消息列表（按创建时间倒序，最新的消息在前）
	var messages []model.ChatMessage
	offset := (page - 1) * pageSize
	if err := query.Order("created_at DESC").Limit(pageSize).Offset(offset).Find(&messages).Error; err != nil {
		return nil, errors.New("查询聊天消息失败")
	}

	// 构建响应
	var responses []ChatMessageResponse
	for _, msg := range messages {
		var message interface{}
		if len(msg.Message) > 0 {
			json.Unmarshal(msg.Message, &message)
		}

		response := ChatMessageResponse{
			ID:         msg.ID,
			ResumeID:   msg.ResumeID,
			UserID:     msg.UserID,
			SenderName: msg.SenderName,
			Message:    message,
			CreatedAt:  msg.CreatedAt,
		}
		responses = append(responses, response)
	}

	// 判断是否还有更多消息
	hasMore := int64(offset+len(messages)) < total

	listResponse := &ChatMessagesListResponse{
		Messages: responses,
		Total:    total,
		Page:     page,
		PageSize: pageSize,
		HasMore:  hasMore,
	}

	return listResponse, nil
}

// DeleteChatMessage 删除聊天消息
func (s *chatMessageService) DeleteChatMessage(messageID, userID string) error {
	// 检查消息是否存在且属于当前用户
	var message model.ChatMessage
	if err := global.DB.Where("id = ? AND user_id = ?", messageID, userID).First(&message).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("消息不存在")
		}
		return errors.New("查询消息失败")
	}

	// 删除消息
	if err := global.DB.Delete(&message).Error; err != nil {
		return errors.New("删除消息失败")
	}

	return nil
}

// DeleteChatMessagesByResume 删除简历下的所有聊天消息
func (s *chatMessageService) DeleteChatMessagesByResume(resumeID, userID string) error {
	// 验证简历是否存在且属于当前用户
	var resume model.ResumeRecord
	if err := global.DB.Where("id = ? AND user_id = ?", resumeID, userID).First(&resume).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("简历不存在")
		}
		return errors.New("查询简历失败")
	}

	// 删除该简历下的所有消息
	if err := global.DB.Where("resume_id = ?", resumeID).Delete(&model.ChatMessage{}).Error; err != nil {
		return errors.New("删除聊天消息失败")
	}

	return nil
}
