// ========================================
// 静态站点生成脚本
// 从 activities.json 读取数据，生成纯静态 HTML 文件到 dist/
// 用于 GitHub Pages 部署
// 运行：node scripts/generate-static.js
// ========================================

const fs = require('fs');
const path = require('path');

const DIST_DIR = path.join(__dirname, '..', 'dist');
const DATA_FILE = path.join(__dirname, '..', 'data', 'activities.json');

// ==================== 状态计算 ====================

function calcStatus(activity) {
  const now = new Date();

  if (activity.isLongTerm) return '进行中';

  function parseDate(str) {
    if (!str) return null;
    if (str.includes('T')) return new Date(str);
    return new Date(str + 'T00:00:00');
  }

  const startDate = parseDate(activity.activityStartDate);
  const endDate = parseDate(activity.activityEndDate);
  const prizeStart = parseDate(activity.prizeStartDate);
  const prizeEnd = parseDate(activity.prizeEndDate);

  if (startDate && now < startDate) return '待开始';
  if (prizeStart && prizeEnd && now >= prizeStart && now <= prizeEnd) return '可兑奖';
  const lastEndDate = prizeEnd || endDate;
  if (lastEndDate && now > lastEndDate) return '已结束';
  if (startDate && endDate && now >= startDate && now <= endDate) return '进行中';
  return '进行中';
}

// ==================== 工具函数 ====================

function escHtml(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatDateYMD(dateStr) {
  if (!dateStr) return '';
  if (dateStr.includes('T')) {
    const parts = dateStr.split('T');
    return parts[0].replace(/-/g, '.') + ' ' + parts[1];
  }
  return (dateStr || '').replace(/-/g, '.');
}

// ==================== 生成 HTML 片段 ====================

function renderCard(act) {
  const statusName = calcStatus(act);
  let statusClass = '';
  let dataStatus = '';

  if (statusName === '进行中') { statusClass = 'active-tag'; dataStatus = 'active'; }
  else if (statusName === '待开始') { statusClass = 'upcoming-tag'; dataStatus = 'upcoming'; }
  else if (statusName === '可兑奖') { statusClass = 'prize-tag'; dataStatus = 'prize'; }
  else { statusClass = 'ended-tag'; dataStatus = 'ended'; }

  let timeText = '';
  if (act.isLongTerm) {
    timeText = '长期活动';
  } else if (statusName === '待开始') {
    timeText = formatDateYMD(act.activityStartDate) + ' 开始';
  } else if (statusName === '可兑奖') {
    timeText = formatDateYMD(act.prizeEndDate) + ' 截止';
  } else if (statusName === '已结束') {
    const endDate = act.prizeEndDate || act.activityEndDate || '';
    timeText = formatDateYMD(endDate) + ' 截止';
  } else {
    timeText = act.activityEndDate ? formatDateYMD(act.activityEndDate) + ' 截止' : '长期活动';
  }

  return `
        <a href="detail/${act.id}.html" class="activity-card" data-name="${escHtml(act.name)}" data-status="${dataStatus}">
          <div class="card-info">
            <div class="card-name">${escHtml(act.name)}</div>
            <div class="card-time">${escHtml(timeText)}</div>
          </div>
          <span class="status-tag ${statusClass}">${statusName}</span>
        </a>`;
}

function renderDetailContent(act) {
  const statusName = calcStatus(act);
  let statusClass = '';
  if (statusName === '进行中') statusClass = 'active-tag';
  else if (statusName === '待开始') statusClass = 'upcoming-tag';
  else if (statusName === '可兑奖') statusClass = 'prize-tag';
  else statusClass = 'ended-tag';

  let html = '';

  // 1. 标题 + 状态
  html += `
      <div class="detail-section">
        <div class="detail-title">${escHtml(act.name)} <span class="status-tag ${statusClass}" style="margin-left:8px;vertical-align:middle;">${statusName}</span></div>
      </div>`;

  // 2. 活动时间
  if (act.activityStartDate) {
    const endDisplay = act.activityEndDate ? formatDateYMD(act.activityEndDate) : '长期';
    html += `
      <div class="detail-section">
        <div class="detail-item">
          <div class="detail-label">活动时间</div>
          <div class="detail-content">${formatDateYMD(act.activityStartDate)} - ${endDisplay}</div>
        </div>
      </div>`;
  }

  // 3. 活动规则（富文本）
  if (act.rules) {
    html += `
      <div class="detail-section">
        <div class="detail-item">
          <div class="detail-label">活动规则</div>
          <div class="detail-content">${act.rules}</div>
        </div>
      </div>`;
  }

  // 4. 活动入口（富文本）
  if (act.entry) {
    html += `
      <div class="detail-section">
        <div class="detail-item">
          <div class="detail-label">活动入口</div>
          <div class="detail-content">${act.entry}</div>
        </div>
      </div>`;
  }

  // 5. 兑奖时间
  if (act.prizeStartDate || act.prizeEndDate) {
    html += `
      <div class="detail-section">
        <div class="detail-item">
          <div class="detail-label">兑奖时间</div>
          <div class="detail-content">${formatDateYMD(act.prizeStartDate)} - ${formatDateYMD(act.prizeEndDate)}</div>
        </div>
      </div>`;
  }

  // 6. 兑奖方式（富文本）
  if (act.prizeMethod) {
    html += `
      <div class="detail-section">
        <div class="detail-item">
          <div class="detail-label">兑奖方式</div>
          <div class="detail-content">${act.prizeMethod}</div>
        </div>
      </div>`;
  }

  // 7. 活动奖品（富文本）
  if (act.prizes) {
    html += `
      <div class="detail-section">
        <div class="detail-item">
          <div class="detail-label">活动奖品</div>
          <div class="detail-content">${act.prizes}</div>
        </div>
      </div>`;
  }

  // 8. 备注（富文本）
  if (act.remark) {
    html += `
      <div class="detail-section">
        <div class="detail-item">
          <div class="detail-label">备注</div>
          <div class="detail-content">${act.remark}</div>
        </div>
      </div>`;
  }

  return html;
}

// ==================== HTML 模板 ====================

function basePage(title, bodyContent) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escHtml(title)} - 抖B社群活动公告栏</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <div class="container">
    <header class="site-header">
      <h1 class="site-title">抖B社群活动公告栏</h1>
    </header>

    <main>
