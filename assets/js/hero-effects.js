// Pinned optional ES modules; failure never hides the static hero or its content.
export async function mountHero(hero, active) {
  const [THREE, { gsap }] = await Promise.all([
    import('https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js'),
    import('https://cdn.jsdelivr.net/npm/gsap@3.13.0/+esm')
  ]);
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;z-index:1;pointer-events:none;opacity:0';
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'low-power' });
  } catch (_) { return { sync() {}, pause() {} }; }
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 20);
  camera.position.z = 5;
  const count = matchMedia('(pointer: coarse)').matches ? 48 : 100;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 9;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 5;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 2;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({ color: 0xe8c76a, size: 0.025, transparent: true, opacity: 0.55, depthWrite: false });
  const points = new THREE.Points(geometry, material);
  scene.add(points);
  let disposed = false, last = 0, elapsed = 0, x = 0, y = 0;
  const resize = () => {
    const { width, height } = hero.getBoundingClientRect();
    if (!width || !height || disposed) return;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  const move = event => {
    if (event.pointerType !== 'mouse') return;
    const rect = hero.getBoundingClientRect();
    x = ((event.clientX - rect.left) / rect.width - 0.5) * 0.12;
    y = ((event.clientY - rect.top) / rect.height - 0.5) * 0.08;
  };
  const draw = time => {
    if (elapsed >= 5) { renderer.setAnimationLoop(null); return; }
    if (time - last < 33) return;
    elapsed += Math.min(time - last, 50) / 1000;
    last = time;
    points.rotation.y += (x - points.rotation.y) * 0.035;
    points.rotation.x += (y - points.rotation.x) * 0.035;
    points.position.y = Math.sin(elapsed * 0.3) * 0.08;
    renderer.render(scene, camera);
  };
  const observer = new ResizeObserver(resize);
  const pause = () => { renderer.setAnimationLoop(null); };
  const sync = () => {
    if (disposed) return;
    if (active()) { resize(); last = performance.now(); if (elapsed < 5) renderer.setAnimationLoop(draw); }
    else pause();
    canvas.style.visibility = active() ? 'visible' : 'hidden';
  };
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    pause();
    gsap.killTweensOf(canvas);
    observer.disconnect();
    hero.removeEventListener('pointermove', move);
    geometry.dispose(); material.dispose(); renderer.dispose(); canvas.remove();
  };
  canvas.addEventListener('webglcontextlost', dispose, { once: true });
  hero.appendChild(canvas);
  observer.observe(hero);
  hero.addEventListener('pointermove', move, { passive: true });
  resize();
  renderer.render(scene, camera);
  gsap.to(canvas, { opacity: 1, duration: 1.2, ease: 'power1.out' });
  sync();
  return { sync, pause };
}
