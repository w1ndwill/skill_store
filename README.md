# SkillHub

[English](README_EN.md) · [下载 SkillHub](https://github.com/w1ndwill/skill_store/releases) · [MIT License](LICENSE)

SkillHub 是一个本地运行的 Windows Skill 工作台，用来集中管理 AI 开发规约，并为每个项目维护清晰、可预览、可回退的 Skill 配置。

![SkillHub 技能库](docs/screenshots/skill-library.png)

当前版本：**3.1.0**

## 主要功能

- **统一技能库**：管理 Markdown 规则、标准 `SKILL.md` 文件夹，以及包含多个子 Skill 的集合。
- **项目独立配置**：每个项目单独选择所需 Skill，不同项目之间互不影响。
- **同步预览**：写入前查看新增、更新、移除和冲突，确认后再同步到 `.agent/skills/`。
- **集合管理**：集合总开关控制整个集合是否参与项目，子开关用于选择集合中的具体 Skill。
- **文档查看与编辑**：直接查看 Skill 元数据和渲染后的 Markdown，并从界面进入源码编辑。
- **AI 技能顾问**：使用兼容 OpenAI 接口的模型生成规约、检查 Skill 或整理已有文档。
- **本地数据管理**：技能库、项目配置、聊天记录和同步备份保存在本机。
- **同步撤销**：保留最近一次同步记录，可在项目文件未被继续修改时安全撤销。

## 界面

### 项目 Skill 配置

![项目 Skill 配置](docs/screenshots/project-configuration.png)

项目页面集中显示分类、搜索、同步状态和启用范围。底部操作栏汇总当前变化，并在执行前打开同步预览。

### AI 技能顾问

![AI 技能顾问](docs/screenshots/ai-assistant.png)

可以从具体任务、现有 Skill 或参考文档开始对话。AI 功能为可选配置，不影响本地导入、整理和项目同步。

### Skill 集合

![Skill 集合管理](docs/screenshots/collection-manager.png)

集合内的子 Skill 可以分别查看和选择。集合停用时，整个集合不参与项目配置；子项选择仍保存在本地。

### Skill 文档

![Skill 文档详情](docs/screenshots/skill-detail.png)

详情面板同时展示来源、分类、标签、元数据和 Markdown 正文，方便在启用前了解 Skill 的实际内容。

## 使用流程

1. 导入 `.md`、`.zip`、标准 Skill 文件夹或 Skill 集合。
2. 查看 Skill 的名称、说明、分类和正文。
3. 添加目标项目，为项目选择需要的 Skill。
4. 打开同步预览，确认文件变化。
5. 同步后由项目中的 `AGENTS.md` 和 `.agent/skills/` 提供给 AI 开发工具使用。

## 下载与运行

前往 [GitHub Releases](https://github.com/w1ndwill/skill_store/releases) 下载 `SkillHub.exe`。程序为便携版，无需安装。

首次启动时，SkillHub 会创建本地技能库：

```text
%LOCALAPPDATA%\SkillHub\skills
```

导入文件的归档、同步状态和备份由 SkillHub 在本地数据目录中维护。源码仓库不包含个人 Skill、API Key、聊天记录或项目配置。

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
├── main.py                  # 后端、文件操作、同步与 AI 接口
├── static/
│   ├── index.html           # 应用结构
│   ├── index.css            # 界面样式
│   ├── app.js               # 前端状态与交互
│   ├── lucide.min.js        # 本地图标库
│   └── marked.min.js        # 本地 Markdown 渲染器
├── docs/screenshots/        # README 界面截图
├── SkillHub.spec            # PyInstaller 构建入口
├── app.ico                  # 应用图标
└── requirements.txt         # 运行依赖
```

## 安全边界

- API Key 只保存在本地配置中，界面仅显示脱敏状态。
- 导入过程不执行仓库中的 hooks、MCP 服务或安装脚本。
- ZIP 路径穿越、符号链接来源和目标路径冲突会被拒绝。
- 项目中不受 SkillHub 管理的同名文件不会被静默覆盖。
- 发布程序不包含私人 Skill、本地配置、测试目录或聊天记录。

## 技术栈

- Python + [pywebview](https://pywebview.flowrl.com/)
- 系统 WebView2
- HTML、CSS、JavaScript
- 可选的 OpenAI 兼容接口与 DuckDuckGo 联网搜索

## 开源协议

[MIT](LICENSE)
