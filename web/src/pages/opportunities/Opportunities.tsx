import React, { useEffect, useState } from 'react';
import { Badge, Button } from '@/components/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Briefcase, Building2, Mail, MapPin, Sparkles, Tags } from 'lucide-react';
import { opportunityAPI } from '@/api/opportunity';
import type { JobOpportunity } from '@/types/opportunity';

const categoryCards = [
  { label: '企业', description: '公司名称与业务场景' },
  { label: '岗位', description: '岗位名称与实习方向' },
  { label: '地点/到岗', description: 'Base、到岗天数和周期' },
  { label: '职责', description: '核心工作内容' },
  { label: '要求', description: '能力、经验和偏好条件' },
  { label: '联系方式', description: '简历投递邮箱和备注' },
];

const Opportunities: React.FC = () => {
  const [opportunities, setOpportunities] = useState<JobOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadOpportunities = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await opportunityAPI.getPublicOpportunities({ page: 1, page_size: 100 });
      if (response.code === 0) {
        setOpportunities(response.data.list || []);
      } else {
        setError(response.msg || '加载实习机会失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载实习机会失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOpportunities();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 max-w-3xl">
            <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-100">
              <Sparkles className="mr-1" />
              实习内推
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-slate-950 md:text-5xl">
              内容与 AI 产品实习机会
            </h1>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              收录适合产品、内容、用研、市场方向同学的实习信息，按企业、岗位、地点、职责、要求和投递方式整理。
            </p>
          </div>

          <div className="mb-12 grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            {categoryCards.map((item) => (
              <Card key={item.label} className="border-slate-200 bg-white">
                <CardHeader className="gap-2">
                  <CardTitle className="text-base">{item.label}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>

          {loading && (
            <Card className="border-slate-200 bg-white">
              <CardContent className="py-12 text-center text-slate-500">正在加载实习机会...</CardContent>
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
              <CardContent className="py-12 text-center text-slate-500">暂无实习机会，后续有新岗位会在这里更新。</CardContent>
            </Card>
          )}

          {!loading && !error && opportunities.length > 0 && (
            <div className="grid gap-6">
              {opportunities.map((opportunity) => (
                <Card key={opportunity.id} className="overflow-hidden border-slate-200 bg-white shadow-sm">
                  <CardHeader className="gap-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <Badge variant="secondary">
                            <Building2 />
                            {opportunity.company}
                          </Badge>
                          <Badge variant="outline">
                            <Tags />
                            {opportunity.category}
                          </Badge>
                        </div>
                        <CardTitle className="text-2xl text-slate-950">{opportunity.title}</CardTitle>
                        <CardDescription className="mt-2 text-base">{opportunity.summary}</CardDescription>
                      </div>
                      <a
                        href={`mailto:${opportunity.contact_email}`}
                        className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                      >
                        <Mail />
                        投递简历
                      </a>
                    </div>
                  </CardHeader>

                  <CardContent className="grid gap-6 lg:grid-cols-[0.8fr_1fr_1fr]">
                    <div className="flex flex-col gap-4 rounded-lg bg-slate-50 p-4">
                      <div>
                        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-900">
                          <MapPin />
                          地点/到岗
                        </div>
                        <p className="text-sm leading-6 text-slate-600">{opportunity.location || '未注明'}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{opportunity.cadence || '到岗要求未注明'}</p>
                      </div>
                      <Separator />
                      <div>
                        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-900">
                          <Mail />
                          联系方式
                        </div>
                        <a className="text-sm font-medium text-blue-700 hover:underline" href={`mailto:${opportunity.contact_email}`}>
                          {opportunity.contact_email}
                        </a>
                        {opportunity.note && <p className="mt-2 text-sm leading-6 text-slate-600">{opportunity.note}</p>}
                      </div>
                    </div>

                    <div>
                      <div className="mb-3 flex items-center gap-2 font-semibold text-slate-950">
                        <Briefcase />
                        岗位职责
                      </div>
                      <ul className="flex flex-col gap-2">
                        {opportunity.responsibilities.map((item) => (
                          <li key={item} className="rounded-md border border-slate-100 bg-white px-3 py-2 text-sm leading-6 text-slate-700">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <div className="mb-3 flex items-center gap-2 font-semibold text-slate-950">
                        <Sparkles />
                        任职要求
                      </div>
                      <ul className="flex flex-col gap-2">
                        {opportunity.requirements.map((item) => (
                          <li key={item} className="rounded-md border border-slate-100 bg-white px-3 py-2 text-sm leading-6 text-slate-700">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
};

export default Opportunities;
