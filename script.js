/* Portfolio interactions: theme switcher, scroll progress, scroll reveal,
   count-up numbers, and a pointer-following spotlight on the work cards. */
(function () {
    'use strict';

    var root = document.documentElement;
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---------- Theme switcher ---------- */

    var THEMES = ['indigo', 'midnight', 'forest', 'sunset', 'aurora'];
    var swatches = document.querySelectorAll('[data-set-theme]');

    function markActive(theme) {
        swatches.forEach(function (btn) {
            btn.setAttribute('aria-pressed', btn.getAttribute('data-set-theme') === theme ? 'true' : 'false');
        });
    }

    function applyTheme(theme, animate) {
        if (THEMES.indexOf(theme) < 0) { return; }
        if (animate && !reduceMotion) {
            root.classList.add('theme-anim');
            window.setTimeout(function () { root.classList.remove('theme-anim'); }, 600);
        }
        root.setAttribute('data-theme', theme);
        markActive(theme);
        try { localStorage.setItem('cbv-theme', theme); } catch (e) { /* storage unavailable */ }
    }

    markActive(root.getAttribute('data-theme') || 'indigo');

    swatches.forEach(function (btn) {
        btn.addEventListener('click', function () {
            applyTheme(btn.getAttribute('data-set-theme'), true);
        });
    });

    /* ---------- Scroll progress bar ---------- */

    var bar = document.querySelector('.scroll-progress');
    var ticking = false;

    function updateProgress() {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        var p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
        if (bar) { bar.style.setProperty('--p', p.toFixed(4)); }
        ticking = false;
    }

    window.addEventListener('scroll', function () {
        if (!ticking) {
            ticking = true;
            window.requestAnimationFrame(updateProgress);
        }
    }, { passive: true });
    updateProgress();

    /* ---------- Count-up numbers ---------- */

    function countUp(el) {
        var target = parseFloat(el.getAttribute('data-count'));
        var suffix = el.getAttribute('data-suffix') || '';
        if (isNaN(target)) { return; }
        if (reduceMotion) { el.textContent = target + suffix; return; }
        var duration = 1100;
        var start = null;
        function step(ts) {
            if (start === null) { start = ts; }
            var t = Math.min(1, (ts - start) / duration);
            var eased = 1 - Math.pow(1 - t, 3);
            el.textContent = Math.round(target * eased) + suffix;
            if (t < 1) { window.requestAnimationFrame(step); }
        }
        el.textContent = '0' + suffix;
        window.requestAnimationFrame(step);
    }

    /* ---------- Scroll reveal ---------- */

    var revealEls = document.querySelectorAll('.reveal');

    // Stagger siblings that share a parent marked data-stagger.
    document.querySelectorAll('[data-stagger]').forEach(function (parent) {
        var i = 0;
        parent.querySelectorAll(':scope > .reveal').forEach(function (child) {
            child.style.setProperty('--d', String(Math.min(i, 6)));
            i += 1;
        });
    });

    function settle(el) {
        // Hand control back to the element's own hover transitions.
        el.style.removeProperty('--d');
        el.classList.remove('reveal', 'reveal-left', 'reveal-zoom');
        // Section titles keep "in" so their underline stays drawn.
        if (!el.classList.contains('section-title')) { el.classList.remove('in'); }
    }

    function show(el) {
        el.classList.add('in');
        el.querySelectorAll('[data-count]').forEach(countUp);
        if (el.hasAttribute('data-count')) { countUp(el); }
        var delay = parseFloat(getComputedStyle(el).transitionDelay) || 0;
        window.setTimeout(function () { settle(el); }, 1000 + delay * 1000);
    }

    if (reduceMotion || !('IntersectionObserver' in window)) {
        revealEls.forEach(function (el) {
            el.classList.add('in');
            el.querySelectorAll('[data-count]').forEach(countUp);
        });
    } else {
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    show(entry.target);
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

        revealEls.forEach(function (el) { io.observe(el); });
    }

    /* ---------- Spotlight that follows the pointer on work cards ---------- */

    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches && !reduceMotion) {
        document.querySelectorAll('[data-spot]').forEach(function (card) {
            card.addEventListener('pointermove', function (e) {
                var r = card.getBoundingClientRect();
                card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
                card.style.setProperty('--my', (e.clientY - r.top) + 'px');
            });
        });
    }
})();
