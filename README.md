# ⚡ AI Skill Hub Manager (v1.0.0 Release)

> 🚀 **A zero-barrier, zero-dependency Windows native standalone AI development workflow and local skill library visual manager.**

**AI Skill Hub Manager** is a premium Windows desktop client tailored for collaborative AI development. It enables you to efficiently manage and edit your AI skill/rule constraint files (e.g., `.md` development specifications and quality redlines) across different projects and frameworks. With a single click, it distributes and mounts selected skills to any of your specified development projects, automatically building robust MD5 hash verification and a beautiful `AGENTS.md` index directory.

---

## 🌎 Language Versions

- [English README](README.md)
- [简体中文 README](README_ZH.md)

---

## 🎨 Key Features

- 📦 **100% Standalone Single File Run (.exe)**:
  - Completely abandons the conflict-prone "local web server + browser shell" architecture. Built on the `pywebview` engine, it directly reads local bundled static assets with zero open ports and zero network dependencies.
  - Removes CMD console window flash entirely. Double-click to instantly launch the native clean window.
- ⚙️ **Adaptive Path System (v1.0.0 Major Core Update)**:
  - **Zero Hardcoded Paths**: The application automatically creates a default `skills/` global skill library folder in its own directory on first launch.
  - **Native Folder Selector**: Swap and select custom global skill libraries (D: drive, C: drive, user documents directory, etc.) directly in the sidebar with a native Windows folder picker.
- 📂 **Smart Project Management & Hash Auditing**:
  - Click "Associate Project" to instantly bring up the native Windows folder selection dialog. Zero keyboard typing, zero errors.
  - Conducts precise project backup and global library MD5 hash auditing, displaying real-time status dots:
    - 🟢 **Synced**: The project規约 and the global library are a perfect MD5 match.
    - 🟡 **Out of sync**: The global skill guideline has been edited/updated. Click to sync instantly.
    - ⚪ **Unloaded**: This skill is not yet loaded in the target project.
- 📝 **Built-in Monospace Markdown Modal Editor**:
  - Click "Edit Skill" to bring up a parent-bound modal text editor with high-contrast text rendering, auto-focus on open, and real-time Markdown preview.
- 🎨 **Premium Geek Interactions**:
  - Stripe-style double-line stats dashboard, iOS-style slider toggles, and height-flexible card grids.
  - Hovering over projects or skill cards triggers a smooth, breathing tech-indigo border glow effect (Border Glow Effect).

---

## 📁 Directory Structure

```text
d:\DevApps\skill_store\
├── main.py              # pywebview backend API & bridge layer
├── static/              # Frontend SPA (明亮模式 & Glassmorphism design)
│   ├── index.html       # SPA skeleton template
│   ├── index.css        # Premium UI design system stylesheet
│   └── app.js           # Frontend data interactions & toast system
├── config.json          # Local adaptive configuration database (auto-generated, git ignored)
├── .gitignore           # Highly clean Git exclusions
├── README.md            # Project manual (English)
└── README_ZH.md         # Project manual (简体中文)
```

---

## 💻 Installation Guide

### Method A: Run Standalone EXE (Recommended)
1. Go to the **Releases** tab of this GitHub repository and download the latest `AI_Skill_Hub_Manager.exe`.
2. Move `AI_Skill_Hub_Manager.exe` to any folder on your computer (e.g. `D:\DevApps\skill_store`).
3. Double-click `AI_Skill_Hub_Manager.exe` to launch.
4. *Note: Running it for the first time will automatically generate `config.json` and a `skills/` folder next to the executable.*

### Method B: Install and Run from Source
If you want to run from source or develop locally, please follow these steps:

#### 1. Clone the Repository
```bash
git clone https://github.com/your-username/your-repo-name.git
cd skill_store
```

#### 2. Install Python Environment
Make sure Python 3.10+ is installed on your Windows system.

#### 3. Install Third-party Dependencies
Install `pywebview` to support the desktop GUI:
```bash
pip install pywebview
```

#### 4. Run the Application
```bash
python main.py
```

---

## 🛠️ Compilation & Packaging Guide

If you modify the source code (especially HTML/CSS/JS assets in the `static/` folder) and want to rebuild it into a standalone `.exe`, follow these steps:

### 1. Install PyInstaller
```bash
pip install pyinstaller
```

### 2. Run Compilation
Compile all assets and dependencies into a single, clean single-file executable:
```bash
pyinstaller --noconsole --onefile --clean --add-data "static;static" main.py
```

### 3. Retrieve Compiled Binary
The compiled `main.exe` will be located in the `dist/` directory. Rename it to `AI_Skill_Hub_Manager.exe` and place it in your preferred directory for deployment.

---

## 🕹️ Detailed Usage Manual

### Step 1: Configure Your Global Skill Library
1. Launch the application. You will see the currently loaded absolute path in the **"Global Skill Library"** config widget in the left sidebar.
2. To link your existing rule directory (e.g., `D:\DevApps\skills`), click the ⚙️ Settings icon next to the path, select your target directory in the dialog, and select "Select Folder".
3. To add a new skill guidelines file, click **"New Skill"** at the top of the sidebar, type a filename (e.g., `git-commit.md`), and the system will create a beautiful Chinese Markdown template and automatically open the modal editor.

### Step 2: Link Your Development Projects
1. Click **"Associate Project"** at the top of the left sidebar.
2. Select the root folder of any software project you are developing (e.g., `D:\Project\my-app`) in the native dialog.
3. Click to select the associated project in the sidebar list. The right panel will instantly refresh and show the sync status for every global skill.

### Step 3: One-Click Sync & Load Spec
1. In the right cards grid, toggle the **"Enable Mounting"** slider at the bottom of each skill card to select which rules should apply to the currently selected project.
2. Once selected, the **"One-Click Sync Skills"** button in the top header will light up.
3. Click **"One-Click Sync Skills"**. The client will automatically:
   - Copy the selected `.md` rule files into your project's `.agent/skills/` directory.
   - Automatically generate or update a beautiful [**`AGENTS.md`**](AGENTS.md) navigation index file in your project's root folder, allowing local AI agents (such as Cursor, GitHub Copilot, Windsurf) to load and execute the rule immediately.
   - Automatically uninstall and physically delete any unselected rules in the project folder to keep your directory clean.


