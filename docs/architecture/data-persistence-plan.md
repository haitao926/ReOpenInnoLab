# 数据持久化与去 Mock 方案

## 0. 需求来源梳理
- **0.需求说明.md**：平台需覆盖班级/课程/实验/交互体验/作业全流程，课程是核心，实验需兼容 Jupyter 与 AI，体验支持 HTML 上传预览，UI 需高级现代 `0.需求说明.md:1-7`。
- **1. 设计与规划.md**：定义“未来校园控制台”愿景、五大角色旅程、六大业务域、.acl 内容模型、前后端与 AI/实验架构、数据/安全/DevOps 策略，为持久化限定场景、技术栈与演进路径 `1. 设计与规划.md:3-93`。
- **2.项目原则.md**：要求先规划后编码、尽量在现有文件中修改、优先复用 `packages/ui-kit`，强调价值导向与一致性，驱动本文档须先给出方案再开发 `2.项目原则.md:1-6`。
- **3.项目完整文件结构清单.md**：枚举 Monorepo 中 apps/services/packages/docs 等目录，标明 identity-service、course-service、web-teacher 等位置，决定持久化方案需与既有目录和技术栈对齐 `3.项目完整文件结构清单.md:3-335`。

## 1. 背景与目标
- 覆盖课程、班级、实验、交互体验、作业以及洞察等六大业务域，保证端到端流程都有真实数据支撑。
- 摆脱前端内置 mock，提供稳定的 API + 数据层，支撑教师、学生、管理员、家长、教研等多角色 `1. 设计与规划.md:8-24`。
- 兼容多租户、审计追踪、版本化课程 (.acl) 与 AI 产物存证，满足“温暖科技”体验与合规要求 `1. 设计与规划.md:67-72`。

