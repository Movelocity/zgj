import React, { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Input } from '@/components/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Briefcase, Building2, FileText, Loader2, ListFilter, Mail, MapPin, Search, Sparkles, Tags, Upload, X } from 'lucide-react';
import { opportunityAPI } from '@/api/opportunity';
import type { JobOpportunity, OpportunityVectorMatch } from '@/types/opportunity';

const ALL_VALUE = 'all';

const normalize = (value?: string) => (value || '').trim().toLowerCase();

const scoreLabel = (score?: number) => `${Math.round((score || 0) * 100)}%`;

const getInitialMatchProgress = (hasFile: boolean) => ({
  active: true,
  progress: hasFile ? 18 : 35,
  title: hasFile ? '上传并解析简历' : '读取简历文本',
  description: hasFile ? '正在上传文件并提取简历文本，请稍等。' : '正在读取文本内容，准备进行岗位匹配。',
});

const getSearchText = (opportunity: JobOpportunity) => [
  opportunity.company,
  opportunity.title,
  opportunity.category,
  opportunity.location,
  opportunity.cadence,
  opportunity.summary,
  opportunity.contact_email,
  opportunity.note,
  ...opportunity.responsibilities,
  ...opportunity.requirements,
].join(' ').toLowerCase();

interface DetailListProps {
  title: string;
  icon: React.ReactNode;
  items: string[];
  emptyText: string;
}

const DetailList: React.FC<DetailListProps> = ({ title, icon, items, emptyText }) => (
  <div>
    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-950">
      {icon}
      {title}
    </div>
    {items.length > 0 ? (
      <ul className="grid gap-2">
        {items.map((item, index) => (
          <li
            key={`${item}-${index}`}
            className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm leading-6 text-slate-700"
          >
            {item}
          </li>
        ))}
      </ul>
    ) : (
      <p className="rounded-md border border-dashed border-slate-200 bg-white px-3 py-3 text-sm text-slate-500">
        {emptyText}
      </p>
    )}
  </div>
);

