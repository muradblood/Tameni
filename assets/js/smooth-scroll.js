import Lenis from 'lenis';

export function startSmoothScroll() {
  const lenis = new Lenis({
    autoRaf: false,
    smoothWheel: true,
    duration: .75,
    anchors: true,
    respectReducedMotion: true,
    prevent: node => Boolean(node.closest?.('[data-lenis-prevent]'))
  });
  let frame = 0;
  let lastActivity = 0;
  let paused = false;
  const tick = time => {
    frame = 0;
    if (paused || document.hidden) return;
    lenis.raf(time);
    if (performance.now() - lastActivity < 1200) frame = requestAnimationFrame(tick);
  };
  const wake = () => {
    if (paused || document.hidden) return;
    lastActivity = performance.now();
    if (!frame) frame = requestAnimationFrame(tick);
  };
  window.addEventListener('wheel', wake, { passive: true });
  lenis.on('scroll', wake);
  return {
    stop() { paused = true; lenis.stop(); cancelAnimationFrame(frame); frame = 0; },
    start() { paused = false; lenis.start(); wake(); },
    scrollToTop() { lenis.scrollTo(0, { immediate: true }); wake(); },
    destroy() { window.removeEventListener('wheel', wake); cancelAnimationFrame(frame); lenis.destroy(); }
  };
}
