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
    home: { title: 'حجز رحلات النقل الجماعي في السعودية | دليل الحافلات', description: 'دليل رحلات النقل الجماعي في السعودية: تعرّف على خطوط الحافلات بين المدن والمحطات والمدة والأسعار التقريبية، وانتقل إلى حجز الرحلات الداخلية والدولية.' },
    routes: { title: 'رحلات النقل الجماعي بين المدن | المدة والأسعار', description: 'دليل خطوط الحافلات بين المدن السعودية مع مدة الرحلة والمحطات والأسعار التقريبية لرحلات الرياض وجدة ومكة والدمام قبل الحجز.' },
    'public-transport': { title: 'النقل الجماعي بالحافلات في السعودية | دليل الرحلات', description: 'تعرّف على رحلات النقل الجماعي بالحافلات بين المدن السعودية والمحطات والوجهات وخيارات الحجز الإلكتروني للرحلات الداخلية والدولية.' },
    'route-riyadh-jeddah': { title: 'رحلة الرياض جدة بالحافلة | المدة والسعر والحجز', description: 'دليل رحلة الحافلة من الرياض إلى جدة: المدة التقريبية والسعر ومحطات التوقف ومعلومات مهمة قبل حجز رحلة النقل الجماعي.' },
    'route-riyadh-dammam': { title: 'رحلة الرياض الدمام بالحافلة | المدة والسعر والحجز', description: 'دليل رحلة الحافلة من الرياض إلى الدمام: المسافة والمدة والسعر التقريبي ومحطات التوقف قبل حجز رحلة النقل الجماعي.' },
    'route-jeddah-makkah': { title: 'رحلة جدة مكة بالحافلة | المدة والسعر والحجز', description: 'دليل رحلة الحافلة من جدة إلى مكة المكرمة: المدة والتكرار والسعر التقريبي ومعلومات محطة الانطلاق قبل الحجز.' },
    cities: { title: 'محطات النقل الجماعي في السعودية | دليل المدن', description: 'دليل محطات الحافلات والنقل الجماعي في الرياض وجدة ومكة والمدينة والدمام وتبوك وحائل وعسير والوجهات المتاحة من كل مدينة.' },
    'city-riyadh': { title: 'محطة النقل الجماعي في الرياض | الرحلات والوجهات', description: 'دليل محطة النقل الجماعي في الرياض والرحلات بالحافلة إلى جدة ومكة والمدينة والدمام مع معلومات الحجز والمواعيد.' },
    'city-jeddah': { title: 'محطة النقل الجماعي في جدة | الرحلات والوجهات', description: 'دليل محطة النقل الجماعي في جدة والرحلات بالحافلة إلى مكة والمدينة والرياض والطائف مع معلومات الحجز قبل السفر.' },
    'city-makkah': { title: 'محطات النقل الجماعي في مكة | الرحلات والحجز', description: 'دليل محطات النقل الجماعي في مكة المكرمة ورحلات الحافلات إلى جدة والمدينة والرياض مع إرشادات الحجز للزوار والمعتمرين.' },
    'city-madinah': { title: 'محطة النقل الجماعي في المدينة | الرحلات والوجهات', description: 'دليل محطة النقل الجماعي في المدينة المنورة ورحلات الحافلات إلى مكة وجدة والرياض مع معلومات المواعيد والحجز.' },
    'city-dammam': { title: 'محطة النقل الجماعي في الدمام | الرحلات والوجهات', description: 'دليل محطة النقل الجماعي في الدمام ورحلات الحافلات إلى الرياض والأحساء والجبيل مع معلومات المواعيد والحجز.' },
    'city-tabuk': { title: 'محطة النقل الجماعي في تبوك | الرحلات والوجهات', description: 'دليل محطة النقل الجماعي في تبوك ورحلات الحافلات إلى المدينة المنورة وحائل والجوف مع معلومات الحجز قبل السفر.' },
    'city-hail': { title: 'محطة النقل الجماعي في حائل | الرحلات والوجهات', description: 'دليل محطة النقل الجماعي في حائل ورحلات الحافلات إلى الرياض والقصيم والمدينة وتبوك مع معلومات المواعيد والحجز.' },
    'city-asir': { title: 'محطات النقل الجماعي في عسير | أبها وخميس مشيط', description: 'دليل محطات النقل الجماعي في عسير وأبها وخميس مشيط ورحلات الحافلات إلى الرياض وجدة ونجران ومعلومات الحجز.' },
    blog: { title: 'دليل السفر بالحافلات في السعودية | نصائح ووجهات', description: 'مقالات عملية عن السفر بالحافلات والنقل بين المدن والوجهات السياحية في السعودية مع نصائح التخطيط قبل الرحلة.' },
    'blog-1': { title: 'دليل السفر إلى العلا بالحافلة | التخطيط والزيارة', description: 'دليل التخطيط للسفر إلى العلا: اختيار موعد الزيارة ووسيلة النقل والسكن وأبرز الاستعدادات قبل الانطلاق إلى الوجهة.' },
    'blog-2': { title: 'أفضل الأسواق الشعبية في السعودية | دليل المسافر', description: 'دليل أشهر الأسواق الشعبية والتراثية في مدن السعودية ونصائح اختيار وقت الزيارة والتخطيط للنقل قبل الانطلاق.' },
    'blog-3': { title: 'شواطئ البحر الأحمر في السعودية | دليل السفر', description: 'دليل السفر إلى شواطئ البحر الأحمر في جدة وينبع وأملج مع نصائح اختيار الموسم وترتيب النقل والسكن قبل الرحلة.' },
    contact: { title: 'تواصل معنا | استفسارات رحلات النقل الجماعي', description: 'تواصل معنا للاستفسار عن معلومات رحلات النقل الجماعي والحافلات بين المدن والوجهات المنشورة في الدليل.' }
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
  function navigate(){const route=resolveRoute();const pageId=routeMap[route]||routeMap.home;document.querySelectorAll('.page').forEach(page=>page.classList.remove('active'));document.getElementById(pageId)?.classList.add('active');document.querySelectorAll('[data-route-link]').forEach(link=>{link.classList.toggle('active',link.getAttribute('href')===(routePaths[route]||'/'));});setNav(false);window.scrollTo({top:0,behavior:'auto'});updateRouteSeo(routeMap[route]?route:'home');}
  menuBtn?.addEventListener('click',()=>setNav(true));closeBtn?.addEventListener('click',()=>setNav(false));overlay?.addEventListener('click',()=>setNav(false));document.addEventListener('keydown',event=>{if(event.key==='Escape')setNav(false);});window.addEventListener('hashchange',navigate);window.addEventListener('popstate',navigate);navigate();

  document.querySelectorAll('.faq-toggle').forEach(button=>{button.addEventListener('click',()=>{const answer=button.nextElementSibling;const isOpen=button.getAttribute('aria-expanded')==='true';button.setAttribute('aria-expanded',String(!isOpen));answer?.classList.toggle('open',!isOpen);});});
  const observer='IntersectionObserver'in window?new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target);}});},{threshold:.08}):null;document.querySelectorAll('.fade-up').forEach(el=>observer?observer.observe(el):el.classList.add('visible'));
  const form=document.getElementById('contact-form');const success=document.getElementById('contact-success');form?.addEventListener('submit',event=>{event.preventDefault();if(!form.checkValidity()){form.reportValidity();return;}const payload={name:document.getElementById('contact-name')?.value.trim(),email:document.getElementById('contact-email')?.value.trim(),message:document.getElementById('contact-message')?.value.trim(),createdAt:new Date().toISOString()};try{localStorage.setItem('transport_last_contact',JSON.stringify(payload));}catch(_){}form.reset();form.hidden=true;success?.classList.add('show');});
})();