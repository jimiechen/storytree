# Claude Code WebFetch 实现分析报告

**生成日期**: 2026-04-07  
**项目**: Caiode (基于 Claude Code)

---

## 1. 概述

Claude Code 的 WebFetch 工具实现**完全开源**，不依赖任何闭源的 Anthropic 私有包。

### 核心功能

WebFetch 是一个用于从网页获取内容并处理的工具，主要功能包括：
- HTTP 请求获取网页内容
- HTML 转 Markdown
- 内容缓存
- 域名安全检查
- 重定向处理
- 二进制内容保存

---

## 2. 依赖分析

### 2.1 已声明的依赖

| 依赖包 | 版本 | 许可证 | 用途 |
|--------|------|--------|------|
| `axios` | ^1.6.2 | MIT | HTTP 客户端 |

**状态**: ✅ 开源，已在 [package.json](file:///workspace/caiode/package.json#L35) 中声明

### 2.2 隐式依赖（未在 package.json 中声明）

| 依赖包 | 许可证 | 用途 |
|--------|--------|------|
| `lru-cache` | ISC | URL 内容缓存和域名检查缓存 |
| `turndown` | MIT | HTML 转 Markdown 服务 |

**状态**: ✅ 开源，但未在 package.json 中明确声明

---

## 3. 核心实现文件

### 3.1 主工具定义

**文件**: [WebFetchTool.ts](file:///workspace/caiode/claude-code-src/tools/WebFetchTool/WebFetchTool.ts)

**主要功能**:
- 工具输入/输出 Schema 定义
- 权限检查逻辑
- 工具调用执行流程
- 重定向处理

**关键代码**:
```typescript
export const WebFetchTool = buildTool({
  name: WEB_FETCH_TOOL_NAME,
  // ...
  async call({ url, prompt }, { abortController, options }) {
    const response = await getURLMarkdownContent(url, abortController)
    // ... 处理响应
  }
})
```

### 3.2 工具实现

**文件**: [utils.ts](file:///workspace/caiode/claude-code-src/tools/WebFetchTool/utils.ts)

**主要功能**:
- URL 验证
- 域名检查（调用 Anthropic API）
- HTTP 请求（带自定义重定向处理）
- HTML 转 Markdown
- 内容缓存（LRUCache）
- 二进制内容保存

**关键组件**:

1. **URL 缓存**
   ```typescript
   const URL_CACHE = new LRUCache<string, CacheEntry>({
     maxSize: 50 * 1024 * 1024, // 50MB
     ttl: 15 * 60 * 1000, // 15 minutes
   })
   ```

2. **域名检查缓存**
   ```typescript
   const DOMAIN_CHECK_CACHE = new LRUCache<string, true>({
     max: 128,
     ttl: 5 * 60 * 1000, // 5 minutes
   })
   ```

3. **Turndown 服务（懒加载）**
   ```typescript
   function getTurndownService(): Promise<InstanceType<TurndownCtor>> {
     return (turndownServicePromise ??= import('turndown').then(m => {
       const Turndown = (m as unknown as { default: TurndownCtor }).default
       return new Turndown()
     }))
   }
   ```

### 3.3 预批准域名

**文件**: [preapproved.ts](file:///workspace/caiode/claude-code-src/tools/WebFetchTool/preapproved.ts)

**主要功能**:
- 定义预批准的域名列表
- 域名和路径前缀检查

**预批准的域名类别**:
- Anthropic 相关域名
- 编程语言文档
- Web 框架文档
- 数据库文档
- 云服务文档
- 等等（共 130+ 个域名）

---

## 4. 安全机制

### 4.1 域名安全检查

**实现**:
```typescript
async function checkDomainBlocklist(domain: string): Promise<DomainCheckResult> {
  const response = await axios.get(
    `https://api.anthropic.com/api/web/domain_info?domain=${encodeURIComponent(domain)}`,
    { timeout: DOMAIN_CHECK_TIMEOUT_MS },
  )
  // ... 检查响应
}
```

**注意**: 这是调用 Anthropic 的公共 API，不是私有依赖包

### 4.2 预批准域名

无需用户批准即可访问的预定义域名列表

### 4.3 URL 验证

- 最大 URL 长度限制：2000 字符
- 阻止包含用户名/密码的 URL
- 阻止内部网络 URL

### 4.4 重定向安全

只允许以下重定向：
- 添加或移除 www.
- 保持相同 origin（改变路径/查询参数）
- 或两者兼有

---

## 5. Opencode 替代方案分析

### 5.1 Opencode 架构

Opencode 使用不同的架构：
- 使用 **Effect** 生态系统
- 使用 **Solid.js** 作为前端框架
- 使用 **MCP (Model Context Protocol)** 进行工具集成

### 5.2 Opencode 中的工具实现

Opencode 的工具通过以下方式实现：
- [tool.ts](file:///workspace/caiode/opencode/packages/plugin/src/tool.ts) - 工具定义接口
- 基于 MCP 协议的插件系统
- 没有找到类似 WebFetch 的内置工具

### 5.3 对比结论

**Claude Code WebFetch 优势**:
- 完整且成熟的实现
- 完善的安全机制
- 良好的缓存策略
- HTML 转 Markdown 功能

**无需替换原因**:
1. ✅ 完全开源实现
2. ✅ 依赖都是开源包
3. ✅ 实现质量高，功能完善
4. ✅ Opencode 中没有直接替代方案

---

## 6. 建议

### 6.1 保留 Claude Code WebFetch

**建议**: 直接保留 Claude Code 的 WebFetch 实现

**理由**:
1. 完全开源，无闭源依赖
2. 功能完善，安全机制健全
3. 与现有代码架构兼容

### 6.2 补充缺失的依赖声明

在 [package.json](file:///workspace/caiode/package.json) 中添加缺失的依赖：
```json
{
  "dependencies": {
    "lru-cache": "^10.0.0",
    "turndown": "^7.0.0"
  }
}
```

### 6.3 移植策略

对于 WebFetch 工具：
1. ✅ 直接保留 Claude Code 实现
2. ✅ 补充缺失的依赖声明
3. ✅ 无需查阅 opencode 替代（因为没有直接替代）
4. ✅ 无需搜索开源依赖（已有合适的依赖）

---

## 7. 总结

| 问题 | 答案 |
|------|------|
| WebFetch 是否闭源？ | ❌ 否，完全开源 |
| 是否依赖闭源包？ | ❌ 否，所有依赖都是开源的 |
| Opencode 有替代方案吗？ | ❌ 没有直接替代 |
| 是否需要替换？ | ❌ 不需要，直接保留 |

**结论**: Claude Code 的 WebFetch 工具实现完全开源，可以直接移植使用，无需寻找替代方案。

---

**报告生成完成**