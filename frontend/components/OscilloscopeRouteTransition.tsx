'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';

type CollapseState = {
  canvas: HTMLCanvasElement;
  gl: WebGLRenderingContext;
  program: WebGLProgram;
  texture: WebGLTexture;
  raf: number;
  commitFired: boolean;
  doneFired: boolean;
  startedAt: number;
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
  uniform sampler2D uScene;
  uniform float uProgress;
  uniform float uTime;
  uniform float uAspect;

  float easeInOutCubic(float x) {
    return x < 0.5 ? 4.0 * x * x * x : 1.0 - pow(-2.0 * x + 2.0, 3.0) * 0.5;
  }

  void main() {
    float p = easeInOutCubic(clamp(uProgress, 0.0, 1.0));
    vec2 centered = vUv - 0.5;
    float collapse = smoothstep(0.06, 0.72, p);
    float tear = smoothstep(0.42, 1.0, p);
    float wave = sin(vUv.x * 42.0 + uTime * 25.0) * 0.035 * (1.0 - p);
    float osc = sin(vUv.x * 26.0 + uTime * 17.0) * mix(0.006, 0.04, 1.0 - p);

    vec2 sampleUv = vec2(
      centered.x * mix(1.0, 1.22 + tear * 0.35, collapse),
      centered.y * mix(1.0, 0.018, collapse) + wave
    ) + 0.5;

    float rgbShift = 0.004 * (1.0 - p) + 0.014 * tear;
    vec4 sceneR = texture2D(uScene, sampleUv + vec2(rgbShift, 0.0));
    vec4 sceneG = texture2D(uScene, sampleUv);
    vec4 sceneB = texture2D(uScene, sampleUv - vec2(rgbShift, 0.0));
    vec3 scene = vec3(sceneR.r, sceneG.g, sceneB.b);

    float lineDist = abs((vUv.y - 0.5) - osc);
    float razor = exp(-lineDist * mix(34.0, 980.0, collapse));
    float halo = exp(-lineDist * mix(9.0, 70.0, collapse));
    vec3 phosphor = vec3(0.05, 1.0, 0.55) * (razor * 2.2 + halo * 0.45);

    float vignette = smoothstep(0.96, 0.18, length(centered * vec2(uAspect, 1.0)));
    float scan = 0.92 + sin(vUv.y * 980.0 + uTime * 36.0) * 0.035;
    float blackout = smoothstep(0.72, 1.0, p);
    vec3 color = mix(scene, phosphor, collapse) * vignette * scan;
    color += vec3(0.0, 0.9, 0.45) * razor * tear * 1.7;
    color *= 1.0 - blackout * 0.18;

    float alpha = max(1.0 - blackout * 0.08, razor * 0.9);
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

function dispose(state: CollapseState) {
  cancelAnimationFrame(state.raf);
  state.gl.deleteTexture(state.texture);
  state.gl.deleteProgram(state.program);
  state.canvas.remove();
  document.body.classList.remove('osc-routing-active');
}

function runCollapse(snapshot: HTMLCanvasElement, onCommit: () => void, onDone: () => void) {
  const canvas = document.createElement('canvas');
  canvas.className = 'osc-route-canvas';
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

  const texture = gl.createTexture();
  if (!texture) {
    canvas.remove();
    onCommit();
    onDone();
    return null;
  }

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, snapshot);

  const state: CollapseState = {
    canvas,
    gl,
    program,
    texture,
    raf: 0,
    commitFired: false,
    doneFired: false,
    startedAt: performance.now(),
    onCommit,
    onDone
  };

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.max(1, Math.floor(window.innerWidth * dpr));
    canvas.height = Math.max(1, Math.floor(window.innerHeight * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
  };
  resize();

  const aPosition = gl.getAttribLocation(program, 'aPosition');
  const uScene = gl.getUniformLocation(program, 'uScene');
  const uProgress = gl.getUniformLocation(program, 'uProgress');
  const uTime = gl.getUniformLocation(program, 'uTime');
  const uAspect = gl.getUniformLocation(program, 'uAspect');

  const render = (now: number) => {
    const elapsed = now - state.startedAt;
    const progress = Math.min(1, elapsed / 980);

    if (!state.commitFired && progress > 0.48) {
      state.commitFired = true;
      document.body.classList.add('osc-routing-active');
      state.onCommit();
    }

    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(uScene, 0);
    gl.uniform1f(uProgress, progress);
    gl.uniform1f(uTime, elapsed / 1000);
    gl.uniform1f(uAspect, window.innerWidth / Math.max(1, window.innerHeight));
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    if (progress >= 1 && !state.doneFired) {
      state.doneFired = true;
      window.setTimeout(() => {
        dispose(state);
        state.onDone();
      }, 140);
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
  const activeRef = useRef<CollapseState | null>(null);
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
      }, 220);
    }
  }, [pathname]);

  useEffect(() => {
    const onClick = async (event: MouseEvent) => {
      const anchor = isRoutableAnchor(event.target);
      if (!anchor || activeRef.current) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;

      event.preventDefault();
      const href = anchor.href;
      pendingHrefRef.current = href;
      router.prefetch(new URL(href).pathname);

      try {
        const html2canvas = (await import('html2canvas')).default;
        const snapshot = await html2canvas(document.body, {
          backgroundColor: '#090d16',
          scale: Math.min(window.devicePixelRatio || 1, 1.35),
          useCORS: true,
          logging: false,
          ignoreElements: (element) => element.classList.contains('osc-route-canvas')
        });

        activeRef.current = runCollapse(
          snapshot,
          () => router.push(new URL(href).pathname),
          () => {
            activeRef.current = null;
            pendingHrefRef.current = null;
          }
        );
      } catch {
        pendingHrefRef.current = null;
        router.push(new URL(href).pathname);
      }
    };

    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [router]);

  return null;
}
