'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';

interface AIModel {
  id: string;
  name: string;
  provider: string;
  icon: string;
  iconColor: string;
  borderGradient: string;
  scores: {
    creative: number;
    dialogue: number;
    coherence: number;
  };
  authType: 'BYOK' | 'platform';
  tokens: string;
  status: 'active' | 'inactive';
}

interface PipelineStep {
  id: string;
  phase: string;
  name: string;
  models: { name: string; color: string }[];
}

const mockModels: AIModel[] = [
  {
    id: 'claude-4-opus',
    name: 'Claude 4 Opus',
    provider: 'Anthropic',
    icon: 'auto_awesome',
    iconColor: 'text-secondary',
    borderGradient: 'from-secondary/40 to-secondary-container/40',
    scores: { creative: 9.2, dialogue: 9.0, coherence: 9.4 },
    authType: 'BYOK',
    tokens: '200K',
    status: 'active',
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    icon: 'psychology',
    iconColor: 'text-tertiary',
    borderGradient: 'from-tertiary/40 to-tertiary-container/40',
    scores: { creative: 8.5, dialogue: 9.5, coherence: 8.8 },
    authType: 'platform',
    tokens: '128K',
    status: 'active',
  },
  {
    id: 'deepseek-v3',
    name: 'DeepSeek V3',
    provider: 'DeepSeek',
    icon: 'deployed_code',
    iconColor: 'text-primary',
    borderGradient: 'from-primary/40 to-primary-container/40',
    scores: { creative: 8.0, dialogue: 8.5, coherence: 9.0 },
    authType: 'BYOK',
    tokens: '64K',
    status: 'active',
  },
  {
    id: 'qwen-max',
    name: '通义千问 Max',
    provider: 'Alibaba',
    icon: 'brush',
    iconColor: 'text-secondary-fixed',
    borderGradient: 'from-secondary-fixed/40 to-on-secondary-container/40',
    scores: { creative: 8.2, dialogue: 8.3, coherence: 8.5 },
    authType: 'BYOK',
    tokens: '32K',
    status: 'active',
  },
];

const mockPipeline: PipelineStep[] = [
  {
    id: 'step-1',
    phase: 'Phase I',
    name: '构思大纲',
    models: [
      { name: 'DeepSeek V3', color: 'primary' },
      { name: 'Claude 4 Opus', color: 'secondary' },
    ],
  },
  {
    id: 'step-2',
    phase: 'Phase II',
    name: '章节扩写',
    models: [{ name: 'Claude 4 Opus', color: 'secondary' }],
  },
  {
    id: 'step-3',
    phase: 'Phase III',
    name: '中文润色',
    models: [
      { name: '通义千问 Max', color: 'secondary-fixed' },
      { name: 'Claude 4 Opus', color: 'secondary' },
    ],
  },
  {
    id: 'step-4',
    phase: 'Final Phase',
    name: '质量评审',
    models: [{ name: 'GPT-4o (评审模式)', color: 'tertiary' }],
  },
];

