# opencode 设置页面二次开发指南

## 1. 设置页面结构分析

### 1.1 整体架构

opencode 的设置页面采用 **垂直标签页** 结构，主要包含以下部分：

```
设置对话框
├── 标签列表（垂直）
│   ├── 桌面部分
│   │   ├── 通用设置
│   │   └── 快捷键
│   └── 服务器部分
│       ├── 提供商
│       └── 模型
└── 内容区域
    ├── 通用设置内容
    ├── 快捷键内容
    ├── 提供商内容
    └── 模型内容
```

### 1.2 核心文件

| 文件路径 | 功能 | 来源 |
|---------|------|------|
| [dialog-settings.tsx](file:///workspace/caiode/opencode/packages/app/src/components/dialog-settings.tsx) | 设置对话框主组件 | 主文件 |
| [settings-general.tsx](file:///workspace/caiode/opencode/packages/app/src/components/settings-general.tsx) | 通用设置页面 | 通用设置 |
| [settings-keybinds.tsx](file:///workspace/caiode/opencode/packages/app/src/components/settings-keybinds.tsx) | 快捷键设置页面 | 快捷键设置 |
| [settings-providers.tsx](file:///workspace/caiode/opencode/packages/app/src/components/settings-providers.tsx) | 提供商设置页面 | 提供商设置 |
| [settings-models.tsx](file:///workspace/caiode/opencode/packages/app/src/components/settings-models.tsx) | 模型设置页面 | 模型设置 |
| [settings-list.tsx](file:///workspace/caiode/opencode/packages/app/src/components/settings-list.tsx) | 设置列表组件 | 通用组件 |

### 1.3 技术实现

- **框架**: Solid.js
- **状态管理**: 自定义 `useSettings` hook + Solid.js store
- **UI 组件**: 自定义组件库
- **国际化**: `useLanguage` hook
- **主题**: `useTheme` hook
- **布局**: 响应式布局，支持桌面和 Web 端

## 2. 设置状态管理

### 2.1 设置上下文

设置状态通过 `useSettings` hook 进行管理，位于 `settings.tsx` 文件中：

```typescript
// packages/app/src/context/settings.tsx
import { useSettings } from "@/context/settings"

function MyComponent() {
  const settings = useSettings()
  
  // 访问设置
  const fontSize = settings.appearance.font()
  
  // 修改设置
  settings.appearance.setFont("Monaco, monospace")
  
  return (
    // 组件内容
  )
}
```

### 2.2 设置结构

设置状态分为多个模块：

| 模块 | 功能 | 示例 |
|------|------|------|
| general | 通用设置 | `showReasoningSummaries`, `releaseNotes` |
| appearance | 外观设置 | `font`, `uiFont`, `theme` |
| notifications | 通知设置 | `agent`, `permissions`, `errors` |
| sounds | 声音设置 | `agentEnabled`, `permissionsEnabled` |
| updates | 更新设置 | `startup` |

### 2.3 持久化

设置通过 `Persist` 工具进行持久化存储，确保设置在重启后保持：

```typescript
// 示例：持久化设置
const [settings, setSettings] = persisted(
  Persist.global("settings", ["settings.v1"]),
  createStore({
    // 设置默认值
  })
)
```

## 3. 扩展设置页面

### 3.1 添加新的设置标签页

**步骤**：
1. 创建新的设置组件
2. 在 `dialog-settings.tsx` 中注册新标签
3. 添加标签触发器和内容

**示例**：

```typescript
// 1. 创建新的设置组件
// packages/app/src/components/settings-ralph.tsx
import { Component } from "solid-js"
import { SettingsList } from "./settings-list"

export const SettingsRalph: Component = () => {
  return (
    <div class="flex flex-col h-full overflow-y-auto no-scrollbar px-4 pb-10 sm:px-10 sm:pb-10">
      <div class="sticky top-0 z-10 bg-[linear-gradient(to_bottom,var(--surface-stronger-non-alpha)_calc(100%_-_24px),transparent)]">
        <div class="flex flex-col gap-1 pt-6 pb-8">
          <h2 class="text-16-medium text-text-strong">Ralph 设置</h2>
        </div>
      </div>
      
      <div class="flex flex-col gap-8 w-full">
        <div class="flex flex-col gap-1">
          <SettingsList>
            {/* 设置项 */}
          </SettingsList>
        </div>
      </div>
    </div>
  )
}

// 2. 在 dialog-settings.tsx 中注册
import { SettingsRalph } from "./settings-ralph"

// 3. 添加标签触发器
<Tabs.Trigger value="ralph">
  <Icon name="ralph" />
  {language.t("settings.tab.ralph")}
</Tabs.Trigger>

// 4. 添加标签内容
<Tabs.Content value="ralph" class="no-scrollbar">
  <SettingsRalph />
</Tabs.Content>
```

### 3.2 添加新的设置项

**步骤**：
1. 在设置状态中添加新的设置项
2. 在设置页面中添加对应的 UI 组件
3. 实现设置的读取和修改逻辑

**示例**：

```typescript
// 1. 在 settings.tsx 中添加新设置项
const [settings, setSettings] = createStore({
  ralph: {
    enabled: true,
    apiKey: "",
    model: "gpt-4"
  }
})

// 2. 添加访问器方法
const ralph = {
  enabled: () => settings.ralph.enabled,
  setEnabled: (value: boolean) => setSettings("ralph", "enabled", value),
  apiKey: () => settings.ralph.apiKey,
  setApiKey: (value: string) => setSettings("ralph", "apiKey", value),
  model: () => settings.ralph.model,
  setModel: (value: string) => setSettings("ralph", "model", value)
}

// 3. 在设置页面中添加 UI
<SettingsRow
  title="Ralph AI 启用"
  description="启用 Ralph AI 功能"
>
  <div data-action="settings-ralph-enabled">
    <Switch
      checked={settings.ralph.enabled()}
      onChange={(checked) => settings.ralph.setEnabled(checked)}
    />
  </div>
</SettingsRow>

<SettingsRow
  title="API 密钥"
  description="Ralph AI 的 API 密钥"
>
  <div class="w-full sm:w-[300px]">
    <TextField
      data-action="settings-ralph-api-key"
      label="API 密钥"
      hideLabel
      type="password"
      value={settings.ralph.apiKey()}
      onChange={(value) => settings.ralph.setApiKey(value)}
      placeholder="输入 API 密钥"
    />
  </div>
</SettingsRow>
```

### 3.3 自定义设置组件

**步骤**：
1. 创建自定义设置组件
2. 集成到设置页面中
3. 处理设置的状态管理

**示例**：

```typescript
// 自定义设置组件
interface CustomSettingProps {
  title: string
  description: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
}

const CustomSetting: Component<CustomSettingProps> = (props) => {
  return (
    <SettingsRow
      title={props.title}
      description={props.description}
    >
      <Select
        options={props.options}
        current={props.options.find((o) => o.value === props.value)}
        value={(o) => o.value}
        label={(o) => o.label}
        onSelect={(option) => option && props.onChange(option.value)}
        variant="secondary"
        size="small"
        triggerVariant="settings"
      />
    </SettingsRow>
  )
}

// 使用自定义组件
<CustomSetting
  title="Ralph 模型"
  description="选择 Ralph 使用的 AI 模型"
  value={settings.ralph.model()}
  onChange={(value) => settings.ralph.setModel(value)}
  options={[
    { value: "gpt-4", label: "GPT-4" },
    { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
    { value: "claude-3", label: "Claude 3" }
  ]}
/>
```

## 4. 国际化支持

### 4.1 添加翻译

**步骤**：
1. 在语言文件中添加新的翻译键
2. 在设置页面中使用翻译

**示例**：

```typescript
// 在 en.ts 中添加翻译
const en = {
  settings: {
    tab: {
      ralph: "Ralph"
    },
    ralph: {
      row: {
        enabled: {
          title: "Enable Ralph AI",
          description: "Enable Ralph AI features"
        }
      }
    }
  }
}

// 在设置页面中使用
import { useLanguage } from "@/context/language"

function SettingsRalph() {
  const language = useLanguage()
  
  return (
    <SettingsRow
      title={language.t("settings.ralph.row.enabled.title")}
      description={language.t("settings.ralph.row.enabled.description")}
    >
      {/* 设置组件 */}
    </SettingsRow>
  )
}
```

### 4.2 支持多语言

opencode 支持多种语言，添加新语言时需要：
1. 在 `i18n` 目录中创建新的语言文件
2. 在 `language.tsx` 中注册新语言
3. 提供完整的翻译

## 5. 主题和样式

### 5.1 主题集成

设置页面支持主题切换，集成方式：

```typescript
import { useTheme } from "@opencode-ai/ui/theme/context"

function SettingsAppearance() {
  const theme = useTheme()
  
  return (
    <SettingsRow
      title="主题"
      description="选择应用主题"
    >
      <Select
        options={theme.ids().map((id) => ({ id, name: theme.name(id) }))}
        current={themeOptions().find((o) => o.id === theme.themeId())}
        value={(o) => o.id}
        label={(o) => o.name}
        onSelect={(option) => option && theme.setTheme(option.id)}
        onHighlight={(option) => {
          if (!option) return
          theme.previewTheme(option.id)
          return () => theme.cancelPreview()
        }}
      />
    </SettingsRow>
  )
}
```

### 5.2 样式定制

设置页面使用 Tailwind CSS 进行样式管理，可以通过以下方式定制：

1. **使用现有类**：利用项目中已定义的 Tailwind 类
2. **自定义类**：在 `index.css` 中添加自定义样式
3. **内联样式**：使用 `style` 属性添加内联样式

## 6. 最佳实践

### 6.1 代码组织

- **模块化**：将设置按功能模块分离
- **组件化**：创建可复用的设置组件
- **类型安全**：使用 TypeScript 类型定义设置结构
- **状态管理**：使用统一的设置状态管理

### 6.2 用户体验

- **清晰的分组**：将相关设置分组
- **详细的描述**：为每个设置项提供清晰的描述
- **实时预览**：支持设置的实时预览（如主题）
- **验证**：对输入进行验证（如 API 密钥格式）
- **反馈**：提供设置变更的反馈（如 toast 消息）

### 6.3 性能优化

- **懒加载**：大型设置页面使用懒加载
- **缓存**：缓存设置状态，避免重复计算
- **防抖**：对频繁变更的设置使用防抖
- **批量更新**：批量处理设置变更

## 7. 扩展示例

### 7.1 添加 Ralph AI 设置标签

**完整示例**：

```typescript
// packages/app/src/components/settings-ralph.tsx
import { Component } from "solid-js"
import { Switch } from "@opencode-ai/ui/switch"
import { TextField } from "@opencode-ai/ui/text-field"
import { Select } from "@opencode-ai/ui/select"
import { useLanguage } from "@/context/language"
import { useSettings } from "@/context/settings"
import { SettingsList } from "./settings-list"

export const SettingsRalph: Component = () => {
  const language = useLanguage()
  const settings = useSettings()

  const modelOptions = [
    { value: "gpt-4", label: "GPT-4" },
    { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
    { value: "claude-3", label: "Claude 3" },
    { value: "gemini-pro", label: "Gemini Pro" }
  ]

  return (
    <div class="flex flex-col h-full overflow-y-auto no-scrollbar px-4 pb-10 sm:px-10 sm:pb-10">
      <div class="sticky top-0 z-10 bg-[linear-gradient(to_bottom,var(--surface-stronger-non-alpha)_calc(100%_-_24px),transparent)]">
        <div class="flex flex-col gap-1 pt-6 pb-8">
          <h2 class="text-16-medium text-text-strong">{language.t("settings.tab.ralph")}</h2>
        </div>
      </div>

      <div class="flex flex-col gap-8 w-full">
        <div class="flex flex-col gap-1">
          <h3 class="text-14-medium text-text-strong pb-2">{language.t("settings.ralph.section.general")}</h3>
          
          <SettingsList>
            <SettingsRow
              title={language.t("settings.ralph.row.enabled.title")}
              description={language.t("settings.ralph.row.enabled.description")}
            >
              <div data-action="settings-ralph-enabled">
                <Switch
                  checked={settings.ralph.enabled()}
                  onChange={(checked) => settings.ralph.setEnabled(checked)}
                />
              </div>
            </SettingsRow>

            <SettingsRow
              title={language.t("settings.ralph.row.apiKey.title")}
              description={language.t("settings.ralph.row.apiKey.description")}
            >
              <div class="w-full sm:w-[300px]">
                <TextField
                  data-action="settings-ralph-api-key"
                  label={language.t("settings.ralph.row.apiKey.title")}
                  hideLabel
                  type="password"
                  value={settings.ralph.apiKey()}
                  onChange={(value) => settings.ralph.setApiKey(value)}
                  placeholder={language.t("settings.ralph.row.apiKey.placeholder")}
                  disabled={!settings.ralph.enabled()}
                />
              </div>
            </SettingsRow>

            <SettingsRow
              title={language.t("settings.ralph.row.model.title")}
              description={language.t("settings.ralph.row.model.description")}
            >
              <Select
                data-action="settings-ralph-model"
                options={modelOptions}
                current={modelOptions.find((o) => o.value === settings.ralph.model())}
                value={(o) => o.value}
                label={(o) => o.label}
                onSelect={(option) => option && settings.ralph.setModel(option.value)}
                variant="secondary"
                size="small"
                triggerVariant="settings"
                disabled={!settings.ralph.enabled()}
              />
            </SettingsRow>
          </SettingsList>
        </div>

        <div class="flex flex-col gap-1">
          <h3 class="text-14-medium text-text-strong pb-2">{language.t("settings.ralph.section.advanced")}</h3>
          
          <SettingsList>
            <SettingsRow
              title={language.t("settings.ralph.row.timeout.title")}
              description={language.t("settings.ralph.row.timeout.description")}
            >
              <div class="w-full sm:w-[100px]">
                <TextField
                  data-action="settings-ralph-timeout"
                  label={language.t("settings.ralph.row.timeout.title")}
                  hideLabel
                  type="number"
                  value={settings.ralph.timeout().toString()}
                  onChange={(value) => {
                    const num = parseInt(value)
                    if (!isNaN(num)) {
                      settings.ralph.setTimeout(num)
                    }
                  }}
                  placeholder="30"
                  disabled={!settings.ralph.enabled()}
                />
              </div>
            </SettingsRow>
          </SettingsList>
        </div>
      </div>
    </div>
  )
}

interface SettingsRowProps {
  title: string
  description: string
  children: JSX.Element
}

const SettingsRow: Component<SettingsRowProps> = (props) => {
  return (
    <div class="flex flex-wrap items-center gap-4 py-3 border-b border-border-weak-base last:border-none sm:flex-nowrap">
      <div class="flex min-w-0 flex-1 flex-col gap-0.5">
        <span class="text-14-medium text-text-strong">{props.title}</span>
        <span class="text-12-regular text-text-weak">{props.description}</span>
      </div>
      <div class="flex w-full justify-end sm:w-auto sm:shrink-0">{props.children}</div>
    </div>
  )
}
```

### 7.2 集成到设置对话框

```typescript
// packages/app/src/components/dialog-settings.tsx
import { SettingsRalph } from "./settings-ralph"

// 在标签列表中添加
<div class="flex flex-col gap-1.5">
  <Tabs.SectionTitle>{language.t("settings.section.ralph")}</Tabs.SectionTitle>
  <div class="flex flex-col gap-1.5 w-full">
    <Tabs.Trigger value="ralph">
      <Icon name="ralph" />
      {language.t("settings.tab.ralph")}
    </Tabs.Trigger>
  </div>
</div>

// 在标签内容中添加
<Tabs.Content value="ralph" class="no-scrollbar">
  <SettingsRalph />
</Tabs.Content>
```

## 8. 部署和测试

### 8.1 开发流程

1. **启动开发服务器**：`bun run dev:web`
2. **打开设置页面**：在应用中打开设置对话框
3. **测试设置变更**：修改设置并验证效果
4. **类型检查**：`bun run typecheck`
5. **构建**：`bun run build`

### 8.2 测试策略

- **功能测试**：验证设置的保存和加载
- **UI 测试**：验证设置页面的布局和响应式
- **国际化测试**：验证多语言支持
- **主题测试**：验证在不同主题下的显示效果
- **性能测试**：验证设置页面的加载性能

## 9. 总结

opencode 的设置页面采用模块化、组件化的设计，提供了良好的扩展能力。通过以下步骤可以实现设置页面的二次开发：

1. **了解现有结构**：熟悉设置页面的架构和实现
2. **添加新设置**：在设置状态中添加新的设置项
3. **创建 UI 组件**：为新设置创建对应的 UI 组件
4. **集成到页面**：将新设置集成到设置页面中
5. **添加国际化**：为新设置添加多语言支持
6. **测试和部署**：测试设置功能并部署

通过遵循最佳实践，可以创建出功能完整、用户体验良好的设置页面扩展，为 opencode 项目添加新的功能和定制化选项。

[READY_FOR_REVIEW]