${bodyContent}
    </main>

    <footer class="site-footer">
      <p>&copy; 2026 抖B社群活动公告栏</p>
    </footer>
  </div>

  <div id="lightbox" class="lightbox-overlay" style="display:none;" onclick="if(event.target===this)this.style.display='none'">
    <button class="lightbox-close" onclick="document.getElementById('lightbox').style.display='none'">&times;</button>
    <img id="lightboxImg" src="" alt="查看原图">
    <div class="lightbox-hint">长按或右键可保存图片</div>
  </div>

  <script>
    document.addEventListener('DOMContentLoaded', function() {
      document.addEventListener('click', function(e) {
        var t = e.target;
        if (t.tagName === 'IMG') {
          var p = t.parentElement, ok = false;
          while (p) { if (p.classList && p.classList.contains('detail-content')) { ok = true; break; } p = p.parentElement; }
          if (ok) { e.preventDefault(); document.getElementById('lightboxImg').src = t.src; document.getElementById('lightbox').style.display = 'flex'; }
        }
      });
    });
  </script>
  <script src="js/main.js"></script>
</body>
</html>`;
}

// ==================== 主程序 ====================

function generate() {
  console.log('🔨 开始生成静态站点...\n');

  // 读取数据
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  const activities = data.activities;

  // 清空并重建 dist 目录
  if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(DIST_DIR, { recursive: true });

  // 复制静态资源
  const publicDir = path.join(__dirname, '..', 'public');
  copyDir(path.join(publicDir, 'css'), path.join(DIST_DIR, 'css'));
  copyDir(path.join(publicDir, 'js'), path.join(DIST_DIR, 'js'));

  // 生成首页
  console.log('📄 生成 index.html ...');
  const cardsHtml = activities.map(renderCard).join('\n');
  const emptyHtml = activities.length === 0 ? '<div style="text-align:center;padding:40px 0;color:#999;"><p>暂无活动</p></div>' : '';
  const indexBody = `
      <input type="text" class="search-box" placeholder="搜索活动名称..." autocomplete="off">
      <div class="filter-bar">
        <button class="filter-tag active" data-status="active">进行中</button>
        <button class="filter-tag" data-status="upcoming">待开始</button>
        <button class="filter-tag" data-status="prize">可兑奖</button>
        <button class="filter-tag" data-status="ended">已结束</button>
        <button class="filter-tag" data-status="all">全部</button>
      </div>
      <div class="activity-list">${cardsHtml}${emptyHtml}</div>
`;
  const indexHtml = basePage('活动列表', indexBody);
  fs.writeFileSync(path.join(DIST_DIR, 'index.html'), indexHtml, 'utf-8');
  console.log(`   ✅ 共 ${activities.length} 个活动卡片`);

  // 生成详情页
  const detailDir = path.join(DIST_DIR, 'detail');
  fs.mkdirSync(detailDir, { recursive: true });

  let detailCount = 0;
  activities.forEach(act => {
    const detailBody = renderDetailContent(act) + `
      <a href="../" class="back-link">← 返回首页</a>`;
    const detailHtml = basePage(act.name, detailBody);
    fs.writeFileSync(path.join(detailDir, `${act.id}.html`), detailHtml, 'utf-8');
    detailCount++;
    console.log(`   📄 detail/${act.id}.html — ${act.name}`);
  });
  console.log(`   ✅ 共生成 ${detailCount} 个详情页`);

  console.log('\n✨ 静态站点生成完成！');
  console.log(`   输出目录: ${DIST_DIR}`);
  console.log(`   本地预览: 用浏览器打开 ${path.join(DIST_DIR, 'index.html')}`);
}

// 复制目录
function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  entries.forEach(entry => {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isFile()) {
      fs.copyFileSync(srcPath, destPath);
      console.log(`   📋 复制 ${path.relative(path.join(__dirname, '..'), destPath)}`);
    } else if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    }
  });
}

// 执行
generate();
