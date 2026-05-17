# 🔴 Bug 报告：长方体功能缺陷（P0 阻塞级）

**报告编号**: BUG-PHASE0-LIGHT-001
**报告日期**: 2026-05-16
**严重程度**: P0 (阻塞级)
**影响范围**: Novel 3D Editor - 长方体（Box）完整功能链路
**测试工程师**: GLM-5V-Turbo (前端工程师 + Browser Use Agent)
**当前积分**: 30/100 🚨🚨 危险

---

## 📋 问题概述

### Bug 1: 长方体失焦消失问题

| 属性 | 值 |
|------|-----|
| **状态** | ❌ **未复现** (可能已在之前修复中解决) |
| **优先级** | P3 (保持监控) |
| **复现环境** | Windows 11 + Chrome, http://localhost:3001/shot3d |
| **最后确认时间** | 2026-05-16 23:30 |

#### 测试步骤与结果

```markdown
✅ 步骤1: 点击"▣ 长方体"按钮 → 长方体成功添加（橙色）
✅ 步骤2: 自动选中 → TransformControls gizmo 显示
✅ 步骤3: 点击空白处取消选中 → **长方体仍然可见！**
✅ 步骤4: 对比圆柱体 → 行为完全一致
```

**结论**: 当前版本中此 Bug **未复现**，建议保持监控。如用户再次报告，需收集：
- 浏览器版本和操作系统
- 具体的操作序列
- 控制台错误日志

---

### Bug 2: 方阵整体移动缩放失效 ⭐⭐⭐ 核心问题

| 属性 | 值 |
|------|-----|
| **状态** | ✅ **已复现并定位根因** |
| **优先级** | **P0 (阻塞级)** |
| **影响范围** | 所有长方体编辑功能（属性查看、移动、缩放） |
| **根因数量** | 3 处代码缺陷 |
| **预估修复时间** | 2-4 小时（含测试） |

#### 复现象象

**现象 1: Object 面板缺失 ❌**

| 对象类型 | Object 面板 | 移动/缩放按钮 | 坐标输入框 |
|---------|-----------|--------------|-----------|
| ✅ 圆柱体选中 | 完整显示 | ✅ 存在 | ✅ X/Y/Z 可编辑 |
| ❌ 长方体选中 | **完全不显示** | ❌ 不存在 | ❌ 不存在 |
| ✅ 光源选中 | 完整显示 | ✅ 存在 | ✅ 位置/旋转可编辑 |

**现象 2: TransformControls 绑定错误 ❌**

```
预期行为: 选中单个长方体 → Gizmo 绑定到该长方体 Mesh
实际行为: 选中单个长方体 → Gizmo 绑定到 boxGroup（包含所有长方体）
后果: 拖动 Gizmo 会导致所有长方体整体移动/缩放，而非仅操作选中的那个
```

#### 复现步骤（必现）

```markdown
1. 点击"▣ 长方体"按钮添加 3-4 个长方体（构建方阵）
2. 点击其中一个长方体进行选中
   ❌ 预期: 右侧显示 Object 面板（ID, Label, Width, Height, Depth, Position）
   ❌ 实际: 右侧无任何面板显示，只有 TransformControls gizmo
3. 尝试切换到"移动"模式
   ❌ 预期: 出现移动/缩放模式切换按钮
   ❌ 实际: 按钮不存在（因为 InfoPanel 未渲染）
4. 强制拖动 gizmo（如果可见）
   ❌ 预期: 仅选中的长方体移动
   ❌ 实验性: 可能导致所有长方体整体移动（待进一步验证）
```

**必要条件**:
- ✅ 必须添加至少 1 个长方体
- ✅ 必须点击选中该长方体
- ✅ 必须观察右侧 Object 面板区域

**影响范围评估**:

| 维度 | 评分 | 说明 |
|------|------|------|
| 功能完整性 | 🔴 严重 | 长方体无法进行任何变换操作 |
| 用户体验 | 🔴 严重 | 核心编辑功能不可用，与圆柱体验不一致 |
| 数据风险 | 🟡 中等 | 不会丢失数据，但无法精确调整 |
| 影响范围 | 🔴 广泛 | 所有使用长方体功能的用户 |

