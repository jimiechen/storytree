# StoryTree N8N 角色开发系统融合方案

## 概述

本文档设计如何将N8N全自动角色开发系统的先进理念与StoryTree现有项目融合，打造一套工业级的角色开发流水线。

## 当前项目状态

### 现有角色系统分析

当前项目的角色系统位于 `dreamweaver/` 目录下：

- **类型定义**：[knowledge.ts](file:///workspace/dreamweaver/src/types/knowledge.ts)
  - 基础字段：姓名、年龄、性别、职业、外貌、性格、背景故事
  - 关系系统：CharacterRelationship接口
  - 标签和状态管理

- **界面组件**：[CharacterForm.tsx](file:///workspace/dreamweaver/src/components/knowledge/CharacterForm.tsx)
  - 基础表单，涵盖基本信息和详细设定
  - 支持别名和标签管理

### 核心优势

1. **垂直场景定位**：专门服务长篇小说创作
2. **本地隐私保障**：符合数据安全需求
3. **Agent架构**：已支持多Agent协作基础
4. **类型安全**：TypeScript完整类型定义

## N8N系统关键要素融合设计

### 1. 角色深度档案扩展

#### 新增类型设计

```typescript
// 新增：MBTI人格类型
type MBTIType = 
  'INTJ' | 'INTP' | 'ENTJ' | 'ENTP' |
  'INFJ' | 'INFP' | 'ENFJ' | 'ENFP' |
  'ISTJ' | 'ISFJ' | 'ESTJ' | 'ESFJ' |
  'ISTP' | 'ISFP' | 'ESTP' | 'ESFP';

// 新增：九型人格类型
type EnneagramType =
  '1w2' | '1w9' |
  '2w1' | '2w3' |
  '3w2' | '3w4' |
  '4w3' | '4w5' |
  '5w4' | '5w6' |
  '6w5' | '6w7' |
  '7w6' | '7w8' |
  '8w7' | '8w9' |
  '9w8' | '9w1';

// 新增：滑块维度
type SliderDimension =
  'anxiety' | 'confidence' | 'openness' | 'empathy' |
  'aggression' | 'optimism' | 'calmness' | 'trustworthiness' |
  'ambition' | 'creativity' | 'socialness' | 'orderliness' |
  'emotionality' | 'adventure' | 'intellect';

// 滑块值范围
type SliderValue = number; // -10 到 +10

// 滑块配置
interface SliderConfig {
  baseline: SliderValue; // 角色基线
  [scene: string]: SliderValue; // 特定场景值
}

// 扩展角色类型
interface ExtendedCharacter extends Character {
  // 新增心理档案
  mbti?: MBTIType;
  enneagram?: EnneagramType;
  
  // 新增：说话特点
  speechPatterns?: {
    style: string; // 简洁/啰嗦/正式/口语化等
    quirks?: string[]; // 口头禅、特定用词等
    example: string; // 例句
  };
  
  // 新增：滑块量表
  sliders?: {
    [dimension in SliderDimension]?: SliderConfig;
  };
  
  // 新增：压力下行为
  stressBehavior?: string;
  
  // 新增：角色弧线
  arc?: {
    initial: string; // 起点状态
    turningPoints?: string[]; // 转折点
    growth?: string; // 成长目标
  };
}
```

### 2. 三步流水线集成设计

#### 阶段一：角色卡生成

**流程设计**：
1. **输入层**：
   - 作者备注（可选）：针对特定角色的特殊要求
   - 故事类型/风格选择
   - 角色角色定位（主角/配角/反派）

2. **模板系统**：
   - 套路模板
   - 主题模板
   - 角色模板

3. **Token压缩步骤**：
   - 将长文档压缩为精简版提示词
   - 保留核心特征，降低成本

**输出**：完整角色档案（ExtendedCharacter）

#### 阶段二：逻辑校验

**校验项目**：
1. **一致性检查**：
   - 性格与行为是否匹配
   - 背景与世界观是否冲突
   - 角色关系是否一致

2. **滑块合理性**：
   - 基线与场景值变化是否自然
   - 维度间逻辑是否协调

3. **改进建议生成**：
   - 具体问题点标注
   - 可操作的修改建议

#### 阶段三：精准修改

**特点**：
- 只针对改进建议修改
- 保留其他设定不变
- 可多次迭代直到满意

### 3. 角色关系图增强

#### 新增关系类型设计

```typescript
// 扩展关系类型
interface ExtendedRelationship extends CharacterRelationship {
  strength: number; // 关系强度 0-10
  isReciprocal: boolean; // 是否双向
  betrayalPotential: number; // 背叛潜力 0-10
  history?: string; // 关系历史
}

// 角色关系图
interface CharacterRelationshipMap {
  [characterId: string]: {
    [targetId: string]: ExtendedRelationship;
  };
}
```

**可视化支持**：
- JSON格式导出，便于其他工具使用
- 关系强度和特点一目了然
- 为剧情设计提供基础

### 4. 前期"肉化"工作流

#### 项目创建流程优化

1. **前期准备阶段**：
   - 在开始写正文前，先完成所有角色开发
   - 提示用户："先把角色'肉化'，这会让你的故事更有生命力"

2. **创作时使用**：
   - 写特定场景时，加载对应场景的角色滑块配置
   - AI自动根据场景调整角色表现
   - 保持人物一致性

## 与现有架构融合策略

### 1. 渐进式扩展方案

#### Phase A：类型安全扩展

- 在现有 `Character` 基础上创建 `ExtendedCharacter`
- 保持向后兼容
- 现有功能正常运行

#### Phase B：界面增强

- 新增滑块编辑器组件
- 增强角色表单，支持心理档案
- 关系图可视化界面

#### Phase C：Agent流水线集成

- 与现有的多Agent系统结合
- 角色开发作为独立Agent任务流

### 2. 模板系统设计

**模板位置**：项目目录结构建议
```
storytree/
└── dreamweaver/
    ├── src/
    │   └── templates/
    │       ├── genres/
    │       │   ├── fantasy.ts
    │       │   └── sci-fi.ts
    │       ├── character-archetypes/
    │       └── relationships/
```

## 关键创新点

### 1. 滑块量表核心价值

**技术实现思路**：
- 每个角色有15个维度的滑块
- 保存基线值和多个场景值
- 使用时加载对应场景配置
- AI自动根据配置调整语气、用词、反应

### 2. 数据采集规范

**为未来蒸馏做准备**：
- 标准化Agent工作目录
- 记录完整推理链
- 标注质量信息
- 保存可复用的训练素材

## 与StoryTree核心功能结合

### 1. 独立文件记忆

每个角色作为独立文件：
```
story-project/
└── characters/
    ├── character-01.md
    └── character-02.json  // 扩展档案数据
```

### 2. 上下文压缩

角色开发阶段输出：
- 精简角色卡片（用于快速引用）
- 完整角色档案（用于深度生成）
- 场景配置模板（按需加载）

### 3. 多Agent协作

在角色开发时：
- 角色设计Agent
- 一致性校验Agent
- 关系构建Agent

## 实施路径建议

### 第一阶段（MVP）

1. 扩展类型定义，支持心理档案
2. 实现基础滑块量表界面
3. 增强角色关系系统
4. 提供预设角色模板

### 第二阶段

1. 三步流水线的简化版本
2. Token压缩机制
3. 逻辑校验基础功能

### 第三阶段

1. 完整自动化流水线
2. 角色关系图可视化
3. 数据采集和蒸馏准备

## 关键文件关联

- **现有类型**：[knowledge.ts](file:///workspace/dreamweaver/src/types/knowledge.ts)
- **现有表单**：[CharacterForm.tsx](file:///workspace/dreamweaver/src/components/knowledge/CharacterForm.tsx)
- **任务分解**：[phase1-task-breakdown.md](file:///workspace/docs/planning/vscode-oss-integration/phase1-task-breakdown.md)

## 总结

这套方案的核心价值在于：
1. **提升角色质量**：不再是纸片人，而是有血有肉有心理活动
2. **保持一致性**：同一角色在不同场景下保持连贯
3. **降低创作门槛**：自动化深度开发，减轻作者负担
4. **面向未来**：为模型蒸馏和私有化部署奠定基础

通过将N8N系统的理念与StoryTree现有架构融合，可以打造一套真正适合长篇小说创作的角色开发系统。