export default function ModelCenterPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-surface-container-lowest" data-testid="model-center-page">
      {/* Top Navigation Bar */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 py-3 bg-[#111125]">
        <div className="flex items-center gap-8">
          <span className="text-2xl font-black text-primary tracking-tight">织梦笔</span>
          <nav className="hidden md:flex gap-6">
            {['Models', 'Workflows', 'Insights'].map((item) => (
              <a
                key={item}
                href="#"
                className="text-on-surface-variant hover:text-on-surface transition-colors text-xs font-medium"
              >
                {item}
              </a>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative hidden lg:block">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="bg-surface-container-highest border-none rounded-lg py-1.5 pl-10 pr-4 text-sm focus:ring-1 focus:ring-primary/40 w-64"
              data-testid="model-search-input"
            />
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">
              search
            </span>
          </div>
          <button className="p-2 hover:bg-surface-container-high/50 rounded-lg transition-all">
            <span className="material-symbols-outlined text-on-surface-variant">notifications</span>
          </button>
          <button className="p-2 hover:bg-surface-container-high/50 rounded-lg transition-all">
            <span className="material-symbols-outlined text-on-surface-variant">help_outline</span>
          </button>
          <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center border border-outline-variant">
            <span className="material-symbols-outlined text-primary text-sm">person</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="pt-20 pb-12 px-10 min-h-screen">
        {/* Section: My Models */}
        <section className="max-w-6xl mx-auto mb-16" data-testid="models-section">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-3xl font-bold font-headline text-on-surface tracking-tight">我的模型</h2>
              <p className="text-on-surface-variant text-sm mt-1">管理并评估您在创作中使用的核心大语言模型</p>
            </div>
            <div className="flex gap-3">
              <button className="px-5 py-2 rounded-full border border-outline-variant text-sm font-bold text-on-surface-variant hover:bg-surface-container-high/50 transition-all">
                刷新状态
              </button>
              <button className="px-5 py-2 rounded-full bg-primary/10 border border-primary/30 text-sm font-bold text-primary hover:bg-primary/20 transition-all">
                添加外部模型
              </button>
            </div>
          </div>

          {/* 2x2 Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mockModels.map((model) => (
              <div
                key={model.id}
                className="p-6 rounded-xl border bg-surface-container/60 backdrop-blur-sm flex flex-col justify-between group hover:border-primary/40 transition-all"
                style={{
                  background: 'rgba(30, 30, 50, 0.6)',
                  backdropFilter: 'blur(12px)',
                  borderImage: `linear-gradient(135deg, var(--tw-gradient-stops)) 1`,
                }}
                data-testid={`model-card-${model.id}`}
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-lg bg-${model.iconColor.split('-')[1]}/10 flex items-center justify-center`}>
                        <span className={`material-symbols-outlined ${model.iconColor} text-3xl`}>{model.icon}</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold font-headline">{model.name}</h3>
                        <span className="text-[10px] text-on-surface-variant uppercase tracking-widest">{model.provider}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-tertiary/10 rounded-full border border-tertiary/30">
                      <div className="w-2 h-2 rounded-full bg-tertiary shadow-[0_0_8px_rgba(131,218,133,0.6)]"></div>
                      <span className="text-[10px] text-tertiary font-bold uppercase">{model.status}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-xs text-on-surface-variant mb-1">文学创作</div>
                      <div className={`text-xl font-bold ${model.iconColor}`}>{model.scores.creative}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-on-surface-variant mb-1">对话生成</div>
                      <div className={`text-xl font-bold ${model.iconColor}`}>{model.scores.dialogue}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-on-surface-variant mb-1">长文连贯</div>
                      <div className={`text-xl font-bold ${model.iconColor}`}>{model.scores.coherence}</div>
                    </div>
                  </div>
                  <div className="flex gap-4 text-[10px] text-on-surface-variant font-bold tracking-widest uppercase">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">{model.authType === 'BYOK' ? 'key' : 'cloud'}</span>
                      {model.authType === 'BYOK' ? 'BYOK' : '平台代理'}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">database</span>
                      {model.tokens} tokens
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 mt-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button className="flex-1 bg-primary text-on-primary py-2 rounded-lg font-bold text-xs uppercase tracking-wider hover:brightness-110">
                    设为默认
                  </button>
                  <button className="flex-1 bg-surface-container-high text-on-surface py-2 rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-surface-bright">
                    配置
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section: Collaboration Pipeline */}
        <section className="max-w-6xl mx-auto" data-testid="pipeline-section">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-3xl font-bold font-headline text-on-surface tracking-tight">协作流水线</h2>
              <p className="text-on-surface-variant text-sm mt-1">串联不同模型的能力，构建您的全自动化创作工厂</p>
            </div>
            <div className="flex gap-3">
              <button className="px-6 py-2.5 rounded-lg bg-surface-container-high text-primary font-bold text-xs uppercase tracking-widest hover:bg-surface-bright transition-all flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">save</span>
                保存流水线
              </button>
            </div>
          </div>

          {/* Vertical Workflow */}
          <div className="relative">
            {/* Vertical Line Connector */}
            <div className="absolute left-[39px] top-0 bottom-0 w-[2px] bg-gradient-to-b from-primary/40 via-primary/20 to-transparent"></div>
            <div className="space-y-6">
              {mockPipeline.map((step, index) => (
                <div key={step.id} className="relative flex items-center gap-6 group" data-testid={`pipeline-step-${step.id}`}>
                  <div className="w-20 flex flex-col items-center z-10">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary font-black text-sm shadow-[0_0_15px_rgba(117,209,255,0.4)]">
                      {index + 1}
                    </div>
                  </div>
                  <div className="flex-1 p-5 rounded-xl border border-outline-variant/30 bg-surface-container/60 backdrop-blur-sm flex justify-between items-center group-hover:border-primary/40 transition-all">
                    <div className="flex items-center gap-8">
                      <div>
                        <div className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest mb-1">{step.phase}</div>
                        <h4 className="text-lg font-bold">{step.name}</h4>
                      </div>
                      <div className="flex items-center gap-3 text-on-surface">
                        {step.models.map((model, modelIndex) => (
                          <React.Fragment key={model.name}>
                            <span className={`bg-${model.color}/10 px-3 py-1 rounded text-xs font-medium border border-${model.color}/20`}>
                              {model.name}
                            </span>
                            {modelIndex < step.models.length - 1 && (
                              <span className="material-symbols-outlined text-primary text-xl">arrow_forward</span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-4 py-1.5 rounded bg-surface-container-high text-xs font-bold hover:bg-primary/20 hover:text-primary transition-all text-on-surface-variant">
                        编辑
                      </button>
                      <button className="px-4 py-1.5 rounded bg-surface-container-high text-xs font-bold hover:bg-tertiary/20 hover:text-tertiary transition-all text-on-surface-variant">
                        测试
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {/* Add Step Button */}
              <div className="relative flex items-center gap-6">
                <div className="w-20 flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full border-2 border-dashed border-outline-variant flex items-center justify-center text-outline-variant">
                    <span className="material-symbols-outlined text-xl">add</span>
                  </div>
                </div>
                <button className="flex-1 py-4 rounded-xl border-2 border-dashed border-outline-variant/40 text-on-surface-variant font-bold text-xs uppercase tracking-widest hover:border-primary/40 hover:text-primary transition-all bg-transparent">
                  + 添加步骤
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-8 right-8 flex flex-col gap-4">
        <button className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center text-on-secondary shadow-2xl hover:scale-110 transition-transform">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
        </button>
      </div>

      {/* Visual Glow Effects */}
      <div className="fixed -bottom-48 -right-48 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="fixed top-24 left-72 w-64 h-64 bg-secondary/5 rounded-full blur-[100px] pointer-events-none"></div>
    </div>
  );
}
