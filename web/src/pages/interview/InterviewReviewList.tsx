/**
 * Interview Review List Page
 * Displays all user's interview review records
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiEdit2, FiCheck, FiX } from 'react-icons/fi';
import { Button, Input } from '@/components/ui';
import { ReviewStatusBadge } from '@/components/interview/ReviewStatusBadge';
import { interviewAPI } from '@/api/interview';
import { showError, showSuccess } from '@/utils/toast';
import type { InterviewReview } from '@/types/interview';

export const InterviewReviewList: React.FC = () => {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<InterviewReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);

  // Inline editing state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingField, setEditingField] = useState<'job_position' | 'target_company' | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [saving, setSaving] = useState(false);

  /**
   * Load reviews from API
   */
  const loadReviews = async (currentPage: number) => {
    setLoading(true);
    try {
      const data = await interviewAPI.listReviews({
        page: currentPage,
        page_size: pageSize,
      });
      console.log('data', data);
      setReviews(data.list);
      setTotal(data.total);
      setPage(data.page);
    } catch (error) {
      showError('加载面试复盘列表失败');
      console.error('Failed to load reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews(page);
  }, [page]);

  /**
   * Navigate to detail page
   */
  const handleViewDetail = (reviewId: number) => {
    navigate(`/interview/reviews?id=${reviewId}`);
  };

  /**
   * Navigate to new review creation
   */
  const handleCreateNew = () => {
    navigate('/interview/reviews');
  };

  /**
   * Start inline editing
   */
  const startEditing = (review: InterviewReview, field: 'job_position' | 'target_company') => {
    setEditingId(review.id);
    setEditingField(field);
    setEditingValue(review.metadata[field] || '');
  };

  /**
   * Save inline edit
   */
  const saveEdit = async () => {
    if (!editingId || !editingField) return;

    setSaving(true);
    try {
      await interviewAPI.updateReviewMetadata(editingId, {
        metadata: {
          [editingField]: editingValue,
        },
      });

      // Update local state
      setReviews((prev) =>
        prev.map((review) =>
          review.id === editingId
            ? {
                ...review,
                metadata: {
                  ...review.metadata,
                  [editingField]: editingValue,
                },
              }
            : review
        )
      );

      showSuccess('保存成功');
      cancelEdit();
    } catch (error) {
      showError('保存失败');
      console.error('Failed to save edit:', error);
    } finally {
      setSaving(false);
    }
  };

  /**
   * Cancel inline editing
   */
  const cancelEdit = () => {
    setEditingId(null);
    setEditingField(null);
    setEditingValue('');
  };

  /**
   * Format timestamp
   */
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  /**
   * Render loading skeleton
   */
  const renderSkeleton = () => (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
      ))}
    </div>
  );

  /**
   * Render empty state
   */
  const renderEmpty = () => (
    <div className="text-center py-16">
      <div className="text-gray-400 text-lg mb-4">暂无面试复盘记录</div>
      <Button onClick={handleCreateNew}>
        <FiPlus className="mr-2" />
        创建第一条记录
      </Button>
    </div>
  );

  /**
   * Render editable field
   */
  const renderEditableField = (
    review: InterviewReview,
    field: 'job_position' | 'target_company',
    placeholder: string
  ) => {
    const isEditing = editingId === review.id && editingField === field;
    const value = review.metadata[field] || '';

    if (isEditing) {
      return (
        <div className="flex items-center gap-2">
          <Input
            value={editingValue}
            onChange={(e) => setEditingValue(e.target.value)}
            placeholder={placeholder}
            maxLength={50}
            className="flex-1"
            autoFocus
          />
          <button
            onClick={saveEdit}
            disabled={saving}
            className="text-green-600 hover:text-green-700 disabled:opacity-50"
          >
            <FiCheck className="w-5 h-5" />
          </button>
          <button
            onClick={cancelEdit}
            disabled={saving}
            className="text-red-600 hover:text-red-700 disabled:opacity-50"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 group">
        <span className="text-gray-900">{value || <span className="text-gray-400">{placeholder}</span>}</span>
        <button
          onClick={() => startEditing(review, field)}
          className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <FiEdit2 className="w-4 h-4" />
        </button>
      </div>
    );
  };

  /**
   * Render pagination
   */
  const renderPagination = () => {
    const totalPages = Math.ceil(total / pageSize);
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-gray-600">
          共 {total} 条记录
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            上一页
          </Button>
          <span className="text-sm text-gray-600">
            第 {page} / {totalPages} 页
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            下一页
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl mt-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">面试复盘</h1>
          <p className="text-gray-600 mt-2">AI驱动的面试表现分析与反馈</p>
        </div>
        <Button onClick={handleCreateNew}>
          <FiPlus className="mr-2" />
          新建复盘
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        renderSkeleton()
      ) : reviews.length === 0 ? (
        renderEmpty()
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    创建时间
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    岗位
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    目标公司
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reviews.map((review) => (
                  <tr
                    key={review.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleViewDetail(review.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatTime(review.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <ReviewStatusBadge status={review.metadata.status} size="sm" />
                    </td>
                    <td className="px-6 py-4 text-sm" onClick={(e) => e.stopPropagation()}>
                      {renderEditableField(review, 'job_position', '未填写岗位')}
                    </td>
                    <td className="px-6 py-4 text-sm" onClick={(e) => e.stopPropagation()}>
                      {renderEditableField(review, 'target_company', '未填写公司')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetail(review.id);
                        }}
                      >
                        查看详情
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleViewDetail(review.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <ReviewStatusBadge status={review.metadata.status} size="sm" />
                  <span className="text-xs text-gray-500">{formatTime(review.created_at)}</span>
                </div>
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="text-gray-500">岗位：</span>
                    <span className="text-gray-900">
                      {review.metadata.job_position || '未填写'}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500">公司：</span>
                    <span className="text-gray-900">
                      {review.metadata.target_company || '未填写'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {renderPagination()}
        </>
      )}
    </div>
  );
};

export default InterviewReviewList;