const Opportunities: React.FC = () => {
  const [opportunities, setOpportunities] = useState<JobOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [companyFilter, setCompanyFilter] = useState(ALL_VALUE);
  const [categoryFilter, setCategoryFilter] = useState(ALL_VALUE);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [resumeText, setResumeText] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [matching, setMatching] = useState(false);
  const [matchError, setMatchError] = useState('');
  const [matchResults, setMatchResults] = useState<OpportunityVectorMatch[]>([]);
  const [matchProgress, setMatchProgress] = useState({
    active: false,
    progress: 0,
    title: '',
    description: '',
  });

  const loadOpportunities = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await opportunityAPI.getPublicOpportunities({ page: 1, page_size: 100 });
      if (response.code === 0) {
        const list = response.data.list || [];
        setOpportunities(list);
        setSelectedId(list[0]?.id || null);
      } else {
        setError(response.msg || '加载岗位机会失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载岗位机会失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOpportunities();
  }, []);

  const companies = useMemo(
    () => Array.from(new Set(opportunities.map((item) => item.company).filter(Boolean))).sort(),
    [opportunities]
  );

  const categories = useMemo(
    () => Array.from(new Set(opportunities.map((item) => item.category).filter(Boolean))).sort(),
    [opportunities]
  );

  const filteredOpportunities = useMemo(() => {
    const keyword = normalize(searchKeyword);

    return opportunities.filter((opportunity) => {
      const matchesKeyword = !keyword || getSearchText(opportunity).includes(keyword);
      const matchesCompany = companyFilter === ALL_VALUE || opportunity.company === companyFilter;
      const matchesCategory = categoryFilter === ALL_VALUE || opportunity.category === categoryFilter;
      return matchesKeyword && matchesCompany && matchesCategory;
    });
  }, [categoryFilter, companyFilter, opportunities, searchKeyword]);

  const matchByOpportunityId = useMemo(() => {
    return new Map(matchResults.map((item, index) => [item.opportunity_id, { ...item, rank: index + 1 }]));
  }, [matchResults]);

  const displayOpportunities = useMemo(() => {
    if (matchResults.length === 0) {
      return filteredOpportunities;
    }

    return [...filteredOpportunities].sort((a, b) => {
      const matchA = matchByOpportunityId.get(a.id);
      const matchB = matchByOpportunityId.get(b.id);
      if (matchA && matchB) {
        return matchB.score - matchA.score;
      }
      if (matchA) return -1;
      if (matchB) return 1;
      return a.sort_order - b.sort_order;
    });
  }, [filteredOpportunities, matchByOpportunityId, matchResults.length]);

  useEffect(() => {
    if (displayOpportunities.length === 0) {
      if (selectedId !== null) {
        setSelectedId(null);
      }
      return;
    }

    if (!displayOpportunities.some((item) => item.id === selectedId)) {
      setSelectedId(displayOpportunities[0].id);
    }
  }, [displayOpportunities, selectedId]);

  const selectedOpportunity = useMemo(
    () => displayOpportunities.find((item) => item.id === selectedId) || displayOpportunities[0] || null,
    [displayOpportunities, selectedId]
  );

  const selectedMatch = selectedOpportunity ? matchByOpportunityId.get(selectedOpportunity.id) : undefined;

  const hasFilters = Boolean(searchKeyword.trim()) || companyFilter !== ALL_VALUE || categoryFilter !== ALL_VALUE;
  const hasMatchResults = matchResults.length > 0;

  const clearFilters = () => {
    setSearchKeyword('');
    setCompanyFilter(ALL_VALUE);
    setCategoryFilter(ALL_VALUE);
  };

  const clearMatch = () => {
    setResumeText('');
    setResumeFile(null);
    setMatchError('');
    setMatchResults([]);
    setMatchProgress({ active: false, progress: 0, title: '', description: '' });
  };

  const handleMatch = async () => {
    const content = resumeText.trim();
    if (!content && !resumeFile) {
      setMatchError('请先上传简历文件或粘贴简历内容后再匹配。');
      return;
    }

    try {
      setMatching(true);
      setMatchError('');
      setMatchProgress(getInitialMatchProgress(Boolean(resumeFile)));

      const progressTimers: ReturnType<typeof setTimeout>[] = [
        setTimeout(() => {
          setMatchProgress({
            active: true,
            progress: 58,
            title: '生成简历语义特征',
            description: '正在理解简历中的技能、经历和岗位偏好。',
          });
        }, 600),
        setTimeout(() => {
          setMatchProgress({
            active: true,
            progress: 78,
            title: '匹配岗位库',
            description: '正在与已收录岗位计算匹配度并排序。',
          });
        }, 1800),
      ];

      const topK = Math.min(Math.max(opportunities.length, 5), 20);
      let response;
      try {
        response = resumeFile
          ? await opportunityAPI.matchOpportunitiesByFile(resumeFile, topK)
          : await opportunityAPI.matchOpportunities({
            resume: content,
            top_k: topK,
          });
      } finally {
        progressTimers.forEach((timer) => clearTimeout(timer));
      }

      if (response.code !== 0) {
        setMatchError(response.msg || '岗位匹配失败');
        setMatchProgress({
          active: true,
          progress: 100,
          title: '匹配失败',
          description: response.msg || '岗位匹配失败，请稍后重试。',
        });
        return;
      }

      setMatchProgress({
        active: true,
        progress: 100,
        title: '匹配完成',
        description: '已按匹配度更新岗位列表。',
      });
      const matches = response.data.matches || [];
      setMatchResults(matches);
      if (matches[0]?.opportunity_id) {
        setSelectedId(matches[0].opportunity_id);
      }
      if (matches.length === 0) {
        setMatchError('暂无匹配结果，请稍后重试或联系管理员重建岗位向量。');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '岗位匹配失败';
      setMatchError(message.includes('登录') ? '请先登录后再进行岗位匹配。' : message);
      setMatchProgress({
        active: true,
        progress: 100,
        title: '匹配失败',
        description: message.includes('登录') ? '请先登录后再进行岗位匹配。' : message,
      });
    } finally {
      setMatching(false);
      setTimeout(() => {
        setMatchProgress((current) => (
          current.title === '匹配完成'
            ? { active: false, progress: 0, title: '', description: '' }
            : current
        ));
      }, 1800);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 bg-[radial-gradient(circle_at_1px_1px,rgba(15,23,42,0.08)_1px,transparent_0)] [background-size:24px_24px]">
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 max-w-3xl">
            <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-100">
              <Sparkles className="mr-1 h-3.5 w-3.5" />
              岗位内推
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-slate-950 md:text-5xl">
              内容与 AI 职位机会
            </h1>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              收录实习与正式岗位，按企业、岗位、类别、地点和联系方式整理，可搜索后快速查看岗位详情。
            </p>
          </div>

          <Card className="mb-6 border-slate-200 bg-white/95 shadow-sm backdrop-blur">
            <CardContent className="grid gap-4 p-4 lg:grid-cols-[1.4fr_0.8fr_0.8fr_auto] lg:items-end">
              <Input
                label="搜索岗位"
                value={searchKeyword}
                leftIcon={<Search className="h-4 w-4" />}
                placeholder="搜索企业、岗位、地点、要求或邮箱"
                onChange={(event) => setSearchKeyword(event.target.value)}
              />

              <div className="grid gap-1.5">
                <label className="text-sm font-medium leading-none text-slate-900">企业</label>
                <select
                  value={companyFilter}
                  onChange={(event) => setCompanyFilter(event.target.value)}
                  className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-xs outline-none transition-[color,box-shadow] focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                >
                  <option value={ALL_VALUE}>全部企业</option>
                  {companies.map((company) => (
                    <option key={company} value={company}>{company}</option>
                  ))}
                </select>
              </div>

              <div className="grid gap-1.5">
                <label className="text-sm font-medium leading-none text-slate-900">类别</label>
                <select
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                  className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-xs outline-none transition-[color,box-shadow] focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                >
                  <option value={ALL_VALUE}>全部类别</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <Button
                type="button"
                variant="outline"
                disabled={!hasFilters}
                onClick={clearFilters}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                清空
              </Button>
            </CardContent>
          </Card>

          <Card className="mb-6 border-slate-200 bg-white/95 shadow-sm backdrop-blur">
            <CardContent className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <div className="grid gap-2">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <label htmlFor="resume-match-text" className="text-sm font-medium leading-none text-slate-900">
                    简历匹配岗位
                  </label>
                  {hasMatchResults && (
                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                      已匹配 {matchResults.length} 个岗位
                    </Badge>
                  )}
                </div>
                <div className="flex flex-col gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50/80 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white text-slate-700 shadow-sm">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-slate-900">
                        {resumeFile ? resumeFile.name : '上传 PDF / DOCX / TXT 简历'}
                      </div>
                      <div className="text-xs leading-5 text-slate-500">
                        上传后直接用于岗位匹配，不在页面展示模型信息。
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <input
                      id="resume-match-file"
                      type="file"
                      accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                      className="hidden"
                      onChange={(event) => {
                        setResumeFile(event.target.files?.[0] || null);
                        setMatchError('');
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="gap-2"
                      disabled={matching}
                      onClick={() => document.getElementById('resume-match-file')?.click()}
                    >
                      <Upload className="h-4 w-4" />
                      选择文件
                    </Button>
                    {resumeFile && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        disabled={matching}
                        onClick={() => setResumeFile(null)}
                        aria-label="移除已选简历文件"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <textarea
                  id="resume-match-text"
                  value={resumeText}
                  rows={5}
                  placeholder="也可以粘贴简历文本或核心经历，系统会按语义匹配岗位并排序"
                  onChange={(event) => setResumeText(event.target.value)}
                  className="min-h-[132px] resize-y rounded-md border border-slate-200 bg-white px-3 py-2 text-sm leading-6 text-slate-700 shadow-xs outline-none transition-[color,box-shadow] placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span>匹配后会优先展示分数更高的岗位。</span>
                </div>
                {matchError && (
                  <p className="rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {matchError}
                  </p>
                )}
                {matchProgress.active && (
                  <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2 text-sm font-medium text-blue-950">
                        {matching && <Loader2 className="h-4 w-4 shrink-0 animate-spin" />}
                        <span className="truncate">{matchProgress.title}</span>
                      </div>
                      <span className="shrink-0 text-xs font-medium text-blue-700">
                        {Math.round(matchProgress.progress)}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white">
                      <div
                        className="h-full rounded-full bg-blue-600 transition-all duration-500"
                        style={{ width: `${matchProgress.progress}%` }}
                      />
                    </div>
                    {matchProgress.description && (
                      <p className="mt-2 text-xs leading-5 text-blue-700">{matchProgress.description}</p>
                    )}
                  </div>
                )}
              </div>
              <div className="flex gap-2 lg:justify-end">
                <Button
                  type="button"
                  onClick={handleMatch}
                  disabled={matching || (!resumeText.trim() && !resumeFile)}
                  className="gap-2"
                >
                  {matching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {matching ? '匹配中' : '开始匹配'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={matching && !hasMatchResults}
                  onClick={clearMatch}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  清除
                </Button>
              </div>
            </CardContent>
          </Card>

          {loading && (
            <Card className="border-slate-200 bg-white">
              <CardContent className="py-12 text-center text-slate-500">正在加载岗位机会...</CardContent>
            </Card>
          )}

          {!loading && error && (
            <Card className="border-slate-200 bg-white">
              <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
                <p className="text-slate-600">{error}</p>
                <Button variant="outline" onClick={loadOpportunities}>重试</Button>
              </CardContent>
            </Card>
          )}

          {!loading && !error && opportunities.length === 0 && (
            <Card className="border-slate-200 bg-white">
              <CardContent className="py-12 text-center text-slate-500">暂无岗位机会，后续有新岗位会在这里更新。</CardContent>
            </Card>
          )}

          {!loading && !error && opportunities.length > 0 && (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.25fr)] lg:items-start">
              <Card className="border-slate-200 bg-white/95 shadow-sm backdrop-blur">
                <CardHeader className="space-y-2 pb-4">
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="flex items-center gap-2 text-xl text-slate-950">
                      <ListFilter className="h-5 w-5" />
                      岗位列表
                    </CardTitle>
                    <Badge variant="secondary">{displayOpportunities.length} / {opportunities.length}</Badge>
                  </div>
                </CardHeader>

                <CardContent className="grid gap-3">
                  {displayOpportunities.length === 0 && (
                    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                      没有匹配的岗位，换个关键词或清空筛选试试。
                    </div>
                  )}

                  {displayOpportunities.map((opportunity) => {
                    const active = selectedOpportunity?.id === opportunity.id;
                    const match = matchByOpportunityId.get(opportunity.id);
                    return (
                      <button
                        key={opportunity.id}
                        type="button"
                        onClick={() => setSelectedId(opportunity.id)}
                        className={[
                          'w-full rounded-lg border p-4 text-left transition-all',
                          active
                            ? 'border-blue-300 bg-blue-50 shadow-sm ring-2 ring-blue-100'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        ].join(' ')}
                      >
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <Badge variant="secondary" className="gap-1">
                            <Building2 className="h-3.5 w-3.5" />
                            {opportunity.company}
                          </Badge>
                          <Badge variant="outline" className="gap-1">
                            <Tags className="h-3.5 w-3.5" />
                            {opportunity.category}
                          </Badge>
                          {match && (
                            <Badge className="gap-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                              匹配度 {scoreLabel(match.score)}
                            </Badge>
                          )}
                        </div>
                        <div className="text-base font-semibold leading-6 text-slate-950">{opportunity.title}</div>
                        {opportunity.summary && (
                          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{opportunity.summary}</p>
                        )}
                        {match?.reason && (
                          <p className="mt-2 rounded-md bg-emerald-50 px-3 py-2 text-sm leading-6 text-emerald-800">
                            {match.reason}
                          </p>
                        )}
                        <div className="mt-3 grid gap-2 text-sm text-slate-500 sm:grid-cols-2">
                          <span className="inline-flex min-w-0 items-center gap-1.5">
                            <MapPin className="h-4 w-4 shrink-0" />
                            <span className="truncate">{opportunity.location || '地点未注明'}</span>
                          </span>
                          <span className="inline-flex min-w-0 items-center gap-1.5">
                            <Mail className="h-4 w-4 shrink-0" />
                            <span className="truncate">{opportunity.contact_email}</span>
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </CardContent>
              </Card>

              <Card className="sticky top-24 border-slate-200 bg-white/95 shadow-sm backdrop-blur">
                {selectedOpportunity ? (
                  <>
                    <CardHeader className="gap-4">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="mb-3 flex flex-wrap items-center gap-2">
                            <Badge variant="secondary" className="gap-1">
                              <Building2 className="h-3.5 w-3.5" />
                              {selectedOpportunity.company}
                            </Badge>
                            <Badge variant="outline" className="gap-1">
                              <Tags className="h-3.5 w-3.5" />
                              {selectedOpportunity.category}
                            </Badge>
                            {selectedMatch && (
                              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                                匹配度 {scoreLabel(selectedMatch.score)}
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="text-2xl text-slate-950">{selectedOpportunity.title}</CardTitle>
                          {selectedOpportunity.summary && (
                            <p className="mt-3 text-sm leading-6 text-slate-600">{selectedOpportunity.summary}</p>
                          )}
                        </div>
                        <a
                          href={`mailto:${selectedOpportunity.contact_email}`}
                          className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-medium text-white transition-colors hover:bg-slate-800"
                        >
                          <Mail className="h-4 w-4" />
                          投递简历
                        </a>
                      </div>
                    </CardHeader>

                    <CardContent className="grid gap-6">
                      <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
                        <div>
                          <div className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-900">
                            <MapPin className="h-4 w-4" />
                            地点/到岗
                          </div>
                          <p className="text-sm leading-6 text-slate-600">{selectedOpportunity.location || '未注明'}</p>
                          <p className="text-sm leading-6 text-slate-600">{selectedOpportunity.cadence || '到岗要求未注明'}</p>
                        </div>
                        <div>
                          <div className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-900">
                            <Mail className="h-4 w-4" />
                            联系方式
                          </div>
                          <a className="break-all text-sm font-medium text-blue-700 hover:underline" href={`mailto:${selectedOpportunity.contact_email}`}>
                            {selectedOpportunity.contact_email}
                          </a>
                          {selectedOpportunity.note && <p className="mt-2 text-sm leading-6 text-slate-600">{selectedOpportunity.note}</p>}
                        </div>
                      </div>

                      {selectedMatch?.reason && (
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-emerald-950">
                            <Sparkles className="h-4 w-4" />
                            匹配原因
                          </div>
                          <p className="text-sm leading-6 text-emerald-800">{selectedMatch.reason}</p>
                        </div>
                      )}

                      <Separator />

                      <DetailList
                        title="岗位职责"
                        icon={<Briefcase className="h-4 w-4" />}
                        items={selectedOpportunity.responsibilities}
                        emptyText="岗位职责暂未补充。"
                      />

                      <DetailList
                        title="任职要求"
                        icon={<Sparkles className="h-4 w-4" />}
                        items={selectedOpportunity.requirements}
                        emptyText="任职要求暂未补充。"
                      />
                    </CardContent>
                  </>
                ) : (
                  <CardContent className="py-12 text-center text-slate-500">请选择左侧岗位查看详情。</CardContent>
                )}
              </Card>
            </div>
          )}
        </div>
      </section>
    </main>
  );
};

export default Opportunities;
