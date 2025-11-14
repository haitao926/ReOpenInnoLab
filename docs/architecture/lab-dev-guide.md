# 穿件实验（Jupyter）开发技术说明

## 1. 范围与目标
- 聚焦“穿件实验”场景：教师端上传/预览 `.ipynb`，学生端依托本地算力运行，平台负责内容编排、指令分发与结果归档。
- 对齐现有需求 (`0.需求说明.md:5-10`) 与总体设计 (`1. 设计与规划.md:61-69`)，指导 web-teacher、web-student、lab-service、classroom-service 及 Virtual Lab Agent 的协同开发。
- 输出可直接转化为任务拆解的模块说明、接口契约与事件流，减少后续反复。

## 2. 角色与交互旅程
| 角色 | 关键操作 | 触达模块 |
| --- | --- | --- |
| 教师 | 通过 `LabEditor.vue` 上传 Notebook/依赖包、配置学段标签、触发 AI 校验；在 `LabLibrary.vue` 预览 nbconvert 生成的静态页面、绑定课程章节 | apps/web-teacher/src/views/VirtualLab |
| 学生 | 在课堂里接收本地 Agent 自动打开的 Jupyter 标签页、运行实验、提交结果 | apps/web-student + 本地 Virtual Lab Agent |
| 平台服务 | lab-service 负责 Notebook 解析、预览渲染、artifact 归档；classroom-service 负责课堂派发、agent 心跳调度；ai-service 输出实验摘要与点评 | services/lab-service, services/classroom-service, services/ai-service |

## 3. 系统组成
1. **前端教师端**（web-teacher）
   - `LabEditor.vue`：上传 `.ipynb`/zip，展示校验状态与 AI 建议。
   - `LabLibrary.vue`：查看实验卡片、预览 `preview.html`、配置课程绑定。
   - `AIExperimentAssistant.vue`：封装 AI 摘要、难度评级、课堂提醒。
2. **前端学生端**（web-student）
   - Virtual Lab 页面负责监听课堂状态、展示本地 Agent 状态（在线/离线/同步中）、汇总运行结果。
3. **lab-service**（后端）
   - `ingestion`：校验 `.ipynb`、解析 metadata、写 `lab_templates`/`resource_refs`。
   - `render`：调用 nbconvert 生成 `preview.html`、`cellMap.json`，同步对象存储。
   - `runtime-controller`：下发实验指令给 classroom-service 或直接与 agent 建立 gRPC 通道。
   - `artifact`：接收日志/成果，生成 `lab_artifacts`，更新 `lab_runs`。
4. **classroom-service**
   - 维护课堂状态与 `lab_agent_sessions`，负责匹配合格 agent、下发实验任务、记录心跳。
5. **Virtual Lab Agent**
   - 常驻进程（systemd/launchd）+ 本地 Jupyter，支持开机自启、mTLS 认证、断网缓存、自动补传。

## 4. 数据模型映射
- 核心实体在 `docs/architecture/data-persistence-plan.md:54-95` 与 `docs/architecture/database-schema.md:143-250` 已定义，包括 `lab_device_agents`、`lab_agent_sessions`、`lab_agent_events`、`lab_device_policies`、`lab_artifacts`。
- 本文档默认直接复用上述字段；新增字段需同步两个基础文档与 `packages/acl-sdk` 类型。

## 5. 端到端数据流
1. **上传阶段**
   - 教师端调用 `POST /labs/templates`（multipart：ipynb, attachments, metadata）。
   - lab-service `ingestion` 校验 `.acl resourceInfo`、生成 template 记录、落地对象存储。
   - `render` 模块异步生成预览，写 `preview.html/cellMap.json`，并发 `lab.uploaded` 事件。
2. **课程绑定**
   - 教师在 LabLibrary 选择课程章节，调用 `PUT /labs/templates/{id}/binding` 更新 `course_activity_id`。
3. **课堂派发**
   - classroom-service 在 `class_session` 启动时拉取 `lab_device_agents`，过滤 `trust_level=trusted & last_seen_at<30s`。
   - 创建 `lab_agent_sessions`，通过 gRPC/WebSocket 发送 `StartLab` 指令（包含 Notebook checksum、依赖 manifest、策略 ID）。
4. **本地执行**
   - Agent 启动本地 Jupyter，打开浏览器标签页（`http://localhost:{port}/lab-run/{sessionId}`）。
   - 每 5 秒发送 `Heartbeat` → `lab_agent_events(event_type=heartbeat)`；输出、日志、成果使用 `artifact/log` 事件携带 S3 预签名或 base64 diff。
   - 断网时写入 `offline_cache_path`，联网后批量发 `sync` 事件。