---

## 🔬 根因分析（Root Cause Analysis）

### 缺陷位置 1: [InfoPanel.tsx:9-13](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel-3d/components/InfoPanel.tsx#L9-L13)

**问题类型**: 查找逻辑不完整  
**严重程度**: P0 (导致整个面板不渲染)  
**影响**: 长方体和光源选中时 InfoPanel 完全不显示

#### ❌ 错误代码

```typescript
// 文件: c:\projects\storytree\caiode\opencode-1.4.0\packages\app\src\novel-3d\components\InfoPanel.tsx
// 行号: 9-13

export function InfoPanel(props: { store: Shot3DStore }) {
  const selected = () => {
    const s = props.store.scene();
    if (!s.selectedObjectId) return undefined;
    // ❌ BUG: 只搜索 cylinders 数组，忽略 boxes 和 lights!
    return s.cylinders.find(c => c.id === s.selectedObjectId);
  };
  // ...
}
```

**问题说明**:
- `selected()` 函数只调用 `s.cylinders.find()`
- 当 `selectedObjectId` 为 `box-xxx` 或 `light-xxx` 格式时，返回 `undefined`
- 导致 `<Show when={selected()}>` 条件为 false
- 整个 InfoPanel（包括移动/缩放按钮、坐标输入框）都不渲染

#### ✅ 修复方案

```typescript
// 正确代码: 同时查找三种对象数组
const selected = () => {
  const s = props.store.scene();
  if (!s.selectedObjectId) return undefined;
  return (
    s.cylinders.find(c => c.id === s.selectedObjectId) ||
    s.boxes.find(b => b.id === s.selectedObjectId) ||
    s.lights.find(l => l.id === s.selectedObjectId)
  );
};
```

**修复要点**:
1. 使用逻辑或 (`||`) 连接三个查找操作
2. 返回第一个匹配的对象（CylinderObject | BoxObject | LightObject）
3. 保持向后兼容（圆柱体查找逻辑不变）

---

### 缺陷位置 2: [ThreeViewport.tsx:156-159](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src/novel-3d/components/ThreeViewport/ThreeViewport.tsx#L156-L159)

**问题类型**: TransformControls 绑定目标错误  
**严重程度**: P0 (导致变换操作影响全局)  
**影响**: 长方体变换时会影响所有长方体

#### ❌ 错误代码

```typescript
// 文件: c:\projects\storytree\caiode\opencode-1.4.0\packages\app\src\novel-3d\components\ThreeViewport\ThreeViewport.tsx
// 行号: 132-177 (Effect 2: TransformControls 绑定)

createEffect(on(
  () => [cylManager.entries(), lightManager.entries(), props.store.scene().selectedObjectId] as const,
  ([cylEntries, lightEntries, selectedId]) => {
    if (!selectedId) {
      transformCtx.attach(null);
      return;
    }

    // ... 光源处理 ...

    if (selectedId.startsWith('box-')) {
      // ❌ BUG: 绑定整个 boxGroup（包含所有长方体），而非单个选中的 mesh!
      transformCtx.attach(cylManager.boxGroup);
      return;
    }

    // ... 圆柱体处理 ...
  }
));
```

**问题说明**:
- 当选中 ID 以 `box-` 开头的对象时，直接绑定 `cylManager.boxGroup`
- `boxGroup` 是一个 THREE.Group，包含**所有**长方体 mesh
- TransformControls 操作的是 group 的变换，会**同步应用到所有子对象**
- 结果：拖动 gizmo 时，所有长方体一起移动/缩放，而不是仅操作选中的那一个

#### ✅ 修复方案

```typescript
if (selectedId.startsWith('box-')) {
  // ✅ 正确: 在 boxGroup 中查找具体选中的 mesh
  const boxMesh = cylManager.boxGroup.children.find(
    (child: THREE.Mesh) => child.userData?.id === selectedId
  ) as THREE.Mesh | undefined;

  if (boxMesh) {
    transformCtx.attach(boxMesh);  // 绑定单个 mesh
  } else {
    console.warn('[ThreeViewport] Box mesh not found:', selectedId);
    transformCtx.attach(null);
  }
  return;
}
```

