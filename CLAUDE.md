# CLAUDE.md — 抖B社群活动公告栏 开发指引

## 项目简介

这是一个基于 PRD V1.0 构建的社群活动公告网站。普通用户可查看/搜索活动，运营人员在本地电脑编辑管理活动内容。项目采用 Node.js + Express 框架，EJS 模板引擎，JSON 文件存储数据。

## 项目仓库

`D:\A活动看板\`

## 技术栈

| 层面 | 技术 | 版本 |
|------|------|------|
| 运行时 | Node.js | v24.x |
| Web框架 | Express | v5.x |
| 模板引擎 | EJS | v6.x |
| 会话管理 | express-session | v1.x |
| 环境变量 | dotenv | v17.x |
| 数据存储 | JSON 文件 | — |

## 标准文档路径

所有项目标准文档位于 `project-docs/` 目录（`docs/` 已被 GitHub Pages 静态站占用）：

| 文档 | 路径 | 说明 |
|------|------|------|
| 开发需求文档 | [project-docs/requirements.md](project-docs/requirements.md) | PRD提炼的功能需求 |
| 技术规范 | [project-docs/technical-spec.md](project-docs/technical-spec.md) | 架构设计、接口定义、数据结构 |
| 设计规范 | [project-docs/design-spec.md](project-docs/design-spec.md) | 色彩、组件、布局、视觉标准 |
| 分步执行步骤 | [project-docs/implementation-steps.md](project-docs/implementation-steps.md) | 7步开发计划及里程碑 |

## 开发日志

每日开发日志位于 `dev-logs/` 目录，文件名为 `YYYY-MM-DD.md`。
每次开发会话开始和结束时更新日志。

## 关键文件说明

| 文件 | 说明 |
|------|------|
| [server.js](server.js) | Express 主入口，包含所有路由和状态计算逻辑 |
| [data/activities.json](data/activities.json) | 活动数据存储（JSON 格式） |
| [public/css/style.css](public/css/style.css) | 全局样式（移动端优先、淡粉色主题） |
| [public/js/main.js](public/js/main.js) | 前台交互（搜索、筛选） |
| [views/index.ejs](views/index.ejs) | 前台首页模板 |
| [views/detail.ejs](views/detail.ejs) | 活动详情页模板 |
| [views/admin/](views/admin/) | 后台管理页面模板 |
| [.env](.env) | 环境变量（端口、密码等） |

## 开发工作流

1. **启动开发服务器**：`node server.js` 或 `npm start`
2. **前台访问**：`http://localhost:3000`
3. **后台管理**：`http://localhost:3000/admin`（默认密码：admin123）
4. **修改样式**：编辑 `public/css/style.css`
5. **修改模板**：编辑 `views/` 下的 `.ejs` 文件
6. **修改数据逻辑**：编辑 `server.js` 中的工具函数

## 项目开发原则

- 每步完成后验证功能正常再推进下一步
- 保持代码简洁清晰，优先使用中文注释
- 前台页面移动端优先设计
- 后台管理页面仅在本地 localhost 访问
- 修改 `.env` 中的密码后再正式使用
