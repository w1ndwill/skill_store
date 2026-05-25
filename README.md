# ⚡ AI Skill Hub Manager (v1.0.0 Release)

> 🚀 **A local visual management tool for Windows native AI developer specifications and skill guidelines.**

**AI Skill Hub Manager** helps development teams efficiently manage local AI rule/guideline files (such as Markdown formatted coding standards, design principles, and quality redlines). It supports one-click distribution and synchronization of selected guidelines to various active projects, and automatically builds a project-level `AGENTS.md` index file for cooperative AI tools (such as Cursor, GitHub Copilot, Windsurf) to read and comply with.

---

## 🌎 Language Versions

- [English README](README.md)
- [简体中文 README](README_ZH.md)

---

## 🎨 Key Features

- 📦 **100% Standalone Single File Run (.exe)**:
  - Built on the `pywebview` engine, it directly reads local bundled static assets with zero open ports and zero network dependencies.
  - Double-click to instantly launch the native clean window with no CMD console window flashing.
- ⚙️ **Adaptive Path System**:
  - **Out-of-the-box**: The application automatically creates a default `skills/` global skill library folder in its own directory on first launch.
  - **Custom Folder Paths**: Switch and select custom global skill libraries (D: drive, C: drive, user documents directory, etc.) directly in the sidebar with a native Windows folder picker.
- 📂 **Smart Project Management & Hash Auditing**:
  - Click "Associate Project" to instantly bring up the native Windows folder selection dialog. Zero keyboard typing, zero errors.
  - Conducts precise project backup and global library MD5 hash auditing, displaying real-time status dots:
    - 🟢 **Synced**: The project guidelines and the global library are a perfect MD5 match.
    - 🟡 **Out of sync**: The global skill guideline has been edited. Click to sync instantly.
    - 🔵 **Pending Mount**: The mount switch is enabled. Waiting for sync.
    - 🔴 **Pending Uninstall**: The mount switch is disabled. Waiting for sync.
    - ⚪ **Unloaded**: This skill is not yet loaded in the target project.
- 📝 **Monospace Markdown Modal Editor**:
  - Click "Edit Skill" to bring up a parent-bound modal text editor with high-contrast text rendering, auto-focus on open, and real-time Markdown preview.
- 🎨 **Refined Interactive Motion Effects**:
  - Modern data dashboard, rounded card grids, and iOS-style slider toggles.
  - Supports tactile depress scale feedback on click, springy toggle sliders, and settings gear rotations.

---

## 📁 Directory Structure

```text
├── main.py                      # pywebview backend API & bridge layer
├── AI_Skill_Hub_Manager.spec    # PyInstaller build configuration
├── app.ico                      # Application icon
├── static/                      # Frontend SPA
│   ├── index.html               # SPA skeleton template
│   ├── index.css                # UI design system stylesheet
│   └── app.js                   # Frontend data interactions & status logic
├── config.json                  # Local config (auto-generated, git ignored)
├── .gitignore                   # Git exclusions
├── README.md                    # Project manual (English)
└── README_ZH.md                 # Project manual (简体中文)
```

---

## 💻 Installation Guide

### Method A: Run Standalone EXE (Recommended)
1. Go to the **Releases** tab of this GitHub repository and download the latest `AI_Skill_Hub_Manager.exe`.
2. Move `AI_Skill_Hub_Manager.exe` to any folder on your computer.
3. Double-click `AI_Skill_Hub_Manager.exe` to launch.
4. *Note: Running it for the first time will automatically generate `config.json` and a `skills/` folder next to the executable.*

### Method B: Install and Run from Source

#### 1. Clone the Repository
```bash
git clone https://github.com/w1ndwill/skill_store.git
cd skill_store
```

#### 2. Install Python Environment
Make sure Python 3.10+ is installed on your Windows system.

#### 3. Install Dependency
```bash
pip install pywebview
```

#### 4. Run the Application
```bash
python main.py
```

---

## 🛠️ Compilation & Packaging Guide

If you modify the frontend assets (HTML/CSS/JS in the `static/` folder) and want to rebuild it into a standalone `.exe`, follow these steps:

### 1. Install PyInstaller
```bash
pip install pyinstaller
```

### 2. Run Compilation
```bash
pyinstaller --clean AI_Skill_Hub_Manager.spec
```
Or build from scratch without the spec file:
```bash
pyinstaller --noconsole --onefile --clean --icon=app.ico --add-data "static;static" --add-data "app.ico;." --name AI_Skill_Hub_Manager main.py
```

### 3. Retrieve Compiled Binary
The compiled `AI_Skill_Hub_Manager.exe` will be located in the `dist/` directory. Copy it to your preferred directory for deployment.

---

## 🕹️ Detailed Usage Manual

### Step 1: Configure Your Global Skill Library
1. Launch the application. You will see the currently loaded absolute path in the **"Global Skill Library"** config widget in the left sidebar.
2. Click the ⚙️ Settings icon next to the path, select your target directory in the dialog, and select "Select Folder" to change path.
3. To add a new skill guidelines file, click **"New Skill"** at the top of the sidebar, type a filename, and the system will create a template and automatically open the modal editor.

### Step 2: Link Your Development Projects
1. Click **"Associate Project"** at the top of the left sidebar.
2. Select the root folder of any software project you are developing in the native dialog.
3. Click to select the associated project in the sidebar list. The right panel will instantly refresh and show the sync status for every global skill.

### Step 3: One-Click Sync & Load Spec
1. In the right cards grid, toggle the **"Enable Mounting"** slider at the bottom of each skill card to select which rules should apply to the currently selected project.
2. The status indicator will instantly display "Pending Mount" or "Pending Uninstall" pulse effects.
3. Click **"One-Click Sync Skills"** in the header. The client will automatically sync the selected files into your project's `.agent/skills/` directory, update the `AGENTS.md` index navigation in the root folder, and remove any unselected rules to keep your directory clean.
