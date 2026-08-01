/* ===================================================
   메인 스크립트
   - 다크/라이트 테마 전환 및 저장 (기본: 다크)
   - 프로젝트 행 렌더링 및 분류 필터
   - 좌측 내비 스크롤스파이
   - 마우스 스포트라이트
   - 스크롤 등장 애니메이션 / 관성 스크롤
   =================================================== */

(function () {
  'use strict';

  // 모션을 줄이겠다고 설정한 사용자에게는 애니메이션을 걸지 않습니다.
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 테마 ---------- */

  const root = document.documentElement;
  const STORAGE_KEY = 'theme';

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
  }

  // 이 디자인은 다크가 기본입니다. 저장된 선택이 있으면 그걸 따릅니다.
  applyTheme(localStorage.getItem(STORAGE_KEY) || 'dark');

  const toggle = document.getElementById('themeToggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      localStorage.setItem(STORAGE_KEY, next);
    });
  }

  /* ---------- 마우스 스포트라이트 ---------- */

  // 터치 기기·모션 감소 환경에서는 스포트라이트를 갱신하지 않습니다(기본 위치 고정).
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (finePointer && !reduceMotion) {
    let spotTicking = false;
    let mx = 0, my = 0;

    document.addEventListener('mousemove', function (e) {
      mx = e.clientX;
      my = e.clientY;
      if (spotTicking) return;
      spotTicking = true;
      requestAnimationFrame(function () {
        root.style.setProperty('--mouse-x', mx + 'px');
        root.style.setProperty('--mouse-y', my + 'px');
        spotTicking = false;
      });
    }, { passive: true });
  }

  /* ---------- 스크롤 등장 애니메이션 ---------- */

  // 한 번 나타난 요소는 다시 숨기지 않습니다(되돌아 올라올 때 깜빡이지 않도록).
  const revealObserver = ('IntersectionObserver' in window && !reduceMotion)
    ? new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 })
    : null;

  function observeReveals(scope) {
    const targets = (scope || document).querySelectorAll('[data-reveal]:not(.is-visible)');
    if (!revealObserver) {
      // 관찰자를 쓸 수 없으면 즉시 보이게 합니다.
      targets.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    targets.forEach(function (el) { revealObserver.observe(el); });
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
    return '<div class="thumb-placeholder" aria-hidden="true">' + esc(initial) + '</div>';
  }

  function chipsHTML(tags) {
    if (!Array.isArray(tags) || tags.length === 0) return '';
    return '<ul class="chip-list">' +
      tags.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') +
      '</ul>';
  }

  function linksHTML(links, title) {
    if (!Array.isArray(links) || links.length === 0) return '';
    return '<div class="row-links">' + links.map(function (link) {
      const external = /^https?:\/\//i.test(link.url || '');
      return '<a href="' + esc(link.url) + '"' +
        (external ? ' target="_blank" rel="noopener noreferrer"' : '') +
        ' aria-label="' + esc(title) + ' — ' + esc(link.label) + '">' +
        esc(link.label) + '</a>';
    }).join('') + '</div>';
  }

  // 제목: 첫 번째 링크가 있으면 화살표와 함께 링크로, 없으면 텍스트로.
  function titleHTML(project) {
    const first = Array.isArray(project.links) && project.links[0];
    if (!first) return esc(project.title);
    const external = /^https?:\/\//i.test(first.url || '');
    return '<a class="title-link" href="' + esc(first.url) + '"' +
      (external ? ' target="_blank" rel="noopener noreferrer"' : '') + '>' +
      esc(project.title) +
      '<svg class="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor"' +
      ' stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"' +
      ' aria-hidden="true"><path d="M7 17 17 7M7 7h10v10"/></svg></a>';
  }

  function rowHTML(project, index) {
    const delay = Math.min(index, 5) * 60;
    return '' +
      '<li class="project-row" data-reveal style="--reveal-delay:' + delay + 'ms">' +
        '<div class="row-inner">' +
          '<div class="row-thumb">' + thumbHTML(project) + '</div>' +
          '<div class="row-body">' +
            '<p class="row-category">' + esc(project.category) + '</p>' +
            '<h3 class="row-title">' + titleHTML(project) + '</h3>' +
            '<p class="row-desc">' + esc(project.desc) + '</p>' +
            linksHTML(project.links && project.links.slice(1), project.title) +
            chipsHTML(project.tags) +
          '</div>' +
        '</div>' +
      '</li>';
  }

  function render(category) {
    const list = category === '전체'
      ? projects
      : projects.filter(function (p) { return p.category === category; });

    grid.innerHTML = list.map(rowHTML).join('');
    if (emptyMsg) emptyMsg.hidden = list.length > 0;
    observeReveals(grid);
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

  // 페이지 전체의 등장 대상을 관찰 시작
  observeReveals(document);

  /* ---------- 좌측 내비 스크롤스파이 ---------- */

  const navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-link'));
  const sections = navLinks
    .map(function (link) { return document.querySelector(link.getAttribute('href')); })
    .filter(Boolean);

  function setActive(id) {
    navLinks.forEach(function (link) {
      link.classList.toggle('is-active', link.getAttribute('href') === '#' + id);
    });
  }

  if ('IntersectionObserver' in window && sections.length) {
    // 뷰포트 상단 1/3 지점을 지나는 섹션을 활성으로 표시합니다.
    const spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    }, { rootMargin: '-30% 0px -60% 0px' });

    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------- 푸터 연도 ---------- */

  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- 관성 스크롤 (Lenis) ---------- */

  // CDN 로드에 실패하거나 모션 감소 설정이면 브라우저 기본 스크롤을 씁니다.
  if (typeof Lenis !== 'undefined' && !reduceMotion) {
    const lenis = new Lenis({ duration: 1.05, smoothWheel: true });

    (function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    })(0);

    // 앵커 링크를 Lenis가 처리하도록 넘깁니다.
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        const href = link.getAttribute('href');
        if (!href || href === '#') return;

        const target = document.querySelector(href);
        if (!target) return;

        e.preventDefault();
        lenis.scrollTo(target, { offset: -24 });
      });
    });
  }

})();
