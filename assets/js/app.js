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

  document.querySelectorAll('img').forEach(image => {
    image.decoding = 'async';
    const isCritical = image.classList.contains('hero-image') ||
      image.classList.contains('loading-logo') ||
      Boolean(image.closest('.brand'));
    image.loading = isCritical ? 'eager' : 'lazy';
  });
  const heroImage = document.querySelector('.hero-image');
  if (heroImage) heroImage.fetchPriority = 'high';

  const mobileBookingStyle = document.createElement('style');
  mobileBookingStyle.textContent = `
    .mobile-booking-bar{display:none}
    .testimonial-photo{width:58px;height:58px;border-radius:50%;object-fit:cover;flex:0 0 58px;border:2px solid #fff;box-shadow:0 4px 14px rgba(0,0,0,.12)}
    .testimonial-disclaimer{margin-top:8px;color:#8a8a8a;font-size:.78rem}
    .testimonial-model-badge{display:inline-flex;margin-top:5px;padding:3px 8px;border-radius:999px;background:var(--gold-soft);color:var(--gold-dark);font-size:.72rem;font-weight:800}
    @media (max-width: 768px){
      body{padding-bottom:82px}
      .mobile-booking-bar{position:fixed;right:0;bottom:0;left:0;z-index:79;display:block;padding:10px 16px calc(10px + env(safe-area-inset-bottom));background:rgba(255,255,255,.96);border-top:1px solid rgba(0,0,0,.08);box-shadow:0 -8px 26px rgba(0,0,0,.08);backdrop-filter:blur(12px)}
      .mobile-booking-bar .btn{display:flex;width:100%;min-height:50px}
    }
  `;
  document.head.appendChild(mobileBookingStyle);

  const mobileBookingBar = document.createElement('div');
  mobileBookingBar.className = 'mobile-booking-bar';
  mobileBookingBar.innerHTML = '<a class="btn btn-primary" href="https://sarbussat.online/ar/i.php" target="_blank" rel="noopener noreferrer">حجز رحلات بين المدن ←</a>';
  document.body.appendChild(mobileBookingBar);

  // تحسين شكل قسم آراء العملاء مع صور توضيحية، دون الادعاء بأنها صور أصحاب الشهادات الفعلية.
  const firstTestimonial = document.querySelector('.testimonial');
  const testimonialsGrid = firstTestimonial?.parentElement;
  const testimonialsSection = firstTestimonial?.closest('.section');
  if (testimonialsGrid && testimonialsSection) {
    const heading = testimonialsSection.querySelector('.section-heading');
    if (heading && !heading.querySelector('.testimonial-disclaimer')) {
      const note = document.createElement('p');
      note.className = 'testimonial-disclaimer';
      note.textContent = 'الصور والأسماء والتعليقات أدناه نماذج عرض توضيحية، ويمكن استبدالها بآراء عملاء حقيقية عند توفرها.';
      heading.appendChild(note);
    }

    testimonialsGrid.innerHTML = `
      <div class="card testimonial">
        <div class="testimonial-head">
          <img class="testimonial-photo" src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&h=160&q=80" alt="صورة توضيحية لعميل" loading="lazy" referrerpolicy="no-referrer">
          <div><p class="testimonial-name">أحمد — نموذج عرض</p><p class="testimonial-route">الرياض - جدة</p><div class="stars">★★★★★</div><span class="testimonial-model-badge">صورة توضيحية</span></div>
        </div>
        <p class="testimonial-text">واجهة واضحة وسهلة، والوصول إلى خيارات الرحلات سريع.</p><span class="testimonial-date">تعليق توضيحي</span>
      </div>
      <div class="card testimonial">
        <div class="testimonial-head">
          <img class="testimonial-photo" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&h=160&q=80" alt="صورة توضيحية لعميلة" loading="lazy" referrerpolicy="no-referrer">
          <div><p class="testimonial-name">نورة — نموذج عرض</p><p class="testimonial-route">جدة - مكة</p><div class="stars">★★★★☆</div><span class="testimonial-model-badge">صورة توضيحية</span></div>
        </div>
        <p class="testimonial-text">المعلومات مرتبة بشكل جيد وتعمل الصفحة بسرعة على الهاتف.</p><span class="testimonial-date">تعليق توضيحي</span>
      </div>
      <div class="card testimonial">
        <div class="testimonial-head">
          <img class="testimonial-photo" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&h=160&q=80" alt="صورة توضيحية لعميل" loading="lazy" referrerpolicy="no-referrer">
          <div><p class="testimonial-name">فهد — نموذج عرض</p><p class="testimonial-route">الرياض - الدمام</p><div class="stars">★★★★★</div><span class="testimonial-model-badge">صورة توضيحية</span></div>
        </div>
        <p class="testimonial-text">التنقل بين المدن والرحلات سهل، والتصميم مريح وواضح.</p><span class="testimonial-date">تعليق توضيحي</span>
      </div>`;
  }

  function trackBookingClick(link) {
    const href = link.getAttribute('href') || '';
    const isInternational = href.includes('/bus/ar/index.php');
    const eventName = isInternational ? 'international_booking_click' : 'intercity_booking_click';
    const detail = { event: eventName, booking_url: href, booking_type: isInternational ? 'international' : 'intercity' };
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(detail);
    window.dispatchEvent(new CustomEvent('booking_click', { detail }));
  }

  document.querySelectorAll('a[href^="https://sarbussat.online/"]').forEach(link => {
    const originalText = link.textContent;
    let locked = false;

    link.addEventListener('click', event => {
      if (locked) {
        event.preventDefault();
        return;
      }

      trackBookingClick(link);
      locked = true;
      link.setAttribute('aria-busy', 'true');
      link.textContent = 'جاري تحويلك…';

      window.setTimeout(() => {
        locked = false;
        link.removeAttribute('aria-busy');
        link.textContent = originalText;
      }, 1500);
    });
  });

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
