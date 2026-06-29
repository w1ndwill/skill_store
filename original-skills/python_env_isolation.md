---
title: Python 虚拟环境与依赖管理规范
emoji: 🐍
tags: 常规, Python, 环境隔离
description: 指导 AI 助手在开发 Python 项目时自动创建和使用本地专属虚拟环境，杜绝全局环境污染与依赖冲突。
---

# 🐍 Python 虚拟环境与依赖管理规范

本规范旨在确保所有 Python 相关的开发项目均采用物理隔离的专属虚拟环境（Virtual Environment），从源头上杜绝全局 Python 环境污染和不同项目间的依赖冲突（串库）问题。

## 🎯 核心开发准则

### 1. 自动初始化专属环境 (.venv)
- **绝对红线**：禁止直接在系统全局 Python 环境下安装任何第三方库。
- **自动检测与创建**：在执行任何依赖安装或运行命令前，AI 助手必须首先检查当前项目根目录下是否存在 `.venv` 目录。
- **初始化指令**：若不存在，必须在项目根目录下物理执行以下命令创建虚拟环境：
  ```powershell
  python -m venv .venv
  ```

### 2. 强力执行 Git 忽略配置
- **防污染提交**：必须立即检查并确保项目根目录下的 `.gitignore` 文件中包含 `.venv/`。
- **禁止提交环境**：绝对禁止将虚拟环境中的任何二进制文件、库文件或脚本提交至 Git 仓库。

### 3. 安全激活与依赖安装
- **隔离激活**：在运行 Python 脚本或执行 pip 安装前，必须使用当前项目的虚拟环境路径进行操作：
  - **Windows (PowerShell)**: `.\.venv\Scripts\Activate.ps1`
  - **Windows (CMD)**: `.\.venv\Scripts\activate.bat`
  - **Linux/macOS**: `source .venv/bin/activate`
- **精准依赖写入**：所有的库安装必须在激活后的虚拟环境中运行，或者直接调用虚拟环境内的 pip 可执行文件（如 `.\.venv\Scripts\pip.exe install <package>`）。
- **同步更新依赖清单**：安装完任何新依赖后，须同步更新项目根目录下的 `requirements.txt`：
  ```bash
  pip freeze > requirements.txt
  ```

## 🛠️ AI 协同接力指引
- **环境审计**：当 AI 助手接手一个新的 Python 项目时，第一步必须检查 `.venv` 状态与 `.gitignore` 规则。
- **一键恢复**：若项目已包含 `requirements.txt` 但未初始化环境，AI 自动执行：
  ```powershell
  python -m venv .venv
  .\.venv\Scripts\pip.exe install -r requirements.txt
  ```
