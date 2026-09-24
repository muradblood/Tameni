import EmblaCarousel from 'embla-carousel';

export function mountRouteCarousel(root) {
  const viewport = root.querySelector('.route-carousel-viewport');
  const slides = [...root.querySelectorAll('.route-grid > .media-card')];
  const previous = root.querySelector('.route-carousel-prev');
  const next = root.querySelector('.route-carousel-next');
  const count = root.querySelector('.route-carousel-count');
  root.classList.add('route-carousel-ready');
  let carousel;
  try {
    carousel = EmblaCarousel(viewport, {
      direction: 'rtl', align: 'start', containScroll: 'trimSnaps', loop: false,
      duration: matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 25
    });
  } catch (error) {
    root.classList.remove('route-carousel-ready');
    throw error;
  }
  slides.forEach((slide, index) => {
    slide.setAttribute('role', 'group');
    slide.setAttribute('aria-roledescription', 'شريحة');
    slide.setAttribute('aria-label', `${index + 1} من ${slides.length}`);
  });
  const update = () => {
    previous.disabled = !carousel.canScrollPrev();
    next.disabled = !carousel.canScrollNext();
    count.textContent = `${carousel.selectedScrollSnap() + 1} / ${carousel.scrollSnapList().length}`;
  };
  const goPrevious = () => carousel.scrollPrev();
  const goNext = () => carousel.scrollNext();
  previous.addEventListener('click', goPrevious);
  next.addEventListener('click', goNext);
  carousel.on('select', update).on('reInit', update);
  update();
  return {
    destroy() {
      previous.removeEventListener('click', goPrevious);
      next.removeEventListener('click', goNext);
      carousel.destroy();
      root.classList.remove('route-carousel-ready');
      slides.forEach(slide => {
        slide.removeAttribute('role');
        slide.removeAttribute('aria-roledescription');
        slide.removeAttribute('aria-label');
      });
    }
  };
}
