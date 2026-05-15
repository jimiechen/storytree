# V3 迭代学习与经验总结 (Learnings)

本文件用于记录在 V3 迭代 (dreamweaver-v3-advanced-narrative) 中遇到的技术挑战、架构决策以及性能调优经验。

## 1. Harness 工程实践
- *记录 Prompt Cache 和 Compaction 的实现细节及踩坑经验...*

## 2. 向量检索与 RAG
- *记录 `pgvector` 或其他向量引擎的接入体验、Embeddings 模型的选择与效果对比...*

## 3. 分支系统数据模型设计
- *记录 `Branch`, `Commit`, `Snapshot` 等版本控制相关 Prisma schema 设计的心路历程及性能优化 (如全量快照 vs 增量 Diff)...*

## 4. E2E 测试挑战
- *记录在引入多分支后，Playwright 测试用例重构中的挑战与解决方案...*