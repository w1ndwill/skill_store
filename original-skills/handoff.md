# 流程接力与工作交接技能指南 (Handoff & Context Resume Skill Guide)

本技能指南旨在解决 AI 助手在大文件读写、多轮对话后因**上下文饱和（Context Saturation）**导致的记忆衰退问题，或者在**切换不同的 AI 助手/开启新会话**时，如何实现无缝的“无损状态恢复”与“流程接力”。

---

## 1. 核心流程：交接 (Handoff) 与 接力 (Resume)

当出现以下情况时，必须触发此技能：
1.  **主动发起**：用户或 AI 助手发现当前会话上下文过长（响应变慢、记忆出现偏差），需要开启新会话。
2.  **阶段完成/挂起**：当前工作阶段结束，需等待用户后续反馈，或准备交接给另一个 AI 助手继续。
3.  **用户要求**：用户发出“生成交接单 / 记录当前状态以便切换”等指令。

```
[当前会话] ──> 生成 docs/plans/handoff.md ──> [开启新会话/切换AI] ──> 读取 handoff.md ──> [完美接力恢复]
```

---

## 2. 导出步骤：生成交接单 (Generating Handoff)

AI 助手应收集当前环境与逻辑的所有核心元数据，并在 `docs/plans/handoff.md` 中生成一份极致精简、高信息密度的结构化文档。

### 交接单标准模板

```markdown
# 🚀 Superpowers 工作交接单 (Handoff)

*   **生成时间**：[YYYY-MM-DD HH:MM:SS]
*   **分支状态**：`git branch` | `git status` (已提交/未提交修改清单)
*   **当前项目**：[项目名称/绝对路径]

---

## 🎯 核心目标 (Current Goal)
*   [描述我们目前正在解决的大目标，如：为 mygoods 数据库添加用户登录鉴权功能]

---

## 📊 进度审计 (Progress Audit)

### 1. ✅ 已完成的工作 (Completed)
*   [列出已编写、已测试并通过验证的代码文件和功能模块]
*   [例如：已设计 users 表结构，并运行 python server.py 测试通过]

### 2. ⏳ 正在进行中 (In Progress)
*   [标记当前中断前正在修改的具体文件、行数和函数]
*   [例如：正在 app.js 第 120 行编写 login 接口的 JWT 签名逻辑]

### 3. 📅 待办任务清单 (Remaining Tasks)
*   [列出 docs/plans/task.md 中尚未完成的步骤]

---

## 💡 关键决策与设计思路 (Key Decisions & Rationale)
*   **技术选型原因**：[如：使用 JWT 替代 Session，因为这样可以保持 server 端的 stateless]
*   **数据库变更**：[如：在 mygoods.db 的 users 表中添加了 email 字段，唯一索引]
*   **关键文件拓扑**：
    *   [API层]：`server.py`
    *   [前端路由]：`app.js`

---

## ⚠️ 踩坑记录与警告 (Gotchas & Warnings)
*   [列出已解决的棘手 Bug 或系统环境限制，防止接力的 AI 重道覆辙]
*   [如：注意！Python 3.14 下部分第三方库不兼容，已改为用标准库实现]

---

## ➡️ 接棒者第一步指令 (Next Steps for Incoming AI)
1.  请优先读取本文件 `docs/plans/handoff.md`。
2.  接着阅读当前最新的 `docs/plans/task.md` 进度。
3.  继续执行 `app.js` 的 `login` 接口联调，当前测试脚本为 `test_auth.py`。
```

---

## 3. 导入步骤：接力恢复 (Context Resume)

当一个新的 AI 助手进入工作区，或开启了新会话：

1.  **检测交接单**：AI 助手应当在启动时主动扫描 `docs/plans/` 下是否存在 `handoff.md`。
2.  **无损载入**：如果存在，**必须优先阅读**该文件，提取最新的进度元数据 and 决策背景，无需让用户重新叙述。
3.  **接棒执行**：直接从 `handoff.md` 中指定的 `接棒者第一步指令 (Next Steps)` 开始，将任务列表 `task.md` 中对应的状态标记为 `[/]`，无缝继续编写代码！
4.  **归档/清理**：当前大任务彻底完成并验证通过后，将 `handoff.md` 删除或归档为 `handoff.completed.md`，保持工作区干净。
