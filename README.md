# SkillHub

[English](README_EN.md) · [使用说明书](docs/SkillHub使用说明书.md) · [下载最新版](https://github.com/w1ndwill/skill_store/releases/latest) · [MIT License](LICENSE)

SkillHub 是一个本地运行的 Windows Skill 工作台，用来集中管理 AI 开发规约、组织多 Skill 集合，并为不同项目维护可预览、可回退的 Skill 配置。当前版本：**3.2.0**。

![SkillHub 中文技能库界面](docs/screenshots/zh/skill-library.png)

*截图来自 v3.2.0 便携版；技能名称、项目路径和启用状态取自本地演示环境。*

## Skill 管理与项目同步

### 项目独立配置

![中文项目 Skill 配置](docs/screenshots/zh/project-configuration.png)

每个项目独立选择需要的 Skill。界面同时展示来源说明、分类、同步状态和启用开关；底部操作栏汇总待应用变化，并在写入前打开同步预览。

同步产物位于：

```text
<项目目录>\.agent\skills\
<项目目录>\AGENTS.md
```

### 多 Skill 集合

![中文 Skill 集合管理](docs/screenshots/zh/collection-manager.png)

仓库级导入会先扫描集合边界。集合可以整体停用，子 Skill 仍可单独查看和选择；关闭集合不会删除源文件或丢失子项选择。

### Skill 文档详情

![中文 Skill 文档详情](docs/screenshots/zh/skill-detail.png)

详情抽屉展示来源、分类、标签、Frontmatter 和渲染后的 Markdown。编辑操作显式进入源文件，项目专属 Skill 保持只读。

## 主要功能

| 能力 | 当前行为 |
| --- | --- |
| 全局技能库 | 管理 Markdown 规则、标准 `SKILL.md` 文件夹和 Skill 集合 |
| 导入体检 | 识别重复、同名冲突、风险条目、路径穿越和符号链接 |
| 双语说明 | 根据界面语言使用展示缓存，不改写第三方 `SKILL.md` |
| 项目同步 | 先预览新增、更新、移除和冲突，再执行写入 |
| 同步撤销 | 项目文件未被继续修改时，可安全撤销最近一次同步 |
| SkillOps Agent | 可选的工具化辅助模块，用于检索、检查、预览和维护 Skill |
| 单实例运行 | 第二次启动唤醒已有窗口，不创建第二个应用窗口 |
| 本地数据 | Skill、配置、会话、Agent 记忆和备份均保存在本机 |

## 可选 AI 辅助

SkillOps Agent 是 SkillHub 中的辅助模块，用于在现有技能库和项目同步流程上完成 Skill 检索、检查、安装预览和维护。它不取代手动导入、编辑、分类或同步功能，也不提供任意终端访问。

![SkillOps Agent 中文工作区](docs/screenshots/zh/skillops-agent.png)

模型只能调用预先定义的有边界工具。只读操作可以直接完成；安装、保存和同步等写入操作仍需生成预览并等待用户批准。任务记录和结构化记忆保存在本机，可在设置中关闭或清理。

## 快速开始

1. 从 [GitHub Releases](https://github.com/w1ndwill/skill_store/releases/latest) 下载 `SkillHub.exe`。
2. 启动程序并选择全局 Skill 库目录。
3. 导入 `.md`、`.zip`、标准 Skill 文件夹或 Skill 集合。
4. 添加目标项目并选择需要的 Skill。
5. 查看同步预览，确认后写入项目。
6. 可选：需要辅助检查、安装或维护 Skill 时，打开 SkillOps Agent。

程序为便携版，无需安装。首次启动时默认创建：

```text
%LOCALAPPDATA%\SkillHub\skills
```

## 从源码运行

```powershell
git clone https://github.com/w1ndwill/skill_store.git
cd skill_store
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python main.py
```

构建便携版：

```powershell
python -m pip install pyinstaller
pyinstaller --clean --noconfirm SkillHub.spec
```

## 仓库结构

```text
├── agent_runtime.py         # Agent 循环、工具协议、审批、记忆与运行记录
├── main.py                  # 后端、文件操作、同步与 Agent 工具适配
├── static/                  # PyWebView 前端、交互与本地资源
├── docs/
│   ├── SkillHub使用说明书.md
│   └── screenshots/
│       ├── zh/              # 中文界面截图
│       └── en/              # 英文界面截图
├── SkillHub.spec            # PyInstaller 构建入口
└── requirements.txt
```

## 安全与隐私

- API Key 只保存在本地配置中，界面仅显示脱敏状态。
- Agent 记忆和运行记录不保存 API Key、完整敏感文件或隐藏思维链。
- 同名不同内容必须明确选择替换、保留两个版本或取消。
- 导入过程不会执行仓库中的 Hook、MCP 服务、安装脚本或下载代码。
- 项目中不受 SkillHub 管理的同名文件不会被静默覆盖。
- Release 不包含个人 Skill、本地配置、测试、会话、记忆或运行日志。

## 技术栈

- Python + [pywebview](https://pywebview.flowrl.com/)
- 系统 WebView2
- HTML、CSS、JavaScript
- 可选的 OpenAI 兼容接口与 DuckDuckGo 联网搜索

## 开源协议

[MIT](LICENSE)
