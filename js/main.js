/* ===================================================
   메인 스크립트
   - 다크 모드 전환 및 저장
   - 프로젝트 카드 렌더링 및 분류 필터
   - 헤더 스크롤 효과 / 푸터 연도
   =================================================== */

(function () {
  'use strict';

  /* ---------- 다크 모드 ---------- */

  const root = document.documentElement;
  const STORAGE_KEY = 'theme';

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
  }

  // 저장된 설정이 있으면 그걸, 없으면 OS 설정을 따릅니다.
  const saved = localStorage.getItem(STORAGE_KEY);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
  applyTheme(saved || (prefersDark.matches ? 'dark' : 'light'));

  // 사용자가 직접 고르기 전까지는 OS 설정 변화를 따라갑니다.
  prefersDark.addEventListener('change', function (e) {
    if (!localStorage.getItem(STORAGE_KEY)) {
      applyTheme(e.matches ? 'dark' : 'light');
    }
  });

  const toggle = document.getElementById('themeToggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      localStorage.setItem(STORAGE_KEY, next);
    });
  }

  /* ---------- 프로젝트 렌더링 ---------- */

  const grid     = document.getElementById('projectGrid');
  const filters  = document.getElementById('filters');
  const emptyMsg = document.getElementById('emptyMsg');
  // projects.js가 const로 선언하므로 window가 아닌 전역 바인딩으로 접근합니다.
  const projects = (typeof PROJECTS !== 'undefined' && Array.isArray(PROJECTS)) ? PROJECTS : [];

  // HTML 특수문자를 이스케이프해 데이터가 마크업으로 해석되지 않게 합니다.
  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function thumbHTML(project) {
    if (project.thumb) {
      return '<img src="' + esc(project.thumb) + '" alt="' + esc(project.title) +
             ' 스크린샷" loading="lazy">';
    }
    // 이미지가 없으면 제목 첫 글자로 대체 썸네일을 만듭니다.
    const initial = (project.title || '?').trim().charAt(0).toUpperCase();
    return '<div class="card-thumb-placeholder" aria-hidden="true">' + esc(initial) + '</div>';
  }

  function tagsHTML(tags) {
    if (!Array.isArray(tags) || tags.length === 0) return '';
    return '<ul class="card-tags">' +
      tags.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') +
      '</ul>';
  }

  function linksHTML(links, title) {
    if (!Array.isArray(links) || links.length === 0) return '';
    return '<div class="card-links">' + links.map(function (link) {
      const external = /^https?:\/\//i.test(link.url || '');
      return '<a class="card-link" href="' + esc(link.url) + '"' +
        (external ? ' target="_blank" rel="noopener noreferrer"' : '') +
        ' aria-label="' + esc(title) + ' — ' + esc(link.label) + '">' +
        esc(link.label) + '</a>';
    }).join('') + '</div>';
  }

  function cardHTML(project, index) {
    return '' +
      '<article class="card" style="animation-delay:' + (index * 45) + 'ms">' +
        '<div class="card-thumb">' + thumbHTML(project) + '</div>' +
        '<div class="card-body">' +
          '<p class="card-category">' + esc(project.category) + '</p>' +
          '<h3 class="card-title">' + esc(project.title) + '</h3>' +
          '<p class="card-desc">' + esc(project.desc) + '</p>' +
          tagsHTML(project.tags) +
          linksHTML(project.links, project.title) +
        '</div>' +
      '</article>';
  }

  function render(category) {
    const list = category === '전체'
      ? projects
      : projects.filter(function (p) { return p.category === category; });

    grid.innerHTML = list.map(cardHTML).join('');
    if (emptyMsg) emptyMsg.hidden = list.length > 0;
  }

  function buildFilters() {
    // 데이터에 실제로 존재하는 분류만 버튼으로 만듭니다.
    const categories = ['전체'].concat(
      projects.reduce(function (acc, p) {
        if (p.category && acc.indexOf(p.category) === -1) acc.push(p.category);
        return acc;
      }, [])
    );

    filters.innerHTML = categories.map(function (c, i) {
      return '<button type="button" class="filter-btn" data-category="' + esc(c) +
             '" aria-pressed="' + (i === 0 ? 'true' : 'false') + '">' + esc(c) + '</button>';
    }).join('');

    filters.addEventListener('click', function (e) {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;

      filters.querySelectorAll('.filter-btn').forEach(function (b) {
        b.setAttribute('aria-pressed', String(b === btn));
      });
      render(btn.dataset.category);
    });
  }

  if (grid && filters) {
    buildFilters();
    render('전체');
  }

  /* ---------- 헤더 스크롤 효과 ---------- */

  const header = document.querySelector('.site-header');
  if (header) {
    const onScroll = function () {
      header.classList.toggle('scrolled', window.scrollY > 8);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- 푸터 연도 ---------- */

  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

})();
