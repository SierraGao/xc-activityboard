// ========================================
// 抖B社群活动公告栏 - 本地开发服务器
// ========================================
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== 中间件 ====================

// 解析请求体
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session 配置（用于后台登录）
app.use(session({
  secret: process.env.SESSION_SECRET || 'activity-board-secret-key-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24小时
}));

// 静态文件服务
app.use(express.static(path.join(__dirname, 'public')));

// 图片上传配置
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // 生成唯一文件名: 时间戳_随机数.扩展名
    const ext = path.extname(file.originalname) || '.png';
    const name = Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6) + ext;
    cb(null, name);
  }
});
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB 限制
  fileFilter: function (req, file, cb) {
    const allowed = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i;
    if (allowed.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传图片文件（jpg/png/gif/webp/bmp/svg）'));
    }
  }
});

// 图片上传接口
app.post('/admin/upload-image', requireAuth, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.json({ success: false, error: '没有上传文件' });
  }
  const url = '/uploads/' + req.file.filename;
  res.json({ success: true, url: url });
});

// EJS 模板引擎
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ==================== 工具函数 ====================

// 读取活动数据
function loadActivities() {
  const filePath = path.join(__dirname, 'data', 'activities.json');
  if (!fs.existsSync(filePath)) {
    // 如果文件不存在，创建空数据
    const initial = { activities: [] };
    fs.writeFileSync(filePath, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (e) {
    return { activities: [] };
  }
}

// 写入活动数据
function saveActivities(data) {
  const filePath = path.join(__dirname, 'data', 'activities.json');
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// 计算活动状态
function calcStatus(activity) {
  const now = new Date();

  // 长期活动：无结束时间，始终进行中
  if (activity.isLongTerm) {
    return '进行中';
  }

  // 解析日期时间：支持 "YYYY-MM-DD" 和 "YYYY-MM-DDTHH:MM" 两种格式
  function parseDate(str) {
    if (!str) return null;
    // datetime-local 格式 "YYYY-MM-DDTHH:MM" 可直接解析
    // date 格式 "YYYY-MM-DD" 需拼接 T00:00
    if (str.includes('T')) {
      return new Date(str);
    }
    return new Date(str + 'T00:00:00');
  }

  const startDate = parseDate(activity.activityStartDate);
  const endDate = parseDate(activity.activityEndDate);
  const prizeStart = parseDate(activity.prizeStartDate);
  const prizeEnd = parseDate(activity.prizeEndDate);

  // 待开始：当前时间 < 活动开始时间
  if (startDate && now < startDate) {
    return '待开始';
  }

  // 可兑奖：兑奖开始时间 ≤ 当前时间 ≤ 兑奖结束时间
  if (prizeStart && prizeEnd && now >= prizeStart && now <= prizeEnd) {
    return '可兑奖';
  }

  // 已结束：当前时间 > 兑奖结束时间（或活动结束时间，如果没有兑奖时间）
  const lastEndDate = prizeEnd || endDate;
  if (lastEndDate && now > lastEndDate) {
    return '已结束';
  }

  // 进行中：活动开始时间 ≤ 当前时间 ≤ 活动结束时间
  if (startDate && endDate && now >= startDate && now <= endDate) {
    return '进行中';
  }

  // 兜底：无足够日期信息时默认进行中
  return '进行中';
}

// ==================== 前台路由 ====================

// 首页 - 活动列表
app.get('/', (req, res) => {
  const data = loadActivities();
  const activities = data.activities.map(a => ({
    ...a,
    _status: calcStatus(a)
  }));
  res.render('index', { activities });
});

// 活动详情页
app.get('/detail/:id', (req, res) => {
  const data = loadActivities();
  const activity = data.activities.find(a => a.id === req.params.id);
  if (!activity) {
    return res.status(404).send('活动不存在');
  }
  activity._status = calcStatus(activity);
  res.render('detail', { activity });
});

// ==================== 后台路由 ====================

// 后台登录中间件
function requireAuth(req, res, next) {
  if (req.session.isAdmin) {
    return next();
  }
  res.redirect('/admin/login');
}

// 后台登录页
app.get('/admin/login', (req, res) => {
  res.render('admin/login', { error: null });
});

// 后台登录处理
app.post('/admin/login', (req, res) => {
  const { password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  if (password === adminPassword) {
    req.session.isAdmin = true;
    res.redirect('/admin');
  } else {
    res.render('admin/login', { error: '密码错误，请重试' });
  }
});

// 后台注销
app.get('/admin/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
});

// 后台首页 - 活动管理列表
app.get('/admin', requireAuth, (req, res) => {
  const data = loadActivities();
  const activities = data.activities.map(a => ({
    ...a,
    _status: calcStatus(a)
  }));
  res.render('admin/list', { activities });
});

// 生成唯一ID
function generateId() {
  return 'act_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
}

// 修改密码页面
app.get('/admin/change-password', requireAuth, (req, res) => {
  res.render('admin/change-password', { message: null, msgType: null });
});

// 处理修改密码
app.post('/admin/change-password', requireAuth, (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  // 校验当前密码
  if (currentPassword !== adminPassword) {
    return res.render('admin/change-password', { message: '当前密码错误', msgType: 'error' });
  }

  // 校验新密码长度
  if (!newPassword || newPassword.length < 4) {
    return res.render('admin/change-password', { message: '新密码至少需要4位', msgType: 'error' });
  }

  // 校验两次输入一致
  if (newPassword !== confirmPassword) {
    return res.render('admin/change-password', { message: '两次输入的新密码不一致', msgType: 'error' });
  }

  // 写入 .env 文件
  const envPath = path.join(__dirname, '.env');
  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf-8');
  }

  // 更新 ADMIN_PASSWORD
  const pwdRegex = /^ADMIN_PASSWORD=.*$/m;
  if (pwdRegex.test(envContent)) {
    envContent = envContent.replace(pwdRegex, `ADMIN_PASSWORD=${newPassword}`);
  } else {
    envContent += `\nADMIN_PASSWORD=${newPassword}\n`;
  }
  fs.writeFileSync(envPath, envContent, 'utf-8');

  // 更新环境变量
  process.env.ADMIN_PASSWORD = newPassword;

  res.render('admin/change-password', { message: '密码修改成功！', msgType: 'success' });
});

// 新增活动页面
app.get('/admin/new', requireAuth, (req, res) => {
  res.render('admin/edit', { activity: null, isNew: true });
});

// 处理新增活动
app.post('/admin/new', requireAuth, (req, res) => {
  const data = loadActivities();
  const now = new Date().toISOString();

  // 判断是否为长期活动（有开始时间但没有结束时间）
  const hasStart = !!req.body.activityStartDate;
  const hasEnd = !!req.body.activityEndDate;
  const isLongTerm = hasStart && !hasEnd;

  const newActivity = {
    id: generateId(),
    name: req.body.name || '',
    activityStartDate: req.body.activityStartDate || '',
    activityEndDate: req.body.activityEndDate || '',
    prizeStartDate: req.body.prizeStartDate || '',
    prizeEndDate: req.body.prizeEndDate || '',
    rules: req.body.rules || '',
    entry: req.body.entry || '',
    prizeMethod: req.body.prizeMethod || '',
    prizes: req.body.prizes || '',
    remark: req.body.remark || '',
    isLongTerm: isLongTerm,
    createdAt: now,
    updatedAt: now
  };

  data.activities.push(newActivity);
  saveActivities(data);

  res.redirect('/admin');
});

// 编辑活动页面
app.get('/admin/edit/:id', requireAuth, (req, res) => {
  const data = loadActivities();
  const activity = data.activities.find(a => a.id === req.params.id);
  if (!activity) {
    return res.status(404).send('活动不存在');
  }
  res.render('admin/edit', { activity: activity, isNew: false });
});

// 处理编辑活动
app.post('/admin/edit/:id', requireAuth, (req, res) => {
  const data = loadActivities();
  const index = data.activities.findIndex(a => a.id === req.params.id);
  if (index === -1) {
    return res.status(404).send('活动不存在');
  }

  const hasStart = !!req.body.activityStartDate;
  const hasEnd = !!req.body.activityEndDate;
  const isLongTerm = hasStart && !hasEnd;

  // 更新字段
  const updated = data.activities[index];
  updated.name = req.body.name || '';
  updated.activityStartDate = req.body.activityStartDate || '';
  updated.activityEndDate = req.body.activityEndDate || '';
  updated.prizeStartDate = req.body.prizeStartDate || '';
  updated.prizeEndDate = req.body.prizeEndDate || '';
  updated.rules = req.body.rules || '';
  updated.entry = req.body.entry || '';
  updated.prizeMethod = req.body.prizeMethod || '';
  updated.prizes = req.body.prizes || '';
  updated.remark = req.body.remark || '';
  updated.isLongTerm = isLongTerm;
  updated.updatedAt = new Date().toISOString();

  data.activities[index] = updated;
  saveActivities(data);

  res.redirect('/admin');
});

// 删除活动
app.post('/admin/delete/:id', requireAuth, (req, res) => {
  const data = loadActivities();
  const index = data.activities.findIndex(a => a.id === req.params.id);
  if (index === -1) {
    return res.status(404).send('活动不存在');
  }

  data.activities.splice(index, 1);
  saveActivities(data);

  res.redirect('/admin');
});

// ==================== 启动服务器 ====================

app.listen(PORT, () => {
  console.log(`✅ 活动看板服务器已启动`);
  console.log(`   前台页面: http://localhost:${PORT}`);
  console.log(`   后台管理: http://localhost:${PORT}/admin`);
});
