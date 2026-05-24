# 🤖 项目 AI 开发规约与技能索引 (AGENTS.md)

本项目的 AI 协同规则已由 **AI Skill Hub Manager** 原生桌面客户端装载。这些规约文件被存放在项目本地目录中，可用于为 GitHub Copilot、Cursor、Windsurf 以及本地 Agent 架构等 AI 工具提供统一的架构设计规范、开发准则与质量红线。

## 🎯 当前项目已启用的开发技能与规约

| 技能名称 | 分类标签 | 技能简述 | 本地关联链接 |
| :--- | :--- | :--- | :--- |
| 📄 流程接力与工作交接技能指南 (Handoff & Context Resume Skill Guide) | `常规` | 本技能指南旨在解决 AI 助手在大文件读写、多轮对话后因**上下文饱和（Context Saturation）**导致的记忆衰退问题，或者在**切换不同的 AI 助手/开启新会话**时，如何实现无缝的“无损状态恢复”与“流程接力”。 | [handoff.md](.agent/skills/handoff.md) |
| ⚡ 前端性能优化规范 | `前端, 优化, 性能` | 涵盖图片延迟加载、虚拟列表、代码分割、静态资源缓存以及打包体积压缩的本地开发与交付指南。 | [前端性能优化规范.md](.agent/skills/前端性能优化规范.md) |
| 📄 前端性能优化技能指南 (Frontend Performance Optimization Skill Guide) | `常规` | 本技能指南旨在指导 AI 助手或开发人员如何对现代 Web 应用进行全方位的前端性能优化。目标是显著提升用户体验，改善 Lighthouse 评分，并优化 **Core Web Vitals（核心网页指标）**。 | [frontend_optimization.md](.agent/skills/frontend_optimization.md) |
| 📄 流程优化技能指南 (Process Optimization Skill Guide) | `常规` | 本技能指南旨在指导 AI 助手或开发人员如何系统性地分析、诊断并优化软件开发和系统运行中的各项流程。涵盖**开发工作流（Development Workflow）**、**构建与部署流水线（CI/CD & Build Pipeline）**以及**代码与算法执行效率（Runtime Execution & Performance）**三个核心层面的优化。 | [process_optimization.md](.agent/skills/process_optimization.md) |

---
*💡 提示：本索引文件由 AI Skill Hub Manager 桌面客户端自动生成与维护，装载状态与全局技能库实时对齐。*
