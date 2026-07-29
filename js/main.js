/* ==========================================================================
   Site Scripts
   Shared across every page. Each block below guards on the elements it
   needs, so this single file is safe to include on every page even when
   a given page doesn't contain that feature (e.g. the carousel only runs
   on the pages that have #homeCarousel).
   ========================================================================== */

// Dismiss top informational announcement banner
function hideClwBanner() {
    document.getElementById('clwAlertBanner').style.display = 'none';
}

// Mobile navigation drawer toggle
function toggleMobileNav() {
    const navList = document.getElementById('primaryNavList');
    const toggleBtn = document.getElementById('navToggleBtn');
    const isOpen = navList.classList.toggle('nav-menu-open');
    toggleBtn.setAttribute('aria-expanded', isOpen);
    toggleBtn.textContent = isOpen ? '✕' : '☰';
}

// Back-to-top visibility
function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.addEventListener('scroll', function () {
    const btn = document.getElementById('backToTopBtn');
    if (!btn) return;
    if (window.scrollY > 400) {
        btn.classList.add('visible');
    } else {
        btn.classList.remove('visible');
    }
});

// ===== Home Gallery Carousel =====
(function () {
    const totalSlides = 7;
    let currentIndex = 0;
    let autoplayTimer = null;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const track = document.getElementById('carouselTrack');
    const dotsContainer = document.getElementById('carouselDots');
    const wrapper = document.getElementById('homeCarousel');

    function renderDots() {
        if (!dotsContainer) return;
        dotsContainer.innerHTML = '';
        for (let i = 0; i < totalSlides; i++) {
            const dot = document.createElement('button');
            dot.type = 'button';
            dot.className = 'carousel-dot' + (i === currentIndex ? ' active-dot' : '');
            dot.setAttribute('aria-label', 'Go to slide ' + (i + 1) + ' of ' + totalSlides);
            dot.addEventListener('click', function () { goToSlide(i); });
            dotsContainer.appendChild(dot);
        }
    }

    function updatePosition() {
        if (!track) return;
        track.style.transform = 'translateX(-' + (currentIndex * 100) + '%)';
        renderDots();
    }

    window.carouselMove = function (direction) {
        currentIndex = (currentIndex + direction + totalSlides) % totalSlides;
        updatePosition();
        restartAutoplay();
    };

    function goToSlide(i) {
        currentIndex = i;
        updatePosition();
        restartAutoplay();
    }

    function startAutoplay() {
        if (prefersReducedMotion) return;
        autoplayTimer = setInterval(function () {
            currentIndex = (currentIndex + 1) % totalSlides;
            updatePosition();
        }, 4500);
    }

    function stopAutoplay() {
        if (autoplayTimer) clearInterval(autoplayTimer);
    }

    function restartAutoplay() {
        stopAutoplay();
        startAutoplay();
    }

    if (wrapper && track) {
        // Pause on hover / keyboard focus
        wrapper.addEventListener('mouseenter', stopAutoplay);
        wrapper.addEventListener('mouseleave', startAutoplay);
        wrapper.addEventListener('focusin', stopAutoplay);
        wrapper.addEventListener('focusout', startAutoplay);

        // Keyboard navigation
        wrapper.addEventListener('keydown', function (e) {
            if (e.key === 'ArrowLeft') { window.carouselMove(-1); }
            if (e.key === 'ArrowRight') { window.carouselMove(1); }
        });

        // Touch swipe navigation
        let touchStartX = 0;
        let touchEndX = 0;
        wrapper.addEventListener('touchstart', function (e) {
            touchStartX = e.changedTouches[0].screenX;
            stopAutoplay();
        }, { passive: true });
        wrapper.addEventListener('touchend', function (e) {
            touchEndX = e.changedTouches[0].screenX;
            const delta = touchEndX - touchStartX;
            if (Math.abs(delta) > 40) {
                window.carouselMove(delta < 0 ? 1 : -1);
            } else {
                startAutoplay();
            }
        }, { passive: true });

        renderDots();
        startAutoplay();
    }
})();

// ===== Product Catalog Filter =====
function filterProducts(category, btnEl) {
    const buttons = document.querySelectorAll('#productFilterRow .product-filter-btn');
    buttons.forEach(function (b) { b.classList.remove('filter-active'); });
    btnEl.classList.add('filter-active');

    const cards = document.querySelectorAll('#productCatalogGrid .standard-modular-card');
    cards.forEach(function (card) {
        if (category === 'all' || card.getAttribute('data-category') === category) {
            card.classList.remove('filtered-hidden');
        } else {
            card.classList.add('filtered-hidden');
        }
    });
}

// ===== Scroll Reveal Animations =====
(function () {
    const revealTargets = document.querySelectorAll('.reveal-on-scroll');
    if (!revealTargets.length) return;

    if (!('IntersectionObserver' in window)) {
        revealTargets.forEach(function (el) { el.classList.add('reveal-visible'); });
        return;
    }

    const observer = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('reveal-visible');
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

    revealTargets.forEach(function (el) { observer.observe(el); });

    // Safety net: force-reveal everything after 4s in case an element
    // never intersects (e.g. unusual viewport/zoom edge cases).
    setTimeout(function () {
        revealTargets.forEach(function (el) { el.classList.add('reveal-visible'); });
    }, 4000);
})();

// ===== Animated Metric Counters =====
(function () {
    const counters = document.querySelectorAll('[data-count-to]');
    if (!counters.length) return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function animateCounter(el) {
        const target = parseInt(el.getAttribute('data-count-to'), 10);
        const suffix = el.getAttribute('data-count-suffix') || '';
        const isYear = el.getAttribute('data-count-format') === 'year';

        if (prefersReducedMotion) {
            el.textContent = (target >= 1000 ? target.toLocaleString('en-IN') : target) + suffix;
            return;
        }

        const duration = 1400;
        const startTime = performance.now();

        function step(now) {
            const progress = Math.min((now - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(target * eased);
            el.textContent = (isYear ? current : (current >= 1000 ? current.toLocaleString('en-IN') : current)) + suffix;
            if (progress < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    }

    if (!('IntersectionObserver' in window)) {
        counters.forEach(animateCounter);
        return;
    }

    const counterObserver = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.4 });

    counters.forEach(function (el) { counterObserver.observe(el); });
})();
