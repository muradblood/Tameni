import { Scene, PerspectiveCamera, WebGLRenderer, BufferGeometry, Float32BufferAttribute, Points, PointsMaterial, LineSegments, LineBasicMaterial, Group, AdditiveBlending } from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function mountJourney(container) {
  const canvas = document.createElement('canvas');
  canvas.className = 'journey-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  let renderer;
  try { renderer = new WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'low-power' }); }
  catch (_) { return { sync() {} }; }

  const scene = new Scene();
  const camera = new PerspectiveCamera(42, 1, .1, 30);
  camera.position.z = 7;
  const group = new Group();
  scene.add(group);
  const dots = [], links = [];
  const rings = 12, columns = 24;
  for (let row = 1; row < rings; row++) {
    const phi = Math.PI * row / rings;
    for (let col = 0; col < columns; col++) {
      const theta = Math.PI * 2 * col / columns;
      const point = [2.05 * Math.sin(phi) * Math.cos(theta), 2.05 * Math.cos(phi), 2.05 * Math.sin(phi) * Math.sin(theta)];
      dots.push(...point);
      if (col % 2 === 0) {
        const next = Math.PI * 2 * (col + 1) / columns;
        links.push(...point, 2.05 * Math.sin(phi) * Math.cos(next), point[1], 2.05 * Math.sin(phi) * Math.sin(next));
      }
      if (row < rings - 1 && col % 3 === 0) {
        const below = Math.PI * (row + 1) / rings;
        links.push(...point, 2.05 * Math.sin(below) * Math.cos(theta), 2.05 * Math.cos(below), 2.05 * Math.sin(below) * Math.sin(theta));
      }
    }
  }
  const dotGeometry = new BufferGeometry();
  dotGeometry.setAttribute('position', new Float32BufferAttribute(dots, 3));
  const lineGeometry = new BufferGeometry();
  lineGeometry.setAttribute('position', new Float32BufferAttribute(links, 3));
  const dotMaterial = new PointsMaterial({ color: 0xffd978, size: .055, transparent: true, opacity: .9, depthWrite: false, blending: AdditiveBlending });
  const lineMaterial = new LineBasicMaterial({ color: 0xe3b94d, transparent: true, opacity: .27, depthWrite: false });
  group.add(new LineSegments(lineGeometry, lineMaterial), new Points(dotGeometry, dotMaterial));
  let running = false, frame = 0, last = 0, targetX = 0, targetY = 0;
  const resize = () => {
    const { width, height } = container.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.position.z = width < 600 ? 9 : 7;
    camera.updateProjectionMatrix();
    if (!running) renderer.render(scene, camera);
  };
  const draw = time => {
    if (!running) return;
    frame = requestAnimationFrame(draw);
    if (time - last < 33) return;
    last = time;
    group.rotation.y += .003 + (targetX - group.rotation.y) * .02;
    group.rotation.x += (targetY - group.rotation.x) * .02;
    renderer.render(scene, camera);
  };
  const sync = active => {
    if (active && !running) { running = true; last = 0; frame = requestAnimationFrame(draw); }
    else if (!active && running) { running = false; cancelAnimationFrame(frame); }
  };
  const pointer = event => {
    if (event.pointerType !== 'mouse') return;
    const bounds = container.getBoundingClientRect();
    targetX = ((event.clientX - bounds.left) / bounds.width - .5) * .45;
    targetY = ((event.clientY - bounds.top) / bounds.height - .5) * .25;
  };
  container.addEventListener('pointermove', pointer, { passive: true });
  container.appendChild(canvas);
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  resize();
  gsap.to(canvas, { opacity: 1, duration: .7, ease: 'power2.out' });

  // ScrollTrigger is registered only inside this lazy chunk, after the section is near view.
  gsap.registerPlugin(ScrollTrigger);
  const steps = container.parentElement.querySelectorAll('.journey-step');
  const triggers = [];
  if (matchMedia('(prefers-reduced-motion: no-preference)').matches) {
    steps.forEach((step, index) => {
      gsap.set(step, { opacity: .7, y: 12 });
      const tween = gsap.to(step, {
        opacity: 1, y: 0, duration: .55, delay: index * .07, ease: 'power2.out',
        scrollTrigger: { trigger: step, start: 'top 90%', once: true }
      });
      triggers.push(tween);
    });
  }
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    sync(false);
    resizeObserver.disconnect();
    triggers.forEach(tween => { tween.scrollTrigger?.kill(); tween.kill(); });
    dotGeometry.dispose(); lineGeometry.dispose(); dotMaterial.dispose(); lineMaterial.dispose(); renderer.dispose();
    canvas.remove();
    container.classList.remove('journey-ready');
  }, { once: true });
  container.classList.add('journey-ready');
  return { sync };
}
