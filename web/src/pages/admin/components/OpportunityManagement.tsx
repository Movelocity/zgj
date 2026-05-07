import React, { useEffect, useState } from 'react';
import { FiArchive, FiEdit2, FiPlus, FiRefreshCw, FiSearch, FiUpload } from 'react-icons/fi';
import { Button, Modal } from '@/components/ui';
import { opportunityAPI } from '@/api/opportunity';
import { showError, showSuccess } from '@/utils/toast';
import type { JobOpportunity, OpportunityStatus, OpportunityUpsertRequest } from '@/types/opportunity';

type OpportunityForm = Omit<OpportunityUpsertRequest, 'responsibilities' | 'requirements'> & {
  responsibilitiesText: string;
  requirementsText: string;
};

const emptyForm: OpportunityForm = {
  company: '',
  title: '',
  category: '',
  location: '',
  cadence: '',
  summary: '',
  responsibilitiesText: '',
  requirementsText: '',
  contact_email: '',
  note: '',
  status: 'published',
  sort_order: 0,
};

const statusLabels: Record<OpportunityStatus, string> = {
  draft: '草稿',
  published: '已发布',
  archived: '已下架',
};

const splitLines = (value: string) => value
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean);

const toForm = (opportunity: JobOpportunity): OpportunityForm => ({
  company: opportunity.company,
  title: opportunity.title,
  category: opportunity.category,
  location: opportunity.location,
  cadence: opportunity.cadence,
  summary: opportunity.summary,
  responsibilitiesText: opportunity.responsibilities.join('\n'),
  requirementsText: opportunity.requirements.join('\n'),
  contact_email: opportunity.contact_email,
  note: opportunity.note,
  status: opportunity.status,
  sort_order: opportunity.sort_order,
});

const toRequest = (form: OpportunityForm): OpportunityUpsertRequest => ({
  company: form.company.trim(),
  title: form.title.trim(),
  category: form.category.trim(),
  location: form.location?.trim(),
  cadence: form.cadence?.trim(),
  summary: form.summary?.trim(),
  responsibilities: splitLines(form.responsibilitiesText),
  requirements: splitLines(form.requirementsText),
  contact_email: form.contact_email.trim(),
  note: form.note?.trim(),
  status: form.status,
  sort_order: Number(form.sort_order || 0),
});

