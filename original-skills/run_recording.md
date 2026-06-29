# 运行记录与可观测性技能指南 (Run Recording & Logging Skill Guide)

高质量系统运行记录与可观测性指南，涵盖结构化日志分级、异常监控以及诊断审计规范。

---

## 1. 运行记录的核心原则

一个好的运行记录系统应当是**结构化的（Structured）**、**分级的（Leveled）**且**信息完备的（Context-Rich）**。

```
[时间戳] [日志级别] [进程/线程ID] [跟踪ID (TraceID)] [模块名] - 消息内容 {上下文 JSON 数据}
```

### 1.1 日志级别划分规范

| 级别 (Level) | 使用场景 | 生产环境处理建议 |
| :--- | :--- | :--- |
| **FATAL / CRITICAL** | 导致应用程序崩溃、无法继续运行的灾难性错误（如内存耗尽、核心依赖彻底挂掉）。 | 立即触发电话/短信报警，运维人员介入。 |
| **ERROR** | 当前请求或操作失败，但系统整体仍能运行（如数据库单次连接失败、外部 API 超时、未捕获 of 业务异常）。 | 记录堆栈，触发即时通知（如 Slack/钉钉机器人）。 |
| **WARN** | 潜在的问题或异常情况，虽然当前未报错，但可能演变为错误（如使用已废弃的 API、磁盘空间即将满、接口响应极慢）。 | 记录日志，定期审查仪表盘，不触发紧急报警。 |
| **INFO** | 关键系统状态变更或核心业务生命周期节点（如服务启动、用户登录、订单创建成功）。 | 默认收集，用于业务指标审计和流程追踪。 |
| **DEBUG** | 详尽的开发调试信息（如具体的 SQL 语句、入参出参详情、算法中间变量值）。 | 生产环境默认关闭，仅在排查特定故障时动态开启。 |

---

## 2. 运行记录实现与最佳实践

### 场景 A：后端结构化日志 (Structured Logging)

#### 1. Node.js (Winston / Pino)
避免直接使用 `console.log`。推荐使用高性能结构化日志库，如 `pino`：

```javascript
// pino_logger.js
const pino = require('pino');
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => { return { level: label.toUpperCase() }; }
  },
  timestamp: pino.stdTimeFunctions.isoTime
});

// 使用示例
logger.info({ userId: '12345', action: 'purchase' }, 'User completed purchase successfully');
logger.error({ err: new Error('DB Connection Timeout'), query: 'SELECT * FROM users' }, 'Failed to query user DB');
```

#### 2. Python (structlog)
```python
import structlog

logger = structlog.get_logger()
logger.info("user_logged_in", username="antigravity", ip="127.0.0.1")
```

---

### 场景 B：前端运行记录与异常监控 (Frontend Logging & Telemetry)

#### 1. 全局异常捕获 (Crash & Error Recording)
```javascript
// 捕获普通 JS 运行时异常
window.addEventListener('error', (event) => {
  const errorData = {
    message: event.message,
    source: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    stack: event.error ? event.error.stack : null,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString()
  };
  // 发送日志到服务器或 APM 平台 (如 Sentry)
  sendTelemetry(errorData);
});

// 捕获未处理 of Promise 拒绝
window.addEventListener('unhandledrejection', (event) => {
  const errorData = {
    message: 'Unhandled Promise Rejection: ' + event.reason,
    stack: event.reason && event.reason.stack ? event.reason.stack : null,
    timestamp: new Date().toISOString()
  };
  sendTelemetry(errorData);
});
```

#### 2. 用户会话/行为轨迹记录 (User Session & Breadcrumbs)
在异常发生前，记录用户的交互行为轨迹（如点击了哪个按钮、发送了什么请求），极大方便复现 Bug：
```javascript
const breadcrumbs = [];
function addBreadcrumb(category, message, level = 'info') {
  breadcrumbs.push({
    timestamp: new Date().toISOString(),
    category,
    message,
    level
  });
  if (breadcrumbs.length > 50) breadcrumbs.shift(); // 仅保留最近50条
}

// 示例：拦截所有点击事件并记入面包屑
document.addEventListener('click', (e) => {
  if (e.target && e.target.tagName) {
    addBreadcrumb('ui.click', `Clicked ${e.target.tagName}#${e.target.id || ''}.${e.target.className || ''}`);
  }
});
```

---

### 场景 C：终端执行过程记录 (Terminal Transcript & Task Logging)

在开发与自动化脚本中，将长命令或关键脚本的输出完整记录下来：

1.  **PowerShell (Windows)**
    使用 `Start-Transcript` 命令记录整个会话：
    ```powershell
    # 开始记录终端日志，输出到指定路径
    Start-Transcript -Path "D:\DevApps\skills\task_run_log.txt" -Append
    
    # 执行你的任务/脚本
    npm run build
    
    # 结束记录
    Stop-Transcript
    ```

2.  **Bash / Linux**
    使用 `script` 命令：
    ```bash
    script -a -f /path/to/run_record.log
    # 执行命令...
    exit  # 退出记录
    ```

---

## 3. 运行记录审计与诊断检查单（Diagnostic Checklist）

当系统发生故障，需要利用运行记录进行诊断时，使用此检查单：

- [ ] **TraceID 追踪**：是否可以通过唯一的追踪 ID (TraceID) 串联起分布式系统中的一次完整请求链路？
- [ ] **高频降噪**：是否有机制防止重复报错导致日志盘满（例如在 5 分钟内对相同 Error 进行节流计数）？
- [ ] **敏感信息脱敏**：日志中是否清除了密码、Token、手机号、身份证号、银行卡号等隐私数据？
- [ ] **日志自动轮转 (Rotation)**：生产环境日志是否配置了按天/按体积自动切分与压缩（如 `logrotate`），防止打爆磁盘？
- [ ] **上下文完备性**：发生 Error 时，是否记录了当时的请求 Header、入参、用户 Session ID 和完整的错误堆栈（Stack Trace）？
