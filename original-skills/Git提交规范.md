---
title: Git提交规范
emoji: 🌿
tags: Git, 协作, 基础
description: 遵循 Angular 规范的 Git Commit 消息标准，让项目的版本演进历史清晰、规范且可追溯。
---

# 🌿 Git 提交规范 (Commit Guideline)

标准的 Commit Message 可以帮助团队快速定位线上问题、生成 Changelog。本项目采用 Angular 社区的 Commit 规范。

## ✍️ 1. Commit 格式
每次提交的消息应包含 **Header**、**Body** 和 **Footer** (通常只需 Header)：
```text
<type>(<scope>): <subject>
```

### 核心类型 (Type)
- `feat`: 新增功能 (Feature)
- `fix`: 修复 Bug (Bug Fix)
- `docs`: 文档变更 (Documentation)
- `style`: 格式化、不影响代码含义的变更 (如分号、空格)
- `refactor`: 重构代码 (既非新增功能也非修复 Bug)
- `perf`: 提高性能的变更 (Performance)
- `test`: 添加或修改测试用例
- `chore`: 构建过程或辅助工具的变动 (如依赖库升级)

## 💡 2. 编写规范与示例
- **简明扼要**: Header 长度控制在 50 个字符以内。
- **动词开头**: 建议使用祈使句或动词，例如 `feat: 新增微信登录功能` 而不是 `完成了微信登录接口的编写`。
- **关联 Issue**: 如果本次提交解决了某个 Issue，可以在 Body 中注明 `Closes #123`。

## 🛡️ 3. 项目仓库卫生规范 (Repository Hygiene)
- **拒绝敏感配置泄漏**：禁止将本地私有配置文件（如 `config.json`、`projects.json`）、第三方依赖文件夹（如 `.venv/`）以及本地编译好的大型二进制包（如 `*.exe`）提交到 GitHub 仓库。必须通过 `.gitignore` 规则进行严格拦截。
- **大文件托管原则**：对于编译生成的 Standalone EXE 执行程序，应以 **GitHub Releases** 附件形式发布与分发，严禁直接上传至代码树中，以保持 Git 树的极致纯净与高速克隆。

## 🤖 4. 去除“AI味”与人类专业语调规范 (Human-Centric Communication)
AI 工具在协助开发、编写文档、撰写 Commit Message 或撰写 Markdown 文件时，极易产生机械的翻译腔、浮夸的形容词与机械套话。我们在协作时必须遵循以下红线规约：
- **拒绝夸张与虚浮的形容词**：禁止使用类似“太赞了！”、“极致完美”、“100%无瑕”、“完美打磨”、“殿堂级”、“微米级”、“史诗级”等虚浮的主观表述。
- **客观干练的专业语调**：所有文档、提交记录及注释必须使用中立、客观、严谨、符合人类高级软件工程师手写体直击要害的语言风格。多用清晰的技术列表和简短事实，少用情感抒发。
- **严禁 Commit 机器套话**：Commit Message Header 必须字字精准反映物理变动事实，禁止包含无实质意义的 AI 自动化机械前缀或夸张修饰，例如 `fix: 修复 dialog modal 二次决议 bug 导致删除无效`，而不是 `fix: 殿堂级修复完美删除事件完美决议逻辑`。
