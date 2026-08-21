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

  const pathRouteMap = {
    '/': 'home', '/routes': 'routes', '/public-transport': 'public-transport',
    '/routes/riyadh-jeddah': 'route-riyadh-jeddah', '/routes/riyadh-dammam': 'route-riyadh-dammam', '/routes/jeddah-makkah': 'route-jeddah-makkah',
    '/cities': 'cities', '/cities/riyadh': 'city-riyadh', '/cities/jeddah': 'city-jeddah', '/cities/makkah': 'city-makkah', '/cities/madinah': 'city-madinah',
    '/cities/dammam': 'city-dammam', '/cities/tabuk': 'city-tabuk', '/cities/hail': 'city-hail', '/cities/asir': 'city-asir',
    '/blog': 'blog', '/blog/alula-guide': 'blog-1', '/blog/popular-markets': 'blog-2', '/blog/red-sea-beaches': 'blog-3', '/contact': 'contact'
  };
  const routePaths = Object.fromEntries(Object.entries(pathRouteMap).map(([path, route]) => [route, path]));

  const routeSeo = {
    home: { title: 'سابتكو حجز | حجز النقل الجماعي ورحلات سابتكو', description: 'حجز تذاكر النقل الجماعي عن طريق النت والوصول إلى رحلات سابتكو وحجز تذكرة النقل الجماعي بين المدن والرحلات الدولية.' },
    routes: { title: 'رحلات سابتكو | مواعيد رحلات النقل الجماعي والأسعار', description: 'تعرف على رحلات النقل الجماعي ومواعيد رحلات النقل الجماعي والأسعار التقريبية للوجهات قبل الانتقال إلى حجز تذكرة سابتكو.' },
    'public-transport': { title: 'النقل الجماعي سابتكو | باصات سابتكو وحجز نقل جماعي', description: 'معلومات عن باصات سابتكو ورحلات النقل الجماعي وخيارات حجز نقل جماعي وحجز النقل الجماعي إلكترونيًا بين المدن.' },
    'route-riyadh-jeddah': { title: 'حجز سابتكو الرياض جدة | رحلة النقل الجماعي', description: 'معلومات رحلة الرياض إلى جدة مع المدة والتوقفات والسعر التقريبي وخيار حجز تذكرة النقل الجماعي والانتقال إلى الحجز.' },
    'route-riyadh-dammam': { title: 'حجز سابتكو الرياض الدمام | رحلة النقل الجماعي', description: 'معلومات رحلة الرياض إلى الدمام مع المدة والتوقفات والسعر التقريبي وخيار حجز تذكرة سابتكو عبر الإنترنت.' },
    'route-jeddah-makkah': { title: 'حجز سابتكو جدة مكة | مواعيد النقل الجماعي', description: 'معلومات رحلة جدة إلى مكة مع المدة والتكرار والسعر التقريبي وخيار حجز النقل الجماعي والانتقال مباشرة إلى الحجز.' },
    cities: { title: 'محطات وباصات سابتكو | رحلات النقل الجماعي في السعودية', description: 'تعرف على محطات وباصات النقل الجماعي في الرياض وجدة ومكة والمدينة والدمام وتبوك وحائل وعسير وخيارات الرحلات.' },
    'city-riyadh': { title: 'محطة الرياض للحافلات | النقل الجماعي', description: 'معلومات عن محطة الرياض وخدمات الرحلات اليومية إلى مدن المملكة.' },
    'city-jeddah': { title: 'محطة جدة للحافلات | النقل الجماعي', description: 'معلومات عن محطة جدة والرحلات إلى مكة والمدينة والرياض والطائف.' },
    'city-makkah': { title: 'محطة مكة المكرمة للحافلات | النقل الجماعي', description: 'معلومات عن محطات مكة المكرمة وخدمات الرحلات للزوار والمعتمرين.' },
    'city-madinah': { title: 'محطة المدينة المنورة للحافلات | النقل الجماعي', description: 'معلومات عن محطة المدينة المنورة والرحلات إلى مكة وجدة والرياض.' },
    'city-dammam': { title: 'محطة الدمام للحافلات | النقل الجماعي', description: 'معلومات عن محطة الدمام وخدمات النقل إلى الرياض والأحساء والجبيل.' },
    'city-tabuk': { title: 'محطة تبوك للحافلات | النقل الجماعي', description: 'معلومات عن محطة تبوك والرحلات إلى المدينة وحائل والجوف.' },
    'city-hail': { title: 'محطة حائل للحافلات | النقل الجماعي', description: 'معلومات عن محطة حائل وخدمات النقل إلى الرياض والقصيم والمدينة وتبوك.' },
    'city-asir': { title: 'محطات عسير وأبها وخميس مشيط | النقل الجماعي', description: 'معلومات عن محطات عسير وأبها وخميس مشيط والرحلات إلى الرياض وجدة ونجران.' },
    blog: { title: 'مدونة السفر والنقل في السعودية | النقل الجماعي', description: 'مقالات ونصائح عن السفر والنقل والوجهات داخل المملكة العربية السعودية.' },
    'blog-1': { title: 'دليل السفر إلى العلا | النقل الجماعي', description: 'دليل مختصر للتخطيط لزيارة العلا والنقل والسكن وأبرز المعلومات قبل السفر.' },
    'blog-2': { title: 'أفضل الأسواق الشعبية في السعودية | النقل الجماعي', description: 'معلومات مختصرة عن الأسواق الشعبية والتراثية في المدن السعودية.' },
    'blog-3': { title: 'شواطئ البحر الأحمر في السعودية | النقل الجماعي', description: 'تعرف على وجهات ساحل البحر الأحمر مثل جدة وينبع وأملج ونصائح التخطيط للسفر.' },
    contact: { title: 'اتصل بنا | النقل الجماعي', description: 'صفحة التواصل والاستفسارات الخاصة بموقع النقل الجماعي.' }
  };

  const overlay = document.getElementById('nav-overlay');
  const drawer = document.getElementById('nav-drawer');
  const menuBtn = document.getElementById('menu-btn');
  const closeBtn = document.getElementById('close-nav');

  document.querySelectorAll('img').forEach(image => {
    image.decoding = 'async';
    const isCritical = image.classList.contains('hero-image') || image.classList.contains('loading-logo') || Boolean(image.closest('.brand'));
    image.loading = isCritical ? 'eager' : 'lazy';
  });
  const heroImage = document.querySelector('.hero-image');
  if (heroImage) heroImage.fetchPriority = 'high';

  const mobileBookingStyle = document.createElement('style');
  mobileBookingStyle.textContent = `
    .mobile-booking-bar{display:none}
    .testimonial-photo{width:58px;height:58px;border-radius:50%;object-fit:cover;flex:0 0 58px;border:2px solid #fff;box-shadow:0 4px 14px rgba(0,0,0,.12)}
    @media (max-width:768px){body{padding-bottom:82px}.mobile-booking-bar{position:fixed;right:0;bottom:0;left:0;z-index:79;display:block;padding:10px 16px calc(10px + env(safe-area-inset-bottom));background:rgba(255,255,255,.96);border-top:1px solid rgba(0,0,0,.08);box-shadow:0 -8px 26px rgba(0,0,0,.08);backdrop-filter:blur(12px)}.mobile-booking-bar .btn{display:flex;width:100%;min-height:50px}}
  `;
  document.head.appendChild(mobileBookingStyle);

  const mobileBookingBar = document.createElement('div');
  mobileBookingBar.className = 'mobile-booking-bar';
  mobileBookingBar.innerHTML = '<a class="btn btn-primary" href="https://sarbussat.online/ar/i.php" target="_blank" rel="noopener noreferrer">حجز رحلات بين المدن ←</a>';
  document.body.appendChild(mobileBookingBar);

  const firstTestimonial = document.querySelector('.testimonial');
  const testimonialsGrid = firstTestimonial?.parentElement;
  if (testimonialsGrid) {
    testimonialsGrid.innerHTML = `
      <div class="card testimonial"><div class="testimonial-head"><img class="testimonial-photo" src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&h=160&q=80" alt="أحمد" loading="lazy" referrerpolicy="no-referrer"><div><p class="testimonial-name">أحمد</p><p class="testimonial-route">الرياض - جدة</p><div class="stars">★★★★★</div></div></div><p class="testimonial-text">كانت الرحلة مريحة والحافلة نظيفة، وانطلقت الرحلة في موعدها. تجربة سفر ممتازة.</p></div>
      <div class="card testimonial"><div class="testimonial-head"><img class="testimonial-photo" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&h=160&q=80" alt="نورة" loading="lazy" referrerpolicy="no-referrer"><div><p class="testimonial-name">نورة</p><p class="testimonial-route">جدة - مكة</p><div class="stars">★★★★☆</div></div></div><p class="testimonial-text">الحجز كان سريعًا وسهلًا، وبعد إتمام الحجز كانت تفاصيل الرحلة واضحة. تجربة موفقة.</p></div>
      <div class="card testimonial"><div class="testimonial-head"><img class="testimonial-photo" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&h=160&q=80" alt="فهد" loading="lazy" referrerpolicy="no-referrer"><div><p class="testimonial-name">فهد</p><p class="testimonial-route">الرياض - الدمام</p><div class="stars">★★★★★</div></div></div><p class="testimonial-text">رحلة مريحة وتعامل جيد، والمقاعد كانت مناسبة للرحلة. سأكرر الحجز مرة أخرى.</p></div>`;
  }

  const campaignParams = ['utm_source','utm_medium','utm_campaign','utm_term','utm_content','gclid','gbraid','wbraid'];
  const landingParams = new URLSearchParams(window.location.search);
  function preserveCampaignParams(link){const rawHref=link.getAttribute('href');if(!rawHref)return;try{const bookingUrl=new URL(rawHref,window.location.href);campaignParams.forEach(key=>{const value=landingParams.get(key);if(value&&!bookingUrl.searchParams.has(key))bookingUrl.searchParams.set(key,value);});link.href=bookingUrl.toString();}catch(_){}}
  function trackBookingClick(link){const href=link.href||link.getAttribute('href')||'';const isInternational=href.includes('/bus/ar/index.php');const eventName=isInternational?'international_booking_click':'intercity_booking_click';const detail={event:eventName,booking_url:href,booking_type:isInternational?'international':'intercity',page_route:resolveRoute()};if(typeof window.gtag==='function'){window.gtag('event',eventName,{booking_url:href,booking_type:detail.booking_type,page_route:detail.page_route,transport_type:'beacon'});}else{window.dataLayer=window.dataLayer||[];window.dataLayer.push({event:eventName,booking_url:href,booking_type:detail.booking_type,page_route:detail.page_route});}window.dispatchEvent(new CustomEvent('booking_click',{detail}));}
  document.querySelectorAll('a[href^="https://sarbussat.online/"]').forEach(link=>{preserveCampaignParams(link);const originalText=link.textContent;let locked=false;link.addEventListener('click',event=>{if(locked){event.preventDefault();return;}trackBookingClick(link);locked=true;link.setAttribute('aria-busy','true');link.textContent='جاري تحويلك…';window.setTimeout(()=>{locked=false;link.removeAttribute('aria-busy');link.textContent=originalText;},1500);});});

  function setNav(open){if(!overlay||!drawer||!menuBtn)return;overlay.classList.toggle('show',open);drawer.classList.toggle('show',open);document.body.classList.toggle('nav-open',open);menuBtn.setAttribute('aria-expanded',String(open));drawer.setAttribute('aria-hidden',String(!open));if(open)closeBtn?.focus();}
  function setMeta(selector,value,attr='content'){const element=document.head.querySelector(selector);if(element&&value)element.setAttribute(attr,value);}
  function updateRouteSeo(route){const seo=routeSeo[route]||routeSeo.home;const base='https://satpcosa.vercel.app';const path=routePaths[route]||'/';const canonical=`${base}${path}`;document.title=seo.title;setMeta('meta[name="description"]',seo.description);setMeta('meta[property="og:title"]',seo.title);setMeta('meta[property="og:description"]',seo.description);setMeta('meta[property="og:url"]',canonical);setMeta('meta[name="twitter:title"]',seo.title);setMeta('meta[name="twitter:description"]',seo.description);setMeta('link[rel="canonical"]',canonical,'href');}
  function resolveRoute(){if(window.location.hash){const hashRoute=window.location.hash.slice(1);if(routeMap[hashRoute])return hashRoute;}const path=window.location.pathname.replace(/\/$/,'')||'/';return pathRouteMap[path]||'home';}
  function navigate(){const route=resolveRoute();const pageId=routeMap[route]||routeMap.home;document.querySelectorAll('.page').forEach(page=>page.classList.remove('active'));document.getElementById(pageId)?.classList.add('active');document.querySelectorAll('[data-route-link]').forEach(link=>{link.classList.toggle('active',link.getAttribute('href')===`#${route}`);});setNav(false);window.scrollTo({top:0,behavior:'auto'});updateRouteSeo(routeMap[route]?route:'home');}
  menuBtn?.addEventListener('click',()=>setNav(true));closeBtn?.addEventListener('click',()=>setNav(false));overlay?.addEventListener('click',()=>setNav(false));document.addEventListener('keydown',event=>{if(event.key==='Escape')setNav(false);});window.addEventListener('hashchange',navigate);window.addEventListener('popstate',navigate);navigate();

  document.querySelectorAll('.faq-toggle').forEach(button=>{button.addEventListener('click',()=>{const answer=button.nextElementSibling;const isOpen=button.getAttribute('aria-expanded')==='true';button.setAttribute('aria-expanded',String(!isOpen));answer?.classList.toggle('open',!isOpen);});});
  const observer='IntersectionObserver'in window?new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target);}});},{threshold:.08}):null;document.querySelectorAll('.fade-up').forEach(el=>observer?observer.observe(el):el.classList.add('visible'));
  const form=document.getElementById('contact-form');const success=document.getElementById('contact-success');form?.addEventListener('submit',event=>{event.preventDefault();if(!form.checkValidity()){form.reportValidity();return;}const payload={name:document.getElementById('contact-name')?.value.trim(),email:document.getElementById('contact-email')?.value.trim(),message:document.getElementById('contact-message')?.value.trim(),createdAt:new Date().toISOString()};try{localStorage.setItem('transport_last_contact',JSON.stringify(payload));}catch(_){}form.reset();form.hidden=true;success?.classList.add('show');});
})();