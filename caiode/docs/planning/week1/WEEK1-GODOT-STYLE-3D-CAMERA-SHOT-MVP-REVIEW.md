# Week1 Godot 风格 3D Camera Shot MVP 方案评审报告

> **文档版本**: v1.0
> **评审日期**: 2026-05-08
> **评审人**: 前端工程师 / 技术架构评审
> **状态**: ✅ 评审通过，建议采纳并进入开发

---

## 一、评审结论

| 评审项 | 结果 | 说明 |
|--------|:----:|------|
| 方案整体可行性 | ✅ 通过 | 技术路线清晰，Three.js + Solid.js 组合合理 |
| 需求覆盖度 | ✅ 通过 | 完整覆盖用户提出的 3D 视角、旋转、平移、方位、相机需求 |
| 技术选型合理性 | ✅ 通过 | Three.js 是 3D 视口的标准方案，OrbitControls/TransformControls 成熟稳定 |
| 与现有架构兼容性 | ✅ 通过 | 作为独立 feature 模块，不影响 OpenCode 现有页面 |
| Mock 模式合规性 | ✅ 通过 | 明确不接真实 LLM/图像接口，符合项目约束 |
| 文件行数合规性 | ⚠️ 关注 | ThreeViewport.tsx 可能超过 500 行，需提前规划拆分 |

**综合结论**: **建议采纳方案，进入开发阶段。**

---

## 二、方案优势

### 1. 技术选型正确

| 需求 | 方案技术 | 评价 |
|------|---------|------|
| 3D 透视视角 | Three.js PerspectiveCamera | 行业标准，文档完善 |
| 旋转/平移/缩放 | OrbitControls | 官方示例控制方案，社区验证 |
| 物体移动 | TransformControls | 与 OrbitControls 配合成熟 |
| 地面网格 | GridHelper | 内置工具，零成本 |
| 方位轴 | AxesHelper | 内置工具，零成本 |
| 圆柱体 | CylinderGeometry | 基础几何体，性能优秀 |
| 截图导出 | WebGLRenderer.toDataURL | 原生支持，无额外依赖 |

### 2. 架构设计合理

```
Solid.js (UI + State) ↔ Three.js (3D Viewport)
```

- **职责分离清晰**: Solid 负责 UI 面板和状态管理，Three.js 负责 3D 渲染
- **数据流明确**: Store 保存纯数据，Three.js 对象用 Map 映射管理
- **事件同步机制**: TransformControls 移动后同步回 Store，实现双向绑定

### 3. 功能范围控制得当

**必须做** vs **暂缓做** 的划分合理：
- ✅ 保留了核心 3D 构图能力（相机、视角、物体、导出）
- ❌ 排除了游戏引擎复杂度（PBR、物理、动画、模型导入）

### 4. 相机预设设计专业

5 种预设覆盖了常用构图角度：
- Godot Perspective（标准透视）
- Low Angle Left（低机位左前方）
- Front Wide（正面广角）
- Top Down（俯视）
- Left Side（左侧视图）

### 5. Prompt Parser 设计实用

关键词到参数的映射规则清晰：
- `5x4` → rows=5, cols=4
- `低机位` → camera.y 较低
- `广角` → fov=65~70
- `左前方` → x 为负，z 为正
- `中心更高` → hero height = base × 2
- `发光` → emissive 材质

---

## 三、风险与建议

### 风险 1: ThreeViewport 文件可能超过 500 行

**风险等级**: 中

**分析**:
- ThreeViewport 需要包含：Scene、Camera、Renderer、Controls、Lights、Grid、Axes、Raycaster、渲染循环、resize 处理
- 预计代码量 400~600 行

**建议**:
```
ThreeViewport/
├── index.tsx          # 主组件 (150行)
├── scene-setup.ts     # Scene/Camera/Renderer 初始化 (100行)
├── controls-setup.ts  # OrbitControls + TransformControls (100行)
├── cylinder-manager.ts # 圆柱体创建/更新/删除 (150行)
├── raycaster-handler.ts # 点击选中逻辑 (80行)
└── render-loop.ts     # requestAnimationFrame 循环 (50行)
```

### 风险 2: Three.js 包体积

**风险等级**: 低

