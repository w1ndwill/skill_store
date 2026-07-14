# SkillHub

[English](README.md) · [下载程序](https://github.com/w1ndwill/skill_store/releases) · [更新日志](CHANGELOG.md)

SkillHub 是一个本地运行的 Windows Skill 工作台：集中管理可复用的 AI 开发规约，为不同项目选择所需 Skill，并在写入项目前预览实际变化。

![SkillHub 技能库](docs/screenshots/skill-library.png)

当前稳定版本为 **3.0.2**。截图中的新版界面位于当前开发分支，将随后续版本发布。

## 它解决什么问题

- **统一管理技能库** — Markdown 规则、标准 `SKILL.md` 文件夹和多 Skill 集合都能放进同一个可搜索的本地库。
- **按项目配置** — 每个项目只启用自己需要的 Skill；同步前先看新增、更新、删除与冲突，再决定是否写入 `.agent/skills/`。
- **集合开关语义明确** — 父集合停用后，即使保留了子 Skill 的选中状态，子 Skill 也不会生效；重新启用父集合时才恢复原选择。
- **AI 改写可审阅** — 可以接入兼容 OpenAI 接口的模型生成或优化 Skill，所有改写先进入待确认状态，不会直接覆盖原文。
- **同步可回退** — 不覆盖项目中未由 SkillHub 管理的同名文件，每次同步保留事务记录和备份，并支持撤销最近一次同步。
- **私人 Skill 与程序分离** — 新安装从空白技能库开始，个人规则、配置、会话和备份都保存在源码仓库之外。

## 使用流程

1. 导入 Markdown、ZIP、标准 Skill 文件夹，或包含 `skills/*/SKILL.md` 的集合。
2. 检查补齐后的元数据和可选的 AI 优化差异。
3. 添加目标项目，启用这个项目真正需要的 Skill。
4. 打开同步预览，确认变化后写入项目。
5. 后续继续维护源 Skill；列表会显示项目中的版本是否最新、被修改或尚未安装。

## 界面预览

### 项目配置与同步

![项目 Skill 配置](docs/screenshots/project-configuration.png)

筛选、搜索和表头保持可见，Skill 列表独立滚动；状态、开关、集合入口和行操作使用固定列位，不会因为某一行缺少按钮而错位。

### AI 技能顾问

![AI 技能顾问](docs/screenshots/ai-assistant.png)

可以从具体任务开始，让 AI 生成开发规约、检查现有 Skill，或把一份文档整理成可复用规则。AI 是可选能力，不配置 API Key 也能完成导入、管理和同步。

### 集合与子 Skill

![集合与子 Skill 管理](docs/screenshots/collection-manager.png)

停用父集合不会删除文件，也不会清空子 Skill 选择；但该集合在项目同步和生成的 `AGENTS.md` 中都视为未启用。

### Markdown 详情

![Skill 文档详情](docs/screenshots/skill-detail.png)

不离开列表即可查看元数据和渲染后的 Markdown。源码编辑仍需明确触发；误删的 Skill 可以从应用内回收区恢复。

## 快速开始

前往 [GitHub Releases](https://github.com/w1ndwill/skill_store/releases) 下载 `SkillHub.exe`，直接运行即可，无需安装。

第一次启动时，程序会在 `%LOCALAPPDATA%\SkillHub\skills` 创建可写技能库。导入的原始文件归档在 `.skill-hub/imports/upstream/`，通过检查的副本才进入活动库。运行配置、聊天记录、私人 Skill 和同步备份不会进入公开仓库。

## 从源码运行

```powershell
git clone https://github.com/w1ndwill/skill_store.git
cd skill_store
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python main.py
```

打包便携版：

```powershell
python -m pip install pyinstaller
pyinstaller SkillHub.spec
```

## 仓库结构

```text
├── main.py                  # 后端、文件操作、同步与 AI 桥接
├── static/
│   ├── index.html           # 应用结构
│   ├── index.css            # 响应式桌面界面
│   ├── app.js               # 前端状态与交互
│   ├── lucide.min.js        # 本地图标库
│   └── marked.min.js        # 本地 Markdown 渲染器
├── docs/
│   ├── screenshots/         # README 产品截图
│   └── RELEASE_3.0.md       # 3.0 版本说明
├── SkillHub.spec            # PyInstaller 构建入口
├── app.ico                  # 应用图标
└── requirements.txt
```

## 隐私与安全边界

- API Key 只写入本地运行配置，界面中仅显示脱敏提示。
- SkillHub 不执行导入仓库中的 hooks、MCP 服务或安装脚本。
- ZIP 路径穿越、符号链接来源、目标路径冲突，以及预览后被替换的文件都会被拒绝。
- `build/`、`dist/`、缓存、本地配置、私人 Skill 和私有测试均被 Git 忽略；发布程序单独上传到 Release。

## 技术栈

- Python + [pywebview](https://pywebview.flowrl.com/)，使用系统 WebView2
- 原生 HTML、CSS、JavaScript，前端依赖随程序打包
- 可选的 OpenAI 兼容聊天接口与 DuckDuckGo 联网搜索

## 开源协议

[MIT](LICENSE)