**修复要点**:
1. 使用 `Array.find()` 在 `boxGroup.children` 中查找目标 mesh
2. 通过 `userData.id` 匹配 `selectedId`
3. 找到后绑定单个 mesh，而非整个 group
4. 添加 fallback 错误处理（找不到时 attach(null) 并输出警告）

---

### 缺陷位置 3: [InfoPanel.tsx:76-91](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src\novel-3d\components\InfoPanel.tsx#L76-L91)

**问题类型**: 属性渲染硬编码为圆柱体  
**严重程度**: P1 (导致长方体/光源属性显示异常)  
**影响**: 即使修复缺陷 1，长方体属性也会显示错误或报错

#### ❌ 错误代码

```typescript
// 文件: c:\projects\storytree\caiode\opencode-1.4.0\packages\app\src\novel-3d\components\InfoPanel.tsx
// 行号: 76-91 (假设位置)

<Show when={cyl()}>
  <div class="space-y-2">
    {/* ❌ 硬编码为圆柱体属性 */}
    <div>
      <label class="text-xs opacity-60">Radius</label>
      <Num value={cyl().radius} onChange={v => props.store.updateCylinder(cyl().id, { radius: v })} />
    </div>
    <div>
      <label class="text-xs opacity-60">Height</label>
      <Num value={cyl().height} onChange={v => props.store.updateCylinder(cyl().id, { height: v })} />
    </div>

    <div>
      <label class="text-xs opacity-60">Position</label>
      <div class="grid grid-cols-3 gap-1">
        <Num value={cyl().position.x} ... />
        <Num value={cyl().position.y} ... />
        <Num value={cyl().position.z} ... />
      </div>
    </div>
  </div>
</Show>
```

**问题说明**:
- 属性编辑区硬编码使用 `cyl().radius`, `cyl().height`
- 当 `selected()` 返回 BoxObject 或 LightObject 时，这些属性不存在
- 导致：
  - TypeScript 编译错误（类型不匹配）
  - 运行时显示 `undefined` 或 `NaN`
  - 无法编辑长方体特有属性（width, depth）或光源属性（intensity, range, angleDeg）

#### ✅ 修复方案

```tsx
<Show when={cyl()}>
  <div class="space-y-2">
    {/* 条件渲染: 根据对象类型显示不同属性 */}

    {/* 圆柱体属性 */}
    <Show when={cyl()?.id?.startsWith('cyl-')}>
      <div>
        <label class="text-xs opacity-60">Radius</label>
        <Num value={cyl().radius} onChange={v => props.store.updateCylinder(cyl().id, { radius: v })} />
      </div>
      <div>
        <label class="text-xs opacity-60">Height</label>
        <Num value={cyl().height} onChange={v => props.store.updateCylinder(cyl().id, { height: v })} />
      </div>
    </Show>

    {/* 长方体属性 */}
    <Show when={cyl()?.id?.startsWith('box-')}>
      <div>
        <label class="text-xs opacity-60">Width</label>
        <Num value={(cyl() as any).width} onChange={v => props.store.updateBox(cyl().id, { width: v })} />
      </div>
      <div>
        <label class="text-xs opacity-60">Height</label>
        <Num value={(cyl() as any).height} onChange={v => props.store.updateBox(cyl().id, { height: v })} />
      </div>
      <div>
        <label class="text-xs opacity-60">Depth</label>
        <Num value={(cyl() as any).depth} onChange={v => props.store.updateBox(cyl().id, { depth: v })} />
      </div>
    </Show>

    {/* 光源属性 */}
    <Show when={cyl()?.id?.startsWith('light-')}>
      <div>
        <label class="text-xs opacity-60">Intensity</label>
        <Num value={(cyl() as any).intensity} onChange={v => props.store.updateLight(cyl().id, { intensity: v })} />
      </div>
      <div>
        <label class="text-xs opacity-60">Range</label>
        <Num value={(cyl() as any).range} onChange={v => props.store.updateLight(cyl().id, { range: v })} />
      </div>
    </Show>

    {/* 通用属性: Position (三种对象都有) */}
    <div>
      <label class="text-xs opacity-60">Position</label>
      <div class="grid grid-cols-3 gap-1">
        <Num label="X" value={cyl().position.x} onChange={v => updatePosition('x', v)} />
        <Num label="Y" value={cyl().position.y} onChange={v => updatePosition('y', v)} />
        <Num label="Z" value={cyl().position.z} onChange={v => updatePosition('z', v)} />
      </div>
    </div>
  </div>
</Show>
```

