/* =============================================================================
   ElektroSys — comportamento da interface.
   Progressive enhancement: todo o conteudo e todos os links funcionam sem JS.
   Este arquivo apenas melhora navegacao, estado e entrada de secoes.
   ============================================================================= */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------------------------------------------------------------------------
     1. Menu movel: aria-expanded, foco preso, Esc fecha e devolve o foco
     --------------------------------------------------------------------------- */
  function initMobileNav() {
    var toggle = document.querySelector('[data-nav-toggle]');
    var panel = document.getElementById('menu-principal');
    if (!toggle || !panel) return;

    var FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

    function isOpen() { return toggle.getAttribute('aria-expanded') === 'true'; }

    function open() {
      toggle.setAttribute('aria-expanded', 'true');
      panel.hidden = false;
      document.body.setAttribute('data-nav-open', 'true');
      var first = panel.querySelector(FOCUSABLE);
      if (first) first.focus();
    }

    function close(returnFocus) {
      toggle.setAttribute('aria-expanded', 'false');
      panel.hidden = true;
      document.body.removeAttribute('data-nav-open');
      if (returnFocus) toggle.focus();
    }

    toggle.addEventListener('click', function () {
      if (isOpen()) close(true); else open();
    });

    // Esc fecha e restaura o foco ao botao
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen()) {
        e.preventDefault();
        close(true);
      }
    });

    // Foco preso enquanto o painel estiver aberto
    panel.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab' || !isOpen()) return;
      var items = Array.prototype.filter.call(
        panel.querySelectorAll(FOCUSABLE),
        function (el) { return el.offsetParent !== null; }
      );
      if (!items.length) return;
      var first = items[0];
      var last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    });

    // Shift+Tab a partir do botao volta para dentro do painel
    toggle.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab' || !e.shiftKey || !isOpen()) return;
      var items = panel.querySelectorAll(FOCUSABLE);
      if (!items.length) return;
      e.preventDefault();
      items[items.length - 1].focus();
    });

    // Navegar por ancora fecha o menu
    panel.addEventListener('click', function (e) {
      var link = e.target.closest('a[href]');
      if (link) close(false);
    });

    // Voltar ao desktop com o menu aberto: restaurar o estado
    var desktop = window.matchMedia('(min-width: 1024px)');
    function syncViewport() { if (desktop.matches && isOpen()) close(false); }
    if (desktop.addEventListener) desktop.addEventListener('change', syncViewport);
    else if (desktop.addListener) desktop.addListener(syncViewport);
  }

  /* ---------------------------------------------------------------------------
     2. Cabecalho: borda inferior apenas apos o inicio da rolagem
     --------------------------------------------------------------------------- */
  function initHeaderState() {
    var header = document.querySelector('.site-header');
    if (!header) return;
    var ticking = false;
    function update() {
      header.setAttribute('data-scrolled', window.scrollY > 8 ? 'true' : 'false');
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  /* ---------------------------------------------------------------------------
     3. Secao ativa na navegacao (apenas indicador visual, nao muda a URL)
     --------------------------------------------------------------------------- */
  function initActiveSection() {
    var links = Array.prototype.slice.call(document.querySelectorAll('.nav__link[href^="#"]'));
    if (!links.length || !('IntersectionObserver' in window)) return;

    var byId = {};
    var targets = [];
    links.forEach(function (link) {
      var id = link.getAttribute('href').slice(1);
      var section = document.getElementById(id);
      if (section) { byId[id] = link; targets.push(section); }
    });
    if (!targets.length) return;

    var visible = {};
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        visible[entry.target.id] = entry.isIntersecting ? entry.intersectionRatio : 0;
      });
      var bestId = null, bestRatio = 0;
      Object.keys(visible).forEach(function (id) {
        if (visible[id] > bestRatio) { bestRatio = visible[id]; bestId = id; }
      });
      links.forEach(function (l) { l.removeAttribute('data-active'); });
      if (bestId && byId[bestId]) byId[bestId].setAttribute('data-active', 'true');
    }, { rootMargin: '-30% 0px -55% 0px', threshold: [0, 0.25, 0.5, 1] });

    targets.forEach(function (t) { observer.observe(t); });
  }

  /* ---------------------------------------------------------------------------
     4. Entrada discreta das secoes (fade + 10px), desligada em reduced motion
     --------------------------------------------------------------------------- */
  function initReveal() {
    var items = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
    if (!items.length) return;

    function showAll() { items.forEach(function (el) { el.classList.add('is-visible'); }); }

    if (reduceMotion.matches || !('IntersectionObserver' in window)) { showAll(); return; }

    var observer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });

    items.forEach(function (el) { observer.observe(el); });

    // Se o usuario ligar "reduzir movimento" durante a visita, revelar tudo
    var onChange = function () { if (reduceMotion.matches) showAll(); };
    if (reduceMotion.addEventListener) reduceMotion.addEventListener('change', onChange);
    else if (reduceMotion.addListener) reduceMotion.addListener(onChange);
  }

  /* ---------------------------------------------------------------------------
     5. Ano do rodape calculado dinamicamente (com fallback no HTML)
     --------------------------------------------------------------------------- */
  function initYear() {
    var nodes = document.querySelectorAll('[data-year]');
    var year = String(new Date().getFullYear());
    Array.prototype.forEach.call(nodes, function (n) { n.textContent = year; });
  }

  /* ---------------------------------------------------------------------------
     Bootstrap
     --------------------------------------------------------------------------- */
  function init() {
    initMobileNav();
    initHeaderState();
    initActiveSection();
    initReveal();
    initYear();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
