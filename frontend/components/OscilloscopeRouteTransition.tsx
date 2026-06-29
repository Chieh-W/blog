'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';

type DiveState = {
  canvas: HTMLCanvasElement;
  gl: WebGLRenderingContext;
  program: WebGLProgram;
  buffer: WebGLBuffer | null;
  raf: number;
  commitFired: boolean;
  doneFired: boolean;
  startedAt: number;
  target: HTMLElement;
  originalBodyOverflow: string;
  onCommit: () => void;
  onDone: () => void;
};

const VERTEX_SHADER = `
  attribute vec2 aPosition;
  varying vec2 vUv;
  void main() {
    vUv = aPosition * 0.5 + 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision mediump float;
  varying vec2 vUv;
  uniform vec2 uResolution;
  uniform vec2 uCardCenter;
  uniform vec2 uCardSize;
  uniform float uProgress;
  uniform float uTime;

  float easeOutCubic(float x) {
    return 1.0 - pow(1.0 - clamp(x, 0.0, 1.0), 3.0);
  }

  float easeInOut(float x) {
    x = clamp(x, 0.0, 1.0);
    return x * x * (3.0 - 2.0 * x);
  }

  float lineGrid(vec2 uv, vec2 density, float width) {
    vec2 grid = abs(fract(uv * density) - 0.5);
    return 1.0 - smoothstep(width, width + 0.015, min(grid.x, grid.y));
  }

  void main() {
    float p = clamp(uProgress, 0.0, 1.0);
    float lock = easeOutCubic(smoothstep(0.0, 0.27, p));
    float reveal = easeInOut(smoothstep(0.26, 0.58, p));
    float dive = easeInOut(smoothstep(0.56, 1.0, p));

    vec2 pixel = vec2(vUv.x * uResolution.x, (1.0 - vUv.y) * uResolution.y);
    vec2 center = mix(uCardCenter, uResolution * 0.5, dive * 0.88);
    vec2 size = max(vec2(1.0), uCardSize * mix(1.0, 9.5, dive));
    vec2 local = (pixel - center) / size + 0.5;
    vec2 card = local - 0.5;

    float rectDistance = max(abs(card.x), abs(card.y));
    float cardMask = 1.0 - smoothstep(0.50, 0.515, rectDistance);
    float inner = 1.0 - smoothstep(0.42, 0.50, rectDistance);
    float edge = smoothstep(0.515, 0.49, rectDistance) - smoothstep(0.49, 0.45, rectDistance);

    vec2 centeredScreen = vUv - 0.5;
    float lens = smoothstep(0.92, 0.10, length(centeredScreen * vec2(uResolution.x / max(1.0, uResolution.y), 1.0)));
    float dim = mix(0.72, 0.92, lock) * (1.0 - cardMask * 0.42);

    vec3 voidColor = vec3(0.007, 0.024, 0.070);
    vec3 cyan = vec3(0.024, 0.714, 0.832);
    vec3 spark = vec3(0.961, 0.620, 0.043);
    vec3 color = voidColor * dim + cyan * 0.018 * lens;

    float blueprintGrid = lineGrid(local, vec2(12.0, 8.0), 0.018) * cardMask;
    float fineGrid = lineGrid(local + vec2(0.013, 0.021), vec2(32.0, 20.0), 0.006) * cardMask;
    float crossX = 1.0 - smoothstep(0.002, 0.010, abs(local.x - 0.72));
    float crossY = 1.0 - smoothstep(0.002, 0.010, abs(local.y - 0.34));
    float node = 1.0 - smoothstep(0.0, mix(0.055, 0.22, dive), distance(local, vec2(0.72, 0.34)));
    float aperture = smoothstep(0.36, 0.08, abs(rectDistance - 0.5));

    color += cyan * (edge * 1.15 + blueprintGrid * 0.24 + fineGrid * 0.12) * (0.22 + reveal * 1.2);
    color += cyan * (crossX + crossY) * 0.16 * reveal * cardMask;
    color += spark * node * (0.40 + dive * 1.45);
    color += cyan * aperture * reveal * 0.07;

    float bloom = node * dive + edge * reveal * 0.28;
    color += mix(cyan, spark, node) * bloom * 0.50;
    color = mix(color, vec3(0.92, 0.98, 1.0), smoothstep(0.90, 1.0, p) * node * 0.72);

    float alpha = min(1.0, 0.64 + lock * 0.25 + reveal * 0.08 + dive * 0.18);
    gl_FragColor = vec4(color, alpha);
  }
`;

function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('Unable to create shader');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) || 'Unknown shader error';
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext) {
  const vertex = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  const program = gl.createProgram();
  if (!program) throw new Error('Unable to create program');
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) || 'Unknown link error';
    gl.deleteProgram(program);
    throw new Error(message);
  }
  return program;
}

function routeFromHref(href: string) {
  const url = new URL(href, window.location.href);
  return `${url.pathname}${url.search}${url.hash}`;
}

function dispose(state: DiveState) {
  cancelAnimationFrame(state.raf);
  state.gl.deleteBuffer(state.buffer);
  state.gl.deleteProgram(state.program);
  state.canvas.remove();
  state.target.removeAttribute('data-route-focus');
  document.body.classList.remove('optical-routing-active');
  document.body.style.overflow = state.originalBodyOverflow;
}