const OpportunityManagement: React.FC = () => {
  const [opportunities, setOpportunities] = useState<JobOpportunity[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<OpportunityStatus | ''>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [form, setForm] = useState<OpportunityForm>(emptyForm);
  const [editing, setEditing] = useState<JobOpportunity | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchJSON, setBatchJSON] = useState('');

  const loadOpportunities = async (page = currentPage) => {
    try {
      setLoading(true);
      const response = await opportunityAPI.getAdminOpportunities({
        page,
        page_size: 20,
        keyword: keyword || undefined,
        status,
      });
      if (response.code === 0) {
        setOpportunities(response.data.list || []);
        setCurrentPage(response.data.page || 1);
        setTotalPages(response.data.total_pages || 1);
        setTotal(response.data.total || 0);
      } else {
        showError(response.msg || '加载岗位失败');
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : '加载岗位失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOpportunities(1);
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowFormModal(true);
  };

  const openEdit = (opportunity: JobOpportunity) => {
    setEditing(opportunity);
    setForm(toForm(opportunity));
    setShowFormModal(true);
  };

  const validateForm = () => {
    if (!form.company.trim() || !form.title.trim() || !form.category.trim() || !form.contact_email.trim()) {
      showError('企业、岗位、方向类别和联系方式不能为空');
      return false;
    }
    return true;
  };

  const submitForm = async () => {
    if (!validateForm()) return;

    try {
      const data = toRequest(form);
      const response = editing
        ? await opportunityAPI.updateOpportunity(editing.id, data)
        : await opportunityAPI.createOpportunity(data);
      if (response.code === 0) {
        showSuccess(editing ? '更新成功' : '创建成功');
        setShowFormModal(false);
        setEditing(null);
        setForm(emptyForm);
        loadOpportunities();
      } else {
        showError(response.msg || '保存失败');
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : '保存失败');
    }
  };

  const archiveOpportunity = async (opportunity: JobOpportunity) => {
    if (!window.confirm(`确定下架「${opportunity.title}」吗？`)) return;

    try {
      const response = await opportunityAPI.archiveOpportunity(opportunity.id);
      if (response.code === 0) {
        showSuccess('已下架');
        loadOpportunities();
      } else {
        showError(response.msg || '下架失败');
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : '下架失败');
    }
  };

  const submitBatch = async () => {
    try {
      const parsed = JSON.parse(batchJSON);
      const items = Array.isArray(parsed) ? parsed : parsed.items;
      if (!Array.isArray(items) || items.length === 0) {
        showError('请输入岗位数组，或包含 items 数组的 JSON 对象');
        return;
      }
      const response = await opportunityAPI.batchCreateOpportunities({ items });
      if (response.code === 0) {
        showSuccess(`已上传 ${response.data.length} 条岗位`);
        setShowBatchModal(false);
        setBatchJSON('');
        loadOpportunities(1);
      } else {
        showError(response.msg || '批量上传失败');
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : 'JSON 格式错误');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">实习机会管理</h1>
          <p className="mt-1 text-sm text-gray-500">管理首页导航“实习机会”展示的岗位内容，共 {total} 条。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => loadOpportunities()} disabled={loading}>
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
            刷新
          </Button>
          <Button variant="outline" onClick={() => setShowBatchModal(true)}>
            <FiUpload />
            JSON 上传
          </Button>
          <Button onClick={openCreate}>
            <FiPlus />
            新增岗位
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-lg bg-white p-4 shadow sm:flex-row">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadOpportunities(1)}
            placeholder="搜索企业、岗位、类别或简介"
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as OpportunityStatus | '')}
          className="rounded-lg border border-gray-300 px-3 py-2"
        >
          <option value="">全部状态</option>
          <option value="published">已发布</option>
          <option value="draft">草稿</option>
          <option value="archived">已下架</option>
        </select>
        <Button variant="outline" onClick={() => loadOpportunities(1)}>
          查询
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">企业/岗位</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">类别</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">地点/邮箱</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">状态</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">更新时间</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">加载中...</td></tr>
              ) : opportunities.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">暂无岗位</td></tr>
              ) : opportunities.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{item.company}</div>
                    <div className="mt-1 max-w-md truncate text-sm text-gray-600">{item.title}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{item.category}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div>{item.location || '未注明'}</div>
                    <div className="text-blue-600">{item.contact_email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700">{statusLabels[item.status]}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(item.updated_at).toLocaleString('zh-CN')}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => openEdit(item)} className="mr-4 text-blue-600 hover:text-blue-900" title="编辑">
                      <FiEdit2 className="inline" />
                    </button>
                    {item.status !== 'archived' && (
                      <button onClick={() => archiveOpportunity(item)} className="text-red-600 hover:text-red-900" title="下架">
                        <FiArchive className="inline" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
            <p className="text-sm text-gray-700">第 {currentPage} 页，共 {totalPages} 页</p>
            <div className="flex gap-2">
              <Button variant="outline" disabled={currentPage === 1} onClick={() => loadOpportunities(currentPage - 1)}>上一页</Button>
              <Button variant="outline" disabled={currentPage === totalPages} onClick={() => loadOpportunities(currentPage + 1)}>下一页</Button>
            </div>
          </div>
        )}
      </div>

      <Modal open={showFormModal} onClose={() => setShowFormModal(false)} title={editing ? '编辑岗位' : '新增岗位'}>
        <div className="grid max-h-[75vh] gap-4 overflow-y-auto p-4 md:grid-cols-2">
          {[
            ['企业', 'company'],
            ['岗位', 'title'],
            ['方向类别', 'category'],
            ['地点', 'location'],
            ['到岗要求', 'cadence'],
            ['联系方式', 'contact_email'],
          ].map(([label, key]) => (
            <label key={key} className="flex flex-col gap-1 text-sm font-medium text-gray-700">
              {label}
              <input
                value={String(form[key as keyof OpportunityForm] || '')}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="rounded-lg border border-gray-300 px-3 py-2"
              />
            </label>
          ))}
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            状态
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as OpportunityStatus })}
              className="rounded-lg border border-gray-300 px-3 py-2"
            >
              <option value="published">已发布</option>
              <option value="draft">草稿</option>
              <option value="archived">已下架</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            排序
            <input
              type="number"
              value={form.sort_order}
              onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
              className="rounded-lg border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700 md:col-span-2">
            简介
            <textarea value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} rows={3} className="rounded-lg border border-gray-300 px-3 py-2" />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            岗位职责（每行一条）
            <textarea value={form.responsibilitiesText} onChange={(e) => setForm({ ...form, responsibilitiesText: e.target.value })} rows={8} className="rounded-lg border border-gray-300 px-3 py-2" />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            任职要求（每行一条）
            <textarea value={form.requirementsText} onChange={(e) => setForm({ ...form, requirementsText: e.target.value })} rows={8} className="rounded-lg border border-gray-300 px-3 py-2" />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700 md:col-span-2">
            备注
            <textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} rows={3} className="rounded-lg border border-gray-300 px-3 py-2" />
          </label>
          <div className="flex justify-end gap-3 md:col-span-2">
            <Button variant="outline" onClick={() => setShowFormModal(false)}>取消</Button>
            <Button onClick={submitForm}>保存</Button>
          </div>
        </div>
      </Modal>

      <Modal open={showBatchModal} onClose={() => setShowBatchModal(false)} title="JSON 批量上传岗位">
        <div className="flex flex-col gap-4 p-4">
          <p className="text-sm text-gray-500">支持上传岗位数组，字段同 API：company、title、category、contact_email、responsibilities、requirements 等。</p>
          <textarea
            value={batchJSON}
            onChange={(e) => setBatchJSON(e.target.value)}
            rows={14}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm"
            placeholder='[{"company":"示例公司","title":"AI 产品实习生","category":"AI 产品","contact_email":"hr@example.com","responsibilities":["搭建工作流"],"requirements":["熟悉 Dify"]}]'
          />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowBatchModal(false)}>取消</Button>
            <Button onClick={submitBatch}>上传</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default OpportunityManagement;
