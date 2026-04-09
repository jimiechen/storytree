# DreamWeaver 融入 OpenCode 调研报告

## 1. 项目分析

### 1.1 DreamWeaver 项目结构

DreamWeaver 是一个基于 Next.js 的多 AI 模型长篇小说写作平台，主要功能包括：

```
dreamweaver/
├── src/
│   ├── components/
│   │   ├── ai/          # AI 相关组件
│   │   ├── chat/         # 聊天面板
│   │   ├── editor/       # 编辑器
│   │   ├── knowledge/    # 知识库管理
│   │   └── layout/       # 布局组件
│   ├── hooks/            # 自定义 hooks
│   ├── lib/              # 工具库
│   ├── stores/           # 状态管理
│   └── app/              # Next.js 路由
├── stitch_main_workbench/ # UI 原型
└── tests/               # 测试文件
```

### 1.2 OpenCode 项目结构

OpenCode 是一个基于 Solid.js 的 AI 开发工具，主要功能包括：

```
opencode/
├── packages/
│   ├── app/             # 主应用
│   ├── ui/              # UI 组件库
│   ├── opencode/        # 核心 SDK
│   ├── desktop/         # 桌面应用
│   ├── extensions/      # 扩展
│   └── other 辅助包
```

### 1.3 技术栈对比

| 特性 | DreamWeaver | OpenCode |
|------|------------|----------|
| 前端框架 | React + Next.js | Solid.js |
| 状态管理 | React hooks + stores | Solid.js store + context |
| 构建工具 | Next.js (webpack) | Vite |
| CSS 方案 | Tailwind CSS | Tailwind CSS |
| 语言 | TypeScript | TypeScript |
| 聊天功能 | 自定义 ChatPanel | 完整的聊天系统 |
| 扩展机制 | 无 | 完整的扩展系统 |

## 2. 核心功能分析

### 2.1 DreamWeaver 核心功能

