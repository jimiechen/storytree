# PLUGIN-RUNTIME-SPEC.md

> **角色**: 项目协调 Agent (Kimi-K2.6)  
> **任务ID**: DOC-PHASE0-012  
> **日期**: 2026-05-15  
> **版本**: v1.0  
> **状态**: [READY_FOR_REVIEW]

---

## 一、Plugin 定义

**Plugin = 产品模块和商业模块**

Plugin 不是 Skill，不是 Provider，不是 Tool。Plugin 是面向用户的创作功能模块，通过 License Gate 控制访问权限。

---

## 二、Plugin Manifest

每个插件必须提供独立 manifest，声明能力、权限、价格、入口和依赖。

```typescript
type CreativePluginManifest = {
  id: string
  name: string
  version: string
  description: string
  category:
    | 'story'
    | 'script'
    | 'storyboard'
    | '3d'
    | 'image'
    | 'video'
    | 'audio'
    | 'editing'
    | 'workflow'
    | 'team'

  pricing: {
    model: 'free' | 'one_time' | 'subscription' | 'credits' | 'bundle'
    sku: string
    trialDays?: number
  }

  dependencies: {
    coreVersion: string
    plugins?: string[]
    providers?: string[]
    skills?: string[]
  }

  permissions: {
    fileRead?: boolean
    fileWrite?: boolean
    assetRead?: boolean
    assetWrite?: boolean
    taskCreate?: boolean
    providerUse?: string[]
    networkAccess?: boolean
    ffmpegAccess?: boolean
  }

  extensionPoints: {
    pages?: string[]
    panels?: string[]
    commands?: string[]
    assetTypes?: string[]
    taskTypes?: string[]
    skills?: string[]
    providers?: string[]
  }

  capabilities: {
    id: string
    description: string
    inputSchema: string
    outputSchema: string
    requiredSkill?: string
    requiredProvider?: string
    requiredLicenseFeature?: string
  }[]
}
```

---

## 三、Plugin Capability

Plugin Capability 是插件暴露给 Agent 使用的能力接口。

```typescript
interface PluginCapability {
  id: string
  description: string
  inputSchema: string
  outputSchema: string
  requiredSkill?: string
  requiredProvider?: string
  requiredLicenseFeature?: string
}
```

### 3.1 Capability 示例

```typescript
// Storyboard Studio Plugin Capabilities
const storyboardCapabilities = [
  {
    id: 'storyboard.createShots',
    description: 'Create storyboard shots from scene content',
    inputSchema: 'SceneInputSchema',
    outputSchema: 'ShotArraySchema',
    requiredSkill: 'story-to-shot'
  },
  {
    id: 'storyboard.refineShot',
    description: 'Refine a shot with camera details',
    inputSchema: 'ShotInputSchema',
    outputSchema: 'ShotSchema',
    requiredSkill: 'shot-camera-plan'
  },
  {
    id: 'storyboard.exportStoryboard',
    description: 'Export storyboard as PDF or image sequence',
    inputSchema: 'ExportInputSchema',
    outputSchema: 'ExportResultSchema'
  }
]

// Script Studio Plugin Capabilities
const scriptCapabilities = [
  {
    id: 'script.convertFromNovel',
    description: 'Convert novel scene to screenplay format',
    inputSchema: 'NovelSceneSchema',
    outputSchema: 'ScreenplaySceneSchema',
    requiredSkill: 'novel-to-script'
  }
]

// Image Prompt Plugin Capabilities
const imagePromptCapabilities = [
  {
    id: 'imagePrompt.generate',
    description: 'Generate image prompt from shot description',
    inputSchema: 'ShotSchema',
    outputSchema: 'ImagePromptSchema',
    requiredSkill: 'shot-to-image-prompt'
  }
]
```

---

## 四、Extension Points

OpenCode Core 提供以下稳定扩展点：

| 扩展点 | 用途 | 注册方式 |
|--------|------|---------|
| `workspace.page` | 注册新页面 | `runtime.registerPage(manifest.id, pageConfig)` |
| `workspace.panel` | 注册侧栏/右栏面板 | `runtime.registerPanel(manifest.id, panelConfig)` |
| `command.palette` | 注册命令 | `runtime.registerCommand(manifest.id, commandDef)` |
| `asset.type` | 注册资产类型 | `runtime.registerAssetType(manifest.id, assetTypeDef)` |
| `task.type` | 注册任务类型 | `runtime.registerTaskType(manifest.id, taskTypeDef)` |
| `skill.type` | 注册 Skill | `runtime.registerSkill(manifest.id, skillDef)` |
| `provider.type` | 注册 Provider | `runtime.registerProvider(manifest.id, providerDef)` |
| `export.format` | 注册导出格式 | `runtime.registerExportFormat(manifest.id, formatDef)` |
| `settings.section` | 注册设置页面 | `runtime.registerSettingsSection(manifest.id, sectionDef)` |
| `license.feature` | 注册付费功能点 | `runtime.registerLicenseFeature(manifest.id, featureDef)` |

---

## 五、权限边界

### 5.1 插件默认权限

| 权限 | 默认状态 | 说明 |
|------|---------|------|
| fileRead | false | 需显式申请 |
| fileWrite | false | 需显式申请 |
| assetRead | true | 可读取资产库 |
| assetWrite | false | 需显式申请 |
| taskCreate | false | 需显式申请 |
| providerUse | [] | 需显式申请可用 Provider |
| networkAccess | false | 需显式申请 |
| ffmpegAccess | false | 需显式申请 |

### 5.2 高危操作限制

以下操作插件禁止直接执行，必须通过 Core 提供的抽象接口：

- Bash 命令执行
- WebFetch 远程请求
- WebSearch 网络搜索
- 子 Agent 调用
- 环境变量读取
- 系统目录访问
- 沙箱外路径访问

---

## 六、Plugin 与 Skill 的关系

```text
Plugin 不是 Skill
Skill 不是 Plugin

Plugin 提供 Agent 能用的能力
Skill 告诉 Agent 怎么做

Skill 调用 Plugin Capability
Plugin Capability 暴露给 Agent 使用
```

---

*[READY_FOR_REVIEW]*
