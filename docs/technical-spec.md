# 技术规范

> 版本：V1.0
> 更新日期：2026-06-14

---

## 一、技术架构

```
┌─────────────────────────────────────────┐
│               浏览器                      │
│  ┌──────────┐  ┌────────────────────┐   │
│  │ 前台页面  │  │ 后台管理(localhost) │   │
│  └────┬─────┘  └────────┬───────────┘   │
└───────┼─────────────────┼───────────────┘
        │                 │
   ┌────▼─────────────────▼────┐
   │     Express 服务器         │
   │  ┌──────────────────────┐ │
   │  │  EJS 模板渲染         │ │
   │  ├──────────────────────┤ │
   │  │  路由 & 业务逻辑      │ │
   │  ├──────────────────────┤ │
   │  │  JSON 数据读写        │ │
   │  └──────────────────────┘ │
   └───────────────────────────┘
```

## 二、路由设计

### 2.1 前台路由（无需登录）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/` | 活动列表首页（支持搜索、筛选） |
| GET | `/detail/:id` | 活动详情页 |

### 2.2 后台路由（需登录）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/admin/login` | 后台登录页 |
| POST | `/admin/login` | 处理登录请求 |
| GET | `/admin/logout` | 退出登录 |
| GET | `/admin` | 后台活动管理列表 |
| GET | `/admin/new` | 新增活动页面 |
| POST | `/admin/new` | 处理新增活动 |
| GET | `/admin/edit/:id` | 编辑活动页面 |
| POST | `/admin/edit/:id` | 处理编辑活动 |
| POST | `/admin/delete/:id` | 删除活动 |

## 三、数据结构

### 3.1 活动对象 (Activity)

```json
{
  "id": "string (唯一标识，格式 act_NNN)",
  "name": "string (活动名称，必填)",
  "activityStartDate": "string (YYYY-MM-DD，选填)",
  "activityEndDate": "string (YYYY-MM-DD，选填)",
  "prizeStartDate": "string (YYYY-MM-DD，选填)",
  "prizeEndDate": "string (YYYY-MM-DD，选填)",
  "rules": "string (活动规则，多行文本，选填)",
  "entry": "string (活动入口，富文本HTML，选填)",
  "prizeMethod": "string (兑奖方式，多行文本，选填)",
  "prizes": "string (活动奖品，多行文本，选填)",
  "remark": "string (备注，富文本HTML，选填)",
  "isLongTerm": "boolean (是否为长期活动)",
  "createdAt": "string (ISO 8601 创建时间)",
  "updatedAt": "string (ISO 8601 更新时间)"
}
```

### 3.2 数据文件结构

```json
{
  "activities": [ ... ]
}
```

## 四、状态计算逻辑

```
伪代码：
function calcStatus(activity):
    if activity.isLongTerm → 返回 "进行中"
    if today < activityStartDate → 返回 "待开始"
    if today ≥ prizeStartDate AND today ≤ prizeEndDate → 返回 "可兑奖"
    if today > max(prizeEndDate, activityEndDate) → 返回 "已结束"
    if today ≥ activityStartDate AND today ≤ activityEndDate → 返回 "进行中"
    默认 → 返回 "进行中"
```

## 五、认证机制

- 使用 `express-session` 管理会话
- Session 存储在服务端内存中
- 默认密码通过 `.env` 的 `ADMIN_PASSWORD` 配置
- 24小时会话过期