1. **AI 聊天面板** (`ChatPanel`)
   - 位置：[ChatPanel.tsx](file:///workspace/dreamweaver/src/components/chat/ChatPanel.tsx)
   - 功能：
     - 多模型聊天
     - 快速操作（续写、扩写、改写等）
     - 消息历史管理
     - 上下文感知
     - 响应式设计（紧凑模式和完整模式）

2. **项目管理**
   - 项目创建、列表、详情
   - 章节管理
   - 分支管理

3. **知识库管理**
   - 角色管理
   - 世界设定管理

4. **编辑器**
   - 富文本编辑
   - AI 辅助编辑
   - 状态管理

### 2.2 OpenCode 核心功能

1. **聊天系统**
   - 完整的消息时间线
   - 多模型支持
   - 工具集成
   - 会话管理

2. **设置系统**
   - 通用设置
   - 快捷键设置
   - 提供商设置
   - 模型设置

3. **扩展系统**
   - 插件机制
   - 自定义组件
   - 命令注册

4. **主题系统**
   - 主题切换
   - 自定义主题

## 3. 迁移策略

### 3.1 总体策略

采用**扩展方式**将 DreamWeaver 功能融入 OpenCode，避免直接修改核心代码，确保兼容性和可维护性。

### 3.2 功能迁移映射

| DreamWeaver 功能 | OpenCode 实现方式 | 优先级 |
|----------------|-----------------|--------|
| AI 聊天面板 | 扩展组件 + 自定义设置 | P0 |
| 项目管理 | 扩展组件 + 状态管理 | P1 |
| 知识库管理 | 扩展组件 + 数据存储 | P1 |
| 编辑器 | 扩展组件 + 工具集成 | P2 |

### 3.3 技术迁移方案

1. **组件迁移**
   - 将 React 组件转换为 Solid.js 组件
   - 保持功能和 UI 一致性
   - 利用 OpenCode 的 UI 组件库

2. **状态管理**
   - 从 React hooks 迁移到 Solid.js store
   - 利用 OpenCode 的 context 系统

3. **API 集成**
   - 利用 OpenCode 的 SDK
   - 保持后端 API 兼容性

4. **样式迁移**
   - 保持 Tailwind CSS 类名
   - 适配 OpenCode 的主题系统

## 4. 实施步骤

### 4.1 步骤一：创建扩展目录

```bash
# 创建扩展目录
mkdir -p packages/extensions/ralph-panel

# 创建扩展结构
packages/extensions/ralph-panel/
├── src/
│   ├── components/       # 组件
│   ├── context/         # 状态管理
│   ├── hooks/            # 自定义 hooks
│   ├── utils/            # 工具函数
│   └── index.tsx         # 扩展入口
├── package.json
└── README.md
```

### 4.2 步骤二：迁移聊天面板

1. **创建聊天组件**
   - 转换 ChatPanel.tsx 为 Solid.js 组件
   - 集成 OpenCode 的聊天系统
   - 添加快速操作功能

2. **实现状态管理**
   - 创建聊天状态管理
   - 集成 OpenCode 的 context

3. **添加设置选项**
   - 在设置页面添加 DreamWeaver 相关设置
   - 支持模型选择和配置

### 4.3 步骤三：迁移项目管理

1. **创建项目管理组件**
   - 实现项目列表和详情页面
   - 集成 OpenCode 的路由系统

2. **实现数据存储**
   - 利用 OpenCode 的存储系统
   - 保持数据结构兼容性

### 4.4 步骤四：迁移知识库管理

1. **创建知识库组件**
   - 实现角色和世界设定管理
   - 集成 OpenCode 的 UI 组件

2. **实现数据管理**
   - 利用 OpenCode 的数据存储
   - 保持数据结构一致性

### 4.5 步骤五：集成编辑器

1. **创建编辑器组件**
   - 实现富文本编辑功能
   - 集成 OpenCode 的工具系统

2. **添加 AI 辅助功能**
   - 利用 OpenCode 的 AI 能力
   - 实现编辑器内 AI 辅助

## 5. 技术挑战与解决方案

### 5.1 技术挑战

1. **框架差异**
   - React vs Solid.js 的语法差异
   - 状态管理模式差异

2. **API 兼容性**
   - 后端 API 接口差异
   - 数据结构差异

3. **UI 一致性**
   - 保持 DreamWeaver 的 UI 风格
   - 适配 OpenCode 的主题系统

4. **性能优化**
   - 确保迁移后性能不下降
   - 利用 Solid.js 的性能优势

### 5.2 解决方案

1. **框架迁移**
   - 逐步迁移，先核心功能
   - 利用 Solid.js 的 React 兼容层
   - 保持组件 API 一致性

2. **API 适配**
   - 创建 API 适配器
   - 保持后端 API 兼容
   - 统一数据结构

3. **UI 适配**
   - 保持 Tailwind CSS 类名
   - 适配 OpenCode 的主题变量
   - 利用 OpenCode 的 UI 组件库

4. **性能优化**
   - 利用 Solid.js 的编译时优化
   - 合理使用 memo 和缓存
   - 优化渲染性能

## 6. 集成效果预期

### 6.1 功能整合

- ✅ DreamWeaver 的核心功能在 OpenCode 中可用
- ✅ 保持 UI 一致性和用户体验
- ✅ 利用 OpenCode 的扩展系统
- ✅ 支持 OpenCode 的主题和设置系统

### 6.2 技术优势

- 🚀 利用 Solid.js 的性能优势
- 📱 响应式设计，支持多端
- 🔌 完整的扩展机制
- 🌍 国际化支持
- 🎨 主题系统

### 6.3 业务价值

- 统一开发环境，减少维护成本
- 利用 OpenCode 的成熟功能
- 扩展 OpenCode 的应用场景
- 为用户提供更完整的 AI 写作工具

## 7. 实施时间线

| 阶段 | 任务 | 时间 |
|------|------|------|
| 阶段 1 | 扩展框架搭建 | 1 天 |
| 阶段 2 | 聊天面板迁移 | 2 天 |
| 阶段 3 | 项目管理迁移 | 2 天 |
| 阶段 4 | 知识库管理迁移 | 2 天 |
| 阶段 5 | 编辑器集成 | 3 天 |
| 阶段 6 | 测试和优化 | 2 天 |
| **总计** | | **12 天** |

## 8. 风险评估

### 8.1 风险因素

1. **技术风险**
   - 框架迁移复杂度
   - API 兼容性问题
   - 性能问题

2. **业务风险**
   - 功能缺失
   - 用户体验下降
   - 迁移成本过高

### 8.2 风险缓解

1. **技术风险缓解**
   - 分阶段迁移，先核心功能
   - 充分测试，确保兼容性
   - 利用 Solid.js 的性能优势

2. **业务风险缓解**
   - 保持功能完整性
   - 保持 UI 一致性
   - 控制迁移成本，优先核心功能

## 9. 结论

将 DreamWeaver 融入 OpenCode 是一个可行的方案，通过扩展方式可以实现功能整合，同时利用 OpenCode 的成熟功能和技术优势。

**推荐方案**：采用扩展方式，分阶段迁移核心功能，保持 UI 一致性和用户体验，利用 OpenCode 的扩展系统和技术优势，为用户提供更完整的 AI 写作工具。

**预期成果**：
- DreamWeaver 的核心功能在 OpenCode 中可用
- 保持良好的用户体验
- 利用 OpenCode 的技术优势
- 为 OpenCode 增加新的应用场景

[READY_FOR_REVIEW]