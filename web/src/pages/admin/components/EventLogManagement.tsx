import React, { useState, useEffect } from 'react';
import { eventLogAPI } from '@/api/eventlog';
import {Button} from '@/components/ui';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { showError } from '@/utils/toast';
import type { 
  EventLog, 
  EventLogQueryParams,
  // EventCategoryType,
} from '@/types/eventlog';
import {
  EventCategory,
  EventStatus,
  CategoryDisplayNames,
  EventTypeDisplayNames,
  StatusDisplayNames,
  getEventTypesByCategory,
} from '@/types/eventlog';

const EventLogManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<EventLog[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  // Filter states
  const [filters, setFilters] = useState<EventLogQueryParams>({
    page: 1,
    page_size: 20,
  });
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [userId, setUserId] = useState('');
  const [eventCategory, setEventCategory] = useState('');
  const [eventType, setEventType] = useState('');
  const [status, setStatus] = useState('');

  // Detail modal state
  const [selectedLog, setSelectedLog] = useState<EventLog | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Load event logs
  const loadEventLogs = async (params: EventLogQueryParams = filters) => {
    try {
      setLoading(true);
      const response = await eventLogAPI.queryEventLogs(params);
      if (response.code === 0) {
        setLogs(response.data.list || []);
        setPagination({
          current: response.data.page || 1,
          pageSize: response.data.page_size || 20,
          total: response.data.total || 0,
        });
      } else {
        showError(response.msg || '加载日志失败');
      }
    } catch (error) {
      console.error('加载日志失败:', error);
      showError('加载日志失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // Handle query button click
  const handleQuery = () => {
    const queryParams: EventLogQueryParams = {
      page: 1,
      page_size: pagination.pageSize,
      ...(startTime && { start_time: startTime }),
      ...(endTime && { end_time: endTime }),
      ...(userId && { user_id: userId }),
      ...(eventCategory && { event_category: eventCategory }),
      ...(eventType && { event_type: eventType }),
      ...(status && { status: status }),
    };
    setFilters(queryParams);
    loadEventLogs(queryParams);
  };

  // Handle reset filters
  const handleReset = () => {
    setStartTime('');
    setEndTime('');
    setUserId('');
    setEventCategory('');
    setEventType('');
    setStatus('');
    const defaultParams: EventLogQueryParams = {
      page: 1,
      page_size: pagination.pageSize,
    };
    setFilters(defaultParams);
    loadEventLogs(defaultParams);
  };

  // Quick time range buttons
  const setQuickTimeRange = (type: 'today' | 'last7days' | 'last30days') => {
    const now = new Date();
    const endDateTime = now.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:mm
    
    let startDateTime = '';
    switch (type) {
      case 'today':
        startDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().slice(0, 16);
        break;
      case 'last7days':
        startDateTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
        break;
      case 'last30days':
        startDateTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
        break;
    }
    
    setStartTime(startDateTime);
    setEndTime(endDateTime);
  };

  // Clear time range
  const clearTimeRange = () => {
    setStartTime('');
    setEndTime('');
  };

  // Handle category change (reset event type when category changes)
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCategory = e.target.value;
    setEventCategory(newCategory);
    setEventType(''); // Reset event type when category changes
  };

  // Get filtered event types based on selected category
  const getFilteredEventTypes = (): string[] => {
    if (!eventCategory) {
      // If no category selected, return all event types
      return Object.values(EventCategory).flatMap(cat => getEventTypesByCategory(cat));
    }
    return getEventTypesByCategory(eventCategory);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    const newParams = { ...filters, page };
    setFilters(newParams);
    loadEventLogs(newParams);
  };

  // Handle page size change
  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPageSize = parseInt(e.target.value, 10);
    const newParams = { ...filters, page: 1, page_size: newPageSize };
    setPagination(prev => ({ ...prev, pageSize: newPageSize, current: 1 }));
    setFilters(newParams);
    loadEventLogs(newParams);
  };

  // Open detail modal
  const handleViewDetail = (log: EventLog) => {
    setSelectedLog(log);
    setIsDetailModalOpen(true);
  };

  // Close detail modal
  const handleCloseDetail = () => {
    setSelectedLog(null);
    setIsDetailModalOpen(false);
  };

  // Format datetime for display
  const formatDateTime = (datetime: string): string => {
    try {
      return new Date(datetime).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return datetime;
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    let colorClass = 'bg-gray-100 text-gray-800';
    
    if (statusLower === EventStatus.SUCCESS) {
      colorClass = 'bg-green-100 text-green-800';
    } else if (statusLower === EventStatus.FAILED) {
      colorClass = 'bg-red-100 text-red-800';
    } else if (statusLower === EventStatus.ERROR) {
      colorClass = 'bg-orange-100 text-orange-800';
    }
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colorClass}`}>
        {StatusDisplayNames[statusLower] || status}
      </span>
    );
  };

  // Initial load
  useEffect(() => {
    loadEventLogs();
  }, []);

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-baseline gap-4">
            <h2 className="text-2xl font-bold text-gray-900">事件日志</h2>
            <div className="text-sm text-gray-600">
              共找到 <span className="font-medium text-gray-900">{pagination.total}</span> 条日志
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Time Range Filter - Primary Feature */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                时间范围
              </label>
              <div className="flex flex-row flex-wrap gap-2 items-center">
                <div>
                  <Input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartTime(e.target.value)}
                    placeholder="开始时间"
                    className="flex-1 min-w-[200px]"
                  />
                </div>
                <span className="text-gray-500">至</span>
                <div>
                  <Input
                    type="datetime-local"
                    value={endTime}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndTime(e.target.value)}
                    placeholder="结束时间"
                    className="flex-1 min-w-[200px]"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                <Button size="sm" variant="outline" onClick={() => setQuickTimeRange('today')}>
                  今天
                </Button>
                <Button size="sm" variant="outline" onClick={() => setQuickTimeRange('last7days')}>
                  最近7天
                </Button>
                <Button size="sm" variant="outline" onClick={() => setQuickTimeRange('last30days')}>
                  最近30天
                </Button>
                <Button size="sm" variant="outline" onClick={clearTimeRange}>
                  清除
                </Button>
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                状态
              </label>
              <select
                value={status}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">全部状态</option>
                {Object.values(EventStatus).map(st => (
                  <option key={st} value={st}>
                    {StatusDisplayNames[st] || st}
                  </option>
                ))}
              </select>
            </div>

            {/* User ID Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                用户ID
              </label>
              <Input
                type="text"
                value={userId}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserId(e.target.value)}
                placeholder="输入用户ID"
              />
            </div>

            {/* Event Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                事件分类
              </label>
              <select
                value={eventCategory}
                onChange={handleCategoryChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">全部分类</option>
                {Object.values(EventCategory).map(cat => (
                  <option key={cat} value={cat}>
                    {CategoryDisplayNames[cat] || cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Event Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                事件类型
              </label>
              <select
                value={eventType}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEventType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!eventCategory && getFilteredEventTypes().length === 0}
              >
                <option value="">全部类型</option>
                {getFilteredEventTypes().map(type => (
                  <option key={type} value={type}>
                    {EventTypeDisplayNames[type] || type}
                  </option>
                ))}
              </select>
            </div>

            
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-4">
            <Button onClick={handleQuery} disabled={loading}>
              查询
            </Button>
            <Button variant="outline" onClick={handleReset} disabled={loading}>
              重置
            </Button>
          </div>
        </div>

        {/* Table Display */}
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">加载中...</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      时间
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      用户ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      事件分类
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      事件类型
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      状态
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP地址
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDateTime(log.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.user_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {CategoryDisplayNames[log.event_category] || log.event_category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {EventTypeDisplayNames[log.event_type] || log.event_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(log.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.ip_address}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => handleViewDetail(log)}
                        >
                          详情
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="border rounded-lg p-4 bg-white">
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-sm font-medium text-gray-900">
                      {EventTypeDisplayNames[log.event_type] || log.event_type}
                    </div>
                    {getStatusBadge(log.status)}
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div>时间: {formatDateTime(log.created_at)}</div>
                    <div>用户: {log.user_id}</div>
                    <div>分类: {CategoryDisplayNames[log.event_category] || log.event_category}</div>
                    <div>IP: {log.ip_address}</div>
                  </div>
                  <div className="mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetail(log)}
                      className="w-full"
                    >
                      查看详情
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {logs.length === 0 && !loading && (
              <div className="text-center py-8 text-gray-500">
                暂无日志数据
              </div>
            )}
          </>
        )}

        {/* Pagination */}
        {pagination.total > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">每页显示</span>
              <select
                value={pagination.pageSize}
                onChange={handlePageSizeChange}
                className="px-2 py-1 border border-gray-300 rounded-md text-sm"
                disabled={loading}
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
              <span className="text-sm text-gray-600">条</span>
            </div>

            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => handlePageChange(pagination.current - 1)}
                disabled={pagination.current <= 1 || loading}
              >
                上一页
              </Button>
              
              <span className="text-sm text-gray-600">
                第 {pagination.current} 页，共 {Math.ceil(pagination.total / pagination.pageSize)} 页
              </span>
              
              <Button
                variant="outline"
                onClick={() => handlePageChange(pagination.current + 1)}
                disabled={pagination.current >= Math.ceil(pagination.total / pagination.pageSize) || loading}
              >
                下一页
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <Modal
        open={isDetailModalOpen}
        onClose={handleCloseDetail}
        title="事件日志详情"
      >
        {selectedLog && (
          <div className="space-y-4 p-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-gray-500">事件ID</div>
                <div className="text-sm text-gray-900">{selectedLog.id}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">时间</div>
                <div className="text-sm text-gray-900">{formatDateTime(selectedLog.created_at)}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">用户ID</div>
                <div className="text-sm text-gray-900">{selectedLog.user_id}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">状态</div>
                <div>{getStatusBadge(selectedLog.status)}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">事件分类</div>
                <div className="text-sm text-gray-900">
                  {CategoryDisplayNames[selectedLog.event_category] || selectedLog.event_category}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">事件类型</div>
                <div className="text-sm text-gray-900">
                  {EventTypeDisplayNames[selectedLog.event_type] || selectedLog.event_type}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">IP地址</div>
                <div className="text-sm text-gray-900">{selectedLog.ip_address}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">User Agent</div>
                <div className="text-sm text-gray-900 truncate" title={selectedLog.user_agent}>
                  {selectedLog.user_agent}
                </div>
              </div>
              {selectedLog.resource_type && (
                <div>
                  <div className="text-sm font-medium text-gray-500">资源类型</div>
                  <div className="text-sm text-gray-900">{selectedLog.resource_type}</div>
                </div>
              )}
              {selectedLog.resource_id && (
                <div>
                  <div className="text-sm font-medium text-gray-500">资源ID</div>
                  <div className="text-sm text-gray-900">{selectedLog.resource_id}</div>
                </div>
              )}
            </div>

            {/* Error Message */}
            {selectedLog.error_message && (
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">错误信息</div>
                <div className="bg-red-50 text-red-800 p-3 rounded-lg text-sm">
                  {selectedLog.error_message}
                </div>
              </div>
            )}

            {/* Details (JSON) */}
            {selectedLog.details && (
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">详细信息</div>
                <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-xs">
                  <code>{JSON.stringify(selectedLog.details, null, 2)}</code>
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default EventLogManagement;

