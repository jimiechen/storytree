# Bun 导入修复技术方案文档

## 文档信息
- **文档编号**: TECH-SPEC-BUN-001
- **创建日期**: 2026-04-06
- **目标项目**: caiode (Claude Code CLI)
- **问题类型**: 源码兼容性修复

---

## 1. 问题概述

### 1.1 核心问题
项目源码中使用了大量 `bun:` 前缀的导入语句，这些导入是 Bun 运行时特有的，无法在 Node.js 环境中运行。

### 1.2 影响范围
- **文件数量**: 约 10+ 个文件
- **导入类型**:
  - `bun:bundle` - 功能开关/特性标志
  - `bun:sqlite` - SQLite 数据库操作
  - `bun:ffi` - 外部函数接口

### 1.3 当前错误
```typescript
// 当前代码中的问题导入
import { feature } from 'bun:bundle'
// Error: Cannot find module 'bun:bundle'
```

---

## 2. 技术方案

### 2.1 方案一: 创建 Bun 兼容层 (推荐)

创建一个兼容层模块，在 Node.js 环境中提供等效实现。

#### 2.1.1 bun:bundle 替换
```typescript
// src/utils/bun-compat/bundle.ts
export interface FeatureFlags {
  [key: string]: boolean
}

export function feature(name: string): boolean {
  // 从环境变量或配置文件读取特性标志
  const envKey = `CLAUDE_CODE_FEATURE_${name.toUpperCase()}`
  const envValue = process.env[envKey]
  
  if (envValue !== undefined) {
    return envValue === 'true' || envValue === '1'
  }
  
  // 默认特性配置
  const defaultFeatures: FeatureFlags = {
    'UDS_INBOX': true,
    'CONTEXT_COLLAPSE': false,
    'COMMIT_ATTRIBUTION': true,
    'TEAMMEM': false,
    'CCR_MIRROR': false,
    // ... 其他特性
  }
  
  return defaultFeatures[name] ?? false
}
```

#### 2.1.2 bun:sqlite 替换
```typescript
// src/utils/bun-compat/sqlite.ts
import Database from 'better-sqlite3'

export class SQLiteDatabase {
  private db: Database.Database
  
  constructor(path: string) {
    this.db = new Database(path)
  }
  
  query(sql: string) {
    return this.db.prepare(sql)
  }
  
  run(sql: string, ...params: any[]) {
    return this.db.prepare(sql).run(...params)
  }
  
  close() {
    this.db.close()
  }
}

export { SQLiteDatabase as Database }
```

#### 2.1.3 bun:ffi 替换
```typescript
// src/utils/bun-compat/ffi.ts
import ffi from 'ffi-napi'
import ref from 'ref-napi'

export { ffi, ref }

// 提供与 bun:ffi 类似的 API
export function dlopen(path: string, symbols: Record<string, any>) {
  return ffi.Library(path, symbols)
}
```

### 2.2 方案二: 使用 Import Map 别名

在 `package.json` 或 `tsconfig.json` 中配置路径别名：

```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "bun:bundle": ["./src/utils/bun-compat/bundle.ts"],
      "bun:sqlite": ["./src/utils/bun-compat/sqlite.ts"],
      "bun:ffi": ["./src/utils/bun-compat/ffi.ts"]
    }
  }
}
```

### 2.3 方案三: 条件导入

使用动态导入和运行时检测：

```typescript
// src/utils/feature.ts
let featureImpl: (name: string) => boolean

async function initFeature() {
  if (typeof Bun !== 'undefined') {
    // Bun 环境
    const { feature } = await import('bun:bundle')
    featureImpl = feature
  } else {
    // Node.js 环境
    const { feature } = await import('./bun-compat/bundle.js')
    featureImpl = feature
  }
}

export function feature(name: string): boolean {
  return featureImpl(name)
}
```

---

## 3. 实施计划

### 3.1 阶段一: 创建兼容层 (优先级: P0)
- [ ] 创建 `src/utils/bun-compat/` 目录
- [ ] 实现 `bundle.ts` - 特性标志兼容层
- [ ] 实现 `sqlite.ts` - SQLite 兼容层
- [ ] 实现 `ffi.ts` - FFI 兼容层
- [ ] 添加单元测试

### 3.2 阶段二: 替换导入 (优先级: P0)
- [ ] 替换 `src/setup.ts` 中的 `bun:bundle`
- [ ] 替换 `src/bridge/remoteBridgeCore.ts` 中的 `bun:bundle`
- [ ] 替换 `src/utils/shell/bashProvider.ts` 中的 `bun:bundle`
- [ ] 替换 `src/utils/filePersistence/filePersistence.ts` 中的 `bun:bundle`
- [ ] 替换 `src/utils/nativeInstaller/download.ts` 中的 `bun:bundle`
- [ ] 替换其他文件中的 `bun:` 导入

### 3.3 阶段三: 路径修复 (优先级: P1)
- [ ] 修复相对路径导入问题
- [ ] 确保所有 `src/` 路径正确解析
- [ ] 验证 TypeScript 编译

### 3.4 阶段四: 类型定义 (优先级: P1)
- [ ] 创建缺失的类型定义文件
- [ ] 更新 `global.d.ts`
- [ ] 确保类型检查通过

### 3.5 阶段五: React Compiler (优先级: P2)
- [ ] 识别 React Compiler 相关代码
- [ ] 添加必要的 Babel/ESBuild 配置
- [ ] 验证编译输出

---

## 4. 依赖安装

需要添加的 npm 依赖：

```bash
# SQLite 支持
npm install better-sqlite3
npm install -D @types/better-sqlite3

# FFI 支持
npm install ffi-napi ref-napi
npm install -D @types/ffi-napi @types/ref-napi

# 其他可能需要的依赖
npm install dotenv  # 用于环境变量管理
```

---

## 5. 风险评估

| 风险项 | 影响 | 概率 | 缓解措施 |
|--------|------|------|----------|
| 特性标志行为不一致 | 高 | 中 | 建立完整的特性标志映射表 |
| SQLite 性能差异 | 中 | 低 | 使用 better-sqlite3，性能接近原生 |
| FFI 兼容性问题 | 高 | 中 | 使用 ffi-napi，测试关键路径 |
| 构建配置复杂化 | 中 | 中 | 提供清晰的构建文档 |

---

## 6. 验证方案

### 6.1 单元测试
```bash
npm test
```

### 6.2 类型检查
```bash
npx tsc --noEmit
```

### 6.3 构建验证
```bash
npm run build
```

### 6.4 运行时测试
```bash
node dist/cli.js --version
```

---

## 7. 回滚方案

如需回滚：
1. 保留原始文件备份
2. 使用 Git 回滚到修复前版本
3. 恢复原始的 Bun 依赖配置

---

## 8. 附录

### 8.1 受影响的文件列表
- `src/setup.ts`
- `src/bridge/remoteBridgeCore.ts`
- `src/utils/shell/bashProvider.ts`
- `src/utils/filePersistence/filePersistence.ts`
- `src/utils/nativeInstaller/download.ts`
- `src/utils/permissions/filesystem.ts`
- `src/tools/BashTool/BashTool.tsx`
- `src/tasks/LocalShellTask/LocalShellTask.tsx`
- `src/utils/memoryFileDetection.ts`

### 8.2 参考文档
- [Bun 官方文档](https://bun.sh/docs)
- [better-sqlite3 文档](https://github.com/WiseLibs/better-sqlite3)
- [ffi-napi 文档](https://github.com/node-ffi-napi/node-ffi-napi)

---

**文档状态**: 草案  
**下次评审**: 2026-04-07  
**负责人**: Agent
