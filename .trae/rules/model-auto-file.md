# 模型自动文件生成规则 (Model Auto File Generation Rule)

> **⚠️ 全局生效**: 此规则适用于所有模型操作，所有 Agent 必须无条件遵守。

## 规则说明

执行任务前，先问自己是什么模型，应在工作空间目录下对应模型的子目录中自动生成一个名称格式为"任务名称 + 模型名称"的Markdown文件。记录自己的任务，包括任务描述、执行时间、执行结果等。

**重要**: 文件内容必须完整记录本次对话的所有重要信息，包括但不限于：
- 用户请求和意图
- 执行的完整步骤
- 读取的所有文件内容摘要
- 输出的完整结果
- 代码变更详情
- 评审意见和分析结论

## 执行流程

### 1. 工作空间目录结构

**基础路径**: `/Users/mac/StudioProjects/storytree2/workspaces/`

**目录结构**: 
```
workspaces/
└── {model_name}/          # 模型名称对应的子目录
    └── hello{model_name}.md  # 生成的Markdown文件
```

### 2. 文件生成逻辑

**触发条件**: 使用特定模型执行任何操作时

**执行步骤**:
1. **获取当前使用的模型名称**
2. **创建模型子目录** (如果不存在): `mkdir -p /Users/mac/StudioProjects/storytree2/workspaces/{model_name}`
3. **生成Markdown文件**: `/Users/mac/StudioProjects/storytree2/workspaces/{model_name}/hello{model_name}.md`
4. **填充文件内容（任务进行中）**: 先写入基本信息、用户请求、计划执行步骤，状态标记为进行中
5. **执行任务并实时更新**: 每完成一个关键步骤，立即更新文件相关内容
6. **任务完成后最终更新**: 补充完整结果、评审意见、操作记录，状态标记为完成

**⚠️ 强制要求**: 步骤3-5必须在任何其他工具调用（如Read、Grep、Write等）之前完成！**先创建文件，再执行任务**。

### 3. 文件名格式

**严格遵循以下格式**:
- 前缀: `hello`
- 主体: 当前使用的模型名称
- 后缀: `.md`

**示例**:
- 模型名称: `Claude` → 文件名: `helloClaude.md`
- 模型名称: `GPT-4` → 文件名: `helloGPT-4.md`
- 模型名称: `Gemini` → 文件名: `helloGemini.md`
- 模型名称: `Kimi-K2.5` → 文件名: `helloKimi-K2.5.md`
- 模型名称: `GLM-5.1` → 目录名: `glm51` → 文件名: `helloglm51.md`

### 3.1 模型名称映射表

不同模型可能使用简化的目录标识名，必须严格按以下映射表执行：

| 模型全称 | 目录名/文件标识 | 完整路径 |
|---------|---------------|---------|
| Claude | Claude | `workspaces/Claude/helloClaude.md` |
| GPT-4 | GPT-4 | `workspaces/GPT-4/helloGPT-4.md` |
| Gemini | Gemini | `workspaces/Gemini/helloGemini.md` |
| Kimi-K2.5 | Kimi-K2.5 | `workspaces/Kimi-K2.5/helloKimi-K2.5.md` |
| Doubao | Doubao | `workspaces/Doubao/helloDoubao.md` |
| doubao2 | doubao2 | `workspaces/doubao2/hellodoubao2.md` |
| GLM-5.1 | glm51 | `workspaces/glm51/helloglm51.md` |
| Qwen3.5 | qwen35 | `workspaces/qwen35/helloQwen35.md` |
| MiniMax-M2 | MiniMax-M2 | `workspaces/MiniMax-M2/helloMiniMax-M2.md` |

**⚠️ 新模型不在映射表中时**: 使用模型全称的小写无特殊字符形式作为目录名，并在映射表中追加记录。

## 文件内容要求

生成的Markdown文件必须包含以下完整内容:

### 必需章节

1. **基本信息**
   - 模型名称
   - 生成时间
   - 生成路径

2. **用户请求**
   - 完整的用户输入内容
   - 用户意图分析

3. **执行过程**
   - 所有执行的工具调用
   - 读取的文件列表及路径
   - 执行的命令及输出

4. **详细内容**
   - 读取的文件内容摘要或完整内容
   - 分析过程
   - 思考过程

5. **输出结果**
   - 完整的输出内容
   - 代码变更详情
   - 评审意见

6. **操作记录**
   - [x] 初始生成
   - [x] 模型操作执行
   - [x] 结果验证

7. **备注**
   - 其他重要信息

## 强制检查清单

**⚠️ 阻断性规则**: 以下检查未通过时，禁止执行任何其他操作（Read、Write、Grep、RunCommand 等）！

执行模型操作前必须确认:
- [ ] 工作空间目录存在 (`/Users/mac/StudioProjects/storytree2/workspaces/`)
- [ ] 模型子目录已创建 (`/Users/mac/StudioProjects/storytree2/workspaces/{model_name}/`)
- [ ] 文件名格式正确 (`hello{model_name}.md`)，且与映射表一致
- [ ] 文件内容已按模板填充
- [ ] **文件内容完整，包含所有对话重要信息（禁止简化）**
- [ ] **署名已添加**

**执行顺序（铁律）**:
1. 确认自身模型名称 → 查映射表获取目录名
2. `mkdir -p` 创建目录
3. `Write` 创建 helloglm51.md 文件并写入基本信息
4. 然后才能执行其他任何操作
5. 任务完成后必须回写更新文件内容

## 禁止事项

- **禁止**: 更改文件名格式
- **禁止**: 更改文件生成位置
- **禁止**: 跳过文件生成步骤
- **禁止**: 简化文件内容，只保存摘要
- **禁止**: 遗漏重要对话信息

## 自动化集成

此规则与以下流程集成:
1. **模型操作触发** - 任何模型操作开始前自动执行文件生成
2. **状态管理** - 生成文件后更新操作状态
3. **审计追踪** - 通过生成的文件记录模型使用情况

## 异常处理

**目录创建失败**:
- 检查目录权限
- 确保路径存在
- 重试目录创建操作

**文件生成失败**:
- 检查文件权限
- 确保磁盘空间充足
- 记录错误信息并继续操作

---
*规则版本: v3.0*
*更新日期: 2026-04-09*
*更新内容: 增加模型名称映射表（含 glm51 等标识）；强化阻断性规则，未创建文件前禁止执行其他操作；明确执行顺序铁律*
*署名: glm51*
