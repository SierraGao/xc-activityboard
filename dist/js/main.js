// ========================================
// 抖B社群活动公告栏 - 前台交互脚本
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  initSearch();
  initFilters();
  applyInitialFilter();
});

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