**分析**:
- three 包体积约 600KB (gzip)
- 但本项目为桌面应用 (Tauri)，非 Web 页面，体积敏感度较低

**建议**:
- 使用 `vite` 的 tree-shaking 自动剔除未使用模块
- 如需进一步优化，可使用 `three/minifiers` 或自定义构建

### 风险 3: WebGL 上下文丢失

**风险等级**: 低

**分析**:
- 长时间运行或切换标签页可能导致 WebGL 上下文丢失
- 需要监听 `webglcontextlost` 事件

**建议**:
```typescript
renderer.domElement.addEventListener('webglcontextlost', (event) => {
  event.preventDefault();
  // 暂停渲染，尝试恢复
});

renderer.domElement.addEventListener('webglcontextrestored', () => {
  // 重新初始化场景
});
```

### 风险 4: 与 OpenCode 现有路由的集成

**风险等级**: 低

**分析**:
- 方案建议路径 `packages/app/src/features/camera-shot-3d/`
- 但当前项目已有 `novel/` 和 `novel-canvas/` 模块

**建议**:
- 统一使用 `packages/app/src/novel-3d/` 或 `packages/app/src/camera-shot-3d/`
- 在 `app.tsx` 添加 `/shot-3d` 路由
- 在 Home 页面添加入口按钮

### 风险 5: Mock Prompt Parser 的鲁棒性

**风险等级**: 中

**分析**:
- 当前 Parser 基于关键词匹配，可能无法处理复杂描述
- 例如："左前方偏下一点" 如何解析？

**建议**:
- Phase 1: 使用简单的关键词匹配（当前方案）
- Phase 2: 引入规则引擎或轻量 NLP
- 保留手动调整面板作为兜底

---

## 四、与现有方案的对比

| 维度 | SVG 2.5D 方案 (已废弃) | Three.js 3D 方案 (建议采纳) |
|------|----------------------|---------------------------|
| 3D 视角 | ❌ 伪 3D | ✅ 真 3D 透视 |
| 旋转视角 | ❌ 有限 | ✅ 自由 Orbit |
| 平移视角 | ❌ 有限 | ✅ 自由 Pan |
| 缩放视角 | ❌ 有限 | ✅ 自由 Zoom |
| 方位轴 | ❌ 无 | ✅ AxesHelper |
| 相机参数 | ❌ 无 | ✅ Position/Target/FOV |
| 物体移动 | ❌ 无 | ✅ TransformControls |
| 截图导出 | ❌ 困难 | ✅ 原生支持 |
| 包体积 | ✅ 小 (SVG) | ⚠️ 中 (Three.js ~600KB) |
| 学习成本 | ✅ 低 | ⚠️ 中 |
| 实现复杂度 | ✅ 低 | ⚠️ 中 |

**结论**: Three.js 方案在核心能力上全面优于 SVG 方案，包体积和学习成本的增加在可接受范围内。

---

## 五、开发建议

### 5.1 开发顺序

```
Phase 1: 基础设施
  ├── 创建目录结构
  ├── 安装 three 依赖
  ├── 类型定义 (types.ts)
  └── Mock 数据 (mock-scene.ts)

Phase 2: 3D 视口核心
  ├── Scene + Camera + Renderer 初始化
  ├── OrbitControls 集成
  ├── GridHelper + AxesHelper
  └── 渲染循环

Phase 3: 圆柱体方阵
  ├── CylinderGeometry 生成
  ├── 方阵排列算法
  ├── Hero 圆柱（发光）
  └── Raycaster 点击选中

Phase 4: 交互功能
  ├── TransformControls 移动
  ├── 选中高亮
  └── Store 同步

Phase 5: UI 面板
  ├── CameraControlPanel
  ├── ObjectInspectorPanel
  ├── PromptInputPanel
  └── PromptPreviewPanel

Phase 6: 导出功能
  ├── PNG 截图导出
  └── Prompt 复制

Phase 7: 集成与测试
  ├── 路由集成
  ├── 类型检查
  ├── 构建验证
  └── UI 自动化测试
```

### 5.2 文件行数控制