function runBlueprintDive(target: HTMLElement, onCommit: () => void, onDone: () => void) {
  const canvas = document.createElement('canvas');
  canvas.className = 'blueprint-route-canvas';
  document.body.appendChild(canvas);

  const gl = canvas.getContext('webgl', {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    preserveDrawingBuffer: false,
    powerPreference: 'high-performance'
  });

  if (!gl) {
    canvas.remove();
    onCommit();
    onDone();
    return null;
  }

  const program = createProgram(gl);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

  const rect = target.getBoundingClientRect();
  const targetCenter = {
    x: rect.left + rect.width * 0.5,
    y: rect.top + rect.height * 0.5
  };
  const targetSize = {
    x: Math.max(1, rect.width),
    y: Math.max(1, rect.height)
  };

  const state: DiveState = {
    canvas,
    gl,
    program,
    buffer,
    raf: 0,
    commitFired: false,
    doneFired: false,
    startedAt: performance.now(),
    target,
    originalBodyOverflow: document.body.style.overflow,
    onCommit,
    onDone
  };

  target.setAttribute('data-route-focus', 'true');
  document.body.classList.add('optical-routing-active');
  document.body.style.overflow = 'hidden';

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.max(1, Math.floor(window.innerWidth * dpr));
    canvas.height = Math.max(1, Math.floor(window.innerHeight * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
  };
  resize();

  const aPosition = gl.getAttribLocation(program, 'aPosition');
  const uResolution = gl.getUniformLocation(program, 'uResolution');
  const uCardCenter = gl.getUniformLocation(program, 'uCardCenter');
  const uCardSize = gl.getUniformLocation(program, 'uCardSize');
  const uProgress = gl.getUniformLocation(program, 'uProgress');
  const uTime = gl.getUniformLocation(program, 'uTime');

  const render = (now: number) => {
    const elapsed = now - state.startedAt;
    const progress = Math.min(1, elapsed / 1220);

    if (!state.commitFired && progress > 0.86) {
      state.commitFired = true;
      state.onCommit();
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2f(uResolution, window.innerWidth * dpr, window.innerHeight * dpr);
    gl.uniform2f(uCardCenter, targetCenter.x * dpr, targetCenter.y * dpr);
    gl.uniform2f(uCardSize, targetSize.x * dpr, targetSize.y * dpr);
    gl.uniform1f(uProgress, progress);
    gl.uniform1f(uTime, elapsed / 1000);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    if (progress >= 1 && !state.doneFired) {
      state.doneFired = true;
      window.setTimeout(() => {
        dispose(state);
        state.onDone();
      }, 180);
      return;
    }

    state.raf = requestAnimationFrame(render);
  };

  window.addEventListener('resize', resize, { once: true });
  state.raf = requestAnimationFrame(render);
  return state;
}

function isRoutableAnchor(target: EventTarget | null): HTMLAnchorElement | null {
  if (!(target instanceof Element)) return null;
  const anchor = target.closest<HTMLAnchorElement>('a[data-osc-route="true"]');
  if (!anchor) return null;
  const url = new URL(anchor.href, window.location.href);
  if (url.origin !== window.location.origin) return null;
  if (url.pathname === window.location.pathname) return null;
  return anchor;
}

export function OscilloscopeRouteTransition() {
  const router = useRouter();
  const pathname = usePathname();
  const activeRef = useRef<DiveState | null>(null);
  const pendingHrefRef = useRef<string | null>(null);

  useEffect(() => {
    if (!activeRef.current || !pendingHrefRef.current) return;
    const pendingPath = new URL(pendingHrefRef.current, window.location.href).pathname;
    if (pendingPath === pathname) {
      window.setTimeout(() => {
        const state = activeRef.current;
        if (!state) return;
        state.doneFired = true;
        dispose(state);
        activeRef.current = null;
        pendingHrefRef.current = null;
      }, 260);
    }
  }, [pathname]);

  useEffect(() => {
    const autoObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const card = entry.target as HTMLElement;
        card.toggleAttribute('data-auto-active', entry.isIntersecting && entry.intersectionRatio > 0.62);
      });
    }, { threshold: [0.45, 0.62, 0.82], rootMargin: '-28% 0px -28% 0px' });

    document.querySelectorAll<HTMLElement>('[data-log-card="true"]').forEach((card) => autoObserver.observe(card));

    const onClick = (event: MouseEvent) => {
      const anchor = isRoutableAnchor(event.target);
      if (!anchor || activeRef.current) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;

      event.preventDefault();
      const href = anchor.href;
      const route = routeFromHref(href);
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const isMobile = window.matchMedia('(max-width: 768px)').matches;
      pendingHrefRef.current = href;
      router.prefetch(new URL(href, window.location.href).pathname);

      if (isMobile || reducedMotion) {
        anchor.classList.add('mobile-route-exit');
        window.setTimeout(() => router.push(route), 220);
        return;
      }

      try {
        activeRef.current = runBlueprintDive(
          anchor,
          () => router.push(route),
          () => {
            activeRef.current = null;
            pendingHrefRef.current = null;
          }
        );
      } catch {
        pendingHrefRef.current = null;
        router.push(route);
      }
    };

    document.addEventListener('click', onClick, true);
    return () => {
      autoObserver.disconnect();
      document.removeEventListener('click', onClick, true);
    };
  }, [router]);

  return null;
}
