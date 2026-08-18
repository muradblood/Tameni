(() => {
  'use strict';

  const routeMap = {
    home: 'page-home', routes: 'page-routes', 'public-transport': 'page-public-transport',
    'route-riyadh-jeddah': 'page-route-riyadh-jeddah',
    'route-riyadh-dammam': 'page-route-riyadh-dammam',
    'route-jeddah-makkah': 'page-route-jeddah-makkah',
    cities: 'page-cities', 'city-riyadh': 'page-city-riyadh', 'city-jeddah': 'page-city-jeddah',
    'city-makkah': 'page-city-makkah', 'city-madinah': 'page-city-madinah',
    'city-dammam': 'page-city-dammam', 'city-tabuk': 'page-city-tabuk',
    'city-hail': 'page-city-hail', 'city-asir': 'page-city-asir',
    blog: 'page-blog', 'blog-1': 'page-blog-1', 'blog-2': 'page-blog-2', 'blog-3': 'page-blog-3',
    contact: 'page-contact'
  };

  const overlay = document.getElementById('nav-overlay');
  const drawer = document.getElementById('nav-drawer');
  const menuBtn = document.getElementById('menu-btn');
  const closeBtn = document.getElementById('close-nav');

  // تحسين تحميل الصور فقط دون أي تغيير بصري أو في تدفق الصفحات.
  document.querySelectorAll('img').forEach(image => {
    image.decoding = 'async';
    const isCritical = image.classList.contains('hero-image') ||
      image.classList.contains('loading-logo') ||
      Boolean(image.closest('.brand'));
    image.loading = isCritical ? 'eager' : 'lazy';
  });
  const heroImage = document.querySelector('.hero-image');
  if (heroImage) heroImage.fetchPriority = 'high';

  function setNav(open) {
    if (!overlay || !drawer || !menuBtn) return;
    overlay.classList.toggle('show', open);
    drawer.classList.toggle('show', open);
    document.body.classList.toggle('nav-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    drawer.setAttribute('aria-hidden', String(!open));
    if (open) closeBtn?.focus();
  }

  function navigate() {
    const route = (window.location.hash || '#home').slice(1);
    const pageId = routeMap[route] || routeMap.home;
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById(pageId)?.classList.add('active');
    document.querySelectorAll('[data-route-link]').forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === `#${route}`);
    });
    setNav(false);
    window.scrollTo({ top: 0, behavior: 'auto' });
    const heading = document.querySelector(`#${pageId} h1, #${pageId} h2`);
    document.title = heading ? `${heading.textContent.trim()} | النقل الجماعي` : 'النقل الجماعي';
  }

  menuBtn?.addEventListener('click', () => setNav(true));
  closeBtn?.addEventListener('click', () => setNav(false));
  overlay?.addEventListener('click', () => setNav(false));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') setNav(false); });
  window.addEventListener('hashchange', navigate);
  navigate();

  document.querySelectorAll('.faq-toggle').forEach(button => {
    button.addEventListener('click', () => {
      const answer = button.nextElementSibling;
      const isOpen = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', String(!isOpen));
      answer?.classList.toggle('open', !isOpen);
    });
  });

  const observer = 'IntersectionObserver' in window
    ? new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.08 })
    : null;
  document.querySelectorAll('.fade-up').forEach(el => observer ? observer.observe(el) : el.classList.add('visible'));

  const form = document.getElementById('contact-form');
  const success = document.getElementById('contact-success');
  form?.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const payload = {
      name: document.getElementById('contact-name')?.value.trim(),
      email: document.getElementById('contact-email')?.value.trim(),
      message: document.getElementById('contact-message')?.value.trim(),
      createdAt: new Date().toISOString()
    };
    try { localStorage.setItem('transport_last_contact', JSON.stringify(payload)); } catch (_) {}
    form.reset();
    form.hidden = true;
    success?.classList.add('show');
  });

  window.addEventListener('load', () => {
    const loading = document.getElementById('loading-screen');
    if (!loading) return;
    loading.classList.add('is-hidden');
    setTimeout(() => loading.remove(), 500);
  });
})();
