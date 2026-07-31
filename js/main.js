/* ===================================================
   메인 스크립트
   - 다크 모드 전환 및 저장
   - 프로젝트 카드 렌더링 및 분류 필터
   - 스크롤 등장 애니메이션 / 관성 스크롤 / 히어로 패럴랙스
   - 헤더 스크롤 효과 / 푸터 연도
   =================================================== */

(function () {
  'use strict';

  // 모션을 줄이겠다고 설정한 사용자에게는 애니메이션을 걸지 않습니다.
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
    // 한 줄에 3개까지 들어가므로 지연은 3개 주기로 반복시켜
    // 목록이 길어져도 마지막 카드가 늦게 뜨지 않게 합니다.
    const delay = (index % 3) * 90;
    return '' +
      '<article class="card" data-reveal style="--reveal-delay:' + delay + 'ms">' +
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

  /* ---------- 스크롤 반응: 헤더 + 히어로 패럴랙스 ---------- */

  const header = document.querySelector('.site-header');
  const hero   = document.querySelector('.hero');

  let ticking = false;

  function onScrollFrame() {
    const y = window.scrollY;

    if (header) header.classList.toggle('scrolled', y > 8);

    // 히어로가 화면에 남아 있는 동안만 계산합니다.
    if (hero && !reduceMotion) {
      const limit = hero.offsetHeight;
      hero.style.setProperty('--scroll-y', (y < limit ? y : limit) + 'px');
    }

    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(onScrollFrame);
  }, { passive: true });

  onScrollFrame();

  /* ---------- 관성 스크롤 (Lenis) ---------- */

  // CDN 로드에 실패하거나 모션 감소 설정이면 브라우저 기본 스크롤을 씁니다.
  if (typeof Lenis !== 'undefined' && !reduceMotion) {
    const lenis = new Lenis({ duration: 1.05, smoothWheel: true });

    (function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    })(0);

    // 앵커 링크를 Lenis가 처리하도록 넘깁니다(헤더 높이만큼 offset).
    const headerH = header ? header.offsetHeight : 0;

    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        const href = link.getAttribute('href');
        if (!href || href === '#') return;

        const target = document.querySelector(href);
        if (!target) return;

        e.preventDefault();
        lenis.scrollTo(target, { offset: -(headerH + 16) });
      });
    });
  }

  /* ---------- 푸터 연도 ---------- */

  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

})();
