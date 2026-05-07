import React from 'react';
import { Badge } from '@/components/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Briefcase, Building2, Mail, MapPin, Sparkles, Tags } from 'lucide-react';

interface Opportunity {
  company: string;
  title: string;
  category: string;
  location: string;
  cadence: string;
  summary: string;
  responsibilities: string[];
  requirements: string[];
  contact: string;
  note?: string;
}

const opportunities: Opportunity[] = [
  {
    company: '爱奇艺',
    title: '内容创作产品 / AI 产品产运实习生',
    category: 'AI 产品 / 内容生产 / 工作流 Agent',
    location: '未注明',
    cadence: '尽快到岗，每周到岗 5 天，实习 3 个月以上，不支持线上办公',
    summary: '面向影视综、短剧及二创内容场景，探索视频或文案的 AI 自动化生产方案。',
    responsibilities: [
      '负责影视综相关衍生视频或文案的 AI 生产探索，调研并梳理内容生产逻辑，撰写 PRD 文档，使用工具搭建工作流或 Agent 实现自动化生产。',
      '统筹 AI 自动产线的模型实验，包括对标案例收集、prompt 测试、优化分析、结果评价和成片效果评估。',
      '规划工作量，并与组内其他实习生协同完成模型实验和产线推进。',
      '探索影视、短剧相关二创类视频和图文自动生产的质量优化方案。',
      '协助各产线功能建设和产品优化，整理使用问题反馈并跟进排查情况。',
    ],
    requirements: [
      '在校本科生或研究生，能够尽快到岗者优先。',
      '对 AI 产品有浓厚兴趣和探索欲，熟练使用 ChatGPT、Deepseek、Gemini 等 AI 工具，并具备总结方法论的能力。',
      '有 AI 行业或产品类工作经验者优先。',
      '了解 Office 基本操作，能够使用 Coze、Dify 等工作流工具并独立完成完整工作流搭建者优先。',
      '具备较强自驱力、执行力、时间管理能力，工作细致有耐心。',
      '对影视、短剧及相关二创感兴趣，熟悉混剪或解说类短视频创作过程，具备良好文案能力、内容审美和理解力。',
      '有相关自媒体经验者优先，欢迎在简历中附个人账号或作品链接。',
    ],
    contact: 'popkid616@163.com',
    note: '招聘将包含一轮 AI 工具使用及视频剪辑思路笔试；只发简历即可，简历 OK 会直接发笔试题。',
  },
  {
    company: '滴滴',
    title: '用户研究实习生',
    category: '用户研究 / 金融产品 / 国际化',
    location: '北京，不接受远程',
    cadence: '每周实习 4 天及以上，连续实习 6 个月及以上优先，能尽快入职者优先',
    summary: '支持滴滴国内金融与国际化金融产品、运营、品牌等方向的用户研究工作。',
    responsibilities: [
      '支持国内金融和国际化金融产品、运营、品牌等方向的用户研究工作。',
      '协助开展用户研究项目，包括问卷、访谈、可用性测试等。',
      '参与用研项目全流程，包括需求沟通、研究设计、执行、数据分析和结论产出。',
    ],
    requirements: [
      '积极主动、认真仔细、执行力高，态度端正，沟通和表达能力良好。',
      '有访谈和用户邀约经验者优先。',
      '熟练使用 SPSS。',
    ],
    contact: 'yimeizhang2020@163.com',
  },
  {
    company: '小红书',
    title: '社区市场部实习生',
    category: '产品营销 / 整合传播 / 社区视频',
    location: '上海',
    cadence: '27 届学生优先，每周到岗 5 天',
    summary: '深度参与社区核心产品功能的市场推介策略，围绕视频消费需求推进产品营销和传播落地。',
    responsibilities: [
      '参与社区核心产品功能的市场推介策略，协助挖掘用户在社区内的视频消费需求。',
      '参与制定产品定位、核心卖点提炼、创意传播和线下活动落地方案，推动新场景在用户侧建立心智。',
      '参与项目传播方案策划和流程跟进，与传播代理商对接，把控并产出有质量的传播物料。',
      '完成从站内氛围到站外传播的全链路流程，对传播声量负责。',
      '跟进市场合作项目中对内各部门合作资源沟通与资料整理。',
    ],
    requirements: [
      '市场营销、广告、新闻传播等相关专业的 27 届学生优先。',
      '有想法、思维活跃、爱冲浪，文案能力强，沟通力和执行力强。',
      '能协助项目传播策划和执行。',
      '有一线互联网公司经验、4A 广告经验，了解传播渠道，具备产品营销或大型项目执行经验者优先。',
      '了解小红书社区视频内容生态，是中长视频深度用户，对产品营销有热情者优先。',
    ],
    contact: '1453455481@qq.com',
  },
];

const categoryCards = [
  { label: '企业', description: '公司名称与业务场景' },
  { label: '岗位', description: '岗位名称与实习方向' },
  { label: '地点/到岗', description: 'Base、到岗天数和周期' },
  { label: '职责', description: '核心工作内容' },
  { label: '要求', description: '能力、经验和偏好条件' },
  { label: '联系方式', description: '简历投递邮箱和备注' },
];

const Opportunities: React.FC = () => {
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

          <div className="grid gap-6">
            {opportunities.map((opportunity) => (
              <Card key={`${opportunity.company}-${opportunity.title}`} className="overflow-hidden border-slate-200 bg-white shadow-sm">
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
                      href={`mailto:${opportunity.contact}`}
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
                      <p className="text-sm leading-6 text-slate-600">{opportunity.location}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{opportunity.cadence}</p>
                    </div>
                    <Separator />
                    <div>
                      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-900">
                        <Mail />
                        联系方式
                      </div>
                      <a className="text-sm font-medium text-blue-700 hover:underline" href={`mailto:${opportunity.contact}`}>
                        {opportunity.contact}
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
        </div>
      </section>
    </main>
  );
};

export default Opportunities;