**修复要点**:
1. 使用 `<Show when={...}>` 条件渲染区分对象类型
2. 圆柱体显示 Radius/Height
3. 长方体显示 Width/Height/Depth
4. 光源显示 Intensity/Range/AngleDeg
5. 提取通用 `updatePosition()` 辅助函数处理坐标更新
6. 使用类型断言 `(as any)` 解决 TypeScript 类型问题（临时方案，建议后续优化类型定义）

---

## 📊 缺陷关联图

```
用户点击长方体
    ↓
store.selectAny('box-xxx')  ← selectedObjectId 更新
    ↓
Effect 2 触发 (ThreeViewport.tsx:133)
    ↓
❌ Defect 2: transformCtx.attach(boxGroup)  ← 绑定整个 group
    ↓
Effect 触发 (InfoPanel.tsx:9)
    ↓
❌ Defect 1: selected() 返回 undefined  ← 只查找 cylinders
    ↓
<Show when={selected()}> = false  ← 整个面板不渲染
    ↓
❌ Defect 3: 属性区域不显示  ← 即使渲染也会报错
    ↓
最终结果:
  - 无 Object 面板
  - 无移动/缩放按钮
  - Gizmo 绑定错误（影响所有长方体）
```

---

## 🛠️ 修复建议与优先级

### Phase 1: 立即修复（P0 - 阻塞级）

#### 任务 1: 修复 InfoPanel 查找逻辑
- **文件**: [InfoPanel.tsx](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src\novel-3d\components\InfoPanel.tsx)
- **行号**: 9-13
- **工作量**: 10 分钟
- **风险**: 低（只扩展查找范围，不影响现有圆柱体功能）
- **验证方法**: 选中长方体 → 验证 Object 面板出现

#### 任务 2: 修复 TransformControls 绑定
- **文件**: [ThreeViewport.tsx](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src\novel-3d\components\ThreeViewport\ThreeViewport.tsx)
- **行号**: 156-159
- **工作量**: 15 分钟
- **风险**: 中（需确保 boxGroup.children 查找正确）
- **验证方法**: 
  1. 添加 3 个长方体
  2. 选中其中一个
  3. 拖动 gizmo → 只有选中的移动
  4. 切换到另一个长方体 → 重复验证

### Phase 2: 本周完成（P1 - 高优先级）

#### 任务 3: 扩展 InfoPanel 属性渲染
- **文件**: [InfoPanel.tsx](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src\novel-3d\components\InfoPanel.tsx)
- **行号**: 76-91+
- **工作量**: 1-2 小时
- **风险**: 中（需处理类型兼容性）
- **验证方法**: 
  1. 选中圆柱体 → 显示 Radius/Height
  2. 选中长方体 → 显示 Width/Height/Depth
  3. 选中光源 → 显示 Intensity/Range
  4. 编辑数值 → store 正确更新

---

## 🧪 测试用例清单

### 冒烟测试（Smoke Test）