## 2. 设计原则
1. **Plan First**：所有实体/字段在文档内达成共识后再落地迁移与代码 `2.项目原则.md:1-2`。
2. **领域驱动**：按 course/classroom/lab/experience/assignment/identity/insight 构建独立 schema 或服务，解耦读写路径 `1. 设计与规划.md:16-24,42-50`。
3. **多层存储**：事务 (PostgreSQL) + 缓存 (Redis) + 对象 (MinIO/S3) + 分析 (ClickHouse/TimescaleDB) + 搜索 (ElasticSearch) `1. 设计与规划.md:59-66`。
4. **一致性优先**：统一 ID、租户字段、审计字段、资源引用规范 (resource://domain/id)，复用 acl-sdk 校验 `1. 设计与规划.md:25-31`。
5. **可演进**：先单体+共享库，未来按服务拆分并通过 Debezium/Kafka 同步分析域 `1. 设计与规划.md:47,59-63`。

## 3. 存储拓扑
| 层级 | 技术 | 作用 | 关键策略 |
| --- | --- | --- | --- |
| 事务 | PostgreSQL (主从+读写分离) | 核心业务实体 | schema per domain、语义版本字段、行级审计、逻辑复制 |
| 缓存/实时 | Redis (Cluster) | 课堂状态、令牌、AI 任务队列 | Key 规范 `tenant:domain:type:id`、TTL + 事件推送、Lua 脚本保证原子性 |
| 对象 | MinIO/S3 | .acl、HTML 体验包、实验产物、素材 | 一致命名 `tenant/domain/{entity}/{version}`、版本标签、生命周期策略 |
| 分析 | ClickHouse + TimescaleDB | 学习行为、成绩趋势、课堂热力 | Kafka+Debezium CDC、按租户/课程分区、TTL + 归档 |
| 搜索 | ElasticSearch | 课程/资源/知识点检索 | 定义同步作业，保持与 PostgreSQL 异步一致 |

## 4. 领域数据模型（摘要）
> 全量 ER 图将附在后续 draw.io 文件；此处列关键表与字段。

### 4.1 Identity & Tenancy
- `tenants (id, code, name, status, plan, metadata)`
- `users (id, tenant_id, email, phone, name, role_type, status, last_login_at, profile_json)`
- `roles / permissions / role_permissions / user_roles` 沿用 `services/identity-service` 实体 `3.项目完整文件结构清单.md:285-312`。
- `auth_providers (oauth/openid 配置, scopes)`、`user_sessions`、`login_attempts`、`two_factor`。

### 4.2 Course & ACL
- `courses (id, tenant_id, code, title, grade_band, subject, delivery_mode, status)`
- `course_versions (course_id, version, acl_jsonb, diff_summary, created_by, published_at)`
- `course_modules (version_id, order, title, module_type)`
- `course_activities (module_id, activity_type:intro/knowledge/activity/assignment, resource_ref, ai_hints_json)`
- `resource_refs (id, resource_uri, kind:lab/experience/assignment/media, checksum, storage_path)`
- `.acl` 存 JSONB + 版本快照到 S3；acl-sdk 负责解析、校验、diff `1. 设计与规划.md:25-31`。

### 4.3 Classroom & Cohort
- `classrooms (id, tenant_id, name, school_id, schedule_json, homeroom_teacher_id)`
- `class_members (classroom_id, user_id, role:teacher/student, status)`
- `class_sessions (id, classroom_id, course_version_id, start_at, end_at, state)`
- `attendance_records (session_id, student_id, status, recorded_at, source)`
- 实时课堂状态（当前 slide、互动结果）缓存于 Redis，定期快照入 `class_session_snapshots`。

### 4.4 Labs & Experiments
- `lab_templates (id, tenant_id, title, lab_type:jupyter/ai/file, runtime_spec, grading_matrix_json)`
- `lab_runs (id, template_id, course_activity_id, owner_id, state, started_at, completed_at, score)`
- `lab_artifacts (run_id, artifact_type:notebook/log/model, storage_path, checksum)`
- `lab_environments (id, kubernetes_cluster, quota_cpu, quota_gpu, image_ref)`：远端算力池（K8s/JupyterHub）配置，供 GPU/集中式实验调度 `1. 设计与规划.md:20,48-56`。
- `lab_device_agents (id, tenant_id, device_fingerprint, student_id, classroom_id, agent_version, os_info, jupyter_port, status, last_seen_at, trust_level)`：学生端随开机自启动的 Virtual Lab Agent 注册信息。
- `lab_agent_sessions (id, agent_id, lab_run_id, notebook_checksum, package_manifest, started_at, ended_at, exit_code, offline_cache_path)`：一次课堂实验在本地 agent 中的执行记录，串联 lab_runs 与设备。
- `lab_agent_events (id, agent_session_id, event_type:heartbeat/artifact/log/sync, payload_json, created_at)`：心跳、日志、成果上报与断网补传的事件流，便于回放实验过程。
- `lab_device_policies (id, tenant_id, grade_band, quota_cpu, quota_memory, allowed_packages_json, auto_start boolean)`：本地算力配额、白名单包与自启策略，课堂开始前由 classroom-service 下发并缓存至 agent。
- 对象存储命名约定：`tenant/lab/${labId}/preview.html`、`.../cellMap.json`、`.../artifacts/{labRunId}`，agent 仅在 checksum 不一致时增量拉取；断网时写入 `offline_cache_path`，联网后透过 `event_type=sync` 补传。

> **运行侧改造**：默认优先使用学生端本地算力（Virtual Lab Agent + Jupyter），远端 `lab_environments` 作为兜底。lab-service 负责指令分发、agent 心跳校验与结果归档，确保教师端永远只消费静态快照/运行状态。

### 4.5 Interactive Experiences
- `experiences (id, tenant_id, title, description, tags, compliance_status)`
- `experience_versions (experience_id, version, manifest_json, csp_report, preview_url)`
- `experience_assets (version_id, asset_type:html/css/js/media, storage_path, hash)`
- `tracking_configs (experience_id, events_json, analytics_sink)`

### 4.6 Assignments & Assessment
- `assignments (id, tenant_id, course_activity_id, title, due_at, grading_type:auto/manual)`
- `assignment_items (assignment_id, item_type:question/coding/report, content_json)`
- `submissions (id, assignment_id, student_id, status, submitted_at, payload_ref, ai_score, teacher_score)`
- `grading_tasks (submission_id, grader_id, channel:ai/manual, rubric_json)`
- `feedback (submission_id, author_id, feedback_json, knowledge_tags)`
- 成绩快照写入 TimescaleDB `assignment_scores_ts (time, assignment_id, student_id, score)` `1. 设计与规划.md:22-23,53-55`。

### 4.7 Insights & Analytics
- `learning_events (id, tenant_id, user_id, event_type, source, payload_json)` —— PostgreSQL 热数据，异步入 ClickHouse。
- `ai_usage_logs (context_id, model, prompt_hash, latency_ms, outcome)`，配合审计要求 `1. 设计与规划.md:53-58`。

## 5. 数据流与事件
1. **写路径**：Nest 服务写 PostgreSQL → 触发 Domain Event → Kafka → Redis 更新实时态 → Debezium 推 CDC → ClickHouse/ElasticSearch/TimescaleDB。
2. **读路径**：高频读 (课堂、榜单) 先查 Redis/TimescaleDB，命中失败再回源 PostgreSQL 并回填。
3. **对象上传**：前端直传 S3，返回 `resource_uri`，后台异步触发病毒扫描/安全检测；结果写 `experience_versions.security_status`。
4. **版本管理**：课程/体验/实验/作业版本号遵循 `major.minor.patch`，以事务表 + 对象存储双向引用，支持回滚。
5. **穿件实验链路（教师→Agent→结果）**：
   - 上传：教师端 LabEditor/LabLibrary 上传 `.ipynb` 与依赖包，lab-service 写 `lab_templates` 并生成预览 (`preview.html/cellMap.json`) + Kafka `lab.uploaded` 事件。
   - 课堂派发：classroom-service 查 `lab_device_agents`，校验 `trust_level/last_seen_at`，创建 `lab_agent_sessions` 后通过 gRPC/WebSocket 下发 Notebook/依赖包指令。
   - 本地运行：Virtual Lab Agent 保持 Jupyter systemd/launchd 自启，接受指令后打开浏览器标签页，按 5 秒心跳写 `lab_agent_events` 并将输出/成果作为 artifact/log 事件推送；断网则缓存至 `offline_cache_path` 并在重连后标记 `event_type=sync`。
   - 归档评分：lab-service 根据事件生成 `lab_artifacts`、更新 `lab_runs.state/score`，触发 `lab.runtime.completed` 事件供 course/assignment 域刷新页面。

## 6. 技术栈与基础设施
- **ORM**：TypeORM (Identity 已落地) + Prisma (课程/课堂等新域) 共存，通过仓储接口抽象，后续视情况统一。
- **迁移**：每个服务维护 `migrations/`，在 Turbo pipeline 中先跑 lint/test，再执行 `pnpm nx run <service>:migration:run`。
- **配置**：`ConfigModule` 统一注入 DB/Redis/S3/Kafka 变量，`.env` 提供 `DATABASE_URL_*`, `REDIS_URL`, `S3_BUCKET`, `KAFKA_BROKERS`。
- **安全**：字段级加密（如学生联系方式）、PG row-level security 分租户隔离，结合 Casbin/Nest Access Control 做 ABAC `1. 设计与规划.md:67-72`。

## 7. 去 Mock 路线
1. **阶段一（登录/鉴权）**
   - 部署 identity-service + PostgreSQL，前端 `VITE_ENABLE_MOCK_API=false`，auth.ts 直接调用真实 `/auth/*`。
   - Pinia store 接口补充 loading/error 状态，localStorage 仅缓存 token。
2. **阶段二（课程/班级）**
   - 落地 course-service & classroom 模块，提供课程列表、详情、班级成员 API；前端路由/视图逐步替换 mock 数据源。
3. **阶段三（实验/体验/作业）**
   - 联通 lab-service、experience-service、assignment-service，支持上传/运行/批改；前端增加 `msw` 或 Swagger schema 生成的临时 mock 以便在后端未就绪前联调。
4. **阶段四（洞察/家长视图）**
   - 打通数据仓与可视化接口，逐步从 dashboards 中移除静态图表。

## 8. 演进时间表
| 时间 | 交付 | 备注 |
| --- | --- | --- |
| 0-2 周 | 完成 ER & JSON Schema，搭建本地 PostgreSQL/Redis/MinIO/Kafka docker-compose，输出迁移脚本 baseline | 对应路线图「起始阶段」 `1. 设计与规划.md:84-85` |
| 3-6 周 | 上线 identity/course/classroom 真实时 API，前端课程编排器用真数据 | 教师端核心闭环 |
| 7-12 周 | 扩展 lab/assignment/experience，打通 AI 审阅、HTML 沙箱、Jupyter 运行 | 对应路线图「拓展/深化」 `1. 设计与规划.md:85-87` |
| 12 周+ | 建立洞察平台、CDC、可观测性与合规报表，支持私有化部署 | `1. 设计与规划.md:86-87` |

## 9. 运维与治理
- **备份**：PostgreSQL 每日全量 + 15 分钟 WAL，Redis 持久化 AOF；对象存储跨区域复制，定期演练恢复 `1. 设计与规划.md:59-66,73`。
- **监控**：OpenTelemetry 追踪 + Prometheus 指标 + Grafana 仪表 + Sentry 报错；自定义课堂/作业 KPI 仪表 `1. 设计与规划.md:63-64`。
- **安全/合规**：敏感字段脱敏、访问审计、家长同意记录、异常行为检测（批量提交/实验滥用），结合 API Gateway 做限流与熔断 `1. 设计与规划.md:69-72`。
- **数据质量**：定期校验 resource:// 引用、课程版本与资源是否对齐；CDC 进入 ClickHouse 后跑完整性校验并回传结果。

## 10. 前端联调策略
- axios 单例已具备拦截器，新增多租户头 `X-Tenant-Code`、`X-Session-Id`，401/429 统一提示 `apps/web-teacher/src/api/auth.ts:1-78`。
- Pinia store 里新增 `dataSource` 字段指示 `live` vs `mock`，方便排查；课堂实时页通过 WebSocket 监听 Redis channel。
- Storybook/MSW 使用 Swagger 生成接口 mock，仅在 CI 视觉回归阶段使用，避免回退旧 mock 包 `packages/ui-kit` 可复用控件 `2.项目原则.md:3`。

## 11. 下一步行动
1. 输出 courses/classrooms/assignments/labs ER 细化图（draw.io）并附在 docs/architecture。
2. 为 identity-service 编写首个 TypeORM migration 与 docker-compose (PostgreSQL + Redis) 脚本，跑通 `/auth/login`。
3. 在 apps/web-teacher 配置 `.env.development`，默认禁用 mock，新增真实 API baseURL。
4. 建立数据字典与命名规范（字段含义、单位、取值范围），纳入仓库 types/ 共享。

## 12. 与现有文件结构的落地策略
- **后端服务层**：`services/identity-service`, `services/course-service`, `services/ai-service`, `services/gateway` 等目录已存在，分别承载鉴权、多领域课程、AI、网关逻辑；在这些目录中补充数据库模块、迁移与 REST/GraphQL 接口，保持与 Nest CLI/tsconfig 的一致 `3.项目完整文件结构清单.md:261-312`。
- **前端应用层**：教师端 `apps/web-teacher` 内已按视图/组件/Pinia store 拆分，API 目录 (`src/api/auth.ts`, `mock.ts`) 是替换 mock 的入口；依照本方案调整 env、store、视图以消费真实接口 `3.项目完整文件结构清单.md:47-134`。
- **共享能力**：`packages/acl-sdk`, `packages/ui-kit`, `packages/shared-utils` 提供 ACL 解析、UI、工具，持久化相关的 schema/类型放进 `packages/acl-sdk` 与 `types/`，避免重复定义 `3.项目完整文件结构清单.md:205-247`。
- **文档与运维**：`docs/architecture`、`infra/ci`、`infra/docker`、`scripts/` 负责方案、CI、容器与脚本；本方案落地后同步更新 docker-compose、CI workflow 与脚本确保新数据库/缓存服务被自动部署 `3.项目完整文件结构清单.md:33-190,249-283`。