5. **归档与评分**
   - lab-service `artifact` 模块消费事件，写 `lab_artifacts`、更新 `lab_runs.state/score`，并触发 `lab.runtime.completed` Kafka 事件。
   - assignment-service/课程仪表订阅事件同步 UI。

## 6. API 设计草案
> REST/gRPC 细节需在各服务 OpenAPI/Proto 中落实。以下列出关键接口。

### lab-service REST
| Method | Path | 描述 |
| --- | --- | --- |
| POST | `/labs/templates` | 上传 Notebook，返回 templateId、渲染任务 ID |
| GET | `/labs/templates/{id}` | 查询模板、预览链接、AI 摘要 |
| PUT | `/labs/templates/{id}/binding` | 绑定课程 activity、学段、tag |
| POST | `/labs/runs` | 创建实验运行（课堂/学生维度） |
| GET | `/labs/runs/{id}/artifacts` | 获取运行产出（日志、notebook、评语） |

### classroom-service REST/gRPC
- REST：`POST /classrooms/{sessionId}/labs/{templateId}/dispatch` → 触发派发流程。
- gRPC：`StartLab`, `StopLab`, `ReportHeartbeat`, `UploadArtifact`，由 agent 调用。

### Agent ↔ 服务消息（Proto 草案）
```proto
message StartLabCommand {
  string session_id = 1;
  string lab_run_id = 2;
  string notebook_url = 3;
  string notebook_checksum = 4;
  repeated Attachment attachments = 5;
  LabPolicy policy = 6;
}

message HeartbeatPayload {
  string agent_id = 1;
  string session_id = 2;
  string status = 3; // ready/running/error
  double cpu_usage = 4;
  double memory_usage = 5;
  string log_tail = 6;
}
```

## 7. Virtual Lab Agent 技术要点
1. **启动与更新**：安装包提供 systemd/launchd 配置，支持开机自启、失败自动重启，版本号随 `lab_device_agents.agent_version` 上报。
2. **通信**：gRPC over HTTP/2 + mTLS，client 证书由平台签发；附带设备指纹、租户信息。
3. **安全**：
   - 扫描上传附件（本地/云）前置于实验运行。
   - 限制可安装的 pip/npm 包（对照 `lab_device_policies.allowed_packages_json`）。
   - 沙箱 Jupyter：采用 NBClassic + jupyter-server-proxy 屏蔽网络侧向移动。
4. **离线策略**：
   - 心跳超时 >30 秒视为离线，classroom-service 触发 UI 提醒，可切换远端 `lab_environments`。
   - 本地缓存结构：`~/.reopenlabs/cache/{sessionId}/notebook.ipynb` + `artifacts/`，包含 metadata.json 记录补传进度。
5. **可观察性**：Agent 记录本地日志（rotating file），课堂结束后根据策略选择是否上传。

## 8. 事件与监控
- Kafka Topics：`lab.uploaded`, `lab.rendered`, `lab.runtime.started`, `lab.runtime.heartbeat`, `lab.runtime.completed`, `lab.agent.offline`。
- Prometheus 指标：
  - `lab_agent_online_total{tenant}`：在线设备数。
  - `lab_render_duration_seconds`：nbconvert 渲染耗时。
  - `lab_artifact_upload_failures_total`：成果上报失败次数。
  - `lab_student_completion_rate`：实验完成率（结合 ClickHouse 聚合）。

## 9. 开发里程碑（建议）
1. **M1（1 周）**：完成 lab-service 基础骨架、`POST /labs/templates`、nbconvert 渲染 pipeline、S3 上传。
2. **M2（2-3 周）**：实现 classroom-service 与 lab-service 的派发接口、Virtual Lab Agent MVP（上传/心跳/日志）、前端 LabEditor/LabLibrary 真数据对接。
3. **M3（4-5 周）**：补齐离线缓存、AI 摘要、实验评分、Kafka 事件与指标；扩展 web-student Virtual Lab 状态页。
4. **M4（6 周+）**：接入安全扫描、策略控制、自助调试工具、课程/作业联动。

## 10. 依赖与注意事项
- UI 组件优先复用 `packages/ui-kit`（`2.项目原则.md:3-7`）。
- 与 `docs/architecture/data-persistence-plan.md`、`docs/architecture/database-schema.md` 保持字段一致；任何 schema 变更需同步迁移脚本与类型声明。
- 需预留面向 GPU/云算力（`lab_environments`）的扩展口，确保本地 agent 失效时可以 fallback。

