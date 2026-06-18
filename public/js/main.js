// ========================================
// 抖B社群活动公告栏 - 前台交互脚本
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  initCalcStatus();
  initSearch();
  initFilters();
  applyInitialFilter();
});

// ==================== 前端状态计算 ====================
// 每次页面加载时，用浏览器当前时间重算活动状态
// 这样公网静态页面也能随时间自动切换状态

function calcStatus(startStr, endStr, prizeStartStr, prizeEndStr, isLongTerm) {
  var now = new Date();

  if (isLongTerm) return '进行中';

  function parseDate(str) {
    if (!str) return null;
    if (str.indexOf('T') >= 0) return new Date(str);
    return new Date(str + 'T00:00:00');
  }

  var startDate = parseDate(startStr);
  var endDate = parseDate(endStr);
  var prizeStart = parseDate(prizeStartStr);
  var prizeEnd = parseDate(prizeEndStr);

  if (startDate && now < startDate) return '待开始';
  if (prizeStart && prizeEnd && now >= prizeStart && now <= prizeEnd) return '可兑奖';
  var lastEndDate = prizeEnd || endDate;
  if (lastEndDate && now > lastEndDate) return '已结束';
  if (startDate && endDate && now >= startDate && now <= endDate) return '进行中';
  return '进行中';
}

function formatTime(act) {
  var status = act._status || '进行中';
  if (act.isLongTerm) return '长期活动';
  if (status === '待开始') return (act.activityStartDate || '').replace(/T/, ' ').replace(/-/g, '.') + ' 开始';
  if (status === '可兑奖') return (act.prizeEndDate || '').replace(/T/, ' ').replace(/-/g, '.') + ' 截止';
  if (status === '已结束') {
    var d = act.prizeEndDate || act.activityEndDate || '';
    return d.replace(/T/, ' ').replace(/-/g, '.') + ' 截止';
  }
  // 进行中
  if (act.activityEndDate) return act.activityEndDate.replace(/T/, ' ').replace(/-/g, '.') + ' 截止';
  return '长期活动';
}

function initCalcStatus() {
  var statusMap = { '进行中': ['active-tag', 'active'], '待开始': ['upcoming-tag', 'upcoming'], '可兑奖': ['prize-tag', 'prize'], '已结束': ['ended-tag', 'ended'] };

  // —— 首页活动卡片 ——
  document.querySelectorAll('.activity-card').forEach(function(card) {
    var act = {
      activityStartDate: card.dataset.start || '',
      activityEndDate:   card.dataset.end || '',
      prizeStartDate:    card.dataset.prizeStart || '',
      prizeEndDate:      card.dataset.prizeEnd || '',
      isLongTerm:        card.dataset.longterm === '1'
    };
    act._status = calcStatus(act.activityStartDate, act.activityEndDate, act.prizeStartDate, act.prizeEndDate, act.isLongTerm);
    card.dataset.status = statusMap[act._status][1];

    // 更新状态标签
    var tag = card.querySelector('.status-tag');
    if (tag) {
      tag.textContent = act._status;
      tag.className = 'status-tag ' + statusMap[act._status][0];
    }
    // 更新时间文字
    var timeEl = card.querySelector('.card-time');
    if (timeEl) timeEl.textContent = formatTime(act);
  });

  // —— 详情页 ——
  var detailTag = document.querySelector('.detail-title .status-tag');
  if (detailTag) {
    var act2 = {
      activityStartDate: detailTag.dataset.start || '',
      activityEndDate:   detailTag.dataset.end || '',
      prizeStartDate:    detailTag.dataset.prizeStart || '',
      prizeEndDate:      detailTag.dataset.prizeEnd || '',
      isLongTerm:        detailTag.dataset.longterm === '1'
    };
    act2._status = calcStatus(act2.activityStartDate, act2.activityEndDate, act2.prizeStartDate, act2.prizeEndDate, act2.isLongTerm);
    detailTag.textContent = act2._status;
    detailTag.className = 'status-tag ' + statusMap[act2._status][0];
  }
}

// 当前搜索关键词和筛选状态
let currentKeyword = '';
let currentFilter = 'active'; // 默认显示"进行中"

// 刷新卡片显示（同时应用搜索+筛选）
function refreshCards() {
  const cards = document.querySelectorAll('.activity-card');

  cards.forEach(card => {
    const name = card.dataset.name || '';
    const status = card.dataset.status || '';

    const matchSearch = !currentKeyword || name.toLowerCase().includes(currentKeyword);
    const matchFilter = currentFilter === 'all' || status === currentFilter;

    card.style.display = (matchSearch && matchFilter) ? '' : 'none';
  });
}

// 搜索功能
function initSearch() {
  const searchInput = document.querySelector('.search-box');
  if (!searchInput) return;

  searchInput.addEventListener('input', function () {
    currentKeyword = this.value.trim().toLowerCase();
    refreshCards();
  });
}

// 状态筛选功能
function initFilters() {
  const filterBar = document.querySelector('.filter-bar');
  if (!filterBar) return;

  const tags = filterBar.querySelectorAll('.filter-tag');

  tags.forEach(tag => {
    tag.addEventListener('click', function () {
      // 切换激活状态
      tags.forEach(t => t.classList.remove('active'));
      this.classList.add('active');

      currentFilter = this.dataset.status;
      refreshCards();
    });
  });
}

// 页面加载时应用默认筛选（进行中）
function applyInitialFilter() {
  refreshCards();
}
