# Caicode 外部依赖服务报告

> 版本: 2.1.88  
> 日期: 2025-04-06  
> 用途: 分析重命名后功能依赖原厂服务的情况

---

## 目录

1. [核心 API 服务](#1-核心-api-服务)
2. [认证与授权服务](#2-认证与授权服务)
3. [云功能服务](#3-云功能服务)
4. [遥测与分析服务](#4-遥测与分析服务)
5. [第三方云服务](#5-第三方云服务)
6. [功能影响评估](#6-功能影响评估)
7. [离线使用建议](#7-离线使用建议)

---

## 1. 核心 API 服务

### 1.1 Anthropic API (api.anthropic.com)

| 功能模块 | 依赖程度 | 说明 |
|---------|---------|------|
| **AI 对话** | 🔴 必需 | 所有 Claude 模型调用必须通过 api.anthropic.com |
| **文件 API** | 🔴 必需 | 文件上传/下载功能 |
| **Web 搜索** | 🟡 可选 | WebFetchTool 使用 api.anthropic.com/api/web/domain_info |
| **MCP 注册表** | 🟡 可选 | MCP 官方服务器列表获取 |

**关键代码位置**:
```typescript
// src/constants/oauth.ts
BASE_API_URL: 'https://api.anthropic.com'
API_KEY_URL: 'https://api.anthropic.com/api/oauth/claude_cli/create_api_key'
ROLES_URL: 'https://api.anthropic.com/api/oauth/claude_cli/roles'

// src/services/api/filesApi.ts
'https://api.anthropic.com'

// src/services/mcp/officialRegistry.ts
'https://api.anthropic.com/mcp-registry/v0/servers?version=latest&visibility=commercial'
```

### 1.2 Claude Code Web (code.claude.com)

| 功能模块 | 依赖程度 | 说明 |
|---------|---------|------|
| **文档链接** | 🟢 无影响 | 仅文档链接，可替换 |
| **远程控制** | 🟡 可选 | 远程会话控制功能 |
| **OAuth 回调** | 🔴 必需 | Web OAuth 登录回调 |

**关键代码位置**:
```typescript
// 文档链接遍布各处
'https://code.claude.com/docs/en/claude_code_docs_map.md'
'https://code.claude.com/docs/en/mcp'
'https://code.claude.com/docs/en/security'
```

---

## 2. 认证与授权服务

### 2.1 OAuth 服务

| 服务 | 依赖程度 | 说明 |
|-----|---------|------|
| **Claude.ai OAuth** | 🔴 必需 | 默认登录方式 |
| **API Key 验证** | 🟡 可替代 | 可使用自建 API Key |
| **Console OAuth** | 🔴 必需 | 控制台登录流程 |

**关键代码位置**:
```typescript
// src/constants/oauth.ts
export const OAUTH_CONFIG = {
  BASE_API_URL: 'https://api.anthropic.com',
  API_KEY_URL: 'https://api.anthropic.com/api/oauth/claude_cli/create_api_key',
  ROLES_URL: 'https://api.anthropic.com/api/oauth/claude_cli/roles',
}
```

### 2.2 密钥链服务

| 服务 | 依赖程度 | 说明 |
|-----|---------|------|
| **macOS Keychain** | 🟡 可选 | 本地密钥存储 |
| **Windows Credential** | 🟡 可选 | Windows 凭证管理 |
| **Linux Secret Service** | 🟡 可选 | Linux 密钥服务 |

**说明**: 密钥链服务为本地服务，不依赖外部网络，但属于系统级依赖。

---

## 3. 云功能服务

### 3.1 远程会话服务

| 功能 | 依赖程度 | 说明 |
|-----|---------|------|
| **远程 Agent** | 🔴 必需 | RemoteAgentTask 依赖云端 |
| **会话同步** | 🔴 必需 | 多设备会话同步 |
| **Teleport** | 🔴 必需 | 会话传输功能 |

**关键代码位置**:
```typescript
// src/remote/SessionsWebSocket.ts
wss://api.anthropic.com/v1/sessions/ws/{sessionId}/subscribe

// src/utils/teleport/api.ts
// 会话导入导出 API
```

### 3.2 Bridge/远程控制

| 功能 | 依赖程度 | 说明 |
|-----|---------|------|
| **REPL Bridge** | 🟡 可选 | 与 Web/Mobile 桥接 |
| **远程触发** | 🟡 可选 | RemoteTriggerTool |
| **代码会话** | 🟡 可选 | CodeSessionApi |

**关键代码位置**:
```typescript
// src/bridge/bridgeApi.ts
// src/bridge/codeSessionApi.ts
// src/bridge/remoteBridgeCore.ts
```

---

## 4. 遥测与分析服务

### 4.1 分析遥测

| 服务 | 依赖程度 | 说明 |
|-----|---------|------|
| **GrowthBook** | 🟡 可选 | 功能开关控制 |
| **BigQuery 导出** | 🟢 可禁用 | 使用统计 |
| **事件日志** | 🟢 可禁用 | 匿名使用数据 |

**关键代码位置**:
```typescript
// src/services/analytics/growthbook.ts
'https://api.anthropic.com/'

// src/services/analytics/bigqueryExporter.ts
'https://api.anthropic.com/api/claude_code/metrics'

// src/services/analytics/firstPartyEventLoggingExporter.ts
'https://api.anthropic.com'
```

### 4.2 反馈与调查

| 服务 | 依赖程度 | 说明 |
|-----|---------|------|
| **反馈提交** | 🟢 可禁用 | 用户反馈 |
| **会话分享** | 🟢 可禁用 | 共享会话 |
| **质量调查** | 🟢 可禁用 | 质量反馈 |

**关键代码位置**:
```typescript
// src/components/Feedback.tsx
'https://api.anthropic.com/api/claude_cli_feedback'

// src/components/FeedbackSurvey/submitTranscriptShare.ts
'https://api.anthropic.com/api/claude_code_shared_session_transcripts'
```

---

## 5. 第三方云服务

### 5.1 AWS Bedrock

| 功能 | 依赖程度 | 说明 |
|-----|---------|------|
| **Bedrock API** | 🟡 可替代 | 可作为 Anthropic API 替代 |
| **AWS 认证** | 🟡 可选 | AWS 凭证管理 |

**环境变量**:
```bash
AWS_REGION
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
```

### 5.2 Google Vertex AI

| 功能 | 依赖程度 | 说明 |
|-----|---------|------|
| **Vertex API** | 🟡 可替代 | 可作为 Anthropic API 替代 |
| **GCP 认证** | 🟡 可选 | GCP 凭证管理 |

**环境变量**:
```bash
ANTHROPIC_VERTEX_PROJECT_ID
CLOUD_ML_REGION
```

### 5.3 Microsoft Foundry (Azure)

| 功能 | 依赖程度 | 说明 |
|-----|---------|------|
| **Foundry API** | 🟡 可替代 | 可作为 Anthropic API 替代 |
| **Azure 认证** | 🟡 可选 | Azure 凭证管理 |

**环境变量**:
```bash
ANTHROPIC_FOUNDRY_RESOURCE
ANTHROPIC_FOUNDRY_API_KEY
```

---

## 6. 功能影响评估

### 6.1 完全依赖原厂服务的功能 (🔴 不可用)

| 功能 | 影响 | 替代方案 |
|-----|------|---------|
| AI 对话 | 核心功能失效 | 使用第三方 API (Bedrock/Vertex/Foundry) |
| OAuth 登录 | 无法登录 | 使用 API Key 模式 |
| 远程会话 | 无法使用 | 本地会话 only |
| 会话同步 | 无法同步 | 手动导出/导入 |

### 6.2 部分依赖的功能 (🟡 受限)

| 功能 | 影响 | 说明 |
|-----|------|------|
| Web 搜索 | 受限 | 需要 api.anthropic.com |
| MCP 官方注册表 | 受限 | 可手动配置 MCP 服务器 |
| 功能开关 | 受限 | GrowthBook 依赖 |
| 自动更新 | 受限 | 需要检查更新服务 |

### 6.3 可独立运行的功能 (🟢 可用)

| 功能 | 说明 |
|-----|------|
| 本地文件操作 | Read/Edit/Write 工具 |
| Bash 执行 | 本地命令执行 |
| Git 操作 | 本地 Git 命令 |
| LSP 集成 | 本地语言服务器 |
| MCP 本地服务器 | 手动配置的 MCP 服务器 |
| 技能系统 | 本地技能文件 |
| 插件系统 | 本地插件 |

---

## 7. 离线使用建议

### 7.1 最小依赖配置

```bash
# 使用 API Key 模式 (绕过 OAuth)
export ANTHROPIC_API_KEY="your-api-key"

# 禁用遥测
export CLAUDE_CODE_DISABLE_TELEMETRY=1

# 禁用分析
export CLAUDE_CODE_DISABLE_ANALYTICS=1

# 使用第三方 API (如 Bedrock)
export AWS_REGION="us-east-1"
export AWS_ACCESS_KEY_ID="..."
export AWS_SECRET_ACCESS_KEY="..."
```

### 7.2 自建 API 代理

可以搭建兼容 Anthropic API 的代理服务:

```typescript
// 使用 LiteLLM 等工具搭建代理
// 或自建兼容 API 的服务器
```

### 7.3 功能降级方案

| 原功能 | 降级方案 |
|-------|---------|
| Web 搜索 | 使用本地搜索引擎/爬虫 |
| 远程会话 | 使用 tmux/screen 共享 |
| 会话同步 | Git 仓库同步 |
| MCP 注册表 | 本地配置文件 |
| 自动更新 | 手动更新 |

### 7.4 完全离线模式

```bash
# 启动时添加 --bare 标志
caicode --bare

# 或使用环境变量
export CLAUDE_CODE_SIMPLE=1
```

**--bare 模式禁用功能**:
- Hooks
- LSP
- 插件同步
- 归因分析
- 自动记忆
- 后台预取
- 密钥链读取
- CLAUDE.md 自动发现

---

## 8. 总结

### 8.1 依赖程度统计

| 类别 | 数量 | 占比 |
|-----|------|------|
| 🔴 必需依赖 | 5 | 20% |
| 🟡 可选依赖 | 10 | 40% |
| 🟢 可禁用 | 10 | 40% |

### 8.2 核心结论

1. **AI 对话功能**完全依赖 Anthropic API，这是无法绕过的核心依赖
2. **认证服务**可以通过 API Key 模式绕过 OAuth
3. **遥测分析**可以完全禁用，不影响核心功能
4. **第三方云服务**可以作为 Anthropic API 的替代方案
5. **本地功能**（文件操作、Bash、Git）完全可用

### 8.3 建议

- 如需完全离线使用，必须解决 AI API 依赖（自建代理或使用第三方 API）
- 对于一般使用，配置 API Key 并禁用遥测即可满足大部分需求
- 敏感环境建议使用 `--bare` 模式启动

---

*报告结束*