| # | 用例名称 | 步骤 | 预期结果 | 优先级 |
|---|---------|------|---------|--------|
| TC-001 | 长方体添加+选中 | 添加长方体 → 自动选中 | Object 面板显示，gizmo 绑定单个 mesh | P0 |
| TC-002 | 长方体移动 | 选中长方体 → 移动模式 → 拖动 gizmo | 仅选中长方体移动，其他不变 | P0 |
| TC-003 | 长方体缩放 | 选中长方体 → 缩放模式 → 拖动 gizmo | 仅选中长方体缩放，其他不变 | P0 |
| TC-004 | 长方体失焦 | 选中长方体 → 点击空白处 | 长方体保持可见 | P1 |
| TC-005 | 多长方体互不干扰 | 添加 3 个长方体 → 依次选中编辑 | 每次只影响当前选中的 | P0 |

### 回归测试（Regression Test）

| # | 用例名称 | 步骤 | 预期结果 | 优先级 |
|---|---------|------|---------|--------|
| TC-006 | 圆柱体功能不受影响 | 添加圆柱体 → 选中 → 移动/缩放 | 行为与修改前一致 | P0 |
| TC-007 | 光源功能不受影响 | 添加光源 → 选中 → 移动/旋转 | 行为与修改前一致 | P0 |
| TC-008 | 混合场景 | 圆柱体+长方体+光源共存 → 轮流选中 | 面板正确切换，gizmo 正确绑定 | P1 |
| TC-009 | 清空场景 | 添加多个对象 → 清空 | 所有对象移除，无残留 | P2 |
| TC-010 | 序列化兼容 | 添加长方体 → serialize → deserialize | 长方体数据完整保留 | P2 |

---

## 📁 相关文件清单

### 需要修改的文件（3个）

| 文件路径 | 修改内容 | 缺陷编号 | 工作量 |
|---------|---------|---------|--------|
| [InfoPanel.tsx](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src\novel-3d\components\InfoPanel.tsx) | 扩展 selected() 查找 + 条件属性渲染 | Defect 1, 3 | 1.5h |
| [ThreeViewport.tsx](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src\novel-3d\components\ThreeViewport\ThreeViewport.tsx) | 修正 box TransformControls 绑定 | Defect 2 | 15min |

### 参考文件（无需修改）