| 文件 | 预估行数 | 是否合规 |
|------|:-------:|:-------:|
| types.ts | 80 | ✅ |
| camera-presets.ts | 60 | ✅ |
| cylinder-array.ts | 120 | ✅ |
| shot-3d-store.ts | 150 | ✅ |
| ThreeViewport/index.tsx | 150 | ✅ |
| ThreeViewport/scene-setup.ts | 100 | ✅ |
| ThreeViewport/controls-setup.ts | 100 | ✅ |
| ThreeViewport/cylinder-manager.ts | 150 | ✅ |
| ThreeViewport/raycaster-handler.ts | 80 | ✅ |
| ThreeViewport/render-loop.ts | 50 | ✅ |
| CameraControlPanel.tsx | 200 | ✅ |
| ObjectInspectorPanel.tsx | 180 | ✅ |
| PromptInputPanel.tsx | 120 | ✅ |
| PromptPreviewPanel.tsx | 100 | ✅ |
| CameraShot3DPage.tsx | 120 | ✅ |
| export-current-view.ts | 50 | ✅ |
| mock-prompt-parser.ts | 80 | ✅ |

### 5.3 依赖安装

```bash
# 进入 app 目录
cd packages/app

# 安装 three
bun add three

# 安装类型定义
bun add -d @types/three
```

### 5.4 验收标准检查清单

| # | 验收项 | 优先级 | 测试方式 |
|---|--------|:------:|---------|
| 1 | 能打开 CameraShot3DPage | P0 | 浏览器访问 |
| 2 | 能看到 3D 视口 | P0 | 视觉检查 |
| 3 | 能看到地面网格 | P0 | 视觉检查 |
| 4 | 能看到方位轴 | P0 | 视觉检查 |
| 5 | 能看到 5x4 圆柱体方阵 | P0 | 视觉检查 |
| 6 | 中心圆柱更高并发光 | P0 | 视觉检查 |
| 7 | 鼠标可以旋转视角 | P0 | 交互测试 |
| 8 | 鼠标可以平移视角 | P0 | 交互测试 |
| 9 | 滚轮可以缩放视角 | P0 | 交互测试 |
| 10 | 可以点击选中圆柱体 | P0 | 交互测试 |
| 11 | 可以移动圆柱体 | P0 | 交互测试 |
| 12 | 移动后 Inspector 位置同步 | P0 | 数据验证 |
| 13 | 可以修改相机 Position | P1 | 表单测试 |
| 14 | 可以修改相机 Target | P1 | 表单测试 |
| 15 | 可以修改 FOV | P1 | 表单测试 |
| 16 | 可以应用相机预设 | P1 | 按钮测试 |
| 17 | 可以导出当前视角 PNG | P1 | 文件检查 |
| 18 | 可以复制图像生成 Prompt | P1 | 剪贴板检查 |
| 19 | 不接真实 LLM | P0 | 代码审查 |
| 20 | 不接真实图像生成接口 | P0 | 代码审查 |
| 21 | typecheck 通过 | P0 | 命令执行 |
| 22 | build 通过 | P0 | 命令执行 |

---

## 六、评审意见总结

### 6.1 建议采纳的结论

1. **技术路线正确**: Three.js 是实现 3D 构图视口的标准方案，比 SVG 更适合当前需求
2. **功能范围合理**: 保留了核心 3D 构图能力，排除了游戏引擎复杂度
3. **架构设计清晰**: Solid.js 负责 UI，Three.js 负责 3D，职责分离明确
4. **与项目约束兼容**: Mock 模式、不接真实接口、不影响现有页面

### 6.2 建议的改进点

1. **文件拆分**: ThreeViewport 必须拆分为多个子文件，避免超过 500 行
2. **WebGL 容错**: 添加 context lost/restored 事件处理
3. **Prompt Parser**: Phase 1 使用简单关键词匹配，后续迭代增强
4. **路径统一**: 使用 `novel-3d/` 或 `camera-shot-3d/` 作为模块名

### 6.3 下一步行动

1. 创建开发任务分解文档
2. 安装 three 依赖
3. 按 Phase 1~7 顺序开发
4. 每完成一个 Phase 进行测试验证
5. 最终提交评审报告

---

## 七、签名

**评审人**: 前端工程师 (Kimi)
**评审日期**: 2026-05-08
**评审结论**: ✅ 建议采纳
**当前积分**: 30/100

---

*[READY_FOR_REVIEW]*