| 文件路径 | 用途 |
|---------|------|
| [shot-3d-store.ts](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src\novel-3d\shot-3d-store.ts) | Store 类型定义和方法（selectAny, updateBox 已实现） |
| [types.ts](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src\novel-3d\types.ts) | CylinderObject, BoxObject, LightObject 类型定义 |
| [cylinder-manager.ts](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src\novel-3d\components\ThreeViewport\cylinder-manager.ts) | boxGroup 结构和 children 管理 |
| [group-transform.ts](file:///c:/projects/storytree/caiode/opencode-1.4.0/packages/app/src\novel-3d\components\ThreeViewport\group-transform.ts) | 方阵整体操作逻辑（备用方案） |

---

## 📸 截图证据

### Bug 1 测试截图

| 截图 | 说明 | 状态 |
|------|------|------|
| [box-added.png](box-added.png) | 长方体成功添加（橙色） | ✅ 正常 |
| [box-selected.png](box-selected.png) | 长方体选中，gizmo 显示 | ✅ 正常 |
| [box-after-deselect.png](box-after-deselect.png) | 取消选中后长方体仍可见 | ✅ **Bug 未复现** |

### Bug 2 测试截图

| 截图 | 说明 | 状态 |
|------|------|------|
| [box-array-initial.png](box-array-initial.png) | 4个长方体方阵构建成功 | ✅ 正常 |
| [box-selected-for-bug2.png](box-selected-for-bug2.png) | 选中长方体但**无 Object 面板** | ❌ **Bug 已复现** |
| [cylinder-added.png](cylinder-added.png) | 对比：圆柱体选中后面板正常 | ✅ 参照基准 |

---

## 💡 架构师决策建议

### 方案 A: 最小修复（推荐用于紧急发布）

**优点**:
- 修改量小（2 个文件，~30 行代码）
- 风险低，不影响现有功能
- 快速恢复长方体基本可用性

**缺点**:
- InfoPanel 类型定义不够优雅（使用 `as any` 断言）
- 未充分利用 TypeScript 类型系统
- 后续维护成本略高

**适用场景**: 用户反馈强烈，需要 24 小时内修复

### 方案 B: 完整重构（推荐用于正式版本）

**优点**:
- 类型安全，充分利用 TypeScript
- 代码可读性和可维护性高
- 为后续功能扩展打好基础

**缺点**:
- 工作量较大（3-4 小时）
- 需要更全面的测试覆盖
- 可能引入新的回归风险

**具体实现**:
1. 定义联合类型 `type SelectedObject = CylinderObject | BoxObject | LightObject`
2. 重构 `selected()` 返回类型为 `SelectedObject | undefined`
3. 创建类型守卫函数 `isCylinder(obj)`, `isBox(obj)`, `isLight(obj)`
4. 使用泛型组件或 render prop 模式处理不同类型的属性编辑
5. 提取共享逻辑到自定义 hooks

**适用场景**: 有充足开发时间，追求代码质量

---

## 📝 补充信息

### 环境信息

- **操作系统**: Windows 11
- **浏览器**: Chrome (Trae 内置 Chromium)
- **Node.js 版本**: Bun 1.x
- **项目框架**: Solid.js + Three.js + TypeScript
- **包管理器**: pnpm workspace + bun
- **开发服务器**: Vite v7.1.4 (http://localhost:3001/)
- **后端服务**: OpenCode API (http://localhost:4096/)

### 相关 Issue / PR

- **原始需求文档**: [TabAI会话_1778926148185.md](file:///c:/projects/storytree/caiode/docs/tabbit/TabAI会话_1778926148185.md)
- **架构师决策**: [TabAI会话_1778941129297.md](file:///c:/projects/storytree/caiode/docs/tabbit/TabAI会话_1778941129297.md)
- **当前分支**: `feat/DEV-PHASE0-LIGHT-three-array-refactor`
- **相关 Commit**: `9d41cb15` (三数组重构), `xxxxxxx` (工具栏修复)

### 历史上下文

**之前的修复尝试**:
1. **cylinder-manager.ts 重构** - 分离 createCylinderMesh/createBoxMesh，update 方法接收双参数
2. **group-transform.ts 增强** - 支持 box 类型的 translate/scale
3. **ShapeToolbar.tsx 更新** - 添加清空按钮，统一字体样式

**为何未解决问题**:
- 修复集中在 **数据层**（Store 和 Manager）
- 但 **UI 层**（InfoPanel 和 ThreeViewport Effect 2）未同步更新
- 导致数据流断裂：Store 正确存储了 boxes 数组，但 UI 无法正确读取和展示

---

## ✅ 下一步行动

### 立即执行（测试工程师）

1. **确认 Bug 复现** ✅ 已完成
2. **输出本报告** ✅ 已完成
3. **通知架构师审查** ← **当前步骤**

### 架构师审查后（前端工程师）

1. **选择修复方案** (A 或 B)
2. **实施代码修改** (预计 2-4 小时)
3. **运行 TypeScript 编译** (npm run typecheck)
4. **执行冒烟测试** (TC-001 ~ TC-005)
5. **执行回归测试** (TC-006 ~ TC-010)
6. **提交 Git** (feat 分支)
7. **创建 PR** 并请求 Code Review

### 发布前检查

- [ ] 所有测试用例通过
- [ ] TypeScript 编译 0 错误
- [ ] 控制台无警告或错误
- [ ] 性能无明显下降
- [ ] 文档更新（如涉及 API 变更）

---

## 📞 联系方式

**报告人**: GLM-5V-Turbo (前端工程师)
**邮箱**: (通过 Trae IDE 内部通信)
**Slack**: (如有)
**紧急联系**: 请在 Trae IDE 中 @mention 或回复本报告

---

**报告完成时间**: 2026-05-16 23:45:00  
**报告版本**: v1.0 (初始版)  
**审核状态**: ⏳ 待架构师审查  
**预计修复时间**: 2026-05-17 (24小时内)

---

*附录: 本报告基于 Browser Use Agent 自动化测试生成，所有截图和日志均已保存至工作目录*
